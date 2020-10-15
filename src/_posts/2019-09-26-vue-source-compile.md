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
createCompiler 方法实际上是通过调用 createCompilerCreator 方法返回的，该方法传入的参数是一个函数，真正的编译过程都在这个 baseCompile 函数里执行，那么 createCompilerCreator 又是什么呢，它的定义在 src/compiler/create-compiler.js 中：
```javascript
//src/compiler/create-compiler.js

export function createCompilerCreator (baseCompile: Function): Function {
  return function createCompiler (baseOptions: CompilerOptions) {
    function compile (
      template: string,
      options?: CompilerOptions
    ): CompiledResult {
      const finalOptions = Object.create(baseOptions)
      const errors = []
      const tips = []

      let warn = (msg, range, tip) => {
        (tip ? tips : errors).push(msg)
      }

      if (options) {
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          const leadingSpaceLength = template.match(/^\s*/)[0].length

          warn = (msg, range, tip) => {
            const data: WarningMessage = { msg }
            if (range) {
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength
              }
            }
            (tip ? tips : errors).push(data)
          }
        }
        // merge custom modules
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // merge custom directives
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          )
        }
        // copy other options
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key]
          }
        }
      }

      finalOptions.warn = warn

      const compiled = baseCompile(template.trim(), finalOptions)
      if (process.env.NODE_ENV !== 'production') {
        detectErrors(compiled.ast, warn)
      }
      compiled.errors = errors
      compiled.tips = tips
      return compiled
    }

    return {
      compile,
      compileToFunctions: createCompileToFunctionFn(compile)
    }
  }
}
```
可以看到该方法返回了一个 createCompiler 的函数，它接收一个 baseOptions 的参数，返回的是一个对象，包括 compile 方法属性和 compileToFunctions 属性，这个 compileToFunctions 对应的就是 $mount 函数调用的 compileToFunctions 方法，它是调用 createCompileToFunctionFn 方法的返回值。

我们接下来看一下 createCompileToFunctionFn 方法，它的定义在 src/compiler/to-function/js 中：
```javascript
export function createCompileToFunctionFn (compile: Function): Function {
  const cache = Object.create(null)

  return function compileToFunctions (
    template: string,
    options?: CompilerOptions,
    vm?: Component
  ): CompiledFunctionResult {
    options = extend({}, options)
    const warn = options.warn || baseWarn
    delete options.warn

    /* istanbul ignore if */
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

    // check cache
    const key = options.delimiters
      ? String(options.delimiters) + template
      : template
    if (cache[key]) {
      return cache[key]
    }

    // compile
    const compiled = compile(template, options)

    // check compilation errors/tips
    if (process.env.NODE_ENV !== 'production') {
      if (compiled.errors && compiled.errors.length) {
        if (options.outputSourceRange) {
          compiled.errors.forEach(e => {
            warn(
              `Error compiling template:\n\n${e.msg}\n\n` +
              generateCodeFrame(template, e.start, e.end),
              vm
            )
          })
        } else {
          warn(
            `Error compiling template:\n\n${template}\n\n` +
            compiled.errors.map(e => `- ${e}`).join('\n') + '\n',
            vm
          )
        }
      }
      if (compiled.tips && compiled.tips.length) {
        if (options.outputSourceRange) {
          compiled.tips.forEach(e => tip(e.msg, vm))
        } else {
          compiled.tips.forEach(msg => tip(msg, vm))
        }
      }
    }

    // turn code into functions
    const res = {}
    const fnGenErrors = []
    res.render = createFunction(compiled.render, fnGenErrors)
    res.staticRenderFns = compiled.staticRenderFns.map(code => {
      return createFunction(code, fnGenErrors)
    })

    // check function generation errors.
    // this should only happen if there is a bug in the compiler itself.
    // mostly for codegen development use
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production') {
      if ((!compiled.errors || !compiled.errors.length) && fnGenErrors.length) {
        warn(
          `Failed to generate render function:\n\n` +
          fnGenErrors.map(({ err, code }) => `${err.toString()} in\n\n${code}\n`).join('\n'),
          vm
        )
      }
    }

    return (cache[key] = res)
  }
}
```
至此我们总算找到了 compileToFunctions 的最终定义，它接收 3 个参数、编译模板 template，编译配置 options 和 Vue 实例 vm。核心的编译过程就一行代码：
```javascript
const compiled = compile(template, options)
```
compile 函数在执行 createCompileToFunctionFn 的时候作为参数传入，它是 createCompiler 函数中定义的 compile 函数，如下：
```javascript
function compile (
  template: string,
  options?: CompilerOptions
): CompiledResult {
  const finalOptions = Object.create(baseOptions)
  const errors = []
  const tips = []

  let warn = (msg, range, tip) => {
    (tip ? tips : errors).push(msg)
  }

  if (options) {
    if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
      // $flow-disable-line
      const leadingSpaceLength = template.match(/^\s*/)[0].length

      warn = (msg, range, tip) => {
        const data: WarningMessage = { msg }
        if (range) {
          if (range.start != null) {
            data.start = range.start + leadingSpaceLength
          }
          if (range.end != null) {
            data.end = range.end + leadingSpaceLength
          }
        }
        (tip ? tips : errors).push(data)
      }
    }
    // merge custom modules
    if (options.modules) {
      finalOptions.modules =
        (baseOptions.modules || []).concat(options.modules)
    }
    // merge custom directives
    if (options.directives) {
      finalOptions.directives = extend(
        Object.create(baseOptions.directives || null),
        options.directives
      )
    }
    // copy other options
    for (const key in options) {
      if (key !== 'modules' && key !== 'directives') {
        finalOptions[key] = options[key]
      }
    }
  }

  finalOptions.warn = warn

  const compiled = baseCompile(template.trim(), finalOptions)
  if (process.env.NODE_ENV !== 'production') {
    detectErrors(compiled.ast, warn)
  }
  compiled.errors = errors
  compiled.tips = tips
  return compiled
}
```
compile 函数执行的逻辑是先处理配置参数，真正执行编译过程就一行代码：
```javascript
const compiled = baseCompile(template, finalOptions)
```
baseCompile 在执行 createCompilerCreator 方法时作为参数传入，如下：
```javascript
function baseCompile (
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
}
```
所以编译的入口我们终于找到了，它主要就是执行了如下几个逻辑：
* 解析模板字符串生成 AST
```javascript
const ast = parse(template.trim(), options)
```
* 优化语法树
```javascript
if (options.optimize !== false) {
  optimize(ast, options)
}
```
* 生成代码
```javascript
const code = generate(ast, options)
```
### 总结
![create-compiler](~@/assets/vue-source-compile/create-compiler.png)

