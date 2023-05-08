
![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3158223bb49441e695370bee3ae570a2~tplv-k3u1fbpfcp-watermark.image?)
Photo by [NEOM](https://unsplash.com/@neom?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/yUcH008GS6A?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText)

我们在基于go语言的微服务实践和交流中，了解到一部分过去以Java技术专为主的公司或者技术团队已经在用dubbo-go框架开发微服务与遗留的Java服务共同构成异构的系统，而部分技术团队又有采用go-doudou微服务框架进行敏捷开发，快速实现服务上线和服务交付的诉求。可是问题来了，go-doudou能否跟已有的dubbo生态的服务互通互调，加入已有的微服务架构体系中呢？go-doudou从v2.0.8版本起实现了基于zookeeper的服务注册与发现机制，跟采用dubbo框架写的服务可以通过gRPC协议互通互调。本文通过一个简单的案例来演示如何上手go-doudou微服务框架，同时实现与dubbo-go写的服务互通互调。示例代码仓库地址：https://github.com/unionj-cloud/go-doudou-tutorials/tree/master/dubbodemo

# 工程结构说明

```shell
.
├── README.md
├── docker-compose.yml
├── dubbo
│   ├── go.mod
│   ├── go.sum
│   └── rpc
│       └── grpc
│           ├── go-client    # dubbo gRPC服务消费者
│           ├── go-server    # dubbo gRPC服务提供者
│           ├── protobuf
│           └── service-b
├── service-a                      # go-doudou RESTful服务a
└── service-b                      # go-doudou gRPC服务b
```
此演示工程由三个微服务+一个客户端程序构成。  
三个微服务分别是：
1. service-a：采用go-doudou框架的RESTful服务，通过调用该服务的接口演示go-doudou调用dubbo-go的gRPC服务；
2. service-b：采用go-doudou框架的gRPC服务，用于演示被dubbo-go的客户端调用；
3. go-server：采用dubbo-go框架的gRPC服务，用于演示被go-doudou的客户端调用；  

一个客户端程序是：
1. go-client：采用dubbo-go框架的客户端程序，用于演示dubbo-go调用go-doudou的gRPC服务；

# 启动zookeeper
我们首先需要通过docker-compose启动三节点的zookeeper集群，执行命令`docker-compose -f docker-compose.yml up -d --remove-orphans`。
```yaml
# docker-compose.yml
version: '3.1'

services:
  zoo1:
    image: zookeeper
    restart: always
    hostname: zoo1
    ports:
      - 2181:2181
    environment:
      ZOO_MY_ID: 1
      ZOO_SERVERS: server.1=zoo1:2888:3888;2181 server.2=zoo2:2888:3888;2181 server.3=zoo3:2888:3888;2181

  zoo2:
    image: zookeeper
    restart: always
    hostname: zoo2
    ports:
      - 2182:2181
    environment:
      ZOO_MY_ID: 2
      ZOO_SERVERS: server.1=zoo1:2888:3888;2181 server.2=zoo2:2888:3888;2181 server.3=zoo3:2888:3888;2181

  zoo3:
    image: zookeeper
    restart: always
    hostname: zoo3
    ports:
      - 2183:2181
    environment:
      ZOO_MY_ID: 3
      ZOO_SERVERS: server.1=zoo1:2888:3888;2181 server.2=zoo2:2888:3888;2181 server.3=zoo3:2888:3888;2181
```
启动后我们可以通过prettyZoo连接localhost:2181查看节点，目前还没有任何服务注册上去。

![](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6c370c3df18c439a873ec5be02a1bcf8~tplv-k3u1fbpfcp-zoom-1.image)

# 启动service-b
切到service-b的路径下执行命令`go run cmd/main.go`，看到下图红框中的三行日志输出即表示服务已启动。
![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d97b13b2848f422896c63e1222a07b9a~tplv-k3u1fbpfcp-watermark.image?)
此时我们再看prettyZoo，可以看到cloud.unionj.ServiceB_grpc服务已经注册上去了。
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e799de7c45bc454f8834eb54f343d224~tplv-k3u1fbpfcp-watermark.image?)
providers后面的节点`grpc%3A%2F%2F192.168.189.126%3A50051%2Fcloud.unionj.ServiceB_grpc%3Fgroup%3Dgroup%26rootPath%3D%26version%3Dv2.2.2%26weight%3D1`是url转义后的字符串，转义前的内容是`grpc://192.168.189.126:50051/cloud.unionj.ServiceB_grpc?group=group&rootPath=&version=v2.2.2&weight=1`。这个节点的内容和格式化规则都是与dubbo生态兼容的，所以可以做到与dubbo生态的服务互相发现。下面进一步说明：

