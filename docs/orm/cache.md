# Cache模块

go-doudou集成了[https://github.com/go-redis/cache](https://github.com/go-redis/cache)库，实现了开箱即用的对sql查询结果的本地内存缓存和redis缓存。

`wrapper.DB`和`wrapper.Tx`接口的方法签名中只有`GetContext(ctx context.Context, dest interface{}, query string, args ...interface{}) error`和`SelectContext(ctx context.Context, dest interface{}, query string, args ...interface{}) error`集成了缓存机制。
	
具体用法请参考示例代码和里面的注释。

```go
func main() {

    ...

    // 创建redis连接实例
	ring := redis.NewRing(&redis.RingOptions{
		Addrs: map[string]string{
			"server1": ":6379",
		},
	})

    // 创建cache实例
	mycache := cache.New(&cache.Options{
        // redis缓存
		Redis: ring,
        // 本地内存缓存，如果不需要可以删去此行
        // 支持多种内存缓存库，请参考go-redis/cache库的README.md里的说明
		LocalCache:   cache.NewTinyLFU(1000, time.Minute),
        // 开启redis缓存的命中统计
		StatsEnabled: true,
	})

	u := dao.NewUserDao(wrapper.NewGddDB(db, 
        // wrapper.NewGddDB工厂方法里没有设置默认的cache实例，
        // 所以需要用户自己调用wrapper.WithCache方法传入自定义的实例
        wrapper.WithCache(mycache), 
        // 调用wrapper.WithRedisKeyTTL方法可以传入redis里的key的过期时间，
        // 可以不传，默认值是一个小时
        wrapper.WithRedisKeyTTL(10*time.Second)))

	...

    // 直接调用dao层代码即可
	_, err = u.Insert(context.TODO(), &user)
	if err != nil {
		panic(err)
	}
	logrus.Printf("user %s's id is %d\n", user.Name, user.Id)

    // 直接调用dao层代码即可
	got, err := u.PageMany(context.TODO(), Page{
		Orders: []Order{
			{
				Col:  "age",
				Sort: "desc",
			},
		},
		Offset: 0,
		Size:   1,
	}, C().Col("age").Gt(27))
	if err != nil {
		panic(err)
	}
    
    ...

    // 重复调用，可以从日志中看到效果
	got, err = u.PageMany(context.TODO(), Page{
		Orders: []Order{
			{
				Col:  "age",
				Sort: "desc",
			},
		},
		Offset: 0,
		Size:   1,
	}, C().Col("age").Gt(27))
	if err != nil {
		panic(err)
	}
	 
    ...

	fmt.Println(mycache.Stats())
}
```

日志输出示例，请注意`HIT: `后面的值，`false`表示未命中缓存，`true`表示缓存命中。`&{Hits:2 Misses:2}`表示2次查询命中缓存，2次没命中。

```shell
INFO[2022-05-23 20:54:24] SQL: INSERT INTO `test`.`ddl_user` ( `id`, `name`, `phone`, `age`, `no`, `school`, `is_student`, `delete_at`, `avg_score`, `hobby`) VALUES ( '0', 'jack', '13552053960', '30', '0', null, '0', null, '97.53
4', '')
INFO[2022-05-23 20:54:24] user jack's id is 14                                                                     
INFO[2022-05-23 20:54:24] SQL: select * from ddl_user where `age` > '27' order by `age` desc limit 0,1  HIT: false 
INFO[2022-05-23 20:54:24] SQL: select count(1) from ddl_user where `age` > '27' HIT: false                         
INFO[2022-05-23 20:54:24] returned user jack's id is 14                                                            
INFO[2022-05-23 20:54:24] returned user jack's average score is 97.534                                             
INFO[2022-05-23 20:54:24] SQL: select * from ddl_user where `age` > '27' order by `age` desc limit 0,1  HIT: true  
INFO[2022-05-23 20:54:24] SQL: select count(1) from ddl_user where `age` > '27' HIT: true                          
INFO[2022-05-23 20:54:24] returned user jack's id is 14                                                            
INFO[2022-05-23 20:54:24] returned user jack's average score is 97.534                                             
&{Hits:2 Misses:2}                                                                                                             
INFO[2022-05-23 20:54:24] SQL: delete from ddl_user where `age` > '27';       
```

