# RESTful

## Service Register and Discovery

Go-doudou has built-in service register, discovery and failure detection based on [memberlist](https://github.com/hashicorp/memberlist).

First, add below code to `main` function.

```go
err := registry.NewNode()
if err != nil {
    logrus.Panic(fmt.Sprintf("%+v", err))
}
defer registry.Shutdown()
```  

Second, configure `GDD_MEM_SEED` environment variable in `.env` file or `docker-compose.yml` file. If you will deploy it to kubernetes, you should also configure `GDD_MEM_HOST` environment variable. For further reading, please refer to [Microservice Architecture](./deployment.md#kubernetes-1) section.


## Client Load Balancing

### Simple Round-robin Load Balancing

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

### Smooth Weighted Round-robin Balancing

If environment variable `GDD_MEM_WEIGHT` is not set, local node weight will be calculated by health score and cpu idle
percent every `GDD_MEM_WEIGHT_INTERVAL` and gossip to remote nodes. By default, `GDD_MEM_WEIGHT_INTERVAL` is `0s`, this feature is disabled.

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

## Rate Limit
### Usage
There is a built-in [golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate) based token-bucket rate limiter implementation
in `github.com/unionj-cloud/go-doudou/ratelimit/memrate` package with a `MemoryStore` struct for storing key and `Limiter` instance pairs.

If you don't like the built-in rate limiter implementation, you can implement `Limiter` interface by yourself.

You can pass an option function `memrate.WithTimer` to `memrate.NewLimiter` function to set a timer to each of 
`memrate.Limiter` instance returned for deleting the key in `keys` of the `MemoryStore` instance if it has been idle for `timeout` duration.

There is also a built-in [go-redis/redis_rate](https://github.com/go-redis/redis_rate) based redis GCRA rate limiter implementation.

### Memory based rate limiter Example
Memory based rate limiter is stored in memory, only for single process.  

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
Note: you need write your own http middleware to fit your needs. Here is an example below.
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

## Bulkhead
### Usage
There is built-in [github.com/slok/goresilience](github.com/slok/goresilience) based bulkhead pattern support by BulkHead middleware in `github.com/unionj-cloud/go-doudou/svc/http` package.

```go
http.BulkHead(3, 10*time.Millisecond)
```

In above code, the first parameter `3` means the number of workers in the execution pool, the second parameter `10*time.Millisecond` 
means the max time an incoming request will wait to execute before being dropped its execution and return `429` response.

### Example

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

## Circuit Breaker / Timeout / Retry 
### Usage
There is built-in [github.com/slok/goresilience](github.com/slok/goresilience) based Circuit Breaker / Timeout / Retry support in generated client code.
You don't need to do anything other than running below command: 
```shell
go-doudou svc http --handler -c go --doc
```  
The flag  `-c go` means generate go client code.
Then you will get three files in client folder: 
```shell
├── client.go
├── clientproxy.go
└── iclient.go
```
For `client.go` and `iclient.go` files, all code will be overwritten each time you execute generation command.  
For `clientproxy.go` file, the existing code will not be changed, only new code will be appended. 

There is a default `goresilience.Runner` instance which has already been built-in circuit breaker, timeout and retry features for you, but if you need to customize it, you can pass `WithRunner(your_own_runner goresilience.Runner)` as `ProxyOption` parameter into `NewXXXClientProxy` function.

### Example
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

## Log
### Usage
There is a global `logrus.Entry` provided by `github.com/unionj-cloud/go-doudou/svc/logger` package. If `GDD_ENV` is set and is not set to `dev`,
it will be attached with some meta fields about service name, hostname, etc.

`logger` package implemented several exported package-level methods from `logrus`, so you can replace `logrus.Info()` with `logger.Info()` for example.
It also provided a `Init` function to help you configure `logrus.Logger` instance.

You can also configure log level by environment variable `GDD_LOG_LEVEL` and configure formatter type to `json` or `text` by environment variable `GDD_LOG_FORMAT`.

There are two built-in log related middlewares for you, `ddhttp.Metrics` and `ddhttp.Logger`. In short, `ddhttp.Metrics` is for printing brief log with limited 
information, while `ddhttp.Logger` is for printing detail log with request and response body, headers, opentracing span and some other information, and it only takes 
effect when environment variable `GDD_LOG_LEVEL` is set to `debug`.

### Example
```go 
// you can use lumberjack to add log rotate feature to your service
logger.Init(logger.WithWritter(io.MultiWriter(os.Stdout, &lumberjack.Logger{
    Filename:   filepath.Join(os.Getenv("LOG_PATH"), fmt.Sprintf("%s.log", ddconfig.GddServiceName.Load())),
    MaxSize:    5,  // Max megabytes before log is rotated
    MaxBackups: 10, // Max number of old log files to keep
    MaxAge:     7,  // Max number of days to retain log files
    Compress:   true,
})))
```

### ELK stack
`logger` package provided well support for ELK stack. To see example, please go to [go-doudou-guide](https://github.com/unionj-cloud/go-doudou-guide).

![elk](/images/elk.png)

## Jaeger
### Usage
To add jaeger feature, you just need three steps:
1. Start jaeger
```shell
docker run -d --name jaeger \
  -p 6831:6831/udp \
  -p 16686:16686 \
  jaegertracing/all-in-one:1.29
```
2. Add two environment variables to your .env file
```shell
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831
```
3. Add three lines to your main function before new client and http server code
```go
tracer, closer := tracing.Init()
defer closer.Close()
opentracing.SetGlobalTracer(tracer)
```
Then your main function should like this
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
### Screenshot
![jaeger1](/images/jaeger1.png)
![jaeger2](/images/jaeger2.png)  

## Grafana / Prometheus
### Usage
Please refer to [Prometheus Service Discovery](./deployment.md#prometheus-service-discovery) section.

### Screenshot
![grafana](/images/grafana.png)