import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/',
    component: ComponentCreator('/', '28a'),
    routes: [
      {
        path: '/',
        component: ComponentCreator('/', 'b73'),
        routes: [
          {
            path: '/',
            component: ComponentCreator('/', '122'),
            routes: [
              {
                path: '/amm',
                component: ComponentCreator('/amm', '09c'),
                exact: true,
                sidebar: "auricSidebar"
              },
              {
                path: '/auric',
                component: ComponentCreator('/auric', '382'),
                exact: true,
                sidebar: "auricSidebar"
              },
              {
                path: '/deployment',
                component: ComponentCreator('/deployment', '9fc'),
                exact: true,
                sidebar: "auricSidebar"
              },
              {
                path: '/vesting',
                component: ComponentCreator('/vesting', '4f1'),
                exact: true,
                sidebar: "auricSidebar"
              },
              {
                path: '/',
                component: ComponentCreator('/', '376'),
                exact: true,
                sidebar: "auricSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
