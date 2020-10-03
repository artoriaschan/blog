---
title: Vue 2.x 源码解读(二):组件化
date: 2019-08-22
tags:
  - vue
author: ArtoriasChan
location: Beijing  
---
## 前言
Vue.js 另一个核心思想是组件化。

所谓组件化，就是把页面拆分成多个组件 (component)，每个组件依赖的 CSS、JavaScript、模板、图片等资源放在一起开发和维护。组件是资源独立的，组件在系统内部可复用，组件和组件之间可以嵌套。

我们在用 Vue.js 开发实际项目的时候，就是像搭积木一样，编写一堆组件拼装生成页面。组件之间通过各种方式进行状态的修改和更新，就可以生成一个复杂的页面出来。

所以我们需要了解组件在Vue内部是如何处理的，才能帮助我们更好的理解和应用组件的思想。

我们以vue-cli生成的代码为例进行组件初始化的分析：
```javascript
new Vue({
  render: h => h(App)
}).$mount("#app");
```
这段代码在创建Vue实例时，是手动传入的render函数，经过上一篇文章的解析可以知道，该 Vue 实例手动传入render函数时，是不经过Vue内部编译过程生成render函数的。

同时传入createElement方法的不是一个tag，而是一个组件对象。接下来我们来分析这一过程。

## createComponent 函数是如何创建vnode对象的

### _createElement 函数
从上一篇分析中我们可以知道，_createElement 函数中有一段对于 tag 参数的判断，进而执行不同的处理逻辑。对于component来说，会调用 createComponent 函数来创建 VNode 对象，代码如下：
```javascript
// src/core/vdom/create-element.js -> _createElement function

if (typeof tag === 'string') {
  let Ctor
  ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag)
  if (config.isReservedTag(tag)) {
    // platform built-in elements
    if (process.env.NODE_ENV !== 'production' && isDef(data) && isDef(data.nativeOn)) {
      warn(
        `The .native modifier for v-on is only valid on components but it was used on <${tag}>.`,
        context
      )
    }
    vnode = new VNode(
      config.parsePlatformTagName(tag), data, children,
      undefined, undefined, context
    )
  } else if ((!data || !data.pre) && isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
    // component
    vnode = createComponent(Ctor, data, context, children, tag)
  } else {
    // unknown or unlisted namespaced elements
    // check at runtime because it may get assigned a namespace when its
    // parent normalizes children
    vnode = new VNode(
      tag, data, children,
      undefined, undefined, context
    )
  }
} else {
  // direct component options / constructor
  vnode = createComponent(tag, data, context, children)
}
```
这一片举的例子是传入的一个 App 对象，它本质上是一个 Component 类型，那么它会走到上述代码的 else 逻辑，直接通过 createComponent 方法来创建 vnode。

下面我们来看一下 createComponent 函数的实现：
```javascript
// src/core/vdom/create-component.js

export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  if (isUndef(Ctor)) {
    return
  }

  const baseCtor = context.$options._base

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }

  // async component
  let asyncFactory
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor)
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {}

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor)

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data)
  }

  // extract props
  const propsData = extractPropsFromVNodeData(data, Ctor, tag)

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  const listeners = data.on
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    const slot = data.slot
    data = {}
    if (slot) {
      data.slot = slot
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data)

  // return a placeholder vnode
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  if (__WEEX__ && isRecyclableComponent(vnode)) {
    return renderRecyclableComponentTemplate(vnode)
  }

  return vnode
}
```
可以看到，createComponent 的逻辑也会有一些复杂，但是分析源码比较推荐的是只分析核心流程，分支流程可以之后针对性的看，所以这里针对组件渲染这个 case 主要就 3 个关键步骤：
* 构造子类构造函数
* 安装组件钩子函数
* 实例化 vnode 对象

