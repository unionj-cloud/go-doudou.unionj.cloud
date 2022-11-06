# 快速开始

- 安装go-doudou

```shell
go install -v github.com/unionj-cloud/go-doudou/v2@v2.0.0
```

- 克隆示例代码，切到`ddldemo`路径

```shell
git clone git@github.com:unionj-cloud/go-doudou-tutorials.git
```

- 启动mysql容器

```shell
docker-compose -f docker-compose.yml up -d
```

- 更新表结构和生成dao层代码

```shell
go-doudou ddl --dao --pre=ddl_
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(main) ls -la dao
total 56
drwxr-xr-x   6 wubin1989  staff   192  9  1 00:28 .
drwxr-xr-x  14 wubin1989  staff   448  9  1 00:28 ..
-rw-r--r--   1 wubin1989  staff   953  9  1 00:28 base.go
-rw-r--r--   1 wubin1989  staff    45  9  1 00:28 userdao.go
-rw-r--r--   1 wubin1989  staff  9125  9  1 00:28 userdaoimpl.go
-rw-r--r--   1 wubin1989  staff  5752  9  1 00:28 userdaosql.go
```

- 运行`main`函数

```shell
go run main.go   
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(master) go run main.go              
time="2022-05-23 19:14:30" level=info msg="SQL: INSERT INTO `test`.`ddl_user` ( `id`, `name`, `phone`, `age`, `no`, `school`, `is_student`, `delete_at`, `avg_score`, `hobby`) VALUES ( '0', 'jack', '13552053960', '30', '0', null,
'0', null, '97.534', '')"
time="2022-05-23 19:14:30" level=info msg="user jack's id is 11\n"
time="2022-05-23 19:14:30" level=info msg="SQL: select * from ddl_user where `age` > '27' order by `age` desc limit 0,1\tHIT: false"
time="2022-05-23 19:14:30" level=info msg="SQL: select count(1) from ddl_user where `age` > '27'\tHIT: false"
time="2022-05-23 19:14:30" level=info msg="returned user jack's id is 11\n"
time="2022-05-23 19:14:30" level=info msg="returned user jack's average score is 97.534"
time="2022-05-23 19:14:30" level=info msg="SQL: select * from ddl_user where `age` > '27' order by `age` desc limit 0,1\tHIT: true"
time="2022-05-23 19:14:30" level=info msg="SQL: select count(1) from ddl_user where `age` > '27'\tHIT: true"
time="2022-05-23 19:14:30" level=info msg="returned user jack's id is 11\n"
time="2022-05-23 19:14:30" level=info msg="returned user jack's average score is 97.534"
&{2 2}
time="2022-05-23 19:14:30" level=info msg="SQL: delete from ddl_user where `age` > '27';"
```

- 删除`domain`文件夹，`dao/userdaoimpl.go`文件和`dao/userdaosql.go`文件，并执行如下命令，我们来看从表结构生成`go`代码的特性

```shell
go-doudou ddl --reverse --dao --pre=ddl_
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(master) go-doudou ddl --reverse --dao --pre=ddl_
WARN[2022-03-18 09:22:50] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/ddldemo/dao/base.go already exists 
WARN[2022-03-18 09:22:50] file /Users/wubin1989/workspace/cloud/go-doudou-tutorials/ddldemo/dao/userdao.go already exists 
```

- 再次执行`main`函数

```shell
go run main.go   
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(master) ✗ go run main.go              
time="2022-05-23 19:15:25" level=info msg="SQL: INSERT INTO `test`.`ddl_user` ( `id`, `name`, `phone`, `age`, `no`, `school`, `is_student`, `delete_at`, `avg_score`, `hobby`) VALUES ( '0', 'jack', '13552053960', '30', '0', null, 
'0', null, '97.534', '')"
time="2022-05-23 19:15:25" level=info msg="user jack's id is 12\n"
time="2022-05-23 19:15:25" level=info msg="SQL: select * from ddl_user where `age` > '27' order by `age` desc limit 0,1\tHIT: false"
time="2022-05-23 19:15:25" level=info msg="SQL: select count(1) from ddl_user where `age` > '27'\tHIT: false"
time="2022-05-23 19:15:25" level=info msg="returned user jack's id is 12\n"
time="2022-05-23 19:15:25" level=info msg="returned user jack's average score is 97.534"
time="2022-05-23 19:15:25" level=info msg="SQL: select * from ddl_user where `age` > '27' order by `age` desc limit 0,1\tHIT: true" 
time="2022-05-23 19:15:25" level=info msg="SQL: select count(1) from ddl_user where `age` > '27'\tHIT: true"
time="2022-05-23 19:15:25" level=info msg="returned user jack's id is 12\n"
time="2022-05-23 19:15:25" level=info msg="returned user jack's average score is 97.534"
&{2 2}
time="2022-05-23 19:15:25" level=info msg="SQL: delete from ddl_user where `age` > '27';"
```