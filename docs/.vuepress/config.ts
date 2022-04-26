import { defineUserConfig } from '@vuepress/cli'
import type { DefaultThemeOptions } from '@vuepress/theme-default'
import { path } from '@vuepress/utils'
import { navbar, sidebar } from './configs'

const isProd = process.env.NODE_ENV === 'production'

export default defineUserConfig<DefaultThemeOptions>({
  base: '/',

  head: [[
    'link',
    {
      rel: 'icon',
      type: 'image/x-icon',
      sizes: '32x32',
      href: `/favicon.ico`,
    },
  ],
  [
    "script",
    {},
    `
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?74c7a15b874743051fd1a1d679c5a79f";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();`
  ],
  ['script', { type: 'text/javascript', src: 'https://v1.cnzz.com/z_stat.php?id=1281026244&web_id=1281026244' }],
  ['meta', { name: 'keywords', content: 'go-doudou,Go语言微服务框架,golang,go-doudou微服务框架,RESTful,微服务,服务注册与发现,负载均衡,熔断限流,grpc,去中心化,golang microservice framework,golang orm,ORM工具,microservice,service discovery,load balancing,circuit breaker,rate limit,低代码平台' }],
  ['meta', { name: 'description', content: 'go-doudou是一个基于SWIM gossip协议的去中心化的微服务框架。它同时支持开发单体应用。从定义Go语言接口开始，无须学习任何接口描述语言。内置基于SWIM gossip协议的服务注册与发现的机制，帮助你构建一个健壮的、可扩展的、去中心化的微服务集群。内置强大的代码生成器。定义好服务接口以后，你的唯一工作就是实现你的业务逻辑。内置服务治理组件，支持客户端负载均衡、熔断限流、隔仓、超时、重试等等。' }]
],

  locales: {
    "/": {
      lang: "zh-CN",
      title: "go-doudou",
      description: "基于Gossip协议的去中心化go语言微服务框架",
    },
  },

  themeConfig: {
    repo: "https://github.com/unionj-cloud/go-doudou",
    logo: "/logo.png",
    // theme-level locales config
    locales: {
      '/': {
         // navbar
         navbar: navbar.zh,
         selectLanguageName: '简体中文',
         selectLanguageText: '选择语言',
         selectLanguageAriaLabel: '选择语言',
 
         // sidebar
         sidebar: sidebar.zh,
 
         // page meta
         editLinkText: '在 GitHub 上编辑此页',
         lastUpdatedText: '上次更新',
         contributorsText: '贡献者',
 
         // custom containers
         tip: '提示',
         warning: '注意',
         danger: '警告',
 
         // 404 page
         notFound: [
           '这里什么都没有',
           '我们怎么到这来了？',
           '这是一个 404 页面',
           '看起来我们进入了错误的链接',
         ],
         backToHome: '返回首页',
 
         // a11y
         openInNewWindow: '在新窗口打开',
         toggleDarkMode: '切换夜间模式',
         toggleSidebar: '切换侧边栏',
      },
    },

    themePlugins: {
      // only enable git plugin in production mode
      git: isProd,
      // use shiki plugin in production mode instead
      prismjs: !isProd,
    },
  },

  markdown: {
    importCode: {
      handleImportPath: (str) =>
        str.replace(
          /^@vuepress/,
          path.resolve(__dirname, '../../packages/@vuepress')
        ),
    },
  },

  plugins: [
    [
      '@vuepress/plugin-google-analytics',
      {
        // we have multiple deployments, which would use different id
        id: "G-Q6WSSDRZKG",
      },
    ],
    [
      '@vuepress/plugin-register-components',
      {
        componentsDir: path.resolve(__dirname, './components'),
      },
    ],
    // only enable shiki plugin in production mode
    [
      '@vuepress/plugin-shiki',
      isProd
        ? {
          theme: 'dark-plus',
        }
        : false,
    ],
  ],
})
