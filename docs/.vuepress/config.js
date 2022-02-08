module.exports = {
  // 主题和它的配置
  theme: "@vuepress/theme-default",
  themeConfig: {
    repo: "https://github.com/unionj-cloud/go-doudou",
    logo: "/logo.png",
    locales: {
      "/": {
        home: "/",
        selectLanguageText: "Languages",
        selectLanguageName: "English",
        navbar: [
          // NavbarItem
          {
            text: "HOME",
            link: "/",
          },
          {
            text: "REST",
            link: "/rest/install.md",
          },
          {
            text: "RPC",
            link: "/rpc/install.md",
          },
        ],
        sidebar: {
          "/rest/": [
            {
              text: "Install",
              link: "install.md",
            },
          ],
          "/rpc/": [
            {
              text: "Install",
              link: "install.md",
            },
          ],
        },
      },
      "/zh/": {
        home: "/zh/",
        selectLanguageText: "选择语言",
        selectLanguageName: "简体中文",
        navbar: [
          // NavbarItem
          {
            text: "首页",
            link: "/zh/",
          },
          {
            text: "REST",
            link: "/zh/rest/install.md",
          },
          {
            text: "RPC",
            link: "/zh/rpc/install.md",
          },
        ],
        sidebar: {
          "/zh/rest/": [
            {
              text: "安装",
              link: "install.md",
            },
          ],
          "/zh/rpc/": [
            {
              text: "安装",
              link: "install.md",
            },
          ],
        },
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
