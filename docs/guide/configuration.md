# Configuration

Go-doudou supports dotenv and yaml format local configuration file, and Alibaba Nacos configuration center and Ctrip Apollo configuration center out-of-box.
Go-doudou loads configuration from these sources to environment variables.

Comparing with remote configuration center local configuration files have higher priority, so value of each environment variable loaded from local files won't be overridden by configuration from remote center.

## Local Configuration File

The usage of dotenv and yaml files are the same, only naming rules are different. They will be explained separately below.

:::tip

Files with different format can be used together, or you can use only one kind of format. If used together, yaml files have higher priority. After all yaml files loaded, dotenv files loads.

:::

### Dotenv File

If you have multiple `.env` files, such as `.env.test`, `.env.prod` to configure different environment, you can set `GDD_ENV` environment variable to `test` or `prod` by terminal, `Dockerfile` or k8s file to load corresponding file.

Configuration Loading Rule:
  1. For one environment variable, no matter where be configured, first value has highest priority, won't be overridden by later values 
  2. Using `prod` as example, loading order is:  
    1. Load `.env.prod.local`  
    2. If `GDD_ENV` != `test`, load `.env.local`  
    3. Load `.env.prod`  
    4. Load `.env`    

**Note**：file name must be prefixed with `.env`

### Yaml File

Support both `.yml` suffixed and `.yaml` suffixed files. If you have multiple yaml files, such as `app-test.yml`, `app-prod.yml` to configure different environment, you can set `GDD_ENV` environment variable to `test` or `prod` by terminal, `Dockerfile` or k8s file to load corresponding file.

Configuration Loading Rule:
  1. For one environment variable, no matter where be configured, first value has highest priority, won't be overridden by later values 
  2. Using `prod` as example, loading order is:  
    1. Load `app-prod-local.yml`  
    2. If `GDD_ENV` != `test`, load `app-local.yml`  
    3. Load `app-prod.yml`  
    4. Load `app.yml`    

**Note**：file name must be prefixed with `app`

## 远程配置中心

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

需要补充说明的是：首次加载配置的事件也会被自定义监听函数监听到，如果需要跳过第一次，需要"继承"`configmgr`包提供的`BaseApolloListener`结构体，然后在`OnChange`函数里首先加上如下代码

```go
c.Lock.Lock()
defer c.Lock.Unlock()
if !c.SkippedFirstEvent {
  c.SkippedFirstEvent = true
  return
}
```

## Service Configuration

| Environment Variable       | Description                                                                                                                                               | Default    | Required                                    |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------- |
| GDD_BANNER                 | whether output banner to stdout or not to console                                                                                                         | true       |                                             |
| GDD_BANNER_TEXT            |                                                                                                                                                           | Go-doudou  |                                             |
| GDD_LOG_LEVEL              | possible values are panic, fatal, error, warn, warning, info, debug, trace                                                                                | info       |                                             |
| GDD_LOG_FORMAT             | set log format to text or json, possible values are text and json                                                                                         | text       |                                             |
| GDD_LOG_REQ_ENABLE         | enable request and response logging                                                                                                                       | false      |                                             |
| GDD_GRACE_TIMEOUT          | graceful shutdown timeout for http server                                                                                                                 | 15s        |                                             |
| GDD_WRITE_TIMEOUT          | http server connection write timeout                                                                                                                      | 15s        |                                             |
| GDD_READ_TIMEOUT           | http server connection read timeout                                                                                                                       | 15s        |                                             |
| GDD_IDLE_TIMEOUT           | http server connection idle timeout                                                                                                                       | 60s        |                                             |
| GDD_ROUTE_ROOT_PATH        | prefix string to each of http api routes                                                                                                                  |            |                                             |
| GDD_SERVICE_NAME           | service name                                                                                                                                 |            | Yes |
| GDD_HOST                   | host for the http server to listen on                                                                                                                     |            |                                             |
| GDD_PORT                   | port for the http server to listen on                                                                                                                     | 6060       |                                             |
| GDD_RETRY_COUNT            | client retry count                                                                                                                                        | 0          |                                             |
| GDD_MANAGE_ENABLE          | enable built-in api endpoints such as `/go-doudou/doc`, `/go-doudou/openapi.json`, `/go-doudou/prometheus`, `/go-doudou/registry` and `/go-doudou/config` | true       |                                             |
| GDD_MANAGE_USER            | http basic username for built-in api endpoints                                                                                                            | admin      |                                             |
| GDD_MANAGE_PASS            | http basic password for built-in api endpoints                                                                                                            | admin      |                                             |
| GDD_TRACING_METRICS_ROOT   | metrics root for jaeger tracing                                                                                                                           | Go-doudou  |                                             |
| GDD_WEIGHT                 | service instance weight                                                                                                                                   | 1          |                                             |
| GDD_SERVICE_DISCOVERY_MODE | service discovery mode, available options: `memberlist` and `nacos`                                                                                       | memberlist |                                             |

