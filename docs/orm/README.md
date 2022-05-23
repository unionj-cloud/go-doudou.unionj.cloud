# 介绍

go-doudou内置的轻量级orm是基于[jmoiron/sqlx](https://github.com/jmoiron/sqlx)封装的，主要包括两个部分：一个是表结构同步和Dao层代码生成器`go-doudou ddl`，一个是底层封装了`*sqlx.DB`的开箱即用的sql查询日志输出模块和cache模块。目前仅支持`mysql`。

