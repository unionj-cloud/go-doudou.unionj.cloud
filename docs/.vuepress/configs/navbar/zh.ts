import type { NavbarConfig } from '@vuepress/theme-default'
import { version } from '../meta'

export const zh: NavbarConfig = [
  {
    text: '指南',
    link: '/guide/',
  },
  {
    text: '资源',
    link: '/resources/',
  },
  {
    text: '贡献',
    link: '/contribution/',
  },
  {
    text: `v${version}`,
    children: [
      {
        text: 'v0.x',
        link: 'https://github.com/unionj-cloud/go-doudou/blob/v0.9.8/README.md',
      },
      {
        text: 'Release Notes',
        link: 'https://github.com/unionj-cloud/go-doudou/releases',
      },
    ],
  },
  {
    text: `En`,
    link: 'https://go-doudou.github.io',
  },
]
