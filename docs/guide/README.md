# 介绍
`go-doudou` (发音是兜兜，来自儿子的小名)是一个Go语言开发的微服务快速开发框架，同时支持开发rest单体应用和grpc微服务。

### 为什么?
#### 背景
经过多年的Go语言开发实践和技术框架调研，我们没有找到非常满意的Go语言微服务框架。

#### 原因
- 我需要一个代码生成器来帮我们生成尽可能多的代码，目标就是：即使我们对TCP/IP、RESTFul和RPC等相对底层一些的网络层原理和服务注册与发现、故障检测、复杂均衡等服务治理相关的话题一无所知，我们只会写CRUD代码，我们仍然可以在交付日期前开发出健壮的程序或者服务。但是我没有找到可以满足目标的工具或者框架。
- 在我的程序员职业生涯的早期，我是一个全职的前端开发工程师，我知道什么样的后端接口支持是前端所需要的。通过调研，我选择了`OpenAPI 3.0`（即`swagger v3`）接口描述规范作为前后端合作的桥梁。我想提供给前端成员的不仅是在线文档，还有可以生成假数据的mock server。
- 虽然网上已经可以找到不少关于Protobuf的语法和最佳实践的学习资料，但我们还是感觉学习曲线比较陡峭，我们需要一种不论是新手还是老司机都能很快上手用起来grpc的技术方案。

#### 结果
`go-doudou`发布了。本项目主要受一下所列项目的启发
- [https://github.com/kujtimiihoxha/kit](https://github.com/kujtimiihoxha/kit): 为`go-kit`技术栈写的代码生成器
- [https://github.com/hashicorp/memberlist](https://github.com/hashicorp/memberlist): Go语言写的基于SWIM gossip协议的服务发现和故障检测的库
- [https://spec.openapis.org/oas/v3.0.3](https://spec.openapis.org/oas/v3.0.3): `OpenAPI 3.0`接口描述规范

### 设计哲学
- 设计优先: 我们建议开始动手实现业务需求前，先设计好接口
- 契约精神: 我们建议采用`OpenAPI 3.0`和`Protobuf v3`接口描述规范来作为服务端和客户端开发团队沟通和协作开发的桥梁

### 特性
- 低代码: 通过Go语言标准库中的[`ast`](https://pkg.go.dev/go/ast)包和[`parser`](https://pkg.go.dev/go/parser)包解析你定义的Go语言`interface`的代码，进而生成`main`方法、路由和`http handler`代码、包含生成假数据响应体逻辑的接口实现类代码、Go语言http请求客户端代码、`json`格式的`OpenAPI 3.0`接口文档以及用于生成grpc代码的proto文件等等
- 支持用DNS地址作为服务注册与发现的地址
- 同时支持单体应用和微服务系统开发
- 内置轻量级orm库和表结构同步工具
- 开箱支持客户端负载均衡、熔断限流、隔仓、超时和重试等服务治理机制
- 开箱支持优雅退出
- 开箱支持基于对Go文件监听机制的开发时热重启（Mac和Linux平台）
- 开箱即用基于[`element-ui`](https://github.com/ElemeFE/element)开发的在线接口文档
- 开箱即用基于[`element-ui`](https://github.com/ElemeFE/element)开发的在线服务列表
- 内置常用的http中间件，如链路追踪（Jaeger）、请求日志、请求ID和服务监控（Prometheus）等等
- 开箱即用的docker和k8s部署文件
- 上手容易，使用简单