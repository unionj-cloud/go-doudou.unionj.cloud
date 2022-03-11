# CLI

Go-doudou has built-in code generation CLI. `go-doudou` is the root command and there are two flags for it.

- `-v` can tell you current installed version of go-doudou.

```shell
➜  go-doudou.github.io git:(dev) ✗ go-doudou -v     
go-doudou version v1.0.1
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
Latest release version is v1.0.1 
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

`go-doudou svc http` is used for generating http routes and handlers for RESTful service. For example:
```shell
go-doudou svc http --handler -c --doc
```

#### Flags

There are several flags for configuring the code generation behavior. Let me explain them one by one:

- `--handler`: `bool` type. If you set this flag, go-doudou will generate default http handler implementations which parse request parameters into form and decode request body into struct, and also send http response back. 

- `-c` or `--client`: `bool` type. It is used for generating [go-resty](https://github.com/go-resty/resty) based http client code.

- `--doc`: `bool` type. It is used for generating [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3) description file in json format.

- `-e` or `--env`: `string` type. It is used for setting server url environment variable name. If you don't set it, it will be the upper case of service interface name in svc.go file. The name will used in client factory function like this:

```go
func NewHelloworldClient(opts ...ddhttp.DdClientOption) *HelloworldClient {
	defaultProvider := ddhttp.NewServiceProvider("HELLOWORLD")
	defaultClient := ddhttp.NewClient()

	...

	return svcClient
}
```

In line 2, the `HELLOWORLD` is the default name. As we said before, go-doudou is also supporting monolithic service. If your service client application don't want to join go-doudou cluster and use the out-of-box service discovery and client side load balancing feature, it can set `HELLOWORLD` to your service public url, and it will send requests to that url. Let's try run `go-doudou svc http --handler -c --doc -e godoudou_helloworld` to see what changes:

```go
func NewHelloworldClient(opts ...ddhttp.DdClientOption) *HelloworldClient {
	defaultProvider := ddhttp.NewServiceProvider("godoudou_helloworld")
	defaultClient := ddhttp.NewClient()

	...

    return svcClient
}
```

- `--case`: `string` type. As there are some anonymous structs defining http response body data structure in generated http handler code, we need this flag to let users configure json tag for fields. It accepts `lowerCamel` or `snake`, default is `lowerCamel`.

- `-o` or `--omitempty`: `bool` type. If you set this flag, `,omitempty` will be appended to json tag of fields of every generated anonymous struct in http handlers.

- `-r` or `--routePattern`: `int` type. It is used for configuring http route pattern generate strategy. If you set it to `0`, go-doudou will convert name of each service interface method from upper-camel case to snake case, then replace `_` to `/`. If you set it to `1`, go-doudou will join lower-case service interface name with each lower-case method name by `/`. Default is `0` which is also recommended. Here is an example. If there is a method named `PublicSignUp` in `Usersvc` interface, its http route will be `/public/sign/up` if you don't set this flag or set this flag to `0` explicitly. If you set this flag to `1`, its http route will be `/usersvc/publicsignup`.

#### Subcommands

There is only one subcommand `client` available. It is used for generating golang http client code from OpenAPI 3.0 spec json file. There are some flags for it. Let's see an example:

```shell
go-doudou svc http client -o -e GRAPHHOPPER -f https://docs.graphhopper.com/openapi.json --pkg graphhopper
```

- `-e` or `--env`: `string` type. It is used for setting server url environment variable name.

- `-f` or `--file`: `string` type. It is used for setting OpenAPI 3.0 spec json file path or download link.

- `-o` or `--omit`: `bool` type. It is used for configuring whether to append `,omitempty` to json tag.

- `-p` or `--pkg`: `string` type. It is used for setting client package name. Default is `client`.

::: tip
There must be `200` response in `responses` object for each api, otherwise client code will not be generated and you will see an error message from command line output for corresponding api like this:

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

`go-doudou svc run` is used for starting our service in development.

- `-w` or `--watch`: `bool` type. It is used for enabling watch mode. Not support on windows. I made this feature, but I am not recommending you to use it as I personally prefer to start or shutdown a program through IDE manually.

### push

`go-doudou svc push` is used for building docker image, pushing to your remote repository and generating k8s deployment files. It runs `go mod vendor`, `docker build`, `docker tag`, `docker push` commands sequentially. For example: 

```shell
go-doudou svc push --pre godoudou_ -r wubin1989
```

- `--pre`: `string` type. Its value will be prefixed to image name for grouping your images.

- `-r` or `--repo`: `string` type. Docker image will be pushed to this repository.

After executed this command, you will get two files: 

- `${service}_deployment.yaml`: k8s deploy file for stateless service, recommended to be used for monolith architecture services
- `${service}_statefulset.yaml`: k8s deploy file for stateful service, recommended to be used for microservice architecture services

### deploy

`go-doudou svc deploy` is used for deploying your service to kubernetes. It runs `kubectl apply -f` command underlyingly. For example, 

```shell
go-doudou svc deploy -k helloworld_deployment.yaml
```

- `-k` or `--k8sfile`: `string` type. It is used for specifying k8s deployment file path. Default is `${service}_statefulset.yaml`.

### shutdown

`go-doudou svc shutdown` is used for shutting down your service on kubernetes. It runs `kubectl delete -f` command underlyingly. For example, 

```shell
go-doudou svc shutdown -k helloworld_deployment.yaml
```

- `-k` or `--k8sfile`: `string` type. It is used for specifying k8s deployment file path. Default is `${service}_statefulset.yaml`.  

## ddl

DDL and dao layer generation subcommand based on [jmoiron/sqlx](https://github.com/jmoiron/sqlx).

### Features

- Create/Update table from go struct
- Create/Update go struct from table
- Generate dao layer code with basic crud operations
- Support transaction in dao layer
- Support index update
- Support foreign key

### Flags

```shell
➜  ~ go-doudou ddl -h
migration tool between database table structure and golang struct

