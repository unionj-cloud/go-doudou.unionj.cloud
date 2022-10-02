# 部署

## 单体架构
### ECS服务器

1. 克隆项目代码到服务器上

2. 将代码编译成二进制可执行文件
```shell
export GDD_ENV=prod && go build -o api cmd/main.go 
```

3. 启动可执行文件，推荐用screen命令或[pm2](https://pm2.keymetrics.io/)，这里以screen命令为例，先创建一个窗口`screen -S app`，窗口名字叫`app`，启动程序`./app`。`ctrl + a + d`可以退出screen，`screen -r app`可以打开刚才创建的app窗口，查看命令行终端输出的日志。

:::tip
如果是Centos服务器，screen的安装命令是`yum install -y screen`。

想看当前开启的窗口列表，可用`screen -ls`命令

```shell
➜  ~ screen -ls   
There is a screen on:
	16048.app	(Detached)
1 Socket in /var/run/screen/S-root.
```

如果想删掉app窗口，可以先执行命令`screen -r app`登录进去，再输入`exit`回车，就退出并且删除app窗口了。

```shell
➜  ~ screen -r app
[screen is terminating]
➜  ~  
➜  ~ screen -ls   
No Sockets found in /var/run/screen/S-root.
```

一般程序员日常开发掌握这几个命令已经做够了。
:::

### Docker

你可以直接使用`go-doudou svc init`命令生成的`Dockerfile`，也可以根据实际项目需求修改。

先下载依赖到`vendor`文件夹
```
go mod vendor
```

再打包镜像
```shell
docker build -t myservice . 
```

最后执行`docker run`命令

```shell
docker run -it -d -p 6060:6060 myservice
```

需要把`myservice`改成你自己的镜像名称。

### Kubernetes

`go-doudou`开箱支持k8s部署。

1. 执行`go-doudou svc push`命令可以打包镜像并推送到远程镜像仓库，最后生成两份k8s部署文件，一个用于部署无状态服务，一个用于部署有状态服务。

```shell
go-doudou svc push --pre godoudou_ -r wubin1989
```

可以通过`--pre`参数设置镜像名称前缀。需要将`wubin1989`改成你自己的远程镜像仓库地址。

每次执行此命令都会自动更新镜像的版本号，命名规则为`v` + `yyyyMMddHHmmss`，同时自动更新k8s部署文件里的镜像名称。

2. 执行`go-doudou svc deploy`命令。此命令默认采用`_statefulset.yaml`后缀的文件部署有状态服务。你可以通过`-k`参数设置其他k8s部署文件路径，如`_deployment.yaml`后缀的无状态服务的部署文件。

```shell
go-doudou svc deploy -k helloworld_deployment.yaml
```

需要将`helloworld_deployment.yaml`改成你自己的部署文件路径。

## 微服务架构

### 架构总览
![microservice](/images/microservice.png)

### 网络安全

如果采用go-doudou内置的memberlist作为服务注册与发现机制，尽管你可以通过设置`GDD_MEM_CIDRS_ALLOWED`环境变量来设置允许加入集群的节点ip范围以确保网络安全，但我们建议对外网关闭memberlist监听端口（默认`7946`），仅允许内网访问。

### 集群种子

如果采用go-doudou内置的memberlist作为服务注册与发现机制，必须要先启动一个或多个服务作为种子节点来让其他节点加入。任意一个采用go-doudou开发的服务都可以作为种子节点。然后将种子节点连接地址，ip地址或dns地址皆可，设置到`GDD_MEM_SEED`环境变量，多个地址用英文逗号分隔。

为了避免种子节点因代码修改而重新部署所带来的不稳定，推荐部署一个或多个无任何实际业务功能的go-doudou服务作为种子节点。种子节点的作用仅仅是让其他节点加入构成集群。节点间的通信机制和服务调用机制完全是p2p的，不经过任何种子节点。

### Prometheus服务发现

目前Prometheus还没有对go-doudou的官方支持，所以我们基于官方的一篇文章 [Implementing Custom Service Discovery](https://prometheus.io/blog/2018/07/05/implementing-custom-sd/) 实现了对go-doudou微服务的Prometheus服务发现机制。源码已开源在[这](https://github.com/unionj-cloud/go-doudou-prometheus-sd)，还提供了docker镜像供下载使用。

```shell
docker pull wubin1989/go-doudou-prometheus-sd:v1.0.2
```

下面是一个`docker-compose.yml`文件的例子
```yaml
version: '3.9'

services:
  wordcloud-prometheus:
    container_name: wordcloud-prometheus
    hostname: wordcloud-prometheus
    image: wubin1989/go-doudou-prometheus-sd:v1.0.2
    environment:
      - GDD_SERVICE_NAME=wordcloud-prometheus
      - PROM_REFRESH_INTERVAL=15s
      - GDD_MEM_CIDRS_ALLOWED=172.28.0.0/16
    volumes:
      - ./prometheus/:/etc/prometheus/
    ports:
      - "9090:9090"
    restart: always
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:9090" ]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - tutorial

networks:
  tutorial:
    name: tutorial
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
```

挂载到容器的`./prometheus/`文件夹的目录结构示例如下

```
├── alert.rules
├── prometheus.yml
└── sd
    └── go-doudou.json
```

看一下`prometheus.yml`文件的内容

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alert.rules'

scrape_configs:
  - job_name: "go-doudou-wordcloud"
    basic_auth:
      username: admin
      password: admin
    metrics_path: /go-doudou/prometheus
    file_sd_configs:
      - files:
          - sd/go-doudou.json
```

第13~16的内容不要改，需要自己改一下`username`和`password`的值，其他内容都可以根据实际需求修改。

### Kubernetes

部署服务的方式请参考单体架构的 [kubernetes](#kubernetes) 章节。这里主要是做几点补充说明。

1. 你可以利用k8s的服务发现和负载均衡机制，将go-doudou服务全部按单体服务部署，然后将dns服务地址配置到环境变量里，服务间接口调用通过dns服务地址，由k8s为我们做实例间负载均衡。如果服务需要暴露到外网，可以配置自行配置ingress

2. 你可以利用k8s的[`ConfigMaps`](https://kubernetes.io/docs/concepts/configuration/configmap/)机制来做配置管理

3. 如果你仍打算采用go-doudou内置的memberlist服务发现机制，就有两种部署方案：无状态服务和有状态服务

4. go-doudou微服务架构同时支持无状态服务和有状态服务，可以根据实际业务需求全部部署成某一种类型或者混合两种类型

5. 推荐至少将担当种子节点的服务以有状态服务类型部署。因为有状态服务相比无状态服务，容器名和`hostname`是固定的，可以通过配置`headless`服务，获得一个可以定位到该容器的dns域名。域名构成规则是`container-hostname.service-metadata-name.my-namespace.svc.cluster-domain.example`，例如`seed-2.seed-svc-headless.default.svc.cluster.local`。这样的话，当种子节点容器因各种原因重启以后，连接地址不会发生改变，其他服务的`GDD_MEM_SEED`环境变量不需要重新配置，集群更稳定，维护更方便。需要了解更多，请参考[DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)

6. 前文介绍的`go-doudou-prometheus-sd`服务本身就是一个go-doudou服务，可以当做种子节点，以有状态服务类型部署一个或多个实例。这里假设部署了3个种子实例，那么所有服务实例（包括种子实例本身）的`GDD_MEM_SEED`环境变量配置如下
```shell
GDD_MEM_SEED=prometheus-0.prometheus-svc.default.svc.cluster.local,prometheus-1.prometheus-svc.default.svc.cluster.local,prometheus-2.prometheus-svc.default.svc.cluster.local
```