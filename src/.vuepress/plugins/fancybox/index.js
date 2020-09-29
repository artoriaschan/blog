const { path } = require("@vuepress/shared-utils");

module.exports = (options, ctx) => ({
  clientRootMixin: path.resolve(__dirname, "mixin.js")
});
