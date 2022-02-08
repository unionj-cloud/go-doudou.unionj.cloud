module.exports = {
  // 主题和它的配置
  theme: "@vuepress/theme-default",
  themeConfig: {
    repo: 'https://github.com/unionj-cloud/go-doudou',
    logo: "/logo.png",
    navbar: [
      // NavbarItem
      {
        text: 'REST',
        link: '/rest/',
      },
      {
        text: 'RPC',
        link: '/rpc/',
      },
    ],
    locales: {
      '/': {
        selectLanguageText: "Languages",
        selectLanguageName: 'English',
      },
      '/zh/': {
        selectLanguageText: "选择语言",
        selectLanguageName: '简体中文',
      },
    },
  },

  locales: {
    // The key is the path for the locale to be nested under.
    // As a special case, the default locale can use '/' as its path.
    "/": {
      lang: "en-US",
      title: "Go-doudou Documentation",
      description: "Golang microservice framework go-doudou documentation site",
    },
    "/zh/": {
      lang: "zh-CN",
      title: "Go-doudou文档",
      description: "go语言微服务框架go-doudou在线文档",
    },
  },
};
