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

### Zookeeper

`go-doudou`内建支持使用Zookeeper作为注册中心，实现服务注册与发现。需配置如下环境变量:

- `GDD_SERVICE_NAME`: 服务名称，必须
- `GDD_SERVICE_DISCOVERY_MODE`: 服务发现机制名称，必须
- `GDD_ZK_SERVERS`: Nacos服务端地址，必须

```shell
GDD_SERVICE_NAME=cloud.unionj.ServiceB # Required
GDD_SERVICE_DISCOVERY_MODE=zk # Required
GDD_ZK_SERVERS=localhost:2181 # Required
GDD_ZK_DIRECTORY_PATTERN=/dubbo/%s/providers
GDD_SERVICE_GROUP=group
GDD_SERVICE_VERSION=v2.2.2
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

需调用 `etcd.NewSWRRGrpcClientConn("注册在etcd中的服务名称", tlsOption)` 创建 `*grpc.ClientConn` 实例。

```go
func main() {
  // 程序退出前需要关闭etcd客户端
	defer etcd.CloseEtcdClient()
	conf := config.LoadFromEnv()

	tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())
  // 创建支持etcd平滑加权轮询负载均衡机制(SWRR)的gRPC连接
	grpcConn := etcd.NewSWRRGrpcClientConn("grpcdemo-server_grpc", tlsOption)
  // 程序退出前需要关闭gRPC连接
	defer grpcConn.Close()

	svc := service.NewEnumDemo(conf, pb.NewHelloworldServiceClient(grpcConn))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 简单轮询负载均衡 (nacos用)

调用 `nacos.NewRRGrpcClientConn` 方法，创建gRPC连接。 

```go
func main() {
  // 程序退出前需要关闭nacos客户端
	defer nacos.CloseNamingClient()
	conf := config.LoadFromEnv()

	tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())

	// 创建支持nacos简单轮询负载均衡机制的gRPC连接
	grpcConn := nacos.NewRRGrpcClientConn(nacos.NacosConfig{
		ServiceName: "grpcdemo-server_grpc",
	}, tlsOption)
  // 程序退出前需要关闭gRPC连接
	defer grpcConn.Close()


	svc := service.NewEnumDemo(conf, pb.NewHelloworldServiceClient(grpcConn))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 加权轮询负载均衡 (nacos用)

调用 `nacos.NewWRRGrpcClientConn` 方法，创建gRPC连接。 

```go
func main() {
  // 程序退出前需要关闭nacos客户端
	defer nacos.CloseNamingClient()
	conf := config.LoadFromEnv()

	tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())

	// 创建支持nacos加权轮询负载均衡机制的gRPC连接
	grpcConn := nacos.NewWRRGrpcClientConn(nacos.NacosConfig{
		ServiceName: "grpcdemo-server_grpc",
	}, tlsOption)
  // 程序退出前需要关闭gRPC连接
	defer grpcConn.Close()


	svc := service.NewEnumDemo(conf, pb.NewHelloworldServiceClient(grpcConn))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 简单轮询负载均衡 (zookeeper用)

调用 `zk.NewRRGrpcClientConn` 方法，创建gRPC连接。 

```go
func main() {
	...
  tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())

	opts := []grpc_retry.CallOption{
		grpc_retry.WithBackoff(grpc_retry.BackoffLinear(100 * time.Millisecond)),
		grpc_retry.WithCodes(codes.NotFound, codes.Aborted),
	}

	dialOptions := []grpc.DialOption{
		tlsOption,
		grpc.WithStreamInterceptor(grpc_middleware.ChainStreamClient(
			grpc_opentracing.StreamClientInterceptor(),
			grpc_retry.StreamClientInterceptor(opts...),
		)),
		grpc.WithUnaryInterceptor(grpc_middleware.ChainUnaryClient(
			grpc_opentracing.UnaryClientInterceptor(),
			grpc_retry.UnaryClientInterceptor(opts...),
		)),
	}

	// Set up a connection to the server.
	grpcConn := zk.NewRRGrpcClientConn(zk.ServiceConfig{
		Name:    "cloud.unionj.ServiceB_grpc",
		Group:   "",
		Version: "",
	}, dialOptions...)
	defer grpcConn.Close()

	svc := service.NewServiceA(conf, bClient, pb.NewServiceBServiceClient(grpcConn))
	...
}
```

### 加权轮询负载均衡 (zookeeper用)

调用 `zk.NewSWRRGrpcClientConn` 方法，创建gRPC连接。 

