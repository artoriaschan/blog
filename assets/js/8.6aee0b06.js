(window.webpackJsonp=window.webpackJsonp||[]).push([[8],{476:function(t,s,n){t.exports=n.p+"assets/img/2019-07-24-60302.dbb5af53.jpg"},477:function(t,s,n){t.exports=n.p+"assets/img/2019-07-24-060305.13cf6ccb.jpg"},478:function(t,s,n){t.exports=n.p+"assets/img/2019-07-24-060308.6290798a.jpg"},479:function(t,s,n){t.exports=n.p+"assets/img/2019-07-24-060314.7c6f7bbe.jpg"},480:function(t,s,n){t.exports=n.p+"assets/img/20191215220242.72ebd8f5.png"},481:function(t,s,n){t.exports=n.p+"assets/img/20191215220335.ecfa43c2.png"},482:function(t,s,n){t.exports=n.p+"assets/img/20191215220404.d3cb6e8b.png"},483:function(t,s,n){t.exports=n.p+"assets/img/20191215220504.1242baa7.png"},484:function(t,s,n){t.exports=n.p+"assets/img/2019-07-24-060321.e00393e6.jpg"},608:function(t,s,n){"use strict";n.r(s);var a=n(22),e=Object(a.a)({},(function(){var t=this,s=t.$createElement,a=t._self._c||s;return a("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[a("h2",{attrs:{id:"构造函数"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#构造函数"}},[t._v("#")]),t._v(" 构造函数")]),t._v(" "),a("h3",{attrs:{id:"什么是构造函数"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#什么是构造函数"}},[t._v("#")]),t._v(" 什么是构造函数")]),t._v(" "),a("p",[t._v("构造函数本身就是一个函数，与普通函数没有任何区别，不过为了规范一般将其首字母大写。构造函数和普通函数的区别在于，使用 "),a("code",[t._v("new")]),t._v(" 生成实例的函数就是构造函数，直接调用的就是普通函数。")]),t._v(" "),a("p",[t._v("对于引用类型来说 "),a("code",[t._v("constructor")]),t._v(" 属性值是可以修改的，但是对于基本类型来说是只读的。")]),t._v(" "),a("h2",{attrs:{id:"原型"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#原型"}},[t._v("#")]),t._v(" 原型")]),t._v(" "),a("p",[t._v("每个对象拥有一个"),a("strong",[t._v("原型对象")]),t._v("，对象以其原型为模板，从原型继承方法和属性，这些属性和方法定义在对象的构造器函数的 "),a("code",[t._v("prototype")]),t._v(" 属性上，而非对象实例本身。")]),t._v(" "),a("p",[a("img",{attrs:{src:n(476),alt:"2019-07-24-60302"}})]),t._v(" "),a("p",[t._v("上图可以看到 Parent 原型（ "),a("code",[t._v("Parent.prototype")]),t._v(" ）上有 "),a("code",[t._v("__proto__")]),t._v(" 属性，这是一个"),a("strong",[t._v("访问器属性")]),t._v("（即 getter 函数和 setter 函数），通过它可以访问到对象的内部 "),a("code",[t._v("[[Prototype]]")]),t._v(" (一个对象或 "),a("code",[t._v("null")]),t._v(" )。")]),t._v(" "),a("p",[a("code",[t._v("__proto__")]),t._v(" 发音 dunder proto，最先被 Firefox使用，后来在 ES6 被列为 Javascript 的标准内建属性。")]),t._v(" "),a("p",[a("code",[t._v("[[Prototype]]")]),t._v(" 是对象的一个内部属性，外部代码无法直接访问。")]),t._v(" "),a("blockquote",[a("p",[t._v("遵循 ECMAScript 标准，someObject.[[Prototype]] 符号用于指向 someObject 的原型。")])]),t._v(" "),a("p",[t._v("这里用 "),a("code",[t._v("p.__proto__")]),t._v(" 获取对象的原型，"),a("code",[t._v("__proto__")]),t._v(" 是每个实例上都有的属性，"),a("code",[t._v("prototype")]),t._v(" 是构造函数的属性，这两个并不一样，但 "),a("code",[t._v("p.__proto__")]),t._v(" 和 "),a("code",[t._v("Parent.prototype")]),t._v(" 指向同一个对象。")]),t._v(" "),a("div",{staticClass:"language-JavaScript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("Parent")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" p "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Parent")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\np"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Parent")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br")])]),a("p",[t._v("所以构造函数 "),a("code",[t._v("Parent")]),t._v("、"),a("code",[t._v("Parent.prototype")]),t._v(" 和 "),a("code",[t._v("p")]),t._v(" 的关系如下图。")]),t._v(" "),a("p",[a("img",{attrs:{src:n(477),alt:"2019-07-24-060305"}})]),t._v(" "),a("p",[a("code",[t._v("__proto__")]),t._v(" 属性在 "),a("code",[t._v("ES6")]),t._v(" 时才被标准化，以确保 Web 浏览器的兼容性，但是不推荐使用，除了标准化的原因之外还有性能问题。为了更好的支持，推荐使用 "),a("code",[t._v("Object.getPrototypeOf()")]),t._v("。")]),t._v(" "),a("div",{staticClass:"language-JavaScript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 获取")]),t._v("\nObject"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("getPrototypeOf")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\nReflect"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("getPrototypeOf")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 修改")]),t._v("\nObject"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setPrototypeOf")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\nReflect"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("setPrototypeOf")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br")])]),a("h2",{attrs:{id:"原型链"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#原型链"}},[t._v("#")]),t._v(" 原型链")]),t._v(" "),a("p",[t._v("每个对象拥有一个原型对象，通过 "),a("code",[t._v("__proto__")]),t._v(" 指针指向上一个原型 ，并从中继承方法和属性，同时原型对象也可能拥有原型，这样一层一层，最终指向 "),a("code",[t._v("null")]),t._v("。这种关系被称为"),a("strong",[t._v("原型链 (prototype chain)")]),t._v("，通过原型链一个对象会拥有定义在其他对象中的属性和方法。")]),t._v(" "),a("div",{staticClass:"language-javascript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("Parent")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[t._v("age")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v("\n    "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("this")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("age "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" age"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" p "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Parent")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token number"}},[t._v("50")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\np"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Parent {age: 50}")]),t._v("\np"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Parent")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\np"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Object")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\np"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br")])]),a("p",[t._v("下图展示了原型链的运作机制:")]),t._v(" "),a("p",[a("img",{attrs:{src:n(478),alt:"2019-07-24-060308"}})]),t._v(" "),a("p",[t._v("原型上的方法和属性被 "),a("strong",[t._v("继承")]),t._v(" 到新对象中，并不是被复制到新对象。")]),t._v(" "),a("p",[t._v("当访问一个对象的属性 / 方法时，它不仅仅在该对象上查找，还会查找该对象的原型，以及该对象的原型的原型，一层一层向上查找，直到找到一个名字匹配的属性 / 方法或到达原型链的末尾（"),a("code",[t._v("null")]),t._v("）。")]),t._v(" "),a("p",[a("img",{attrs:{src:n(479),alt:"2019-07-24-060314"}})]),t._v(" "),a("h2",{attrs:{id:"instanceof-原理及实现"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#instanceof-原理及实现"}},[t._v("#")]),t._v(" instanceof 原理及实现")]),t._v(" "),a("p",[a("code",[t._v("instanceof")]),t._v(" 运算符用来检测 "),a("code",[t._v("constructor.prototype")]),t._v(" 是否存在于参数 "),a("code",[t._v("object")]),t._v(" 的原型链上。")]),t._v(" "),a("p",[t._v("instanceof 原理就是一层一层查找 "),a("code",[t._v("__proto__")]),t._v("，如果和 "),a("code",[t._v("constructor.prototype")]),t._v(" 相等则返回 true，如果一直没有查找成功则返回 false。")]),t._v(" "),a("p",[t._v("所以instanceof的原理实现如下:")]),t._v(" "),a("div",{staticClass:"language-javascript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("instance_of")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token parameter"}},[a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("L")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("R")])]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("//L 表示左表达式，R 表示右表达式")]),t._v("\n   "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("O")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("R")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 取 R 的显示原型")]),t._v("\n   "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("L")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("L")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 取 L 的隐式原型")]),t._v("\n   "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("while")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),t._v(" \n       "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Object.prototype.__proto__ === null")]),t._v("\n       "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("L")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("null")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),t._v(" \n         "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("false")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" \n       "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("if")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("O")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("L")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 这里重点：当 O 严格等于 L 时，返回 true ")]),t._v("\n         "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("return")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token boolean"}},[t._v("true")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" \n       "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("L")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("L")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" \n   "),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" \n"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// 测试")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("C")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" \n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("function")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("D")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("{")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("}")]),t._v(" \n\n"),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("var")]),t._v(" o "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("=")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("new")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("C")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("instance_of")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("o"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("C")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n"),a("span",{pre:!0,attrs:{class:"token function"}},[t._v("instance_of")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v("(")]),t._v("o"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(",")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token constant"}},[t._v("D")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(")")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(";")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// false")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br"),a("span",{staticClass:"line-number"},[t._v("12")]),a("br"),a("span",{staticClass:"line-number"},[t._v("13")]),a("br"),a("span",{staticClass:"line-number"},[t._v("14")]),a("br"),a("span",{staticClass:"line-number"},[t._v("15")]),a("br"),a("span",{staticClass:"line-number"},[t._v("16")]),a("br"),a("span",{staticClass:"line-number"},[t._v("17")]),a("br"),a("span",{staticClass:"line-number"},[t._v("18")]),a("br"),a("span",{staticClass:"line-number"},[t._v("19")]),a("br"),a("span",{staticClass:"line-number"},[t._v("20")]),a("br"),a("span",{staticClass:"line-number"},[t._v("21")]),a("br")])]),a("h2",{attrs:{id:"object-prototype"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#object-prototype"}},[t._v("#")]),t._v(" Object.prototype")]),t._v(" "),a("p",[t._v("我们先来看看 ECMAScript 上的定义（"),a("a",{attrs:{href:"http://www.ecma-international.org/ecma-262/5.1/#sec-15.2.4",target:"_blank",rel:"noopener noreferrer"}},[t._v("15.2.4"),a("OutboundLink")],1),t._v("）。")]),t._v(" "),a("blockquote",[a("p",[t._v("The value of the [[Prototype]] internal property of the Object prototype object is "),a("strong",[t._v("null")]),t._v(", the value of the [[Class]] internal property is "),a("code",[t._v('"Object"')]),t._v(", and the initial value of the [[Extensible]] internal property is "),a("strong",[t._v("true")]),t._v(".")])]),t._v(" "),a("p",[t._v("Object.prototype 表示 Object 的原型对象，其 "),a("code",[t._v("[[Prototype]]")]),t._v(" 属性是 null，访问器属性 "),a("code",[t._v("__proto__")]),t._v(" 暴露了一个对象的内部 "),a("code",[t._v("[[Prototype]]")]),t._v(" 。")]),t._v(" "),a("p",[a("code",[t._v("Object.prototype.__proto__")]),t._v(" 是 null，所以 Object.prototype 并不是通过 Object 函数创建的，那它如何生成的？其实 Object.prototype 是浏览器底层根据 ECMAScript 规范创造的一个对象。")]),t._v(" "),a("p",[t._v("Object.prototype 就是原型链的顶端（不考虑 null 的情况下），所有对象继承了它的 toString 等方法和属性。")]),t._v(" "),a("p",[a("img",{attrs:{src:n(480),alt:"20191215220242"}})]),t._v(" "),a("h2",{attrs:{id:"function-prototype"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#function-prototype"}},[t._v("#")]),t._v(" Function.prototype")]),t._v(" "),a("p",[t._v("我们先来看看 ECMAScript 上的定义（"),a("a",{attrs:{href:"http://www.ecma-international.org/ecma-262/5.1/#sec-15.3.4",target:"_blank",rel:"noopener noreferrer"}},[t._v("15.3.4"),a("OutboundLink")],1),t._v("）。")]),t._v(" "),a("blockquote",[a("p",[t._v("The Function prototype object is itself a Function object (its [[Class]] is "),a("code",[t._v('"Function"')]),t._v(").")]),t._v(" "),a("p",[t._v("The value of the [[Prototype]] internal property of the Function prototype object is the standard built-in Object prototype object.")]),t._v(" "),a("p",[t._v("The Function prototype object does not have a "),a("code",[t._v("valueOf")]),t._v(" property of its own; however, it inherits the "),a("code",[t._v("valueOf")]),t._v(" property from the Object prototype Object.")])]),t._v(" "),a("p",[t._v("Function.prototype 对象是一个函数（对象），其 "),a("code",[t._v("[[Prototype]]")]),t._v(" 内部属性值指向内建对象 Object.prototype。Function.prototype 对象自身没有 "),a("code",[t._v("valueOf")]),t._v(" 属性，其从 Object.prototype 对象继承了"),a("code",[t._v("valueOf")]),t._v(" 属性。")]),t._v(" "),a("p",[a("img",{attrs:{src:n(481),alt:"20191215220335"}})]),t._v(" "),a("p",[t._v("Function.prototype 的 "),a("code",[t._v("[[Class]]")]),t._v(" 属性是 "),a("code",[t._v("Function")]),t._v("，所以这是一个函数，但又不大一样。为什么这么说呢？因为我们知道只有函数才有 prototype 属性，但并不是所有函数都有这个属性，因为 Function.prototype 这个函数就没有。")]),t._v(" "),a("div",{staticClass:"language-javascript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// ƒ () { [native code] }")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// undefined")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br")])]),a("p",[t._v("为什么没有呢，我的理解是 "),a("code",[t._v("Function.prototype")]),t._v(" 是引擎创建出来的函数，引擎认为不需要给这个函数对象添加 "),a("code",[t._v("prototype")]),t._v(" 属性，不然 "),a("code",[t._v("Function.prototype.prototype…")]),t._v(" 将无休无止并且没有存在的意义。")]),t._v(" "),a("h2",{attrs:{id:"function-object"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#function-object"}},[t._v("#")]),t._v(" function Object")]),t._v(" "),a("p",[t._v("我们先来看看 ECMAScript 上的定义（"),a("a",{attrs:{href:"http://www.ecma-international.org/ecma-262/5.1/#sec-15.2.3",target:"_blank",rel:"noopener noreferrer"}},[t._v("15.2.3"),a("OutboundLink")],1),t._v("）。")]),t._v(" "),a("blockquote",[a("p",[t._v("The value of the [[Prototype]] internal property of the Object constructor is the standard built-in Function prototype object.")])]),t._v(" "),a("p",[t._v("Object 作为构造函数时，其 "),a("code",[t._v("[[Prototype]]")]),t._v(" 内部属性值指向 Function.prototype，即")]),t._v(" "),a("div",{staticClass:"language-javascript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[t._v("Object"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br")])]),a("p",[a("img",{attrs:{src:n(482),alt:"20191215220404"}})]),t._v(" "),a("h2",{attrs:{id:"function-function"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#function-function"}},[t._v("#")]),t._v(" function Function")]),t._v(" "),a("p",[t._v("我们先来看看 ECMAScript 上的定义（"),a("a",{attrs:{href:"http://www.ecma-international.org/ecma-262/5.1/#sec-15.3.3",target:"_blank",rel:"noopener noreferrer"}},[t._v("15.3.3"),a("OutboundLink")],1),t._v("）。")]),t._v(" "),a("blockquote",[a("p",[t._v("The Function constructor is itself a Function object and its [[Class]] is "),a("code",[t._v('"Function"')]),t._v(". The value of the [[Prototype]] internal property of the Function constructor is the standard built-in Function prototype object.")])]),t._v(" "),a("p",[t._v("Function 构造函数是一个函数对象，其 "),a("code",[t._v("[[Class]]")]),t._v(" 属性是 "),a("code",[t._v("Function")]),t._v("。Function 的 "),a("code",[t._v("[[Prototype]]")]),t._v(" 属性指向了 "),a("code",[t._v("Function.prototype")]),t._v("，即")]),t._v(" "),a("div",{staticClass:"language-javascript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[t._v("Function"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype "),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br")])]),a("p",[a("img",{attrs:{src:n(483),alt:"20191215220504"}})]),t._v(" "),a("h2",{attrs:{id:"function-object-鸡蛋问题"}},[a("a",{staticClass:"header-anchor",attrs:{href:"#function-object-鸡蛋问题"}},[t._v("#")]),t._v(" Function & Object 鸡蛋问题")]),t._v(" "),a("p",[t._v("我们看下面这段代码")]),t._v(" "),a("div",{staticClass:"language-javascript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[t._v("Object "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("instanceof")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),t._v(" \t\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\nFunction "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("instanceof")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Object")]),t._v(" \t\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n\nObject "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("instanceof")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Object")]),t._v(" \t\t\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\nFunction "),a("span",{pre:!0,attrs:{class:"token keyword"}},[t._v("instanceof")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),t._v(" \t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br")])]),a("p",[a("code",[t._v("Object")]),t._v(" 构造函数继承了 "),a("code",[t._v("Function.prototype")]),t._v("，同时 "),a("code",[t._v("Function")]),t._v(" 构造函数继承了"),a("code",[t._v("Object.prototype")]),t._v("。这里就产生了 "),a("strong",[t._v("鸡和蛋")]),t._v(" 的问题。为什么会出现这种问题，因为 "),a("code",[t._v("Function.prototype")]),t._v(" 和 "),a("code",[t._v("Function.__proto__")]),t._v(" 都指向 "),a("code",[t._v("Function.prototype")]),t._v("。")]),t._v(" "),a("div",{staticClass:"language-javascript line-numbers-mode"},[a("pre",{pre:!0,attrs:{class:"language-javascript"}},[a("code",[a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Object instanceof Function \t即")]),t._v("\nObject"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype \t\t\t\t\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Function instanceof Object \t即")]),t._v("\nFunction"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Object")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Object instanceof Object \t\t即 \t\t\t")]),t._v("\nObject"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Object")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype \t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n\n"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// Function instanceof Function 即\t")]),t._v("\nFunction"),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("__proto__ "),a("span",{pre:!0,attrs:{class:"token operator"}},[t._v("===")]),t._v(" "),a("span",{pre:!0,attrs:{class:"token class-name"}},[t._v("Function")]),a("span",{pre:!0,attrs:{class:"token punctuation"}},[t._v(".")]),t._v("prototype\t\t\t\t\t"),a("span",{pre:!0,attrs:{class:"token comment"}},[t._v("// true")]),t._v("\n")])]),t._v(" "),a("div",{staticClass:"line-numbers-wrapper"},[a("span",{staticClass:"line-number"},[t._v("1")]),a("br"),a("span",{staticClass:"line-number"},[t._v("2")]),a("br"),a("span",{staticClass:"line-number"},[t._v("3")]),a("br"),a("span",{staticClass:"line-number"},[t._v("4")]),a("br"),a("span",{staticClass:"line-number"},[t._v("5")]),a("br"),a("span",{staticClass:"line-number"},[t._v("6")]),a("br"),a("span",{staticClass:"line-number"},[t._v("7")]),a("br"),a("span",{staticClass:"line-number"},[t._v("8")]),a("br"),a("span",{staticClass:"line-number"},[t._v("9")]),a("br"),a("span",{staticClass:"line-number"},[t._v("10")]),a("br"),a("span",{staticClass:"line-number"},[t._v("11")]),a("br")])]),a("p",[t._v("对于 "),a("code",[t._v("Function.__proto__ === Function.prototype")]),t._v(" 这一现象有 2 种解释，争论点在于 Function 对象是不是由 Function 构造函数创建的一个实例？")]),t._v(" "),a("p",[a("strong",[t._v("解释 1、YES")]),t._v("：按照 JavaScript 中“实例”的定义，a 是 b 的实例即 "),a("code",[t._v("a instanceof b")]),t._v(" 为 true，默认判断条件就是 "),a("code",[t._v("b.prototype")]),t._v(" 在 a 的原型链上。而 "),a("code",[t._v("Function instanceof Function")]),t._v(" 为 true，本质上即 "),a("code",[t._v("Object.getPrototypeOf(Function) === Function.prototype")]),t._v("，正符合此定义。")]),t._v(" "),a("p",[a("strong",[t._v("解释 2、NO")]),t._v("：Function 是 "),a("code",[t._v("built-in")]),t._v(" 的对象，也就是并不存在“Function对象由Function构造函数创建”这样显然会造成鸡生蛋蛋生鸡的问题。实际上，当你直接写一个函数时（如 "),a("code",[t._v("function f() {}")]),t._v(" 或 "),a("code",[t._v("x => x")]),t._v("），也不存在调用 Function 构造器，只有在显式调用 Function 构造器时（如 "),a("code",[t._v("new Function('x', 'return x')")]),t._v(" ）才有。")]),t._v(" "),a("p",[t._v("我个人偏向于第二种解释，即先有 "),a("code",[t._v("Function.prototype")]),t._v(" 然后有的 "),a("code",[t._v("function Function()")]),t._v(" ，所以就不存在鸡生蛋蛋生鸡问题了，把 "),a("code",[t._v("Function.__proto__")]),t._v(" 指向 "),a("code",[t._v("Function.prototype")]),t._v(" 是为了保证原型链的完整，让 "),a("code",[t._v("Function")]),t._v(" 可以获取定义在 "),a("code",[t._v("Object.prototype")]),t._v(" 上的方法。")]),t._v(" "),a("p",[t._v("最后给一个完整的图，看懂这张图原型就没问题了。")]),t._v(" "),a("p",[a("img",{attrs:{src:n(484),alt:"2019-07-24-060321"}})])])}),[],!1,null,null,null);s.default=e.exports}}]);