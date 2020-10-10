---
title: Vue 2.x 源码解读(三):响应式系统
date: 2019-09-08
tags:
  - vue
author: ArtoriasChan
location: Beijing  
---
## 前言
Vue 的数据驱动除了数据渲染 DOM 之外，还有一个很重要的体现就是数据的变更会触发 DOM 的变化。让我们根据例子去解剖下 Vue 的响应式原理：
```javascript
let App = {
  template: `
    <div id="app">
      <p>{{ msg }}</p>
      <button @click="changeMsg">点我一下</button>
    </div>
  `,
  data() {
    return {
      msg: 'Hello Vue!'
    }
  },
  methods: {
    changeMsg(){
      console.log("changeMsg")
      this.msg += ' Vue!'
    }
  }
}

new Vue({
  render: h => h(App),
}).$mount("#app");
```
当我们点击按钮改变 this.msg 的值时，页面上相应的标签元素的值也会有相应的变化，那么这是怎么发生的呢？

在分析前首先我们要想清楚几个问题，如果我们手动操作的话怎么实现：监听点击事件，修改数据，手动操作 DOM 重新渲染。

这个过程和使用 Vue 的最大区别就是多了一步“手动操作 DOM 重新渲染”。这一步看上去并不多，但它背后又潜在的几个要处理的问题：
* 我需要修改哪块的 DOM？
* 我的修改效率和性能是不是最优的？
* 我需要对数据每一次的修改都去操作 DOM 吗？
* 我需要 case by case 去写修改 DOM 的逻辑吗？

## 响应式对象
众所周知， Vue.js 实现响应式的核心是利用了 ES5 的 Object.defineProperty，这也是为什么 Vue.js 不能兼容 IE8 及以下浏览器的原因。那么我们现在先了解下这个 API
### Object.defineProperty
先来看一下它的语法：
```javascript
Object.defineProperty(obj, prop, descriptor)
/*
 * Parameters
    obj: The object on which to define the property.
    prop: The name or Symbol of the property to be defined or modified.
    descriptor: The descriptor for the property being defined or modified.
 * Return value
    The object that was passed to the function.
*/
```
比较核心的是 descriptor，它有很多可选键值，具体的可以去参阅它的[文档](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)。这里我们最关心的是 get 和 set，get 是一个给属性提供的 getter 方法，当我们访问了该属性的时候会触发 getter 方法；set 是一个给属性提供的 setter 方法，当我们对该属性做修改的时候会触发 setter 方法。

一旦对象拥有了 getter 和 setter，我们可以简单地把这个对象称为响应式对象。那么 Vue.js 把哪些对象变成了响应式对象了呢，接下来我们从源码层面分析。
### initState
在 Vue 的初始化阶段，_init 方法执行的时候，会执行 initState(vm) 方法，它的定义在 src/core/instance/state.js 中。
```javascript
// src/core/instance/state.js

export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```
initState 方法主要是对 props、methods、data、computed 和 wathcer 等属性做了初始化操作。这里我们重点分析 props 和 data。
#### initProps
```javascript
// src/core/instance/state.js

function initProps (vm: Component, propsOptions: Object) {
  const propsData = vm.$options.propsData || {}
  const props = vm._props = {}
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  const keys = vm.$options._propKeys = []
  const isRoot = !vm.$parent
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false)
  }
  for (const key in propsOptions) {
    keys.push(key)
    const value = validateProp(key, propsOptions, propsData, vm)
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      const hyphenatedKey = hyphenate(key)
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          `"${hyphenatedKey}" is a reserved attribute and cannot be used as component prop.`,
          vm
        )
      }
      defineReactive(props, key, value, () => {
        if (!isRoot && !isUpdatingChildComponent) {
          warn(
            `Avoid mutating a prop directly since the value will be ` +
            `overwritten whenever the parent component re-renders. ` +
            `Instead, use a data or computed property based on the prop's ` +
            `value. Prop being mutated: "${key}"`,
            vm
          )
        }
      })
    } else {
      defineReactive(props, key, value)
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, `_props`, key)
    }
  }
  toggleObserving(true)
}
```
props 的初始化主要过程，就是遍历 propsOptions 来定义的 props 配置。

遍历的过程主要做两件事情：
* 调用 defineReactive 方法把每个 prop 对应的值变成响应式，可以通过 vm._props.xxx 访问到定义 props 中对应的属性
* 通过 proxy 把 vm._props.xxx 的访问代理到 vm.xxx 上

#### initData
```javascript
// src/core/instance/state.js

function initData (vm: Component) {
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}
```
data 的初始化主要过程也是做两件事：
* 对定义 data 函数返回对象的遍历，通过 proxy 把每一个值 vm._data.xxx 都代理到 vm.xxx 上
* 调用 observe 方法观测整个 data 的变化，把 data 也变成响应式，可以通过 vm._data.xxx 访问到定义 data 返回函数中对应的属性

由上面的分析可以看出，无论是 data 或 props ，其初始化的目的都是将其变成响应式对象，那么接下来分析这过程中出现的几个函数：
* proxy 函数
* observe 函数
* defineReactive 函数
### proxy
首先介绍 proxy 函数，其功能是将 data 和 props 上的属性代理到 vm 实例上，这也就是我们为什么在 data 或 props 上定义属性，通过 vm 就能访问的原因：
```javascript
// src/core/instance/state.js

const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```
proxy 方法的实现很简单，通过 Object.defineProperty 把 `target[sourceKey][key]` 的读写变成了对 `target[key]` 的读写。

所以对于 props 而言，对 vm._props.xxx 的读写变成了 vm.xxx 的读写，而对于 vm._props.xxx 我们可以访问到定义在 props 中的属性，所以我们就可以通过 vm.xxx 访问到定义在 props 中的 xxx 属性了。

同理，对于 data 而言，对 vm._data.xxxx 的读写变成了对 vm.xxxx 的读写，而对于 vm._data.xxxx 我们可以访问到定义在 data 函数返回对象中的属性，所以我们就可以通过 vm.xxxx 访问到定义在 data 函数返回对象中的 xxxx 属性了。
### observe
### Observer
### defineReactive
### 总结