# 快速开始

## 先决条件

- 如果Go版本低于1.16且大于或等于1.13，需设置`GO111MODULE=on`开启模块支持
- 如果Go版本低于1.13，未经过测试，可能不支持

## 安装
- 如果Go版本低于1.17
```shell
go get -v github.com/unionj-cloud/go-doudou@v1.0.2
```

- 如果Go版本 >= 1.17，推荐采用如下命令全局安装`go-doudou`命令行工具
```shell
go install -v github.com/unionj-cloud/go-doudou@v1.0.2
```
推荐采用如下命令下载go-doudou作为项目的依赖
```shell
go get -v -d github.com/unionj-cloud/go-doudou@v1.0.2
```

::: tip
如果遇到`410 Gone error`报错，请先执行如下命令，再执行上述的安装命令

```shell
export GOSUMDB=off
``` 
:::

## 升级
你可以执行命令`go-doudou version`来升级全局安装的`go-doudou`命令行工具
```shell
➜  ~ go-doudou version                       
Installed version is v0.9.8
Latest release version is v1.0.2
✔ Yes
go install -v github.com/unionj-cloud/go-doudou@v1.0.2
go: downloading github.com/unionj-cloud/go-doudou v1.0.2
github.com/unionj-cloud/go-doudou/toolkit/sqlext/columnenum
github.com/unionj-cloud/go-doudou/toolkit/sqlext/sortenum
github.com/unionj-cloud/go-doudou/toolkit/sqlext/nullenum
github.com/unionj-cloud/go-doudou/toolkit/sqlext/keyenum
github.com/unionj-cloud/go-doudou/toolkit/sqlext/extraenum
github.com/unionj-cloud/go-doudou/toolkit/sqlext/config
github.com/unionj-cloud/go-doudou/toolkit/constants
github.com/unionj-cloud/go-doudou/toolkit/stringutils
github.com/unionj-cloud/go-doudou/toolkit/sliceutils
github.com/unionj-cloud/go-doudou/toolkit/templateutils
github.com/unionj-cloud/go-doudou/toolkit/sqlext/wrapper
github.com/unionj-cloud/go-doudou/toolkit/pathutils
github.com/unionj-cloud/go-doudou/framework/internal/config
github.com/unionj-cloud/go-doudou/copier
github.com/unionj-cloud/go-doudou/executils
github.com/unionj-cloud/go-doudou/cmd/internal/astutils
github.com/unionj-cloud/go-doudou/logutils
github.com/unionj-cloud/go-doudou/test
github.com/unionj-cloud/go-doudou/name
github.com/unionj-cloud/go-doudou/toolkit/sqlext/ddlast
github.com/unionj-cloud/go-doudou/openapi/v3
github.com/unionj-cloud/go-doudou/toolkit/sqlext/table
github.com/unionj-cloud/go-doudou/openapi/v3/codegen/client
github.com/unionj-cloud/go-doudou/framework/internal/codegen
github.com/unionj-cloud/go-doudou/toolkit/sqlext/codegen
github.com/unionj-cloud/go-doudou/ddl
github.com/unionj-cloud/go-doudou/svc
github.com/unionj-cloud/go-doudou/cmd
github.com/unionj-cloud/go-doudou
DONE
➜  ~ go-doudou version
Installed version is v1.0.2
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
  name        bulk add or update struct fields json tag
  svc         generate or update service

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

`svc.go`文件相当于是接口定义文件，我们在`Helloworld`接口里定义方法就是在定义接口。我们现在注释掉默认生成的例子`PageUsers`方法，定义我们自己的一个接口`Greeting`。请参阅[Define API](./idl.md)
章节内容了解更多。

```go
package service

import (
	"context"
	"helloworld/vo"
)

type Helloworld interface {
	// You can define your service methods as your need. Below is an example.
	// PageUsers(ctx context.Context, query vo.PageQuery) (code int, data vo.PageRet, err error)
  Greeting(ctx context.Context, greeting string) (data string, err error)
}
```

### 生成代码
先执行如下命令
```shell
go-doudou svc http --handler -c --doc
```
然后再执行`go mod tidy`来下载依赖。
If you use go 1.17, you will see below instruction: 如果你使用的Go版本是1.17，你可能会看到如下提示信息：
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
- `client`包: 基于[resty](https://github.com/go-resty/resty)封装的Go语言http请求客户端代码
- `cmd`包: 整个程序的入口
- `config`包: 用于加载与业务相关的配置
- `db`包: 连接数据库的工具代码
- `svcimpl.go`: 在这个文件中实现接口，编写真实的业务逻辑代码
- `transport`包: http网络层代码，主要负责解析入参和编码出参

### 启动服务
执行命令`go-doudou svc run`
```shell
➜  helloworld git:(master) ✗ go-doudou svc run       
 _____                     _                    _
