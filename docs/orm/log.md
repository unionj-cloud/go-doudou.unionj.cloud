# Sql查询日志输出

go-doudou通过`GddDB`结构体和`GddTx`结构体封装底层`*sqlx.DB`实现输出sql日志的功能。这个特性与上文介绍的ddl工具生成的dao层代码没有直接关系，完全可以脱离生成的dao层代码，在你自己编写的CRUD代码中单独使用，但是必须要用`wrapper.NewGddDB`工厂方法创建的`wrapper.DB`接口实现类，或者是由该实现类调用`BeginTxx`方法开启的事务`wrapper.Tx`接口实现类来执行sql语句。

在`toolkit/sqlext/logger`包里提供了`ISqlLogger`接口，用户可以自定义实现这个接口，也可以用go-doudou默认提供的实现类`SqlLogger`结构体。`toolkit/sqlext/logger`包还提供了一个工厂方法`NewSqlLogger`来创建`SqlLogger`实例。只需将该实例传入`toolkit/sqlext/wrapper`包的工厂方法`NewGddDB`创建出`GddDB`实例，再将该实例传入ddl工具生成的dao层的工厂方法里生成dao实例即可。每次执行CRUD操作都会打印出已经替换好参数的sql语句。

```go
gdddb := wrapper.NewGddDB(db, wrapper.WithLogger(logger.NewSqlLogger(log.Default())))
u := dao.NewUserDao(gdddb)
// 使用变量u做CRUD操作，例如
// got, err := u.UpsertNoneZero(context.Background(), user)
```

该模块除了可以打印sql语句之外，还可以从`context.Context`中取出request id和opentracing（jaeger）的trace id，一并打印出来。

![go-doudou输出sql查询日志](/images/logscreenshot.png)

如果你采用go-doudou的默认实现`SqlLogger`，须将环境变量`GDD_SQL_LOG_ENABLE`设置为`true`。
