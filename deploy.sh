#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e
# 生成静态文件
npm run docs:build
# 进入生成的文件夹
cd src/.vuepress/dist
# 初始化 git
git init
# 设置提交者信息
git config user.name "artoriaschan"
git config user.email "544396118@qq.com"
# 提交
git add -A
git commit -m 'deploy'
# push 到 gh-pages 分支
git push --force --quiet "https://${{ secrets.BLOG_DEPLOY_TOKEN }}@github.com:artoriaschan/blog.git" "master:gh-pages"
cd -