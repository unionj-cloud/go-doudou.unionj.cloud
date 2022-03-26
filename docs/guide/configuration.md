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

## Remote Configuration Solution

Go-doudou has built-in support for two remote configuration solution: Nacos from Alibaba and Apollo from Ctrip to load configuration when start and customize listener to react to config change event.

To enable remote configuration support, you should configure below environment variable in local configuration file: 

- `GDD_CONFIG_REMOTE_TYPE`: remote configuration center name，options：`nacos`，`apollo`

:::tip

There are some go-doudou native configuration (`GDD_` prefixed) in [Service Configuration](#service-configuration) and [Memberlist Configuration](#memberlist-configuration) supporting 
be configured in runtime by reacting to change event from remote configuration center. Dynamic configuration have highest priority, can override old configuration from any other sources.

:::
### Nacos Configuration Center

Go-doudou will load configuration from Nacos server when service start out-of-box. You just need to add some configuration in local configuration files.

- `GDD_NACOS_NAMESPACE_ID`: Nacos namespaceId, not required
- `GDD_NACOS_SERVER_ADDR`: Nacos server connection url, required
- `GDD_NACOS_CONFIG_FORMAT`: configuration data format, options: `dotenv`(default), `yaml`
- `GDD_NACOS_CONFIG_GROUP`: Nacos group, default is `DEFAULT_GROUP`
- `GDD_NACOS_CONFIG_DATAID`: Nacos dataId, required, multiple dataId should be separated by comma. Loading order is the same as configuration order, so first loaded value has highest priority.

There is exported singleton `NacosClient` from `configmgr` for communicating with Nacos configuration center, you can call `AddChangeListener` method to add custom event listener. For example:

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

### Apollo Configuration Center

Go-doudou will load configuration from Apollo server when service start out-of-box. You just need to add some configuration in local configuration files.

- `GDD_APOLLO_CLUSTER`: Apollo cluster, default is `default`
- `GDD_APOLLO_ADDR`: Apollo server connection url, required
- `GDD_APOLLO_NAMESPACE`: Apollo namespace, just like dataId for Nacos, default is `application.properties`, multiple dataId should be separated by comma. Loading order is the same as configuration order, so first loaded value has highest priority.
- `GDD_APOLLO_SECRET`: Apollo secret, not required

There is exported singleton `ApolloClient` from `configmgr` for communicating with Nacos configuration center, you can call `AddChangeListener` method to add custom event listener. For example:

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

Here is additional note: custom event listener will also react to the very first configuration loading event when service start, if you need to skip it, you should "extend" 
`BaseApolloListener` struct from `configmgr` package, then add below code to the beginning of `OnChange` function

```go
c.Lock.Lock()
defer c.Lock.Unlock()
if !c.SkippedFirstEvent {
  c.SkippedFirstEvent = true
  return
}
```

## Service Configuration

Red asterisk marked configuration can be dynamically changed in runtime by go-doudou listening to change events from remote configuration center.

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
| <span style="color: red; font-weight: bold;">*</span>GDD_MANAGE_USER            | http basic username for built-in api endpoints                                                                                                            | admin      |                                             |
| <span style="color: red; font-weight: bold;">*</span>GDD_MANAGE_PASS            | http basic password for built-in api endpoints                                                                                                            | admin      |                                             |
| GDD_TRACING_METRICS_ROOT   | metrics root for jaeger tracing                                                                                                                           | Go-doudou  |                                             |
| GDD_WEIGHT                 | service instance weight                                        | 1          |                                             |
| GDD_SERVICE_DISCOVERY_MODE | service discovery mode, available options: `memberlist` and `nacos`      | memberlist |              |
| GDD_ENABLE_RESPONSE_GZIP | enable http response gzip compression      | true |              |

## Memberlist Configuration

Red asterisk marked configuration can be dynamically changed in runtime by go-doudou listening to change events from remote configuration center. These configuration can be used to adjust gossip message convergence speed, in other words, how fast service list cached in each service instance memory become consistent.

| Environment Variable    | Description                                                                                                                                                                                                                                                                                   | Default | Required |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| GDD_MEM_SEED            | seed address for join memberlist cluster. If empty or not set, this node will create a new cluster for other nodes to join                                                                                                                                                                    |         |          |
| GDD_MEM_NAME            | for dev and test purpose only. unique name of this node in cluster. if empty or not set, hostname will be used instead                                                                                                                                                                        |         |          |
| GDD_MEM_HOST            | specify `AdvertiseAddr` attribute of memberlist config struct. if GDD_MEM_HOST starts with dot such as `.seed-svc-headless.default.svc.cluster.local`, it will be prefixed with `hostname` to be `seed-2.seed-svc-headless.default.svc.cluster.local` for supporting k8s statefulset service. By default, private ip is used |         |          |
| GDD_MEM_PORT            | TCP and UDP port for memberlist instance to listen on                                                                                                                                                                                                                                         | 7946    |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_DEAD_TIMEOUT    | dead node will be removed from node map if not received refute messages from it in GDD_MEM_DEAD_TIMEOUT duration                                                                                                                                                                              | 60s     |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_SYNC_INTERVAL   | local node will synchronize states from other random node every GDD_MEM_SYNC_INTERVAL duration                                                                                                                                                                                                | 60s     |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_RECLAIM_TIMEOUT | dead node will be replaced with new node with the same name but different full address in GDD_MEM_RECLAIM_TIMEOUT duration                                                                                                                                                                    | 3s      |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_PROBE_INTERVAL  | ping remote nodes for failure detection every GDD_MEM_PROBE_INTERVAL duration                                                                                                                                                                                                                 | 5s      |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_PROBE_TIMEOUT   | probe fail if not receive ack message in GDD_MEM_PROBE_TIMEOUT duration                                                                                                                                                                                                                       | 3s      |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_SUSPICION_MULT  | The multiplier for determining the time an inaccessible node is considered suspect before declaring it dead                   | 6       |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_RETRANSMIT_MULT  | The multiplier for the number of retransmissions that are attempted for messages broadcasted over gossip     | 4       |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_GOSSIP_NODES    | how many remote nodes you want to send gossip messages                                                                                                                                                                                                                                        | 4       |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_GOSSIP_INTERVAL | gossip messages in queue every GDD_MEM_GOSSIP_INTERVAL duration                                   | 500ms   |          |
| <span style="color: red; font-weight: bold;">*</span>GDD_MEM_INDIRECT_CHECKS | the number of nodes that will be asked to perform an indirect probe of a node in the case a direct probe fails                           | 3       |          |
| GDD_MEM_TCP_TIMEOUT     | TCP request will timeout in GDD_MEM_TCP_TIMEOUT duration        | 30s     |          |
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
| GDD_NACOS_CONFIG_FORMAT           | configuration data format, options: `dotenv`, `yaml` |      dotenv            |          |
| GDD_NACOS_CONFIG_GROUP           | configuration group |        DEFAULT_GROUP          |          |
| GDD_NACOS_CONFIG_DATAID           | configuration dataId |                  |    Yes      |

## Apollo Configuration

| Environment Variable              | Description                                                                                       | Default          | Required |
| --------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------- | -------- |
| GDD_APOLLO_CLUSTER            | apollo cluster                                                                       | default           |          |
| GDD_APOLLO_ADDR              | apollo config service address                                              |             |      Yes    |
| GDD_APOLLO_NAMESPACE | apollo namespace                               | application.properties            |          |
| GDD_APOLLO_BACKUP_ENABLE                 | enable local disk cache of configuration                                      | true   |          |
| GDD_APOLLO_BACKUP_PATH               | the directory for local disk cache of configuration                             |             |          |
| GDD_APOLLO_MUSTSTART               |  if failed to connect to apollo config service, return error immediately            | false             |          |
| GDD_APOLLO_SECRET             | apollo configuration secret                                    |                  |          |
| GDD_APOLLO_LOG_ENABLE           | enable print apollo log |     false             |          |
