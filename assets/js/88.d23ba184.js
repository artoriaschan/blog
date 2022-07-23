(window.webpackJsonp=window.webpackJsonp||[]).push([[88],{656:function(t,s,a){"use strict";a.r(s);var e=a(22),n=Object(e.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h2",{attrs:{id:"_1-引言"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_1-引言"}},[t._v("#")]),t._v(" 1 引言")]),t._v(" "),a("p",[t._v("本周精读的仓库是 "),a("a",{attrs:{href:"https://github.com/mweststrate/immer",target:"_blank",rel:"noopener noreferrer"}},[t._v("immer"),a("OutboundLink")],1),t._v("。")]),t._v(" "),a("p",[t._v("Immer 是最近火起来的一个项目，由 "),a("a",{attrs:{href:"https://github.com/mobxjs/mobx",target:"_blank",rel:"noopener noreferrer"}},[t._v("Mobx"),a("OutboundLink")],1),t._v(" 作者 "),a("a",{attrs:{href:"https://github.com/mweststrate",target:"_blank",rel:"noopener noreferrer"}},[t._v("Mweststrate"),a("OutboundLink")],1),t._v(" 研发。")]),t._v(" "),a("p",[t._v("了解 mobx 的同学可能会发现，Immer 就是更底层的 Mobx，它将 Mobx 特性发扬光大，得以结合到任何数据流框架，使用起来非常优雅。")]),t._v(" "),a("h2",{attrs:{id:"_2-概述"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_2-概述"}},[t._v("#")]),t._v(" 2 概述")]),t._v(" "),a("h3",{attrs:{id:"麻烦的-immutable"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#麻烦的-immutable"}},[t._v("#")]),t._v(" 麻烦的 Immutable")]),t._v(" "),a("p",[t._v("Immer 想解决的问题，是利用元编程简化 Immutable 使用的复杂度。举个例子，我们写一个纯函数：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function-variable function"}},[t._v("addProducts")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" products "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" cloneProducts "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" products"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("slice")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n  cloneProducts"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("push")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" text"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"shoes"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" cloneProducts\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br")])]),a("p",[t._v("虽然代码并不复杂，但写起来内心仍隐隐作痛。我们必须将 "),a("code",[t._v("products")]),t._v(" 拷贝一份，再调用 "),a("code",[t._v("push")]),t._v(" 函数修改新的 "),a("code",[t._v("cloneProducts")]),t._v("，再返回它。")]),t._v(" "),a("p",[t._v("如果 js 原生支持 Immutable，就可以直接使用 "),a("code",[t._v("push")]),t._v(" 了！对，Immer 让 js 现在就支持：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" addProducts "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("produce")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("products "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  products"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("push")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" text"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"shoes"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br")])]),a("p",[t._v("很有趣吧，这两个 "),a("code",[t._v("addProducts")]),t._v(" 函数功能一模一样，而且都是纯函数。")]),t._v(" "),a("h3",{attrs:{id:"别扭的-setstate"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#别扭的-setstate"}},[t._v("#")]),t._v(" 别扭的 setState")]),t._v(" "),a("p",[t._v("我们都知道，react 框架中，"),a("code",[t._v("setState")]),t._v(" 支持函数式写法：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setState")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("state "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("...")]),t._v("state"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  isShow"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br")])]),a("p",[t._v("配合解构语法，写起来仍是如此优雅。那数据稍微复杂些呢？我们就要默默忍受 “糟糕的 Immutable” 了：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setState")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("state "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" cloneProducts "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("products"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("slice")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n  cloneProducts"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("push")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" text"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"shoes"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n  "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("...")]),t._v("state"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n    cloneProducts\n  "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br")])]),a("p",[a("strong",[t._v("然而有了 Immer，一切都不一样了：")])]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setState")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("produce")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("state "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("state"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("isShow "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setState")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("produce")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("state "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" state"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("products"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("push")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" text"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token string"}},[t._v('"shoes"')]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br")])]),a("h3",{attrs:{id:"方便的柯里化"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#方便的柯里化"}},[t._v("#")]),t._v(" 方便的柯里化")]),t._v(" "),a("p",[t._v("上面讲述了 Immer 支持柯里化带来的好处。所以我们也可以直接把两个参数一次性消费：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" oldObj "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" value"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("1")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("const")]),t._v(" newObj "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("produce")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("oldObj"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" draft "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("draft"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("value "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("2")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br")])]),a("p",[t._v("这就是 Immer：Create the next immutable state by mutating the current one.")]),t._v(" "),a("h2",{attrs:{id:"_3-精读"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_3-精读"}},[t._v("#")]),t._v(" 3 精读")]),t._v(" "),a("p",[t._v("虽然笔者之前在这方面已经有所研究，比如做出了 Mutable 转 Immutable 的库："),a("a",{attrs:{href:"https://github.com/dobjs/dob-redux",target:"_blank",rel:"noopener noreferrer"}},[t._v("dob-redux"),a("OutboundLink")],1),t._v("，但 Immer 实在是太惊艳了，Immer 是更底层的拼图，它可以插入到任何数据流框架作为功能增强，不得不赞叹 Mweststrate 真的是非常高瞻远瞩。")]),t._v(" "),a("p",[t._v("所以笔者认真阅读了它的源代码，带大家从原理角度认识 Immer。")]),t._v(" "),a("p",[t._v("Immer 是一个支持柯里化，"),a("strong",[t._v("仅支持同步计算的工具")]),t._v("，所以非常适合作为 redux 的 reducer 使用。")]),t._v(" "),a("blockquote",[a("p",[t._v("Immer 也支持直接 return value，这个功能比较简单，所以本篇会跳过所有对 return value 的处理。PS: mutable 与 return 不能同时返回不同对象，否则弄不清楚到哪种修改是有效的。")])]),t._v(" "),a("p",[t._v("柯里化这里不做拓展介绍，详情查看 "),a("a",{attrs:{href:"https://github.com/dominictarr/curry",target:"_blank",rel:"noopener noreferrer"}},[t._v("curry"),a("OutboundLink")],1),t._v("。我们看 "),a("code",[t._v("produce")]),t._v(" 函数 callback 部分：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token function"}},[t._v("produce")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("obj"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" draft "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=>")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  draft"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("count"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("++")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br")])]),a("p",[a("code",[t._v("obj")]),t._v(" 是个普通对象，那黑魔法一定出现在 "),a("code",[t._v("draft")]),t._v(" 对象上，Immer 给 "),a("code",[t._v("draft")]),t._v(" 对象的所有属性做了监听。")]),t._v(" "),a("p",[a("strong",[t._v("所以整体思路就有了："),a("code",[t._v("draft")]),t._v(" 是 "),a("code",[t._v("obj")]),t._v(" 的代理，对 "),a("code",[t._v("draft")]),t._v(" mutable 的修改都会流入到自定义 "),a("code",[t._v("setter")]),t._v(" 函数，它并不修改原始对象的值，而是递归父级不断浅拷贝，最终返回新的顶层对象，作为 "),a("code",[t._v("produce")]),t._v(" 函数的返回值。")])]),t._v(" "),a("h3",{attrs:{id:"生成代理"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#生成代理"}},[t._v("#")]),t._v(" 生成代理")]),t._v(" "),a("p",[t._v("第一步，也就是将 "),a("code",[t._v("obj")]),t._v(" 转为 "),a("code",[t._v("draft")]),t._v(" 这一步，为了提高 Immutable 运行效率，我们需要一些额外信息，因此将 "),a("code",[t._v("obj")]),t._v(" 封装成一个包含额外信息的代理对象：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  modified"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 是否被修改过")]),t._v("\n  finalized"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 是否已经完成（所有 setter 执行完，并且已经生成了 copy）")]),t._v("\n  parent"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 父级对象")]),t._v("\n  base"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 原始对象（也就是 obj）")]),t._v("\n  copy"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// base（也就是 obj）的浅拷贝，使用 Object.assign(Object.create(null), obj) 实现")]),t._v("\n  proxies"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 存储每个 propertyKey 的代理对象，采用懒初始化策略")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br")])]),a("p",[t._v("在这个代理对象上，绑定了自定义的 "),a("code",[t._v("getter")]),t._v(" "),a("code",[t._v("setter")]),t._v("，然后直接将其扔给 "),a("code",[t._v("produce")]),t._v(" 执行。")]),t._v(" "),a("h3",{attrs:{id:"getter"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#getter"}},[t._v("#")]),t._v(" getter")]),t._v(" "),a("p",[a("code",[t._v("produce")]),t._v(" 回调函数中包含了用户的 "),a("code",[t._v("mutable")]),t._v(" 代码。所以现在入口变成了 "),a("code",[t._v("getter")]),t._v(" 与 "),a("code",[t._v("setter")]),t._v("。")]),t._v(" "),a("p",[a("code",[t._v("getter")]),t._v(" 主要用来懒初始化代理对象，也就是当代理对象子属性被访问的时候，才会生成其代理对象。")]),t._v(" "),a("p",[t._v("这么说比较抽象，举个例子，下面是原始 obj：")]),t._v(" "),a("div",{staticClass:"language-typescript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-typescript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n  a"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  b"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v("\n  c"),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v(":")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br")])]),a("p",[t._v("那么初始情况下，"),a("code",[t._v("draft")]),t._v(" 是 "),a("code",[t._v("obj")]),t._v(" 的代理，所以访问 "),a("code",[t._v("draft.a")]),t._v(" "),a("code",[t._v("draft.b")]),t._v(" "),a("code",[t._v("draft.c")]),t._v(" 时，都能触发 "),a("code",[t._v("getter")]),t._v(" "),a("code",[t._v("setter")]),t._v("，进入自定义处理逻辑。可是对 "),a("code",[t._v("draft.a.x")]),t._v(" 就无法监听了，因为代理只能监听一层。")]),t._v(" "),a("p",[t._v("代理懒初始化就是要解决这个问题，当访问到 "),a("code",[t._v("draft.a")]),t._v(" 时，自定义 "),a("code",[t._v("getter")]),t._v(" 已经悄悄生成了新的针对 "),a("code",[t._v("draft.a")]),t._v(" 对象的代理 "),a("code",[t._v("draftA")]),t._v("，因此 "),a("code",[t._v("draft.a.x")]),t._v(" 相当于访问了 "),a("code",[t._v("draftA.x")]),t._v("，所以能递归监听一个对象的所有属性。")]),t._v(" "),a("p",[t._v("同时，如果代码中只访问了 "),a("code",[t._v("draft.a")]),t._v("，那么只会在内存生成 "),a("code",[t._v("draftA")]),t._v(" 代理，"),a("code",[t._v("b")]),t._v(" "),a("code",[t._v("c")]),t._v(" 属性因为没有访问，因此不需要浪费资源生成代理 "),a("code",[t._v("draftB")]),t._v(" "),a("code",[t._v("draftC")]),t._v("。")]),t._v(" "),a("p",[t._v("当然 Immer 做了一些性能优化，以及在对象被修改过（"),a("code",[t._v("modified")]),t._v("）获取其 "),a("code",[t._v("copy")]),t._v(" 对象，为了保证 "),a("code",[t._v("base")]),t._v(" 是不可变的，这里不做展开。")]),t._v(" "),a("h3",{attrs:{id:"setter"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#setter"}},[t._v("#")]),t._v(" setter")]),t._v(" "),a("p",[t._v("当对 "),a("code",[t._v("draft")]),t._v(" 修改时，会对 "),a("code",[t._v("base")]),t._v(" 也就是原始值进行浅拷贝，保存到 "),a("code",[t._v("copy")]),t._v(" 属性，同时将 "),a("code",[t._v("modified")]),t._v(" 属性设置为 "),a("code",[t._v("true")]),t._v("。这样就完成了最重要的 Immutable 过程，而且浅拷贝并不是很消耗性能，加上是按需浅拷贝，因此 Immer 的性能还可以。")]),t._v(" "),a("p",[a("strong",[t._v("同时为了保证整条链路的对象都是新对象，会根据 "),a("code",[t._v("parent")]),t._v(" 属性递归父级，不断浅拷贝，直到这个叶子结点到根结点整条链路对象都换新为止。")])]),t._v(" "),a("p",[t._v("完成了 "),a("code",[t._v("modified")]),t._v(" 对象再有属性被修改时，会将这个新值保存在 "),a("code",[t._v("copy")]),t._v(" 对象上。")]),t._v(" "),a("h3",{attrs:{id:"生成-immutable-对象"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#生成-immutable-对象"}},[t._v("#")]),t._v(" 生成 Immutable 对象")]),t._v(" "),a("p",[t._v("当执行完 "),a("code",[t._v("produce")]),t._v(" 后，用户的所有修改已经完成（所以 Immer 没有支持异步），如果 "),a("code",[t._v("modified")]),t._v(" 属性为 "),a("code",[t._v("false")]),t._v("，说明用户根本没有改这个对象，那直接返回原始 "),a("code",[t._v("base")]),t._v(" 属性即可。")]),t._v(" "),a("p",[t._v("如果 "),a("code",[t._v("modified")]),t._v(" 属性为 "),a("code",[t._v("true")]),t._v("，说明对象发生了修改，返回 "),a("code",[t._v("copy")]),t._v(" 属性即可。但是 "),a("code",[t._v("setter")]),t._v(" 过程是递归的，"),a("code",[t._v("draft")]),t._v(" 的子对象也是 "),a("code",[t._v("draft")]),t._v("（包含了 "),a("code",[t._v("base")]),t._v(" "),a("code",[t._v("copy")]),t._v(" "),a("code",[t._v("modified")]),t._v(" 等额外属性的代理），我们必须一层层递归，拿到真正的值。")]),t._v(" "),a("p",[t._v("所以在这个阶段，所有 "),a("code",[t._v("draft")]),t._v(" 的 "),a("code",[t._v("finalized")]),t._v(" 都是 "),a("code",[t._v("false")]),t._v("，"),a("code",[t._v("copy")]),t._v(" 内部可能还存在大量 "),a("code",[t._v("draft")]),t._v(" 属性，因此递归 "),a("code",[t._v("base")]),t._v(" 与 "),a("code",[t._v("copy")]),t._v(" 的子属性，如果相同，就直接返回；如果不同，递归一次整个过程（从这小节第一行开始）。")]),t._v(" "),a("p",[t._v("最后返回的对象是由 "),a("code",[t._v("base")]),t._v(" 的一些属性（没有修改的部分）和 "),a("code",[t._v("copy")]),t._v(" 的一些属性（修改的部分）最终拼接而成的。最后使用 "),a("code",[t._v("freeze")]),t._v(" 冻结 "),a("code",[t._v("copy")]),t._v(" 属性，将 "),a("code",[t._v("finalized")]),t._v(" 属性设置为 "),a("code",[t._v("true")]),t._v("。")]),t._v(" "),a("p",[t._v("至此，返回值生成完毕，我们将最终值保存在 "),a("code",[t._v("copy")]),t._v(" 属性上，并将其冻结，返回了 Immutable 的值。")]),t._v(" "),a("p",[t._v("Immer 因此完成了不可思议的操作：Create the next immutable state by mutating the current one。")]),t._v(" "),a("blockquote",[a("p",[t._v("源码读到这里，发现 Immer 其实可以支持异步，只要支持 produce 函数返回 Promise 即可。最大的问题是，最后对代理的 "),a("code",[t._v("revoke")]),t._v(" 清洗，需要借助全局变量，这一点阻碍了 Immer 对异步的支持。")])]),t._v(" "),a("h2",{attrs:{id:"_4-总结"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#_4-总结"}},[t._v("#")]),t._v(" 4 总结")]),t._v(" "),a("p",[t._v("读到这，如果觉得不过瘾，可以看看 "),a("a",{attrs:{href:"https://github.com/anish000kumar/redux-box",target:"_blank",rel:"noopener noreferrer"}},[t._v("redux-box"),a("OutboundLink")],1),t._v(" 这个库，利用 immer + redux 解决了 reducer 冗余 "),a("code",[t._v("return")]),t._v(" 的问题。")]),t._v(" "),a("blockquote",[a("p",[t._v("同样我们也开始思考并设计新的数据流框架，笔者在 2018.3.24 的携程技术沙龙将会分享 "),a("a",{attrs:{href:"http://mp.weixin.qq.com/s/54BJPM7aldH6yq6qj2Yrpw",target:"_blank",rel:"noopener noreferrer"}},[t._v("《mvvm 前端数据流框架精讲》"),a("OutboundLink")],1),t._v("，分享这几年涌现的各套数据流技术方案研究心得，感兴趣的同学欢迎报名参加。")])]),t._v(" "),a("blockquote",[a("p",[t._v("本文系转载，更多详情点击"),a("a",{attrs:{href:"https://github.com/dt-fe/weekly/blob/v2/048.%E7%B2%BE%E8%AF%BB%E3%80%8AImmer.js%E3%80%8B%E6%BA%90%E7%A0%81.md",target:"_blank",rel:"noopener noreferrer"}},[t._v("原地址"),a("OutboundLink")],1)])])])}),[],!1,null,null,null);s.default=n.exports}}]);