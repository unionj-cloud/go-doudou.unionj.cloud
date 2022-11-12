# gRPC

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

需调用 `etcd.NewRRGrpcClientConn("注册在etcd中的服务名称", tlsOption)` 创建 `*grpc.ClientConn` 实例。

```go
func main() {
  // 程序退出前需要关闭etcd客户端
	defer etcd.CloseEtcdClient()
	conf := config.LoadFromEnv()

	tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())
  // 创建支持etcd简单轮询负载均衡机制的gRPC连接
	grpcConn := etcd.NewRRGrpcClientConn("grpcdemo-server_grpc", tlsOption)
  // 程序退出前需要关闭gRPC连接
	defer grpcConn.Close()

	svc := service.NewEnumDemo(conf, pb.NewHelloworldServiceClient(grpcConn),
		client.NewHelloworldClient(ddclient.WithClient(newClient()), ddclient.WithProvider(restProvider)))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 平滑加权轮询负载均衡 (Etcd用)

需调用 `etcd.NewWRRGrpcClientConn("注册在etcd中的服务名称", tlsOption)` 创建 `*grpc.ClientConn` 实例。

```go
func main() {
  // 程序退出前需要关闭etcd客户端
	defer etcd.CloseEtcdClient()
	conf := config.LoadFromEnv()

	tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())
  // 创建支持etcd平滑加权轮询负载均衡机制的gRPC连接
	grpcConn := etcd.NewWRRGrpcClientConn("grpcdemo-server_grpc", tlsOption)
  // 程序退出前需要关闭gRPC连接
	defer grpcConn.Close()

	svc := service.NewEnumDemo(conf, pb.NewHelloworldServiceClient(grpcConn),
		client.NewHelloworldClient(ddclient.WithClient(newClient()), ddclient.WithProvider(restProvider)))
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

正在编写中

## 熔断 / 超时 / 重试 

正在编写中  

## 日志

### 用法

`go-doudou`在`github.com/unionj-cloud/go-doudou/v2/toolkit/zlogger`包里内置了一个全局的`zerolog.Logger`。如果`GDD_ENV`环境变量不等于空字符串和`dev`，则会带上一些关于服务本身的元数据。

你也可以调用`InitEntry`函数自定义`zerolog.Logger`实例。

你还可以通过配置`GDD_LOG_LEVEL`环境变量来设置日志级别，配置`GDD_LOG_FORMAT`环境变量来设置日志格式是`json`还是`text`。

你可以通过配置`GDD_LOG_REQ_ENABLE=true`来开启http请求和响应的日志打印，默认是`false`，即不打印。

### 示例

```go 
// 你可以用lumberjack这个库给服务增加日志rotate的功能
zlogger.SetOutput(io.MultiWriter(os.Stdout, &lumberjack.Logger{
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

正在编写中
