# 命令行工具

Go-doudou内置了基于命令行终端的代码生成器。`go-doudou`是根命令，有两个参数。

- `-v` 打印当前安装的go-doudou命令行工具的版本

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou -v     
go-doudou version v1.0.2
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

Go-doudou还提供了若干子命令来加速整个开发流程。我们挨个看一下。

## version

`go-doudou version` 主要用于升级`go-doudou`命令行工具版本。它不仅打印当前安装版本的信息，还打印最新发布版本的信息，并且询问你是否要升级。

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou version
Installed version is v0.9.8
Latest release version is v1.0.2
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
go-doudou svc http --handler -c --doc
```

#### 参数

有一些参数可以配置代码生成器的行为。下面我们一一介绍一下：

- `--handler`: `bool`类型。如果设置了这个参数，`go-doudou`会生成默认的`http.Handler`接口实现，解析请求参数到表单对象、解析请求体到结构体对象以及返回响应体。

- `-c` or `--client`: `bool` 类型。用于设置是否生成封装了[go-resty](https://github.com/go-resty/resty) 的http请求客户端代码。

- `--doc`: `bool` type. It is used for generating [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3) description file in json format.

- `-e` or `--env`: `string` 类型。用于设置写进http请求客户端代码里的服务端baseUrl的环境变量名。如果没有指定，默认采用`svc.go`文件里的字母大写的服务接口名。

```go
func NewHelloworldClient(opts ...ddhttp.DdClientOption) *HelloworldClient {
	defaultProvider := ddhttp.NewServiceProvider("HELLOWORLD")
	defaultClient := ddhttp.NewClient()

	...

	return svcClient
}
```

上面代码的第2行，`HELLOWORLD`就是默认名称。如前文所述，go-doudou同时支持开发单体应用。如果你不需要客户端程序加入go-doudou微服务集群，享受开箱即用的服务发现和客户端负载均衡机制，你可以直接在配置文件中将`HELLOWORLD`环境变量设置为服务端可以直连的请求地址。我们来执行一下命令`go-doudou svc http --handler -c --doc -e godoudou_helloworld`，看一下有什么变化。

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

基于[jmoiron/sqlx](https://github.com/jmoiron/sqlx)的表结构同步和Dao层代码生成子命令。目前仅支持`mysql`。

### 特性

- 从Go语言结构体类型创建或更新表结构，仅新增和更新字段，不删字段
- 从表结构生成Go语言结构体
- 生成支持单表CRUD操作的Dao层代码
- Dao层代码支持数据库事务
- 支持索引的创建和更新
- 支持外键的创建和更新

### 命令行参数

```shell
➜  go-doudou git:(main) go-doudou ddl -h 
migration tool between database table structure and golang struct

Usage:
  go-doudou ddl [flags]

Flags:
  -d, --dao             If true, generate dao code.
      --df string       Name of dao folder. (default "dao")
      --domain string   Path of domain folder. (default "domain")
      --env string      Environment name such as dev, uat, test, prod, default is dev (default "dev")
  -h, --help            help for ddl
      --pre string      Table name prefix. e.g.: prefix biz_ for biz_product.
  -r, --reverse         If true, generate domain code from database. If false, update or create database tables from domain code.
```

### 快速开始

- 安装go-doudou

```shell
go get -v github.com/unionj-cloud/go-doudou@v1.0.2
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

- 运行单元测试

```shell
go test -race ./... -count=1
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(master) go test -race ./... -count=1
?   	doudoudemo	[no test files]
ok  	doudoudemo/dao	0.100s
?   	doudoudemo/domain	[no test files]
```

- 运行`main`函数

```shell
go run main.go   
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(master) go run main.go              
INFO[2022-03-18 09:14:44] user jack's id is 8                          
INFO[2022-03-18 09:14:44] returned user jack's id is 8                 
INFO[2022-03-18 09:14:44] returned user jack's average score is 97.534 
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

- 再次执行单元测试

```shell
go test -race ./... -count=1
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(master) ✗ go test -race ./... -count=1
?   	doudoudemo	[no test files]
ok  	doudoudemo/dao	0.092s
?   	doudoudemo/domain	[no test files]
```

- 再次执行`main`函数

```shell
go run main.go   
```

你可以看到如下的命令行输出:
```
➜  ddldemo git:(master) ✗ go run main.go              
INFO[2022-03-18 09:24:57] user jack's id is 11                         
INFO[2022-03-18 09:24:57] returned user jack's id is 11                
INFO[2022-03-18 09:24:57] returned user jack's average score is 97.534 
```

### API

#### 示例
```go
package domain

