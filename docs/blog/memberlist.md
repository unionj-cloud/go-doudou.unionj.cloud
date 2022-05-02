---
sidebar: auto
---

# 深入解读go-doudou内置服务注册与发现组件

go-doudou是2021年初开源的go语言开发的微服务框架。最初基于hashicorp开源的memberlist库打造了内置于go-doudou框架中开箱即用的遵循SWIM gossip协议的去中心化的服务注册与发现机制。SWIM Gossip协议是一种弱一致性的协议，不仅具有去中心化的特性，还具备服务注册、节点探活、消息广播等机制，非常适合做服务注册与发现中间件。

## 实战案例

我们通过一个包含前后台全套服务的上传文本文件生成词云图的实战案例来展示用法。

### 开发环境

需要安装docker和docker-compose开发环境。所有微服务都需打包成docker镜像，然后通过docker-compose命令启动。

### 下载代码

克隆仓库源码到本地后，请切到wordcloud文件夹。

```
git clone git@github.com:unionj-cloud/go-doudou-tutorials.git
```

### 打包镜像

```
make docker
```

### 启动整套微服务系统

```
make up
```

### 初始化minio

本案例采用minio来存储用户上传的文件，需要做一些初始化工作。首先打开[http://localhost:9001/](http://localhost:9001/)，然后用账号密码minio/minio123登录，创建一个桶wordcloud，
并设置为`Access Policy`设置为`public`，最后创建`access key`：testkey和`access secret`：testsecret。

![go-doudou](/images/minio1.png)
![go-doudou](/images/minio2.png)
![go-doudou](/images/minio3.png)
![go-doudou](/images/minio4.png)
![go-doudou](/images/minio5.png)

### 使用系统

打开[http://localhost:3100/](http://localhost:3100/)，用默认账号密码jackchen/1234登录，然后上传任意text格式文件，经过一番处理可以看到页面上输出词云图。

![go-doudou](/images/wordcloud.png)

### 架构说明

本实战案例前端由一个UI服务负责，基于`vue-vben-admin`框架开发（因前端技术栈不是本文的重点，此处不再赘述），后端由5个RESTful微服务构成。具体说明请看下文的注释。

```shell
➜  wordcloud git:(master) ✗ tree -L 1
.
├── Makefile
├── README.md
├── alertmanager
├── ddosify
├── dingtalkalert
├── docker-compose.yml
├── esdata
├── filebeat.yml
├── grafana
├── minio
├── my
├── prometheus
├── screencapture1.png
├── screencapture2.png
├── shellscripts
├── sqlscripts
├── wordcloud-bff  # BFF服务，为前端提供唯一的接口入口，同时针对前端的需求对数据做裁剪和格式化转换
├── wordcloud-maker  # Maker服务，负责根据文本的词频统计结果生成词云图
├── wordcloud-seg  # Seg服务，负责对文本内容做中英文分词，并统计词频
├── wordcloud-task  # Task服务，负责存储和查询用户创建的词云图任务
├── wordcloud-ui
└── wordcloud-user  # User服务，负责注册、登录和生成token

16 directories, 6 files
```

### 服务列表

读者可以打开[http://localhost:6060/go-doudou/registry](http://localhost:6060/go-doudou/registry)查看服务列表。需要输入Http basic账号密码admin/admin。

![go-doudou](/images/registry.png)

### 代码解读

我们以BFF服务为例，来看一下服务注册与发现相关代码。具体说明请参考下文的注释。

```go
package main

import (
	...
)

func main() {
    // 从环境变量中加载配置
	conf := config.LoadFromEnv()

    // User服务http请求客户端
	var userClient *userclient.UsersvcClient
    // Maker服务http请求客户端
	var makerClient *makerclient.WordcloudMakerClient
    // Task服务http请求客户端
	var taskClient *taskclient.WordcloudTaskClient

    // 从环境变量中读取服务模式，单体还是微服务
    // 环境变量名称和值完全可以自定义，与go-doudou框架无关
    // 做服务模式的区分只是为了方便本地开发
	if os.Getenv("GDD_MODE") == "micro" {
        // 服务注册
		err := registry.NewNode()
		if err != nil {
			logrus.Panicln(fmt.Sprintf("%+v", err))
		}
        // 服务下线，释放资源
		defer registry.Shutdown()
        // 创建基于go-doudou内置服务注册与发现机制的客户端负载均衡器
        // User服务的客户端负载均衡器
		userProvider := ddhttp.NewMemberlistServiceProvider("wordcloud-usersvc")
        // 创建User服务的http请求客户端实例
		userClient = userclient.NewUsersvcClient(ddhttp.WithProvider(userProvider))
        // Maker服务的客户端负载均衡器
		makerProvider := ddhttp.NewMemberlistServiceProvider("wordcloud-makersvc")
        // Maker服务的http请求客户端实例
		makerClient = makerclient.NewWordcloudMakerClient(ddhttp.WithProvider(makerProvider))
        // Task服务的客户端负载均衡器
		taskProvider := ddhttp.NewMemberlistServiceProvider("wordcloud-tasksvc")
        // Task服务的http请求客户端实例
		taskClient = taskclient.NewWordcloudTaskClient(ddhttp.WithProvider(taskProvider))
	} else {
        // 直连User服务的http请求客户端实例
		userClient = userclient.NewUsersvcClient()
        // 直连Maker服务的http请求客户端实例
		makerClient = makerclient.NewWordcloudMakerClient()
        // 直连Task服务的http请求客户端实例
		taskClient = taskclient.NewWordcloudTaskClient()
	}

    // 开启Jaeger调用链监控
	tracer, closer := tracing.Init()
	defer closer.Close()
	opentracing.SetGlobalTracer(tracer)

	rec := metrics.NewPrometheusRecorder(prometheus.DefaultRegisterer)

    // 给User、Maker、Task服务增加熔断器、超时、重试等弹性与容错机制与Prometheus指标采集
	userClientProxy := userclient.NewUsersvcClientProxy(userClient, rec)
	makerClientProxy := makerclient.NewWordcloudMakerClientProxy(makerClient, rec)
	taskClientProxy := taskclient.NewWordcloudTaskClientProxy(taskClient, rec)

    // 创建minio客户端
	endpoint := conf.BizConf.OssEndpoint
	accessKeyID := conf.BizConf.OssKey
	secretAccessKey := conf.BizConf.OssSecret
	useSSL := false

	// Initialize minio client object.
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		panic(err)
	}

    // 将User、Maker、Task服务http请求客户端实例、minio客户端实例注入
	svc := service.NewWordcloudBff(conf, minioClient, makerClientProxy, taskClientProxy, userClientProxy)
	handler := httpsrv.NewWordcloudBffHandler(svc)
	srv := ddhttp.NewDefaultHttpSrv()
	srv.AddMiddleware(httpsrv.Auth(userClientProxy))

	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:6379", conf.RedisConf.Host),
	})

	fn := redisrate.LimitFn(func(ctx context.Context) ratelimit.Limit {
		return ratelimit.PerSecondBurst(conf.ConConf.RatelimitRate, conf.ConConf.RatelimitBurst)
	})

	srv.AddMiddleware(
        // 增加隔仓机制
		ddhttp.BulkHead(conf.ConConf.BulkheadWorkers, conf.ConConf.BulkheadMaxwaittime),
        // 增加基于redis的限流器
		httpsrv.RedisRateLimit(rdb, fn),
	)

	srv.AddRoute(httpsrv.Routes(handler)...)

    // 启动http服务
	srv.Run()
}
```


## 源码解读

go-doudou内置的服务注册与发现机制基于memberlist库开发，同时根据微服务应用场景做了一些改造。memberlist库里有很多宝藏，每次阅读源码都有新的认知。即使读者在实际项目开发中没有采用这种机制，也推荐阅读一番。请读者先浏览一下启动流程图，后文会着重针对几个重要的函数做源码解读。

### 启动流程图

![go-doudou](/images/memberlist.png)

### registry.NewNode()

go-doudou在这个函数里封装了基于memberlist和基于Nacos的两种机制的初始化流程，根据配置来决定采用哪一种机制，支持两种机制同时采用。

```go
func NewNode(data ...map[string]interface{}) error {
    // 从环境变量GDD_SERVICE_DISCOVERY_MODE读取配置
	for mode, _ := range getModemap() {
		switch mode {
		case "nacos":
			nacos.NewNode(data...)
		case "memberlist":
            // 初始化memberlist机制
			err := newNode(data...)
			if err != nil {
				return err
			}
		default:
			logger.Warn(fmt.Sprintf("[go-doudou] unknown service discovery mode: %s", mode))
		}
	}
	return nil
}
```

### registry.newNode()

在这个函数里创建memberlist实例，上文的启动流程图实际从这里开始。

```go
func newNode(data ...map[string]interface{}) error {
    // 初始化memberlist配置
	mconf = newConf()
    // 初始化服务本身的http相关配置和元数据，此处略
	...
	mmeta := mergedMeta{
		Meta: nodeMeta{
			Service:       service,
			RouteRootPath: rr,
			Port:          httpPort,
			RegisterAt:    &now,
			GoVer:         runtime.Version(),
			GddVer:        buildinfo.GddVer,
			BuildUser:     buildinfo.BuildUser,
			BuildTime:     buildTime,
			Weight:        weight,
		},
		Data: make(map[string]interface{}),
	}
	if len(data) > 0 {
		mmeta.Data = data[0]
	}
	queue := &memberlist.TransmitLimitedQueue{
		NumNodes:             numNodes,
		RetransmitMultGetter: retransmitMultGetter,
	}
	BroadcastQueue = queue
	mconf.Delegate = &delegate{
		mmeta: mmeta,
		queue: queue,
	}
	mconf.Events = events
	var err error
    // createMemberlist实际调用的是memberlist.Create
    // 这里这样写是为了单元测试
	if mlist, err = createMemberlist(mconf); err != nil {
		return errors.Wrap(err, "[go-doudou] Failed to create memberlist")
	}
    // 加入种子节点所在集群
	if err = join(); err != nil {
		mlist.Shutdown()
		return errors.Wrap(err, "[go-doudou] Node register failed")
	}
	local := mlist.LocalNode()
	baseUrl, _ := BaseUrl(local)
	logger.Infof("memberlist created. local node is Node %s, providing %s service at %s, memberlist port %s",
		local.Name, mmeta.Meta.Service, baseUrl, fmt.Sprint(local.Port))
	registerConfigListener(mconf)
	return nil
}
```

### memberlist.NewMemberlist

创建memberlist实例

```go
func NewMemberlist(conf *Config) (*Memberlist, error) {
    // 判断协议版本，go-doudou不涉及这块逻辑
	if conf.ProtocolVersion < ProtocolVersionMin {
		return nil, fmt.Errorf("Protocol version '%d' too low. Must be in range: [%d, %d]",
			conf.ProtocolVersion, ProtocolVersionMin, ProtocolVersionMax)
	} else if conf.ProtocolVersion > ProtocolVersionMax {
		return nil, fmt.Errorf("Protocol version '%d' too high. Must be in range: [%d, %d]",
			conf.ProtocolVersion, ProtocolVersionMin, ProtocolVersionMax)
	}

	if len(conf.SecretKey) > 0 {
		if conf.Keyring == nil {
			keyring, err := NewKeyring(nil, conf.SecretKey)
			if err != nil {
				return nil, err
			}
			conf.Keyring = keyring
		} else {
			if err := conf.Keyring.AddKey(conf.SecretKey); err != nil {
				return nil, err
			}
			if err := conf.Keyring.UseKey(conf.SecretKey); err != nil {
				return nil, err
			}
		}
	}

    // 日志相关配置
	if conf.LogOutput != nil && conf.Logger != nil {
		return nil, fmt.Errorf("Cannot specify both LogOutput and Logger. Please choose a single log configuration setting.")
	}

	logDest := conf.LogOutput
	if logDest == nil {
		logDest = os.Stderr
	}

	logger := conf.Logger
	if logger == nil {
		logger = log.New(logDest, "", log.LstdFlags)
	}

	// 如果用户没有传入自定义Transport，则创建一个默认Transport
    // 负责监听TCP和UDP消息
	transport := conf.Transport
	if transport == nil {
		nc := &NetTransportConfig{
			BindAddrs: []string{conf.BindAddr},
			BindPort:  conf.BindPort,
			Logger:    logger,
		}

		// See comment below for details about the retry in here.
		makeNetRetry := func(limit int) (*NetTransport, error) {
			var err error
			for try := 0; try < limit; try++ {
				var nt *NetTransport
				if nt, err = NewNetTransport(nc); err == nil {
					return nt, nil
				}
				if strings.Contains(err.Error(), "address already in use") {
					logger.Printf("[DEBUG] memberlist: Got bind error: %v", err)
					continue
				}
			}

			return nil, fmt.Errorf("failed to obtain an address: %v", err)
		}

		limit := 1
		if conf.BindPort == 0 {
			limit = 10
		}

        // 如果用户没有指定BindPort，则会尝试10次，绑定一个可用端口，供TCP和UDP共用
		nt, err := makeNetRetry(limit)
		if err != nil {
			return nil, fmt.Errorf("Could not set up network transport: %v", err)
		}
		if conf.BindPort == 0 {
			port := nt.GetAutoBindPort()
			conf.BindPort = port
			conf.AdvertisePort = port
			logger.Printf("[DEBUG] memberlist: Using dynamic bind port %d", port)
		}
		transport = nt
	}

	nodeAwareTransport, ok := transport.(NodeAwareTransport)
	if !ok {
		logger.Printf("[DEBUG] memberlist: configured Transport is not a NodeAwareTransport and some features may not work as desired")
		nodeAwareTransport = &shimNodeAwareTransport{transport}
	}

    // 创建并初始化memberlist实例
	m := &Memberlist{
		config:               conf,
		shutdownCh:           make(chan struct{}),
		leaveBroadcast:       make(chan struct{}, 1),
		transport:            nodeAwareTransport,
		handoffCh:            make(chan struct{}, 1),
		highPriorityMsgQueue: list.New(),
		lowPriorityMsgQueue:  list.New(),
		nodeMap:              make(map[string]*nodeState),
		nodeTimers:           make(map[string]*suspicion),
		awareness:            newAwareness(conf.AwarenessMaxMultiplier),
		ackHandlers:          make(map[uint32]*ackHandler),
		broadcasts: &TransmitLimitedQueue{RetransmitMultGetter: func() int {
			return conf.RetransmitMult
		}},
		logger: logger,
	}
	m.broadcasts.NumNodes = func() int {
		return m.estNumNodes()
	}

	// 刷新对外的Host和端口
	if _, _, err := m.refreshAdvertise(); err != nil {
		return nil, err
	}

    // 开启TCP消息监听goroutine
	go m.streamListen()
    // 开启UDP消息监听goroutine
	go m.packetListen()
    // 开启针对通过UDP发来的suspectMsg、aliveMsg、deadMsg、weightMsg和userMsg五种消息类型的处理goroutine
	go m.packetHandler()
	return m, nil
}
```

### m.aliveNode

这个memberlist实例方法负责处理存活消息，可以是处理其他节点发来的消息，也可以处理自己初始化时将自己设为存活状态的消息。

```go
func (m *Memberlist) aliveNode(a *alive, notify chan struct{}, bootstrap bool) {
    // 加锁，确保线程安全
	m.nodeLock.Lock()
	defer m.nodeLock.Unlock()

    // 从m的字典类型的节点缓存nodeMap里取出该存活消息说的节点的名称对应的节点状态值
	state, ok := m.nodeMap[a.Node]

	// 如果本地节点已经主动离开了，且该存活消息说的节点就是自己，则直接返回
    // go-doudou服务节点不存在“主动离开“这种情况，因为群各节点的节点列表缓存不会清除”主动离开”的节点信息，会造成内存泄露
	if m.hasLeft() && a.Node == m.config.Name {
		return
	}

	if len(a.Vsn) >= 3 {
		pMin := a.Vsn[0]
		pMax := a.Vsn[1]
		pCur := a.Vsn[2]
		if pMin == 0 || pMax == 0 || pMin > pMax {
			m.logger.Printf("[WARN] memberlist: Ignoring an alive message for '%s' (%v:%d) because protocol version(s) are wrong: %d <= %d <= %d should be >0", a.Node, a.Addr, a.Port, pMin, pCur, pMax)
			return
		}
	}

	// Alive回调函数，go-doudou框架没有用到，暂时没有找到应用场景
	if m.config.Alive != nil {
		if len(a.Vsn) < 6 {
			m.logger.Printf("[WARN] memberlist: ignoring alive message for '%s' (%v:%d) because Vsn is not present",
				a.Node, a.Addr, a.Port)
			return
		}
		node := &Node{
			Name: a.Node,
			Addr: a.Addr,
			Port: a.Port,
			Meta: a.Meta,
			PMin: a.Vsn[0],
			PMax: a.Vsn[1],
			PCur: a.Vsn[2],
			DMin: a.Vsn[3],
			DMax: a.Vsn[4],
			DCur: a.Vsn[5],
		}
		if err := m.config.Alive.NotifyAlive(node); err != nil {
			m.logger.Printf("[WARN] memberlist: ignoring alive message for '%s': %s",
				a.Node, err)
			return
		}
	}

	// 判断是否是我们之前没有见过的新节点，如果是，则放入本地节点缓存字典
	var updatesNode bool
	if !ok {
        // 判断是否是我们拉黑的ip，如果是，则直接丢弃消息
		errCon := m.config.AddrAllowed(a.Addr)
		if errCon != nil {
			m.logger.Printf("[WARN] memberlist: Rejected node %s (%v): %s", a.Node, a.Addr, errCon)
			return
		}
        // 创建并初始化节点状态
		state = &nodeState{
			Node: Node{
				Name: a.Node,
				Addr: a.Addr,
				Port: a.Port,
				Meta: a.Meta,
			},
			State: StateDead,
		}
        // 协议版本兼容性相关代码，go-doudou不涉及
		if len(a.Vsn) > 5 {
			state.PMin = a.Vsn[0]
			state.PMax = a.Vsn[1]
			state.PCur = a.Vsn[2]
			state.DMin = a.Vsn[3]
			state.DMax = a.Vsn[4]
			state.DCur = a.Vsn[5]
		}

		// 将节点状态放入节点缓存字典
		m.nodeMap[a.Node] = state

		// 随机取一个offset，目的是在后面做节点交换，相当于对节点列表做一个shuffle，
        // 避免连续多个节点都探活失败，增加节点探活机制的开销
		n := len(m.nodes)
		offset := randomOffset(n)

		// 先将该节点状态放到最后，然后再跟位于offset的节点交换位置
		m.nodes = append(m.nodes, state)
		m.nodes[offset], m.nodes[n] = m.nodes[n], m.nodes[offset]

		// 执行节点数量加1的原子性操作
		atomic.AddUint32(&m.numNodes, 1)
	} else {
        // 执行到这里说明存活消息说的节点是已知节点，则判断一下新Host和端口跟旧Host和端口是否一致,
        // 如果不一致，则执行下面的逻辑
		if state.Addr != a.Addr || state.Port != a.Port {
            // 判断新Host是否已被拉黑
			errCon := m.config.AddrAllowed(a.Addr)
			if errCon != nil {
				m.logger.Printf("[WARN] memberlist: Rejected IP update from %v to %v for node %s: %s", a.Node, state.Addr, a.Addr, errCon)
				return
			}
            // 如果配置了DeadNodeReclaimTime（即必须经过多长时间以后，死亡节点才可以以相同的名称和不同的地址声明自己还活着），则判断是否该时间已过，
            // 如果已过时间，则可以声明自己还活着，只是换了个Host或端口
			canReclaim := (m.config.DeadNodeReclaimTime > 0 &&
				time.Since(state.StateChange) > m.config.DeadNodeReclaimTime)

			// 如果缓存中的节点状态是“主动离开”或已“死亡”，但是可以重新声明存活，则更新缓存中的节点状态
			if state.State == StateLeft || (state.State == StateDead && canReclaim) {
				m.logger.Printf("[INFO] memberlist: Updating address for left or failed node %s from %v:%d to %v:%d",
					state.Name, state.Addr, state.Port, a.Addr, a.Port)
				updatesNode = true
			} else {
                // 如果不满足重新声明存活的条件，则打印节点冲突日志
				m.logger.Printf("[ERR] memberlist: Conflicting address for %s. Mine: %v:%d Theirs: %v:%d Old state: %v",
					state.Name, state.Addr, state.Port, a.Addr, a.Port, state.State)

				// 如果配置了节点冲突回调函数，则调用该回调函数
				if m.config.Conflict != nil {
					other := Node{
						Name: a.Node,
						Addr: a.Addr,
						Port: a.Port,
						Meta: a.Meta,
					}
					m.config.Conflict.NotifyConflict(&state.Node, &other)
				}
				return
			}
		}
	}

    // 如果存活消息中的Incarnation属性值小于或等于缓存中的Incarnation属性值，
    // 并且既不是关于本地节点的，也不需要更新节点缓存，则丢弃消息。
    // Incarnation属性值相当于一种节点状态的版本控制，或者说是乐观锁
	isLocalNode := state.Name == m.config.Name
	if a.Incarnation <= state.Incarnation && !isLocalNode && !updatesNode {
		return
	}

	// 如果存活消息中的Incarnation属性值小于缓存中的Incarnation属性值，且关于本地节点，则丢弃消息
	if a.Incarnation < state.Incarnation && isLocalNode {
		return
	}

	// 删除怀疑节点已死的超时器
	delete(m.nodeTimers, a.Node)

	// Store the old state and meta data
	oldState := state.State
	oldMeta := state.Meta

	// 如果不是启动时初始化本地节点状态，但是关于本地节点的，
    // 则执行下面的逻辑
	if !bootstrap && isLocalNode {
		// 计算协议版本矩阵
		versions := []uint8{
			state.PMin, state.PMax, state.PCur,
			state.DMin, state.DMax, state.DCur,
		}

        // 如果存活消息中的Incarnation属性值与缓存中的节点状态的Incarnation属性值相同，我们需要特殊处理，
        // 因为这种情况可能是由于下述情形产生的：
		// 1) 以配置C启动，并加入集群
		// 2) 强制退出/进程被杀死/服务器关机
		// 3) 以配置C'重启，并加入集群
		//
        // 在这种情况下，其他节点和本地节点会看到相同的incarnation属性值，但是节点状态可能已经变了。
        // 因此，我们需要做判等。大多数情况下，我们只需要忽略消息，但是有时我们可能需要反驳回去。
		if a.Incarnation == state.Incarnation &&
			bytes.Equal(a.Meta, state.Meta) &&
			bytes.Equal(a.Vsn, versions) {
			return
		}
		m.refute(state, a.Incarnation)
		m.logger.Printf("[WARN] memberlist: Refuting an alive message for '%s' (%v:%d) meta:(%v VS %v), vsn:(%v VS %v)", a.Node, a.Addr, a.Port, a.Meta, state.Meta, a.Vsn, versions)
	} else {
        // 将该节点存活消息再加入广播队列，广播给其他节点
		m.encodeBroadcastNotify(a.Node, aliveMsg, a, notify)

		// 更新协议版本信息，go-doudou不涉及
		if len(a.Vsn) > 0 {
			state.PMin = a.Vsn[0]
			state.PMax = a.Vsn[1]
			state.PCur = a.Vsn[2]
			state.DMin = a.Vsn[3]
			state.DMax = a.Vsn[4]
			state.DCur = a.Vsn[5]
		}

        // 更新缓存中的节点状态以及Incarnation属性
		state.Incarnation = a.Incarnation
		state.Meta = a.Meta
		state.Addr = a.Addr
		state.Port = a.Port
		if state.State != StateAlive {
			state.State = StateAlive
			state.StateChange = time.Now()
		}
	}

	// 更新指标监控项，用于计算节点健康值，go-doudou动态计算节点权重时也会算作一个维度
	metrics.IncrCounter([]string{"memberlist", "msg", "alive"}, 1)

	// 执行相关回调函数
	if m.config.Events != nil {
		if oldState == StateDead || oldState == StateLeft {
            // 如果节点状态从“死亡”或“主动离开”变成“存活”，则执行Join事件的回调函数
			state.Node.State = state.State
			m.config.Events.NotifyJoin(&state.Node)
		} else if oldState == StateSuspect {
			state.Node.State = state.State
            // 如果节点状态从“疑似死亡”变成“存活”，则执行SuspectSateChange事件的回调函数
			m.config.Events.NotifySuspectSateChange(&state.Node)
		} else if !bytes.Equal(oldMeta, state.Meta) {
			// 如果只是元数据更新，则执行Update事件的回调函数
			m.config.Events.NotifyUpdate(&state.Node)
		}
	}
}
```

### m.schedule

这个方法里实现了memberlist的核心调度逻辑。

```go
func (m *Memberlist) schedule() {
    // 加锁，确保线程安全
	m.tickerLock.Lock()
	defer m.tickerLock.Unlock()

	// 如果定时任务列表不为空，则返回
	if len(m.tickers) > 0 {
		return
	}

    // 创建用于停止定时任务的无缓冲通道，当我们需要停掉定时任务的时候，我们就关闭它
	stopCh := make(chan struct{})

	// 创建一个节点探活定时任务
	if m.config.ProbeInterval > 0 {
		t := time.NewTicker(m.config.ProbeInterval)
		go m.triggerFuncDynamic(func() time.Duration {
			return m.config.ProbeInterval
		}, t, stopCh, m.probe)
		m.tickers = append(m.tickers, t)
	}

	// 创建一个基于TCP的与其他节点同步节点列表的定时任务
	if m.config.PushPullInterval > 0 {
		go m.pushPullTrigger(stopCh)
	}

	// 创建一个广播UDP消息的定时任务
	if m.config.GossipInterval > 0 && m.config.GossipNodes > 0 {
		t := time.NewTicker(m.config.GossipInterval)
		go m.triggerFuncDynamic(func() time.Duration {
			return m.config.GossipInterval
		}, t, stopCh, m.gossip)
		m.tickers = append(m.tickers, t)
	}

	// 创建一个动态计算本地节点权重并广播出去的定时任务
	if m.config.WeightInterval > 0 {
		t := time.NewTicker(m.config.WeightInterval)
		go m.triggerFunc(m.config.WeightInterval, t.C, stopCh, m.weight)
		m.tickers = append(m.tickers, t)
	}

	// 如果定时任务列表不为空，则将刚才创建的stopCh通道赋值给m变量的stopTick属性
	if len(m.tickers) > 0 {
		m.stopTick = stopCh
	}
}
```

## 总结

本文介绍了go-doudou内置的基于SWIM gossip协议的服务注册与发现机制，然后通过一个上传文本文件生成词云图的实战案例介绍了基本用法， 最后通过启动流程图总览了整个流程中的要点，并对核心源码做了详细解读。希望可以帮助各位gopher更好的理解go-doudou微服务框架的内在机制。