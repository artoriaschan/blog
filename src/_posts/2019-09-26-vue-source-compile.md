---
title: Vue 2.x 源码解读(四):编译
date: 2019-09-26
tags:
  - vue
author: ArtoriasChan
location: Beijing  
---
## 前言
之前我们分析过模板到真实 DOM 渲染的过程，中间有一个环节是把模板编译成 render 函数，这个过程我们把它称作编译。

虽然我们可以直接为组件编写 render 函数，但是编写 template 模板更加直观，也更符合我们的开发习惯。

Vue.js 提供了 2 个版本，一个是 Runtime + Compiler 的，一个是 Runtime only 的，前者是包含编译代码的，可以把编译过程放在运行时做，后者是不包含编译代码的，需要借助 webpack 的 vue-loader 事先把模板编译成 render函数。一般我们生产环境中使用的则是 Runtime 版本，这样 Vue 项目的打包体积也是会相应的小些。

### 编译的入口在哪
当我们使用 Runtime + Compiler 的 Vue.js 解析源码时，曾经讲到 `Vue.prototype.$mount` 中，有过这样一段代码：
```javascript
// src/platforms/web/entry-runtime-with-compiler.js -> Vue.prototype.$mount Method

const { render, staticRenderFns } = compileToFunctions(template, {
  outputSourceRange: process.env.NODE_ENV !== 'production',
  shouldDecodeNewlines,
  shouldDecodeNewlinesForHref,
  delimiters: options.delimiters,
  comments: options.comments
}, this)
options.render = render
options.staticRenderFns = staticRenderFns
```
这段函数逻辑就是编译的入口。

compileToFunctions 方法就是把模板 template 编译生成 render 以及 staticRenderFns，它的定义在 src/platforms/web/compiler/index.js 中：
```javascript
import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
```
可以看到 compileToFunctions 方法实际上是 createCompiler 方法的返回值，该方法接收一个编译配置参数，接下来我们来看一下 createCompiler 方法的定义，在 src/compiler/index.js 中：
```javascript
// src/compiler/index.js

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    optimize(ast, options)
  }
  const code = generate(ast, options)
  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
})
```