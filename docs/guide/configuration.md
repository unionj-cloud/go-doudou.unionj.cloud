# 配置

`go-doudou`提供了对dotenv格式和yaml格式的本地配置文件，以及阿里Nacos配置中心和携程Apollo配置中心的开箱支持，可以从本地配置文件或者远程配置中心加载配置到环境变量中。

本地配置文件和远程配置中心的优先级是本地配置文件优先，即本地配置文件中已加载的配置不会被远程配置中心加载的配置覆盖。

## 本地配置文件

dotenv格式和yaml格式的本地配置文件的使用方式是完全一样的，只是文件命名规则稍有不同。下文分别说明。

:::tip

两种格式的配置文件可以同时使用，也可以只用其中一种。当同时使用时，yaml格式的配置文件优先加载，全部加载完毕以后，再加载dotenv格式的配置文件。

:::

### dotenv文件

如果你有多个`.env`文件，例如`.env.test`, `.env.prod`等分别配置不同的环境，你可以通过命令行终端、`Dockerfile`文件或者k8s配置文件等设置`GDD_ENV`环境变量为`test`或者`prod`来加载对应的配置文件。

配置加载规则如下：
  1. 同一个环境变量，不论是在命令行终端配置的，还是通过配置文件配置的，最先加载的值优先级最高，不会被后加载的值修改  
  2. 配置文件的加载顺序是（以`prod`环境为例）：  
    1. 加载`.env.prod.local`文件  
    2. 当环境变量`GDD_ENV`的值**不**等于`test`时，加载`.env.local`文件  
    3. 加载`.env.prod`文件  
    4. 加载`.env`文件  

**注意**：前缀必须是`.env`

### yaml文件

同时支持`.yml`后缀和`.yaml`后缀的配置文件。如果你有多个yaml文件，例如`app-test.yml`, `app-prod.yml`等分别配置不同的环境，你可以通过命令行终端、`Dockerfile`文件或者k8s配置文件等设置`GDD_ENV`环境变量为`test`或者`prod`来加载对应的配置文件。

配置加载规则如下：
  1. 同一个环境变量，不论是在命令行终端配置的，还是通过配置文件配置的，最先加载的值优先级最高，不会被后加载的值修改  
  2. 配置文件的加载顺序是（以`prod`环境为例）：  
    1. 加载`app-prod-local.yml`文件  
    2. 当环境变量`GDD_ENV`的值**不**等于`test`时，加载`app-local.yml`文件  
    3. 加载`app-prod.yml`文件  
    4. 加载`app.yml`文件  

**注意**：前缀必须是`app`
::: tip
环境变量转yaml配置时，规则是下划线做为属性分隔，字符很长的属性名可以用中横线分隔成多个单词，提高可读性，例如环境变量GDD_DB_MYSQL_DISABLEDATETIMEPRECISION转成yaml配置：
```yaml
gdd:
	db:
		mysql:
			disable-datetime-precision:
```
:::

## 远程配置方案

`go-doudou`内建支持两种远程配置中心方案：阿里的Nacos和携程的Apollo。支持在服务启动时加载，也支持自定义监听函数监听配置变化。

开启远程配置中心，需在本地配置文件中配置以下环境变量：

- `GDD_CONFIG_REMOTE_TYPE`: 远程配置中心名称，可选项：`nacos`，`apollo`

:::tip