### 构造子类构造函数
```javascript
  const baseCtor = context.$options._base

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor)
  }
```
在这里 baseCtor 实际上就是 Vue 构造函数，这个的定义是在最开始初始化 Vue 的阶段，在 src/core/global-api/index.js 中的 initGlobalAPI 函数有这么一段逻辑：
```javascript
// src/core/global-api/index.js -> initGlobalAPI function

// this is used to identify the "base" constructor to extend all plain-object
// components with in Weex's multi-instance scenarios.
Vue.options._base = Vue
```
而在 src/core/instance/init.js 里 Vue 原型上的 _init 函数中有合并 options 到实例 vm.$options 上的逻辑：
```javascript
// src/core/instance/init.js -> initMixin function

// merge options
if (options && options._isComponent) {
  // optimize internal component instantiation
  // since dynamic options merging is pretty slow, and none of the
  // internal component options needs special treatment.
  initInternalComponent(vm, options)
} else {
  vm.$options = mergeOptions(
    resolveConstructorOptions(vm.constructor),
    options || {},
    vm
  )
}
```
所以我们也就能通过 vm.$options._base 拿到 Vue 这个构造函数了。

接下来我们看一下extend方法的实现，最核心的实现在 src/core/global-api/extend.js 中：
```javascript
// src/core/global-api/extend.js -> initExtend function

/**
 * Class inheritance
 */
Vue.extend = function (extendOptions: Object): Function {
  extendOptions = extendOptions || {}
  const Super = this
  const SuperId = Super.cid
  const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }

  const name = extendOptions.name || Super.options.name
  if (process.env.NODE_ENV !== 'production' && name) {
    validateComponentName(name)
  }

  const Sub = function VueComponent (options) {
    this._init(options)
  }
  Sub.prototype = Object.create(Super.prototype)
  Sub.prototype.constructor = Sub
  Sub.cid = cid++
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  )
  Sub['super'] = Super

  // For props and computed properties, we define the proxy getters on
  // the Vue instances at extension time, on the extended prototype. This
  // avoids Object.defineProperty calls for each instance created.
  if (Sub.options.props) {
    initProps(Sub)
  }
  if (Sub.options.computed) {
    initComputed(Sub)
  }

  // allow further extension/mixin/plugin usage
  Sub.extend = Super.extend
  Sub.mixin = Super.mixin
  Sub.use = Super.use

  // create asset registers, so extended classes
  // can have their private assets too.
  ASSET_TYPES.forEach(function (type) {
    Sub[type] = Super[type]
  })
  // enable recursive self-lookup
  if (name) {
    Sub.options.components[name] = Sub
  }

  // keep a reference to the super options at extension time.
  // later at instantiation we can check if Super's options have
  // been updated.
  Sub.superOptions = Super.options
  Sub.extendOptions = extendOptions
  Sub.sealedOptions = extend({}, Sub.options)

  // cache constructor
  cachedCtors[SuperId] = Sub
  return Sub
}
```
Vue.extend 的作用就是构造一个 Vue 的子类，它使用一种非常经典的原型继承的方式把一个纯对象转换一个继承于 Vue 的构造器 Sub 并返回。

然后对 Sub 这个对象本身扩展了一些属性，如扩展 options、添加全局 API 等。

并且对配置中的 props 和 computed 做了初始化工作；最后对于这个 Sub 构造函数做了缓存，避免多次执行 Vue.extend 的时候对同一个子组件重复构造。

这样当我们去实例化 Sub 的时候，就会执行 this._init 逻辑再次走到了 Vue 实例的初始化逻辑：
```javascript
const Sub = function VueComponent (options) {
  this._init(options)
}
```
### 安装组件钩子函数
```javascript
// install component management hooks onto the placeholder node
installComponentHooks(data)
```
Vue.js 使用的 Virtual DOM 参考的是开源库 snabbdom，它的一个特点是在 VNode 的 patch 流程中对外暴露了各种时机的钩子函数，方便我们做一些额外的事情。

