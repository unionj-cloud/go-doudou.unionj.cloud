# Sql语句构造器

ddl工具生成的dao层代码里有些方法需要传入`query.Q`类型的参数，需要使用内置的sql语句构造器。`Col`方法参数只能传入数据库中的字段名，不能传代码中的结构体属性名。其他很多开源orm同时支持传字段名和属性名，但是go-doudou作者认为容易出错，所以只支持数据库字段名。仅支持单表CRUD语句的构建。

以下是示例代码。

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

