(window.webpackJsonp=window.webpackJsonp||[]).push([[22],{380:function(s,a,n){s.exports=n.p+"assets/img/img4.76e70f25.jpg"},502:function(s,a,n){s.exports=n.p+"assets/img/img1.f46d27d3.jpg"},503:function(s,a,n){s.exports=n.p+"assets/img/img2.7b241eb4.jpg"},504:function(s,a,n){s.exports=n.p+"assets/img/img3.7ce9128e.jpg"},655:function(s,a,n){"use strict";n.r(a);var e=n(22),t=Object(e.a)({},(function(){var s=this,a=s.$createElement,e=s._self._c||a;return e("ContentSlotsDistributor",{attrs:{"slot-key":s.$parent.slotKey}},[e("h2",{attrs:{id:"背景"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#背景"}},[s._v("#")]),s._v(" 背景")]),s._v(" "),e("p",[s._v("对于维护过多个package的同学来说，都会遇到一个选择："),e("strong",[s._v("这些package是放在一个仓库里维护还是放在多个仓库里单独维护")]),s._v("，数量较少的时候，多个仓库维护不会有太大问题，但是当package数量逐渐增多时，一些问题逐渐暴露出来：\n"),e("strong",[s._v("一、"),e("strong",[s._v("package之间相互依赖，开发人员需要在本地手动执行")]),s._v("npm link")]),s._v("，维护版本号的更替；\n**二、**issue难以统一追踪，管理，因为其分散在独立的repo里；\n**三、**每一个package都包含独立的node_modules，而且大部分都包含babel,webpack等开发时依赖，安装耗时冗余并且占用过多空间。")]),s._v(" "),e("h2",{attrs:{id:"什么是lerna"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#什么是lerna"}},[s._v("#")]),s._v(" 什么是lerna")]),s._v(" "),e("p",[s._v("lerna到底是什么呢？lerna官网上是这样描述的。")]),s._v(" "),e("blockquote",[e("p",[s._v("用于管理具有多个包的JavaScript项目的工具。\n这个介绍可以说很清晰了，引入lerna后，上面提到的问题不仅迎刃而解，更为开发人员提供了一种管理多packages javascript项目的方式。\n**一、**自动解决packages之间的依赖关系。\n**二、**通过git 检测文件改动，自动发布。\n**三、**根据git 提交记录，自动生成CHANGELOG")])]),s._v(" "),e("h3",{attrs:{id:"常用命令"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#常用命令"}},[s._v("#")]),s._v(" 常用命令")]),s._v(" "),e("h4",{attrs:{id:"全局安装lerna"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#全局安装lerna"}},[s._v("#")]),s._v(" 全局安装lerna")]),s._v(" "),e("p",[s._v("lerna 我们需要全局安装lerna工具。")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("npm")]),s._v(" i -g lerna\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 或")]),s._v("\n$ "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("yarn")]),s._v(" global "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" lerna\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br")])]),e("h4",{attrs:{id:"为所有项目安装依赖-类似于npm-yarn-i"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#为所有项目安装依赖-类似于npm-yarn-i"}},[s._v("#")]),s._v(" 为所有项目安装依赖，类似于npm/yarn i")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna bootstrap\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("h4",{attrs:{id:"提交对项目的更新"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#提交对项目的更新"}},[s._v("#")]),s._v(" 提交对项目的更新")]),s._v(" "),e("p",[s._v("运行该命令会执行如下的步骤：")]),s._v(" "),e("ol",[e("li",[s._v("运行lerna updated来决定哪一个包需要被publish")]),s._v(" "),e("li",[s._v("如果有必要，将会更新lerna.json中的version")]),s._v(" "),e("li",[s._v("将所有更新过的的包中的package.json的version字段更新")]),s._v(" "),e("li",[s._v("将所有更新过的包中的依赖更新")]),s._v(" "),e("li",[s._v("为新版本创建一个git commit或tag")]),s._v(" "),e("li",[s._v("将包publish到npm上")])]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna publish "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 用于发布更新")]),s._v("\n$ lerna publish --skip-git "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 不会创建git commit或tag")]),s._v("\n$ lerna publish --skip-npm "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 不会把包publish到npm上")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br")])]),e("h4",{attrs:{id:"使用lerna-初始化项目"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#使用lerna-初始化项目"}},[s._v("#")]),s._v(" 使用lerna 初始化项目")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna init "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 固定模式(Fixed mode)默认为固定模式，packages下的所有包共用一个版本号(version)")]),s._v("\n$ lerna init --independent "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 独立模式(Independent mode)，每一个包有一个独立的版本号")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br")])]),e("h4",{attrs:{id:"为packages文件夹下的package安装依赖"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#为packages文件夹下的package安装依赖"}},[s._v("#")]),s._v(" 为packages文件夹下的package安装依赖")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("<")]),s._v("package"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),s._v("@version"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),s._v("--dev"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 命令签名")]),s._v("\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 例如")]),s._v("\n$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" module-1 --scope"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("module-2 "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 将 module-1 安装到 module-2")]),s._v("\n$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" module-1 --scope"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("module-2 --dev "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 将 module-1 安装到 module-2 的 devDependencies 下")]),s._v("\n$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" module-1 "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 将 module-1 安装到除 module-1 以外的所有模块")]),s._v("\n$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" babel-core "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 将 babel-core 安装到所有模块")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br")])]),e("h4",{attrs:{id:"卸载依赖"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#卸载依赖"}},[s._v("#")]),s._v(" 卸载依赖")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna "),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("exec")]),s._v(" -- "),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("<")]),s._v("command"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("..")]),s._v("args"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 在所有包中运行该命令")]),s._v("\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 例如")]),s._v("\n$ lerna "),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("exec")]),s._v(" --scope"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("npm-list  "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("yarn")]),s._v(" remove listr "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 将 npm-list 包下的 listr 卸载")]),s._v("\n$ lerna "),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("exec")]),s._v(" -- "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("yarn")]),s._v(" remove listr "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 将所有包下的 listr 卸载")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br")])]),e("h4",{attrs:{id:"对包是否发生过变更"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#对包是否发生过变更"}},[s._v("#")]),s._v(" 对包是否发生过变更")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna updated\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 或")]),s._v("\n$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("diff")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br")])]),e("h4",{attrs:{id:"显示packages下的各个package的version"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#显示packages下的各个package的version"}},[s._v("#")]),s._v(" 显示packages下的各个package的version")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("ls")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("h4",{attrs:{id:"清理node-modules"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#清理node-modules"}},[s._v("#")]),s._v(" 清理node_modules")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna clean\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("h4",{attrs:{id:"lerna-run"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#lerna-run"}},[s._v("#")]),s._v(" lerna run")]),s._v(" "),e("p",[s._v("运行npm script，可以指定具体的package。")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna run "),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("<")]),s._v("script"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(">")]),s._v(" -- "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("..")]),s._v("args"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 在所有包下运行指定")]),s._v("\n\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 例如")]),s._v("\n$ lerna run "),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("test")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 运行所有包的 test 命令")]),s._v("\n$ lerna run build "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 运行所有包的 build 命令")]),s._v("\n$ lerna run --parallel "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("watch")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 观看所有包并在更改时发报，流式处理前缀输出")]),s._v("\n\n$ lerna run --scope my-component "),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("test")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 运行 my-component 模块下的 test")]),s._v("\n\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br"),e("span",{staticClass:"line-number"},[s._v("9")]),e("br")])]),e("p",[e("a",{attrs:{href:"https://github.com/lerna/lerna/tree/master/commands/run#readme",target:"_blank",rel:"noopener noreferrer"}},[s._v("参考"),e("OutboundLink")],1)]),s._v(" "),e("h2",{attrs:{id:"lerna-json解析"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#lerna-json解析"}},[s._v("#")]),s._v(" lerna.json解析")]),s._v(" "),e("div",{staticClass:"language-json line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-json"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n  "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"version"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[s._v('"1.1.3"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"npmClient"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[s._v('"npm"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"command"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n    "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"publish"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n      "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"ignoreChanges"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),s._v("\n        "),e("span",{pre:!0,attrs:{class:"token string"}},[s._v('"ignored-file"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n        "),e("span",{pre:!0,attrs:{class:"token string"}},[s._v('"*.md"')]),s._v("\n      "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v("\n    "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n    "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"bootstrap"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("{")]),s._v("\n      "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"ignore"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token string"}},[s._v('"component-*"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n      "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"npmClientArgs"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),e("span",{pre:!0,attrs:{class:"token string"}},[s._v('"--no-package-lock"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v("      \n    "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n  "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(",")]),s._v("\n  "),e("span",{pre:!0,attrs:{class:"token property"}},[s._v('"packages"')]),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v(":")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("[")]),e("span",{pre:!0,attrs:{class:"token string"}},[s._v('"packages/*"')]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("]")]),s._v("\n"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("}")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br"),e("span",{staticClass:"line-number"},[s._v("9")]),e("br"),e("span",{staticClass:"line-number"},[s._v("10")]),e("br"),e("span",{staticClass:"line-number"},[s._v("11")]),e("br"),e("span",{staticClass:"line-number"},[s._v("12")]),e("br"),e("span",{staticClass:"line-number"},[s._v("13")]),e("br"),e("span",{staticClass:"line-number"},[s._v("14")]),e("br"),e("span",{staticClass:"line-number"},[s._v("15")]),e("br"),e("span",{staticClass:"line-number"},[s._v("16")]),e("br"),e("span",{staticClass:"line-number"},[s._v("17")]),e("br")])]),e("p",[s._v("**version：**当前库的版本\n"),e("strong",[s._v("npmClient：")]),s._v(" 允许指定命令使用的client， 默认是 npm， 可以设置成 yarn\n**command.publish.ignoreChanges：**可以指定那些目录或者文件的变更不会被publish\n**command.bootstrap.ignore：**指定不受 bootstrap 命令影响的包\n**command.bootstrap.npmClientArgs：**指定默认传给 lerna bootstrap 命令的参数\n**command.bootstrap.scope：**指定那些包会受 lerna bootstrap 命令影响\n**packages：**指定包所在的目录")]),s._v(" "),e("h2",{attrs:{id:"使用lerna的基本工作流"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#使用lerna的基本工作流"}},[s._v("#")]),s._v(" 使用lerna的基本工作流")]),s._v(" "),e("h3",{attrs:{id:"环境配置"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#环境配置"}},[s._v("#")]),s._v(" 环境配置")]),s._v(" "),e("ul",[e("li",[s._v("Git 在一个lerna工程里，是通过git来进行代码管理的。所以你首先要确保本地有正确的git环境。 如果需要多人协作开发，请先创建正确的git中心仓库的链接。 因此需要你了解基本的git操作，在此不再赘述。")]),s._v(" "),e("li",[s._v("npm仓库 无论你管理的package是要发布到官网还是公司的私有服务器上，都需要正确的仓库地址和用户名。 你可运行下方的命令来检查，本地的npm registry地址是否正确。")])]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("npm")]),s._v(" config "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("ls")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("ul",[e("li",[s._v("lerna 我们需要全局安装lerna工具")])]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("npm")]),s._v(" i -g lerna\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 或")]),s._v("\n$ "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("yarn")]),s._v(" global "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" lerna\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br")])]),e("h3",{attrs:{id:"初始化一个lerna工程"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#初始化一个lerna工程"}},[s._v("#")]),s._v(" 初始化一个lerna工程")]),s._v(" "),e("blockquote",[e("p",[s._v("在这个例子中，我将在我本地d:/jobs 根目录下初始化一个lerna工程。\n1、在"),e("code",[s._v("d:/jobs")]),s._v("下创建一个空的文件夹，命名为"),e("code",[s._v("lerna-demo")]),s._v("：")])]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("mkdir")]),s._v(" lerna-demo\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("p",[s._v("2、初始化 通过cmd进入相关目录，进行初始化")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ "),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("cd")]),s._v(" d:/jobs/lerna-demo\n$ lerna init\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br")])]),e("p",[s._v("执行成功后，目录下将会生成这样的目录结构。")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("- packages(目录)\n- lerna.json(配置文件)\n- package.json(工程描述文件)\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br")])]),e("p",[s._v("3、添加一个测试package")]),s._v(" "),e("blockquote",[e("p",[s._v("默认情况下，package是放在packages目录下的。")])]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 进入packages目录")]),s._v("\n"),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("cd")]),s._v(" d:/jobs/lerna-demo/packages\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 创建一个packge目录")]),s._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("mkdir")]),s._v(" module-1\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 进入module-1 package目录")]),s._v("\n"),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("cd")]),s._v(" module-1\n"),e("span",{pre:!0,attrs:{class:"token comment"}},[s._v("# 初始化一个package")]),s._v("\n"),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("npm")]),s._v(" init -y\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br")])]),e("p",[s._v("执行完毕，工程下的目录结构如下:")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("--packages\n\t--module-1\n\t\tpackage.json\n--lerna.json\n--package.json\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br")])]),e("p",[s._v("4、安装各packages依赖 这一步操作，官网上是这样描述的")]),s._v(" "),e("blockquote",[e("p",[s._v("在当前的Lerna仓库中引导包。安装所有依赖项并链接任何交叉依赖项。")])]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ "),e("span",{pre:!0,attrs:{class:"token builtin class-name"}},[s._v("cd")]),s._v(" d:/lerna-demo\n$ lerna bootstrap\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br")])]),e("p",[s._v("在现在的测试package中，module-1是没有任何依赖的，因此为了更加接近真实情况。你可已在module-1的"),e("code",[s._v("package.json")]),s._v("文件中添加一些第三方库的依赖。 这样的话，当你执行完该条命令后，你会发现module-1的依赖已经安装上了。")]),s._v(" "),e("p",[s._v("5、发布 在发布的时候，就需要"),e("code",[s._v("git")]),s._v("工具的配合了。 所以在发布之前，请确认此时该lerna工程是否已经连接到git的远程仓库。你可以执行下面的命令进行查看。")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[e("span",{pre:!0,attrs:{class:"token function"}},[s._v("git")]),s._v(" remote -v\n// print log\norigin  git@github.com:meitianyitan/docm.git "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("fetch"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\norigin  git@github.com:meitianyitan/docm.git "),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v("(")]),s._v("push"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(")")]),s._v("\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br")])]),e("p",[s._v("本篇文章的代码托管在Github上。因此会显示此远程链接信息。 如果你还没有与远程仓库链接，请首先在github创建一个空的仓库，然后根据相关提示信息，进行链接。")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna publish\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("p",[s._v("执行这条命令，你就可以根据cmd中的提示，一步步的发布packges了。\n实际上在执行该条命令的时候，lerna会做很多的工作。")]),s._v(" "),e("div",{staticClass:"language- line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[s._v("-  Run the equivalent of  `lerna updated`  to determine which packages need to be published.\n-  If necessary, increment the  `version`  key in  `lerna.json`.\n-  Update the  `package.json`  of all updated packages to their new versions.\n-  Update all dependencies of the updated packages with the new versions, specified with a  [caret (^)](https://docs.npmjs.com/files/package.json#dependencies).\n-  Create a new git commit and tag for the new version.\n-  Publish updated packages to npm.\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br")])]),e("p",[s._v("到这里为止，就是一个最简单的lerna的工作流了。但是lerna还有更多的功能等待你去发掘。\nlerna有两种工作模式,Independent mode和Fixed/Locked mode，在这里介绍可能会对初学者造成困扰，但因为实在太重要了，还是有必要提一下的。\nlerna的默认模式是Fixed/Locked mode，在这种模式下，实际上lerna是把工程当作一个整体来对待。每次发布packges，都是全量发布，无论是否修改。但是在Independent mode下，lerna会配合Git，检查文件变动，只发布有改动的packge。")]),s._v(" "),e("h2",{attrs:{id:"使用lerna提升开发流程体验"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#使用lerna提升开发流程体验"}},[s._v("#")]),s._v(" 使用lerna提升开发流程体验")]),s._v(" "),e("p",[s._v("接下来，我们从一个demo出发，了解基于lerna的开发流程。")]),s._v(" "),e("h3",{attrs:{id:"项目初始化"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#项目初始化"}},[s._v("#")]),s._v(" 项目初始化")]),s._v(" "),e("p",[e("img",{attrs:{src:n(502),alt:"img1.jpg"}})]),s._v(" "),e("p",[s._v("我们需要维护一个UI组件库，其包含2个组件，分别为House（房子）和Window（窗户）组件，其中House组件依赖于Window组件。\n我们使用lerna初始化整个项目，并且在packages里新建了2个package，执行命令进行初始化：")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna init\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("p",[s._v("初始化化后目录结构如下所示：")]),s._v(" "),e("div",{staticClass:"language-js line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-js"}},[e("code",[e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("\n├── lerna"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("json\n├── "),e("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("package")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("json\n└── packages\n    ├── house\n    │   ├── index"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("js\n    │   ├── node_modules\n    │   └── "),e("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("package")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("json\n    └── window\n        ├── index"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("js\n        ├── node_modules\n        └── "),e("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("package")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("json\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br"),e("span",{staticClass:"line-number"},[s._v("9")]),e("br"),e("span",{staticClass:"line-number"},[s._v("10")]),e("br"),e("span",{staticClass:"line-number"},[s._v("11")]),e("br"),e("span",{staticClass:"line-number"},[s._v("12")]),e("br")])]),e("h3",{attrs:{id:"增加依赖"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#增加依赖"}},[s._v("#")]),s._v(" 增加依赖")]),s._v(" "),e("p",[e("img",{attrs:{src:n(503),alt:"img2.jpg"}})]),s._v(" "),e("p",[s._v("接下来，我们来为组件增加些依赖，首先House组件不能只由Window构成，还需要添加一些外部依赖（在这里我们假定为lodash）。我们执行：")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" lodash --scope"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("house\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("p",[s._v("这句话会将lodash增添到House的dependencies属性里，这会儿你可以去看看package.json是不是发生变更了。")]),s._v(" "),e("p",[s._v("我们还需要将Window添加到House的依赖里，执行：")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ lerna "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" window --scope"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("=")]),s._v("house\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("p",[s._v("就是这么简单，它会自动检测到window隶属于当前项目，直接采用symlink的方式关联过去。")]),s._v(" "),e("blockquote",[e("p",[s._v("symlink:符号链接，也就是平常所说的建立超链接，此时House的node_modules里的Window直接链接至项目里的Window组件，而不会再重新拉取一份，这个对本地开发是非常有用的。")])]),s._v(" "),e("h3",{attrs:{id:"发布到npm"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#发布到npm"}},[s._v("#")]),s._v(" 发布到npm")]),s._v(" "),e("p",[e("img",{attrs:{src:n(504),alt:"img3.jpg"}})]),s._v(" "),e("p",[s._v("接下来我们只需要简单地执行lerna publish，确认升级的版本号，就可以批量将所有的package发布到远程。")]),s._v(" "),e("blockquote",[e("p",[s._v("默认情况下会推送到系统目前npm对应的registry里，实际项目里可以根据配置leran.json切换所使用的npm客户端。")])]),s._v(" "),e("h3",{attrs:{id:"更新模块"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#更新模块"}},[s._v("#")]),s._v(" 更新模块")]),s._v(" "),e("p",[e("img",{attrs:{src:n(380),alt:"img4.jpg"}})]),s._v(" "),e("p",[s._v("接下来，我们变更了Window组件，执行一下lerna updated，便可以得知有哪些组件发生了变更。")]),s._v(" "),e("div",{staticClass:"language-js line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-js"}},[e("code",[s._v("→ lerna updated\nlerna info version "),e("span",{pre:!0,attrs:{class:"token number"}},[s._v("2.9")]),e("span",{pre:!0,attrs:{class:"token number"}},[s._v(".1")]),s._v("\nlerna info Checking "),e("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" updated packages"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("...")]),s._v("\nlerna info Comparing "),e("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("with")]),s._v(" v1"),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),e("span",{pre:!0,attrs:{class:"token number"}},[s._v("0.9")]),e("span",{pre:!0,attrs:{class:"token punctuation"}},[s._v(".")]),s._v("\nlerna info Checking "),e("span",{pre:!0,attrs:{class:"token keyword"}},[s._v("for")]),s._v(" prereleased packages"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("...")]),s._v("\nlerna info result\n"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v(" jx"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("house\n"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v(" jx"),e("span",{pre:!0,attrs:{class:"token operator"}},[s._v("-")]),s._v("window\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br"),e("span",{staticClass:"line-number"},[s._v("2")]),e("br"),e("span",{staticClass:"line-number"},[s._v("3")]),e("br"),e("span",{staticClass:"line-number"},[s._v("4")]),e("br"),e("span",{staticClass:"line-number"},[s._v("5")]),e("br"),e("span",{staticClass:"line-number"},[s._v("6")]),e("br"),e("span",{staticClass:"line-number"},[s._v("7")]),e("br"),e("span",{staticClass:"line-number"},[s._v("8")]),e("br")])]),e("p",[s._v("我们可以看到，虽然我们只变更了window组件，但是lerna能够帮助我们检查到所有依赖于它的组件，对于没有关联的组件，是不会出现在更新列表里的，这个对于相比之前人工维护版本依赖的更新，是非常稳健的。")]),s._v(" "),e("h3",{attrs:{id:"集中版本号或独立版本号"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#集中版本号或独立版本号"}},[s._v("#")]),s._v(" 集中版本号或独立版本号")]),s._v(" "),e("p",[s._v("截止目前，我们已经成功发布了2个package，现在再新增一个Tree组件，它和其他2个package保持独立，随后我们执行lerna publish，它会提示Tree组件的版本号将会从0.0.0升级至1.0.0，但是事实上Tree组件仅仅是刚创建的，这点不利于版本号的语义化，lerna已经考虑到了这一点，它包含2种版本号管理机制。")]),s._v(" "),e("ul",[e("li",[s._v("fixed模式下，模块发布新版本时，都会升级到leran.json里编写的version字段")]),s._v(" "),e("li",[s._v("independent模式下，模块发布新版本时，会逐个询问需要升级的版本号，基准版本为它自身的package.json，这样就避免了上述问题。")])]),s._v(" "),e("p",[s._v("如果需要各个组件维护自身的版本号，那么就使用independent模式，只需要去配置leran.json即可。")]),s._v(" "),e("h3",{attrs:{id:"总结"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#总结"}},[s._v("#")]),s._v(" 总结")]),s._v(" "),e("p",[e("img",{attrs:{src:n(380),alt:"img4.jpg"}}),s._v("\nlerna不负责构建，测试等任务，它提出了一种集中管理package的目录模式，提供了一套自动化管理程序，让开发者不必再深耕到具体的组件里维护内容，在项目根目录就可以全局掌控，基于npm scripts，可以很好地完成组件构建，代码格式化等操作，并在最后一公里，用lerna变更package版本，将其上传至远端。")]),s._v(" "),e("h2",{attrs:{id:"lerna最佳实践"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#lerna最佳实践"}},[s._v("#")]),s._v(" lerna最佳实践")]),s._v(" "),e("p",[s._v("为了能够使lerna发挥最大的作用，根据这段时间使用lerna 的经验，总结出一个最佳实践。下面是一些特性。")]),s._v(" "),e("ul",[e("li",[s._v("采用Independent模式")]),s._v(" "),e("li",[s._v("根据Git提交信息，自动生成changelog")]),s._v(" "),e("li",[s._v("eslint规则检查")]),s._v(" "),e("li",[s._v("prettier自动格式化代码")]),s._v(" "),e("li",[s._v("提交代码，代码检查hook")]),s._v(" "),e("li",[s._v("遵循semver版本规范\n大家应该也可以看出来，在开发这种工程的过程的，最为重要的一点就是规范。因为应用场景各种各样，你必须保证发布的packge是规范的，代码是规范的，一切都是有迹可循的。这点我认为是非常重要的。")])]),s._v(" "),e("h2",{attrs:{id:"工具整合"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#工具整合"}},[s._v("#")]),s._v(" 工具整合")]),s._v(" "),e("p",[s._v("在这里引入的工具都是为了解决一个问题，就是工程和代码的规范问题。")]),s._v(" "),e("ul",[e("li",[s._v("husky")]),s._v(" "),e("li",[s._v("lint-staged")]),s._v(" "),e("li",[s._v("prettier")]),s._v(" "),e("li",[s._v("eslint")])]),s._v(" "),e("h2",{attrs:{id:"yarn-workspaces"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#yarn-workspaces"}},[s._v("#")]),s._v(" yarn workspaces")]),s._v(" "),e("h3",{attrs:{id:"命令"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#命令"}},[s._v("#")]),s._v(" 命令")]),s._v(" "),e("h4",{attrs:{id:"在根目录安装-npm-包-以-danger-为例"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#在根目录安装-npm-包-以-danger-为例"}},[s._v("#")]),s._v(" 在根目录安装 npm 包，以 danger 为例：")]),s._v(" "),e("div",{staticClass:"language-bash line-numbers-mode"},[e("pre",{pre:!0,attrs:{class:"language-bash"}},[e("code",[s._v("$ "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("yarn")]),s._v(" "),e("span",{pre:!0,attrs:{class:"token function"}},[s._v("add")]),s._v(" danger --dev -W\n")])]),s._v(" "),e("div",{staticClass:"line-numbers-wrapper"},[e("span",{staticClass:"line-number"},[s._v("1")]),e("br")])]),e("blockquote",[e("p",[s._v("本文系转载，更多详情点击"),e("a",{attrs:{href:"http://www.sosout.com/2018/07/21/lerna-repo.html",target:"_blank",rel:"noopener noreferrer"}},[s._v("原地址"),e("OutboundLink")],1)])])])}),[],!1,null,null,null);a.default=t.exports}}]);