## Memberlist Configuration

| Environment Variable    | Description                                                                                                                                                                                                                                                                                   | Default | Required |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| GDD_MEM_SEED            | seed address for join memberlist cluster. If empty or not set, this node will create a new cluster for other nodes to join                                                                                                                                                                    |         |          |
| GDD_MEM_NAME            | for dev and test purpose only. unique name of this node in cluster. if empty or not set, hostname will be used instead                                                                                                                                                                        |         |          |
| GDD_MEM_HOST            | specify `AdvertiseAddr` attribute of memberlist config struct. if GDD_MEM_HOST starts with dot such as `.seed-svc-headless.default.svc.cluster.local`, it will be prefixed with `hostname` to be `seed-2.seed-svc-headless.default.svc.cluster.local` for supporting k8s statefulset service. By default, private ip is used |         |          |
| GDD_MEM_PORT            | TCP and UDP port for memberlist instance to listen on                                                                                                                                                                                                                                         | 7946    |          |
| GDD_MEM_DEAD_TIMEOUT    | dead node will be removed from node map if not received refute messages from it in GDD_MEM_DEAD_TIMEOUT duration                                                                                                                                                                              | 60s     |          |
| GDD_MEM_SYNC_INTERVAL   | local node will synchronize states from other random node every GDD_MEM_SYNC_INTERVAL duration                                                                                                                                                                                                | 60s     |          |
| GDD_MEM_RECLAIM_TIMEOUT | dead node will be replaced with new node with the same name but different full address in GDD_MEM_RECLAIM_TIMEOUT duration                                                                                                                                                                    | 3s      |          |
| GDD_MEM_PROBE_INTERVAL  | ping remote nodes for failure detection every GDD_MEM_PROBE_INTERVAL duration                                                                                                                                                                                                                 | 5s      |          |
| GDD_MEM_PROBE_TIMEOUT   | probe fail if not receive ack message in GDD_MEM_PROBE_TIMEOUT duration                                                                                                                                                                                                                       | 3s      |          |
| GDD_MEM_SUSPICION_MULT  | The multiplier for determining the time an inaccessible node is considered suspect before declaring it dead                                                                                                                                                                                   | 6       |          |
| GDD_MEM_GOSSIP_NODES    | how many remote nodes you want to send gossip messages                                                                                                                                                                                                                                        | 4       |          |
| GDD_MEM_GOSSIP_INTERVAL | gossip messages in queue every GDD_MEM_GOSSIP_INTERVAL duration                                                                                                                                                                                                                               | 500ms   |          |
| GDD_MEM_TCP_TIMEOUT     | TCP request will timeout in GDD_MEM_TCP_TIMEOUT duration                                                                                                                                                                                                                                      | 30s     |          |
| GDD_MEM_INDIRECT_CHECKS | the number of nodes that will be asked to perform an indirect probe of a node in the case a direct probe fails                                                                                                                                                                                | 3       |          |
| GDD_MEM_WEIGHT          | `Deprecated` node weight for smooth weighted round-robin balancing                                                                                                                                                                                                                            | 0       |          |
| GDD_MEM_WEIGHT_INTERVAL | node weight will be calculated every GDD_MEM_WEIGHT_INTERVAL                                                                                                                                                                                                                                  | 0s      |          |
| GDD_MEM_LOG_DISABLE     | whether disable memberlist logging                                                                                                                                                                                                                                                            | false   |          |
| GDD_MEM_CIDRS_ALLOWED   | If not set, allow any connection (default), otherwise specify all networks allowed connecting (you must specify IPv6/IPv4 separately). Example: GDD_MEM_CIDRS_ALLOWED=172.28.0.0/16                                                                                                           |         |          |

## Nacos Configuration

| Environment Variable              | Description                                                                                       | Default          | Required |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------- | -------- |
| GDD_NACOS_NAMESPACE_ID            | the namespaceId of Nacos                                                                          | public           |          |
| GDD_NACOS_TIMEOUT_MS              | timeout for requesting Nacos server in milliseconds                                               | 10000            |          |
| GDD_NACOS_NOT_LOAD_CACHE_AT_START | not to load persistent nacos service info in CacheDir at start time                               | false            |          |
| GDD_NACOS_LOG_DIR                 | the directory for log                                                                             | /tmp/nacos/log   |          |
| GDD_NACOS_CACHE_DIR               | the directory for persist nacos service info                                                      | /tmp/nacos/cache |          |
| GDD_NACOS_LOG_LEVEL               | the level of log, it's must be `debug`,`info`,`warn`,`error`                                      | info             |          |
| GDD_NACOS_SERVER_ADDR             | nacos server connection url, multiple urls are joined by comma                                    |                  |          |
| GDD_NACOS_REGISTER_HOST           | service instance host to be registered to nacos server, if not set, private ip is used by default |                  |          |
