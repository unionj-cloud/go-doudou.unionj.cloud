# 部署

## ECS服务器

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

## Docker

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

## Kubernetes

`go-doudou`开箱支持k8s部署。

1. 执行`go-doudou svc push`命令可以打包镜像并推送到远程镜像仓库，最后生成两份k8s部署文件，一个用于部署无状态服务，一个用于部署有状态服务。

```shell
go-doudou svc push --pre godoudou_ -r wubin1989
```

可以通过`--pre`参数设置镜像名称前缀。需要将`wubin1989`改成你自己的远程镜像仓库地址。

每次执行此命令都会自动更新镜像的版本号，命名规则为`v` + `yyyyMMddHHmmss`，同时自动更新k8s部署文件里的镜像名称。

2. 执行`go-doudou svc deploy`命令。此命令默认采用`_deployment.yaml`后缀的文件部署无状态服务。你可以通过`-k`参数设置其他k8s部署文件路径。

