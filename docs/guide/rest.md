# RESTful

## 服务注册与发现

Go-doudou支持两种服务注册与发现机制：`memberlist`和`nacos`
- `memberlist`: 基于[SWIM gossip protocol](https://www.cs.cornell.edu/projects/Quicksilver/public_pdfs/SWIM.pdf)，去中心化，点对点架构，无须leader选举，从[hashicorp/memberlist](https://github.com/hashicorp/memberlist)库fork出来并做了一些修改
- [`nacos`](https://github.com/alibaba/nacos): 中心化的，leader-follower架构，出自阿里巴巴

::: tip
`memberlist`和`nacos`两种机制可以在一个服务中同时使用

```shell
GDD_SERVICE_DISCOVERY_MODE=memberlist,nacos
```
:::

### Memberlist

首先，给`main`函数加入如下代码

```go
err := registry.NewNode()
if err != nil {
    logrus.Panic(fmt.Sprintf("%+v", err))
}
defer registry.Shutdown()
```  

其次，配置如下环境变量

- `GDD_SERVICE_NAME`: 服务名称，必须
- `GDD_MEM_SEED`: 种子节点连接地址，多个地址用英文逗号隔开
- `GDD_MEM_PORT`: 监听端口，默认监听`7946`端口
- `GDD_MEM_HOST`: 对外发布的连接地址，默认是私有IP
- `GDD_SERVICE_DISCOVERY_MODE`: 可以不用配置，默认值就是`memberlist`

```shell
GDD_SERVICE_NAME=test-svc # Required
GDD_MEM_SEED=localhost:7946  # Required
GDD_MEM_PORT=56199 # Optional
GDD_MEM_HOST=localhost # Optional
GDD_SERVICE_DISCOVERY_MODE=memberlist # Optional
```

### Nacos

Go-doudou内建支持使用阿里开发的Nacos作为注册中心，实现服务注册与发现。

首先，给`main`函数加入如下代码

```go
err := registry.NewNode()
if err != nil {
    logrus.Panic(fmt.Sprintf("%+v", err))
}
defer registry.Shutdown()
```  

没错，跟`memberlist`机制所需添加的代码完全相同。

其次，配置如下环境变量

- `GDD_SERVICE_NAME`: 服务名称，必须
- `GDD_NACOS_SERVER_ADDR`: Nacos服务端地址
- `GDD_SERVICE_DISCOVERY_MODE`: 服务发现机制名称

```shell
GDD_SERVICE_NAME=test-svc # Required
GDD_NACOS_SERVER_ADDR=http://localhost:8848/nacos # Required
GDD_SERVICE_DISCOVERY_MODE=nacos # Required
```

## 客户端负载均衡

### 简单轮询负载均衡 (memberlist用)

```go
func main() {
	conf := config.LoadFromEnv()

	var segClient *segclient.WordcloudSegClient

	if os.Getenv("GDD_MODE") == "micro" {
		err := registry.NewNode()
		if err != nil {
			logrus.Panicln(fmt.Sprintf("%+v", err))
		}
		defer registry.Shutdown()
		provider := ddhttp.NewMemberlistServiceProvider("wordcloud-segsvc")
		segClient = segclient.NewWordcloudSegClient(ddhttp.WithProvider(provider))
	} else {
		segClient = segclient.NewWordcloudSegClient()
	}

	segClientProxy := segclient.NewWordcloudSegClientProxy(segClient)

	...

	svc := service.NewWordcloudMaker(conf, segClientProxy, minioClient, browser)

	...
}
```

### 平滑加权轮询负载均衡 (memberlist用)

如果环境变量`GDD_WEIGHT`和`GDD_MEM_WEIGHT`都没有设置，默认权重是1。如果设置权重为0， 且`GDD_MEM_WEIGHT_INTERVAL`环境变量大于`0s`，则开启权重自适应计算功能，即每隔`GDD_MEM_WEIGHT_INTERVAL`设置的间隔时间根据节点的健康值和CPU空闲比例计算权重，并发送给其他节点。

```go
func main() {
	conf := config.LoadFromEnv()

	var segClient *segclient.WordcloudSegClient

	if os.Getenv("GDD_MODE") == "micro" {
		err := registry.NewNode()
		if err != nil {
			logrus.Panicln(fmt.Sprintf("%+v", err))
		}
		defer registry.Shutdown()
		provider := ddhttp.NewSmoothWeightedRoundRobinProvider("wordcloud-segsvc")
		segClient = segclient.NewWordcloudSegClient(ddhttp.WithProvider(provider))
	} else {
		segClient = segclient.NewWordcloudSegClient()
	}

	segClientProxy := segclient.NewWordcloudSegClientProxy(segClient)

	...

	svc := service.NewWordcloudMaker(conf, segClientProxy, minioClient, browser)

	...
}
```

### 简单轮询负载均衡 (nacos用)

```go
func main() {
	conf := config.LoadFromEnv()

	err := registry.NewNode()
	if err != nil {
		logrus.Panic(fmt.Sprintf("%+v", err))
	}
	defer registry.Shutdown()

	svc := service.NewStatsvc(conf,
		nacosservicej.NewEcho(
			ddhttp.WithRootPath("/nacos-service-j"),
			ddhttp.WithProvider(ddhttp.NewNacosRRServiceProvider("nacos-service-j"))),
	)
	handler := httpsrv.NewStatsvcHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 加权轮询负载均衡 (nacos用)

```go
func main() {
	conf := config.LoadFromEnv()

	err := registry.NewNode()
	if err != nil {
		logrus.Panic(fmt.Sprintf("%+v", err))
	}
	defer registry.Shutdown()

	svc := service.NewStatsvc(conf,
		nacosservicej.NewEcho(
			ddhttp.WithRootPath("/nacos-service-j"),
			ddhttp.WithProvider(ddhttp.NewNacosWRRServiceProvider("nacos-service-j"))),
	)
	handler := httpsrv.NewStatsvcHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

## 限流
### 用法

Go-doudou内置了基于[golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate)实现的令牌桶算法的内存限流器。

在`github.com/unionj-cloud/go-doudou/framework/ratelimit/memrate`包里有一个`MemoryStore`结构体，存储了key和`Limiter`实例对。`Limiter`实例是限流器实例，key是该限流器实例的键。

你可以往`memrate.NewLimiter`工厂函数传入一个可选函数`memrate.WithTimer`，设置当key空闲时间超过`timeout`以后的回调函数，比如可以从`MemoryStore`实例里将该key删除，以释放内存资源。

Go-doudou还提供了基于 [go-redis/redis_rate](https://github.com/go-redis/redis_rate) 库封装的GCRA限流算法的redis限流器。该限流器支持跨实例的全局限流。

### 内存限流器示例

内存限流器基于本机内存，只支持本机限流。

```go
func main() {
	...

	handler := httpsrv.NewUsersvcHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()

	store := memrate.NewMemoryStore(func(_ context.Context, store *memrate.MemoryStore, key string) ratelimit.Limiter {
		return memrate.NewLimiter(10, 30, memrate.WithTimer(10*time.Second, func() {
			store.DeleteKey(key)
		}))
	})

	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

**注意：** 你需要自己实现http middleware。下面是一个例子。

```go
// RateLimit limits rate based on memrate.MemoryStore
func RateLimit(store *memrate.MemoryStore) func(inner http.Handler) http.Handler {
	return func(inner http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := r.RemoteAddr[:strings.LastIndex(r.RemoteAddr, ":")]
			limiter := store.GetLimiter(key)
			if !limiter.Allow() {
				http.Error(w, "too many requests", http.StatusTooManyRequests)
				return
			}
			inner.ServeHTTP(w, r)
		})
	}
}
```

### Redis限流器示例

Redis限流器可以用于需要多个实例同时对一个key限流的场景。

```go
func main() {
	...

	svc := service.NewWordcloudBff(conf, minioClient, makerClientProxy, taskClientProxy, userClientProxy)
	handler := httpsrv.NewWordcloudBffHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	srv.AddMiddleware(httpsrv.Auth(userClientProxy))

	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:6379", conf.RedisConf.Host),
	})

	fn := redisrate.LimitFn(func(ctx context.Context) ratelimit.Limit {
		return ratelimit.PerSecondBurst(conf.ConConf.RatelimitRate, conf.ConConf.RatelimitBurst)
	})

	srv.AddMiddleware(httpsrv.RedisRateLimit(rdb, fn))

	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

**注意：** 你需要自己实现http middleware。下面是一个例子。

```go
// RedisRateLimit limits rate based on redisrate.GcraLimiter
func RedisRateLimit(rdb redisrate.Rediser, fn redisrate.LimitFn) func(inner http.Handler) http.Handler {
	return func(inner http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userId, _ := service.UserIdFromContext(r.Context())
			limiter := redisrate.NewGcraLimiterLimitFn(rdb, strconv.Itoa(userId), fn)
			if !limiter.Allow() {
				http.Error(w, "too many requests", http.StatusTooManyRequests)
				return
			}
			inner.ServeHTTP(w, r)
		})
	}
}
```

## 隔仓
### 用法

Go-doudou在`github.com/unionj-cloud/go-doudou/framework/http`包中内置了基于 [github.com/slok/goresilience](https://github.com/slok/goresilience) 封装的开箱即用的隔仓功能。

```go
http.BulkHead(3, 10*time.Millisecond)
```

上面的示例代码中，第一个参数`3`表示用于处理http请求的goroutine池中的worker数量，第二个参数`10*time.Millisecond`表示一个http请求进来以后等待被处理的最长等待时间，如果超时，即直接返回`429`状态码。

### 示例

```go
func main() {
	...

	svc := service.NewWordcloudBff(conf, minioClient, makerClientProxy, taskClientProxy, userClientProxy)
	handler := httpsrv.NewWordcloudBffHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	srv.AddMiddleware(httpsrv.Auth(userClientProxy))

	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:6379", conf.RedisConf.Host),
	})

	fn := redisrate.LimitFn(func(ctx context.Context) ratelimit.Limit {
		return ratelimit.PerSecondBurst(conf.ConConf.RatelimitRate, conf.ConConf.RatelimitBurst)
	})

	srv.AddMiddleware(ddhttp.BulkHead(conf.ConConf.BulkheadWorkers, conf.ConConf.BulkheadMaxwaittime))

	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```  

## 熔断 / 超时 / 重试 

### 用法

Go-doudou在生成的客户端代码里内置了基于 [github.com/slok/goresilience](https://github.com/slok/goresilience) 封装的熔断/超时/重试等弹性机制的代码。你只需要执行如下命令，生成客户端代码拿来用即可

```shell
go-doudou svc http --handler -c --doc
```  

`-c`参数表示生成Go语言客户端代码。生成的`client`包的目录结构如下

```shell
├── client.go
├── clientproxy.go
└── iclient.go
``` 

生成的代码里已经有默认的`goresilience.Runner`实例，你也可以通过`WithRunner(your_own_runner goresilience.Runner)`函数传入自定义的实现。

### 示例
```go
func main() {
	conf := config.LoadFromEnv()

	var segClient *segclient.WordcloudSegClient

	if os.Getenv("GDD_MODE") == "micro" {
		err := registry.NewNode()
		if err != nil {
			logrus.Panicln(fmt.Sprintf("%+v", err))
		}
		defer registry.Shutdown()
		provider := ddhttp.NewSmoothWeightedRoundRobinProvider("wordcloud-segsvc")
		segClient = segclient.NewWordcloudSegClient(ddhttp.WithProvider(provider))
	} else {
		segClient = segclient.NewWordcloudSegClient()
	}

	segClientProxy := segclient.NewWordcloudSegClientProxy(segClient)

	... 

	svc := service.NewWordcloudMaker(conf, segClientProxy, minioClient, browser)
	
	...
}

```  

## 日志

### 用法

Go-doudou在`github.com/unionj-cloud/go-doudou/framework/logger`包里内置了一个全局的`logrus.Entry`。如果`GDD_ENV`环境变量不等于空字符串和`dev`，则会带上一些关于服务本身的元数据。

`logger`包提供一些包级的函数，可以直接替换如`logrus.Info()`这样的代码为`logger.Info()`。你也可以调用`Init`函数自定义`logrus.Logger`实例。

你还可以通过配置`GDD_LOG_LEVEL`环境变量来设置日志级别，配置`GDD_LOG_FORMAT`环境变量来设置日志格式是`json`还是`text`。

There are two built-in log related middlewares for you, `ddhttp.Metrics` and `ddhttp.Logger`. In short, `ddhttp.Metrics` is for printing brief log with limited 
information, while `ddhttp.Logger` is for printing detail log with request and response body, headers, opentracing span and some other information, and it only takes 
effect when environment variable `GDD_LOG_LEVEL` is set to `debug`.

你可以通过配置`GDD_LOG_REQ_ENABLE=true`来开启http请求和响应的日志打印，默认是`false`，即不打印。

### 示例

```go 
// 你可以用lumberjack这个库给服务增加日志rotate的功能
logger.Init(logger.WithWritter(io.MultiWriter(os.Stdout, &lumberjack.Logger{
    Filename:   filepath.Join(os.Getenv("LOG_PATH"), fmt.Sprintf("%s.log", ddconfig.GddServiceName.Load())),
    MaxSize:    5,  // 单份日志文件最大5M，超过就会创建新的日志文件
    MaxBackups: 10, // 最多保留10份日志文件
    MaxAge:     7,  // 日志文件最长保留7天
    Compress:   true, // 是否开启日志压缩
})))
```

### ELK技术栈

`logger`包支持集成ELK技术栈。

#### 示例

```yaml
version: '3.9'

services:

 elasticsearch:
   container_name: elasticsearch
   image: "docker.elastic.co/elasticsearch/elasticsearch:7.2.0"
   environment:
     - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
     - "discovery.type=single-node"
   ports:
     - "9200:9200"
   volumes:
     - ./esdata:/usr/share/elasticsearch/data
   networks:
     testing_net:
       ipv4_address: 172.28.1.9

 kibana:
   container_name: kibana
   image: "docker.elastic.co/kibana/kibana:7.2.0"
   ports:
     - "5601:5601"
   networks:
     testing_net:
       ipv4_address: 172.28.1.10

 filebeat:
   container_name: filebeat
   image: "docker.elastic.co/beats/filebeat:7.2.0"
   volumes:
     - ./filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
     - ./log:/var/log
   networks:
     testing_net:
       ipv4_address: 172.28.1.11

networks:
  testing_net:
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
```

#### 截图

![elk](/images/elk.png)

## Jaeger调用链监控

### 用法

集成Jaeger调用链监控，只需三步

1. 启动Jaeger

```shell
docker run -d --name jaeger \
  -p 6831:6831/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:1.29
```

2. 给`.env`文件添加两行配置

```shell
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831
```

3. 在`main`函数里靠前的位置添加三行代码

```go
tracer, closer := tracing.Init()
defer closer.Close()
opentracing.SetGlobalTracer(tracer)
```

然后你的`main`函数应该是类似这个样子

```go
func main() {
	...

	tracer, closer := tracing.Init()
	defer closer.Close()
	opentracing.SetGlobalTracer(tracer)

	...

	svc := service.NewWordcloudMaker(conf, segClientProxy, minioClient, browser)
	handler := httpsrv.NewWordcloudMakerHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 截图
![jaeger1](/images/jaeger1.png)
![jaeger2](/images/jaeger2.png)  

## Grafana / Prometheus

### 用法
请参考 [prometheus服务发现](./deployment.md#prometheus服务发现) 章节和代码库 [wordcloud](https://github.com/unionj-cloud/go-doudou-tutorials/tree/master/wordcloud) 

### 示例

```yaml
version: '3.9'

services:
  prometheus:
    container_name: prometheus
    hostname: prometheus
    image: wubin1989/go-doudou-prometheus-sd:v1.0.2
    environment:
      - GDD_SERVICE_NAME=prometheus
      - PROM_REFRESH_INTERVAL=15s
      - GDD_MEM_HOST=localhost
    volumes:
      - ./prometheus/:/etc/prometheus/
    ports:
      - "9090:9090"
      - "7946:7946"
      - "7946:7946/udp"
    restart: always
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:9090" ]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      testing_net:
        ipv4_address: 172.28.1.1

  grafana:
	image: grafana/grafana:latest
	container_name: grafana
	volumes:
		- ./grafana/provisioning:/etc/grafana/provisioning
	environment:
		- GF_AUTH_DISABLE_LOGIN_FORM=false
		- GF_AUTH_ANONYMOUS_ENABLED=false
		- GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
	ports:
		- 3000:3000
	networks:
		testing_net:
		ipv4_address: 172.28.1.8

networks:
  testing_net:
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
```

### 截图

![grafana](/images/grafana.png)

## 限制请求体大小

为了服务的稳定和安全，限制请求体的大小是必要的，我们可以用`ddhttp`包里的`BodyMaxBytes`中间件实现这个需求。

```go
package main

import (
	...
)

func main() {
	...

	handler := httpsrv.NewOrdersvcHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	// 限制请求体大小不超过32M
	srv.Use(ddhttp.BodyMaxBytes(32 << 20))
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

## 网关

在项目实践中，一个前端工程可能需要调用多个服务接口，前端同事做配置会很不方便，这时网关服务就派上用场了。前端同事只需要在配置文件中配置一个网关服务地址即可，然后通过`/服务名称/接口路径`的方式就可以请求到多个不同的微服务。我们可以用`ddhttp`包的`Proxy`中间件实现这个需求。

```go
package main

import (
	...
)

func main() {
	// 网关服务必须自己也注册到nacos服务注册中心或者加入memberlist集群，或者同时加入
	err := registry.NewNode()
	if err != nil {
		logrus.Panic(fmt.Sprintf("%+v", err))
	}
	defer registry.Shutdown()

	conf := config.LoadFromEnv()
	svc := service.NewGateway(conf)
	handler := httpsrv.NewGatewayHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	// 这里加上Proxy中间件即可
	srv.AddMiddleware(ddhttp.Proxy(ddhttp.ProxyConfig{}))
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

`.env`配置文件示例
```shell
GDD_SERVICE_NAME=gateway
GDD_SERVICE_DISCOVERY_MODE=memberlist,nacos

GDD_MEM_PORT=65353
GDD_MEM_SEED=localhost:7946
GDD_MEM_HOST=
GDD_MEM_NAME=gateway

GDD_NACOS_SERVER_ADDR=http://localhost:8848/nacos
GDD_NACOS_NOT_LOAD_CACHE_AT_START=true
```

*注意：* 注册在nacos注册中心的非go-doudou框架开发的应用，如果有路由前缀，则必须将其设置到`metadata`里的`"rootPath"`属性，否则网关可能会报404。

## 请求体和请求参数校验

go-doudou 从v1.1.9版本起新增基于 [go-playground/validator](https://github.com/go-playground/validator) 的针对请求体和请求参数的校验机制。

### 用法

go-doudou 内建支持的请求校验机制如下：

1. 接口定义时传入的指针类型的参数都是非必须参数，非指针类型的参数都是必须参数；
2. 接口定义时可在方法入参的上方以go语言注释的形式，加上`@validate`注解，须遵循[接口定义-注解](./idl.html#注解)章节说明的注解语法和格式，传入具体的校验规则作为注解的参数；
3. vo包里定义struct结构体时可以在属性的tag里加上`validate`标签，在后面写上具体的校验规则；

以上第2点和第3点里提到的校验规则仅支持 `go-playground/validator` 库中的规则。go-doudou实际校验请求体和请求参数的代码都在go-doudou命令行工具生成的`handlerimpl.go`文件中，只有struct类型（包括struct指针类型）的参数底层通过 `func (v *Validate) Struct(s interface{}) error` 方法校验，其他类型的参数底层都通过 `func (v *Validate) Var(field interface{}, tag string) error` 方法校验。

go-doudou 的`ddhttp`包通过导出函数 `func GetValidate() *validator.Validate` 对外提供了`*validator.Validate`类型的单例，开发者可以通过这个单例调用由`go-playground/validator`直接提供的api来实现更复杂的、自定义的需求，比如错误信息中文翻译、自定义校验规则等等，请参考`go-playground/validator`的[官方文档](https://pkg.go.dev/github.com/go-playground/validator/v10)和[官方示例](https://github.com/go-playground/validator/tree/master/_examples)。

### 示例

接口定义示例

```go
// <b style="color: red">NEW</b> 文章新建和更新接口
// 传进来的参数里有id执行更新操作，没有id执行创建操作
// @role(SUPER_ADMIN)
Article(ctx context.Context, file *v3.FileModel,
	// @validate(gt=0,lte=60)
	title,
	// @validate(gt=0,lte=1000)
	content *string, tags *[]string, sort, status *int, id *int) (data string, err error)
```

vo包中的struct结构体示例

```go
type ArticleVo struct {
	Id      int    `json:"id"`
	Title   string `json:"title" validate:"required,gt=0,lte=60"`
	Content string `json:"content"`
	Link    string `json:"link" validate:"required,url"`
	CreateAt string `json:"createAt"`
	UpdateAt string `json:"updateAt"`
}
```

生成的代码示例

```go
func (receiver *ArticleHandlerImpl) ArticleList(_writer http.ResponseWriter, _req *http.Request) {
	var (
		ctx     context.Context
		payload vo.ArticlePageQuery
		data    vo.ArticleRet
		err     error
	)
	ctx = _req.Context()
	if _req.Body == nil {
		http.Error(_writer, "missing request body", http.StatusBadRequest)
		return
	} else {
		if _err := json.NewDecoder(_req.Body).Decode(&payload); _err != nil {
			http.Error(_writer, _err.Error(), http.StatusBadRequest)
			return
		} else {
			if _err := ddhttp.ValidateStruct(payload); _err != nil {
				http.Error(_writer, _err.Error(), http.StatusBadRequest)
				return
			}
		}
	}
	...
}
```

```go
func (receiver *ArticleHandlerImpl) Article(_writer http.ResponseWriter, _req *http.Request) {
	var (
		ctx    context.Context
		file   *v3.FileModel
		title  *string
		content    *string
		tags   *[]string
		sort   *int
		status *int
		id     *int
		data   string
		err    error
	)
	...
	if _, exists := _req.Form["title"]; exists {
		_title := _req.FormValue("title")
		title = &_title
		if _err := ddhttp.ValidateVar(title, "gt=0,lte=60", "title"); _err != nil {
			http.Error(_writer, _err.Error(), http.StatusBadRequest)
			return
		}
	}
	if _, exists := _req.Form["content"]; exists {
		_content := _req.FormValue("content")
		content = &_content
		if _err := ddhttp.ValidateVar(content, "gt=0,lte=1000", "content"); _err != nil {
			http.Error(_writer, _err.Error(), http.StatusBadRequest)
			return
		}
	}
	...
}
```

错误信息中文翻译示例

```go
package main

import (
	"github.com/go-playground/locales/zh"
	ut "github.com/go-playground/universal-translator"
	zhtrans "github.com/go-playground/validator/v10/translations/zh"
	...
)

func main() {
	...

	uni := ut.New(zh.New())
	trans, _ := uni.GetTranslator("zh")
	ddhttp.SetTranslator(trans)
	zhtrans.RegisterDefaultTranslations(ddhttp.GetValidate(), trans)

	...

	srv.Run()
}
```