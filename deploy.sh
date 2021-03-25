#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
npm run docs:build

# 进入生成的文件夹
cd src/.vuepress/dist
git init
# 设置提交者信息
git config user.name "artoriaschan"
git config user.email "544396118@qq.com"
# 提交
git add -A
git commit -m '[vuepress] deploy blog'

# 如果发布到 https://<USERNAME>.github.io/<REPO>
git push --force "https://${BLOG_DEPLOY}@github.com/wuxianqiang/vuepress-starter.git" "master:gh-pages"
cd -