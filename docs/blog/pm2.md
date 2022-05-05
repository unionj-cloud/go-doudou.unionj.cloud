---
sidebar: auto
---

# 如何用pm2部署go-doudou服务（单体篇）

在我的职业生涯早期有几年的全职nodejs全栈工程师的经历，当年部署nodejs后端服务一般都是用pm2。pm2是docker兴起之前nodejs生态里最知名也是应用最普遍的进程管理工具。实际上，不止是nodejs后端服务，任何编程语言写的程序，不论是给前端工程师提供接口的后端服务，还是爬虫程序，还是定时任务之类的后台程序，都可以用pm2来取代`nohup`、`screen`等linux运维工程师才比较熟悉的工具，由程序开发者自己实现部署。两年前，我在简书上发表过一篇介绍用pm2部署java服务的文章，链接发到这里：[https://www.jianshu.com/p/9062ba95f9df](https://www.jianshu.com/p/9062ba95f9df)，读者中如果有java程序员，也可以参考。在docker和k8s大流行的今天，我相信pm2依然在一些中小企业有很高的应用价值。

本文将通过一个用go-doudou微服务框架开发的单体服务`usersvc`来演示具体的用法。我在掘金上已经发表了一篇讲解这个服务如何开发的教程，[快速上手go-doudou开发单体RESTful服务](https://juejin.cn/post/7046936284438200333)，各位读者如果感兴趣，可以先跳过去阅读，然后再回来阅读本篇文章。

## pm2的主要功能

可以说pm2是为nodejs应用量身打造的进程管理工具，有丰富的功能。我这里主要想总结一下用pm2管理非nodejs应用可以用到的主要功能：

- 支持从你将最新代码推到远程代码仓库以后全自动地开始并最终完成整套程序部署流程
- 支持通过ssh公私钥的鉴权机制免密码登录服务器
- 支持同时部署到多台服务器
- 支持在单台服务器同时部署多份副本（不适用对外的服务程序，因为会报端口号已占用的错误）
- 支持配置适用于不同环境的多套配置，并在程序启动时设置采用哪套环境的配置
- 支持配置多种钩子函数，方便在部署前后执行自定义的脚本或者命令
- 支持方便地查看程序的运行状态，比如重启次数、运行时长、CPU和内存占用等等
- 支持方便地查看程序的基本信息，比如启动参数、日志路径、创建时间、git提交hash等等
- 支持方便地查看程序日志，也可以通过`pm2-logrotate`等插件管理日志
- 支持方便地配置开机启动
- 支持限制程序的内存占用，达到最大值以后重启

## pm2相比docker的优劣势

以下对比，仅仅是站在一个软件开发者的视角，从单纯实现将程序部署上线和在代码修改后更新线上程序的目标出发，做的一些不成熟的经验总结，供读者参考。

### 优势

- 十分轻量，对服务器资源的开销小
- 支持单纯依靠pm2的机制实现自动化部署
- 支持一行命令部署到多台服务器
- 上手简单，开发者友好

### 劣势

- 没办法限制CPU占用，资源隔离性基本没有
- 生态显然没有docker强大

## 服务器准备

需要一台centos系统服务器或者在本地电脑里通过虚拟机安装centos系统

## 服务器配置

### 安装go

```shell
# 下载go安装包
wget https://dl.google.com/go/go1.17.8.linux-amd64.tar.gz
# 解压
tar -zxvf go1.17.8.linux-amd64.tar.gz
# 将解压出的go文件夹移到/usr/local路径
mv go /usr/local
```

将`/usr/local/go/bin`配置到`PATH`环境变量。可以在`~/.zshrc`或者`~/.bashrc`文件里加入下面的配置代码：

```shell
export PATH=$PATH:/usr/local/go/bin
```

创建软链接，非root用户需要加`sudo`前缀

```
ln -s /usr/local/go/bin/go /usr/bin/go
```

### 安装pm2

首先安装nodejs

```shell
yum update && yum install -y nodejs
```

然后安装pm2，非root用户需要加`sudo`前缀

```shell
npm install -g pm2 --registry=https://registry.npm.taobao.org
```

最后创建软链接，非root用户需要加`sudo`前缀

```shell
➜  ~ which node
/root/.nvm/versions/node/v14.19.1/bin/node
➜  ~ ln -s /root/.nvm/versions/node/v14.19.1/bin/node /usr/bin/node
➜  ~ which pm2
/root/.nvm/versions/node/v14.19.1/bin/pm2
➜  ~ ln -s /root/.nvm/versions/node/v14.19.1/bin/pm2 /usr/bin/pm2
```

### 安装mysql

本文要演示的实战案例采用mysql数据库做数据持久化。读者可以根据自己的实际情况选择是否跳过本节。

添加mysql仓库地址

```shell
yum localinstall https://dev.mysql.com/get/mysql57-community-release-el7-9.noarch.rpm
```

在mysql官网[https://dev.mysql.com/doc/refman/5.7/en/checking-gpg-signature.html](https://dev.mysql.com/doc/refman/5.7/en/checking-gpg-signature.html)找到最新的gpg公钥，通过vi命令复制黏贴到
`~/mysql5.7_pubkey.asc`文件里

```shell
vi mysql5.7_pubkey.asc
```

导入公钥到mysql和rpm

```shell
gpg --import mysql5.7_pubkey.asc
rpm --import mysql5.7_pubkey.asc
```

安装mysql5.7

```shell
yum install -y mysql-community-server
```

为了演示方便，我们把mysql的root用户的密码改为1234。生产环境一定不要设置这么简单的密码。首先需要通过vi命令修改`/etc/my.cnf`文件，在末尾加一行`validate_password = OFF`，关闭密码规则校验。

```shell
vi /etc/my.cnf
```

然后，我们启动mysql服务实例。

```shell
systemctl start mysqld 
```

再查看一下mysql服务的状态，看是否已成功启动。

```shell
➜  ~ systemctl status mysqld 
● mysqld.service - MySQL Server
   Loaded: loaded (/usr/lib/systemd/system/mysqld.service; enabled; vendor preset: disabled)
   Active: active (running) since 四 2022-05-05 09:09:41 CST; 33min ago
     Docs: man:mysqld(8)
           http://dev.mysql.com/doc/refman/en/using-systemd.html
  Process: 1156 ExecStart=/usr/sbin/mysqld --daemonize --pid-file=/var/run/mysqld/mysqld.pid $MYSQLD_OPTS (code=exited, status=0/SUCCESS)
  Process: 1132 ExecStartPre=/usr/bin/mysqld_pre_systemd (code=exited, status=0/SUCCESS)
 Main PID: 1159 (mysqld)
    Tasks: 28
   Memory: 185.1M
   CGroup: /system.slice/mysqld.service
           └─1159 /usr/sbin/mysqld --daemonize --pid-file=/var/run/mysqld/mysqld.pid

5月 05 09:09:40 VM-0-17-centos systemd[1]: Starting MySQL Server...
5月 05 09:09:41 VM-0-17-centos systemd[1]: Started MySQL Server.
```

mysql在安装的时候，会初始化一个临时的root密码，我们可以通过如下命令找到：

```shell
grep 'password' /var/log/mysqld.log
```

临时密码就在命令行终端输出的第一行日志的结尾。

```shell
➜  ~ grep 'password' /var/log/mysqld.log
2022-05-05T00:55:13.552165Z 1 [Note] A temporary password is generated for root@localhost: .B<UYdtda3rG
2022-05-05T00:55:17.373732Z 0 [Note] Shutting down plugin 'validate_password'
2022-05-05T00:55:18.983662Z 0 [Note] Shutting down plugin 'sha256_password'
```

我们复制出来临时密码以后，再执行如下命令：

```shell
mysql_secure_installation
```

根据提示将root密码改为1234。后面出现yes or no的输入提示，都输入no即可，即不做任何修改。

```shell
The existing password for the user account root has expired. Please set a new password.
New password:
Re-enter new password:
```

测试一下，密码是否修改成功，然后创建一个数据库`tutorial`

```shell
➜  ~ mysql -uroot -p1234
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 20
Server version: 5.7.38 MySQL Community Server (GPL)

Copyright (c) 2000, 2022, Oracle and/or its affiliates.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> CREATE SCHEMA `tutorial` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_general_ci;
Query OK, 1 row affected (0.00 sec)

mysql> 
```

最后，我们需要赋予root用户从任意ip远程访问的权限，这个也是为了演示方便，生产环境不建议这么搞。

```shell
CREATE USER 'root'@'%' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';
FLUSH PRIVILEGES;
```

至此服务器相关的配置工作已经完毕。

## 实战案例

下面我们通过一个案例说明和演示pm2的用法。

### 克隆代码

克隆到代码以后，请切到`usersvc`路径下。

```shell
git clone git@github.com:unionj-cloud/go-doudou-tutorials.git
```

### 创建表结构

因为服务器的mysql实例的`tutorial`数据库里还没有表，所以我们需要先通过`go-doudou ddl`命令创建表结构。执行命令之前，我们需要在本地创建一个配置文件`.env.test.local`，将如下配置复制进去：

```shell
# 本地开发需连接服务器的公网地址
DB_HOST=162.14.116.92
DB_PORT=3306
DB_USER=root
DB_PASSWD=1234
```

这样我们在本地执行go-doudou命令，就可以直接更新远程mysql服务实例的表结构。另外，我们需要把这个本地配置文件加到`.gitignore`文件里，不能上传到git仓库，也不能让线上服务启动时加载到这个配置文件。现在我们可以执行命令了。

```shell
➜  usersvc git:(master) ✗ go-doudou ddl --env=test --pre=t_   
INFO[2022-05-05 10:11:40] Type: name=User                              
CREATE TABLE `t_user` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`username` varchar(45) NOT NULL comment 'username',
`password` varchar(60) NOT NULL comment 'password',
`name` varchar(45) NOT NULL comment 'real name',
`phone` varchar(45) NOT NULL comment 'phone number',
`dept` varchar(45) NOT NULL comment 'department',
`avatar` varchar(255) NOT NULL comment 'user avatar',
`create_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
`update_at` datetime NULL DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
`delete_at` datetime NULL,
PRIMARY KEY (`id`),
UNIQUE INDEX `username_idx` (`username` asc))
```

可以连上mysql检查一下表结构是否创建成功。

```shell
➜  usersvc git:(master) ✗ mysql -h 162.14.116.92 -P 3306 -uroot -p1234
mysql: [Warning] Using a password on the command line interface can be insecure.
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 22
Server version: 5.7.38 MySQL Community Server (GPL)

Copyright (c) 2000, 2020, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> use tutorial;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+--------------------+
| Tables_in_tutorial |
+--------------------+
| t_user             |
+--------------------+
1 row in set (0.00 sec)

mysql> describe t_user;
+-----------+--------------+------+-----+-------------------+-----------------------------+
| Field     | Type         | Null | Key | Default           | Extra                       |
+-----------+--------------+------+-----+-------------------+-----------------------------+
| id        | int(11)      | NO   | PRI | NULL              | auto_increment              |
| username  | varchar(45)  | NO   | UNI | NULL              |                             |
| password  | varchar(60)  | NO   |     | NULL              |                             |
| name      | varchar(45)  | NO   |     | NULL              |                             |
| phone     | varchar(45)  | NO   |     | NULL              |                             |
| dept      | varchar(45)  | NO   |     | NULL              |                             |
| avatar    | varchar(255) | NO   |     | NULL              |                             |
| create_at | datetime     | YES  |     | CURRENT_TIMESTAMP |                             |
| update_at | datetime     | YES  |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |
| delete_at | datetime     | YES  |     | NULL              |                             |
+-----------+--------------+------+-----+-------------------+-----------------------------+
10 rows in set (0.02 sec)

mysql> 
```

### pm2 deploy命令

部署服务时我们主要用到pm2的`deploy`命令。具体用法，请看下面代码块中的说明。

```
> pm2 deploy <配置文件> <环境> <命令>

  命令列表:
    setup                执行远程初始化命令
    update               部署最新版本
    revert [n]           回滚到最近第n次部署的版本，n的默认值是1
    curr[ent]            输出当前线上版本的代码提交的7位hash
    prev[ious]           输出上一次线上版本的代码提交的7位hash
    exec|run <cmd>       执行<cmd>参数指定的命令
    list                 输出至今为止部署过的所有版本的代码提交的7位hash
    [ref]                部署配置文件中的"ref"属性指定的版本，或者是最新的git标签
```

我个人实践中用`setup`和`update`命令比较多。

#### pm2初始化

采用pm2部署和更新线上服务之前，我们需要先执行pm2的初始化命令。pm2配置文件`ecosystem.config.js`已经在代码里了，我们稍后讲解。

```shell
pm2 deploy ecosystem.config.js test setup
```

如果看到命令行终端最后一行输出`--> Success`，即表示初始化成功。

```shell
➜  usersvc git:(master) pm2 deploy ecosystem.config.js test setup
--> Deploying to test environment
--> on host 162.14.116.92
  ○ hook pre-setup
  ○ running setup
  ○ cloning git@github.com:unionj-cloud/go-doudou-tutorials.git
  ○ full fetch
正克隆到 '/root/deploy/go-doudou-tutorials/source'...
  ○ hook post-setup
  ○ setup complete
--> Success
```

#### pm2部署

还是先上命令。

```shell
pm2 deploy ecosystem.config.js test update
```

如果看到命令行终端最后一行输出`--> Success`，即表示部署成功。

```shell
➜  usersvc git:(master) pm2 deploy ecosystem.config.js test update
--> Deploying to test environment
--> on host 162.14.116.92
  ○ deploying origin/master
  ○ executing pre-deploy-local
  ○ hook pre-deploy
  ○ fast forward master
已经位于 'master'
来自 github.com:unionj-cloud/go-doudou-tutorials
 * branch            master     -> FETCH_HEAD
Already up-to-date.
  ○ executing post-deploy `cd usersvc && sh deploy.sh test`
[PM2][WARN] Applications usersvc not running, starting...
[PM2] App [usersvc] launched (1 instances)
┌─────┬────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name       │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ usersvc    │ default     │ N/A     │ fork    │ 10737    │ 0s     │ 0    │ online    │ 0%       │ 9.6mb    │ root     │ disabled │
└─────┴────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
  ○ hook test
  ○ successfully deployed origin/master
--> Success
```

### pm2部署配置文件

上文已经提到`ecosystem.config.js`文件是pm2部署命令所读取的配置文件，我们来看一下这个文件，说明已经以注释形式写在了代码上面。

```javascript
// 不同部署环境下程序所需要读取的环境变量配置
const ENV = {
  // 开发环境
  "env_dev": {
    // GDD_ENV环境变量相当于Java生态的spring boot框架的spring.profiles.active配置
    "GDD_ENV": "dev"
  },
  // 生成环境
  "env_prod": {
    "GDD_ENV": "prod"
  },
  // 测试环境
  "env_test": {
    "GDD_ENV": "test"
  }
};

module.exports = {
  // 可以在apps属性里配置多个应用
  "apps": [
    {
      // 应用名称
      "name": "usersvc",  
      // 启动文件，这里是go build编译以后的二进制可执行文件，可以是相对路径，也可以是绝对路径
      "script": "./api",  
      // 工作目录，因为go-doudou-tutorials是一个monorepo仓库，所以需要加上这个配置，
      // 默认的工作目录是/root/deploy/go-doudou-tutorials/current
      "cwd": "/root/deploy/go-doudou-tutorials/current/usersvc",  
      // 运行时环境，默认是nodejs的node。因为我们部署的是二进制可执行文件，所以不需要编译器
      "exec_interpreter": "",
      // 运行模式，pm2支持cluster和fork两种模式。
      // cluster模式，可以由pm2做负载均衡，但是只支持nodejs应用，
      // 所以如果是非nodejs应用，这里只能配置成fork
      "exec_mode": "fork",
      // javascript中的析构语法，相当于把ENV对象嵌入到这个对象里
      ...ENV
    },
  ],
  deploy: {
    // 部署test环境相关配置，可以配置任意多个任意名称的环境，
    // 比如uat，beta，release，production等等
    test: {
      // 可以配置多个ip地址，同时部署到多台测试服务器
      host: ['162.14.116.92'],
      // 服务器用户名
      user: 'root',
      // ssh相关配置
      ssh_options: "StrictHostKeyChecking=no",
      // 要部署的代码分支
      ref: 'origin/master',
      // git clone命令的代码仓库地址
      repo: "git@github.com:unionj-cloud/go-doudou-tutorials.git",
      // 代码的服务器磁盘路径
      path: "/root/deploy/go-doudou-tutorials",
      // post-deploy回调命令
      // 这里配置的命令的意思是切到usersvc路径下，然后执行deploy.sh脚本，传入test参数
      "post-deploy": "cd usersvc && sh deploy.sh test",
    }
  }
};
```

### deploy.sh脚本

`deploy.sh`脚本的作用是编译go代码，生成二进制可执行文件，设置时区环境变量，最后执行`pm2 restart`命令启动或重启服务。请参考下面的注释帮助理解。

```shell
#!/bin/bash

# 设置编译程序所需环境变量
# 开启go module
export GO111MODULE=on
# 设置goproxy，加快依赖下载速度
export GOPROXY=https://goproxy.cn,direct
# 编译程序，生成可执行文件
go build -v -o api cmd/main.go

# 因为本案例的代码里用到了go标准库time包，里面的time.Local静态变量会从TZ环境变量中取值，
# 如果没有配置此环境变量，则取默认值UTC时区，这通常不符合我们的需求
export TZ="Asia/Shanghai"

# 通过pm2启动服务进程，--only表示只部署usersvc应用，--env表示读取配置文件中ENV属性中的
# env_dev、env_prod、env_test中的哪一个，注意传参时不加env_前缀
# pm2 restart命令是在服务器上执行的命令，与pm2 deploy命令有本质区别
pm2 restart ecosystem.config.js --only usersvc --env $1
```

## 总结

本文我们首先介绍了pm2进程管理工具的主要功能和相比docker的优劣势，然后介绍了为部署go语言写的应用需要对服务器做的前期准备工作，最后我们通过一个实战案例演示了部署流程，并且讲解了pm2相关的配置文件和部署脚本。相信各位gopher已经掌握了通过pm2部署go-doudou服务的方法。在下一期文章，我会再拿一个Java生态的spring boot框架写的服务和go-doudou写的服务构成微服务的案例演示如何用pm2部署微服务。

## 参考链接

- pm2官方配置文件文档：[https://pm2.keymetrics.io/docs/usage/application-declaration/](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- pm2官方部署文档：[https://pm2.keymetrics.io/docs/usage/deployment/](https://pm2.keymetrics.io/docs/usage/deployment/)
