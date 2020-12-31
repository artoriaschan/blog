---
title: Vue 3.0 源码解读(二)
subtitle: 响应式系统
date: 2020-12-29
tags:
  - vue
  - vue 3.0
author: ArtoriasChan
location: Beijing  
---
## 前言
在 `Vue 2.x` 中，我们知道**响应式是 Vue 组件化更新渲染的一个核心机制**。

在介绍 `Vue 3.0` 响应式实现之前，我们先来回顾一下 `Vue 2.x` 响应式实现的部分：
* 它在内部通过 `Object.defineProperty API` 劫持数据的变化
* 在数据被访问的时候`收集依赖`
* 在数据被修改的时候`通知依赖更新`。

我们用一张图可以直观地看清这个流程。
![vue2-reactivity](~@assets/posts/vue3-source-reactivity/vue2-reactivity.png)

在 `Vue 2.x` 中， `Watcher` 就是依赖，有专门针对组件渲染的 `render watcher`。
注意这里有两个流程：
* 首先是`依赖收集`流程，组件在 `render` 的时候会访问模板中的数据，触发 `getter` 把 `render watcher` 作为依赖收集，并和数据建立联系
* 然后是`派发通知`流程，当我对这些数据修改的时候，会触发 `setter`，通知 `render watcher` 更新，进而触发了组件的重新渲染。

但是这边劫持数据使用的 `Object.defineProperty API` 有一些缺陷：
* 不能检测到对象属性的新增和删除
* 初始化阶段的递归执行劫持数据带来一定的性能负担

`Vue 3.0` 为了解决这些问题，摒弃了 `Object.defineProperty API` ，改用 `Proxy API` 来重构了响应式部分，下面我们来看一下 `Vue 3.0` 具体的实现细节。
## 响应式系统实现差异
在 `Vue 2.x` 中我们使用 `Options API` 来组织我们的代码，只要我们在 `data`、`props`、`computed` 中定义数据，那么它就是响应式的，举个例子：
```vue {9-13}
<template>
  <div>
    <p>{{ msg }}</p>
    <button @click="change">change msg</button>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        msg: 'msg reactive'
      }
    },
    methods: {
      change() {
        this.msg = 'msg reactive!'
      }
    }
  }
</script>
```
上述例子在首次渲染时，会在页面上渲染 `"msg reactive"` ，如果当我们点击按钮后，`msg` 的值发生改变，进而页面重新渲染，并且展示为使我们修改后的 `msg` 值 。

但是如果我们模板部分不变，JS代码稍作一下的修改：
```vue
<script>
  export default {
    created(){
      this.msg = 'msg reactive'
    },
    methods: {
      change() {
        this.msg = 'msg reactive!'
      }
    }
  }
</script>
```
该例子在首次渲染时，也会在页面上渲染 `"msg reactive"` ，但是当我们点击按钮后，则不会发生页面的重新渲染。

根本原因是我们在 `created` 中定义的 `this.msg` 并不是响应式对象，所以 `Vue` 内部不会对它做额外的处理。

在 `Vue 2.x` 中，框架会约定俗成的将 `data`、`props`、`computed` 等组件选项变成响应式的数据。这个过程相对黑盒，用户无法感知和介入的过程。

所以在使用 `Vue 2.x` 时有些技巧我们可以使用，当我们组件模板依赖一些静态数据，那我们没有必要将其放入 `data` 中声明，可以在 `created` 声明周期钩子中绑定到 `this` 中。

因为声明响应式数据有性能开销，这样可以提升应用的执行效率。

而在 `Vue 3.0` 中虽然保留了 `Options API` 的开发范式，但是他为用户提供了一个新的基于 `Composition API` 的新范式。在 `Composition API` 范式中，用户可以自己手动的去创建一个响应式数据。