`go-doudou`框架层的配置（即以`GDD_`为前缀的配置）中有一部分 [服务配置](#服务配置) 支持通过远程配置中心在运行时动态修改，运行时动态修改的配置优先级最高，会将服务启动时从命令行终端、`Dockerfile`文件、k8s配置文件、本地配置文件和远程配置中心加载的配置都覆盖掉。

:::
### Nacos配置中心

`go-doudou`服务启动时会自动从Nacos加载配置，只需要在本地配置文件里配置一些参数即可，可以说是开箱即用的。

- `GDD_NACOS_NAMESPACE_ID`: Nacos namespaceId，非必须
- `GDD_NACOS_SERVER_ADDR`: Nacos服务端连接地址，必须
- `GDD_NACOS_CONFIG_FORMAT`: 配置的格式，可选项：`dotenv`，`yaml`，默认值是`dotenv`
- `GDD_NACOS_CONFIG_GROUP`: Nacos group，默认值是`DEFAULT_GROUP`
- `GDD_NACOS_CONFIG_DATAID`: Nacos dataId，必须，多个dataId用英文逗号隔开，配置里的顺序就是实际加载顺序，遵循先加载的配置优先级最高的规则

`configmgr`包里提供了对外导出的与Nacos配置中心交互的单例`NacosClient`，可以调用`AddChangeListener`方法添加自定义的监听函数。用法示例：

```go
func main() {

	...

	if configmgr.NacosClient != nil {
		configmgr.NacosClient.AddChangeListener(configmgr.NacosConfigListenerParam{
			DataId: "statsvc-dev",
			OnChange: func(event *configmgr.NacosChangeEvent) {
				fmt.Println("group:" + event.Group + ", dataId:" + event.DataId + fmt.Sprintf(", changes: %+v\n", event.Changes))
			},
		})
	}

	...

	srv.Run()
}
```

### Apollo配置中心

`go-doudou`服务启动时会自动从Apollo加载配置，只需要在本地配置文件里配置一些参数即可，可以说是开箱即用的。

- `GDD_SERVICE_NAME`: 服务名称就是Apollo AppId
- `GDD_APOLLO_CLUSTER`: Apollo cluster，默认值是`default`
- `GDD_APOLLO_ADDR`: Apollo服务端连接地址，必须
- `GDD_APOLLO_NAMESPACE`: Apollo namespace，相当于Nacos的dataId，默认值是`application.properties`，多个namespace用英文逗号隔开，配置里的顺序就是实际加载顺序，遵循先加载的配置优先级最高的规则
- `GDD_APOLLO_SECRET`: Apollo配置密钥，非必须

`configmgr`包里提供了对外导出的与Apollo配置中心交互的单例`ApolloClient`，可以调用`AddChangeListener`方法添加自定义的监听函数。用法示例：

```go
type ConfigChangeListener struct {
	configmgr.BaseApolloListener
}

func (c *ConfigChangeListener) OnChange(event *storage.ChangeEvent) {
	c.Lock.Lock()
	defer c.Lock.Unlock()
	if !c.SkippedFirstEvent {
		c.SkippedFirstEvent = true
		return
	}
	logger.Info("from OnChange")
	fmt.Println(event.Changes)
	for key, value := range event.Changes {
		fmt.Println("change key : ", key, ", value :", value)
	}
	fmt.Println(event.Namespace)
	logger.Info("from OnChange end")
}

func main() {

    ...

	var listener ConfigChangeListener

	configmgr.ApolloClient.AddChangeListener(&listener)

    ...

	srv.Run()
}
```

需要补充说明的是：首次加载配置的事件也会被自定义监听函数监听到，如果需要跳过第一次，需要"继承"`configmgr`包提供的`BaseApolloListener`结构体，然后在`OnChange`函数的开头加上如下代码

```go
c.Lock.Lock()
defer c.Lock.Unlock()
if !c.SkippedFirstEvent {
  c.SkippedFirstEvent = true
  return
}
```

## 服务配置

表格中加红色星号的配置是由go-doudou在运行时监听远程配置中心的配置变化动态修改的。

| 环境变量名       | 描述                                                                                                       | 默认值    | 是否必须   |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | -------|
| GDD_BANNER                 | 是否开启banner                                                                                   | true       |        |
| GDD_BANNER_TEXT            | banner文字                                                                                       | `go-doudou`  |        |
| GDD_LOG_LEVEL              | 日志等级，可选项：`panic`, `fatal`, `error`, `warn`, `warning`, `info`, `debug`, `trace`           | info       |        |
| GDD_LOG_FORMAT             | 日志格式，可选项：`text`, `json`                                                                   | text       |        |
| GDD_LOG_REQ_ENABLE         | 是否开启http请求体和响应体日志                                                                       | false      |        |
| GDD_LOG_CALLER         | 是否打印“文件名:行号”                                                                       | false      |        |
| GDD_LOG_DISCARD            | 关闭日志                                                                                          | false      |        |
| GDD_GRACE_TIMEOUT          | 优雅下线的超时时间                                                                                  | 15s        |        |
| GDD_WRITE_TIMEOUT          | http连接的写超时时间                                                                                | 15s        |        |
| GDD_READ_TIMEOUT           | http连接的读超时时间                                                                                | 15s        |        |
| GDD_IDLE_TIMEOUT           | http连接的空闲超时时间                                                                              | 60s        |        |
| GDD_ROUTE_ROOT_PATH        | http请求路径前缀                                                                                   |            |        |
| GDD_SERVICE_NAME           | 服务名                                                                                            |            | 必须    |
| GDD_SERVICE_GROUP          | 服务组名，当采用zookeeper做服务注册与发现时有效                                                         |            | 必须    |
| GDD_SERVICE_VERSION        | 服务版本名，当采用zookeeper做服务注册与发现时有效                                                       |            | 必须    |
| GDD_HOST                   | http服务器监听地址                                                                                  |            |        |
| GDD_PORT                   | http服务器监听端口                                                                                  | 6060       |        |
| GDD_GRPC_PORT              | gRPC服务器监听端口                                                                                  | 50051       |        |
| GDD_RETRY_COUNT            | 客户端请求重试次数                                                                                   | 0          |        |
| GDD_MANAGE_ENABLE          | 是否开启内建http接口：`/go-doudou/doc`, `/go-doudou/openapi.json`, `/go-doudou/prometheus`, `/go-doudou/registry`, `/go-doudou/config` | true       |        |
| <span style="color: red; font-weight: bold;">*</span>GDD_MANAGE_USER            | 内建http接口的http basic校验用户名                                                                    | admin      |        |
| <span style="color: red; font-weight: bold;">*</span>GDD_MANAGE_PASS            | 内建http接口的http basic校验密码                                                                      | admin      |        |
| GDD_TRACING_METRICS_ROOT   | jaeger调用链监控的`metrics root`                                                                     | `go-doudou`  |        |
| GDD_WEIGHT                 | 服务实例的权重                                                                                       | 1          |        |
| GDD_SERVICE_DISCOVERY_MODE | 服务发现模式，可选项：`etcd`, `nacos`, `zk`                                                           |  |        |
| GDD_ENABLE_RESPONSE_GZIP | 开启http响应体gzip压缩     | true |              |
| GDD_SQL_LOG_ENABLE | 开启sql日志打印      | false |              |
| GDD_REGISTER_HOST           | 服务实例的注册地址，默认值取主机的私有IP                                              |     |          |
| GDD_FALLBACK_CONTENTTYPE           | 默认的http响应体的Content-Type头                                                     | application/json; charset=UTF-8 |          |
| GDD_CONFIG_REMOTE_TYPE           | 远程配置中心，可选值：`nacos`, `apollo`                                                     |  |          |

## Nacos配置

| 环境变量名       | 描述                                        | 默认值    | 是否必须                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_NACOS_NAMESPACE_ID            | 命名空间                                                                                 | public                 |          |
| GDD_NACOS_TIMEOUT_MS              | 请求超时时间，单位毫秒                                                                      | 10000            |          |
| GDD_NACOS_NOTLOADCACHEATSTART | 程序启动时是否从磁盘缓存中加载服务列表                                                         | false            |          |
| GDD_NACOS_LOG_DIR                 | 日志目录地址                                                                               | /tmp/nacos/log   |          |
| GDD_NACOS_CACHE_DIR               | 服务列表磁盘缓存地址                                                      | /tmp/nacos/cache |          |
| GDD_NACOS_LOG_LEVEL               | 日志等级，可选项：`debug`,`info`,`warn`,`error`                                      | info             |          |
| GDD_NACOS_SERVER_ADDR             | Nacos服务器连接地址，多个地址用英文逗号分隔                                         |                  |          |
| GDD_NACOS_CONFIG_FORMAT           | 配置的数据格式，支持：`dotenv`, `yaml` |      dotenv            |          |
| GDD_NACOS_CONFIG_GROUP           | 配置group |        DEFAULT_GROUP          |          |
| GDD_NACOS_CONFIG_DATAID           | 配置dataId |                  |    必须      |

## Apollo配置

| 环境变量名                          | 描述                                                                             | 默认值          | 是否必须         |
| --------------------------------- | -------------------------------------------------------------------------------- | ---------------- | -------- |
| GDD_APOLLO_CLUSTER            | apollo集群                                                                       | default           |          |
| GDD_APOLLO_ADDR              | apollo配置服务连接地址                                             |             |      必须    |
| GDD_APOLLO_NAMESPACE | apollo命名空间                               | application.properties            |          |
| GDD_APOLLO_BACKUP_ENABLE                 | 开启在本地磁盘缓存配置                                     | true   |          |
| GDD_APOLLO_BACKUP_PATH               | 配置缓存文件夹路径                            |             |          |
| GDD_APOLLO_MUSTSTART               |  如果配置服务连接失败，立刻返回错误            | false             |          |
| GDD_APOLLO_SECRET             | apollo配置的密钥                                    |                  |          |
| GDD_APOLLO_LOG_ENABLE           | 开启apollo日志打印 |     false             |          |

## Etcd配置

| 环境变量名       | 描述                                        | 默认值    | 是否必须                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_ETCD_ENDPOINTS            | etcd集群连接地址                                                                                 |                  |          |
| GDD_ETCD_LEASE              | etcd服务注册租约TTL时间，单位秒                                                                      | 5            |          |

## Zookeeper配置

| 环境变量名       | 描述                                        | 默认值    | 是否必须                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_ZK_SERVERS               | zookeeper集群连接地址，多个地址用英文逗号分隔                                                    |                  |          |
| GDD_ZK_SEQUENCE              | zookeeper节点是否加编号                                                                      | false            |          |
| GDD_ZK_DIRECTORY_PATTERN     | 服务注册节点路径的字符串fmt模式，%s表示服务名                                                     | /registry/%s/providers     |          |

## Gorm配置

| 环境变量名       | 描述                                        | 默认值    | 是否必须                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_DB_DISABLEAUTOCONFIGURE           | 关闭自动配置                                                   |   false               |          |
| GDD_DB_DRIVER              | 数据库driver名称，与gorm保持一致：`mysql`, `postgres`, `sqlite`, `sqlserver`, `tidb`, `clickhouse`  |             |          |
| GDD_DB_DSN     | 数据库连接地址                                                     |     |          |
| GDD_DB_POOL_MAXIDLECONNS     | 最大空闲连接数                                                    | 2    |          |
| GDD_DB_POOL_MAXOPENCONNS     | 最大连接数，-1表示无限制                                                     |  -1    |          |
| GDD_DB_POOL_CONNMAXLIFETIME     | 一个连接最长可复用的时间期限，-1表示无限制                                                 |  -1    |          |
| GDD_DB_POOL_CONNMAXIDLETIME     | 一个连接最长空闲时间，如果超期则会在下次复用前被关闭，-1表示无限制                               | -1     |          |
| GDD_DB_LOG_SLOWTHRESHOLD     | 慢查询日志的阈值                                                     | 200ms     |          |
| GDD_DB_LOG_IGNORERECORDNOTFOUNDERROR     | 忽略没找到记录的错误                                                     | false     |          |
| GDD_DB_LOG_PARAMETERIZEDQUERIES          | 是否隐藏sql参数                                                                      | false     |          |
| GDD_DB_LOG_LEVEL     | 日志级别，与gorm一致：`silent`, `error`, `warn`, `info`                                                   | warn     |          |
| GDD_DB_MYSQL_SKIPINITIALIZEWITHVERSION     | gorm的SkipInitializeWithVersion参数                                           | false     |          |
| GDD_DB_MYSQL_DEFAULTSTRINGSIZE     | gorm的DefaultStringSize参数                                               | 0     |          |
| GDD_DB_MYSQL_DISABLEWITHRETURNING     | gorm的DisableWithReturning参数                                                | false     |          |
| GDD_DB_MYSQL_DISABLEDATETIMEPRECISION     | gorm的DisableDatetimePrecision参数                                            | false     |          |
| GDD_DB_MYSQL_DONTSUPPORTRENAMEINDEX     | gorm的DontSupportRenameIndex参数                                              | false     |          |
| GDD_DB_MYSQL_DONTSUPPORTRENAMECOLUMN     | gorm的DontSupportRenameColumn参数                                             | false     |          |
| GDD_DB_MYSQL_DONTSUPPORTFORSHARECLAUSE     | gorm的DontSupportForShareClause参数                                           | false     |          |
| GDD_DB_MYSQL_DONTSUPPORTNULLASDEFAULTVALUE     | gorm的DontSupportNullAsDefaultValue参数                                       | false     |          |
| GDD_DB_MYSQL_DONTSUPPORTRENAMECOLUMNUNIQUE     | gorm的DontSupportRenameColumnUnique参数                                      | false     |          |
| GDD_DB_POSTGRES_PREFERSIMPLEPROTOCOL     | gorm的PreferSimpleProtocol参数                                             | false     |          |
| GDD_DB_POSTGRES_WITHOUTRETURNING     | gorm的WithoutReturning参数                                                | false     |          |