编译入口逻辑之所以这么绕，是因为 Vue.js 在不同的平台下都会有编译的过程，因此编译过程中的依赖的配置 baseOptions 会有所不同。而编译过程会多次执行，但这同一个平台下每一次的编译过程配置又是相同的，为了不让这些配置在每次编译过程都通过参数传入，Vue.js 利用了函数柯里化的技巧很好的实现了 baseOptions 的参数保留。同样，Vue.js 也是利用函数柯里化技巧把基础的编译过程函数抽出来，通过 createCompilerCreator(baseCompile) 的方式把真正编译的过程和其它逻辑如对编译配置处理、缓存处理等剥离开，这样的设计还是非常巧妙的。

## 解析模板 parse
模板解析的基本核心逻辑则是使用大量正则表达式对字符串解析，从而生成 AST，它是一种抽象语法树，是对源代码的抽象语法结构的树状表现形式。
为了方便我们进行推理parse的过程，我们从例子入手，来深入的梳理编译过程：
```html
<ul :class="bindCls" class="list" v-if="isShow">
    <li v-for="(item,index) in data" @click="clickItem(index)">{{item}}:{{index}}</li>
</ul>
```
经过parse过程后，生成的AST如下：
```json
{
  "type": 1,
  "tag": "ul",
  "attrsList": [],
  "attrsMap": {
    ":class": "bindCls",
    "class": "list",
    "v-if": "isShow"
  },
  "classBinding": "bindCls",
  "if": "isShow",
  "ifConditions": [{
    "exp": "isShow",
    "block": // ul ast element
  }],
  "parent": undefined,
  "rawAttrsMap": {
    ":class": {
      "name": ":class",
      "value": "bindCls",
      "start": 4,
      "end": 20
    },
    "class": {
      "name": "class",
      "value": "list",
      "start": 21,
      "end": 33
    },
    "v-if": {
      "name": "v-if",
      "value": "",
      "start": 34,
      "end": 41
    }
  },
  "children": [
    {
      "type": 1,
      "tag": "li",
      "attrsList": [
        {
          "name": "@click",
          "value": "clickItem(index)",
          "start": 78,
          "end": 103
        }
      ],
      "attrsMap": {
        "v-for": "(item,index) in data",
        "@click": "clickItem(index)"
      },
      "rawAttrsMap": {
        "v-for": {
          "name": "v-for",
          "value": "(item,index) in data",
          "start": 49,
          "end": 77
        },
        "@click": {
          "name": "@click",
          "value": "clickItem(index)",
          "start": 78,
          "end": 103
        }
      },
      "parent": "[Circular ~]",
      "children": [
        {
          "type": 2,
          "expression": "_s(item)+\":\"+_s(index)",
          "tokens": [
            {
              "@binding": "item"
            },
            ":",
            {
              "@binding": "index"
            }
          ],
          "text": "{{item}}:{{index}}",
          "start": 104,
          "end": 122,
          "static": false
        }
      ],
      "start": 45,
      "end": 127,
      "for": "data",
      "alias": "item",
      "iterator1": "index",
      "plain": false,
      "hasBindings": true,
      "events": {
        "click": {
          "value": "clickItem(index)",
          "dynamic": false,
          "start": 78,
          "end": 103
        }
      },
      "static": false,
      "staticRoot": false,
      "forProcessed": true
    }
  ],
  "start": 0,
  "end": 135,
  "plain": false,
  "staticClass": "\"list\"",
  "static": false,
  "staticRoot": false
}
```
可以看到，生成的 AST 是一个树状结构，每一个节点都是一个 ast element，除了它自身的一些属性，还维护了它的父子关系，如 parent 指向它的父节点，children 指向它的所有子节点。
### 解析全流程
首先来看一下 parse 的定义，在 src/compiler/parser/index.js 中：
```javascript
/**
 * Convert HTML string to AST.
 */
export function parse (
  template: string,
  options: CompilerOptions
): ASTElement | void {
  warn = options.warn || baseWarn

  platformIsPreTag = options.isPreTag || no
  platformMustUseProp = options.mustUseProp || no
  platformGetTagNamespace = options.getTagNamespace || no
  const isReservedTag = options.isReservedTag || no
  maybeComponent = (el: ASTElement) => !!el.component || !isReservedTag(el.tag)

  transforms = pluckModuleFunction(options.modules, 'transformNode')
  preTransforms = pluckModuleFunction(options.modules, 'preTransformNode')
  postTransforms = pluckModuleFunction(options.modules, 'postTransformNode')

  delimiters = options.delimiters

  const stack = []
  const preserveWhitespace = options.preserveWhitespace !== false
  const whitespaceOption = options.whitespace
  let root
  let currentParent
  let inVPre = false
  let inPre = false
  let warned = false

  function warnOnce (msg, range) {
    if (!warned) {
      warned = true
      warn(msg, range)
    }
  }

  function closeElement (element) {
    trimEndingWhitespace(element)
    if (!inVPre && !element.processed) {
      element = processElement(element, options)
    }
    // tree management
    if (!stack.length && element !== root) {
      // allow root elements with v-if, v-else-if and v-else
      if (root.if && (element.elseif || element.else)) {
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(element)
        }
        addIfCondition(root, {
          exp: element.elseif,
          block: element
        })
      } else if (process.env.NODE_ENV !== 'production') {
        warnOnce(
          `Component template should contain exactly one root element. ` +
          `If you are using v-if on multiple elements, ` +
          `use v-else-if to chain them instead.`,
          { start: element.start }
        )
      }
    }
    if (currentParent && !element.forbidden) {
      if (element.elseif || element.else) {
        processIfConditions(element, currentParent)
      } else {
        if (element.slotScope) {
          // scoped slot
          // keep it in the children list so that v-else(-if) conditions can
          // find it as the prev node.
          const name = element.slotTarget || '"default"'
          ;(currentParent.scopedSlots || (currentParent.scopedSlots = {}))[name] = element
        }
        currentParent.children.push(element)
        element.parent = currentParent
      }
    }

    // final children cleanup
    // filter out scoped slots
    element.children = element.children.filter(c => !(c: any).slotScope)
    // remove trailing whitespace node again
    trimEndingWhitespace(element)

    // check pre state
    if (element.pre) {
      inVPre = false
    }
    if (platformIsPreTag(element.tag)) {
      inPre = false
    }
    // apply post-transforms
    for (let i = 0; i < postTransforms.length; i++) {
      postTransforms[i](element, options)
    }
  }

  function trimEndingWhitespace (el) {
    // remove trailing whitespace node
    if (!inPre) {
      let lastNode
      while (
        (lastNode = el.children[el.children.length - 1]) &&
        lastNode.type === 3 &&
        lastNode.text === ' '
      ) {
        el.children.pop()
      }
    }
  }

  function checkRootConstraints (el) {
    if (el.tag === 'slot' || el.tag === 'template') {
      warnOnce(
        `Cannot use <${el.tag}> as component root element because it may ` +
        'contain multiple nodes.',
        { start: el.start }
      )
    }
    if (el.attrsMap.hasOwnProperty('v-for')) {
      warnOnce(
        'Cannot use v-for on stateful component root element because ' +
        'it renders multiple elements.',
        el.rawAttrsMap['v-for']
      )
    }
  }

  parseHTML(template, {
    warn,
    expectHTML: options.expectHTML,
    isUnaryTag: options.isUnaryTag,
    canBeLeftOpenTag: options.canBeLeftOpenTag,
    shouldDecodeNewlines: options.shouldDecodeNewlines,
    shouldDecodeNewlinesForHref: options.shouldDecodeNewlinesForHref,
    shouldKeepComment: options.comments,
    outputSourceRange: options.outputSourceRange,
    start (tag, attrs, unary, start, end) {
      // check namespace.
      // inherit parent ns if there is one
      const ns = (currentParent && currentParent.ns) || platformGetTagNamespace(tag)

      // handle IE svg bug
      /* istanbul ignore if */
      if (isIE && ns === 'svg') {
        attrs = guardIESVGBug(attrs)
      }

      let element: ASTElement = createASTElement(tag, attrs, currentParent)
      if (ns) {
        element.ns = ns
      }

      if (process.env.NODE_ENV !== 'production') {
        if (options.outputSourceRange) {
          element.start = start
          element.end = end
          element.rawAttrsMap = element.attrsList.reduce((cumulated, attr) => {
            cumulated[attr.name] = attr
            return cumulated
          }, {})
        }
        attrs.forEach(attr => {
          if (invalidAttributeRE.test(attr.name)) {
            warn(
              `Invalid dynamic argument expression: attribute names cannot contain ` +
              `spaces, quotes, <, >, / or =.`,
              {
                start: attr.start + attr.name.indexOf(`[`),
                end: attr.start + attr.name.length
              }
            )
          }
        })
      }

      if (isForbiddenTag(element) && !isServerRendering()) {
        element.forbidden = true
        process.env.NODE_ENV !== 'production' && warn(
          'Templates should only be responsible for mapping the state to the ' +
          'UI. Avoid placing tags with side-effects in your templates, such as ' +
          `<${tag}>` + ', as they will not be parsed.',
          { start: element.start }
        )
      }

      // apply pre-transforms
      for (let i = 0; i < preTransforms.length; i++) {
        element = preTransforms[i](element, options) || element
      }

      if (!inVPre) {
        processPre(element)
        if (element.pre) {
          inVPre = true
        }
      }
      if (platformIsPreTag(element.tag)) {
        inPre = true
      }
      if (inVPre) {
        processRawAttrs(element)
      } else if (!element.processed) {
        // structural directives
        processFor(element)
        processIf(element)
        processOnce(element)
      }

      if (!root) {
        root = element
        if (process.env.NODE_ENV !== 'production') {
          checkRootConstraints(root)
        }
      }

      if (!unary) {
        currentParent = element
        stack.push(element)
      } else {
        closeElement(element)
      }
    },

    end (tag, start, end) {
      const element = stack[stack.length - 1]
      // pop stack
      stack.length -= 1
      currentParent = stack[stack.length - 1]
      if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
        element.end = end
      }
      closeElement(element)
    },

    chars (text: string, start: number, end: number) {
      if (!currentParent) {
        if (process.env.NODE_ENV !== 'production') {
          if (text === template) {
            warnOnce(
              'Component template requires a root element, rather than just text.',
              { start }
            )
          } else if ((text = text.trim())) {
            warnOnce(
              `text "${text}" outside root element will be ignored.`,
              { start }
            )
          }
        }
        return
      }
      // IE textarea placeholder bug
      /* istanbul ignore if */
      if (isIE &&
        currentParent.tag === 'textarea' &&
        currentParent.attrsMap.placeholder === text
      ) {
        return
      }
      const children = currentParent.children
      if (inPre || text.trim()) {
        text = isTextTag(currentParent) ? text : decodeHTMLCached(text)
      } else if (!children.length) {
        // remove the whitespace-only node right after an opening tag
        text = ''
      } else if (whitespaceOption) {
        if (whitespaceOption === 'condense') {
          // in condense mode, remove the whitespace node if it contains
          // line break, otherwise condense to a single space
          text = lineBreakRE.test(text) ? '' : ' '
        } else {
          text = ' '
        }
      } else {
        text = preserveWhitespace ? ' ' : ''
      }
      if (text) {
        if (!inPre && whitespaceOption === 'condense') {
          // condense consecutive whitespaces into single space
          text = text.replace(whitespaceRE, ' ')
        }
        let res
        let child: ?ASTNode
        if (!inVPre && text !== ' ' && (res = parseText(text, delimiters))) {
          child = {
            type: 2,
            expression: res.expression,
            tokens: res.tokens,
            text
          }
        } else if (text !== ' ' || !children.length || children[children.length - 1].text !== ' ') {
          child = {
            type: 3,
            text
          }
        }
        if (child) {
          if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
            child.start = start
            child.end = end
          }
          children.push(child)
        }
      }
    },
    comment (text: string, start, end) {
      // adding anyting as a sibling to the root node is forbidden
      // comments should still be allowed, but ignored
      if (currentParent) {
        const child: ASTText = {
          type: 3,
          text,
          isComment: true
        }
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          child.start = start
          child.end = end
        }
        currentParent.children.push(child)
      }
    }
  })
  return root
}
```
## 优化ast optimize
## 生成代码 codegen
## 总结