```go
func main() {
	...
  tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())

	opts := []grpc_retry.CallOption{
		grpc_retry.WithBackoff(grpc_retry.BackoffLinear(100 * time.Millisecond)),
		grpc_retry.WithCodes(codes.NotFound, codes.Aborted),
	}

	dialOptions := []grpc.DialOption{
		tlsOption,
		grpc.WithStreamInterceptor(grpc_middleware.ChainStreamClient(
			grpc_opentracing.StreamClientInterceptor(),
			grpc_retry.StreamClientInterceptor(opts...),
		)),
		grpc.WithUnaryInterceptor(grpc_middleware.ChainUnaryClient(
			grpc_opentracing.UnaryClientInterceptor(),
			grpc_retry.UnaryClientInterceptor(opts...),
		)),
	}

	// Set up a connection to the server.
	grpcConn := zk.NewSWRRGrpcClientConn(zk.ServiceConfig{
		Name:    "cloud.unionj.ServiceB_grpc",
		Group:   "",
		Version: "",
	}, dialOptions...)
	defer grpcConn.Close()

	svc := service.NewServiceA(conf, bClient, pb.NewServiceBServiceClient(grpcConn))
	...
}
```

## 登录鉴权

`go-doudou` 的 `framework/grpcx/interceptors/grpcx_auth` 包里内置了登录授权相关的拦截器 `grpcx_auth.UnaryServerInterceptor` 和 `grpcx_auth.StreamServerInterceptor`，以及接口 `grpcx_auth.Authorizer`。开发者可以自定义 `grpcx_auth.Authorizer` 的接口实现。以下是用法示例：

### 接口定义

请注意接口方法定义上方的`@role`注解。`go-doudou` 的注解用法请参考官方文档的 `指南->接口定义->注解->gRPC服务中的使用方法` 相关章节。

```go
package service

import "context"

//go:generate go-doudou svc http
//go:generate go-doudou svc grpc

type Annotation interface {
	// 此接口可公开访问，无需校验登录和权限
	GetGuest(ctx context.Context) (data string, err error)
	// 此接口只有登录用户有权访问
	// @role(USER,ADMIN)
	GetUser(ctx context.Context) (data string, err error)
	// 此接口只有管理员有权访问
	// @role(ADMIN)
	GetAdmin(ctx context.Context) (data string, err error)
}
```

### grpcx_auth.Authorizer接口实现

以下是基于http basic登录鉴权的自定义 `grpcx_auth.Authorizer` 接口实现的示例代码：

```go
package grpc

import (
	"annotation/vo"
	"context"
	"encoding/base64"
	grpc_auth "github.com/grpc-ecosystem/go-grpc-middleware/auth"
	"github.com/unionj-cloud/go-doudou/v2/framework/grpcx/interceptors/grpcx_auth"
	"github.com/unionj-cloud/go-doudou/v2/toolkit/sliceutils"
	"strings"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// 确保AuthInterceptor结构体实现grpcx_auth.Authorizer接口
var _ grpcx_auth.Authorizer = (*AuthInterceptor)(nil)

// AuthInterceptor是grpcx_auth.Authorizer接口的实现
type AuthInterceptor struct {
	// 此处为了简单，采用模拟数据库用户角色表的基于内存的数据结构，
	// 但实际项目中通常会定义一个数据库连接实例作为成员变量，
	// 采用真实的数据库来查询用户表、角色表、权限表等
	userStore vo.UserStore
}

// NewAuthInterceptor是创建AuthInterceptor结构体实例的工厂方法
func NewAuthInterceptor(userStore vo.UserStore) *AuthInterceptor {
	return &AuthInterceptor{
		userStore: userStore,
	}
}

// 解析http basic token，返回用户名和密码
func parseToken(token string) (username, password string, ok bool) {
	c, err := base64.StdEncoding.DecodeString(token)
	if err != nil {
		return "", "", false
	}
	cs := string(c)
	username, password, ok = strings.Cut(cs, ":")
	if !ok {
		return "", "", false
	}
	return username, password, true
}

// Authorize方法实现了grpcx_auth.Authorizer接口
func (interceptor *AuthInterceptor) Authorize(ctx context.Context, fullMethod string) (context.Context, error) {
	method := fullMethod[strings.LastIndex(fullMethod, "/")+1:]
	// go-doudou的注解用法请参考官方文档的"指南->接口定义->注解->gRPC服务中的使用方法"章节
	// 如果gRPC方法定义没有@role注解，则表示可以公开访问，无须鉴权，直接放行
	if !MethodAnnotationStore.HasAnnotation(method, "@role") {
		return ctx, nil
	}
	// 此处依赖了第三方开源库github.com/grpc-ecosystem/go-grpc-middleware的auth包
	// 从metadata里提取http basic token
	token, err := grpc_auth.AuthFromMD(ctx, "Basic")
	if err != nil {
		return ctx, err
	}
	// 解析http basic token，返回用户名和密码
	user, pass, ok := parseToken(token)
	if !ok {
		return ctx, status.Error(codes.Unauthenticated, "Provide user name and password")
	}
	// 通过用户名和密码查到该用户的角色
	role, exists := interceptor.userStore[vo.Auth{user, pass}]
	if !exists {
		return ctx, status.Error(codes.Unauthenticated, "Provide user name and password")
	}
	// 从MethodAnnotationStore中查出可以访问该gRPC方法的角色列表
	params := MethodAnnotationStore.GetParams(method, "@role")
	// 判断该用户的角色是否包含在角色列表中，如果在，则通过了鉴权，如果不在，则拒绝访问
	if !sliceutils.StringContains(params, role.StringGetter()) {
		return ctx, status.Error(codes.PermissionDenied, "Access denied")
	}
	return ctx, nil
}
```