|  __ \                   | |                  | |
| |  \/  ___   ______   __| |  ___   _   _   __| |  ___   _   _
| | __  / _ \ |______| / _` | / _ \ | | | | / _` | / _ \ | | | |
| |_\ \| (_) |        | (_| || (_) || |_| || (_| || (_) || |_| |
 \____/ \___/          \__,_| \___/  \__,_| \__,_| \___/  \__,_|
INFO[2022-02-13 22:14:15] ================ Registered Routes ================ 
INFO[2022-02-13 22:14:15] +-------------+--------+-------------------------+ 
INFO[2022-02-13 22:14:15] |    NAME     | METHOD |         PATTERN         | 
INFO[2022-02-13 22:14:15] +-------------+--------+-------------------------+ 
INFO[2022-02-13 22:14:15] | Greeting    | POST   | /greeting               | 
INFO[2022-02-13 22:14:15] | GetDoc      | GET    | /go-doudou/doc          | 
INFO[2022-02-13 22:14:15] | GetOpenAPI  | GET    | /go-doudou/openapi.json | 
INFO[2022-02-13 22:14:15] | Prometheus  | GET    | /go-doudou/prometheus   | 
INFO[2022-02-13 22:14:15] | GetRegistry | GET    | /go-doudou/registry     | 
INFO[2022-02-13 22:14:15] | GetConfig   | GET    | /go-doudou/config       | 
INFO[2022-02-13 22:14:15] +-------------+--------+-------------------------+ 
INFO[2022-02-13 22:14:15] =================================================== 
INFO[2022-02-13 22:14:15] Started in 468.771µs                         
INFO[2022-02-13 22:14:15] Http server is listening on :6060 
```

### Postman
Import helloworld_openapi3.json to postman to test `/greeting` api. You can see fake response returned.
![greeting](/images/greeting.png)

### Implementation
Now we are going to start implementing our business logic in `svcimpl.go` file.
Let's what code already there.
```go
package service

import (
	"context"

	"github.com/brianvoe/gofakeit/v6"
	"github.com/unionj-cloud/helloworld/config"
)

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

func NewHelloworld(conf *config.Config) Helloworld {
	return &HelloworldImpl{
		conf,
	}
}
```
We use [gofakeit](github.com/brianvoe/gofakeit) to generate fake response as default implementation. Now we should get rid of it and start to code.
```go
package service

import (
	"context"
	"fmt"

	"github.com/unionj-cloud/helloworld/config"
)

type HelloworldImpl struct {
	conf *config.Config
}

func (receiver *HelloworldImpl) Greeting(ctx context.Context, greeting string) (data string, err error) {
	return fmt.Sprintf("Hello %s", greeting), nil
}

func NewHelloworld(conf *config.Config) Helloworld {
	return &HelloworldImpl{
		conf,
	}
}
```
We removed Line 15~19 and replaced with `return fmt.Sprintf("Hello %s", greeting), nil`. Then let's test it again.
![greeting1](/images/greeting1.png)
You see, it's really very simple to write a RESTful service with go-doudou!

### Deployment
There are a lot of approaches to deploy go http server. We'd like to use kubernetes to deploy our projects.
Please refer to [Deployment](./deployment.md) to learn more.
#### Build Docker Image
Run `go-doudou svc push -r wubin1989`, don't forget change `wubin1989` to your remote docker image reposiotry.
```shell
➜  helloworld git:(master) ✗ go-doudou svc push -r wubin1989
[+] Building 42.9s (13/13) FINISHED                                                                                                                                
 => [internal] load build definition from Dockerfile                                                                                                          0.0s
 => => transferring dockerfile: 778B                                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                             0.0s
 => => transferring context: 2B                                                                                                                               0.0s
 => [internal] load metadata for docker.io/library/golang:1.16.6-alpine                                                                                      13.0s
 => [1/8] FROM docker.io/library/golang:1.16.6-alpine@sha256:bc2db47c5f4a682f1315e0d484811d65bf094d3bcd824459b170714c91656190                                 0.0s
 => [internal] load build context                                                                                                                             1.1s
 => => transferring context: 50.40MB                                                                                                                          1.1s
 => CACHED [2/8] WORKDIR /repo                                                                                                                                0.0s
 => [3/8] ADD go.mod .                                                                                                                                        0.2s
 => [4/8] ADD go.sum .                                                                                                                                        0.0s
 => [5/8] ADD . ./                                                                                                                                            0.9s
 => [6/8] RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories                                                                    0.6s
 => [7/8] RUN apk add --no-cache bash tzdata                                                                                                                 13.8s
 => [8/8] RUN export GDD_VER=$(go list -mod=vendor -m -f '{{ .Version }}' github.com/unionj-cloud/go-doudou) && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go bu  12.4s
 => exporting to image                                                                                                                                        0.7s 
 => => exporting layers                                                                                                                                       0.6s 
 => => writing image sha256:d5c50cfd8ef750eba6a883f14edf2397df1901eadf924b39b9cedda1ad9495cd                                                                  0.0s 
 => => naming to docker.io/library/helloworld                                                                                                                 0.0s 
                                                                                                                                                                   
Use 'docker scan' to run Snyk tests against images to find vulnerabilities and learn how to fix them                                                               
The push refers to repository [docker.io/wubin1989/helloworld]
29d9439ae861: Pushed 
6e1f1247e3b5: Pushed 
b2b2a71f9880: Pushed 
681e9176b1dd: Pushed 
8e5de385ef21: Pushed 
0b35a2c6b44d: Pushed 
152447a5498b: Pushed 
bb2e1759ebf5: Mounted from library/golang 
fff907320fc1: Mounted from library/golang 
6fbdad009c9d: Mounted from library/golang 
1328cc49ba2b: Mounted from library/golang 
72e830a4dff5: Mounted from library/golang 
v20220213230159: digest: sha256:5bc59a7069be59ef670889d52b7bdd6acd62a171bc2415d54375592da793f8cc size: 2831
INFO[2022-02-13 23:03:11] image wubin1989/helloworld:v20220213230159 has been pushed successfully 
INFO[2022-02-13 23:03:11] k8s yaml has been created/updated successfully. execute command 'go-doudou svc deploy' to deploy service helloworld to k8s cluster
```

Then you should see there are two yaml files generated from Line 13 and Line 16

```
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
├── helloworld_deployment.yaml
├── helloworld_openapi3.go
├── helloworld_openapi3.json
├── helloworld_statefulset.yaml
├── main
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

- helloworld_deployment.yaml: k8s deploy file for stateless service, recommended to be used for monolith architecture services
- helloworld_statefulset.yaml: k8s deploy file for stateful service, recommended to be used for microservice architecture services  

#### Deploy
::: tip
If you haven't installed Docker Desktop, please download and install it from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop).  
If you are not familiar with docker and kubernetes, please refer to [official documentation](https://docs.docker.com/get-started/overview/) to learn more.
::: 
By default, `go-doudou svc deploy` command uses `helloworld_statefulset.yaml` to deploy the service as statefulset application.  
```shell
go-doudou svc deploy
```
Then run `kubectl get pods` and you should see our service is running.
```shell
➜  helloworld git:(master) ✗ kubectl get pods    
NAME                       READY   STATUS    RESTARTS   AGE
helloworld-statefulset-0   1/1     Running   0          11m
```
At the moment, you can't connect to our service via `http://localhost:6060`. You should setup proxy by running below commands:
```shell
export POD_NAME=$(kubectl get pods --namespace default -l "app=helloworld" -o jsonpath="{.items[0].metadata.name}")
```
and 
```shell
kubectl port-forward --namespace default $POD_NAME 6060:6060 
```
If you see below output from command line, you can test by postman now.
```shell
➜  helloworld git:(master) ✗ export POD_NAME=$(kubectl get pods --namespace default -l "app=helloworld" -o jsonpath="{.items[0].metadata.name}")
➜  helloworld git:(master) ✗ kubectl port-forward --namespace default $POD_NAME 6060:6060                                               
Forwarding from 127.0.0.1:6060 -> 6060
Forwarding from [::1]:6060 -> 6060
```

#### Shutdown
Run `go-doudou svc shutdown` to stop the service.
```shell
go-doudou svc shutdown
```  
Then run `kubectl get pods` again, you should see below output.
```shell
➜  helloworld git:(master) ✗ kubectl get pods                                                                                             
No resources found in default namespace.
```

