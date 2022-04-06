# 配置

Go-doudou提供了对dotenv格式和yaml格式的本地配置文件，以及阿里Nacos配置中心和携程Apollo配置中心的开箱支持，可以从本地配置文件或者远程配置中心加载配置到环境变量中。

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

## 远程配置方案

Go-doudou内建支持两种远程配置中心方案：阿里的Nacos和携程的Apollo。支持在服务启动时加载，也支持自定义监听函数监听配置变化。

开启远程配置中心，需在本地配置文件中配置以下环境变量：

- `GDD_CONFIG_REMOTE_TYPE`: 远程配置中心名称，可选项：`nacos`，`apollo`

:::tip

Go-doudou框架层的配置（即以`GDD_`为前缀的配置）中有一部分 [服务配置](#服务配置) 和 [Memberlist配置](#memberlist配置) 支持通过远程配置中心在运行时动态修改，运行时动态修改的配置优先级最高，会将服务启动时从命令行终端、`Dockerfile`文件、k8s配置文件、本地配置文件和远程配置中心加载的配置都覆盖掉。

:::
### Nacos配置中心

Go-doudou服务启动时会自动从Nacos加载配置，只需要在本地配置文件里配置一些参数即可，可以说是开箱即用的。

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

Go-doudou服务启动时会自动从Apollo加载配置，只需要在本地配置文件里配置一些参数即可，可以说是开箱即用的。

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
| GDD_BANNER_TEXT            | banner文字                                                                                       | Go-doudou  |        |
| GDD_LOG_LEVEL              | 日志等级，可选项：`panic`, `fatal`, `error`, `warn`, `warning`, `info`, `debug`, `trace`           | info       |        |
| GDD_LOG_FORMAT             | 日志格式，可选项：`text`, `json`                                                                   | text       |        |
| GDD_LOG_REQ_ENABLE         | 是否开启http请求体和响应体日志                                                                       | false      |        |
| GDD_GRACE_TIMEOUT          | 优雅下线的超时时间                                                                                  | 15s        |        |
| GDD_WRITE_TIMEOUT          | http连接的写超时时间                                                                                | 15s        |        |
| GDD_READ_TIMEOUT           | http连接的读超时时间                                                                                | 15s        |        |
| GDD_IDLE_TIMEOUT           | http连接的空闲超时时间                                                                              | 60s        |        |
| GDD_ROUTE_ROOT_PATH        | http请求路径前缀                                                                                   |            |        |
| GDD_SERVICE_NAME           | 服务名                                                                                            |            | 必须    |
| GDD_HOST                   | http服务器监听地址                                                                                  |            |        |
| GDD_PORT                   | http服务器监听端口                                                                                  | 6060       |        |
| GDD_RETRY_COUNT            | 客户端请求重试次数                                                                                   | 0          |        |
| GDD_MANAGE_ENABLE          | 是否开启内建http接口：`/go-doudou/doc`, `/go-doudou/openapi.json`, `/go-doudou/prometheus`, `/go-doudou/registry`, `/go-doudou/config` | true       |        |
| <span style="color: red; font-weight: bold;">*</span>GDD_MANAGE_USER            | 内建http接口的http basic校验用户名                                                                    | admin      |        |
| <span style="color: red; font-weight: bold;">*</span>GDD_MANAGE_PASS            | 内建http接口的http basic校验密码                                                                      | admin      |        |
| GDD_TRACING_METRICS_ROOT   | jaeger调用链监控的`metrics root`                                                                     | Go-doudou  |        |
| GDD_WEIGHT                 | 服务实例的权重                                                                                       | 1          |        |
| GDD_SERVICE_DISCOVERY_MODE | 服务发现模式，可选项：`memberlist`, `nacos`                                                           | memberlist |        |
| GDD_ENABLE_RESPONSE_GZIP | 开启http响应体gzip压缩     | true |              |

## Memberlist配置

表格中加红色星号的配置是由go-doudou在运行时监听远程配置中心的配置变化动态修改的，这些配置均是用来调整Gossip消息传播速度的（也就是微服务各实例内存中缓存的服务列表趋于一致的速度）。

| 环境变量名       | 描述                                                                                                       | 默认值    | 是否必须       |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_MEM_SEED            | memberlist集群的种子地址，多个地址用英文逗号分隔，如果不设置，则不加入任何集群                                |            |                                         |
| GDD_MEM_NAME            | 仅用于开发和测试，实例的名称，该名称必须保证在集群中唯一。如果不设置，默认值取主机名                             |         |          |
| GDD_MEM_HOST            | 集群中其他实例对该实例的访问地址，默认值取主机的私有IP                                                      |         |          |
| GDD_MEM_PORT            | 实例的监听端口                                                                                        | 7946    |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_DEAD_TIMEOUT    | 在环境变量`GDD_MEM_DEAD_TIMEOUT`指定的超时时间内仍未收到离线实例的表示仍在线的消息，则从实例列表中删除该实例      | 60s     |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_SYNC_INTERVAL   | 发起同步实例列表的TCP请求的间隔时间                                                                      | 60s     |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_RECLAIM_TIMEOUT | 超过此环境变量设置的超时时间，离线实例会被具有相同名字但不同地址的实例换掉。如果未到超时时间，该新实例会始终被拒绝加入集群   | 3s      |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_PROBE_INTERVAL  | 发起实例探活的UDP请求的间隔时间                                                                              | 5s      |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_PROBE_TIMEOUT   | 单次实例探活的超时时间                                                                                      | 3s      |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_SUSPICION_MULT  | 计算宣告疑似离线实例已离线的超时时间的系数                                                                     | 6       |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_RETRANSMIT_MULT  | 计算一条消息最多发送多少次的系数                                                                     | 4       |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_GOSSIP_NODES    | 定时发送UDP消息的单次目标实例数量                                                                            | 4       |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_GOSSIP_INTERVAL | 定时发送UDP消息的间隔时间                                                                                  | 500ms   |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_INDIRECT_CHECKS | 如果UDP探活失败，帮助该实例做间接探活的其他实例的数量                                                           | 3       |          |
| GDD_MEM_TCP_TIMEOUT     | 单次TCP请求的超时时间                                                                                      | 30s     |          |
| GDD_MEM_WEIGHT          | `已废弃`客户端平滑加权负载均衡算法所需要的实例权重，请用`GDD_WEIGHT`                                           | 0       |          |
| GDD_MEM_WEIGHT_INTERVAL | 程序自动计算当前实例权重值并发出UDP消息的间隔时间，默认值为`0s`，即默认禁用该功能，实例权重取`GDD_WEIGHT`，若未设置，则取`GDD_MEM_WEIGHT`，若也未设置，则取默认值`1` | 0s      |          |
| GDD_MEM_LOG_DISABLE     | 是否关闭memberlist日志                                                                                 | false   |          |
| GDD_MEM_CIDRS_ALLOWED   | 如果未设置，则放行所有实例发来的请求。如果设置，则只允许符合条件的实例的请求通过。示例：`GDD_MEM_CIDRS_ALLOWED=172.28.0.0/16`  |         |          |

## Nacos配置

| 环境变量名       | 描述                                        | 默认值    | 是否必须                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_NACOS_NAMESPACE_ID            | 命名空间                                                                                 | public                 |          |
| GDD_NACOS_TIMEOUT_MS              | 请求超时时间，单位毫秒                                                                      | 10000            |          |
| GDD_NACOS_NOT_LOAD_CACHE_AT_START | 程序启动时是否从磁盘缓存中加载服务列表                                                         | false            |          |
| GDD_NACOS_LOG_DIR                 | 日志目录地址                                                                               | /tmp/nacos/log   |          |
| GDD_NACOS_CACHE_DIR               | 服务列表磁盘缓存地址                                                      | /tmp/nacos/cache |          |
| GDD_NACOS_LOG_LEVEL               | 日志等级，可选项：`debug`,`info`,`warn`,`error`                                      | info             |          |
| GDD_NACOS_SERVER_ADDR             | Nacos服务器连接地址，多个地址用英文逗号分隔                                         |                  |          |
| GDD_NACOS_REGISTER_HOST           | 服务实例的注册地址，默认值取主机的私有IP |                  |          |
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