import "time"

type Base struct {
	CreateAt *time.Time `dd:"default:CURRENT_TIMESTAMP"`
	UpdateAt *time.Time `dd:"default:CURRENT_TIMESTAMP;extra:ON UPDATE CURRENT_TIMESTAMP"`
	DeleteAt *time.Time
}
```
```go
package domain

//dd:table
type Book struct {
  ID          int `dd:"pk;auto"`
  UserId      int `dd:"type:int"`
  PublisherId int	`dd:"fk:ddl_publisher,id,fk_publisher,ON DELETE CASCADE ON UPDATE NO ACTION"`

  Base
}
```
```go
package domain

//dd:table
type Publisher struct {
  ID   int `dd:"pk;auto"`
  Name string

  Base
}
```
```go
package domain

import "time"

//dd:table
type User struct {
  ID         int    `dd:"pk;auto"`
  Name       string `dd:"index:name_phone_idx,2;default:'jack'"`
  Phone      string `dd:"index:name_phone_idx,1;default:'13552053960';extra:comment '手机号'"`
  Age        int    `dd:"unsigned"`
  No         int    `dd:"type:int;unique"`
  UniqueCol  int    `dd:"type:int;unique:unique_col_idx,1"`
  UniqueCol2 int    `dd:"type:int;unique:unique_col_idx,2"`
  School     string `dd:"null;default:'harvard';extra:comment '学校'"`
  IsStudent  bool
  ArriveAt *time.Time `dd:"type:datetime;extra:comment '到货时间'"`
  Status   int8       `dd:"type:tinyint(4);extra:comment '0进行中
1完结
2取消'"`

  Base
}
```

#### 标签

##### pk

表示主键

##### auto

表示自增

##### type

字段类型，非必须。如果没有显式设置，默认的对应规则如表格所示

| Go语言类型（包括指针类型） | Mysql字段类型  |
| :----------------: | :----------: |
| int, int16, int32  |     int      |
|       int64        |    bigint    |
|      float32       |    float     |
|      float64       |    double    |
|       string       | varchar(255) |
|     bool, int8     |   tinyint    |
|     time.Time      |   datetime   |
|  decimal.Decimal   | decimal(6,2) |

##### default

默认值。如果是mysql数据库内置的函数或由内置函数构成的表达式，则不需要单引号。如果是字面值，则需要单引号。

##### extra

额外定义。示例："on update CURRENT_TIMESTAMP"，"comment 'cellphone number'"  
**注意：在`comment`里不要出现英文分号`;`和英文冒号`:`**

##### index

设置索引。

- 格式："index:Name,Order,Sort" or "index"
- `Name`: 索引名称，字符串类型。如果有多个字段设置了相同的索引名称，则会在该表中创建复合索引。非必须。默认值为`字段名_idx`
- `Order`: 顺序，`int`类型 
- `Sort`: 排序规则，字符串类型。仅接受两种值：`asc` 和 `desc`。非必须。默认值是`asc`

##### unique

唯一索引，用法同索引。

##### null

可接受`null`值. **注意：如果字段类型是指针类型，则默认可接受`null`值**

##### unsigned

无符号

##### fk

设置外键

- 格式："fk:ReferenceTableName,ReferenceTablePrimaryKey,Constraint,Action"  
- `ReferenceTableName`：关联表名称
- `ReferenceTablePrimaryKey`：关联表主键，如`id`
- `Constraint`：外键名称，如`fk_publisher`
- `Action`：示例：`ON DELETE CASCADE ON UPDATE NO ACTION`

#### Dao层代码

##### 单表CRUD

```go
package dao

import (
  "context"
  "github.com/unionj-cloud/go-doudou/ddl/query"
)

