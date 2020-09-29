const path = require("path");
module.exports = (options, context, api) => {
  return {
    base: "/blog/",
    title: "拾光",
    description: "Web development, Frontend, JavaScript",
    theme: "@vuepress/blog",
    plugins: [require('./plugins/fancybox')],
    head: [
      // add jquery and fancybox
      ['script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.slim.min.js' }],
      ['script', { src: 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.2/jquery.fancybox.min.js' }],
      ['link', { rel: 'stylesheet', type: 'text/css', href: 'https://cdnjs.cloudflare.com/ajax/libs/fancybox/3.5.2/jquery.fancybox.min.css' }]
    ],
    themeConfig: {
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
        {
          id: 'writing',
          dirname: '_writings',
          path: '/writings/',
          itemPermalink: '/writings/:year/:month/:day/:slug',
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
        // {
        //   text: "摄影",
        //   link: "/photos/"
        // },
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
            link: "dalecracker@gmail.com"
          }
        ],
        copyright: [
          {
            text: `Artorias Chan © ${new Date().getFullYear()}`,
            link: ""
          }
        ]
      },
      smoothScroll: true
    },
    alias: {
      "@assets": path.resolve(__dirname, "../assets"),
      "@": path.resolve(__dirname, "../")
    }
  };
};