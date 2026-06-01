import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
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
