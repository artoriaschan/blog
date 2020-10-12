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
observe 函数的功能就是用来监测数据的变化，它的定义在 src/core/observer/index.js 中：
```javascript
// src/core/observer/index.js

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```
observe 函数的作用就是给非 VNode 的对象类型数据添加一个 Observer，如果已经添加过则直接返回，否则在满足一定条件下去实例化一个 Observer 对象实例。
实例化Observer也有几个判断条件：
* shouldObserve 为 true：这是在 src/core/observer/index.js 中的全局变量
* !isServerRendering()：不是SSR
* value 为对象或是数组
* value 为可扩展的对象
* value 不是vm实例对象

那么接下来我们来看一下 Observer 类的作用。
### Observer
Observer 是一个类，它的作用是给对象的属性添加 getter 和 setter，用于依赖收集和派发更新：
```javascript
// src/core/observer/index.js

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}
```
Observer 类的构造函数逻辑很简单，首先实例化 Dep 对象，这块稍后会介绍。

接着通过执行 def 函数把自身实例添加到数据对象 value 的 `__ob__` 属性上，def 的定义在 src/core/util/lang.js 中：
```javascript
// src/core/util/lang.js

/**
 * Define a property.
 */
export function def (obj: Object, key: string, val: any, enumerable?: boolean) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
```
def 函数是一个非常简单的Object.defineProperty 的封装，这就是为什么我在开发中输出 data 上对象类型的数据，会发现该对象多了一个 `__ob__` 的属性。

回到 Observer 类的构造函数中，接下来对 value 进行判断，对于数组，则处理其原型方法，有两种处理方式，根据对象是否原生有 `__proto__` 属性来区分：
* 有的话则是直接赋值处理
* 没有的话则是直接修改 value 上的对应的方法

然后统一调用 observeArray 方法处理 value 数组，其核心还是遍历数组元素调用 observe 函数。

而对于非数组 value 则是遍历对象的 key 调用 defineReactive 方法，那么我们来看一下这个方法是做什么的。
### defineReactive
```javascript
// src/core/observer/index.js

/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}
```
defineReactive 函数最开始初始化 Dep 对象的实例，接着拿到 obj 的属性描述符，然后对子对象递归调用 observe 方法，这样就保证了无论 obj 的结构多复杂，它的所有子属性也能变成响应式的对象，这样我们访问或修改 obj 中一个嵌套较深的属性，也能触发 getter 和 setter。

最后利用 Object.defineProperty 去给 obj 的属性 key 添加 getter 和 setter。而关于 getter 和 setter 的具体实现，我们会在之后介绍。
### 总结
这一节我们介绍了响应式对象，核心就是利用 Object.defineProperty 给数据添加了 getter 和 setter，目的就是为了在我们访问数据以及写数据的时候能自动执行一些逻辑：getter 做的事情是依赖收集，setter 做的事情是派发更新，那么在接下来的章节我们会重点对这两个过程分析。

## 依赖是如何收集的
### 前言
通过上一节的分析我们了解 Vue 会把普通对象变成响应式对象，响应式对象 getter 相关的逻辑就是做依赖收集，这一节我们来详细分析这个过程。

首先我们先看一下 getter 部分的逻辑：
```javascript
// src/core/observer/index.js

/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    // ...
  })
}
```
我们看 get 方法里的处理逻辑是和 dep 实例相关的，通过 dep.depend 方法收集依赖。当然还有 childOb 的判断，这个之后在讨论他的作用。

我们首先看看 Dep 类的作用。
### Dep
Dep 是整个 getter 依赖收集的核心，它的定义在 src/core/observer/dep.js 中：
```javascript
// src/core/observer/dep.js

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```
Dep 类中定义了一些属性和方法，这里需要注意一下 Dep.target 这一个静态属性，这是一个全局唯一的 Watcher，这是一个非常巧妙的设计，因为在同一时间只能有一个全局的 Watcher 被计算，另外它的自身属性 subs 也是 Watcher 的数组。

Dep 实际上就是对 Watcher 的一种管理，Dep 脱离 Watcher 单独存在是没有意义的，为了完整地讲清楚依赖收集过程，我们有必要看一下 Watcher 的一些相关实现。
### Watcher
它的定义在 src/core/observer/watcher.js 中：
```javascript
// src/core/observer/watcher.js

let uid = 0

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: SimpleSet;
  newDepIds: SimpleSet;
  before: ?Function;
  getter: Function;
  value: any;

  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
```
Watcher 是一个 Class，在它的构造函数中，定义了一些和 Dep 相关的属性：
```javascript
this.deps = []
this.newDeps = []
this.depIds = new Set()
this.newDepIds = new Set()
```
其中，this.deps 和 this.newDeps 表示 Watcher 实例持有的 Dep 实例的数组；而 this.depIds 和 this.newDepIds 分别代表 this.deps 和 this.newDeps 的 id Set。