type Base interface {
  Insert(ctx context.Context, data interface{}) (int64, error)
  Upsert(ctx context.Context, data interface{}) (int64, error)
  UpsertNoneZero(ctx context.Context, data interface{}) (int64, error)
  DeleteMany(ctx context.Context, where query.Q) (int64, error)
  Update(ctx context.Context, data interface{}) (int64, error)
  UpdateNoneZero(ctx context.Context, data interface{}) (int64, error)
  UpdateMany(ctx context.Context, data interface{}, where query.Q) (int64, error)
  UpdateManyNoneZero(ctx context.Context, data interface{}, where query.Q) (int64, error)
  Get(ctx context.Context, id interface{}) (interface{}, error)
  SelectMany(ctx context.Context, where ...query.Q) (interface{}, error)
  CountMany(ctx context.Context, where ...query.Q) (int, error)
  PageMany(ctx context.Context, page query.Page, where ...query.Q) (query.PageRet, error)
}
```

##### 数据库事务

示例：
```go
func (receiver *StockImpl) processExcel(ctx context.Context, f multipart.File, sheet string) (err error) {
	types := []string{"food", "tool"}
	var (
		xlsx *excelize.File
		rows [][]string
		tx   ddl.Tx
	)
	xlsx, err = excelize.OpenReader(f)
	if err != nil {
		return errors.Wrap(err, "")
	}
	rows, err = xlsx.GetRows(sheet)
	if err != nil {
		return errors.Wrap(err, "")
	}
	colNum := len(rows[0])
	rows = rows[1:]
	// 封装数据库连接实例到GddDB类型
    gdddb := wrapper.GddDB{receiver.db}
	// 开启事务
	tx, err = gdddb.BeginTxx(ctx, nil)
	if err != nil {
		return errors.Wrap(err, "")
	}
	defer func() {
		if r := recover(); r != nil {
			_ = tx.Rollback()
			if e, ok := r.(error); ok {
				err = errors.Wrap(e, "")
			} else {
				err = errors.New(fmt.Sprint(r))
			}
		}
	}()
	// 将tx作为ddl.Querier实例注入dao层的工厂方法创建dao实例
	mdao := dao.NewMaterialDao(tx)
	for _, item := range rows {
		if len(item) == 0 {
			goto END
		}
		row := make([]string, colNum)
		copy(row, item)
		name := row[0]
		price := cast.ToFloat32(row[1])
		spec := row[2]
		pieces := cast.ToInt(row[3])
		amount := cast.ToInt(row[4])
		note := row[5]
		totalMount := pieces * amount
		if _, err = mdao.Upsert(ctx, domain.Material{
			Name:        name,
			Amount:      amount,
			Price:       price,
			TotalAmount: totalMount,
			Spec:        spec,
			Pieces:      pieces,
			Type:        int8(sliceutils.IndexOf(sheet, types)),
			Note:        note,
		}); err != nil {
			// 如果有错误，则回滚
			_ = tx.Rollback()
			return errors.Wrap(err, "")
		}
	}
END:
	// 提交事务
	if err = tx.Commit(); err != nil {
        _ = tx.Rollback()
		return errors.Wrap(err, "")
	}
	return err
}
```

#### Sql语句构建DSL

##### 示例

```go
func ExampleCriteria() {

	query := C().Col("name").Eq("wubin").Or(C().Col("school").Eq("havard")).And(C().Col("age").Eq(18))
	fmt.Println(query.Sql())

	query = C().Col("name").Eq("wubin").Or(C().Col("school").Eq("havard")).And(C().Col("delete_at").IsNotNull())
	fmt.Println(query.Sql())

	query = C().Col("name").Eq("wubin").Or(C().Col("school").In("havard")).And(C().Col("delete_at").IsNotNull())
	fmt.Println(query.Sql())

	query = C().Col("name").Eq("wubin").Or(C().Col("school").In([]string{"havard", "beijing unv"})).And(C().Col("delete_at").IsNotNull())
	fmt.Println(query.Sql())

	query = C().Col("name").Eq("wubin").Or(C().Col("age").In([]int{5, 10})).And(C().Col("delete_at").IsNotNull())
	fmt.Println(query.Sql())

	query = C().Col("name").Ne("wubin").Or(C().Col("create_at").Lt("now()"))
	fmt.Println(query.Sql())

	page := Page{
		Orders: []Order{
			{
				Col:  "create_at",
				Sort: sortenum.Desc,
			},
		},
		Offset: 20,
		Size:   10,
	}
	page = page.Order(Order{
		Col:  "score",
		Sort: sortenum.Asc,
	})
	page = page.Limit(30, 5)
	fmt.Println(page.Sql())
	pageRet := NewPageRet(page)
	fmt.Println(pageRet.PageNo)

	fmt.Println(P().Order(Order{
		Col:  "score",
		Sort: sortenum.Asc,
	}).Limit(20, 10).Sql())

	query = C().Col("name").Eq("wubin").Or(C().Col("school").Eq("havard")).
		And(C().Col("age").Eq(18)).
		Or(C().Col("score").Gte(90))
	fmt.Println(query.Sql())

	page = P().Order(Order{
		Col:  "create_at",
		Sort: sortenum.Desc,
	}).Limit(0, 1)
	var where Q
	where = C().Col("project_id").Eq(1)
	where = where.And(C().Col("delete_at").IsNull())
	where = where.Append(page)
	fmt.Println(where.Sql())

	where = C().Col("project_id").Eq(1)
	where = where.And(C().Col("delete_at").IsNull())
	where = where.Append(String("for update"))
	fmt.Println(where.Sql())

	where = C().Col("cc.project_id").Eq(1)
	where = where.And(C().Col("cc.delete_at").IsNull())
	where = where.Append(String("for update"))
	fmt.Println(where.Sql())

	where = C().Col("cc.survey_id").Eq("abc").
		And(C().Col("cc.year").Eq(2021)).
		And(C().Col("cc.month").Eq(10)).
		And(C().Col("cc.stat_type").Eq(2)).Append(String("for update"))
	fmt.Println(where.Sql())

    where = C().Col("cc.name").Like("%ba%")
    fmt.Println(where.Sql())

	// Output:
	//((`name` = ? or `school` = ?) and `age` = ?) [wubin havard 18]
	//((`name` = ? or `school` = ?) and `delete_at` is not null) [wubin havard]
	//((`name` = ? or `school` in (?)) and `delete_at` is not null) [wubin havard]
	//((`name` = ? or `school` in (?,?)) and `delete_at` is not null) [wubin havard beijing unv]
	//((`name` = ? or `age` in (?,?)) and `delete_at` is not null) [wubin 5 10]
	//(`name` != ? or `create_at` < ?) [wubin now()]
	//order by `create_at` desc,`score` asc limit ?,? [30 5]
	//7
	//order by `score` asc limit ?,? [20 10]
	//(((`name` = ? or `school` = ?) and `age` = ?) or `score` >= ?) [wubin havard 18 90]
	//(`project_id` = ? and `delete_at` is null) order by `create_at` desc limit ?,? [1 0 1]
	//(`project_id` = ? and `delete_at` is null) for update [1]
	//(cc.`project_id` = ? and cc.`delete_at` is null) for update [1]
	//(((cc.`survey_id` = ? and cc.`year` = ?) and cc.`month` = ?) and cc.`stat_type` = ?) for update [abc 2021 10 2]
    //cc.`name` like ? [%ba%]
}
```

### 新增dao层代码

实际开发中，我们一定需要自己编写一些更复杂的CRUD代码。怎么做呢？下面我们以`user`表为例来说明开发步骤：

- 首先需要在`dao`文件夹下的`userdao.go`文件里的`UserDao`接口里定义方法，例如：
```go
type UserDao interface {
	Base
	FindUsersByHobby(ctx context.Context, hobby string) ([]domain.User, error)
}
```
我们这里加了一个`FindUsersByHobby`方法

- 然后我们需要在`dao`文件夹下新建一个文件`userdaoimplext.go`，文件名任意，但推荐以去掉前缀的表名 + `daoimplext.go`的方式命名

- 在新创建的文件里编写`FindUsersByHobby`方法的实现
```go
func (receiver UserDaoImpl) FindUsersByHobby(ctx context.Context, hobby string) (users []domain.User, err error) {
	sqlStr := `select * from ddl_user where hobby = ? and delete_at is null`
	err = receiver.db.SelectContext(ctx, &users, receiver.db.Rebind(sqlStr), hobby)
	return
}
```
- 我们新建一个测试文件`userdaoimplext_test.go`，编写单元测试
```go
func TestUserDaoImpl_FindUsersByHobby(t *testing.T) {
	t.Parallel()
	u := dao.NewUserDao(db)
	users, err := u.FindUsersByHobby(context.Background(), "football")
	require.NoError(t, err)
	require.NotEqual(t, 0, len(users))
}
```

### 最佳实践

下面说的几点最佳实践只是作者总结的，仅供参考。

- 先通过`Navicat`或者`Mysql Workbench`之类的数据库设计工具整体设计表结构
- 再通过命令`go-doudou ddl --reverse --dao`命令一把生成Go代码，`--reverse`参数仅在初始化项目时使用
- 后续开发迭代过程中，修改`domain`文件夹的代码以后，须先将`dao`文件夹中的以`sql.go`为后缀的文件，如`userdaosql.go`删掉，再通过命令`go-doudou ddl --dao`将修改同步到数据库表结构，同时重新生成`sql.go`为后缀的文件。如果修改了表名称或者表前缀，则`dao`文件夹中的以`daoimpl.go`为后缀的文件，如`userdaoimpl.go`也需要删掉并重新生成。
- 新增dao层代码一定要在新建的文件里编写，一定不要人工修改`dao`文件夹里的`base.go`、以`daoimpl.go`为后缀和以`daosql.go`为后缀的这三类文件的代码，在整个项目生命周期里这三类文件都必须是可以随时删除随时重新生成且不影响程序功能的

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








