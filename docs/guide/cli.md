# 命令行工具

`go-doudou`内置了基于命令行终端的代码生成器。`go-doudou`是根命令，有两个参数。

- `-v` 打印当前安装的go-doudou命令行工具的版本

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou -v     
go-doudou version v2.0.3
```

- `-h` 打印帮助信息。下文介绍的所有的子命令都有这个参数，就不再介绍了。

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou -h
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

`go-doudou`还提供了若干子命令来加速整个开发流程。我们挨个看一下。

## version

`go-doudou version` 主要用于升级`go-doudou`命令行工具版本。它不仅打印当前安装版本的信息，还打印最新发布版本的信息，并且询问你是否要升级。

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou version
Installed version is v1.1.9
Latest release version is v2.0.3
Use the arrow keys to navigate: ↓ ↑ → ← 
? Do you want to upgrade?: 
  ▸ Yes
    No
```

## help

`go-doudou help` 同`go-doudou -h`。

## svc

`go-doudou svc` 是最重要和最常用的命令。

### init

`go-doudou svc init` 用于初始化go-doudou应用。你既可以在已有文件夹下执行此命令，也可以在`init`后面指定需要初始化的文件夹路径。如果文件夹不存在，`go-doudou`会创建该文件夹，并且生成一些文件来便于上手开发，还会执行`git init`命令。如果指定的文件夹已经存在并且不为空，`go-doudou`会跳过已存在的文件，只生成不存在的文件，保证已有的代码不会被覆盖。

```shell
➜  go-doudou-tutorials git:(master) go-doudou svc init helloworld
WARN[2022-02-17 18:14:53] file .gitignore already exists               
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/go.mod already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/.env already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/vo/vo.go already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/svc.go already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/Dockerfile already exists 
```

还有一个`-m` 参数，用于指定模块名称：
```shell
go-doudou svc init helloworld -m github.com/unionj-cloud/helloworld
```

### http

`go-doudou svc http` 用于生成RESTful接口的http路由和handler代码
```shell
go-doudou svc http -c
```

#### 参数

有一些参数可以配置代码生成器的行为。下面我们一一介绍一下：

