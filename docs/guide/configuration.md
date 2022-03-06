# Configuration

You can use environment variables to configure go-doudou framework. Go-doudou uses [godotenv](https://github.com/joho/godotenv) library to give you out-of-box support for loading environment variable values from dotenv files.  

If you have multiple `.env` files like `.env.test`, `.env.prod` etc., you can set `GDD_ENV` to `test` or `prod` to load corresponding dotenv file.

## Service Configuration

| Environment Variable    | Description                                                      | Default   | Required |
| ----------------------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------| -------- |
| GDD_BANNER              | whether output banner to stdout or not to console                  | true      |       |
| GDD_BANNER_TEXT         |                                                                    | Go-doudou |         |
| GDD_LOG_LEVEL           | possible values are panic, fatal, error, warn, warning, info, debug, trace        | info      |          |
| GDD_LOG_FORMAT            | set log format to text or json, possible values are text and json | text      |          |
| GDD_LOG_REQ_ENABLE       | enable request and response logging                       | false      |          |
| GDD_GRACE_TIMEOUT       | graceful shutdown timeout for http server                     | 15s       |          |
| GDD_WRITE_TIMEOUT       | http server connection write timeout                                            | 15s       |          |
| GDD_READ_TIMEOUT        | http server connection read timeout     | 15s       |          |
| GDD_IDLE_TIMEOUT        | http server connection idle timeout | 60s       |          |
| GDD_ROUTE_ROOT_PATH     | prefix string to each of http api routes   |         |          |
| GDD_SERVICE_NAME        | service name     |           | Yes if you develop microservice application      |
| GDD_HOST                | host for the http server to listen on   |         |          |
| GDD_PORT                | port for the http server to listen on | 6060        |          |
| GDD_RETRY_COUNT |   client retry count  | 0         |          |
| GDD_MANAGE_ENABLE       | enable built-in api endpoints such as /go-doudou/doc, /go-doudou/openapi.json, /go-doudou/prometheus and /go-doudou/registry | true     |          |
| GDD_MANAGE_USER         | http basic username for built-in api endpoints     | admin        |          |
| GDD_MANAGE_PASS         | http basic password for built-in api endpoints     | admin        |          |
| GDD_TRACING_METRICS_ROOT         | metrics root for jaeger tracing    | Go-doudou        |          |

## Cluster Configuration

| Environment Variable    | Description                                                      | Default   | Required |
| ----------------------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------| -------- |
| GDD_MEM_SEED            | seed address for join memberlist cluster. If empty or not set, this node will create a new cluster for other nodes to join         |         |          |
| GDD_MEM_NAME            | for dev and test purpose only. unique name of this node in cluster. if empty or not set, hostname will be used instead    |         |          |
| GDD_MEM_HOST            | specify `AdvertiseAddr` attribute of memberlist config struct. if GDD_MEM_HOST starts with dot such as `.seed-svc-headless.default.svc.cluster.local`, it will be prefixed with `hostname` to be `seed-2.seed-svc-headless.default.svc.cluster.local` for supporting k8s statefulset service. |         |          |
| GDD_MEM_PORT            | TCP and UDP port for memberlist instance to listen on                                    |   7946      |          |
| GDD_MEM_DEAD_TIMEOUT    | dead node will be removed from node map if not received refute messages from it in GDD_MEM_DEAD_TIMEOUT duration    | 60s       |          |
| GDD_MEM_SYNC_INTERVAL   | local node will synchronize states from other random node every GDD_MEM_SYNC_INTERVAL duration | 60s       |          |
| GDD_MEM_RECLAIM_TIMEOUT | dead node will be replaced with new node with the same name but different full address in GDD_MEM_RECLAIM_TIMEOUT duration  | 3s        |          |
| GDD_MEM_PROBE_INTERVAL | ping remote nodes for failure detection every GDD_MEM_PROBE_INTERVAL duration    | 5s        |          |
| GDD_MEM_PROBE_TIMEOUT | probe fail if not receive ack message in GDD_MEM_PROBE_TIMEOUT duration    | 3s        |          |
| GDD_MEM_SUSPICION_MULT | The multiplier for determining the time an inaccessible node is considered suspect before declaring it dead     | 6         |          |
| GDD_MEM_GOSSIP_NODES | how many remote nodes you want to send gossip messages  | 4         |          |
| GDD_MEM_GOSSIP_INTERVAL | gossip messages in queue every GDD_MEM_GOSSIP_INTERVAL duration         | 500ms     |          |
| GDD_MEM_TCP_TIMEOUT | TCP request will timeout in GDD_MEM_TCP_TIMEOUT duration   | 30s       |          |
| GDD_MEM_INDIRECT_CHECKS | the number of nodes that will be asked to perform an indirect probe of a node in the case a direct probe fails   | 3       |          |
| GDD_MEM_WEIGHT | node weight for smooth weighted round-robin balancing   | 0         |          |
| GDD_MEM_WEIGHT_INTERVAL | node weight will be calculated every GDD_MEM_WEIGHT_INTERVAL    | 0s        |          |
| GDD_MEM_LOG_DISABLE | whether disable memberlist logging           | false        |          |
| GDD_MEM_CIDRS_ALLOWED | If not set, allow any connection (default), otherwise specify all networks allowed connecting (you must specify IPv6/IPv4 separately). Example: GDD_MEM_CIDRS_ALLOWED=172.28.0.0/16 |  |          |