### main函数

```go
func main() {
	conf := config.LoadFromEnv()

	svc := service.NewAnnotation(conf)

  // 模拟数据库用户角色表的基于内存的数据结构
	userStore := vo.UserStore{
		vo.Auth{
			User: "guest",
			Pass: "guest",
		}: vo.GUEST,
		vo.Auth{
			User: "user",
			Pass: "user",
		}: vo.USER,
		vo.Auth{
			User: "admin",
			Pass: "admin",
		}: vo.ADMIN,
	}

  // 创建自定义的grpcx_auth.Authorizer接口实现
	authorizer := pb.NewAuthInterceptor(userStore)

	grpcServer := grpcx.NewGrpcServer(
		grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
			grpc_ctxtags.StreamServerInterceptor(),
			grpc_opentracing.StreamServerInterceptor(),
			grpc_prometheus.StreamServerInterceptor,
			logging.StreamServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
			// 将authorizer传入grpcx_auth拦截器中
			grpcx_auth.StreamServerInterceptor(authorizer),
			grpc_recovery.StreamServerInterceptor(),
		)),
		grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
			grpc_ctxtags.UnaryServerInterceptor(),
			grpc_opentracing.UnaryServerInterceptor(),
			grpc_prometheus.UnaryServerInterceptor,
			logging.UnaryServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
			// 将authorizer传入grpcx_auth拦截器中
			grpcx_auth.UnaryServerInterceptor(authorizer),
			grpc_recovery.UnaryServerInterceptor(),
		)),
	)
	pb.RegisterAnnotationServiceServer(grpcServer, svc)
	grpcServer.Run()
}
```

## 限流
### 用法

