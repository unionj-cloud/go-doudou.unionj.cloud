---
sidebar: auto
---

# 贡献

## 代码仓库

- Github：[https://github.com/unionj-cloud/go-doudou](https://github.com/unionj-cloud/go-doudou)
- 码云：[https://gitee.com/unionj-cloud/go-doudou](https://gitee.com/unionj-cloud/go-doudou)
## 项目结构

go-doudou由三个包构成：

- `cmd`: 负责`go-doudou`命令行工具和代码生成器
- `framework`: 负责RESTful/RPC框架 
- `toolkit`: 负责工具箱

### `cmd`包

各核心文件和文件夹的说明请参考下面的注释。

```shell
➜  cmd git:(main) tree -L 2
.
├── client.go  # go-doudou svc http client 命令，直接从OpenAPI 3.0 json文档生成go语言http请求客户端
├── client_test.go
├── ddl.go  # go-doudou ddl 命令，同步数据库表结构和domain包里的结构体，生成dao层代码
├── ddl_test.go
├── deploy.go  # go-doudou svc deploy 命令，部署到k8s集群命令
├── deploy_test.go
├── http.go  # go-doudou svc http 命令，生成RESTful服务所需全套代码，包括但不限于main函数和处理http请求和响应的代码
├── http_test.go
├── init.go  # go-doudou svc init 命令，初始化go-doudou服务项目结构
├── init_test.go
├── internal
│   ├── astutils  # ast工具类，解析struct和interface类型源码
│   ├── ddl  # ddl命令核心代码
│   ├── executils  # 从go代码里调用终端命令工具类
│   ├── name  # name工具核心代码
│   ├── openapi  # 解析OpenAPI 3.0 json文档并生成http请求客户端的核心代码
│   └── svc  # 生成RESTful服务全套代码的代码生成器核心代码 
├── mock
│   ├── mock_executils_runner.go
│   ├── mock_promptui_select_interface.go
│   └── mock_svc.go
├── name.go  # go-doudou name 命令，修改结构体的json标签的小工具，推荐结合go generate命令用
├── name_test.go
├── promptui_select_interface.go
├── push.go  # go-doudou svc push 命令，本地打包docker镜像并推送到远程镜像仓库
├── push_test.go
├── root.go  # go-doudou 根命令
├── root_test.go
├── run.go  # go-doudou svc run 命令，可以用于本地启动服务，不要用于线上部署
├── run_test.go
├── shutdown.go  # go-doudou svc shutdown 命令，用于下线k8s pod
├── shutdown_test.go
├── svc.go  # go-doudou svc 命令
├── svc_test.go
├── testdata
│   ├── pushcmd
│   └── testsvc
├── version.go  # go-doudou version 命令，用于升级go-doudou命令行工具版本
└── version_test.go

11 directories, 28 files
```

### `framework`包

各核心文件和文件夹的说明请参考下面的注释。

```shell
➜  framework git:(main) tree -L 2
.
├── buildinfo  # 用于构建二进制文件时，写入构建人、构建时间和go-doudou依赖版本等元信息
│   └── buildinfo.go
├── configmgr  # 集成apollo和nacos远程配置中心的核心代码
│   ├── apollo.go
│   ├── apollo_test.go
│   ├── mock
│   ├── nacos.go
│   ├── nacos_test.go
│   └── testdata
├── http  # RESTful服务框架层核心代码
│   ├── bizerror.go  # 业务相关错误的包装类
│   ├── bizerror_test.go
│   ├── client.go  # 生成的go语言http请求客户端代码中依赖的类和微服务客户端负载均衡核心代码
│   ├── client_test.go
│   ├── config  # /go-doudou/config 内置运行时环境变量查询接口相关代码
│   ├── middleware.go  # 内置http中间件相关代码
│   ├── middleware_test.go
│   ├── mock
│   ├── model  # 封装gorilla/mux用到的路由包装类
│   ├── onlinedoc  # /go-doudou/doc 和 /go-doudou/openapi.json 内置在线接口文档相关代码
│   ├── prometheus  # /go-doudou/prometheus 内置prometheus指标采集接口相关代码
│   ├── registry  # /go-doudou/registry 内置服务注册与发现机制相关的在线服务列表的代码
│   └── server.go  # 路由和中间件注册、服务启动和优雅退出相关代码
├── internal
│   └── config  # 框架层配置相关代码
├── logger  # 基于logrus的日志相关代码
│   ├── configure.go
│   └── entry.go
├── memberlist  # fork出来的hashicorp/memberlist源码，为实现内置服务注册与发现机制做了一些修改
│   ├── LICENSE
│   ├── Makefile
│   ├── README.md
│   ├── alive_delegate.go
│   ├── awareness.go
│   ├── awareness_test.go
│   ├── broadcast.go
│   ├── broadcast_test.go
│   ├── config.go
│   ├── config_test.go
│   ├── conflict_delegate.go
│   ├── delegate.go
│   ├── dns_client_interface.go
│   ├── event_delegate.go
│   ├── event_delegate_test.go
│   ├── integ_test.go
│   ├── keyring.go
│   ├── keyring_test.go
│   ├── logging.go
│   ├── logging_test.go
│   ├── memberlist.go
│   ├── memberlist_interface.go
│   ├── memberlist_test.go
│   ├── merge_delegate.go
│   ├── mock
│   ├── net.go
│   ├── net_conn_interface.go
│   ├── net_test.go
│   ├── net_transport.go
│   ├── ping_delegate.go
│   ├── queue.go
│   ├── queue_test.go
│   ├── security.go
│   ├── security_test.go
│   ├── state.go
│   ├── state_test.go
│   ├── suspicion.go
│   ├── suspicion_test.go
│   ├── todo.md
│   ├── transport.go
│   ├── transport_test.go
│   ├── util.go
│   ├── util_test.go
│   ├── weightbroadcast.go
│   └── weightbroadcast_test.go
├── ratelimit  # 限流器相关代码
│   ├── limit.go
│   ├── limit_test.go
│   ├── limiter.go
│   ├── memrate  # 内存限流器
│   └── redisrate  # redis限流器
├── registry  # 服务注册相关代码
│   ├── config.go  # 实现运行时修改memberlist参数
│   ├── config_test.go
│   ├── delegate.go  # memberlist相关
│   ├── delegate_test.go
│   ├── eventdelegate.go  # memberlist相关
│   ├── eventdelegate_test.go
│   ├── nacos  # 集成nacos服务注册与发现机制相关代码
│   ├── node.go  # 服务注册代码
│   ├── node_test.go
│   ├── serviceprovider.go  # 服务发现接口类
│   └── serviceprovider_test.go
├── testdata
│   ├── change
│   ├── checkIc2
│   ├── inputanonystruct
│   ├── nosvc
│   ├── novo
│   ├── openapi
│   ├── outputanonystruct
│   ├── svc.go
│   ├── svcp.go
│   ├── testfilesdoc1_openapi3.json
│   ├── usersvc_deployment.yaml
│   ├── usersvc_statefulset.yaml
│   └── vo
└── tracing  # 集成jaeger调用链跟踪相关代码
    └── tracer.go

31 directories, 77 files
```

### `toolkit`包

各核心文件和文件夹的说明请参考下面的注释。

```shell
➜  toolkit git:(main) tree -L 2
.
├── caller  # 获取函数调用方包名、方法/函数名、代码文件路径和行号工具
│   ├── caller.go
│   └── caller_test.go
├── cast  # 传入字符串类型值返回转换后的类型值
│   ├── string.go
│   ├── string_test.go
│   ├── stringslice.go
│   └── stringslice_test.go
├── constants  # 目前只有日期格式相关的常量
│   └── constants.go
├── copier  # 基于json序列化和反序列化机制的深拷贝工具
│   ├── copier.go
│   └── copier_test.go
├── dotenv  # 解析dotenv配置文件工具
│   ├── dotenv.go
│   ├── dotenv_test.go
│   └── testdata
├── fileutils  # 文件操作相关工具
│   ├── fileutils.go
│   └── fileutils_test.go
├── hashutils  # 生成密码哈希和uuid字符串工具
│   ├── hashutils.go
│   └── hashutils_test.go
├── ip  # 获取服务器公网ip工具
│   ├── ip.go
│   └── ip_test.go
├── loadbalance  # 客户端负载均衡相关工具
│   ├── subset.go  # 将多个服务实例拆成几个子集分配给不同的客户端
│   └── subset_test.go
├── maputils  # map相关工具
│   ├── maputils.go  # 目前只有Diff方法，找出两个map的不同
│   └── maputils_test.go
├── openapi  # 解析OpenAPI 3.0文档相关代码
│   └── v3
├── pathutils  # 文件路径相关工具
│   ├── pathutils.go
│   └── pathutils_test.go
├── random  # 随机数相关工具
│   └── rand.go
├── reflectutils  # 反射相关工具
│   └── reflectutils.go
├── sliceutils  # 切片相关工具
│   ├── sliceutils.go
│   └── sliceutils_test.go
├── sqlext  # sql语句构建器相关代码
│   ├── arithsymbol
│   ├── logger
│   ├── logicsymbol
│   ├── query
│   ├── sortenum
│   ├── testdata
│   └── wrapper
├── stringutils  # 字符串相关工具
│   ├── stringutils.go
│   └── stringutils_test.go
├── templateutils  # text/template相关工具
│   ├── funcs.go
│   └── templateutils.go
├── timeutils  # 时间相关工具
│   ├── timeutils.go
│   └── timeutils_test.go
└── yaml  # 解析yaml配置文件工具
    ├── testdata
    ├── yaml.go
    └── yaml_test.go

30 directories, 35 files
```

## 代码质量

我们非常重视代码质量，如果你想贡献代码，请务必保证单元测试可以通过。

```shell
go test ./... -count=1
```

## 讨论

欢迎在讨论区讨论新特性或者提出你想要的特性：[https://github.com/unionj-cloud/go-doudou/discussions](https://github.com/unionj-cloud/go-doudou/discussions)

## 缺陷

遇到bug，请提到这里：[https://github.com/unionj-cloud/go-doudou/issues](https://github.com/unionj-cloud/go-doudou/issues)

## 贡献代码

欢迎贡献代码：[https://github.com/unionj-cloud/go-doudou/pulls](https://github.com/unionj-cloud/go-doudou/pulls)

## TODO

任务看板：[https://github.com/unionj-cloud/go-doudou/projects/1](https://github.com/unionj-cloud/go-doudou/projects/1)