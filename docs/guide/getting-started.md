# Getting Started

## Prerequisites

- go 1.13, 1.14, 1.15 with GO111MODULE=on
- go 1.16+
- < go 1.13: not test, maybe support  

## Install
- If go version < 1.17,
```shell
go get -v github.com/unionj-cloud/go-doudou@v1.0.0-alpha
```

- If go version >= 1.17, recommend to use below command to install go-doudou cli globally
```shell
go install -v github.com/unionj-cloud/go-doudou@v1.0.0-alpha
```
and use below command to download go-doudou as dependency for your module.
```shell
go get -v -d github.com/unionj-cloud/go-doudou@v1.0.0-alpha
```

::: tip
If you meet 410 Gone error, try to run below command, then run install command again:
```shell
export GOSUMDB=off
``` 
:::

## Upgrade
You can run `go-doudou version` to upgrade cli.
```shell
➜  ~ go-doudou version                       
Installed version is v0.9.6
Latest release version is v1.0.0-alpha
✔ Yes
go install -v github.com/unionj-cloud/go-doudou@v1.0.0-alpha
go: downloading github.com/unionj-cloud/go-doudou v1.0.0-alpha
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
Installed version is v1.0.0-alpha
➜  ~ 
```  

## Usage

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

### Initialize project

```shell
➜  ~ go-doudou svc init helloworld
1.16
helloworld
```

You can ignore the warning now.

```shell
➜  helloworld git:(master) ✗ ls -la -h
total 40
drwxr-xr-x   10 wubin1989  staff   320B  8 29 23:27 .
drwxr-xr-x+ 157 wubin1989  staff   4.9K  8 29 23:27 ..
-rw-r--r--    1 wubin1989  staff   2.0K  8 29 23:22 .env
drwxr-xr-x    5 wubin1989  staff   160B  8 29 23:26 .git
-rw-r--r--    1 wubin1989  staff   268B  8 29 23:22 .gitignore
drwxr-xr-x    6 wubin1989  staff   192B  8 29 23:27 .idea
-rw-r--r--    1 wubin1989  staff   707B  8 29 23:22 Dockerfile
-rw-r--r--    1 wubin1989  staff   442B  8 29 23:22 go.mod
-rw-r--r--    1 wubin1989  staff   253B  8 29 23:22 svc.go
drwxr-xr-x    3 wubin1989  staff    96B  8 29 23:22 vo
```

- Dockerfile：build docker image

- svc.go: design your rest apis by defining methods of Helloworld interface

- vo folder：define structs as data structure in http request body and response body, and also as OpenAPI 3.0 schemas

- .env: config file, go-doudou use it to load enviroment variables with GDD_ prefix

### Define methods

