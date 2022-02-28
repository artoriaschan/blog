// nav
module.exports = [
  { text: '首页', link: '/' },
  {
    text: '前端',
    link: '/web/', //目录页链接，此处link是vdoing主题新增的配置项，有二级导航时，可以点击一级导航跳到目录页
    items: [
      // 说明：以下所有link的值只是在相应md文件定义的永久链接（不是什么特殊生成的编码）。另外，注意结尾是有斜杠的
      {
        text: '前端文章',
        items: [
          { text: '基础知识', link: '/pages/d533f9/' },
          { text: 'JavaScript', link: '/pages/6d91ad/' },
          { text: 'Vue', link: '/pages/c5fd6c/' },
          { text: 'React', link: '/pages/8da03e/' },
          { text: '杂谈', link: '/pages/28de07/' },
        ],
      },
      {
        text: '学习笔记',
        items: [
          { text: 'Vue 2 源码解析', link: '/note/vue2/' },
          { text: 'Vue 3 源码解析', link: '/note/vue3/' },
          { text: 'React 17 源码解析', link: '/note/react17/' },
          { text: 'Vite 源码解析', link: '/note/vite/' },
        ],
      },
    ],
  },
  {
    text: '页面',
    link: '/ui/',
    items: [
      { text: 'HTML', link: '/pages/8309a5b876fc95e3/' },
      { text: 'CSS', link: '/pages/0a83b083bdf257cb/' },
      { text: 'Stylus', link: '/pages/9f15c1a281d8bedb/' },
    ],
  },
  {
    text: '技术',
    link: '/technology/',
    items: [
      { text: '技术文档', link: '/pages/9a7ee40fc232253e/' },
      { text: 'GitHub技巧', link: '/pages/4c778760be26d8b3/' },
      { text: 'Nodejs', link: '/pages/117708e0af7f0bd9/' },
      { text: 'Interview', link: '/pages/33969f/' },
      {
        text: 'Rust',
        items: [
          { text: 'Rust 学习笔记', link: '/note/rust-notes/' },
        ],
      },
    ],
  },
  {
    text: '转载',
    link: '/reship/',
    items: [
      { text: '前端精读', link: '/pages/ed5303/' },
    ],
  },
  {
    text: '收藏',
    link: '/pages/beb6c0bd8a66cea6/',
  },
  {
    text: '索引',
    link: '/archives/',
    items: [
      { text: '分类', link: '/categories/' },
      { text: '标签', link: '/tags/' },
      { text: '归档', link: '/archives/' },
    ],
  },
]