`go-doudou`内置了基于[golang.org/x/time/rate](https://pkg.go.dev/golang.org/x/time/rate)实现的令牌桶算法的内存限流器。

在`github.com/unionj-cloud/go-doudou/v2/framework/ratelimit/memrate`包里有一个`MemoryStore`结构体，存储了key和`Limiter`实例对。`Limiter`实例是限流器实例，key是该限流器实例的键。

你可以往`memrate.NewLimiter`工厂函数传入一个可选函数`memrate.WithTimer`，设置当key空闲时间超过`timeout`以后的回调函数，比如可以从`MemoryStore`实例里将该key删除，以释放内存资源。

`go-doudou`还提供了基于 [go-redis/redis_rate](https://github.com/go-redis/redis_rate) 库封装的GCRA限流算法的redis限流器。该限流器支持跨实例的全局限流。

### 内存限流器示例

内存限流器基于本机内存，只支持本机限流。首先需要调用 `memrate.NewMemoryStore` 创建一个 `MemoryStore` 实例，存储要限制的key和与之对应的限流器。然后调用 `grpcx_ratelimit.NewRateLimitInterceptor(grpcx_ratelimit.WithMemoryStore(mstore))` 创建一个 `grpcx_ratelimit.RateLimitInterceptor` 拦截器实例。然后需要自定义一个 `grpcx_ratelimit.KeyGetter` 接口的实现结构体，实现从 `context.Context` 提取key的逻辑。最后在拦截器链
中加入代码 `rl.UnaryServerInterceptor(keyGetter),` 即可实现限流。下面是一个对客户端ip限流的示例。

```go
func main() {
	defer etcd.CloseEtcdClient()
	conf := config.LoadFromEnv()
	svc := service.NewHelloworld(conf)

	go func() {
		mstore := memrate.NewMemoryStore(func(_ context.Context, store *memrate.MemoryStore, key string) ratelimit.Limiter {
      // 限流器创建函数，表示创建一个每秒允许处理10次请求，峰值最多允许处理30次请求，同时空闲时间最长10秒的限流器。空闲超过10秒会从内存中删除，已释放内存空间。
      // 空闲时间至少要大于 1 / rate * burst 才有意义，也就是至少要等令牌桶重新填满恢复初始状态以后。
			return memrate.NewLimiter(10, 30, memrate.WithTimer(10*time.Second, func() {
				store.DeleteKey(key)
			}))
		})
		rl := grpcx_ratelimit.NewRateLimitInterceptor(grpcx_ratelimit.WithMemoryStore(mstore))
		keyGetter := &RateLimitKeyGetter{}
		grpcServer := grpcx.NewGrpcServer(
			grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
        // 本示例中必须加grpc_ctxtags拦截器，它会自动帮我们往上下文context.Context中加入RPC调用方的"peer.address"信息
				grpc_ctxtags.StreamServerInterceptor(),
				grpc_opentracing.StreamServerInterceptor(),
				grpc_prometheus.StreamServerInterceptor,
				logging.StreamServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
				rl.StreamServerInterceptor(keyGetter),
				grpc_recovery.StreamServerInterceptor(),
			)),
			grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
        // 本示例中必须加grpc_ctxtags拦截器，它会自动帮我们往上下文context.Context中加入RPC调用方的"peer.address"信息
				grpc_ctxtags.UnaryServerInterceptor(),
				grpc_opentracing.UnaryServerInterceptor(),
				grpc_prometheus.UnaryServerInterceptor,
				logging.UnaryServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
				rl.UnaryServerInterceptor(keyGetter),
				grpc_recovery.UnaryServerInterceptor(),
			)),
		)
		pb.RegisterHelloworldServiceServer(grpcServer, svc)
		grpcServer.Run()
	}()

	handler := httpsrv.NewHelloworldHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

自定义 `grpcx_ratelimit.KeyGetter` 接口的实现结构体：

```go
var _ grpcx_ratelimit.KeyGetter = (*RateLimitKeyGetter)(nil)

type RateLimitKeyGetter struct {
}

func (r *RateLimitKeyGetter) GetKey(ctx context.Context, _ string) string {
	var peerAddr string
	if value, ok := grpc_ctxtags.Extract(ctx).Values()["peer.address"]; ok {
		peerAddr = value.(string)
	}
	if stringutils.IsEmpty(peerAddr) {
		if value, ok := peer.FromContext(ctx); ok {
			peerAddr = value.Addr.String()
		}
	}
	return peerAddr[:strings.LastIndex(peerAddr, ":")]
}
```

### Redis限流器示例

Redis限流器可以用于需要多个实例同时对一个key限流的场景。**key的过期时间等于根据速率计算的生成1个令牌所需的时间**。

```go
func main() {
	defer etcd.CloseEtcdClient()
	conf := config.LoadFromEnv()
	svc := service.NewHelloworld(conf)

	go func() {
    rdb := redis.NewClient(&redis.Options{
			Addr: "localhost:6379",
		})
		fn := redisrate.LimitFn(func(ctx context.Context) ratelimit.Limit {
      // 限流器创建函数，表示创建一个每秒允许处理10次请求，峰值最多允许处理30次请求的限流器。
			return ratelimit.PerSecondBurst(10, 30)
		})
		rl := grpcx_ratelimit.NewRateLimitInterceptor(grpcx_ratelimit.WithRedisStore(rdb, fn))
		keyGetter := &RateLimitKeyGetter{}
		grpcServer := grpcx.NewGrpcServer(
			grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
        // 本示例中必须加grpc_ctxtags拦截器，它会自动帮我们往上下文context.Context中加入RPC调用方的"peer.address"信息
				grpc_ctxtags.StreamServerInterceptor(),
				grpc_opentracing.StreamServerInterceptor(),
				grpc_prometheus.StreamServerInterceptor,
				logging.StreamServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
				rl.StreamServerInterceptor(keyGetter),
				grpc_recovery.StreamServerInterceptor(),
			)),
			grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
        // 本示例中必须加grpc_ctxtags拦截器，它会自动帮我们往上下文context.Context中加入RPC调用方的"peer.address"信息
				grpc_ctxtags.UnaryServerInterceptor(),
				grpc_opentracing.UnaryServerInterceptor(),
				grpc_prometheus.UnaryServerInterceptor,
				logging.UnaryServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
				rl.UnaryServerInterceptor(keyGetter),
				grpc_recovery.UnaryServerInterceptor(),
			)),
		)
		pb.RegisterHelloworldServiceServer(grpcServer, svc)
		grpcServer.Run()
	}()

	handler := httpsrv.NewHelloworldHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

