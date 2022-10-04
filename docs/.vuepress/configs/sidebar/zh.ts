import type { SidebarConfig } from '@vuepress/theme-default'

export const zh: SidebarConfig = {
  '/guide/': [
    {
      text: '指南',
      children: [
        '/guide/README.md',
        '/guide/getting-started.md',
        '/guide/idl.md',
        '/guide/cli.md',
        '/guide/generation.md',
        '/guide/rest.md',
        '/guide/grpc.md',
        '/guide/configuration.md',
        '/guide/deployment.md',
      ],
    },
  ],
  '/orm/': [
    {
      text: 'ORM',
      children: [
        '/orm/README.md',
        '/orm/getting-started.md',
        '/orm/ddl.md',
        '/orm/dsl.md',
        '/orm/log.md',
        '/orm/cache.md',
      ],
    },
  ],
}
