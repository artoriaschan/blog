---
title: Vue编译部分浏览器怪癖兼容
date: 2019-04-24
tags:
  - vue
author: ArtoriasChan
location: Beijing  
---

# Vue编译部分浏览器怪癖兼容

## new Function()的问题
代码如下：
```javascript
if (process.env.NODE_ENV !== 'production') {
  // detect possible CSP restriction
  try {
    new Function('return 1')
  } catch (e) {
    if (e.toString().match(/unsafe-eval|CSP/)) {
      warn(
        'It seems you are using the standalone build of Vue.js in an ' +
        'environment with Content Security Policy that prohibits unsafe-eval. ' +
        'The template compiler cannot work in this environment. Consider ' +
        'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
        'templates into render functions.'
      )
    }
  }
}
```

首先这段代码是在非生产环境下执行的，然后使用 `try catch` 语句块对 `new Function('return 1')`这句代码进行错误捕获，如果有错误发生且错误的内容中包含诸如 `'unsafe-eval'` 或者 `'CSP'` 这些字样的信息时就会给出一个警告。我们知道 `CSP` 全称是内容安全策略，如果你的策略比较严格，那么 `new Function()` 将会受到影响，从而不能够使用。但是将模板字符串编译成渲染函数又依赖 `new Function()`，所以解决方案有两个：

- 1、放宽你的CSP策略

- 2、预编译


总之这段代码的作用就是检测 `new Function()` 是否可用，并在某些情况下给你一个有用的提示。

## 带有捕获组的正则匹配替换，在未匹配的情况下，参数为''的问题
代码如下：
```javascript
let IS_REGEX_CAPTURING_BROKEN = false
'x'.replace(/x(.)?/g, function (m, g) {
  IS_REGEX_CAPTURING_BROKEN = g === ''
})
```

首先定义了变量 `IS_REGEX_CAPTURING_BROKEN` 且初始值为 `false`，接着使用一个字符串 `'x'` 的 `replace` 函数用一个带有捕获组的正则进行匹配，并将捕获组捕获到的值赋值给变量 `g`。<br />我们观察字符串 `'x'` 和正则 `/x(.)?/` 可以发现，该正则中的捕获组应该捕获不到任何内容，所以此时 `g` 的值应该是 `undefined`，但是在老版本的火狐浏览器中存在一个问题，此时的 `g` 是一个空字符串 `''`，并不是 `undefined`。<br />所以变量 `IS_REGEX_CAPTURING_BROKEN` 的作用就是用来标识当前宿主环境是否存在该问题。这个变量我们后面会用到，其作用到时候再说。

## pre,textarea忽略元素内容第一个换行符
代码如下：
```javascript
// #5992
const isIgnoreNewlineTag = makeMap('pre,textarea', true)
const shouldIgnoreFirstNewline = (tag, html) => tag && isIgnoreNewlineTag(tag) && html[0] === '\n'
```

定义了两个常量，其中 `isIgnoreNewlineTag` 是一个通过 `makeMap` 函数生成的函数，用来检测给定的标签是否是 `<pre>` 标签或者 `<textarea>` 标签。<br />这个函数被用在了 `shouldIgnoreFirstNewline` 函数里，`shouldIgnoreFirstNewline` 函数的作用是用来检测是否应该忽略元素内容的第一个换行符。<br />什么意思呢？大家注意这两段代码上方的注释：`// #5992`，感兴趣的同学可以去 `vue` 的 `issue` 中搜一下，大家就会发现，这两句代码的作用是用来解决一个问题，该问题是由于历史原因造成的，即一些元素会受到额外的限制，比如 `<pre>` 标签和 `<textarea>` 会忽略其内容的第一个换行符。
