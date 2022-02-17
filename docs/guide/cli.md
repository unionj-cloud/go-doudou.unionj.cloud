# CLI

Go-doudou has built-in code generation CLI. `go-doudou` is the root command and there are two flags for it.

- `-v` can tell you current installed version of go-doudou.

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou -v     
go-doudou version v1.0.0-beta
```

- `-h` can print help message. As all subcommands have this flag, I will omit it in the following documentation. 

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

And there are several useful subcommands helping you speed up your production. Let's get into them one by one.

## version

`go-doudou version` command is mainly used for upgrade `go-doudou`. It tells you not only current installed version, but also the latest release version,
and asks you if you want to upgrade.

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou version
Installed version is v0.9.8
Latest release version is v1.0.0-beta 
Use the arrow keys to navigate: ↓ ↑ → ← 
? Do you want to upgrade?: 
  ▸ Yes
    No
```

## help

`go-doudou help` is the same as `go-doudou -h`.

## svc

`go-doudou svc` is the most important and the most commonly used command. 

### init

`go-doudou svc init` is used for initializing go-doudou application. You can run this command in an existing directory, or you can also specify a directory immediately following `init`.
Then go-doudou will create the directory if it not exists and initial files for starting the development, and also run `git init` underlyingly. If specified directory has been already existed and not empty, go-doudou will only create non-existing files and skip existing files with warning like this:

```shell
➜  go-doudou-tutorials git:(master) go-doudou svc init helloworld
WARN[2022-02-17 18:14:53] file .gitignore already exists               
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/go.mod already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/.env already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/vo/vo.go already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/svc.go already exists 
WARN[2022-02-17 18:14:53] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/helloworld/Dockerfile already exists 
```

There is `-m` flag for customizing module name. You can use it like this:
```shell
go-doudou svc init helloworld -m github.com/unionj-cloud/helloworld
```

### http

`go-doudou svc http` is used for generating http routes and handlers for RESTful service. There are several flags for configuring the code generation behavior.

- `--handler`: if you set this flag, go-doudou will generate default http handler implementations which parse request parameters into form and decode request body into struct, and also send http response back.

- `-c` or `--client`: it is used for generating [go-resty](https://github.com/go-resty/resty) based http client code, only accept `go` for go language.

- `--doc`: it is used for generating [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3) description file in json format.

- `-e` or `--env`: it is used for setting server url environment variable name. If you don't set it, it will be the upper case of service interface name in svc.go file. The name will used in client factory function like this:

```go
func NewHelloworldClient(opts ...ddhttp.DdClientOption) *HelloworldClient {
	defaultProvider := ddhttp.NewServiceProvider("HELLOWORLD")
	defaultClient := ddhttp.NewClient()

	...

	return svcClient
}
```

In line 2, the `HELLOWORLD` is the default name. As we said before, go-doudou is also supporting monolithic service. If your service client application don't want to join go-doudou cluster and use the out-of-box service discovery and client side load balancing feature, it can set `HELLOWORLD` to your service public url, and it will send requests to that url. Let's try run `go-doudou svc http --handler -c go --doc -e godoudou_helloworld` to see what changes:
```go
func NewHelloworldClient(opts ...ddhttp.DdClientOption) *HelloworldClient {
	defaultProvider := ddhttp.NewServiceProvider("godoudou_helloworld")
	defaultClient := ddhttp.NewClient()

	...

    return svcClient
}
```

### run
### push
### deploy
### shutdown








