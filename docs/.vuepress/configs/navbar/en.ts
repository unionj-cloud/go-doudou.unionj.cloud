import type { NavbarConfig } from '@vuepress/theme-default'
import { version } from '../meta'

export const en: NavbarConfig = [
  {
    text: 'Guide',
    link: '/guide/',
  },
  {
    text: 'Resources',
    link: '/resources/',
  },
  {
    text: 'Contribution',
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
]
