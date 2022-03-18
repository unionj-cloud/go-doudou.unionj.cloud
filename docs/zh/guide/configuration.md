# 配置

Go-doudou基于 [godotenv](https://github.com/joho/godotenv) 这个库提供了对`.env`配置文件的开箱支持，可以从配置文件中加载配置到环境变量中。

如果你有多个`.env`文件，例如`.env.test`, `.env.prod`等分别配置不同的环境，你可以通过设置`GDD_ENV`环境变量为`test`或者`prod`来加载对应的配置文件。

配置加载规则如下：
  1. 同一个环境变量，不论是在命令行终端配置的，还是通过配置文件配置的，最先加载的值优先级最高，不会被后加载的值修改  
  2. 配置文件的加载顺序是（以`prod`环境为例）：  
    1. 加载`.env.prod.local`文件  
    2. 当环境变量`GDD_ENV`的值**不**等于`test`时，加载`.env.local`文件  
    3. 加载`.env.prod`文件  
    4. 加载`.env`文件  

## 服务配置

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
| GDD_MANAGE_USER            | 内建http接口的http basic校验用户名                                                                    | admin      |        |
| GDD_MANAGE_PASS            | 内建http接口的http basic校验密码                                                                      | admin      |        |
| GDD_TRACING_METRICS_ROOT   | jaeger调用链监控的`metrics root`                                                                     | Go-doudou  |        |
| GDD_WEIGHT                 | 服务实例的权重                                                                                       | 1          |        |
| GDD_SERVICE_DISCOVERY_MODE | 服务发现模式，可选项：`memberlist`, `nacos`                                                           | memberlist |        |

## Memberlist配置

| 环境变量名       | 描述                                                                                                       | 默认值    | 是否必须       |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_MEM_SEED            | memberlist集群的种子地址，多个地址用英文逗号分隔，如果不设置，则不加入任何集群                                |            |                                         |
| GDD_MEM_NAME            | 仅用于开发和测试，实例的名称，该名称必须保证在集群中唯一。如果不设置，默认值取主机名                             |         |          |
| GDD_MEM_HOST            | 集群中其他实例对该实例的访问地址，默认值取主机的私有IP                                                      |         |          |
| GDD_MEM_PORT            | 实例的监听端口                                                                                        | 7946    |          |
| GDD_MEM_DEAD_TIMEOUT    | 在环境变量`GDD_MEM_DEAD_TIMEOUT`指定的超时时间内仍未收到离线实例的表示仍在线的消息，则从实例列表中删除该实例      | 60s     |          |
| GDD_MEM_SYNC_INTERVAL   | 发起同步实例列表的TCP请求的间隔时间                                                                      | 60s     |          |
| GDD_MEM_RECLAIM_TIMEOUT | 超过此环境变量设置的超时时间，离线实例会被具有相同名字但不同地址的实例换掉。如果未到超时时间，该新实例会始终被拒绝加入集群   | 3s      |          |
| GDD_MEM_PROBE_INTERVAL  | 发起实例探活的UDP请求的间隔时间                                                                              | 5s      |          |
| GDD_MEM_PROBE_TIMEOUT   | 单次实例探活的超时时间                                                                                      | 3s      |          |
| GDD_MEM_SUSPICION_MULT  | 计算宣告疑似离线实例已离线的超时时间的系数                                                                     | 6       |          |
| GDD_MEM_GOSSIP_NODES    | 定时发送UDP消息的单次目标实例数量                                                                            | 4       |          |
| GDD_MEM_GOSSIP_INTERVAL | 定时发送UDP消息的间隔时间                                                                                  | 500ms   |          |
| GDD_MEM_TCP_TIMEOUT     | 单次TCP请求的超时时间                                                                                      | 30s     |          |
| GDD_MEM_INDIRECT_CHECKS | 如果UDP探活失败，帮助该实例做间接探活的其他实例的数量                                                           | 3       |          |
| GDD_MEM_WEIGHT          | `已废弃`客户端平滑加权负载均衡算法所需要的实例权重，请用`GDD_WEIGHT`                                           | 0       |          |
| GDD_MEM_WEIGHT_INTERVAL | 程序自动计算当前实例权重值并发出UDP消息的间隔时间，默认值为`0s`，即默认禁用该功能，实例权重取`GDD_WEIGHT`，若未设置，则取`GDD_MEM_WEIGHT`，若也未设置，则取默认值`1` | 0s      |          |
| GDD_MEM_LOG_DISABLE     | 是否关闭memberlist日志                                                                                 | false   |          |
| GDD_MEM_CIDRS_ALLOWED   | 如果未设置，则放行所有实例发来的请求。如果设置，则只允许符合条件的实例的请求通过。示例：`GDD_MEM_CIDRS_ALLOWED=172.28.0.0/16`  |         |          |

## Nacos配置

| 环境变量名       | 描述                                                                                                       | 默认值    | 是否必须                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| GDD_NACOS_NAMESPACE_ID            | 命名空间                                                                                 | public                 |          |
| GDD_NACOS_TIMEOUT_MS              | 请求超时时间，单位毫秒                                                                      | 10000            |          |
| GDD_NACOS_NOT_LOAD_CACHE_AT_START | 程序启动时是否从磁盘缓存中加载服务列表                                                         | false            |          |
| GDD_NACOS_LOG_DIR                 | 日志目录地址                                                                               | /tmp/nacos/log   |          |
| GDD_NACOS_CACHE_DIR               | 服务列表磁盘缓存地址                                                      | /tmp/nacos/cache |          |
| GDD_NACOS_LOG_LEVEL               | 日志等级，可选项：`debug`,`info`,`warn`,`error`                                      | info             |          |
| GDD_NACOS_SERVER_ADDR             | Nacos服务器连接地址，多个地址用英文逗号分隔                                         |                  |          |
| GDD_NACOS_REGISTER_HOST           | 服务实例的注册地址，默认值取主机的私有IP |                  |          |
