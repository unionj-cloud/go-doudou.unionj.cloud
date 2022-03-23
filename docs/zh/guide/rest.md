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

- `GDD_MEM_SEED`: 种子节点连接地址，多个地址用英文逗号隔开
- `GDD_MEM_PORT`: 监听端口，默认监听`7946`端口
- `GDD_MEM_HOST`: 对外发布的连接地址，默认是私有IP
- `GDD_SERVICE_DISCOVERY_MODE`: 可以不用配置，默认值就是`memberlist`

```shell
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
- `GDD_NACOS_SERVER_ADDR`: Nacos服务端地址
- `GDD_SERVICE_DISCOVERY_MODE`: 服务发现机制名称

```shell
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

Go-doudou在`github.com/unionj-cloud/go-doudou/framework/http`包中内置了基于 [github.com/slok/goresilience](github.com/slok/goresilience) 封装的开箱即用的隔仓功能。

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

Go-doudou在生成的客户端代码里内置了基于 [github.com/slok/goresilience](github.com/slok/goresilience) 封装的熔断/超时/重试等弹性机制的代码。你只需要执行如下命令，生成客户端代码拿来用即可

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
