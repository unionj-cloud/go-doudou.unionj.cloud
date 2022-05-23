# ddl命令行工具

`go-doudou ddl`命令是表结构同步和生成单表dao层代码的命令行工具。其中表结构同步支持双向同步，即支持从go语言结构体创建和更新数据库表结构和从数据库表结构生成go语言结构体。

## 特性

- 从Go语言结构体类型创建或更新表结构，仅新增和更新字段，不删字段
- 从表结构生成Go语言结构体
- 生成支持单表CRUD操作的Dao层代码
- Dao层代码支持数据库事务
- 支持索引的创建和更新
- 支持外键的创建和更新

## 命令行参数

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

## 表结构同步

从go语言结构体创建和更新数据库表结构命令示例：`go-doudou ddl --pre=ddl_`，`--pre`表示表名称前缀。

从数据库表结构生成go语言结构体代码命令示例：`go-doudou ddl --reverse --pre=ddl_`，必须加`--reverse`或`-r`。

下面我们看一下从go语言结构体同步数据库表结构所需加的结构体标签。

### 示例
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

### pk

表示主键

### auto

表示自增

### type

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

### default

默认值。如果是mysql数据库内置的函数或由内置函数构成的表达式，则不需要单引号。如果是字面值，则需要单引号。

### extra

额外定义。示例："on update CURRENT_TIMESTAMP"，"comment 'cellphone number'"  
**注意：在`comment`里不要出现英文分号`;`和英文冒号`:`**

### index

设置索引。

- 格式："index:Name,Order,Sort" or "index"
- `Name`: 索引名称，字符串类型。如果有多个字段设置了相同的索引名称，则会在该表中创建复合索引。非必须。默认值为`字段名_idx`
- `Order`: 顺序，`int`类型 
- `Sort`: 排序规则，字符串类型。仅接受两种值：`asc` 和 `desc`。非必须。默认值是`asc`

### unique

唯一索引，用法同索引。

### null

可接受`null`值. **注意：如果字段类型是指针类型，则默认可接受`null`值**

### unsigned

无符号

### fk

设置外键

- 格式："fk:ReferenceTableName,ReferenceTablePrimaryKey,Constraint,Action"  
- `ReferenceTableName`：关联表名称
- `ReferenceTablePrimaryKey`：关联表主键，如`id`
- `Constraint`：外键名称，如`fk_publisher`
- `Action`：示例：`ON DELETE CASCADE ON UPDATE NO ACTION`

## Dao层代码生成

生成单表dao层代码时需要加上`--dao`，示例：`go-doudou ddl --dao --pre=ddl_`。

### 单表CRUD

```go
package dao

import (
	"context"
	"github.com/unionj-cloud/go-doudou/toolkit/sqlext/query"
)

type Base interface {
	Insert(ctx context.Context, data interface{}) (int64, error)
	Upsert(ctx context.Context, data interface{}) (int64, error)
	UpsertNoneZero(ctx context.Context, data interface{}) (int64, error)
	Update(ctx context.Context, data interface{}) (int64, error)
	UpdateNoneZero(ctx context.Context, data interface{}) (int64, error)
	BeforeSaveHook(ctx context.Context, data interface{})
	AfterSaveHook(ctx context.Context, data interface{}, lastInsertID int64, affected int64)

	UpdateMany(ctx context.Context, data interface{}, where query.Q) (int64, error)
	UpdateManyNoneZero(ctx context.Context, data interface{}, where query.Q) (int64, error)
	BeforeUpdateManyHook(ctx context.Context, data interface{}, where query.Q)
	AfterUpdateManyHook(ctx context.Context, data interface{}, where query.Q, affected int64)

	DeleteMany(ctx context.Context, where query.Q) (int64, error)
	DeleteManySoft(ctx context.Context, where query.Q) (int64, error)
	BeforeDeleteManyHook(ctx context.Context, data interface{}, where query.Q)
	AfterDeleteManyHook(ctx context.Context, data interface{}, where query.Q, affected int64)

	SelectMany(ctx context.Context, where ...query.Q) (interface{}, error)
	CountMany(ctx context.Context, where ...query.Q) (int, error)
	PageMany(ctx context.Context, page query.Page, where ...query.Q) (query.PageRet, error)
	BeforeReadManyHook(ctx context.Context, page *query.Page, where ...query.Q)
	
	Get(ctx context.Context, id interface{}) (interface{}, error)
}
```

### 数据库事务

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
    gdddb := wrapper.NewGddDB(db, wrapper.WithLogger(logger.NewSqlLogger(log.Default())))
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

### 钩子函数

ddl工具生成的dao层代码里提供了以下7个钩子函数，需用户自定义实现业务逻辑。

```go
// 在 insert/upsert/update 操作中自动调用
BeforeSaveHook(ctx context.Context, data interface{})
AfterSaveHook(ctx context.Context, data interface{}, lastInsertID int64, affected int64)

// 在 update many 操作中自动调用
BeforeUpdateManyHook(ctx context.Context, data interface{}, where query.Q)
AfterUpdateManyHook(ctx context.Context, data interface{}, where query.Q, affected int64)

// 在 delete many 操作中自动调用
BeforeDeleteManyHook(ctx context.Context, data interface{}, where query.Q)
AfterDeleteManyHook(ctx context.Context, data interface{}, where query.Q, affected int64)

// 在 read many 操作中自动调用, 例如 SelectMany/CountMany/PageMany
BeforeReadManyHook(ctx context.Context, page *query.Page, where ...query.Q)
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

## 最佳实践

下面说的几点最佳实践只是作者总结的，仅供参考。

- 先通过`Navicat`或者`Mysql Workbench`之类的数据库设计工具整体设计表结构
- 再通过命令`go-doudou ddl --reverse --dao`命令一把生成Go代码，`--reverse`参数仅在初始化项目时使用
- 后续开发迭代过程中，修改`domain`文件夹的代码以后，须先将`dao`文件夹中的以`sql.go`为后缀的文件，如`userdaosql.go`删掉，再通过命令`go-doudou ddl --dao`将修改同步到数据库表结构，同时重新生成`sql.go`为后缀的文件。如果修改了表名称或者表前缀，则`dao`文件夹中的以`daoimpl.go`为后缀的文件，如`userdaoimpl.go`也需要删掉并重新生成。
- 新增dao层代码一定要在新建的文件里编写，一定不要人工修改`dao`文件夹里的`base.go`、以`daoimpl.go`为后缀和以`daosql.go`为后缀的这三类文件的代码，在整个项目生命周期里这三类文件都必须是可以随时删除随时重新生成且不影响程序功能的