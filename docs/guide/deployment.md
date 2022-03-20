# Deployment

## Monolithic Architecture
### ECS

1. Clone your project codebase to your ECS server

2. Compile code to binary executable file
```shell
export GDD_ENV=prod && go build -o api cmd/main.go 
```

3. Run the executable file. Recommend to use screen command or [pm2](https://pm2.keymetrics.io/). Here use screen as an example. First run `screen -S app` to create a window named `app`, then run `./app`. You can press `ctrl + a + d` to detach this window, and you can attach the window by running `screen -r app`.

:::tip
If your server OS is Centos, you can run `yum install -y screen` to install screen.

You can run `screen -ls` to see window list.

```shell
➜  ~ screen -ls   
There is a screen on:
	16048.app	(Detached)
1 Socket in /var/run/screen/S-root.
```

If you want to remove the window, you can run `screen -r app` to attach the window at first, then type `exit`, press `enter`, then you exit and remove the window.

```shell
➜  ~ screen -r app
[screen is terminating]
➜  ~  
➜  ~ screen -ls   
No Sockets found in /var/run/screen/S-root.
```

It's enough for most software engineers to know these commands.
:::

### Docker

You can directly use the generated `Dockerfile` by `go-doudou svc init`, or use your own.

First download dependencies to `vendor` directory.

```
go mod vendor
```

Then build image

```shell
docker build -t myservice . 
```

At last, run `docker run`

```shell
docker run -it -d -p 6060:6060 myservice
```

You need to change `myservice` to your image name

### Kubernetes

Go-doudou has out-of-box support for Kubernetes.

1. Run `go-doudou svc push` to build docker image and push to remote image repository. You will also get two generated k8s deployment yaml files, one is for `deployment` kind service, the other is for `statefulset` kind service

```shell
go-doudou svc push --pre godoudou_ -r wubin1989
```

You can set `--pre` flag to specify prefix for image name. You need to change `wubin1989` to your own remote image repository.

This command automatically updates the version of image with pattern `v` + `yyyyMMddHHmmss` and `image` property in the two k8s deployment yaml files.

2. Run `go-doudou svc deploy`. By default, `_statefulset.yaml` suffixed file will be applied. You can set `-k` flag to specify other file such as `_deployment.yaml` suffixed file.

```shell
go-doudou svc deploy -k helloworld_deployment.yaml
```

You need to change `helloworld_deployment.yaml` to your own file.

## Microservice Architecture

### Overview
![microservice](/images/microservice.png)

### Network Security

If you use go-doudou built-in memberlist mechanism for service discovery, we recommend you to restrict memberlist listening port (`7946` by default) to private network only to ensure network security, though you can set `GDD_MEM_CIDRS_ALLOWED` environment variable to specify only a range of ips to be allowed to join cluster.

### Cluster Seeds

If you use go-doudou built-in memberlist mechanism for service discovery, you must start one or more service instances as seeds to let others to join. Any go-doudou service instance can be seed. Then you can set `GDD_MEM_SEED` environment variable to these seed connection urls (ip or dns address), multiple addresses should be joined by comma.

To avoid unstable due to seed instances restart because of project iteration, recommend to deploy one or more dedicated seed instances without any real business logic. The only duty for seed instances is let other instances to join cluster. Communication and api calling between instances are totally peer to peer, not bypass any seed instance.

### Prometheus Service Discovery

There is no official service discovery support for go-doudou from Prometheus, so we implemented our own based on a post [Implementing Custom Service Discovery](https://prometheus.io/blog/2018/07/05/implementing-custom-sd/) from official blog. Source code is [here](https://github.com/unionj-cloud/go-doudou-prometheus-sd) , we also provide docker image for convenience.

```shell
docker pull wubin1989/go-doudou-prometheus-sd:v1.0.2
```

Below is a `docker-compose.yml` example
```yaml
version: '3.9'

services:
  wordcloud-prometheus:
    container_name: wordcloud-prometheus
    hostname: wordcloud-prometheus
    image: wubin1989/go-doudou-prometheus-sd:v1.0.2
    environment:
      - GDD_SERVICE_NAME=wordcloud-prometheus
      - PROM_REFRESH_INTERVAL=15s
      - GDD_MEM_CIDRS_ALLOWED=172.28.0.0/16
    volumes:
      - ./prometheus/:/etc/prometheus/
    ports:
      - "9090:9090"
    restart: always
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:9090" ]
      interval: 10s
      timeout: 3s
      retries: 3
    networks:
      - tutorial

networks:
  tutorial:
    name: tutorial
    ipam:
      driver: default
      config:
        - subnet: 172.28.0.0/16
```

The structure of `./prometheus/` directory mounted to container is as below

```
├── alert.rules
├── prometheus.yml
└── sd
    └── go-doudou.json
```

Let's see what's in `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'alert.rules'

scrape_configs:
  - job_name: "go-doudou-wordcloud"
    basic_auth:
      username: admin
      password: admin
    metrics_path: /go-doudou/prometheus
    file_sd_configs:
      - files:
          - sd/go-doudou.json
```

Don't change Line 13 to 16. You must change `username` and `password`, don't use the default values. Other content can be changed to fit your needs.

### Kubernetes

Please refer to [kubernetes](#kubernetes) to learn about deployment. Here are some supplemental instructions.

1. You can utilize k8s built-in service discovery and load balancing mechanism. You just need to deploy go-doudou service as mono application, then configure dns address to consumer side environment variable to let client call apis directly, and let k8s do load balancing for us. If you need to expose apis to public network, you can configure ingress by yourself.

2. You can utilize k8s built-in config management solution [`ConfigMaps`](https://kubernetes.io/docs/concepts/configuration/configmap/) to manage configs for go-doudou services.

3. If you still want to use memberlist service discovery mechanism, there are two options: `deployment` kind which is stateless and `statefulset` kind which is stateful.

4. Go-doudou supports `deployment` kind and `statefulset` kind at the same time. You can deploy all of services to one kind or mix two kinds. 

5. Recommend to deploy seed instances as `statefulset` kind at least. Compare to `deployment` kind, `statefulset` kind container has fixed container name and `hostname`, you can configure a `headless` service endpoint to get a dns address directly locating to the container. The dns address pattern is `container-hostname.service-metadata-name.my-namespace.svc.cluster-domain.example`, for example, `seed-2.seed-svc-headless.default.svc.cluster.local`. Even if seed instances restarted by any possible reason, dns addresses won't be changed, you won't need to change the value of `GDD_MEM_SEED` environment variable for other instances, so you can get a more stable and more maintainable cluster. Please refer to [DNS for Services and Pods](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/) to learn more.

6. Above introduced `go-doudou-prometheus-sd` service itself is go-doudou service, and can be used as seed. You can deploy it as `statefulset` kind and scale to multiple replicas. If you deployed 3 seed instances, the value of `GDD_MEM_SEED` environment variable for all instances (including seed instances themselves) is as below

```shell
GDD_MEM_SEED=prometheus-0.prometheus-svc.default.svc.cluster.local,prometheus-1.prometheus-svc.default.svc.cluster.local,prometheus-2.prometheus-svc.default.svc.cluster.local
```