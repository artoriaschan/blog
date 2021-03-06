const path = require("path");
module.exports = (options, context, api) => {
  return {
    base: "/blog/",
    title: "拾光",
    description: "Web development, Frontend, JavaScript",
    theme: "@vuepress/blog",
    plugins: [
      require('./plugins/fancybox'),
      '@vuepress/back-to-top',
      ["vuepress-plugin-mathjax", {}],
      [
        '@vuepress/google-analytics',
        {
          'ga': 'G-LRH2QC3YT9'
        }
      ],
      [
        'vuepress-plugin-container',
        {
          type: 'tip',
          defaultTitle: '提示',
        },
      ],
      [
        'vuepress-plugin-container',
        {
          type: 'warning',
          defaultTitle: '注意',
        },
      ],
      [
        'vuepress-plugin-container',
        {
          type: 'danger',
          defaultTitle: '警告',
        },
      ],
      [
        'vuepress-plugin-container',
        {
          type: 'details',
          defaultTitle: '详细信息',
        },
      ],
      [
        'vuepress-plugin-container',
        {
          type: 'details',
          before: info => {
            return `<details class="details-container"><summary>${info}</summary>`;
          },
          after: '</details>',
        },
      ],
    ],
    head: [
      ['link', { rel: 'shortcut icon', type: 'image/x-icon', href: './favicon.ico' }],
      // add jquery and fancybox
      ['script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.slim.min.js' }],
      ['script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.2/jquery.fancybox.min.js' }],
      ['link', { rel: 'stylesheet', type: 'text/css', href: 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.2/jquery.fancybox.min.css' }]
    ],
    themeConfig: {
      dateFormat: "YYYY/MM/DD",
      directories: [
        {
          id: "home",
          dirname: "_posts",
          path: "/",
          layout: "Home"
        },
        {
          id: "post",
          dirname: "_posts",
          path: "/posts/",
          itemPermalink: "/:year/:month/:day/:slug",
          pagination: {
            lengthPerPage: 5,
          },
        },
        // {
        //   id: 'writing',
        //   dirname: '_writings',
        //   path: '/writings/',
        //   itemPermalink: '/writings/:year/:month/:day/:slug',
        //   pagination: {
        //     lengthPerPage: 5,
        //   },
        // },
        {
          id: 'reship',
          dirname: '_reship',
          path: '/reship/',
          itemPermalink: '/reship/:year/:month/:day/:slug',
          pagination: {
            lengthPerPage: 5,
          },
        },
        {
          id: 'photo',
          dirname: '_photos',
          path: '/photos/',
          itemPermalink: '/photos/:year/:month/:day/:slug',
          pagination: {
            lengthPerPage: 5,
          },
        },
        {
          id: 'me',
          path: '/me/',
          dirname: "_me",
          itemPermalink: '/me/index',
        },
      ],
      nav: [
        {
          text: "编程",
          link: "/posts/"
        },
        // {
        //   text: "文集",
        //   link: "/writings/"
        // },
        {
          text: "转载",
          link: "/reship/"
        },
        {
          text: "摄影",
          link: "/photos/"
        },
        {
          text: '标签',
          link: '/tag/',
        },
        {
          text: '关于',
          link: '/me/index/',
        },
        {
          text: "Github",
          link: "https://github.com/artoriaschan"
        }
      ],
      footer: {
        contact: [
          {
            type: "github",
            link: "https://github.com/artoriaschan"
          },
          {
            type: "mail",
            link: "mailto:dalecracker@gmail.com"
          }
        ],
        copyright: [
          {
            text: `Artorias Chan © ${new Date().getFullYear()}`,
            link: "/"
          }
        ]
      },
      smoothScroll: true
    },
    alias: {
      "@assets": path.resolve(__dirname, "../assets"),
      "@": path.resolve(__dirname, "../")
    },
    markdown: {
      // config: md => {
      // },
      externalLinks: { target: '_blank', rel: 'noopener noreferrer' },
      lineNumbers: true
    }
  };
};