Watcher 还定义了一些原型的方法，和依赖收集相关的有 get、addDep 和 cleanupDeps 方法，单个介绍它们的实现不方便理解，我会结合整个依赖收集的过程把这几个方法讲清楚。
### 过程分析
之前我们介绍当对数据对象的访问会触发他们的 getter 方法，那么这些对象什么时候被访问呢？还记得之前我们介绍过 Vue 的 mount 过程是通过 mountComponent 函数，其中有一段比较重要的逻辑，大致如下：
```javascript
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
new Watcher(vm, updateComponent, noop, {
  before () {
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate')
    }
  }
}, true /* isRenderWatcher */)
```
当我们去实例化一个渲染 watcher 的时候，首先进入 watcher 类的构造函数逻辑，然后会执行它的 this.get() 方法，进入 get 函数，首先会执行：
```javascript
export default class Watcher {
  // ...
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    // ...
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    pushTarget(this)
    // ...
  }
  // ...
```
pushTarget 的定义在 src/core/observer/dep.js 中，用来维护 targetStack 栈和当前渲染的 Watcher 实例的，这个实例时挂载到 Dep.target 的静态属性上的：
```javascript
export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}
```
这个方法的核心逻辑就是就是把 Dep.target 赋值为当前的渲染 watcher 并压栈（为了恢复用）。接着又执行了：
```javascript
value = this.getter.call(vm, vm)
```
this.getter 对应就是 updateComponent 函数，这实际上就是在执行：
```javascript
vm._update(vm._render(), hydrating)
```
它会先执行 vm._render() 方法，因为之前分析过这个方法会生成 渲染 VNode，并且在这个过程中会对 vm 上的数据访问，这个时候就触发了数据对象的 getter。

那么每个对象值的 getter 都持有一个 dep，在触发 getter 的时候会调用 dep.depend() 方法，也就会执行 Dep.target.addDep(this)。

而这时 Dep.target 已经被赋值为当前渲染的 Watcher，那么就执行到 addDep 方法：
```javascript
/**
 * Add a dependency to this directive.
 */
addDep (dep: Dep) {
  const id = dep.id
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id)
    this.newDeps.push(dep)
    if (!this.depIds.has(id)) {
      dep.addSub(this)
    }
  }
}
```
这时候会做一些逻辑判断（保证同一数据不会被添加多次）后执行 dep.addSub(this)，那么就会执行 this.subs.push(sub)，也就是说把当前的 watcher 订阅到这个数据持有的 dep 的 subs 中，这个目的是为后续数据变化时候能通知到哪些 subs 做准备。

所以在 vm._render() 过程中，会触发所有数据的 getter，这样实际上已经完成了一个依赖收集的过程。那么到这里就结束了么，其实并没有，在完成依赖收集后，还有几个逻辑要执行，首先是：
```javascript
// "touch" every property so they are all tracked as
// dependencies for deep watching
if (this.deep) {
  traverse(value)
}
```
这个是要递归去访问 value，触发它所有子项的 getter，这个之后会详细讲。接下来执行：
```javascript
popTarget()
// src/core/observer/dep.js

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```
实际上就是把 Dep.target 恢复成上一个状态，因为当前 vm 的数据依赖收集已经完成，那么对应的渲染Dep.target 也需要改变。

最后执行：
```javascript
this.cleanupDeps()

/**
 * Clean up for dependency collection.
 */
cleanupDeps () {
  let i = this.deps.length
  while (i--) {
    const dep = this.deps[i]
    if (!this.newDepIds.has(dep.id)) {
      dep.removeSub(this)
    }
  }
  let tmp = this.depIds
  this.depIds = this.newDepIds
  this.newDepIds = tmp
  this.newDepIds.clear()
  tmp = this.deps
  this.deps = this.newDeps
  this.newDeps = tmp
  this.newDeps.length = 0
}
```
该方法是负责依赖清空的。每次数据变化都会重新 render，那么 vm._render() 方法又会再次执行，并再次触发数据的 getters，所以 Watcher 在构造函数中会初始化 2 个 Dep 实例数组，newDeps 表示新添加的 Dep 实例数组，而 deps 表示上一次添加的 Dep 实例数组。