Please read [Must Know](#must-know)

```go
package service

import (
	"context"
	"helloworld/vo"
)

type Helloworld interface {
	// You can define your service methods as your need. Below is an example.
	PageUsers(ctx context.Context, query vo.PageQuery) (code int, data vo.PageRet, err error)
}
```

### Generate code

```shell
go-doudou svc http --handler -c go -o --doc
go mod tidy
```

Let's see what are generated.

```shell
➜  helloworld git:(master) ✗ ls -la -h
total 328
drwxr-xr-x   20 wubin1989  staff   640B  8 31 12:34 .
drwxr-xr-x+ 157 wubin1989  staff   4.9K  8 31 12:36 ..
-rw-r--r--    1 wubin1989  staff   2.0K  8 29 23:45 .env
drwxr-xr-x    5 wubin1989  staff   160B  8 31 12:36 .git
-rw-r--r--    1 wubin1989  staff   268B  8 29 23:22 .gitignore
drwxr-xr-x    7 wubin1989  staff   224B  8 31 12:33 .idea
-rw-r--r--    1 wubin1989  staff   707B  8 29 23:22 Dockerfile
-rwxr-xr-x    1 wubin1989  staff    13K  8 31 12:35 app.log
drwxr-xr-x    3 wubin1989  staff    96B  8 29 23:44 client
drwxr-xr-x    3 wubin1989  staff    96B  8 29 23:44 cmd
drwxr-xr-x    3 wubin1989  staff    96B  8 29 23:44 config
drwxr-xr-x    3 wubin1989  staff    96B  8 29 23:44 db
-rw-r--r--    1 wubin1989  staff   536B  8 31 12:35 go.mod
-rw-r--r--    1 wubin1989  staff   115K  8 31 12:35 go.sum
-rwxr-xr-x    1 wubin1989  staff   1.9K  8 31 12:34 helloworld_openapi3.go
-rwxr-xr-x    1 wubin1989  staff   1.8K  8 31 12:34 helloworld_openapi3.json
-rw-r--r--    1 wubin1989  staff   253B  8 29 23:22 svc.go
-rw-r--r--    1 wubin1989  staff   413B  8 29 23:44 svcimpl.go
drwxr-xr-x    3 wubin1989  staff    96B  8 29 23:44 transport
drwxr-xr-x    3 wubin1989  staff    96B  8 29 23:22 vo
```

- helloworld_openapi3.json：OpenAPI 3.0 spec json documentation
- helloworld_openapi3.go: assign OpenAPI 3.0 spec json string to a variable for serving online
- client：golang http client based on [resty](https://github.com/go-resty/resty)
- cmd：main.go file here
- config：config loading related
- db：function for connecting to database
- svcimpl.go：write your business logic here
- transport：http routes and handlers
- .env：put configs here

### Run

Set GDD_MEM_SEED empty in .env file because there is no seed address before run our service now.

```shell
➜  helloworld git:(master) ✗ go run cmd/main.go
INFO[2021-08-31 21:35:47] Node 192.168.2.20 joined, supplying helloworld service 
WARN[2021-08-31 21:35:47] No seed found                                
INFO[2021-08-31 21:35:47] Memberlist created. Local node is Node 192.168.2.20, providing helloworld service at http://192.168.2.20:6060, memberlist port 50324 
 _____                     _                    _
|  __ \                   | |                  | |
| |  \/  ___   ______   __| |  ___   _   _   __| |  ___   _   _
| | __  / _ \ |______| / _` | / _ \ | | | | / _` | / _ \ | | | |
| |_\ \| (_) |        | (_| || (_) || |_| || (_| || (_) || |_| |
 \____/ \___/          \__,_| \___/  \__,_| \__,_| \___/  \__,_|
INFO[2021-08-31 21:35:47] ================ Registered Routes ================ 
INFO[2021-08-31 21:35:47] +-------------+--------+-------------------------+ 
INFO[2021-08-31 21:35:47] |    NAME     | METHOD |         PATTERN         | 
INFO[2021-08-31 21:35:47] +-------------+--------+-------------------------+ 
INFO[2021-08-31 21:35:47] | PageUsers   | POST   | /page/users             | 
INFO[2021-08-31 21:35:47] | GetDoc      | GET    | /go-doudou/doc          | 
INFO[2021-08-31 21:35:47] | GetOpenAPI  | GET    | /go-doudou/openapi.json | 
INFO[2021-08-31 21:35:47] | Prometheus  | GET    | /go-doudou/prometheus   | 
INFO[2021-08-31 21:35:47] | GetRegistry | GET    | /go-doudou/registry     | 
INFO[2021-08-31 21:35:47] +-------------+--------+-------------------------+ 
INFO[2021-08-31 21:35:47] =================================================== 
INFO[2021-08-31 21:35:47] Started in 431.269µs                         
INFO[2021-08-31 21:35:47] Http server is listening on :6060
```

### Deployment

#### Build docker image and push to your repository

```shell
➜  helloworld git:(master) ✗ go-doudou svc push -r wubin1989
[+] Building 0.8s (13/13) FINISHED                                                                                                       
 => [internal] load build definition from Dockerfile                                                                                0.0s
 => => transferring dockerfile: 37B                                                                                                 0.0s
 => [internal] load .dockerignore                                                                                                   0.0s
 => => transferring context: 2B                                                                                                     0.0s
 => [internal] load metadata for docker.io/library/golang:1.13.4-alpine                                                             0.0s
 => [1/8] FROM docker.io/library/golang:1.13.4-alpine                                                                               0.0s
 => [internal] load build context                                                                                                   0.7s
 => => transferring context: 22.43MB                                                                                                0.6s
 => CACHED [2/8] WORKDIR /repo                                                                                                      0.0s
 => CACHED [3/8] ADD go.mod .                                                                                                       0.0s
 => CACHED [4/8] ADD go.sum .                                                                                                       0.0s
 => CACHED [5/8] ADD . ./                                                                                                           0.0s
 => CACHED [6/8] RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories                                   0.0s
 => CACHED [7/8] RUN apk add --no-cache bash tzdata                                                                                 0.0s
 => CACHED [8/8] RUN export GDD_VER=$(go list -mod=vendor -m -f '{{ .Version }}' github.com/unionj-cloud/go-doudou) && CGO_ENABLED  0.0s
 => exporting to image                                                                                                              0.0s
 => => exporting layers                                                                                                             0.0s
 => => writing image sha256:00365c58d0410d978aea462ec93323e20d879b15421e8eba29d8a17918660af8                                        0.0s
 => => naming to docker.io/library/helloworld                                                                                       0.0s

Use 'docker scan' to run Snyk tests against images to find vulnerabilities and learn how to fix them
The push refers to repository [docker.io/wubin1989/helloworld]
d0a9599b03e1: Pushed 
c3055fdf1a79: Layer already exists 
1c265a7f4c3e: Layer already exists 
f567cf5a5cf1: Layer already exists 
0b4acd902364: Layer already exists 
bbf9670b59e9: Layer already exists 
fdd6fb6fca5b: Layer already exists 
a17f85ec7605: Layer already exists 
2895b872dff5: Layer already exists 
eed8c158e67f: Layer already exists 
2033402d2275: Layer already exists 
77cae8ab23bf: Layer already exists 
v20210831125525: digest: sha256:5f75f7b43708d0619555f9bccbf0347e8db65319b83c65251015982ca6d23370 size: 2829
time="2021-08-31 12:55:53" level=info msg="image wubin1989/helloworld:v20210831125525 has been pushed successfully\n"
time="2021-08-31 12:55:53" level=info msg="k8s yaml has been created/updated successfully. execute command 'go-doudou svc deploy' to deploy service helloworld to k8s cluster\n"
```

then you should see there are two yaml files generated

```
➜  helloworld git:(master) ✗ ll
total 328
-rw-r--r--  1 wubin1989  staff   707B  8 29 23:22 Dockerfile
-rwxr-xr-x  1 wubin1989  staff    15K  8 31 12:55 app.log
drwxr-xr-x  3 wubin1989  staff    96B  8 29 23:44 client
drwxr-xr-x  3 wubin1989  staff    96B  8 29 23:44 cmd
drwxr-xr-x  3 wubin1989  staff    96B  8 29 23:44 config
drwxr-xr-x  3 wubin1989  staff    96B  8 29 23:44 db
-rw-r--r--  1 wubin1989  staff   536B  8 31 12:35 go.mod
-rw-r--r--  1 wubin1989  staff   115K  8 31 12:35 go.sum
-rw-r--r--  1 wubin1989  staff   817B  8 31 12:55 helloworld_deployment.yaml
-rwxr-xr-x  1 wubin1989  staff   1.9K  8 31 12:34 helloworld_openapi3.go
-rwxr-xr-x  1 wubin1989  staff   1.8K  8 31 12:34 helloworld_openapi3.json
-rw-r--r--  1 wubin1989  staff   867B  8 31 12:55 helloworld_statefulset.yaml
-rw-r--r--  1 wubin1989  staff   253B  8 29 23:22 svc.go
-rw-r--r--  1 wubin1989  staff   413B  8 29 23:44 svcimpl.go
drwxr-xr-x  3 wubin1989  staff    96B  8 29 23:44 transport
drwxr-xr-x  6 wubin1989  staff   192B  8 31 12:55 vendor
drwxr-xr-x  3 wubin1989  staff    96B  8 29 23:22 vo
```

- helloworld_deployment.yaml: k8s deploy file for stateless service, recommend for monolith architecture services
- helloworld_statefulset.yaml: k8s deploy file for stateful service, recommend for microservices architecture services

#### Deploy

```shell
go-doudou svc deploy 
```

#### Shutdown

```shell
go-doudou svc shutdown
```  