Vue.js 也是充分利用这一点，在初始化一个 Component 类型的 VNode 的过程中实现了几个钩子函数：
```javascript
// src/core/vdom/create-component.js

// inline hooks to be invoked on component VNodes during patch
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },

  prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    const options = vnode.componentOptions
    const child = vnode.componentInstance = oldVnode.componentInstance
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    )
  },

  insert (vnode: MountedComponentVNode) {
    const { context, componentInstance } = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance)
      } else {
        activateChildComponent(componentInstance, true /* direct */)
      }
    }
  },

  destroy (vnode: MountedComponentVNode) {
    const { componentInstance } = vnode
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy()
      } else {
        deactivateChildComponent(componentInstance, true /* direct */)
      }
    }
  }
}
// ...
function installComponentHooks (data: VNodeData) {
  const hooks = data.hook || (data.hook = {})
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const existing = hooks[key]
    const toMerge = componentVNodeHooks[key]
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
    }
  }
}
```
整个 installComponentHooks 的过程就是把 componentVNodeHooks 的钩子函数合并到 data.hook 中。

在 VNode 执行 patch 的过程中执行相关的钩子函数，具体的执行我们稍后在介绍 patch 过程中会详细介绍。

这里要注意的是合并策略，在合并过程中，如果某个时机的钩子已经存在 data.hook 中，那么通过执行 mergeHook 函数做合并，这个逻辑很简单，就是在最终执行的时候，依次执行这两个钩子函数即可。

### VNode 实例化
```javascript
// return a placeholder vnode
const name = Ctor.options.name || tag
const vnode = new VNode(
  `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
  data, undefined, undefined, undefined, context,
  { Ctor, propsData, listeners, tag, children },
  asyncFactory
)
```
可以看到是调用 new VNode 来创建 vnode 实例，前一篇文章我们分析过 VNode 构造函数的参数：
```javascript
// src/core/vdom/vnode.js -> VNode class

constructor (
  tag?: string,
  data?: VNodeData,
  children?: ?Array<VNode>,
  text?: string,
  elm?: Node,
  context?: Component,
  componentOptions?: VNodeComponentOptions,
  asyncFactory?: Function
) {
  //...
}
```
可以看到，组件调用构造函数时是不传递children的，而是在传递 componentOptions 时携带上 children。

### 总结
这一节我们分析了 createComponent 的实现，了解到它在渲染一个组件的时候的 3 个关键逻辑：构造子类构造函数，安装组件钩子函数和实例化 vnode。

createComponent 后返回的是组件 vnode，它也一样走到 vm._update 方法，进而执行了 patch 函数，我们在上一篇文章对 patch 函数做了简单的分析，那么下一节我们会对它做进一步的分析。

## update

### 前言
通过前一章的分析我们知道，当我们通过 createComponent 创建了组件 VNode，接下来会走到 vm._update，执行 `vm.__patch__` 去把 VNode 转换成真正的 DOM 节点。

这个过程我们在前一篇文章已经分析过了，但是针对一个普通的 VNode 节点，接下来我们来看看组件的 VNode 会有哪些不一样的地方。

patch 的过程会调用 createElm 创建元素节点，回顾一下 createElm 的实现，它的定义在 src/core/vdom/patch.js 中：
```javascript
function createElm (
  vnode,
  insertedVnodeQueue,
  parentElm,
  refElm,
  nested,
  ownerArray,
  index
) {
  // ...
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return
  }
  // ...
}
```
### createComponent 函数如何创建组件的
接下来看一下 createComponent 函数的实现：
```javascript
function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
  let i = vnode.data
  if (isDef(i)) {
    const isReactivated = isDef(vnode.componentInstance) && i.keepAlive
    if (isDef(i = i.hook) && isDef(i = i.init)) {
      i(vnode, false /* hydrating */)
    }
    // after calling the init hook, if the vnode is a child component
    // it should've created a child instance and mounted it. the child
    // component also has set the placeholder vnode's elm.
    // in that case we can just return the element and be done.
    if (isDef(vnode.componentInstance)) {
      initComponent(vnode, insertedVnodeQueue)
      insert(parentElm, vnode.elm, refElm)
      if (isTrue(isReactivated)) {
        reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm)
      }
      return true
    }
  }
}
```
可以看到 createComponent 函数中主要的步骤有三部：
* 判断 vnode.data 是否定义
* 判断 data.hook.init 钩子是否存在，存在则执行该钩子方法
* 判断是否存在 vnode.componentInstance ，如果存在则执行 hooks ，并将生成的 vnode.elm 更新到父元素上

首先对 vnode.data 做了一些判断：
```javascript
let i = vnode.data
if (isDef(i)) {
  // ...
  if (isDef(i = i.hook) && isDef(i = i.init)) {
    i(vnode, false /* hydrating */)
    // ...
  }
  // ..
}
```
如果 vnode 是一个组件 VNode，那么条件会满足，并且得到 i 就是 init 钩子函数。

回顾上节我们在创建组件 VNode 的时候合并钩子函数中就包含 init 钩子函数，定义在 src/core/vdom/create-component.js 中：
```javascript
// src/core/vdom/create-component.js -> componentVNodeHooks const