在执行 cleanupDeps 函数的时候，会首先遍历 deps，移除对 dep.subs 数组中 Wathcer 的订阅，然后把 newDepIds 和 depIds 交换，newDeps 和 deps 交换，并把 newDepIds 和 newDeps 清空。

那么为什么需要做 deps 订阅的移除呢，在添加 deps 的订阅过程，已经能通过 id 去重避免重复订阅了。

考虑到一种场景，我们的模板会根据 v-if 去渲染不同子模板 a 和 b，当我们满足某种条件的时候渲染 a 的时候，会访问到 a 中的数据，这时候我们对 a 使用的数据添加了 getter，做了依赖收集，那么当我们去修改 a 的数据的时候，理应通知到这些订阅者。那么如果我们一旦改变了条件渲染了 b 模板，又会对 b 使用的数据添加了 getter，如果我们没有依赖移除的过程，那么这时候我去修改 a 模板的数据，会通知 a 数据的订阅的回调，这显然是有浪费的。

因此 Vue 设计了在每次添加完新的订阅，会移除掉旧的订阅，这样就保证了在我们刚才的场景中，如果渲染 b 模板的时候去修改 a 模板的数据，a 数据订阅回调已经被移除了，所以不会有任何浪费，真的是非常赞叹 Vue 对一些细节上的处理。
### 总结
![deps-collection](~@/assets/vue-source-reactive-system/deps-collection.png)

通过这一节的分析，我们对 Vue 数据的依赖收集过程已经有了认识，并且对这其中的一些细节做了分析。收集依赖的目的是为了当这些响应式数据发生变化，触发它们的 setter 的时候，能知道应该通知哪些订阅者去做相应的逻辑处理，我们把这个过程叫派发更新，其实 Watcher 和 Dep 就是一个非常经典的观察者设计模式的实现，下一节我们来详细分析一下派发更新的过程。

## 如何派发依赖更新
### 前言
通过上文分析我们了解了响应式数据依赖收集过程，收集的目的就是为了当我们修改数据的时候，可以对相关的依赖派发更新，那么这一节我们来详细分析这个过程。

下面让我们回顾一下 defineReactive 中的 setter 部分：
```javascript
// src/core/observer/index.js

/**
 * Define a reactive property on an Object.
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    // ...
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}
```
上面代码有两个关键的点：
* `childOb = !shallow && observe(newVal)`：如果 shallow 为 false 的情况，会对新设置的值变成一个响应式对象
* dep.notify()：通知所有的订阅者，这是派发依赖更新的关键
### 过程分析
当我们在组件中对响应的数据做了修改，就会触发 setter 的逻辑，最后调用 dep.notify() 方法， 它是 Dep 的一个实例方法，定义在 src/core/observer/dep.js 中：
```javascript
// src/core/observer/dep.js

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  // ...
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}
```
由上面的分析我们可以知道，this.subs 中存放的则是 Watcher 实例的数组。所以这里的逻辑非常简单，就是遍历 this.subs 中的 Watcher实例，然后分别调用实例方法 update，进行更新操作：
```javascript
export default class Watcher {
  // ...
  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }
  // ...
}
```
这里对于 Watcher 的不同状态，会执行不同的逻辑，这里我们稍后再讲。

在一般组件数据更新的场景，会走到最后一个 queueWatcher(this) 的逻辑，queueWatcher 的定义在 src/core/observer/scheduler.js 中：
```javascript
// src/core/observer/scheduler.js

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    if (!waiting) {
      waiting = true

      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      nextTick(flushSchedulerQueue)
    }
  }
}
```
这里引入了一个队列的概念，这也是 Vue 在做派发更新的时候的一个优化的点，它并不会每次数据改变都触发 watcher 的回调，而是把这些 watcher 先添加到一个队列里，然后在 nextTick 后执行 flushSchedulerQueue。

这里我们也可以看到，在开发环境的时候则不是在 nextTick 之后执行 flushSchedulerQueue，而是直接执行。

这里还有几点要说：
* 用 has 对象保证同一个 Watcher 只添加一次
* 对 flushing 的判断，本质上用 flushing 来控制 watcher 实例插入队列的逻辑，这部分稍后展开

至于 nextTick 的实现，我们稍后展开。现在我们先看一下 flushSchedulerQueue 的实现：
```javascript
// src/core/observer/scheduler.js

let flushing = false
let index = 0

// ...

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow()
  flushing = true
  let watcher, id

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort((a, b) => a.id - b.id)

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    watcher.run()
    // in dev build, check and stop circular updates.
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  const activatedQueue = activatedChildren.slice()
  const updatedQueue = queue.slice()

  resetSchedulerState()

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue)
  callUpdatedHooks(updatedQueue)

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}
```
这里有几个重要的逻辑要梳理一下:
* **队列排序**

