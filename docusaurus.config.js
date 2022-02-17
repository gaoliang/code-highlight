// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: '代码高亮',
  tagline: 'Code Highlight - Make every line of code shine.',
  url: 'https://www.gaoliang.me',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'gaoliang', // Usually your GitHub org/user name.
  projectName: 'code-highlight', // Usually your repo name.
  stylesheets: ["https://cdn.staticfile.org/font-awesome/5.15.4/css/all.min.css"],
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/gaoliang/code-highlight/edit/main/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/gaoliang/code-highlight/edit/main/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      metadata: [{name: 'keywords', content: '代码高亮,blog,wiki,opensource,tech'}],
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: false,
        switchConfig: {
          darkIcon: '🌙',
          lightIcon: '☀️',
        },
      },
      navbar: {
        title: '代码高亮',
        logo: {
          alt: 'Site Logo',
          src: 'img/avatar-circle-min.png',
        },
        items: [
          {
            to: '/', 
            label: '首页', 
            position: 'right',
            activeBaseRegex: '/$',
          },
          {
            type: 'doc',
            docId: 'intro',
            position: 'right',
            label: '知识库',
          },
          {to: '/blog', label: 'Blog', position: 'right'},
          {to: '/sideprojects', label: 'Side Projects', position: 'right'},
          {to: '/about', label: 'About', position: 'right'},
          {
            href: 'https://github.com/gaoliang/code-highlight',
            className: 'fab fa-github header-github-link',
            position: 'right',
          },
        ],
      },
      footer: {
        // style: 'dark',
        copyright: `
        <div class="custom_footer">
          <div class="custom_copyright">
            <div>Copyright © 2016 - ${new Date().getFullYear()} Gao Liang.</div>
            Made with Docusaurus.
          </div>
          <div class="custom_social_links">
            <a class="custom_social_link" href="https://github.com/gaoliang" target="_blank"><i class="fab fa-github"></i></a>
            <a class="custom_social_link" href="https://twitter.com/im_sorghum" target="_blank" ><i class="fab fa-twitter"></i></a>
            <a class="custom_social_link" href="https://www.linkedin.com/in/gaoliangim/" target="_blank"><i class="fab fa-linkedin"></i></a>
            <a class="custom_social_link" href="https://hub.docker.com/u/gaoliang" target="_blank"><i class="fab fa-docker"></i></a>
            <a class="custom_social_link" href="https://steamcommunity.com/id/gaoliangim/" target="_blank"><i class="fab fa-steam"></i></a>
            <a class="custom_social_link" href="mailto:gaoliangim@gmail.com" target="_blank"><i class="fas fa-envelope"></i></a>
          </div>
        </div>
        `,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['ini', 'java'],
      },
    }),
};

module.exports = config;
