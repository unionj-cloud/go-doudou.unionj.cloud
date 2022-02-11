import type { NavbarConfig } from '@vuepress/theme-default'
import { version } from '../meta'

export const en: NavbarConfig = [
  {
    text: 'Guide',
    link: '/guide/',
  },
  // {
  //   text: "REST",
  //   link: "/rest/install.md",
  // },
  // {
  //   text: "RPC",
  //   link: "/rpc/install.md",
  // },
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
        text: 'Changelog',
        link: 'https://github.com/unionj-cloud/go-doudou/releases',
      },
    ],
  },
]