由源码注释可知，`queue.sort((a, b) => a.id - b.id)` 对队列做了从小到大的排序，这么做主要有以下要确保以下几点：
* 1.组件的更新由父到子；因为父组件的创建过程是先于子的，所以 watcher 的创建也是先父后子，执行顺序也应该保持先父后子。
* 2.用户的自定义 watcher 要优先于渲染 watcher 执行；因为用户自定义 watcher 是在渲染 watcher 之前创建的。
* 3.如果一个组件在父组件的 watcher 执行期间被销毁，那么它对应的 watcher 执行都可以被跳过，所以父组件的 watcher 应该先执行。

* **队列遍历**

在对 queue 排序后，接着就是要对它做遍历，拿到对应的 watcher，执行 watcher.run()。

这里需要注意两个细节：
* 一个是在执行 flushSchedulerQueue 方法的时候，开始就执行了 `flushing = true`，将该标志位置为 true；
* 第二个则是在遍历的时候每次都会对 queue.length 求值，因为在 watcher.run() 的时候，很可能用户会再次添加新的 watcher

那么我们在看一下 queueWatcher 中这部分逻辑： 
```javascript
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = true
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // ...
  }
}
```
可以看到，这时候 flushing 为 true，就会执行到 else 的逻辑，然后就会从后往前找，找到第一个待插入 watcher 的 id 比当前队列中 watcher 的 id 大的位置。把 watcher 按照 id的插入到队列中，因此 queue 的长度发生了变化。
* **状态恢复**

这个过程就是执行 resetSchedulerState 函数，它的定义在 src/core/observer/scheduler.js 中。
```javascript
const queue: Array<Watcher> = []
const activatedChildren: Array<Component> = []
let has: { [key: number]: ?true } = {}
let circular: { [key: number]: number } = {}
let waiting = false
let flushing = false
let index = 0

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0
  has = {}
  if (process.env.NODE_ENV !== 'production') {
    circular = {}
  }
  waiting = flushing = false
}
```
逻辑非常简单，就是把这些控制流程状态的一些变量恢复到初始值，把 watcher 队列清空。

接下来我们继续分析 watcher.run() 的逻辑：
```javascript
// src/core/observer/watcher.js

export default class Watcher {
  // ...
  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }
  // ...
}
```
run 函数逻辑很简单：
* 先通过 this.get() 得到它当前的值
* 然后做判断，如果满足新旧值不等、新值是对象类型、deep 模式任何一个条件，则执行 watcher 的回调
注意回调函数执行的时候会把第一个和第二个参数传入新值 value 和旧值 oldValue，这就是当我们添加自定义 watcher 的时候能在回调函数的参数中拿到新旧值的原因。

那么对于渲染 watcher 而言，它在执行 this.get() 方法求值的时候，会执行 getter 方法：
```javascript
updateComponent = () => {
  vm._update(vm._render(), hydrating)
}
```
所以这就是当我们去修改组件相关的响应式数据的时候，会触发组件重新渲染的原因，接着就会重新执行 patch 的过程，但它和首次渲染有所不同。
### 总结
![deps-update](~@/assets/vue-source-reactive-system/deps-update.png)

通过这一节的分析，我们对 Vue 数据修改派发更新的过程也有了认识，实际上就是当数据发生变化的时候，触发 setter 逻辑，把在依赖过程中订阅的的所有观察者，也就是 watcher，都触发它们的 update 过程，这个过程又利用了队列做了进一步优化，在 nextTick 后执行所有 watcher 的 run，最后执行它们的回调函数。nextTick 是 Vue 一个比较核心的实现了，下一节我们来重点分析它的实现。

## nextTick 的实现原理
### 前言
nextTick 是 Vue 的一个核心实现，在介绍 Vue 的 nextTick 之前，为了方便大家理解，我先简单介绍一下 JS 的运行机制。
### JS的事件循环
JS 执行是单线程的，它是基于事件循环的。事件循环大致分为以下几个步骤：
* 所有同步任务都在主线程上执行，形成一个执行栈（execution context stack）。
* 主线程之外，还存在一个"任务队列"（task queue）。只要异步任务有了运行结果，就在"任务队列"之中放置一个事件。
* 一旦"执行栈"中的所有同步任务执行完毕，系统就会读取"任务队列"，看看里面有哪些事件。那些对应的异步任务，于是结束等待状态，进入执行栈，开始执行。
* 主线程不断重复上面的第三步。
![event-loop](~@/assets/vue-source-reactive-system/event-loop.png)

