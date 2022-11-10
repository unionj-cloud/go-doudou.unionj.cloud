# REST

## 内置路由说明

go-doudou框架内置了12个路由，方便服务开发者和调用者联调，服务开发者对服务的状态进行监控，以及对线上服务进行调优。

```shell
2022-11-07 23:11:43 INF | GetDoc               | GET    | /go-doudou/doc          |
2022-11-07 23:11:43 INF | GetOpenAPI           | GET    | /go-doudou/openapi.json |
2022-11-07 23:11:43 INF | Prometheus           | GET    | /go-doudou/prometheus   |
2022-11-07 23:11:43 INF | GetConfig            | GET    | /go-doudou/config       |
2022-11-07 23:11:43 INF | GetStatsvizWs        | GET    | /go-doudou/statsviz/ws  |
2022-11-07 23:11:43 INF | GetStatsviz          | GET    | /go-doudou/statsviz/*   |
2022-11-07 23:11:43 INF | GetDebugPprofCmdline | GET    | /debug/pprof/cmdline    |
2022-11-07 23:11:43 INF | GetDebugPprofProfile | GET    | /debug/pprof/profile    |
2022-11-07 23:11:43 INF | GetDebugPprofSymbol  | GET    | /debug/pprof/symbol     |
2022-11-07 23:11:43 INF | GetDebugPprofTrace   | GET    | /debug/pprof/trace      |
2022-11-07 23:11:43 INF | GetDebugPprofIndex   | GET    | /debug/pprof/*          |
2022-11-07 23:11:43 INF +----------------------+--------+-------------------------+
2022-11-07 23:11:43 INF ===================================================
2022-11-07 23:11:43 INF Http server is listening at :6060
2022-11-07 23:11:43 INF Http server started in 1.676754ms      
```

下面一一说明：

