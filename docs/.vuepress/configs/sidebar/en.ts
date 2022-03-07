import type { SidebarConfig } from '@vuepress/theme-default'

export const en: SidebarConfig = {
  '/guide/': [
    {
      text: 'Guide',
      children: [
        '/guide/README.md',
        '/guide/getting-started.md',
        '/guide/idl.md',
        '/guide/cli.md',
        '/guide/generation.md',
        '/guide/rest.md',
        '/guide/configuration.md',
        '/guide/deployment.md',
        '/guide/migration.md',
      ],
    },
  ],
}