1. `grpc://`：表示通信协议，这里是gRPC协议。go-doudou目前仅支持http和gRPC；
2. `192.168.189.126`：表示服务注册host，默认取主机私有ip。可以通过环境变量`GDD_REGISTER_HOST`自定义配置；
3. `50051`：表示gRPC服务端口号，默认50051。可以通过环境变量`GDD_GRPC_PORT`自定义配置；
4. `cloud.unionj.ServiceB_grpc`：表示服务名称，由用户配置的服务名称+下划线+通信协议构成。因为go-doudou框架支持启动同一套代码同时提供http协议的RESTful服务和gRPC协议的RPC服务，所以需要拼接下划线+通信协议以作区分。本例中用户通过环境变量`GDD_SERVICE_NAME`配置的服务名称是cloud.unionj.ServiceB，由go-doudou拼上了`_grpc`；
5. `group`：表示服务组名，可以通过环境变量`GDD_SERVICE_GROUP`自定义配置；
6. `version`：表示服务版本，可以通过环境变量`GDD_SERVICE_VERSION`自定义配置。服务名称+服务组名+服务版本共同唯一标识一个服务，有一个不匹配则无法调通服务；
7. `rootPath`：表示接口路径前缀，只在http协议下有效；
8. `weight`：表示服务实例的权重，用于客户端负载均衡，默认1。可以通过环境变量`GDD_WEIGHT`自定义配置；

我们再来看一下ServiceB服务提供的RPC接口。
```go
// svc.go
package service

import (
   "context"
   "service-b/dto"
)

//go:generate go-doudou svc http -c
//go:generate go-doudou svc grpc

type ServiceB interface {
   GetDeptById(ctx context.Context, deptId int) (dept dto.DeptDto, err error)
}
```
从svc.go文件我们可以看出ServiceB服务只定义了一个RPC接口，入参是部门id，出参是部门DTO和错误err。我们再看一下接口是怎么实现的。
```go
// svcimpl.go
func (receiver *ServiceBImpl) GetDeptByIdRpc(ctx context.Context, request *pb.GetDeptByIdRpcRequest) (*pb.DeptDto, error) {
   return &pb.DeptDto{
      Id:         request.DeptId,
      Name:       "测试部门",
      StaffTotal: 10,
   }, nil
}
```
实现逻辑非常简单，返回的部门名称都是"测试部门"，部门id取入参传进来的值。

# 启动go-server
切到`dubbo/rpc/grpc/go-server`路径下，执行命令`go run cmd/server.go`。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a0a61f846978418bba1ac5a4e78f7bc0~tplv-k3u1fbpfcp-watermark.image?)
dubbo-go服务启动时的日志输出比较长，能看到上面截图中的日志输出即表示服务启动并注册成功了。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/218d6c3cc4974509b17be921d3fe7643~tplv-k3u1fbpfcp-watermark.image?)
我们通过prettyZoo也可以看到dubbo-go注册上去的节点。  
关于dubbo-go的用法，用过或者在用dubbo-go的同学不需要再介绍了，也不是本文的重点。
打开server.go文件，我们看一下go-server提供的接口实现。
```go
type GreeterProvider struct {
   pb.GreeterProviderBase
}

func (g *GreeterProvider) SayHello(ctx context.Context, req *pb.HelloRequest) (reply *pb.HelloReply, err error) {
   fmt.Printf("req: %v", req)
   return &pb.HelloReply{Message: "this is message from reply"}, nil
}
```
非常简单，只是一个SayHello的RPC接口。