init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
  if (
    vnode.componentInstance &&
    !vnode.componentInstance._isDestroyed &&
    vnode.data.keepAlive
  ) {
    // kept-alive components, treat as a patch
    const mountedNode: any = vnode // work around flow
    componentVNodeHooks.prepatch(mountedNode, mountedNode)
  } else {
    const child = vnode.componentInstance = createComponentInstanceForVnode(
      vnode,
      activeInstance
    )
    child.$mount(hydrating ? vnode.elm : undefined, hydrating)
  }
}
```
init 钩子函数执行也很简单，s先不考虑 keepAlive 的情况，它是通过 createComponentInstanceForVnode 创建一个 Vue 的实例，然后调用 $mount 方法挂载子组件。

先来看一下 createComponentInstanceForVnode 的实现：
```javascript
// src/core/vdom/create-component.js

export function createComponentInstanceForVnode (
  vnode: any, // we know it's MountedComponentVNode but flow doesn't
  parent: any, // activeInstance in lifecycle state
): Component {
  const options: InternalComponentOptions = {
    _isComponent: true,
    _parentVnode: vnode,
    parent
  }
  // check inline-template render functions
  const inlineTemplate = vnode.data.inlineTemplate
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render
    options.staticRenderFns = inlineTemplate.staticRenderFns
  }
  return new vnode.componentOptions.Ctor(options)
}
```
createComponentInstanceForVnode 函数的目的是构造的一个内部组件的参数，然后执行 new vnode.componentOptions.Ctor(options)。

这里的 vnode.componentOptions.Ctor 对应的就是子组件的构造函数，我们上一节分析了它实际上是继承于 Vue 的一个构造器 Sub，相当于 new Sub(options) 这里有几个关键参数要注意几个点，_isComponent 为 true 表示它是一个组件，parent 表示当前激活的组件实例。

所以子组件的实例化实际上就是在这个时机执行的，并且它会执行实例的 _init 方法，这个过程有一些和之前不同的地方需要挑出来说，代码在 src/core/instance/init.js 中：
```javascript
// src/core/instance/init.js -> initMixin function

Vue.prototype._init = function (options?: Object) {
  // ...
  // merge options
  if (options && options._isComponent) {
    // optimize internal component instantiation
    // since dynamic options merging is pretty slow, and none of the
    // internal component options needs special treatment.
    initInternalComponent(vm, options)
  } else {
    vm.$options = mergeOptions(
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )
  }
  // ...
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}
```
先是合并options时，_isComponent 为 true，所以走到了 initInternalComponent 过程，这个函数的实现如下：
```javascript
// src/core/instance/init.js 

