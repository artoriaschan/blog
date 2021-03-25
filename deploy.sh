#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e
# 进入生成的文件夹
cd src/.vuepress/dist
# 初始化 git
git init
# 设置提交者信息
git config user.name "artoriaschan"
git config user.email "544396118@qq.com"
# 提交
git add -A
git commit -m "GitHub Actions Auto Builder at $(date +'%Y-%m-%d %H:%M:%S')"

# push 到 gh-pages 分支
remote_repo="https://${GITHUB_ACTOR}:${BLOG_DEPLOY_TOKEN}@github.com/artoriaschan/blog.git"

git push --force --quiet "${remote_repo}" "master:gh-pages"
cd -