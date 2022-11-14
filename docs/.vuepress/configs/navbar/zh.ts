import type { NavbarConfig } from '@vuepress/theme-default'
import { version } from '../meta'

export const zh: NavbarConfig = [
  {
    text: '指南',
    link: '/guide/',
  },
  {
    text: 'ORM',
    link: '/orm/',
  },
  {
    text: '资源',
    link: '/resources/',
  },
  {
    text: '博客',
    link: '/blog/',
  },
  {
    text: '贡献',
    link: '/contribution/',
  },
  {
    text: `旧版`,
    children: [
      {
        text: 'v1.x',
        link: 'https://go-doudou-v1.unionj.cloud/',
      },
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
  // {
  //   text: `En`,
  //   link: 'https://go-doudou.github.io',
  // },
]