# 启动service-a
切到service-a并执行命令`go run cmd/main.go`。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bec098bca54e4667a5d428217075ccad~tplv-k3u1fbpfcp-watermark.image?)
当看到输出如上图所示日志即表示服务启动成功了。我们再通过prettyZoo看一下服务注册节点。

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/74b27985feae4846a119cbb00aed66d2~tplv-k3u1fbpfcp-watermark.image?)
cloud.unionj.ServiceA_rest就是service-a注册到zookeeper上的节点。

我们看一下service-a提供的RESTful接口。
```go
package service

import (
   "context"
   "service-a/dto"
)

//go:generate go-doudou svc http -c
//go:generate go-doudou svc grpc

type ServiceA interface {
   GetUserById(ctx context.Context, userId int) (user dto.UserDto, err error)
   GetRpcUserById(ctx context.Context, userId int) (user dto.UserDto, err error)
   GetRpcSayHello(ctx context.Context, name string) (reply string, err error)
}
```
重点看一下`GetRpc`前缀的两个接口，它们是作为客户端调用gRPC服务的接口。`GetRpcUserById`调用service-b服务，`GetRpcSayHello`调用go-server服务。我们继续看一下ServiceA的接口实现代码。  

```go
var _ ServiceA = (*ServiceAImpl)(nil)

type ServiceAImpl struct {
   conf          *config.Config
   bClient       client.IServiceBClient
   grpcClient    pb.ServiceBServiceClient
   greeterClient protobuf.GreeterClient
}
```
ServiceA的接口实现结构体ServiceAImpl上挂了两个gRPC客户端成员变量：
1. grpcClient：service-b的gRPC客户端
2. greeterClient：go-server的gRPC客户端

这两个客户端是在main.go文件中注入进来的：
```
// 建立一个基于zk的到ServiceB的gRPC连接，内置了平滑加权负载均衡
grpcConn := zk.NewSWRRGrpcClientConn(zk.ServiceConfig{
   Name:    "cloud.unionj.ServiceB_grpc",
   Group:   "group",
   Version: "v2.2.2",
}, dialOptions...)
defer grpcConn.Close()

// 建立一个基于zk的到go-server工程的UserProvider服务的gRPC连接，内置了平滑加权负载均衡
uConn := zk.NewSWRRGrpcClientConn(zk.ServiceConfig{
   Name:    "org.apache.dubbo.UserProvider",
   Group:   "group",
   Version: "v3",
}, dialOptions...)
defer uConn.Close()

svc := service.NewServiceA(conf, bClient, 
    pb.NewServiceBServiceClient(grpcConn), // 注入pb.ServiceBServiceClient
    protobuf.NewGreeterClient(uConn),   // 注入protobuf.GreeterClient
)
```
建立gRPC的客户端连接需要依赖服务端生成的pb文件。ServiceB的pb文件在下图所示的路径下。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/9615d66e4ef24cfe9a6e30de6d72ea95~tplv-k3u1fbpfcp-watermark.image?)

go-server工程的UserProvider服务的pb文件在下图所示路径下。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6dd16d9102d8473e94fee572e2f3139c~tplv-k3u1fbpfcp-watermark.image?)