自定义 `grpcx_ratelimit.KeyGetter` 接口的实现结构体示例请参考上文内存限流器示例。

## 重试 

实现重试机制需要依赖第三方开源库 `github.com/grpc-ecosystem/go-grpc-middleware` 的  `retry` 模块，将重试拦截器加入 `dialOptions` 切片中，再将 `dialOptions` 作为入参放入负载均衡客户端工厂函数中创建gRPC客户端连接实例。具体用法请参考源码中的注释：[https://github.com/grpc-ecosystem/go-grpc-middleware/blob/master/retry](https://github.com/grpc-ecosystem/go-grpc-middleware/blob/master/retry)。

```go
tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())

opts := []grpc_retry.CallOption{
	grpc_retry.WithBackoff(grpc_retry.BackoffLinear(100 * time.Millisecond)),
	grpc_retry.WithCodes(codes.NotFound, codes.Aborted),
}

dialOptions := []grpc.DialOption{
	tlsOption,
	grpc.WithStreamInterceptor(grpc_middleware.ChainStreamClient(
		grpc_retry.StreamClientInterceptor(opts...),
	)),
	grpc.WithUnaryInterceptor(grpc_middleware.ChainUnaryClient(
		grpc_retry.UnaryClientInterceptor(opts...),
	)),
}

grpcConn := nacos.NewWRRGrpcClientConn(nacos.NacosConfig{
	ServiceName: "grpcdemo-server_grpc",
}, dialOptions...)
defer grpcConn.Close()
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

集成Jaeger调用链监控需要以下步骤：

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

4. 服务端在调用 `grpcx.NewGrpcServer` 函数创建 `grpcx.GrpcServer` 实例时通过 `grpc_opentracing.StreamServerInterceptor(),` 和 `grpc_opentracing.UnaryServerInterceptor(),` 两行代码加上opentracing拦截器  

```go
func main() {
	defer nacos.CloseNamingClient()
	conf := config.LoadFromEnv()

	tracer, closer := tracing.Init()
	defer closer.Close()
	opentracing.SetGlobalTracer(tracer)
	
	svc := service.NewHelloworld(conf)
	grpcServer := grpcx.NewGrpcServer(
		grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
			grpc_ctxtags.StreamServerInterceptor(),
			grpc_opentracing.StreamServerInterceptor(),
			grpc_prometheus.StreamServerInterceptor,
			logging.StreamServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
			grpc_recovery.StreamServerInterceptor(),
		)),
		grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
			grpc_ctxtags.UnaryServerInterceptor(),
			grpc_opentracing.UnaryServerInterceptor(),
			grpc_prometheus.UnaryServerInterceptor,
			logging.UnaryServerInterceptor(grpczerolog.InterceptorLogger(zlogger.Logger)),
			grpc_recovery.UnaryServerInterceptor(),
		)),
	)
	pb.RegisterHelloworldServiceServer(grpcServer, svc)
	grpcServer.Run()
}
```

5. 客户端也需要给grpc客户端连接实例加上opentracing拦截器，使客户端在发起gRPC请求的时候可以由opentracing实现（jaeger）将span id注入metadata，否则和服务端的调用链串不起来。

```go
func main() {
	defer nacos.CloseNamingClient()
	conf := config.LoadFromEnv()

	tracer, closer := tracing.Init()
	defer closer.Close()
	opentracing.SetGlobalTracer(tracer)

	tlsOption := grpc.WithTransportCredentials(insecure.NewCredentials())

	dialOptions := []grpc.DialOption{
		tlsOption,
		grpc.WithStreamInterceptor(grpc_middleware.ChainStreamClient(
			grpc_opentracing.StreamClientInterceptor(),
		)),
		grpc.WithUnaryInterceptor(grpc_middleware.ChainUnaryClient(
			grpc_opentracing.UnaryClientInterceptor(),
		)),
	}

	grpcConn := nacos.NewWRRGrpcClientConn(nacos.NacosConfig{
		ServiceName: "grpcdemo-server_grpc",
	}, dialOptions...)
	defer grpcConn.Close()

	restProvider := nacos.NewWRRServiceProvider("grpcdemo-server_rest")
	svc := service.NewEnumDemo(conf, pb.NewHelloworldServiceClient(grpcConn),
		client.NewHelloworldClient(ddclient.WithClient(newClient()), ddclient.WithProvider(restProvider)))
	handler := httpsrv.NewEnumDemoHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

### 截图
![jaeger3](/images/jaeger3.jpeg)
![jaeger4](/images/jaeger4.jpeg)  