主线程的执行过程就是一个 tick，而所有的异步结果都是通过 “任务队列” 来调度。 消息队列中存放的是一个个的任务（task）。

因为这样导致事件循环的粒度较大，因此在 ES6 的时候引入了 宏队列 和 微队列 的概念。规范中规定 task 分为两大类，分别是 macro task 和 micro task，并且每个 macro task 结束后，都要清空所有的 micro task。

在浏览器环境中，常见的 macro task 有 setTimeout、MessageChannel、postMessage、setImmediate；常见的 micro task 有 MutationObsever 和 Promise.then。
### Vue中的实现
在 Vue 源码 2.5+ 后，nextTick 的实现单独有一个 JS 文件来维护它，它的源码并不多，总共也就 100 多行，其中还有一部分注释，所以这部分的代码逻辑理解起来还是很简单的。

接下来我们来看一下它的实现：
```javascript
// src/core/util/next-tick.js

import { noop } from 'shared/util'
import { handleError } from './error'
import { isIE, isIOS, isNative } from './env'

export let isUsingMicroTask = false

const callbacks = []
let pending = false

function flushCallbacks () {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

// Here we have async deferring wrappers using microtasks.
// In 2.5 we used (macro) tasks (in combination with microtasks).
// However, it has subtle problems when state is changed right before repaint
// (e.g. #6813, out-in transitions).
// Also, using (macro) tasks in event handler would cause some weird behaviors
// that cannot be circumvented (e.g. #7109, #7153, #7546, #7834, #8109).
// So we now use microtasks everywhere, again.
// A major drawback of this tradeoff is that there are some scenarios
// where microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690, which have workarounds)
// or even between bubbling of the same event (#6566).
let timerFunc

// The nextTick behavior leverages the microtask queue, which can be accessed
// via either native Promise.then or MutationObserver.
// MutationObserver has wider support, however it is seriously bugged in
// UIWebView in iOS >= 9.3.3 when triggered in touch event handlers. It
// completely stops working after triggering a few times... so, if native
// Promise is available, we will use it:
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}

export function nextTick (cb?: Function, ctx?: Object) {
  let _resolve
  callbacks.push(() => {
    if (cb) {
      try {
        cb.call(ctx)
      } catch (e) {
        handleError(e, ctx, 'nextTick')
      }
    } else if (_resolve) {
      _resolve(ctx)
    }
  })
  if (!pending) {
    pending = true
    timerFunc()
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => {
      _resolve = resolve
    })
  }
}
```
下面我们来梳理一下他的实现逻辑和兼容性处理：
* 可以从首段注释中看到关于 nextTick 的实现也是经过了多轮的思考，目前的版本则是将 microtask 的优先级放到最高
* 首先判断是否原生支持 Promise，若有，则以 Promise 实现 timerFunc
* 若没有则再判断是否支持 MutationObserver，若有则用 MutationObserver 的 API 实现 timerFunc
* 若没有则再判断是否支持 setImmediate，当然这也代表这 nextTick 的实现降级到 macrotask
* 最后则是使用 setTimeout 来实现 timerFunc 函数

关于timerFunc，传入的则是事先声明好的基于 callbacks 数组实现的回调函数执行器 flushCallbacks。所以现在再来分析 nextTick 的原理就很简单了：其执行逻辑就是将传入的 cb 经过 handleError 处理放入到 callbacks，同时若当前没有在上一个 timerFunc 的执行期间——即 pending 标志位为 false——则启动 timerFunc 执行。而 timerFunc 则是使用微/宏任务进行封装的回调函数执行器 flushCallbacks。他会遍历当前的 callbacks 中的回调函数，并且依次执行。

nextTick 函数最后还有一段逻辑：
```javascript
if (!cb && typeof Promise !== 'undefined') {
  return new Promise(resolve => {
    _resolve = resolve
  })
}
```
这是当 nextTick 不传 cb 参数的时候，提供一个 Promise 化的调用，比如：
```javascript
nextTick().then(() => {})
```
当 _resolve 函数执行，就会跳到 then 的逻辑中。
### 总结
Vue.js 提供了 2 种调用 nextTick 的方式，一种是全局 API Vue.nextTick，一种是实例上的方法 vm.$nextTick，无论我们使用哪一种，最后都是调用 next-tick.js 中实现的 nextTick 方法。