export function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}
```
这个过程我们重点记住以下几个点即可：opts.parent = options.parent、opts._parentVnode = parentVnode。

它们是把之前我们通过 createComponentInstanceForVnode 函数传入的几个参数合并到内部的选项 $options 里了。

在 _init 方法最后的代码，我们可以看到组件初始化的时候是不传 el 的，因此组件是自己接管了 $mount 的过程。

回到创建组件函数 createComponent 中，在调用 init 钩子函数的过程中，在完成实例化的 _init 后，接着会执行 child.$mount(hydrating ? vnode.elm : undefined, hydrating) 。它最终会调用 mountComponent 方法，进而执行 vm._render() 方法：
```javascript
// src/core/instance/render.js -> renderMixin function

Vue.prototype._render = function (): VNode {
  const vm: Component = this
  const { render, _parentVnode } = vm.$options
  // set parent vnode. this allows render functions to have access
  // to the data on the placeholder node.
  vm.$vnode = _parentVnode
  // render self
  let vnode
  try {
    vnode = render.call(vm._renderProxy, vm.$createElement)
  } catch (e) {
    // ...
  }
  // set parent
  vnode.parent = _parentVnode
  return vnode
}
```
我们只保留关键部分的代码，这里的 _parentVnode 就是当前组件的父 VNode，而 render 函数生成的 vnode 当前组件的渲染 vnode，vnode 的 parent 指向了 _parentVnode，也就是 vm.$vnode，它们是一种父子的关系。

我们知道在执行完 vm._render 生成 VNode 后，接下来就要执行 vm._update 去渲染 VNode 了。来看一下组件渲染的过程中有哪些需要注意的，vm._update 的定义在 src/core/instance/lifecycle.js 中：
```javascript
// src/core/instance/lifecycle.js -> lifecycleMixin function

Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const vm: Component = this
  const prevEl = vm.$el
  const prevVnode = vm._vnode
  const restoreActiveInstance = setActiveInstance(vm)
  vm._vnode = vnode
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  restoreActiveInstance()
  // update __vue__ reference
  if (prevEl) {
    prevEl.__vue__ = null
  }
  if (vm.$el) {
    vm.$el.__vue__ = vm
  }
  // if parent is an HOC, update its $el as well
  if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
    vm.$parent.$el = vm.$el
  }
  // updated hook is called by the scheduler to ensure that children are
  // updated in a parent's updated hook.
}
```
_update 方法过程中有几个关键的代码，首先 vm._vnode = vnode 的逻辑。

这个 vnode 是通过 vm._render() 返回的组件渲染 VNode，vm._vnode 和 vm.$vnode 的关系就是一种父子关系，用代码表达就是：
```javascript
vm._vnode.parent === vm.$vnode
```
还有一段比较有意思的代码：
```javascript
export let activeInstance: any = null
// ...
export function setActiveInstance(vm: Component) {
  const prevActiveInstance = activeInstance
  activeInstance = vm
  return () => {
    activeInstance = prevActiveInstance
  }
}
// ...
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  const restoreActiveInstance = setActiveInstance(vm)
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  restoreActiveInstance()
}
```
这个 activeInstance 作用就是保持当前上下文的 Vue 实例，它是在 lifecycle 模块的全局变量，定义是 `export let activeInstance: any = null`，并且在之前我们调用 createComponentInstanceForVnode 方法的时候从 lifecycle 模块获取，并且作为参数传入的。

因为实际上 JavaScript 是一个单线程，Vue 整个初始化是一个深度遍历的过程，在实例化子组件的过程中，它需要知道当前上下文的 Vue 实例是什么，并把它作为子组件的父 Vue 实例。

之前我们提到过对子组件的实例化过程先会调用 initInternalComponent(vm, options) 合并 options，把 parent 存储在 vm.$options 中，在 $mount 之前会调用 initLifecycle(vm) 方法：

```javascript
// src/core/instance/lifecycle.js