Usage:
  go-doudou ddl [flags]

Flags:
  -d, --dao             If true, generate dao code.
      --df string       Name of dao folder. (default "dao")
      --domain string   Path of domain folder. (default "domain")
      --env string      Path of database connection config .env file (default ".env")
  -h, --help            help for ddl
      --pre string      Table name prefix. e.g.: prefix biz_ for biz_product.
  -r, --reverse         If true, generate domain code from database. If false, update or create database tables from domain code.
```

### Quickstart

- Install go-doudou

  ```shell
  go get -v github.com/unionj-cloud/go-doudou@v1.0.1
  ```

- Clone demo repository

  ```
  git clone git@github.com:unionj-cloud/ddldemo.git
  ```

- Update database table struct and generate dao layer code

  ```shell
  go-doudou ddl --dao --pre=ddl_
  ```

  ```shell
  ➜  ddldemo git:(main) ls -la dao
  total 56
  drwxr-xr-x   6 wubin1989  staff   192  9  1 00:28 .
  drwxr-xr-x  14 wubin1989  staff   448  9  1 00:28 ..
  -rw-r--r--   1 wubin1989  staff   953  9  1 00:28 base.go
  -rw-r--r--   1 wubin1989  staff    45  9  1 00:28 userdao.go
  -rw-r--r--   1 wubin1989  staff  9125  9  1 00:28 userdaoimpl.go
  -rw-r--r--   1 wubin1989  staff  5752  9  1 00:28 userdaosql.go
  ```

- Run main function

  ```
  ➜  ddldemo git:(main) go run main.go       
  INFO[0000] user jack's id is 14                         
  INFO[0000] returned user jack's id is 14                
  INFO[0000] returned user jack's average score is 97.534
  ```

- Delete domain and dao folder

  ```shell
  ➜  ddldemo git:(main) rm -rf dao && rm -rf domain
  ```

- Generate go struct and dao layer code from database

  ```shell
  go-doudou ddl --reverse --dao --pre=ddl_
  ```

  ```shell
  ➜  ddldemo git:(main) ✗ ll
  total 272
  -rw-r--r--  1 wubin1989  staff   1.0K  9  1 00:27 LICENSE
  -rw-r--r--  1 wubin1989  staff    85B  9  1 00:27 Makefile
  -rw-r--r--  1 wubin1989  staff     9B  9  1 00:27 README.md
  drwxr-xr-x  6 wubin1989  staff   192B  9  1 00:35 dao
  drwxr-xr-x  3 wubin1989  staff    96B  9  1 00:35 domain
  -rw-r--r--  1 wubin1989  staff   339B  9  1 00:27 go.mod
  -rw-r--r--  1 wubin1989  staff   116K  9  1 00:27 go.sum
  -rw-r--r--  1 wubin1989  staff   2.0K  9  1 00:27 main.go
  ```

- Run main function again

  ```
  ➜  ddldemo git:(main) ✗ go run main.go                          
  INFO[0000] user jack's id is 15                         
  INFO[0000] returned user jack's id is 15                
  INFO[0000] returned user jack's average score is 97.534 
  ```

  

### API

#### Example
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

#### Tags

##### pk

Primary key

##### auto

Autoincrement

##### type

Column type. Not required.

| Go Type（pointer） | Column Type  |
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

Default value. If value was database built-in function or expression made by built-in functions, not need single quote marks. If value was literal value, it should be quoted by single quote marks.

##### extra

Extra definition. Example: "on update CURRENT_TIMESTAMP"，"comment 'cellphone number'"  
**Note：don't use ; and : in comment**

##### index

- Format："index:Name,Order,Sort" or "index"
- Name: index name. string. If multiple fields use the same index name, the index will be created as composite index. Not required. Default index name is column name + _idx
- Order：int
- Sort：string. Only accept asc and desc. Not required. Default is asc

##### unique

Unique index. Usage is the same as index.

##### null

Nullable. **Note: if the field is a pointer, null is default.**

##### unsigned

Unsigned

##### fk

- Format："fk:ReferenceTableName,ReferenceTablePrimaryKey,Constraint,Action"  
- ReferenceTableName: reference table name
- ReferenceTablePrimaryKey: reference table primary key such as `id`
- Constraint: foreign key constraint such as `fk_publisher`
- Action: for example: `ON DELETE CASCADE ON UPDATE NO ACTION`



#### Dao layer code

##### CRUD

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



##### Transaction
Example：
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
    gdddb := wrapper.GddDB{receiver.db}
	// begin transaction
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
	// inject tx as ddl.Querier into dao layer implementation instance
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
			// rollback if err != nil
			_ = tx.Rollback()
			return errors.Wrap(err, "")
		}
	}
END:
	// commit
	if err = tx.Commit(); err != nil {
        _ = tx.Rollback()
		return errors.Wrap(err, "")
	}
	return err
}
```



#### Query Dsl

##### Example

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

## name

Subcommand for generating json tag of struct field. Default strategy is lower-camel. Support snake case as well. Unexported fields will be skipped, only modify json tag of each exported field.

### Flags

```shell
➜  go-doudou git:(main) go-doudou name -h   
WARN[0000] Error loading .env file: open /Users/wubin1989/workspace/cloud/.env: no such file or directory 
bulk add or update struct fields json tag

Usage:
  go-doudou name [flags]

Flags:
  -f, --file string       absolute path of vo file
  -h, --help              help for name
  -o, --omitempty         whether omit empty value or not
  -s, --strategy string   name of strategy, currently only support "lowerCamel" and "snake" (default "lowerCamel")
```

### Usage

- Put `//go:generate go-doudou name --file $GOFILE` into go file

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

- Execute  `go generate ./...` at the same folder

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







