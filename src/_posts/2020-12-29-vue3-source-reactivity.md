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
### 依赖收集
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