export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = null
  vm._directInactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}
```
可以看到 vm.$parent 就是用来保留当前 vm 的父实例，并且通过 parent.$children.push(vm) 来把当前的 vm 存储到父实例的 $children 中。

在 vm._update 的过程中，把当前的 vm 赋值给 activeInstance，同时通过 `const prevActiveInstance = activeInstance` 用 prevActiveInstance 保留上一次的 activeInstance。实际上

，prevActiveInstance 和当前的 vm 是一个父子关系，当一个 vm 实例完成它的所有子树的 patch 或者 update 过程后，activeInstance 会回到它的父实例，这样就完美地保证了 createComponentInstanceForVnode 整个深度遍历过程中，我们在实例化子组件的时候能传入当前子组件的父 Vue 实例，并在 _init 的过程中，通过 vm.$parent 把这个父子关系保留。

那么回到 _update，最后就是调用 `__patch__` 渲染 VNode 了。
```javascript
// src/core/instance/lifecycle.js -> lifecycleMixin function

vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)

// src/core/vdom/patch.js -> createPatchFunction function

function patch (oldVnode, vnode, hydrating, removeOnly) {
  // ...
  let isInitialPatch = false
  const insertedVnodeQueue = []

  if (isUndef(oldVnode)) {
    // empty mount (likely as component), create new root element
    isInitialPatch = true
    createElm(vnode, insertedVnodeQueue)
  } else {
    // ...
  }
  // ...
}
```
这里又回到了本节开始的过程，之前分析过负责渲染成 DOM 的函数是 createElm，注意这里我们只传了 2 个参数，所以对应的 parentElm 是 undefined。我们再来看看它的定义：
```javascript
function createElm (
  vnode,
  insertedVnodeQueue,
  parentElm,
  refElm,
  nested,
  ownerArray,
  index
) {
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return
  }

  const data = vnode.data
  const children = vnode.children
  const tag = vnode.tag
  if (isDef(tag)) {
    // ...
    vnode.elm = vnode.ns
      ? nodeOps.createElementNS(vnode.ns, tag)
      : nodeOps.createElement(tag, vnode)
    setScope(vnode)

    /* istanbul ignore if */
    if (__WEEX__) {
      // ...
    } else {
      createChildren(vnode, children, insertedVnodeQueue)
      if (isDef(data)) {
        invokeCreateHooks(vnode, insertedVnodeQueue)
      }
      insert(parentElm, vnode.elm, refElm)
    }

    if (process.env.NODE_ENV !== 'production' && data && data.pre) {
      creatingElmInVPre--
    }
  } else if (isTrue(vnode.isComment)) {
    vnode.elm = nodeOps.createComment(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  } else {
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  }
}
```
注意，这里我们传入的 vnode 是组件渲染的 vnode，也就是我们之前说的 vm._vnode，如果组件的根节点是个普通元素，那么 vm._vnode 也是普通的 vnode，这里 createComponent(vnode, insertedVnodeQueue, parentElm, refElm) 的返回值是 false。

接下来的过程就和上一篇文章一样了，先创建一个父节点占位符，然后再遍历所有子 VNode 递归调用 createElm，在遍历的过程中，如果遇到子 VNode 是一个组件的 VNode，则重复本节开始的过程，这样通过一个递归的方式就可以完整地构建了整个组件树。

### 总结
那么到此，一个组件的 VNode 是如何创建、初始化、渲染的过程也就介绍完毕了。

在对组件化的实现有一个大概了解后，接下来我们来介绍一下这其中的一些细节。我们知道编写一个组件实际上是编写一个 JavaScript 对象，对象的描述就是各种配置，之前我们提到在 _init 的最初阶段执行的就是 merge options 的逻辑，那么下一节我们从源码角度来分析合并配置的过程。