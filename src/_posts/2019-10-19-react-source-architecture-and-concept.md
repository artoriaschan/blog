---
title: React 16.x 源码解读(一)
subtitle: 整体架构和全新概念
date: 2019-10-19
tags:
  - react
author: ArtoriasChan
location: Beijing  
---
## 前言
我们可以从[官网](https://react.docschina.org/docs/thinking-in-react.html)看到React的理念：
> 我们认为，React 是用 JavaScript 构建快速响应的大型 Web 应用程序的首选方式。它在 Facebook 和 Instagram 上表现优秀。


## React 15.x 架构
React从v15升级到v16后重构了整个架构。本节我们聊聊v15，看看他为什么不能满足速度快，响应自然的理念，以至于被重构。

React15架构可以分为两层：

Reconciler（协调器）—— 负责找出变化的组件
Renderer（渲染器）—— 负责将变化的组件渲染到页面上
### Reconciler（协调器）
我们知道，在React中可以通过this.setState、this.forceUpdate、ReactDOM.render等API触发更新。

每当有更新发生时，Reconciler会做如下工作：
* 调用函数组件、或class组件的render方法，将返回的JSX转化为虚拟DOM
* 将虚拟DOM和上次更新时的虚拟DOM对比
* 通过对比找出本次更新中变化的虚拟DOM
* 通知Renderer将变化的虚拟DOM渲染到页面上
### Renderer（渲染器）
由于React支持跨平台，所以不同平台有不同的Renderer。我们前端最熟悉的是负责在浏览器环境渲染的Renderer —— [ReactDOM](https://www.npmjs.com/package/react-dom)。

除此之外，还有：
* [ReactNative](https://www.npmjs.com/package/react-native)渲染器，渲染App原生组件
* [ReactTest](https://www.npmjs.com/package/react-test-renderer)渲染器，渲染出纯Js对象用于测试
* [ReactArt](https://www.npmjs.com/package/react-art)渲染器，渲染到Canvas, SVG 或 VML (IE8)
在每次更新发生时，Renderer接到Reconciler通知，将变化的组件渲染在当前宿主环境。

### React 15架构的缺点
在Reconciler中，mount的组件会调用[mountComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L498)，update的组件会调用[updateComponent](https://github.com/facebook/react/blob/15-stable/src/renderers/dom/shared/ReactDOMComponent.js#L877)。这两个方法都会递归更新子组件。

#### 递归更新的缺点
主流的浏览器刷新频率为60Hz，即每16.6ms（1000ms / 60Hz）浏览器刷新一次。我们知道，JS可以操作DOM，GUI渲染线程与JS线程是互斥的。所以JS脚本执行和浏览器布局、绘制不能同时执行。

在每16.6ms时间内，需要完成如下工作：

![frame](~@/assets/react-source-architecture-and-concept/frame.png)

当JS执行时间过长，超出了16.6ms，这次刷新就没有时间执行样式布局和样式绘制了。

对于React的更新来说，由于递归执行，所以更新一旦开始，中途就无法中断。当层级很深时，递归更新时间超过了16ms，用户交互就会卡顿。

那么我们可以提出了解决办法：用可中断的异步更新代替同步的更新。那么 React 15 的架构支持异步更新么？是不能的。我们可以看一个例子：
```jsx
import React from "react";

export default class App extends React.Component {
  constructor(...props) {
    super(...props);
    this.state = {
      count: 1
    };
  }
  onClick() {
    this.setState({
      count: this.state.count + 1
    });
  }
  render() {
    return (
      <ul>
        <button onClick={() => this.onClick()}>乘以{this.state.count}</button>
        <li>{1 * this.state.count}</li>
        <li>{2 * this.state.count}</li>
        <li>{3 * this.state.count}</li>
      </ul>
    );
  }
}
```
我用红色标注了更新的步骤。

![v15-example-1](~@/assets/react-source-architecture-and-concept/v15-example-1.png)

我们可以看到，Reconciler和Renderer是交替工作的，当第一个li在页面上已经变化后，第二个li再进入Reconciler。

由于整个过程都是同步的，所以在用户看来所有DOM是同时更新的。

让我们看看在React15架构中如果中途中断更新会怎么样？

![v15-example-2](~@/assets/react-source-architecture-and-concept/v15-example-2.png)

当第一个li完成更新时中断更新，即步骤3完成后中断更新，此时后面的步骤都还未执行。

用户本来期望123变为246。实际却看见更新不完全的DOM！

基于这个原因，React决定重写整个架构。
## React 16.x 架构
React16架构可以分为三层：
* **Scheduler**（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
* **Reconciler**（协调器）—— 负责找出变化的组件
* **Renderer**（渲染器）—— 负责将变化的组件渲染到页面上

可以看到，相较于 React 15，React 16 中新增了 **Scheduler（调度器）**，让我们来了解下他。
### Scheduler（调度器）
在 React 16 中所有有关 Scheduler(调度器) 的实现都在 packages/scheduler 中，[scheduler](https://www.npmjs.com/package/scheduler)是独立于React的库

既然我们以浏览器是否有剩余时间作为任务中断的标准，那么我们需要一种机制，当浏览器有剩余时间时通知我们。

其实部分浏览器已经实现了这个API，这就是[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)。但是由于以下因素，React放弃使用：
* 浏览器兼容性
* 触发频率不稳定，受很多因素影响。比如当我们的浏览器切换tab后，之前tab注册的requestIdleCallback触发的频率会变得很低

关于该 requestIdleCallback 详细的解读可以看一下之前的[文章](https://artoriaschan.github.io/blog/2019/05/03/requestidlecallback/)。

基于以上原因，React实现了功能更完备的requestIdleCallbackpolyfill，这就是Scheduler。除了在空闲时触发回调的功能外，Scheduler还提供了多种调度优先级供任务设置。
### Reconciler（协调器）
我们知道，在 React 15 中 Reconciler 是递归处理虚拟DOM的。让我们看看 React 16 的 [Reconciler](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L1646)。

> 由于 Reconciler 也是平台无关的，所以 React 为他们单独发了一个包[react-Reconciler](https://www.npmjs.com/package/react-reconciler)。

我们可以看见，更新工作从递归变成了可以中断的循环过程。每次循环都会调用shouldYield判断当前是否有剩余时间。
```javascript
/** @noinline */
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```
那么React16是如何解决中断更新时DOM渲染不完全的问题呢？

在React16中，Reconciler与Renderer不再是交替工作。当Scheduler将任务交给Reconciler后，Reconciler会为变化的虚拟DOM打上代表增/删/更新的标记，类似这样：
```javascript
// You can change the rest (and add more).
export const Placement = /*                    */ 0b0000000000000000010;
export const Update = /*                       */ 0b0000000000000000100;
export const PlacementAndUpdate = /*           */ 0b0000000000000000110;
export const Deletion = /*                     */ 0b0000000000000001000;
```
> 全部的[标记](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberFlags.js)

整个Scheduler与Reconciler的工作都在内存中进行。只有当所有组件都完成Reconciler的工作，才会统一交给Renderer。

> 你可以在[这里](https://react.docschina.org/docs/codebase-overview.html#fiber-reconciler)看到 React 官方对 React 16 Fiber Reconciler 的解释
### Renderer（渲染器）
Renderer 根据 Reconciler 为虚拟DOM打的标记，同步执行对应的DOM操作。

所以，对于我们在上一节使用过的 demo, 在 React 16 架构中整个更新流程为：

![v16-example](~@/assets/react-source-architecture-and-concept/v16-example.png)

其中红框中的步骤随时可能由于以下原因被中断：
* 有其他更高优任务需要先更新
* 当前帧没有剩余时间

由于红框中的工作都在内存中进行，不会更新页面上的DOM，所以即使反复中断，用户也不会看见更新不完全的DOM（即上一节演示的情况）。

由于 Reconciler 是 React 对外提供的独立的包，我们可以根据其开放的API，自定义自己的 Renderer。

> [[Youtube] Building a Custom React Renderer | Sophie Alpert 🚀](https://www.youtube.com/watch?reload=9&v=CGpMlWVcHok&list=PLPxbbTqCLbGHPxZpw4xj_Wwg8-fdNxJRh&index=7)
## Fiber
根据 [Dan Abramov](https://mobile.twitter.com/dan_abramov) 博客中的一篇关于[代数效应](https://overreacted.io/algebraic-effects-for-the-rest-of-us/)文章中我们可以知道，React核心团队成员Sebastian Markbåge（React Hooks的发明者）曾说：我们在React中做的就是践行代数效应（Algebraic Effects）。

至于什么是代数效应，可以看一下上段提到的 Dan Abramov 博客中的那篇关于代数效应的文章，这里不过多的展开了。大概的讲述一下代数效应。

代数效应是一项研究中的编程语言特性。具体表现为当代码逻辑进入效应处理器后，在处理完副作用后返回继续执行剩余的逻辑。并且代数效应这种方式可以将代码中的 what 和 how 分开，这让你在写代码时可以把更多的精力放到关注 what 上。

React 中的 [Hooks](https://react.docschina.org/docs/hooks-intro.html) 和 [Suspense](https://react.docschina.org/docs/concurrent-mode-suspense.html) 的灵感都来自代数效应。
### 心智模型
#### #**代数效应和Generator**
从React 15到React 16，协调器（Reconciler）重构的一大目的是：将老的同步更新的架构变为异步可中断更新。

异步可中断更新可以理解为：更新在执行过程中可能会被打断（浏览器时间分片用尽或有更高优任务插队），当可以继续执行时恢复之前执行的中间状态。

其实，浏览器原生就支持类似的实现，这就是 Generator。

但是Generator的一些缺陷使React团队放弃了他：
* 类似 async，Generator 也是传染性的，使用了 Generator 则上下文的其他函数也需要作出改变。这样心智负担比较重。
* Generator 执行的中间状态是上下文关联的。

考虑如下例子：
```javascript
function* doWork(A, B, C) {
  var x = doExpensiveWorkA(A);
  yield;
  var y = x + doExpensiveWorkB(B);
  yield;
  var z = y + doExpensiveWorkC(C);
  return z;
}
```
每当浏览器有空闲时间都会依次执行其中一个 doExpensiveWork，当时间用尽则会中断，当再次恢复时会从中断位置继续执行。

只考虑“单一优先级任务的中断与继续”情况下Generator可以很好的实现异步可中断更新。

但是当我们考虑“高优先级任务插队”的情况，如果此时已经完成 doExpensiveWorkA 与 doExpensiveWorkB 计算出x与y。

此时B组件接收到一个高优更新，由于 Generator 执行的中间状态是上下文关联的，所以计算y时无法复用之前已经计算出的x，需要重新计算。

如果通过全局变量保存之前执行的中间状态，又会引入新的复杂度。

> 更详细的解释可以参考这个[issue](https://github.com/facebook/react/issues/7942#issuecomment-254987818)

基于这些原因，React没有采用Generator实现协调器。
#### #**代数效应和Fiber**
Fiber并不是计算机术语中的新名词，他的中文翻译叫做纤程，与进程（Process）、线程（Thread）、协程（Coroutine）同为程序执行过程。

在很多文章中将纤程理解为协程的一种实现。在JS中，协程的实现便是 Generator。

所以，我们可以将纤程(Fiber)、协程(Generator)理解为代数效应思想在JS中的体现。

React Fiber 可以理解为：

React 内部实现的一套状态更新机制。支持任务不同优先级，可中断与恢复，并且恢复后可以复用之前的中间状态。

其中每个任务更新单元为 React Element 对应的 Fiber 节点。
### 实现原理
在 React 中虚拟DOM有一个正式的称呼 —— Fiber
#### #起源
> 最早的Fiber官方解释来源于2016年 React 团队成员 Acdlite 的一篇[介绍](https://github.com/acdlite/react-fiber-architecture)。

从上一章的学习我们知道：

在React15及以前，Reconciler采用递归的方式创建虚拟DOM，递归过程是不能中断的。如果组件树的层级很深，递归会占用线程很多时间，造成卡顿。

为了解决这个问题，React16将递归的无法中断的更新重构为异步的可中断更新，由于曾经用于递归的虚拟DOM数据结构已经无法满足需要。于是，全新的Fiber架构应运而生。
#### #含义
Fiber包含三层含义：
* 作为架构来说，之前 React 15 的 Reconciler 采用递归的方式执行，数据保存在递归调用栈中，所以被称为 Stack Reconciler。React 16 的 Reconciler 基于 Fiber 节点实现，被称为 Fiber Reconciler。
* 作为静态的数据结构来说，每个 Fiber 节点对应一个 React element，保存了该组件的类型（函数组件/类组件/原生组件等）、对应的DOM节点等信息。
* 作为动态的工作单元来说，每个 Fiber 节点保存了本次更新中该组件改变的状态、要执行的工作（需要被删除/被插入页面中/被更新等）。
#### #结构
你可以从这里看到[Fiber节点的属性定义](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiber.new.js#L116)。虽然属性很多，但我们可以按三层含义将他们分类来看。
```javascript
// packages/react-reconciler/src/ReactFiber.new.js

function FiberNode(
  tag: WorkTag,
  pendingProps: mixed,
  key: null | string,
  mode: TypeOfMode,
) {
  // 实例静态属性
  this.tag = tag;
  this.key = key;
  this.elementType = null;
  this.type = null;
  this.stateNode = null;

  // 链接其他Fiber实例的属性
  this.return = null;
  this.child = null;
  this.sibling = null;
  this.index = 0;

  this.ref = null;

  // 作为动态的工作单元的属性
  this.pendingProps = pendingProps;
  this.memoizedProps = null;
  this.updateQueue = null;
  this.memoizedState = null;
  this.dependencies = null;

  this.mode = mode;

  // Effects
  this.flags = NoFlags;
  this.subtreeFlags = NoFlags;
  this.deletions = null;

  // 调用优先级相关属性
  this.lanes = NoLanes;
  this.childLanes = NoLanes;

  this.alternate = null;

  if (enableProfilerTimer) {
    // Note: The following is done to avoid a v8 performance cliff.
    //
    // Initializing the fields below to smis and later updating them with
    // double values will cause Fibers to end up having separate shapes.
    // This behavior/bug has something to do with Object.preventExtension().
    // Fortunately this only impacts DEV builds.
    // Unfortunately it makes React unusably slow for some applications.
    // To work around this, initialize the fields below with doubles.
    //
    // Learn more about this here:
    // https://github.com/facebook/react/issues/14365
    // https://bugs.chromium.org/p/v8/issues/detail?id=8538
    this.actualDuration = Number.NaN;
    this.actualStartTime = Number.NaN;
    this.selfBaseDuration = Number.NaN;
    this.treeBaseDuration = Number.NaN;

    // It's okay to replace the initial doubles with smis after initialization.
    // This won't trigger the performance cliff mentioned above,
    // and it simplifies other profiler code (including DevTools).
    this.actualDuration = 0;
    this.actualStartTime = -1;
    this.selfBaseDuration = 0;
    this.treeBaseDuration = 0;
  }
  // ...
}
```
* **架构方面**

每个Fiber节点有个对应的React element，多个Fiber节点是如何连接形成树呢？靠如下三个属性：
```javascript
// 指向父级Fiber节点
this.return = null;
// 指向子Fiber节点
this.child = null;
// 指向右边第一个兄弟Fiber节点
this.sibling = null;
```
举一个例子：
```jsx
function App() {
  return (
    <div>
      hello
      <span>react</span>
    </div>
  )
}
```
对应的 Fiber 树结构如下图所示：
![fiber-tree](~@/assets/react-source-architecture-and-concept/fiber-tree.png)

* **静态数据结构**

作为一种静态的数据结构，保存了组件相关的信息：
```javascript
// Fiber对应组件的类型 Function/Class/Host...
this.tag = tag;
// key属性
this.key = key;
// 大部分情况同type，某些情况不同，比如FunctionComponent使用React.memo包裹
this.elementType = null;
// 对于 FunctionComponent，指函数本身，对于ClassComponent，指class，对于HostComponent，指DOM节点tagName
this.type = null;
// Fiber对应的真实DOM节点
this.stateNode = null;
```
* **动态工作单元**

作为动态的工作单元，Fiber中如下参数保存了本次更新相关的信息，我们会在后续的更新流程中使用到具体属性时再详细介绍：
```javascript
// 作为动态的工作单元的属性
this.pendingProps = pendingProps;
this.memoizedProps = null;
this.updateQueue = null;
this.memoizedState = null;
this.dependencies = null;

this.mode = mode;

// Effects
this.flags = NoFlags;
this.subtreeFlags = NoFlags;
this.deletions = null;
```

如下两个字段保存调度优先级相关的信息，会在讲解Scheduler时介绍。
```javascript
// 调度优先级相关
this.lanes = NoLanes;
this.childLanes = NoLanes;
```
::: warning
在2020年5月，调度优先级策略经历了比较大的重构。以 expirationTime 属性为代表的优先级模型被lane取代。详见[这个PR](https://github.com/facebook/react/pull/18796)
:::
### 工作原理
#### 双缓存
首先我们需要了解一下 “双缓存” 技术。这里用我们比较熟悉的 canvas 来举例。

当我们用canvas绘制动画，每一帧绘制前都会调用ctx.clearRect清除上一帧的画面。

如果当前帧画面计算量比较大，导致清除上一帧画面到绘制当前帧画面之间有较长间隙，就会出现白屏。

为了解决这个问题，我们可以在内存中绘制当前帧动画，绘制完毕后直接用当前帧替换上一帧画面，由于省去了两帧替换间的计算时间，不会出现从白屏到出现画面的闪烁情况。

这种**在内存中构建并直接替换的技术**叫做双缓存。

React使用“双缓存”来完成Fiber树的构建与替换——对应着DOM树的创建与更新。
#### 双缓存Fiber树
在React中最多会同时存在两棵Fiber树。当前屏幕上显示内容对应的Fiber树称为current Fiber树，正在内存中构建的Fiber树称为workInProgress Fiber树。

current Fiber树中的Fiber节点被称为current fiber，workInProgress Fiber树中的Fiber节点被称为workInProgress fiber，他们通过alternate属性连接。
```javascript
workInProgress.alternate = current;
current.alternate = workInProgress;
```
React应用的根节点通过current指针在不同Fiber树的rootFiber间切换来实现Fiber树的切换。

当workInProgress Fiber树构建完成交给Renderer渲染在页面上后，应用根节点的current指针指向workInProgress Fiber树，此时workInProgress Fiber树就变为current Fiber树。

每次状态更新都会产生新的workInProgress Fiber树，通过current与workInProgress的替换，完成DOM更新。
#### mount时构建Fiber tree
考虑如下例子：
```jsx
function App() {
  const [num, add] = useState(0);
  return (
    <p onClick={() => add(num + 1)}>{num}</p>
  )
}

ReactDOM.render(<App/>, document.getElementById('root'));
```
1. 首先，首次执行 ReactDOM.render 会创建 fiberRootNode（源码中叫 fiberRoot ）和 rootFiber。其中 fiberRootNode 是整个应用的根节点，rootFiber 是`<App/>`所在组件树的根节点。

之所以要区分 fiberRootNode 与 rootFiber，是因为在应用中我们可以多次调用 ReactDOM.render 渲染不同的组件树，他们会拥有不同的 rootFiber。但是整个应用的根节点只有一个，那就是fiberRootNode。

fiberRootNode的current会指向当前页面上已渲染内容对应对Fiber树，被称为current Fiber树。
![mount-fiber-tree-1](~@/assets/react-source-architecture-and-concept/mount-fiber-tree-1.png)
```javascript
// packages/react-reconciler/src/ReactFiberRoot.new.js -> createFiberRoot function

// Cyclic construction. This cheats the type system right now because
// stateNode is any.
const uninitializedFiber = createHostRootFiber(tag);
root.current = uninitializedFiber;
```
由于是首屏渲染，页面中还没有挂载任何DOM，所以fiberRootNode.current指向的rootFiber没有任何子Fiber节点（即current Fiber树为空）。

2. 接下来进入 render 阶段，根据组件返回的 JSX 在内存中依次创建 Fiber 节点并连接在一起构建 Fiber 树，被称为 workInProgress Fiber 树。（下图中右侧为内存中构建的树，左侧为页面显示的树）
![mount-fiber-tree-2](~@/assets/react-source-architecture-and-concept/mount-fiber-tree-2.png)
3. 图中右侧已构建完的 workInProgress Fiber 树在commit阶段渲染到页面。

此时DOM更新为右侧树对应的样子。fiberRootNode 的 current 指针指向 workInProgress Fiber 树使其变为 current Fiber 树。
![mount-fiber-tree-3](~@/assets/react-source-architecture-and-concept/mount-fiber-tree-3.png)
#### update时替换Fiber tree
1. 接下来我们点击 p 节点触发状态改变，这会开启一次新的render阶段并构建一棵新的 workInProgress Fiber 树。
![update-fiber-tree-1](~@/assets/react-source-architecture-and-concept/update-fiber-tree-1.png)
和 mount 时一样，workInProgress fiber 的创建可以复用 current Fiber 树对应的节点数据。

> 这个决定是否复用的过程就是Diff算法

2. workInProgress Fiber 树在 render 阶段完成构建后进入commit阶段渲染到页面上。渲染完毕后，workInProgress Fiber 树变为 current Fiber 树。
![update-fiber-tree-2](~@/assets/react-source-architecture-and-concept/update-fiber-tree-2.png)
## 文件结构
根据前文的介绍，我们已经知道 React 16 的架构分为三层：
* Scheduler（调度器）—— 调度任务的优先级，高优任务优先进入Reconciler
* Reconciler（协调器）—— 负责找出变化的组件
* Renderer（渲染器）—— 负责将变化的组件渲染到页面上

那么架构是如何体现在源码的文件结构上呢，让我们一起看看吧。
### 顶层目录
```
根目录
  ├── fixtures        # 包含一些给贡献者准备的小型 React 测试项目
  ├── packages        # 包含元数据（比如 package.json）和 React 仓库中所有 package 的源码（子目录 src）
  ├── scripts         # 各种工具链的脚本，比如git、jest、eslint等
```
虽然结构看起来很像lerna，但实际上react的项目没有使用lerna来进行组织。但是和lerna项目一样，这里我们重点关注 packages 文件夹。
### packages目录
目录下的文件夹非常多，我们来看下：

#### react
React的核心，包含所有全局 React API，如：
* React.createElement
* React.Component
* React.Children

这些 API 是全平台通用的，它不包含ReactDOM、ReactNative等平台特定的代码。在 NPM 上作为单独的一个[包](https://www.npmjs.com/package/react)发布。
#### scheduler
Scheduler（调度器）的实现。也是一个单独的[NPM包](https://www.npmjs.com/package/scheduler)。
#### Renderer相关文件夹
```
packages
  ├──react-art
  ├──react-dom                 # 注意这同时是DOM和SSR（服务端渲染）的入口
  ├──react-native-renderer
  ├──react-noop-renderer       # 用于debug fiber（后面会介绍fiber）
  ├──react-test-renderer
```
#### [react-reconciler](https://www.npmjs.com/package/react-reconciler)文件夹
我们需要重点关注 react-reconciler ，在接下来源码学习中 80%的代码量都来自这个包。

虽然他是一个实验性的包，内部的很多功能在正式版本中还未开放。但是他一边对接Scheduler，一边对接不同平台的Renderer，构成了整个 React16 的架构体系。
> 虽然这已经在 React 16 中启用了，但是 async 特性还没有默认开启。

至于结构性的源码概览，可以看一下官网的[源码概览](https://react.docschina.org/docs/codebase-overview.html)。
## 调试源码
即使版本号相同（当前最新版为17.0.0），但是 `facebook/react` 项目 `master` 分支的代码和我们使用 `create-react-app` 创建的项目 `node_modules` 下的 `react` 项目代码还是有些区别。

因为React的新代码都是直接提交到 `master` 分支，而 `create-react-app` 内的 `react` 使用的是稳定版的包。

为了始终使用最新版 React 教学，我们调试源码遵循以下步骤：
* 从 `facebook/react` 项目 `master` 分支拉取最新源码
* 基于最新源码构建 `react` 、 `scheduler` 、 `react-dom` 三个包
* 通过 `create-react-app` 创建测试项目，并使用步骤2创建的包作为项目依赖的包
### 拉取源码
拉取 `facebook/react` 代码：
```sh
# 拉取代码
git clone https://github.com/facebook/react.git
# github cli
gh repo clone facebook/react
```
安装依赖
```sh
# 切入到react源码所在文件夹
cd react

# 安装依赖
yarn
```
打包react、scheduler、react-dom三个包为dev环境可以使用的cjs包。
```sh
yarn build react/index,react-dom/index,scheduler --type=NODE
```
> 对每一步更详细的介绍可以参考React文档[源码贡献章节](https://zh-hans.reactjs.org/docs/how-to-contribute.html#development-workflow)
::: warning
17.0.0 版本执行命令：
```sh
yarn build react,react-dom,scheduler --type=NODE
```
:::
现在源码目录 `build/node_modules` 下会生成最新代码的包。我们为 `react` 、 `react-dom` 创建 `yarn link`。
```sh
cd build/node_modules/react
# 申明react指向
yarn link
cd build/node_modules/react-dom
# 申明react-dom指向
yarn link
```
### 创建项目
接下来我们通过create-react-app在其他地方创建新项目。
```sh
yarn create react-app [YOUR-PROJECT-NAME]
```
在新项目中，将react与react-dom2个包指向facebook/react下我们刚才生成的包。
```sh
# 将项目内的react react-dom指向之前申明的包
yarn link react react-dom
```
这样在 `react/build/node_modules/react-dom/cjs/react-dom.development.js` 中的任意修改都会在项目运行时显示出来。可以很方便我们对源码进行调试和分析。