- `/go-doudou/doc`：基于OpenAPI 3.0规范，采用vuejs+elementUI开发的在线接口文档。核心代码已开源，编译后可以单独使用，特别是可以用于其他框架和编程语言，仓库地址：[https://github.com/unionj-cloud/go-doudou-openapi-ui](https://github.com/unionj-cloud/go-doudou-openapi-ui)

- `/go-doudou/openapi.json`：兼容OpenAPI 3.0规范的json文档，主要用于同样是支持OpenAPI 3.0的第三方代码生成工具生成代码，比如go-doudou作者开源的Nodejs开发的支持typescript的http请求客户端代码生成器pullcode，仓库地址：[https://github.com/wubin1989/pullcode](https://github.com/wubin1989/pullcode)

- `/go-doudou/prometheus`：用于Prometheus爬取服务运行指标

- `/go-doudou/config`：用于查看当前服务运行中生效的环境配置，可以加查询字符串参数`pre`，例如：`http://localhost:6066/go-doudou/config?pre=GDD_`，表示只显示以`GDD_`为前缀的环境变量

- `/go-doudou/statsviz/ws`和`/go-doudou/statsviz/*`：集成了可视化运行时统计指标的开源库[https://github.com/arl/statsviz](https://github.com/arl/statsviz)

- `/debug/`为前缀的路由：集成了go语言内置的pprof工具，需要优化程序的时候可以用，有几种常用的用法附在下方，

```shell
go tool pprof -http :6068 http://admin:admin@localhost:6060/debug/pprof/profile\?seconds\=20
```

等待20秒以后，会自动打开浏览器，可以查看火焰图等。


```shell
curl -o trace.out http://qylz:1234@localhost:6060/debug/pprof/trace\?seconds\=20
go tool trace trace.out
```

这两个命令执行完以后，会自动打开浏览器，你可以查看前20s的程序运行时的监控指标。

另外需要说明的是：所有的内置路由都加了http basic auth校验，你可以分别通过环境变量 `GDD_MANAGE_USER` 和 `GDD_MANAGE_PASS`自定义配置用户名和密码，默认值都是`admin`。如果你采用了go-doudou支持的配置管理中心Nacos或者Apollo，可以在运行时动态修改，自动生效，无须重启服务。建议生产环境的服务的http basic用户名和密码隔段时间换一下，确保安全。



## 服务注册与发现

`go-doudou`支持两种服务注册与发现机制：`etcd`和`nacos`。REST服务注册在注册中心的服务名称会自动加上 `_rest` 后缀，gRPC服务注册在注册中心的服务名称会自动加上 `_grpc`，以作区分。

::: tip
`etcd`和`nacos`两种机制可以在一个服务中同时使用

```shell
GDD_SERVICE_DISCOVERY_MODE=etcd,nacos
```
:::

### Etcd

`go-doudou`从v2版本起内建支持使用etcd作为注册中心，实现服务注册与发现。需配置如下环境变量:  

- `GDD_SERVICE_NAME`: 服务名称，必须
- `GDD_SERVICE_DISCOVERY_MODE`: 服务注册与发现机制名称，`etcd`，必须
- `GDD_ETCD_ENDPOINTS`: etcd连接地址，必须

```shell
GDD_SERVICE_NAME=grpcdemo-server
GDD_SERVICE_DISCOVERY_MODE=etcd
GDD_ETCD_ENDPOINTS=localhost:2379
```

### Nacos

`go-doudou`内建支持使用阿里开发的Nacos作为注册中心，实现服务注册与发现。需配置如下环境变量:

- `GDD_SERVICE_NAME`: 服务名称，必须
- `GDD_NACOS_SERVER_ADDR`: Nacos服务端地址
- `GDD_SERVICE_DISCOVERY_MODE`: 服务发现机制名称

```shell
GDD_SERVICE_NAME=test-svc # Required
GDD_NACOS_SERVER_ADDR=http://localhost:8848/nacos # Required
GDD_SERVICE_DISCOVERY_MODE=nacos # Required
```

## 客户端负载均衡

### 简单轮询负载均衡 (Etcd用)

需调用 `etcd.NewRRServiceProvider("服务名称_rest")` 创建 `etcd.RRServiceProvider` 实例。

```go
func main() {
	defer etcd.CloseEtcdClient()
	conf := config.LoadFromEnv()
	restProvider := etcd.NewRRServiceProvider("grpcdemo-server_rest")
	svc := service.NewEnumDemo(conf, client.NewHelloworldClient(restclient.WithProvider(restProvider)))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 平滑加权轮询负载均衡 (Etcd用)

需调用 `etcd.NewSWRRServiceProvider("服务名称_rest")` 创建 `etcd.SWRRServiceProvider` 实例。  

如果环境变量`GDD_WEIGHT`都没有设置，默认权重是1。

```go
func main() {
	defer etcd.CloseEtcdClient()
	conf := config.LoadFromEnv()
	restProvider := etcd.NewSWRRServiceProvider("grpcdemo-server_rest")
	svc := service.NewEnumDemo(conf, client.NewHelloworldClient(restclient.WithProvider(restProvider)))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 简单轮询负载均衡 (nacos用)

需调用 `nacos.NewRRServiceProvider("服务名称_rest")` 创建 `nacos.RRServiceProvider` 实例。

```go
func main() {
	defer nacos.CloseNamingClient()
	conf := config.LoadFromEnv()
	restProvider := nacos.NewRRServiceProvider("grpcdemo-server_rest")
	svc := service.NewEnumDemo(conf, client.NewHelloworldClient(restclient.WithProvider(restProvider)))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 加权轮询负载均衡 (nacos用)

需调用 `nacos.NewWRRServiceProvider("服务名称_rest")` 创建 `nacos.WRRServiceProvider` 实例。

```go
func main() {
	defer nacos.CloseNamingClient()
	conf := config.LoadFromEnv()
	restProvider := nacos.NewWRRServiceProvider("grpcdemo-server_rest")
	svc := service.NewEnumDemo(conf, client.NewHelloworldClient(restclient.WithProvider(restProvider)))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

## 限流
### 用法

`go-doudou`内置了基于[golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate)实现的令牌桶算法的内存限流器。

在`github.com/unionj-cloud/go-doudou/v2/framework/ratelimit/memrate`包里有一个`MemoryStore`结构体，存储了key和`Limiter`实例对。`Limiter`实例是限流器实例，key是该限流器实例的键。

你可以往`memrate.NewLimiter`工厂函数传入一个可选函数`memrate.WithTimer`，设置当key空闲时间超过`timeout`以后的回调函数，比如可以从`MemoryStore`实例里将该key删除，以释放内存资源。

`go-doudou`还提供了基于 [go-redis/redis_rate](https://github.com/go-redis/redis_rate) 库封装的GCRA限流算法的redis限流器。该限流器支持跨实例的全局限流。

### 内存限流器示例

内存限流器基于本机内存，只支持本机限流。

```go
func main() {
	...

	store := memrate.NewMemoryStore(func(_ context.Context, store *memrate.MemoryStore, key string) ratelimit.Limiter {
		return memrate.NewLimiter(10, 30, memrate.WithTimer(10*time.Second, func() {
			store.DeleteKey(key)
		}))
	})
	srv := rest.NewRestServer()
	srv.AddMiddleware(
		httpsrv.RateLimit(store),
	)
	handler := httpsrv.NewUsersvcHandler(svc)
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
	srv := rest.NewRestServer()
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

`go-doudou`在`github.com/unionj-cloud/go-doudou/v2/framework/rest`包中内置了基于 [github.com/slok/goresilience](https://github.com/slok/goresilience) 封装的开箱即用的隔仓功能。

```go
rest.BulkHead(3, 10*time.Millisecond)
```

上面的示例代码中，第一个参数`3`表示用于处理http请求的goroutine池中的worker数量，第二个参数`10*time.Millisecond`表示一个http请求进来以后等待被处理的最长等待时间，如果超时，即直接返回`429`状态码。

### 示例

```go
func main() {
	...

	svc := service.NewWordcloudBff(conf, minioClient, makerClientProxy, taskClientProxy, userClientProxy)
	handler := httpsrv.NewWordcloudBffHandler(svc)
	srv := rest.NewRestServer()
	srv.AddMiddleware(httpsrv.Auth(userClientProxy))

	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:6379", conf.RedisConf.Host),
	})

	fn := redisrate.LimitFn(func(ctx context.Context) ratelimit.Limit {
		return ratelimit.PerSecondBurst(conf.ConConf.RatelimitRate, conf.ConConf.RatelimitBurst)
	})

	srv.AddMiddleware(rest.BulkHead(conf.ConConf.BulkheadWorkers, conf.ConConf.BulkheadMaxwaittime))

	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```  

## 熔断 / 超时 / 重试 

### 用法

`go-doudou`在生成的客户端代码里内置了基于 [github.com/slok/goresilience](https://github.com/slok/goresilience) 封装的熔断/超时/重试等弹性机制的代码。你只需要执行如下命令，生成客户端代码拿来用即可

```shell
go-doudou svc http -c
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

	if os.Getenv("GDD_SERVICE_DISCOVERY_MODE") != "" {
		provider := etcd.NewSWRRServiceProvider("wordcloud-segsvc_rest")
		segClient = segclient.NewWordcloudSegClient(restclient.WithProvider(provider))
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

`go-doudou`在`github.com/unionj-cloud/go-doudou/v2/toolkit/zlogger`包里内置了一个全局的`zerolog.Logger`。如果`GDD_ENV`环境变量不等于空字符串和`dev`，则会带上一些关于服务本身的元数据。

你也可以调用`InitEntry`函数自定义`zerolog.Logger`实例。

你还可以通过配置`GDD_LOG_LEVEL`环境变量来设置日志级别，配置`GDD_LOG_FORMAT`环境变量来设置日志格式是`json`还是`text`。

你可以通过配置`GDD_LOG_REQ_ENABLE=true`来开启http请求和响应的日志打印，默认是`false`，即不打印。

### 示例

```go 
// 你可以用lumberjack这个库给服务增加日志rotate的功能
zlogger.Output(io.MultiWriter(os.Stdout, &lumberjack.Logger{
			Filename:   filepath.Join(os.Getenv("LOG_PATH"), fmt.Sprintf("%s.log", "usersvc")),
		  MaxSize:    5,  // 单份日志文件最大5M，超过就会创建新的日志文件
      MaxBackups: 10, // 最多保留10份日志文件
      MaxAge:     7,  // 日志文件最长保留7天
      Compress:   true, // 是否开启日志压缩
}))
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
	srv := rest.NewRestServer()
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

在k8s部署grafana的yaml文件示例：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: grafana
  name: grafana
spec:
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      securityContext:
        fsGroup: 472
        supplementalGroups:
          - 0
      containers:
        - name: grafana
          image: grafana/grafana:8.4.4
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
              name: http-grafana
              protocol: TCP
          readinessProbe:
            failureThreshold: 3
            httpGet:
              path: /robots.txt
              port: 3000
              scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 30
            successThreshold: 1
            timeoutSeconds: 2
          livenessProbe:
            failureThreshold: 3
            initialDelaySeconds: 30
            periodSeconds: 10
            successThreshold: 1
            tcpSocket:
              port: 3000
            timeoutSeconds: 1
          resources:
            requests:
              cpu: 250m
              memory: 750Mi
          volumeMounts:
            - mountPath: /var/lib/grafana
              name: grafana-pv
      volumes:
        - name: grafana-pv
          persistentVolumeClaim:
            claimName: grafana-volume
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
spec:
  ports:
    - port: 3000
      protocol: TCP
      targetPort: http-grafana
  selector:
    app: grafana
  sessionAffinity: None
  type: LoadBalancer
```

### 截图

![grafana](/images/grafana.png)

## 限制请求体大小

为了服务的稳定和安全，限制请求体的大小是必要的，我们可以用`rest`包里的`BodyMaxBytes`中间件实现这个需求。

```go
package main

import (
	...
)

func main() {
	...

	handler := httpsrv.NewOrdersvcHandler(svc)
	srv := rest.NewRestServer()
	// 限制请求体大小不超过32M
	srv.Use(rest.BodyMaxBytes(32 << 20))
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

## 网关

在项目实践中，一个前端工程可能需要调用多个服务接口，前端同事做配置会很不方便，这时网关服务就派上用场了。前端同事只需要在配置文件中配置一个网关服务地址即可，然后通过`/服务名称/接口路径`的方式就可以请求到多个不同的微服务。我们可以用`rest`包的`Proxy`中间件实现这个需求。

网关服务必须自己也注册到nacos服务注册中心或者etcd集群，或者同时加入。

```go
package main

import (
	"github.com/unionj-cloud/go-doudou/v2/framework/rest"
)

func main() {
	srv := rest.NewRestServer()
	srv.AddMiddleware(rest.Proxy(rest.ProxyConfig{}))
	srv.Run()
}
```

`.env`配置文件示例
```shell
GDD_SERVICE_NAME=gateway
GDD_SERVICE_DISCOVERY_MODE=nacos,etcd

# nacos相关配置
GDD_NACOS_SERVER_ADDR=http://localhost:8848/nacos
GDD_NACOS_NOT_LOAD_CACHE_AT_START=true

# etcd相关配置
GDD_ETCD_ENDPOINTS=localhost:2379
```

*注意：* 注册在nacos注册中心的非go-doudou框架开发的应用，如果有路由前缀，则必须将其设置到`metadata`里的`rootPath`属性，否则网关可能会报404。

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
			if _err := rest.ValidateStruct(payload); _err != nil {
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
		if _err := rest.ValidateVar(title, "gt=0,lte=60", "title"); _err != nil {
			http.Error(_writer, _err.Error(), http.StatusBadRequest)
			return
		}
	}
	if _, exists := _req.Form["content"]; exists {
		_content := _req.FormValue("content")
		content = &_content
		if _err := rest.ValidateVar(content, "gt=0,lte=1000", "content"); _err != nil {
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
	rest.SetTranslator(trans)
	zhtrans.RegisterDefaultTranslations(rest.GetValidate(), trans)

	...

	srv.Run()
}
```