- `-c` or `--client`: `bool` 类型。用于设置是否生成封装了[go-resty](https://github.com/go-resty/resty) 的http请求客户端代码。

- `-e` or `--env`: `string` 类型。用于设置写进http请求客户端代码里的服务端baseUrl的环境变量名。如果没有指定，默认采用`svc.go`文件里的字母大写的服务接口名。

```go
func NewHelloworldClient(opts ...ddhttp.DdClientOption) *HelloworldClient {
	defaultProvider := ddhttp.NewServiceProvider("HELLOWORLD")
	defaultClient := ddhttp.NewClient()

	...

	return svcClient
}
```

上面代码的第2行，`HELLOWORLD`就是默认名称。如前文所述，go-doudou同时支持开发单体应用。如果你不需要客户端程序加入go-doudou微服务集群，享受开箱即用的服务发现和客户端负载均衡机制，你可以直接在配置文件中将`HELLOWORLD`环境变量设置为服务端可以直连的请求地址。我们来执行一下命令`go-doudou svc http -c -e godoudou_helloworld`，看一下有什么变化。

```go
func NewHelloworldClient(opts ...ddhttp.DdClientOption) *HelloworldClient {
	defaultProvider := ddhttp.NewServiceProvider("godoudou_helloworld")
	defaultClient := ddhttp.NewClient()

	...

    return svcClient
}
```

- `--case`: `string` 类型。在生成的默认`http.Handler`接口实现代码里会有一些匿名结构体做为响应体，你可能需要设置这个参数来指定json序列化时的字段名称的命名规则。接受两种值：`lowerCamel` 和 `snake`。默认值为`lowerCamel`。

- `-o` or `--omitempty`: `bool` 类型。如果设置了这个参数，`,omitempty`会被加到默认`http.Handler`接口实现代码里的匿名结构体字段的json标签值的后面。

- `-r` or `--routePattern`: `int` 类型。这个参数用于设置http路由的生成规则。如果值为`0`，`go-doudou`会先将服务接口的方法名称从驼峰命令转成蛇形命令，然后把下划线`_`替换成反斜线`/`，结果作为接口路径。如果值为`1`，`go-doudou`会将服务接口名转成小写，方法名也转成小写，再用反斜线`/`拼接起来，结果作为接口路径。默认值为`0`。举个例子，假设`Usersvc`接口里有一个方法名为`PublicSignUp`，默认会生成`/public/sign/up`这样的接口路径。如果你将此参数设为`1`，则接口路径为`/usersvc/publicsignup`。

#### Subcommands

只有一个子命令 `client`，用于从json格式的`OpenAPI 3.0`接口文档生成Go语言http请求客户端代码。有几个参数可配置。我用一个例子说明：

```shell
go-doudou svc http client -o -e GRAPHHOPPER -f https://docs.graphhopper.com/openapi.json --pkg graphhopper
```

- `-e` or `--env`: `string` 类型。用于设置写进http请求客户端代码里的服务端baseUrl的环境变量名。

- `-f` or `--file`: `string` 类型。用于设置接口文档的本地路径或下载链接。

- `-o` or `--omit`: `bool` 类型。如果设置了这个参数，会在json标签里的字段名后面加`,omitempty`。

- `-p` or `--pkg`: `string` 类型。用于设置包名，默认值为`client`。

::: tip
每个接口都需要有`200`状态码的响应体，否则不会生成该接口的代码，在命令行终端也会输出错误信息。

```shell
➜  go-doudou-tutorials git:(master) ✗ go-doudou svc http client -o -e PETSTORE -f https://petstore3.swagger.io/api/v3/openapi.json --pkg petstore
ERRO[2022-02-18 11:56:08] 200 response definition not found in api Get /user/logout 
ERRO[2022-02-18 11:56:08] 200 response definition not found in api Put /user/{username} 
ERRO[2022-02-18 11:56:08] 200 response definition not found in api Delete /user/{username} 
ERRO[2022-02-18 11:56:08] 200 response definition not found in api Post /user 
ERRO[2022-02-18 11:56:09] 200 response definition not found in api Post /pet/{petId} 
ERRO[2022-02-18 11:56:09] 200 response definition not found in api Delete /pet/{petId} 
ERRO[2022-02-18 11:56:09] 200 response definition not found in api Delete /store/order/{orderId} 
```
:::

### grpc

`go-doudou svc grpc` 用于在`transport/grpc`路径下生成`Protobuf v3`语法的`.proto`后缀文件，gRPC服务端和客户端打桩代码等。如果`svcimpl.go`文件不存在，还会生成该文件，如果已存在，则会增量更新该文件。如果`cmd`路径下不存在`main.go`文件，则会生成该文件，如果已存在，则跳过。生成的`main.go`文件里已经有了启动gRPC服务的相关代码。

```shell
...
├── svc.go
├── svcimpl.go
├── transport
│   ├── grpc
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

### run

`go-doudou svc run` 用于启动服务。

- `-w` or `--watch`: `bool` 类型。用于开启`watch`模式，即热重启。不支持windows平台。虽然做了这个功能，但并不推荐使用。

### push

`go-doudou svc push` 用于生成docker镜像，推到远程镜像仓库，并生成k8s部署文件。实际按顺序依次执行了`go mod vendor`, `docker build`, `docker tag`, `docker push`这几个命令。

```shell
go-doudou svc push --pre godoudou_ -r wubin1989
```

- `--pre`: `string` 类型。用于设置镜像文件的名称前缀。

- `-r` or `--repo`: `string` type. 用于设置远程镜像仓库地址。

命令执行完毕后，你会得到两个文件：

- `${service}_deployment.yaml`: 无状态的k8s应用部署文件，推荐用于单体应用架构。
- `${service}_statefulset.yaml`: 有状态的k8s应用部署文件，推荐用于微服务架构。

### deploy

`go-doudou svc deploy` 用于将服务部署到k8s。实际执行的是`kubectl apply -f`命令。

```shell
go-doudou svc deploy -k helloworld_deployment.yaml
```

- `-k` or `--k8sfile`: `string` 类型。用于设置k8s部署文件的本地路径。默认值为`${service}_statefulset.yaml`。

### shutdown

`go-doudou svc shutdown` 用于从k8s下线服务，实际执行`kubectl delete -f`命令。

```shell
go-doudou svc shutdown -k helloworld_deployment.yaml
```

- `-k` or `--k8sfile`: `string` 类型。用于设置k8s部署文件的本地路径。默认值为`${service}_statefulset.yaml`。

## ddl

已从ddl工具升级为轻量级orm，请跳转[ORM](../orm/README.md)章节。

## name

根据指定的命名规则生成结构体字段后面的`json`tag。默认生成策略是**首字母小写的驼峰命名策略**，同时支持蛇形命名。未导出的字段会跳过，只修改导出字段的json标签。支持`omitempty`。


### 命令行参数

```shell
➜  go-doudou git:(main) go-doudou name -h
bulk add or update json tag of struct fields

Usage:
  go-doudou name [flags]

Flags:
  -f, --file string       absolute path of vo file
  -h, --help              help for name
  -o, --omitempty         whether omit empty value or not
  -s, --strategy string   name of strategy, currently only support "lowerCamel" and "snake" (default "lowerCamel")
```

### 用法

- 在go文件里写上`//go:generate go-doudou name --file $GOFILE`，不限位置，最好是写在上方。目前的实现是对整个文件的所有struct都生效。

```go
//go:generate go-doudou name --file $GOFILE

type Event struct {
	Name      string
	EventType int
}

type TestName struct {
	Age    age
	School []struct {
		Name string
		Addr struct {
			Zip   string
			Block string
			Full  string
		}
	}
	EventChan chan Event
	SigChan   chan int
	Callback  func(string) bool
	CallbackN func(param string) bool
}
```

- 在项目根路径下执行命令`go generate ./...`

```go
type Event struct {
	Name      string `json:"name"`
	EventType int    `json:"eventType"`
}

type TestName struct {
	Age    age `json:"age"`
	School []struct {
		Name string `json:"name"`
		Addr struct {
			Zip   string `json:"zip"`
			Block string `json:"block"`
			Full  string `json:"full"`
		} `json:"addr"`
	} `json:"school"`
	EventChan chan Event              `json:"eventChan"`
	SigChan   chan int                `json:"sigChan"`
	Callback  func(string) bool       `json:"callback"`
	CallbackN func(param string) bool `json:"callbackN"`
}
```