例如下面这个例子：
```vue {11-13}
<template>
  <div>
    <p>{{ msg }}</p>
    <button @click="change">change msg</button>
  </div>
</template>
<script>
  import { reactive } from 'vue'
  export default {
    setup() {
      const state = reactive({
        msg: 'msg reactive'
      })
      const change = function() {
        state.msg = 'msg reactive!'
      }
      return {
        random,
        state
      }
    }
  }
</script>
```
可以看出来 `Composition API` 更推荐用户主动定义响应式对象，而非内部的黑盒处理。这样用户可以更加明确哪些数据是响应式的，如果你不想让数据变成响应式，就定义成它的原始数据类型即可。
## Reactive API
我们先看一下 `reactive` 函数的具体代码实现：
```ts
// packages/reactivity/src/reactive.ts

export const enum ReactiveFlags {
  SKIP = '__v_skip',
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw'
}
// key 为原始对象，value 为代理对象
export const reactiveMap = new WeakMap<Target, any>()
// ...
export function reactive<T extends object>(target: T): UnwrapNestedRefs<T>
export function reactive(target: object) {
  // 判断如果是 readonly proxy，则直接返回该对象。
  if (target && (target as Target)[ReactiveFlags.IS_READONLY]) {
    return target
  }
  return createReactiveObject(
    target,
    false,
    mutableHandlers,
    mutableCollectionHandlers
  )
}

function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
  collectionHandlers: ProxyHandler<any>
) {
  // 不是对象直接返回
  if (!isObject(target)) {
    return target
  }
  // 对象已经是响应式的，直接返回。
  if (
    target[ReactiveFlags.RAW] &&
    !(isReadonly && target[ReactiveFlags.IS_REACTIVE])
  ) {
    return target
  }
  // 判断当前使用哪个响应式缓存
  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  // 从缓存中获取proxy对象，若存在则直接返回
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  // 获取对象的类型
  const targetType = getTargetType(target)
  if (targetType === TargetType.INVALID) {
    return target
  }
  // 调用 Proxy 对传入对象 target 进行代理
  const proxy = new Proxy(
    target,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandlers
  )
  // 放入缓存
  proxyMap.set(target, proxy)
  return proxy
}
```
`reactive` 函数内部通过对 `createReactiveObject` 函数的调用，进而返回相应的代理对象。

而 `createReactiveObject` 函数内部有以下几个重要逻辑：
* 首先判断是否是对象，不是对象直接返回
* 判断对象是否已经是响应式对象，若是则直接返回
* 根据 `isReadonly` 参数判断使用哪个缓存
* 尝试从缓存中获取当前对象对应的代理对象，若存在则直接返回
* 然后判断对象是否存在 `__v_skip` 或者该对象无法扩展，若满足条件，则直接返回该对象
* 调用 `Proxy` 创建代理对象，并放入到相应的缓存中

可以看到，把对象变为代理对象的核心步骤则是通过 `new Proxy `，我们知道在使用 `new Proxy API` 时，不止需要传递目标对象，还需要传递一个拦截方法对象。

那我们先看一下 `mutableHandlers` 中的定义：
```ts {28-34}
// packages/reactivity/src/baseHandlers.ts

const get = /*#__PURE__*/ createGetter()
const set = /*#__PURE__*/ createSetter()
function deleteProperty(target: object, key: string | symbol): boolean {
  const hadKey = hasOwn(target, key)
  const oldValue = (target as any)[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
  }
  return result
}

function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key)
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, TrackOpTypes.HAS, key)
  }
  return result
}

function ownKeys(target: object): (string | number | symbol)[] {
  track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
  return Reflect.ownKeys(target)
}

export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
}
```
它其实就是劫持了我们对 target 对象的一些操作，比如：
* 访问对象属性会触发 `get` 函数
* 设置对象属性会触发 `set` 函数
* 删除对象属性会触发 `deleteProperty` 函数
* `in` 操作符会触发 `has` 函数
* 通过 `Object.getOwnPropertyNames` 访问对象属性名会触发 `ownKeys` 函数

因为无论命中哪个处理器函数，它都会做依赖收集和派发通知这两件事其中的一个，所以这里我只要分析常用的 `get` 和 `set` 函数就可以了。
### 依赖收集
**依赖收集发生在数据访问的阶段**，由于我们用 `Proxy API` 劫持了数据对象，所以当这个响应式对象属性被访问的时候就会执行 `get` 函数。

