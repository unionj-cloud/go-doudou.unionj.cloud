import{r as l,o as r,a as p,b as s,e as a,F as c,f as o,g as e}from"./app.04f9bf74.js";import{_ as t}from"./microservice.dbaae997.js";import{_ as i}from"./plugin-vue_export-helper.21dcd24c.js";const d={},u=o(`<h1 id="deployment" tabindex="-1"><a class="header-anchor" href="#deployment" aria-hidden="true">#</a> Deployment</h1><h2 id="monolithic-architecture" tabindex="-1"><a class="header-anchor" href="#monolithic-architecture" aria-hidden="true">#</a> Monolithic Architecture</h2><h3 id="ecs" tabindex="-1"><a class="header-anchor" href="#ecs" aria-hidden="true">#</a> ECS</h3><ol><li><p>Clone your project codebase to your ECS server</p></li><li><p>Compile code to binary executable file</p></li></ol><div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#569CD6;">export</span><span style="color:#D4D4D4;"> GDD_ENV=prod &amp;&amp; go build -o api cmd/main.go </span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div>`,5),D={start:"3"},m=e("Run the executable file. Recommend to use screen command or "),y={href:"https://pm2.keymetrics.io/",target:"_blank",rel:"noopener noreferrer"},b=e("pm2"),h=e(". Here use screen as an example. First run "),v=s("code",null,"screen -S app",-1),g=e(" to create a window named "),_=s("code",null,"app",-1),f=e(", then run "),E=s("code",null,"./app",-1),k=e(". You can press "),C=s("code",null,"ctrl + a + d",-1),w=e(" to detach this window, and you can attach the window by running "),x=s("code",null,"screen -r app",-1),S=e("."),M=o(`<div class="custom-container tip"><p class="custom-container-title">TIP</p><p>If your server OS is Centos, you can run <code>yum install -y screen</code> to install screen.</p><p>You can run <code>screen -ls</code> to see window list.</p><div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">\u279C  ~ screen -ls   </span></span>
<span class="line"><span style="color:#D4D4D4;">There is a screen on:</span></span>
<span class="line"><span style="color:#D4D4D4;">	16048.app	(Detached)</span></span>
<span class="line"><span style="color:#D4D4D4;">1 Socket </span><span style="color:#C586C0;">in</span><span style="color:#D4D4D4;"> /var/run/screen/S-root.</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br></div></div><p>If you want to remove the window, you can run <code>screen -r app</code> to attach the window at first, then type <code>exit</code>, press <code>enter</code>, then you exit and remove the window.</p><div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">\u279C  ~ screen -r app</span></span>
<span class="line"><span style="color:#D4D4D4;">[screen is terminating]</span></span>
<span class="line"><span style="color:#D4D4D4;">\u279C  ~  </span></span>
<span class="line"><span style="color:#D4D4D4;">\u279C  ~ screen -ls   </span></span>
<span class="line"><span style="color:#D4D4D4;">No Sockets found </span><span style="color:#C586C0;">in</span><span style="color:#D4D4D4;"> /var/run/screen/S-root.</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br></div></div><p>It&#39;s enough for most software engineers to know these commands.</p></div><h3 id="docker" tabindex="-1"><a class="header-anchor" href="#docker" aria-hidden="true">#</a> Docker</h3><p>You can directly use the generated <code>Dockerfile</code> by <code>go-doudou svc init</code>, or use your own.</p><p>First download dependencies to <code>vendor</code> directory.</p><div class="language-text ext-text line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">go mod vendor
</span></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div><p>Then build image</p><div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">docker build -t myservice </span><span style="color:#DCDCAA;">.</span><span style="color:#D4D4D4;"> </span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div><p>At last, run <code>docker run</code></p><div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">docker run -it -d -p 6060:6060 myservice</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div><p>You need to change <code>myservice</code> to your image name</p><h3 id="kubernetes" tabindex="-1"><a class="header-anchor" href="#kubernetes" aria-hidden="true">#</a> Kubernetes</h3><p>Go-doudou has out-of-box support for Kubernetes.</p><ol><li>Run <code>go-doudou svc push</code> to build docker image and push to remote image repository. You will also get two generated k8s deployment yaml files, one is for <code>deployment</code> kind service, the other is for <code>statefulset</code> kind service</li></ol><div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">go-doudou svc push --pre godoudou_ -r wubin1989</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div><p>You can set <code>--pre</code> flag to specify prefix for image name. You need to change <code>wubin1989</code> to your own remote image repository.</p><p>This command automatically updates the version of image with pattern <code>v</code> + <code>yyyyMMddHHmmss</code> and <code>image</code> property in the two k8s deployment yaml files.</p><ol start="2"><li>Run <code>go-doudou svc deploy</code>. By default, <code>_statefulset.yaml</code> suffixed file will be applied. You can set <code>-k</code> flag to specify other file such as <code>_deployment.yaml</code> suffixed file.</li></ol><div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">go-doudou svc deploy -k helloworld_deployment.yaml</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div><p>You need to change <code>helloworld_deployment.yaml</code> to your own file.</p><h2 id="microservice-architecture" tabindex="-1"><a class="header-anchor" href="#microservice-architecture" aria-hidden="true">#</a> Microservice Architecture</h2><h3 id="overview" tabindex="-1"><a class="header-anchor" href="#overview" aria-hidden="true">#</a> Overview</h3><p><img src="`+t+'" alt="microservice"></p><h3 id="network-security" tabindex="-1"><a class="header-anchor" href="#network-security" aria-hidden="true">#</a> Network Security</h3><p>If you use go-doudou built-in memberlist mechanism for service discovery, we recommend you to restrict memberlist listening port (<code>7946</code> by default) to private network only to ensure network security, though you can set <code>GDD_MEM_CIDRS_ALLOWED</code> environment variable to specify only a range of ips to be allowed to join cluster.</p><h3 id="cluster-seeds" tabindex="-1"><a class="header-anchor" href="#cluster-seeds" aria-hidden="true">#</a> Cluster Seeds</h3><p>If you use go-doudou built-in memberlist mechanism for service discovery, you must start one or more service instances as seeds to let others to join. Any go-doudou service instance can be seed. Then you can set <code>GDD_MEM_SEED</code> environment variable to these seed connection urls (ip or dns address), multiple addresses should be joined by comma.</p><p>To avoid unstable due to seed instances restart because of project iteration, recommend to deploy one or more dedicated seed instances without any real business logic. The only duty for seed instances is let other instances to join cluster. Communication and api calling between instances are totally peer to peer, not bypass any seed instance.</p><h3 id="prometheus-service-discovery" tabindex="-1"><a class="header-anchor" href="#prometheus-service-discovery" aria-hidden="true">#</a> Prometheus Service Discovery</h3>',28),I=e("There is no official service discovery support for go-doudou from Prometheus, so we implemented our own based on a post "),Y={href:"https://prometheus.io/blog/2018/07/05/implementing-custom-sd/",target:"_blank",rel:"noopener noreferrer"},j=e("Implementing Custom Service Discovery"),q=e(" from official blog. Source code is "),A={href:"https://github.com/unionj-cloud/go-doudou-prometheus-sd",target:"_blank",rel:"noopener noreferrer"},R=e("here"),T=e(" , we also provide docker image for convenience."),G=o(`<div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">docker pull wubin1989/go-doudou-prometheus-sd:v1.0.2</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div><p>Below is a <code>docker-compose.yml</code> example</p><div class="language-yaml ext-yml line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#569CD6;">version</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">&#39;3.9&#39;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#569CD6;">services</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">  </span><span style="color:#569CD6;">wordcloud-prometheus</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">container_name</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">wordcloud-prometheus</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">hostname</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">wordcloud-prometheus</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">image</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">wubin1989/go-doudou-prometheus-sd:v1.0.2</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">environment</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      - </span><span style="color:#CE9178;">GDD_SERVICE_NAME=wordcloud-prometheus</span></span>
<span class="line"><span style="color:#D4D4D4;">      - </span><span style="color:#CE9178;">PROM_REFRESH_INTERVAL=15s</span></span>
<span class="line"><span style="color:#D4D4D4;">      - </span><span style="color:#CE9178;">GDD_MEM_CIDRS_ALLOWED=172.28.0.0/16</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">volumes</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      - </span><span style="color:#CE9178;">./prometheus/:/etc/prometheus/</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">ports</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      - </span><span style="color:#CE9178;">&quot;9090:9090&quot;</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">restart</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">always</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">healthcheck</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">test</span><span style="color:#D4D4D4;">: [ </span><span style="color:#CE9178;">&quot;CMD&quot;</span><span style="color:#D4D4D4;">, </span><span style="color:#CE9178;">&quot;curl&quot;</span><span style="color:#D4D4D4;">, </span><span style="color:#CE9178;">&quot;-f&quot;</span><span style="color:#D4D4D4;">, </span><span style="color:#CE9178;">&quot;http://localhost:9090&quot;</span><span style="color:#D4D4D4;"> ]</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">interval</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">10s</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">timeout</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">3s</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">retries</span><span style="color:#D4D4D4;">: </span><span style="color:#B5CEA8;">3</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">networks</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      - </span><span style="color:#CE9178;">tutorial</span></span>
<span class="line"></span>
<span class="line"><span style="color:#569CD6;">networks</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">  </span><span style="color:#569CD6;">tutorial</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">name</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">tutorial</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">ipam</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">driver</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">default</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">config</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">        - </span><span style="color:#569CD6;">subnet</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">172.28.0.0/16</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br></div></div><p>The structure of <code>./prometheus/</code> directory mounted to container is as below</p><div class="language-text ext-text line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">\u251C\u2500\u2500 alert.rules
\u251C\u2500\u2500 prometheus.yml
\u2514\u2500\u2500 sd
    \u2514\u2500\u2500 go-doudou.json
</span></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br></div></div><p>Let&#39;s see what&#39;s in <code>prometheus.yml</code></p><div class="language-yaml ext-yml line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#569CD6;">global</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">  </span><span style="color:#569CD6;">scrape_interval</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">15s</span></span>
<span class="line"><span style="color:#D4D4D4;">  </span><span style="color:#569CD6;">evaluation_interval</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">15s</span></span>
<span class="line"></span>
<span class="line"><span style="color:#569CD6;">rule_files</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">  - </span><span style="color:#CE9178;">&#39;alert.rules&#39;</span></span>
<span class="line"></span>
<span class="line"><span style="color:#569CD6;">scrape_configs</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">  - </span><span style="color:#569CD6;">job_name</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">&quot;go-doudou-wordcloud&quot;</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">basic_auth</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">username</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">admin</span></span>
<span class="line"><span style="color:#D4D4D4;">      </span><span style="color:#569CD6;">password</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">admin</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">metrics_path</span><span style="color:#D4D4D4;">: </span><span style="color:#CE9178;">/go-doudou/prometheus</span></span>
<span class="line"><span style="color:#D4D4D4;">    </span><span style="color:#569CD6;">file_sd_configs</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">      - </span><span style="color:#569CD6;">files</span><span style="color:#D4D4D4;">:</span></span>
<span class="line"><span style="color:#D4D4D4;">          - </span><span style="color:#CE9178;">sd/go-doudou.json</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br></div></div><p>Don&#39;t change Line 13 to 16. You must change <code>username</code> and <code>password</code>, don&#39;t use the default values. Other content can be changed to fit your needs.</p><h3 id="kubernetes-1" tabindex="-1"><a class="header-anchor" href="#kubernetes-1" aria-hidden="true">#</a> Kubernetes</h3><p>Please refer to <a href="#kubernetes">kubernetes</a> to learn about deployment. Here are some supplemental instructions.</p>`,10),N=s("li",null,[s("p",null,"You can utilize k8s built-in service discovery and load balancing mechanism. You just need to deploy go-doudou service as mono application, then configure dns address to consumer side environment variable to let client call apis directly, and let k8s do load balancing for us. If you need to expose apis to public network, you can configure ingress by yourself.")],-1),L=e("You can utilize k8s built-in config management solution "),P={href:"https://kubernetes.io/docs/concepts/configuration/configmap/",target:"_blank",rel:"noopener noreferrer"},V=s("code",null,"ConfigMaps",-1),B=e(" to manage configs for go-doudou services."),O=s("li",null,[s("p",null,[e("If you still want to use memberlist service discovery mechanism, there are two options: "),s("code",null,"deployment"),e(" kind which is stateless and "),s("code",null,"statefulset"),e(" kind which is stateful.")])],-1),F=s("li",null,[s("p",null,[e("Go-doudou supports "),s("code",null,"deployment"),e(" kind and "),s("code",null,"statefulset"),e(" kind at the same time. You can deploy all of services to one kind or mix two kinds.")])],-1),H=o("Recommend to deploy seed instances as <code>statefulset</code> kind at least. Compare to <code>deployment</code> kind, <code>statefulset</code> kind container has fixed container name and <code>hostname</code>, you can configure a <code>headless</code> service endpoint to get a dns address directly locating to the container. The dns address pattern is <code>container-hostname.service-metadata-name.my-namespace.svc.cluster-domain.example</code>, for example, <code>seed-2.seed-svc-headless.default.svc.cluster.local</code>. Even if seed instances restarted by any possible reason, dns addresses won&#39;t be changed, you won&#39;t need to change the value of <code>GDD_MEM_SEED</code> environment variable for other instances, so you can get a more stable and more maintainable cluster. Please refer to ",17),K={href:"https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/",target:"_blank",rel:"noopener noreferrer"},z=e("DNS for Services and Pods"),W=e(" to learn more."),J=s("li",null,[s("p",null,[e("Above introduced "),s("code",null,"go-doudou-prometheus-sd"),e(" service itself is go-doudou service, and can be used as seed. You can deploy it as "),s("code",null,"statefulset"),e(" kind and scale to multiple replicas. If you deployed 3 seed instances, the value of "),s("code",null,"GDD_MEM_SEED"),e(" environment variable for all instances (including seed instances themselves) is as below")])],-1),Q=o(`<div class="language-bash ext-sh line-numbers-mode"><pre class="shiki" style="background-color:#1E1E1E;"><code><span class="line"><span style="color:#D4D4D4;">GDD_MEM_SEED=prometheus-0.prometheus-svc.default.svc.cluster.local,prometheus-1.prometheus-svc.default.svc.cluster.local,prometheus-2.prometheus-svc.default.svc.cluster.local</span></span>
<span class="line"></span></code></pre><div class="line-numbers"><span class="line-number">1</span><br></div></div>`,1);function U(X,Z){const n=l("ExternalLinkIcon");return r(),p(c,null,[u,s("ol",D,[s("li",null,[m,s("a",y,[b,a(n)]),h,v,g,_,f,E,k,C,w,x,S])]),M,s("p",null,[I,s("a",Y,[j,a(n)]),q,s("a",A,[R,a(n)]),T]),G,s("ol",null,[N,s("li",null,[s("p",null,[L,s("a",P,[V,a(n)]),B])]),O,F,s("li",null,[s("p",null,[H,s("a",K,[z,a(n)]),W])]),J]),Q],64)}var ns=i(d,[["render",U]]);export{ns as default};