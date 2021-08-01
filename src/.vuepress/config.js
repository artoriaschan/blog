const path = require("path");
const head = require('./config/head.js');
const plugins = require('./config/plugins.js');
const themeConfig = require('./config/themeConfig.js');

module.exports = (options, context, api) => {
  return {
    base: "/",
    title: "拾光",
    description: "Web development, Frontend, JavaScript",
    theme: "vdoing",
    head,
    plugins,
    themeConfig,
    alias: {
      "@assets": path.resolve(__dirname, "../assets"),
      "@": path.resolve(__dirname, "../")
    },
    markdown: {
      externalLinks: { target: '_blank', rel: 'noopener noreferrer' },
      lineNumbers: true
    }
  };
};
