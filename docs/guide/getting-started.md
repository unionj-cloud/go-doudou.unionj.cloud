# 快速开始

## 先决条件

- 只支持go1.16及以上

## 安装gRPC编译器和插件

### 安装编译器protoc

安装Protobuf编译器protoc，可参考[官方文档](https://grpc.io/docs/protoc-installation/)，这里贴一下常见操作系统下的安装命令：

- Ubuntu系统:

```shell
$ apt install -y protobuf-compiler
$ protoc --version  # 确保安装v3及以上版本
```

- Mac系统，需要先安装[Homebrew](https://brew.sh/):

```shell
$ brew install protobuf
$ protoc --version  # 确保安装v3及以上版本
```

- Windows系统，或者Mac系统安装Homebrew失败，需从github下载安装包，解压后，自行配置环境变量。  
  Windows系统最新protoc下载地址：[https://github.com/protocolbuffers/protobuf/releases/download/v21.7/protoc-21.7-win64.zip](https://github.com/protocolbuffers/protobuf/releases/download/v21.7/protoc-21.7-win64.zip)
	Mac系统Intel最新protoc下载地址：[https://github.com/protocolbuffers/protobuf/releases/download/v21.7/protoc-21.7-osx-x86_64.zip](https://github.com/protocolbuffers/protobuf/releases/download/v21.7/protoc-21.7-osx-x86_64.zip)  
	其他安装包请在 [github releases](https://github.com/protocolbuffers/protobuf/releases) 里找。

### 安装插件 

1. 安装插件:

```shell
$ go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28
$ go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2
```

2. 配置环境变量:

```shell
$ export PATH="$PATH:$(go env GOPATH)/bin"
```

::: tip
最新版本号请跳转 [https://grpc.io/docs/languages/go/quickstart/](https://grpc.io/docs/languages/go/quickstart/) 查找。
:::

## 安装go-doudou
- 如果Go版本低于1.17
```shell
go get -v github.com/unionj-cloud/go-doudou/v2@v2.0.6
```

- 如果Go版本 >= 1.17，推荐采用如下命令全局安装`go-doudou`命令行工具
```shell
go install -v github.com/unionj-cloud/go-doudou/v2@v2.0.6
```
推荐采用如下命令下载go-doudou作为项目的依赖
```shell
go get -v -d github.com/unionj-cloud/go-doudou/v2@v2.0.6
```

::: tip
如果遇到`410 Gone error`报错，请先执行如下命令，再执行上述的安装命令

```shell
export GOSUMDB=off
``` 

安装完成后，如果遇到`go-doudou: command not found`报错，请将`$HOME/go/bin`配置到`~/.bash_profile`文件里，例如：

```shell
# .bash_profile

# Get the aliases and functions
if [ -f ~/.bashrc ]; then
	. ~/.bashrc
fi

# User specific environment and startup programs

PATH=$PATH:/usr/local/go/bin
PATH=$PATH:$HOME/go/bin

export PATH
```

:::

## 升级
你可以执行命令`go-doudou version`来升级全局安装的`go-doudou`命令行工具
```shell
➜  ~ go-doudou version                       
Installed version is v1.1.9
Latest release version is v2.0.6
✔ Yes
go install -v github.com/unionj-cloud/go-doudou/v2@v2.0.6
go: downloading github.com/unionj-cloud/go-doudou/v2 v2.0.6
github.com/unionj-cloud/go-doudou/v2/toolkit/constants
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/extraenum
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/keyenum
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/columnenum
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/config
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/nullenum
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/sortenum
github.com/unionj-cloud/go-doudou/v2/version
github.com/unionj-cloud/go-doudou/v2/toolkit/openapi/v3
github.com/unionj-cloud/go-doudou/v2/toolkit/reflectutils
github.com/unionj-cloud/go-doudou/v2/toolkit/stringutils
github.com/unionj-cloud/go-doudou/v2/toolkit/caller
github.com/unionj-cloud/go-doudou/v2/toolkit/pathutils
github.com/unionj-cloud/go-doudou/v2/toolkit/sliceutils
github.com/unionj-cloud/go-doudou/v2/toolkit/templateutils
github.com/unionj-cloud/go-doudou/v2/toolkit/cast
github.com/unionj-cloud/go-doudou/v2/toolkit/zlogger
github.com/unionj-cloud/go-doudou/v2/cmd/internal/executils
github.com/unionj-cloud/go-doudou/v2/toolkit/copier
github.com/unionj-cloud/go-doudou/v2/cmd/internal/astutils
github.com/unionj-cloud/go-doudou/v2/toolkit/dotenv
github.com/unionj-cloud/go-doudou/v2/toolkit/yaml
github.com/unionj-cloud/go-doudou/v2/toolkit/sqlext/logger
github.com/unionj-cloud/go-doudou/v2/toolkit/sqlext/wrapper
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/ddlast
github.com/unionj-cloud/go-doudou/v2/cmd/internal/name
github.com/unionj-cloud/go-doudou/v2/cmd/internal/protobuf/v3
github.com/unionj-cloud/go-doudou/v2/cmd/internal/openapi/v3/codegen/client
github.com/unionj-cloud/go-doudou/v2/cmd/internal/openapi/v3
github.com/unionj-cloud/go-doudou/v2/cmd/internal/svc/codegen
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/table
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl/codegen
github.com/unionj-cloud/go-doudou/v2/cmd/internal/svc
github.com/unionj-cloud/go-doudou/v2/cmd/internal/ddl
github.com/unionj-cloud/go-doudou/v2/cmd
github.com/unionj-cloud/go-doudou/v2
DONE
➜  ~ go-doudou version
Installed version is v2.0.6
➜  ~ 
```  

## 用法

```shell
➜  ~ go-doudou -h                                 
go-doudou works like a scaffolding tool but more than that. 
it lets api providers design their apis and help them code less. 
it generates openapi 3.0 spec json document for frontend developers or other api consumers to understand what apis there, 
consumers can import it into postman to debug and test, or upload it into some code generators to download client sdk.
it provides some useful components and middleware for constructing microservice cluster like service register and discovering, 
load balancing and so on. it just begins, more features will come out soon.

Usage:
  go-doudou [flags]
  go-doudou [command]

Available Commands:
  ddl         migration tool between database table structure and golang struct
  help        Help about any command
  name        bulk add or update json tag of struct fields
  svc         generate or update service
  version     Print the version number of go-doudou

Flags:
  -h, --help      help for go-doudou
  -v, --version   version for go-doudou

Use "go-doudou [command] --help" for more information about a command.
```

## Hello World

### 初始化项目
执行 `go-doudou svc init` 命令，你可以设置`-m`参数，指定模块名称。
```shell
go-doudou svc init helloworld -m github.com/unionj-cloud/helloworld
```
这行命令会生成`helloworld`文件夹和一些初始化文件。
```
➜  helloworld git:(master) ✗ tree -a 
.
├── .env
├── .git
│   ├── HEAD
│   ├── objects
│   │   ├── info
│   │   └── pack
│   └── refs
│       ├── heads
│       └── tags
├── .gitignore
├── Dockerfile
├── go.mod
├── svc.go
└── vo
    └── vo.go

8 directories, 7 files
```
- `Dockerfile`：用于打包docker镜像

- `svc.go`: 在这个文件里的`Helloworld`接口里面定义方法，go-doudou通过你定义的方法生成对应的RESTful接口代码

- `vo`包：里面定义`view object`结构体，用于请求体和响应体，可以手动创建多个go文件，`vo`包里定义的结构体都会作为`OpenAPI 3.0`的`schema`生成到json格式的接口文档中

- `.env`: 配置文件，里面的配置会被加载到环境变量里

### 定义接口

`svc.go`文件相当于是接口定义文件，我们在`Helloworld`接口里定义方法就是在定义接口。我们现在注释掉默认生成的例子`PageUsers`方法，定义我们自己的一个接口`Greeting`。请参阅[Define API](./idl.md) 章节内容了解更多。

```go
/**
* Generated by go-doudou v2.0.6.
* You can edit it as your need.
 */
package service

import (
	"context"
)

//go:generate go-doudou svc http -c
//go:generate go-doudou svc grpc

type Helloworld interface {
	Greeting(ctx context.Context, greeting string) (data string, err error)
}
```

### 生成代码
先执行如下命令
```shell
go-doudou svc http -c
```
然后再执行`go mod tidy`来下载依赖。如果你使用的Go版本是1.17，你可能会看到如下提示信息：
```
To upgrade to the versions selected by go 1.16:
	go mod tidy -go=1.16 && go mod tidy -go=1.17
If reproducibility with go 1.16 is not needed:
	go mod tidy -compat=1.17
For other options, see:
	https://golang.org/doc/modules/pruning
```
这时你需要执行命令`go mod tidy -go=1.16 && go mod tidy -go=1.17`或者`go mod tidy -compat=1.17`。
让我们看看生成了什么。

```shell
.
├── Dockerfile
├── client
│   ├── client.go
│   ├── clientproxy.go
│   └── iclient.go
├── cmd
│   └── main.go
├── config
│   └── config.go
├── db
│   └── db.go
├── go.mod
├── go.sum
├── helloworld_openapi3.go
├── helloworld_openapi3.json
├── svc.go
├── svcimpl.go
├── transport
│   └── httpsrv
│       ├── handler.go
│       ├── handlerimpl.go
│       └── middleware.go
└── vo
    └── vo.go
```

- `helloworld_openapi3.json`: json格式的`OpenAPI 3.0`接口文档
- `helloworld_openapi3.go`: 将`OpenAPI 3.0`接口文档的内容赋值给一个全局的变量用于在线浏览
- `client`包: 基于[resty](https://github.com/go-resty/resty) 封装的Go语言http请求客户端代码
- `cmd`包: 整个程序的入口
- `config`包: 用于加载与业务相关的配置
- `db`包: 连接数据库的工具代码
- `svcimpl.go`: 在这个文件中实现接口，编写真实的业务逻辑代码
- `transport`包: http网络层代码，主要负责解析入参和编码出参

### 启动服务
执行命令`go-doudou svc run`
```shell
➜  helloworld git:(master) ✗ go-doudou svc run
2022/11/06 21:46:19 maxprocs: Leaving GOMAXPROCS=16: CPU quota undefined
                           _                    _
                          | |                  | |
  __ _   ___   ______   __| |  ___   _   _   __| |  ___   _   _
 / _` | / _ \ |______| / _` | / _ \ | | | | / _` | / _ \ | | | |
| (_| || (_) |        | (_| || (_) || |_| || (_| || (_) || |_| |
 \__, | \___/          \__,_| \___/  \__,_| \__,_| \___/  \__,_|
  __/ |
 |___/
2022-11-06 21:46:19 INF ================ Registered Routes ================
2022-11-06 21:46:19 INF +----------------------+--------+-------------------------+
2022-11-06 21:46:19 INF |         NAME         | METHOD |         PATTERN         |
2022-11-06 21:46:19 INF +----------------------+--------+-------------------------+
2022-11-06 21:46:19 INF | Greeting             | POST   | /greeting               |
2022-11-06 21:46:19 INF | GetDoc               | GET    | /go-doudou/doc          |
2022-11-06 21:46:19 INF | GetOpenAPI           | GET    | /go-doudou/openapi.json |
2022-11-06 21:46:19 INF | Prometheus           | GET    | /go-doudou/prometheus   |
2022-11-06 21:46:19 INF | GetConfig            | GET    | /go-doudou/config       |
2022-11-06 21:46:19 INF | GetStatsvizWs        | GET    | /go-doudou/statsviz/ws  |
2022-11-06 21:46:19 INF | GetStatsviz          | GET    | /go-doudou/statsviz/*   |
2022-11-06 21:46:19 INF | GetDebugPprofCmdline | GET    | /debug/pprof/cmdline    |
2022-11-06 21:46:19 INF | GetDebugPprofProfile | GET    | /debug/pprof/profile    |
2022-11-06 21:46:19 INF | GetDebugPprofSymbol  | GET    | /debug/pprof/symbol     |
2022-11-06 21:46:19 INF | GetDebugPprofTrace   | GET    | /debug/pprof/trace      |
2022-11-06 21:46:19 INF | GetDebugPprofIndex   | GET    | /debug/pprof/*          |
2022-11-06 21:46:19 INF +----------------------+--------+-------------------------+
2022-11-06 21:46:19 INF ===================================================
2022-11-06 21:46:19 INF Http server is listening at :6060
2022-11-06 21:46:19 INF Http server started in 1.993608ms
```

### Postman
将`helloworld_openapi3.json`文件导入postman，测试`/greeting`接口。你可以看到返回了假数据。
![greeting](/images/greeting.png)

### 实现接口
现在我们要在`svcimpl.go`文件里实现真实的业务逻辑了。让我们先来看一下现在的代码。
```go
/**
* Generated by go-doudou v2.0.6.
* You can edit it as your need.
 */
package service

import (
	"context"

	"github.com/brianvoe/gofakeit/v6"
	"github.com/unionj-cloud/helloworld/config"
)

var _ Helloworld = (*HelloworldImpl)(nil)

type HelloworldImpl struct {
	conf *config.Config
}

func (receiver *HelloworldImpl) Greeting(ctx context.Context, greeting string) (data string, err error) {
	var _result struct {
		Data string
	}
	_ = gofakeit.Struct(&_result)
	return _result.Data, nil
}

func NewHelloworld(conf *config.Config) *HelloworldImpl {
	return &HelloworldImpl{
		conf: conf,
	}
}
```
我们采用[gofakeit](github.com/brianvoe/gofakeit) 这个库帮我们生成假数据。我们首先需要删掉这些代码。
```go
/**
* Generated by go-doudou v2.0.6.
* You can edit it as your need.
 */
package service

import (
	"context"
	"fmt"

	"github.com/unionj-cloud/helloworld/config"
)

var _ Helloworld = (*HelloworldImpl)(nil)

type HelloworldImpl struct {
	conf *config.Config
}

func (receiver *HelloworldImpl) Greeting(ctx context.Context, greeting string) (data string, err error) {
	return fmt.Sprintf("Hello %s", greeting), nil
}

func NewHelloworld(conf *config.Config) *HelloworldImpl {
	return &HelloworldImpl{
		conf: conf,
	}
}
```
我们删掉了第21~25行的代码，替换成了`return fmt.Sprintf("Hello %s", greeting), nil`。我们再测一下效果。
![greeting1](/images/greeting1.png)
用go-doudou写RESTful接口是不是非常简单！

### gRPC服务

下面我们来给项目加上gRPC服务。gRPC是go生态中最流行的rpc框架。gRPC采用`http2`作为网络协议加`protobuf`作为消息体序列化方案。开发gRPC服务的一般流程大概是以下几步：

1. 先按照`protobuf`的语法在`.proto`后缀的文件里定义`message`和`service`
2. 再执行类似`protoc --proto_path=. --go_out=. --go_opt=paths=source_relative --go-grpc_out=. --go-grpc_opt=paths=source_relative transport/grpc/helloworld.proto`这样的命令生成服务端和客户端打桩代码
3. 再自己定义结构体和方法实现类似`pb.HelloworldServiceServer`这样的接口，从而实现业务逻辑
4. 最后在`main`函数里加上类似

```go
...
grpcServer := grpc.NewServer(opts...)
pb.RegisterHelloworldServiceServer(grpcServer, svc)
grpcServer.Serve(lis)
```

这样的代码来启动gRPC服务。

如果采用`go-doudou`作为开发框架来开发gRPC服务的话，会简单很多。以上文的`Helloworld`项目为例，只需两步：

#### 生成gRPC代码

在项目根路径下执行命令`go-doudou svc grpc`，该命令直接为我们生成了`.proto`后缀的文件，服务端和客户端打桩代码，以及`svcimpl.go`文件里的`pb.HelloworldServiceServer`接口的实现方法，只等我们在生成的方法里实现具体的业务逻辑即可。 

此时的文件夹结构如下：

```shell
.
├── Dockerfile
├── client
│   ├── client.go
│   ├── clientproxy.go
│   └── iclient.go
├── cmd
│   └── main.go
├── config
│   └── config.go
├── db
│   └── db.go
├── go.mod
├── go.sum
├── helloworld_openapi3.go
├── helloworld_openapi3.json
├── svc.go
├── svcimpl.go
├── transport
│   ├── grpc
│   │   ├── annotation.go
│   │   ├── helloworld.pb.go
│   │   ├── helloworld.proto
│   │   └── helloworld_grpc.pb.go
│   └── httpsrv
│       ├── handler.go
│       ├── handlerimpl.go
│       └── middleware.go
└── vo
    └── vo.go
```

我们再看一下`svcimpl.go`文件，可以看到多了一个`GreetingRpc`方法，从而使`HelloworldImpl`结构体实现了`pb.HelloworldServiceServer`接口。

```go
func (receiver *HelloworldImpl) GreetingRpc(ctx context.Context, request *pb.GreetingRpcRequest) (*pb.GreetingRpcResponse, error) {
	//TODO implement me
	panic("implement me")
}
```

这里我们可以复用RESTful服务用到的`Greeting`方法，修改后的代码如下：

```go
func (receiver *HelloworldImpl) GreetingRpc(ctx context.Context, request *pb.GreetingRpcRequest) (*pb.GreetingRpcResponse, error) {
	data, err := receiver.Greeting(ctx, request.Greeting)
	if err != nil {
		return nil, err
	}
	return &pb.GreetingRpcResponse{
		Data: data,
	}, nil
}
```

#### 修改main函数

在`cmd`文件夹里的`main.go`文件的`main`函数里加入以下代码：

```go
go func() {
		grpcServer := ddgrpc.NewGrpcServer(
			grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
				grpc_ctxtags.StreamServerInterceptor(),
				grpc_opentracing.StreamServerInterceptor(),
				grpc_prometheus.StreamServerInterceptor,
				tags.StreamServerInterceptor(tags.WithFieldExtractor(tags.CodeGenRequestFieldExtractor)),
				logging.StreamServerInterceptor(grpczerolog.InterceptorLogger(logger.Logger)),
				grpc_recovery.StreamServerInterceptor(),
			)),
			grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
				grpc_ctxtags.UnaryServerInterceptor(),
				grpc_opentracing.UnaryServerInterceptor(),
				grpc_prometheus.UnaryServerInterceptor,
				tags.UnaryServerInterceptor(tags.WithFieldExtractor(tags.CodeGenRequestFieldExtractor)),
				logging.UnaryServerInterceptor(grpczerolog.InterceptorLogger(logger.Logger)),
				grpc_recovery.UnaryServerInterceptor(),
			)),
		)
		pb.RegisterHelloworldServiceServer(grpcServer, svc)
		grpcServer.Run()
	}()
```

然后在`go.mod`文件里加入以下依赖：

```
github.com/grpc-ecosystem/go-grpc-middleware v1.0.1-0.20190118093823-f849b5445de4
github.com/grpc-ecosystem/go-grpc-middleware/providers/zerolog/v2 v2.0.0-rc.2
github.com/grpc-ecosystem/go-grpc-middleware/v2 v2.0.0-rc.2
github.com/grpc-ecosystem/go-grpc-prometheus v1.2.0
```

执行命令`go mod tidy`后，完整的`main.go`文件代码如下：

```go
/**
* Generated by go-doudou v2.0.6.
* You can edit it as your need.
 */
package main

import (
	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	grpczerolog "github.com/grpc-ecosystem/go-grpc-middleware/providers/zerolog/v2"
	grpc_recovery "github.com/grpc-ecosystem/go-grpc-middleware/recovery"
	grpc_ctxtags "github.com/grpc-ecosystem/go-grpc-middleware/tags"
	grpc_opentracing "github.com/grpc-ecosystem/go-grpc-middleware/tracing/opentracing"
	"github.com/grpc-ecosystem/go-grpc-middleware/v2/interceptors/logging"
	grpc_prometheus "github.com/grpc-ecosystem/go-grpc-prometheus"
	"github.com/unionj-cloud/go-doudou/v2/framework/grpcx"
	"github.com/unionj-cloud/go-doudou/v2/framework/rest"
	"github.com/unionj-cloud/go-doudou/v2/toolkit/zlogger"
	service "github.com/unionj-cloud/helloworld"
	"github.com/unionj-cloud/helloworld/config"
	pb "github.com/unionj-cloud/helloworld/transport/grpc"
	"github.com/unionj-cloud/helloworld/transport/httpsrv"
	"google.golang.org/grpc"
)

func main() {
	conf := config.LoadFromEnv()
	svc := service.NewHelloworld(conf)

	go func() {
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
	}()

	handler := httpsrv.NewHelloworldHandler(svc)
	srv := rest.NewRestServer()
	srv.AddRoute(httpsrv.Routes(handler)...)
	srv.Run()
}
```

我们重启服务看一下。

```shell
➜  helloworld git:(master) ✗ go-doudou svc run
2022/11/06 22:01:24 maxprocs: Leaving GOMAXPROCS=16: CPU quota undefined
                           _                    _
                          | |                  | |
  __ _   ___   ______   __| |  ___   _   _   __| |  ___   _   _
 / _` | / _ \ |______| / _` | / _ \ | | | | / _` | / _ \ | | | |
| (_| || (_) |        | (_| || (_) || |_| || (_| || (_) || |_| |
 \__, | \___/          \__,_| \___/  \__,_| \__,_| \___/  \__,_|
  __/ |
 |___/
2022-11-06 22:01:24 INF ================ Registered Routes ================
2022-11-06 22:01:24 INF ================ Registered Services ================
2022-11-06 22:01:24 INF +------------------------------------------+----------------------+
2022-11-06 22:01:24 INF |                 SERVICE                  |         RPC          |
2022-11-06 22:01:24 INF +------------------------------------------+----------------------+
2022-11-06 22:01:24 INF | helloworld.HelloworldService             | GreetingRpc          |
2022-11-06 22:01:24 INF | grpc.reflection.v1alpha.ServerReflection | ServerReflectionInfo |
2022-11-06 22:01:24 INF +------------------------------------------+----------------------+
2022-11-06 22:01:24 INF ===================================================
2022-11-06 22:01:24 INF Grpc server is listening at [::]:50051
2022-11-06 22:01:24 INF Grpc server started in 5.905894ms
2022-11-06 22:01:24 INF +----------------------+--------+-------------------------+
2022-11-06 22:01:24 INF |         NAME         | METHOD |         PATTERN         |
2022-11-06 22:01:24 INF +----------------------+--------+-------------------------+
2022-11-06 22:01:24 INF | Greeting             | POST   | /greeting               |
2022-11-06 22:01:24 INF | GetDoc               | GET    | /go-doudou/doc          |
2022-11-06 22:01:24 INF | GetOpenAPI           | GET    | /go-doudou/openapi.json |
2022-11-06 22:01:24 INF | Prometheus           | GET    | /go-doudou/prometheus   |
2022-11-06 22:01:24 INF | GetConfig            | GET    | /go-doudou/config       |
2022-11-06 22:01:24 INF | GetStatsvizWs        | GET    | /go-doudou/statsviz/ws  |
2022-11-06 22:01:24 INF | GetStatsviz          | GET    | /go-doudou/statsviz/*   |
2022-11-06 22:01:24 INF | GetDebugPprofCmdline | GET    | /debug/pprof/cmdline    |
2022-11-06 22:01:24 INF | GetDebugPprofProfile | GET    | /debug/pprof/profile    |
2022-11-06 22:01:24 INF | GetDebugPprofSymbol  | GET    | /debug/pprof/symbol     |
2022-11-06 22:01:24 INF | GetDebugPprofTrace   | GET    | /debug/pprof/trace      |
2022-11-06 22:01:24 INF | GetDebugPprofIndex   | GET    | /debug/pprof/*          |
2022-11-06 22:01:24 INF +----------------------+--------+-------------------------+
2022-11-06 22:01:24 INF ===================================================
2022-11-06 22:01:24 INF Http server is listening at :6060
2022-11-06 22:01:24 INF Http server started in 1.450698ms
```

日志输出有点乱，是因为gRPC服务和RESTful服务分别在不同的goroutine中运行。如果只启动gRPC服务的话，日志输出会更清晰。  

当我们看到`Grpc server is listening at [::]:50051`就说明gRPC服务启动成功了。

### 测试gRPC

可以用postman测试gRPC服务，但这里不打算详细介绍了。

![postmangrpc](/images/postmangrpc.jpeg)

这里采用知名gRPC客户端工具`evans`来测试。详细介绍请跳转[https://github.com/ktr0731/evans](https://github.com/ktr0731/evans)。

请阅读代码中的注释说明，了解用法。

```shell
# 50051是grpc server监听的默认端口号
➜  helloworld git:(master) ✗ evans -r repl -p 50051

  ______
 |  ____|
 | |__    __   __   __ _   _ __    ___
 |  __|   \ \ / /  / _. | | '_ \  / __|
 | |____   \ V /  | (_| | | | | | \__ \
 |______|   \_/    \__,_| |_| |_| |___/

 more expressive universal gRPC client

# 查看grpc server提供了哪些服务和rpc接口
helloworld.HelloworldService@127.0.0.1:50051> show service
+-------------------+-------------+--------------------+---------------------+
|      SERVICE      |     RPC     |    REQUEST TYPE    |    RESPONSE TYPE    |
+-------------------+-------------+--------------------+---------------------+
| HelloworldService | GreetingRpc | GreetingRpcRequest | GreetingRpcResponse |
+-------------------+-------------+--------------------+---------------------+

# 切换到HelloworldService服务下，之后的call命令后面可以直接输入rpc名称了
helloworld.HelloworldService@127.0.0.1:50051> service HelloworldService

# 调用GreetingRpc接口，开启交互式终端，根据提示输入参数，输出返回值
helloworld.HelloworldService@127.0.0.1:50051> call GreetingRpc
greeting (TYPE_STRING) => Jack
{
  "data": "Hello Jack"
}

# 退出evans
helloworld.HelloworldService@127.0.0.1:50051> exit
Good Bye :)
```

我们输入"Jack"后，输出了"Hello Jack"，证明gRPC服务可以跑通。

我们可以看到gRPC服务所在的命令行终端的标签页中也输出了一行日志：

```shell
2022-11-06 22:02:54 INF finished server unary call grpc.code=OK grpc.method=GreetingRpc grpc.method_type=unary grpc.service=helloworld.HelloworldService grpc.start_time=2022-11-06T22:02:54+08:00 grpc.time_ms=0.026 kind=server system=grpc
```

### K8S部署
有很多种部署go语言的http服务的方案。我们这里将`helloworld`服务部署到k8s上。请参考[Deployment](./deployment.md) 章节来了解更多。
#### 构建docker镜像
执行命令`go-doudou svc push -r wubin1989`，别忘记将`wubin1989`改成你自己的远程镜像仓库。

```shell
...
v20221004215355: digest: sha256:31d4242cc6d27990e7cf562c285bd164c10914bceddc6a23068a52aa43c217be size: 1360
INFO[2022-10-04 22:01:37] image wubin1989/helloworld:v20221004215355 has been pushed successfully 
INFO[2022-10-04 22:01:37] k8s yaml has been created/updated successfully. execute command 'go-doudou svc deploy' to deploy service helloworld to k8s cluster 
```

当输出最后三行内容，即表示镜像已经成功打包并推到了远程仓库，同时你可以看到多了两个yaml格式的文件：`helloworld_deployment.yaml`和`helloworld_statefulset.yaml`

- `helloworld_deployment.yaml`: 用于部署无状态的服务
- `helloworld_statefulset.yaml`: 用于部署有状态的服务

#### 部署
::: tip
如果你还没有安装Docker for Desktop，请从[https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) 下载安装。如果你对docker和k8s不了解，请参考[官方文档](https://docs.docker.com/get-started/overview/)。
::: 
当执行命令`go-doudou svc deploy`时，默认采用`helloworld_statefulset.yaml`文件来部署有状态的应用。
```shell
go-doudou svc deploy
```

也可以通过加`-k`选项，后面跟文件路径，部署无状态服务：

```shell
go-doudou svc deploy -k helloworld_deployment.yaml
```

然后执行命令`kubectl get pods`，可以看到我们的服务已经在运行了。
```shell
➜  helloworld git:(master) ✗ kubectl get pods    
NAME                       READY   STATUS    RESTARTS   AGE
helloworld-statefulset-0   1/1     Running   0          11m
```
此时，你还不能通过`http://localhost:6060`访问服务。需要先配置一个端口转发。
```shell
export POD_NAME=$(kubectl get pods --namespace default -l "app=helloworld" -o jsonpath="{.items[0].metadata.name}")
```
然后
```shell
kubectl port-forward --namespace default $POD_NAME 6060:6060 
```
如果你看到命令行终端有如下内容输出，就可以用postman测试接口了。
```shell
➜  helloworld git:(master) ✗ export POD_NAME=$(kubectl get pods --namespace default -l "app=helloworld" -o jsonpath="{.items[0].metadata.name}")
➜  helloworld git:(master) ✗ kubectl port-forward --namespace default $POD_NAME 6060:6060                                               
Forwarding from 127.0.0.1:6060 -> 6060
Forwarding from [::1]:6060 -> 6060
```

#### 关闭服务
执行命令`go-doudou svc shutdown`可以关闭服务
```shell
go-doudou svc shutdown
```  
再次执行命令`kubectl get pods`，可以看到服务已经下线。
```shell
➜  helloworld git:(master) ✗ kubectl get pods                                                                                             
No resources found in default namespace.
```