捕捉器 `get` 函数是 `createGetter` 函数的返回值，我们看一下 `createGetter` 函数的代码实现。
```ts
// packages/reactivity/src/baseHandlers.ts

function createGetter(isReadonly = false, shallow = false) {
  return function get(target: Target, key: string | symbol, receiver: object) {
    // 访问扩展属性 __v_isReactive，返回 !isReadonly
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      // 访问扩展属性 __v_isReadonly，返回 isReadonly
      return isReadonly
    } else if (
      key === ReactiveFlags.RAW &&
      receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)
    ) {
      // 访问扩展属性 __v_raw，并且该目标对象在缓存中存在代理对象，则直接返回该目标对象
      // __v_raw 属性中存储 原始对象
      return target
    }
    // 判断原始对象是否为数组
    const targetIsArray = isArray(target)
    if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
    // 利用 Reflect.get 获取属性值
    const res = Reflect.get(target, key, receiver)
    // 判断 key 是否为 Symbol
    const keyIsSymbol = isSymbol(key)
    // 判断 Symbol 属性是否为内建属性，还是 __v_isRef 或 __proto__ ，是的话直接返回值
    if (
      keyIsSymbol
        ? builtInSymbols.has(key as symbol)
        : key === `__proto__` || key === `__v_isRef`
    ) {
      return res
    }
    // 判断是否为 isReadonly，不是的话调用 track 函数收集依赖
    if (!isReadonly) {
      track(target, TrackOpTypes.GET, key)
    }

    if (shallow) {
      return res
    }
    // 判断是否为引用包装对象，是的话需要去掉包装
    if (isRef(res)) {
      // ref unwrapping - does not apply for Array + integer key.
      const shouldUnwrap = !targetIsArray || !isIntegerKey(key)
      return shouldUnwrap ? res.value : res
    }
    // 如果获取的属性值为对象的话，将属性值变为响应式
    if (isObject(res)) {
      // Convert returned value into a proxy as well. we do the isObject check
      // here to avoid invalid value warning. Also need to lazy access readonly
      // and reactive here to avoid circular dependency.
      return isReadonly ? readonly(res) : reactive(res)
    }
    return res
  }
}
```
可以看到，整个 `get` 函数返回值中的逻辑大致为分四部分：
* 特殊属性处理
* 使用 `Reflect.get` 获取属性值
* 使用 `track` 函数收集依赖
* 判断属性值是否为对象，并将其也变为响应式对象

从这整个的逻辑看下来，在响应式对象的属性值时，对其进行判断，如果它也是数组或对象，则递归执行 `reactive` 把 `res` 变成响应式对象。

这么做是因为 `Proxy` 劫持的是对象本身，并不能劫持子对象的变化，这点和 `Object.defineProperty API` 一致。

整个 `get` 函数最核心的部分其实是**执行 track 函数收集依赖**，下面我们重点分析这个过程。

我们先来看一下 `track` 函数的实现：
```ts
// 原始数据对象 map
const targetMap = new WeakMap<any, KeyToDepMap>()
// 当前激活的 effect
let activeEffect: ReactiveEffect | undefined
// 是否收集依赖
let shouldTrack = true

export function track(target: object, type: TrackOpTypes, key: unknown) {
  // shouldTrack 为 false 或者当前没有激活的 effect
  if (!shouldTrack || activeEffect === undefined) {
    return
  }
  // 根据原始对象，获取其收集的依赖 Map
  let depsMap = targetMap.get(target)
  // 若不存在，则往 targetMap 中新加一个 Map
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  // 根据属性 key 获取收集的依赖的 Set 集合
  let dep = depsMap.get(key)
  // 若不存在，则往 depsMap 中新加一个 Set
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  // 若依赖 Set 中没包含当前激活的 effect
  if (!dep.has(activeEffect)) {
    // 收集当前激活的 effect 作为依赖
    dep.add(activeEffect)
    // 当前激活的 effect 收集 dep 集合作为依赖
    activeEffect.deps.push(dep)
  }
}
```
在这个 `get` 函数中，**我们收集的依赖是数据变化后执行的副作用函数**。

再来看实现，我们把 `target` 作为原始的数据，`key` 作为访问的属性。

我们创建了全局的 `targetMap` 作为原始数据对象的 `Map`，它的键是 `target`，值是 `depsMap`，作为依赖的 `Map`。

这个 `depsMap` 的键是 `target` 的 `key`，值是 `dep` 集合，`dep` 集合中存储的是依赖的副作用函数。

具体的结构入下图所示：
![reactive-getter](~@assets/posts/vue3-source-reactivity/reactive-getter.png)

所以每次 `track` ，就是把当前激活的副作用函数 `activeEffect` 作为依赖，然后收集到 `target` 相关的 `depsMap` 对应 `key` 下的依赖集合 `dep` 中。
### 派发通知
## 副作用函数 Effect
## Ref API
## Computed API
### 计算属性的运行机制
### 嵌套计算属性
## Watch API
### 标准化 source
### 构造回调函数
### 创建 scheduler
### 创建 effect
### 返回销毁函数
### 异步任务队列
## 总结