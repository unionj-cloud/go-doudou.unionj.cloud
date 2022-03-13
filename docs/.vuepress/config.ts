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
  ]],

  locales: {
    "/": {
      lang: "en-US",
      title: "go-doudou",
      description: "Gossip Protocol Decentralized Golang Microservice Framework",
    },
    "/zh/": {
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
      /**
       * English locale config
       *
       * As the default locale of @vuepress/theme-default is English,
       * we don't need to set all of the locale fields
       */
      '/': {
        // navbar
        navbar: navbar.en,

        // sidebar
        sidebar: sidebar.en,

        // page meta
        editLinkText: 'Edit this page on GitHub',
      },

      /**
       * Chinese locale config
       */
      '/zh/': {
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