`GetRpcUserById`和`GetRpcSayHello`的接口实现逻辑非常简单，请参考以下代码中的注释。
```go
// svcimpl.go
func (receiver *ServiceAImpl) GetRpcUserById(ctx context.Context, userId int) (user dto.UserDto, err error) {
   var _result struct {
      User dto.UserDto
   }
   // 通过gofakeit生成假数据
   _ = gofakeit.Struct(&_result)
   _result.User.Id = userId
   // 调用ServiceB的RPC接口查出部门详情deptDTO
   deptDto, err := receiver.grpcClient.GetDeptByIdRpc(ctx, &pb.GetDeptByIdRpcRequest{
      DeptId: 2,
   })
   if err != nil {
      errorx.Panic(err.Error())
   }
   // 将部门名称赋值给User对象的Dept属性
   _result.User.Dept = deptDto.Name
   return _result.User, nil
}

func (receiver *ServiceAImpl) GetRpcSayHello(ctx context.Context, name string) (reply string, err error) {
   // 调用go-server工程的UserProvider服务的RPC接口
   hr, err := receiver.greeterClient.SayHello(ctx, &protobuf.HelloRequest{
      Name: name,
   })
   if err != nil {
      errorx.Panic(err.Error())
   }
   return hr.Message, nil
}
```
下面我们通过curl命令重点测试一下GetRpcSayHello接口，验证go-doudou服务调用dubbo-go服务。
```
➜  dubbodemo git:(master) curl --location 'http://localhost:6060/rpc/say/hello?name=wubin'
{"reply":"this is message from reply"}
```
我们看到接口调通了。dubbo-go这边可以看到截图中的日志输出。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/02cf0574bbf943d9b726911023c680c2~tplv-k3u1fbpfcp-watermark.image?)

# 启动dubbo-go客户端
切到`dubbo/rpc/grpc/go-client`路径并执行命令`go run cmd/go-doudou/godoudou_client.go`。

![image.png](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1facbd571fbd47098f3fe34c1c12d2f0~tplv-k3u1fbpfcp-watermark.image?)

通过控制台输出我们可以看出dubbo-go的客户端调用go-doudou的ServiceB服务成功了。我们来分析一下godoudou_client.go文件中的代码。
```
import (
   // 导入service-b的pb代码依赖
   pb "github.com/apache/dubbo-go-samples/rpc/grpc/service-b"
)

// new一个ServiceB客户端结构体实例，用于做反射
var grpcServiceBImpl = new(pb.ServiceBServiceClientImpl)

func init() {
   // 设置dubbo-go配置文件加载路径
   os.Setenv("DUBBO_GO_CONFIG_PATH", "/Users/wubin1989/workspace/cloud/dubbo-go-samples/rpc/grpc/go-client/conf/dubbogo.yml")
   // 注册消费者
   config.SetConsumerService(grpcServiceBImpl)
}

func main() {
   if err := config.Load(); err != nil {
      panic(err)
   }

   gxlog.CInfo("\n\n\nstart to test dubbo")
   req := &pb.GetDeptByIdRpcRequest{
      DeptId: 1,
   }
   // 调用ServiceB的GetDeptByIdRpc接口
   reply, err := grpcServiceBImpl.GetDeptByIdRpc(context.TODO(), req)
   if err != nil {
      panic(err)
   }
   gxlog.CInfo("client response result: %v\n", reply)
}
```
代码逻辑非常简单，但是有一点需要注意：**go-doudou生成的gRPC的pb文件不能直接给dubbo-go的客户端作为依赖使用，必须用go-doudou生成的Protobuf文件结合dubbo-go的gRPC插件生成dubbo-go定制的pb文件**。所以笔者将ServiceB的proto文件复制出来放进了dubbo/rpc/grpc/service-b路径下，单独用protoc命令`protoc -I . serviceb.proto --dubbo3grpc_out=plugins=grpc+dubbo3grpc:.`生成出了serviceb.pb.go文件。关于dubbo-go的gRPC插件安装和用法请参考dubbo-go的相关文档。

# 总结
本文通过一个简单的演示项目讲解了go-doudou新特性基于zookeeper的服务注册与发现的用法，同时也演示了go-doudou和dubbo-go基于zookeeper通过gRPC协议互相调用的特性。go-doudou框架是一套傻瓜式的go语言微服务框架，无须额外学习任何IDL语言，只要会定义go接口即可一把生成全套REST服务和gRPC服务代码，同时在框架层面提供了全套的服务治理能力，可以说上手简单，但功能强大。欢迎各位同学学习和使用go-doudou框架来开发你的下一个项目！




