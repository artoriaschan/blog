---
title: React 16.x 源码解读(二)
subtitle: 通过首次渲染看React两阶段渲染
date: 2019-10-28
tags:
  - react
author: ArtoriasChan
location: Beijing  
---
## 前言
在上一章我们知道，React 16 采用 `Scheduler - Reconciler - Renderer` 三层架构。这种调整是因为 React 15 的架构不足以职称异步更新。

React 15 对 React 16 提出的需求是Diff更新应为可中断的，那么此时又出现了两个新的两个问题:中断方式和判断标准;

React团队采用的是 `合作式调度`，即主动中断和控制器出让。判断标准为超时检测。同时还需要一种机制来告知中断的任务在何时恢复/重新执行。 React 借鉴了浏览器的 `requestIdleCallback` 接口，当浏览器有剩余时间时通知执行。

并且 React 16 将更新分为两个阶段：render 阶段和 commit 阶段。render 阶段则是为 Fiber 阶段打上标记，而 commit 阶段则是根据 render 阶段的标记同步执行对应的渲染操作。
### Concurrent Mode
React目前只有一种调度模式：同步模式。只有等 Concurrent 调度模式正式发布，才能使用第二种模式。

我们结合一下案例来探讨下这两种调度模式的区别。
```jsx
// App.js
import {createRef, Component} from "react";
import './App.css';

class App extends Component{
  constructor(props) {
    super();
    this.state = {
      count: 0
    }
    this.buttonRef = createRef();
  }

  componentDidMount() {
    const buttonElm = this.buttonRef.current;
    setTimeout( () => {
      console.log("更新任务1");
      this.setState((prevState)=>({
        count: prevState.count + 1
      }) )
    }, 500 )

    setTimeout( () => {
      console.log("更新任务2");
      buttonElm.click()
    }, 500 )
  }

  handleButtonClick = () => {
    this.setState((prevState)=>({
      count: prevState.count + 1
    }) )
  }

  render() {
    return (
      <div className="App">
        Hello,
        <span>react</span>
        {Array.from(new Array(8000)).map( (v,index) =>
          <span key={index}>{this.state.count}</span>
        )}
        <button ref={this.buttonRef} onClick={this.handleButtonClick}>计数</button>
      </div>
    )
  }
}
export default App;

// index.js
// ...
ReactDOM.render(<App />, document.getElementById('root'));
```
运行案例后，查看Chrome性能分析图：
![react-sync-profile](~@/assets/react-source-2steps-render/react-sync-profile.png)

从结果可知，尽管两个任务理应“同时”运行，但react会先把第一个任务执行完后再执行第二个任务，这就是react同步模式：
> 多个任务时，react都会按照任务顺序一个一个执行，它无法保证后面的任务能在本应执行的时间执行。（其实就是JS本身特性EventLoop的展现。比如只要一个while循环足够久，理应在某个时刻执行的方法就会被延迟到while循环结束后才运行。）

而 Concurrent 调度模式是一种支持**同时执行多个更新任务**的调度模式。

关于 Concurrent 模式的解释，官网[使用版本控制作为比喻](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html#blocking-vs-interruptible-rendering)的解释就很好的展示了 Concurrent 具体所做的事情:
::: tip 版本控制比喻
如果你在团队中工作，你可能使用了像 Git 这样的版本控制系统并在分支上进行工作。当一个分支准备就绪时，你可以将你的工作合并到 master 中，以便他人拉取。

在版本控制存在之前，开发工作流程有很大的不同。不存在分支的概念。如果你想编辑某些文件，你必须告诉所有人在你完成编辑工作之前不要触碰这些文件。你甚至不能同时和那个人研究它们 —— 实际上, 你被它们 阻塞 了。

这说明了包括 React 在内的 UI 库在目前通常是如何工作的。一旦它们开始渲染一次更新，它们不能中断包括创建新的 DOM 节点和运行组件中代码在内的工作。我们称这种方法为 “阻塞渲染”。

在 Concurrent 模式中，渲染不是阻塞的。它是可中断的。这改善了用户体验。它同时解锁了以前不可能的新功能。在我们查看下一个 章节的具体例子之前，我们将对新功能做一个高级的概述。
:::
这个例子很具体的点出了 Concurrent 模式所要达到的效果，那就是可中断渲染。

那么我们修改下上述的例子，让其切换到 Concurrent Mode。可以根据官网的[文档](https://zh-hans.reactjs.org/docs/concurrent-mode-adoption.html#enabling-concurrent-mode)进行体验实验性功能。

主要就是切换入口渲染方法：
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// ReactDOM.render(<App />, document.getElementById('root'));
ReactDOM.unstable_createRoot(document.getElementById('root')).render(<App />);
```

那么关于App组件中，修改部分代码：
```jsx
componentDidMount() {
  const buttonElm = this.buttonRef.current;
  setTimeout( () => {
    console.log("更新任务1");
    this.setState((prevState)=>({
      count: prevState.count + 1
    }) )
  }, 500 )

  setTimeout( () => {
    console.log("更新任务2");
    buttonElm.click()
  }, 600 )
}

handleButtonClick = () => {
  this.setState((prevState)=>({
    count: prevState.count + 2
  }) )
}
```
上述代码的修改主要是将两个更新任务区分开来，方便在性能分析图上进行分析：
![react-concurrent-profile](~@/assets/react-source-2steps-render/react-concurrent-profile.png)
通过上面的性能分析图我们可以知道，在 Concurrent 模式下，可以中断已经进行的渲染，优先进行高优先级的更新渲染。那么 Concurrent 模式是如何做到中断更新的呢？

在实现虚拟 DOM 的情况下，一整个渲染流程包含“基于状态更新虚拟节点”、“将更新后的虚拟节点应用于渲染”两个阶段。React 16 将前者称为 render 阶段，即渲染虚拟节点；后者称为 commit 阶段，即提交虚拟节点，完成 dom 树的渲染等。为了保证视图的一致性，commit 阶段是不能被打断的；render 阶段却可以增量执行。

至于 Concurrent 模式详细的实现原理、优先级的实现等，我们先暂时不谈。我们先把目光聚焦在上文所说的渲染流程的两个阶段上。
## 总体流程
React 16 总体流程大致如下：
![render-commit-process](~@/assets/react-source-2steps-render/render-commit-process.png)
那么我们根据一个例子来梳理首次渲染的流程：
```jsx
// App.js
import {useState} from "react";
import './App.css';

function App() {
  const [state, setState] = useState({
    count: 0
  });

  function handleButtonClick(){
    setState({
      ...state,
      count: state.count + 1
    })
  }

  return (
    <div className="App">
      Hello,
      <span>react</span>
      <p>{state.count}</p>
      <button onClick={handleButtonClick}>计数</button>
    </div>
  );
}

export default App;

// index.js
ReactDOM.render(<App />, document.getElementById('root'));
```
## Render 阶段
render 阶段开始于 `performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot` 方法的调用。这取决于本次更新是同步更新还是异步更新。
```javascript {19,38}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

// This is the entry point for synchronous tasks that don't go
// through Scheduler
function performSyncWorkOnRoot(root) {
  // ...
  flushPassiveEffects();

  let lanes;
  let exitStatus;
  if (
    root === workInProgressRoot &&
    includesSomeLane(root.expiredLanes, workInProgressRootRenderLanes)
  ) {
    // ...
  } else {
    // 对于首次渲染，workInProgressRoot 为 null，最终会走到这个分支执行 renderRootSync 函数
    lanes = getNextLanes(root, NoLanes);
    exitStatus = renderRootSync(root, lanes);
  }

  if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
    executionContext |= RetryAfterError;

    // If an error occurred during hydration,
    // discard server response and fall back to client side render.
    if (root.hydrate) {
      root.hydrate = false;
      clearContainer(root.containerInfo);
    }

    // If something threw an error, try rendering one more time. We'll render
    // synchronously to block concurrent data mutations, and we'll includes
    // all pending updates are included. If it still fails after the second
    // attempt, we'll give up and commit the resulting tree.
    lanes = getLanesToRetrySynchronouslyOnError(root);
    if (lanes !== NoLanes) {
      exitStatus = renderRootSync(root, lanes);
    }
  }

  if (exitStatus === RootFatalErrored) {
    const fatalError = workInProgressRootFatalError;
    prepareFreshStack(root, NoLanes);
    markRootSuspended(root, lanes);
    ensureRootIsScheduled(root, now());
    throw fatalError;
  }

  // We now have a consistent tree. Because this is a sync render, we
  // will commit it even if something suspended.
  const finishedWork: Fiber = (root.current.alternate: any);
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;
  commitRoot(root);

  // Before exiting, make sure there's a callback scheduled for the next
  // pending level.
  ensureRootIsScheduled(root, now());

  return null;
}
```
在上述代码的注释中，我们解释了首次渲染会执行到 else 分支，并执行 renderRootSync 函数，那么我们看一下该函数的定义：
```javascript {18-25}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function renderRootSync(root: FiberRoot, lanes: Lanes) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;
  const prevDispatcher = pushDispatcher();

  // If the root or lanes have changed, throw out the existing stack
  // and prepare a fresh one. Otherwise we'll continue where we left off.
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes);
    startWorkOnPendingInteractions(root, lanes);
  }

  const prevInteractions = pushInteractions(root);
  // ...

  do {
    try {
      workLoopSync();
      break;
    } catch (thrownValue) {
      handleError(root, thrownValue);
    }
  } while (true);

  resetContextDependencies();
  if (enableSchedulerTracing) {
    popInteractions(((prevInteractions: any): Set<Interaction>));
  }

  executionContext = prevExecutionContext;
  popDispatcher(prevDispatcher);
  // ...

  // Set this to null to indicate there's no in-progress render.
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;

  return workInProgressRootExitStatus;
}
```
我们可以看到在 `renderRootSync` 函数中最核心的一块代码则是一块 `do...while();` 循环：
```javascript
do {
  try {
    workLoopSync();
    break;
  } catch (thrownValue) {
    handleError(root, thrownValue);
  }
} while (true);
```
而 `workLoopSync` 函数的定义如下，通过 while 循环同步执行 `performUnitOfWork` 函数，传入的参数则是 `workInProgress`：
```javascript {8}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

// The work loop is an extremely hot path. Tell Closure not to inline it.
/** @noinline */
function workLoopSync() {
  // Already timed out, so perform work without checking if we need to yield.
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}
```
那么我们接着看 `performUnitOfWork` 函数的执行逻辑是什么：
```javascript {12,15}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function performUnitOfWork(unitOfWork: Fiber): void {
  // The current, flushed, state of this fiber is the alternate. Ideally
  // nothing should rely on this, but relying on it here means that we don't
  // need an additional field on the work in progress.
  const current = unitOfWork.alternate;
  // ...
  let next;
  if (enableProfilerTimer && (unitOfWork.mode & ProfileMode) !== NoMode) {
    startProfilerTimer(unitOfWork);
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
    stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
  } else {
    next = beginWork(current, unitOfWork, subtreeRenderLanes);
  }
  // ...
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }

  ReactCurrentOwner.current = null;
}
```
`performUnitOfWork` 函数的逻辑很简单，尽管有几个判断，但大致逻辑就是调用 beginWork 函数 获得 next Fiber，若 next Fiber 为 null，则调用 completeUnitOfWork 函数结束当前任务；若 next 不为空，则将 next 赋值给 workInProgress，以便使 workLoopSync 函数中循环的条件继续成立。

其中的 `(unitOfWork.mode & ProfileMode) !== NoMode` 判断条件则是需要我们来理解 Fiber 中的 mode 这个枚举属性代表什么意思及所有的枚举值有哪些：
```javascript
// packages/react-reconciler/src/ReactInternalTypes.js

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber = {|
  // ...
  // Bitfield that describes properties about the fiber and its subtree. E.g.
  // the ConcurrentMode flag indicates whether the subtree should be async-by-
  // default. When a fiber is created, it inherits the mode of its
  // parent. Additional flags can be set at creation time, but after that the
  // value should remain unchanged throughout the fiber's lifetime, particularly
  // before its child fibers are created.
  mode: TypeOfMode,
  // ...
|};

// packages/react-reconciler/src/ReactTypeOfMode.js

export type TypeOfMode = number;

export const NoMode = 0b00000;  // 普通模式，同步渲染
export const StrictMode = 0b00001;  // 严格模式，用来检测是否存在废弃API
// TODO: Remove BlockingMode and ConcurrentMode by reading from the root
// tag instead
export const BlockingMode = 0b00010;  // 渐进迁移模式，concurrent 模式的“优雅降级”版本
export const ConcurrentMode = 0b00100;  // 并发模式，异步渲染
export const ProfileMode = 0b01000; // 性能测试模式，用来检测哪里存在性能问题
export const DebugTracingMode = 0b10000;  // DEBUG模式
```
从代码中的注释中我们可以了解到这是一个一个用来描述渲染模式的标志位，继承自 Fiber 的父节点。而其他枚举值的含义则在上述代码中标记出来。

所以我们再来看那个判断 `(unitOfWork.mode & ProfileMode) !== NoMode`，这说明判断当前的Fiber 的模式是否为 ProfileMode，该模式一般在开发阶段自动开启，用来做性能检测。
```javascript
startProfilerTimer(unitOfWork);
stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
```
这两句代码则是修改 Fiber 中的属性值，用来做时间统计的：
```javascript

// A Fiber is work on a Component that needs to be done or was done. There can
// be more than one per component.
export type Fiber = {|
  // ...
  // Time spent rendering this Fiber and its descendants for the current update.
  // This tells us how well the tree makes use of sCU for memoization.
  // It is reset to 0 each time we render and only updated when we don't bailout.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualDuration?: number,

  // If the Fiber is currently active in the "render" phase,
  // This marks the time at which the work began.
  // This field is only set when the enableProfilerTimer flag is enabled.
  actualStartTime?: number,

  // Duration of the most recent render time for this Fiber.
  // This value is not updated when we bailout for memoization purposes.
  // This field is only set when the enableProfilerTimer flag is enabled.
  selfBaseDuration?: number,
  // ...
|};
```
所以以后遇到相关的代码可以先忽略，只是和性能分析相关的代码。那么我们继续分析主流程。
### beginWork
首先从rootFiber开始向下深度优先遍历。为遍历到的每个 Fiber 节点调用 `beginWork` 方法。

该方法会根据传入的 Fiber 节点创建子 Fiber 节点，并将这两个 Fiber 节点连接起来。

完整的 `beginWork` 函数的代码有400多行，这里我们只讲主干部分。首先我们看一下 beginWork 的定义：
```javascript
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  // ...
}
```
其中传参：
* current：当前组件对应的Fiber节点在上一次更新时的Fiber节点，即 workInProgress.alternate
* workInProgress：当前组件对应的Fiber节点
* renderLanes：优先级相关，在讲解Scheduler时再讲解

从双缓存机制一节我们知道，除 rootFiber 以外， 组件 mount 时，由于是首次渲染，是不存在当前组件对应的 Fiber 节点在上一次更新时的 Fiber 节点，即 mount 时 `current === null`。

组件 update 时，由于之前已经 mount 过，所以 `current !== null`。

所以我们可以通过current === null ?来区分组件是处于mount还是update。

基于此原因，`beginWork` 函数的工作可以分为两部分：
* update 时：如果 current 存在，在满足一定条件时可以复用 current 节点，这样就能克隆 `current.child` 作为 `workInProgress.child` ，而不需要新建 `workInProgress.child`。
* mount 时：除 fiberRootNode 以外，`current === null`。会根据 fiber.tag 不同，创建不同类型的子Fiber节点
```javascript
function beginWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const updateLanes = workInProgress.lanes;
  // ...
  if (current !== null) {
    // ...
  } else {
    didReceiveUpdate = false;
  }

  // Before entering the begin phase, clear pending update priority.
  // TODO: This assumes that we're about to evaluate the component and process
  // the update queue. However, there's an exception: SimpleMemoComponent
  // sometimes bails out later in the begin phase. This indicates that we should
  // move this assignment out of the common path and into each branch.
  workInProgress.lanes = NoLanes;

  switch (workInProgress.tag) {
    case IndeterminateComponent: 
      // ...
    case LazyComponent: 
      // ...
    case FunctionComponent: 
      // ...
    case ClassComponent: 
      // ...
    case HostRoot:
      // ...
    case HostComponent:
      // ...
    case HostText:
      // ...
    case SuspenseComponent:
      // ...
    case HostPortal:
      // ...
    case ForwardRef: 
      // ...
    case Fragment:
      // ...
    case Mode:
      // ...
    case Profiler:
      // ...
    case ContextProvider:
      // ...
    case ContextConsumer:
      // ...
    case MemoComponent: 
      // ...
    case SimpleMemoComponent: 
      // ...
    case IncompleteClassComponent: 
      // ...
    case SuspenseListComponent: 
      // ...
    case FundamentalComponent: 
      // ...
    case ScopeComponent: 
      // ...
    case Block: 
      // ...
    case OffscreenComponent: 
      // ...
    case LegacyHiddenComponent: 
      // ...
  }
}
```
我们这里先只看 `current === null` 的情况，之后则是根据 workInProgress.tag 创建相应的 Fiber 节点。首先我们先了解一共有哪些 Fiber 节点类型。
```javascript
// packages/react-reconciler/src/ReactWorkTags.js

export const FunctionComponent = 0;
export const ClassComponent = 1;
export const IndeterminateComponent = 2; // Before we know whether it is function or class
export const HostRoot = 3; // Root of a host tree. Could be nested inside another node.
export const HostPortal = 4; // A subtree. Could be an entry point to a different renderer.
export const HostComponent = 5;
export const HostText = 6;
export const Fragment = 7;
export const Mode = 8;
export const ContextConsumer = 9;
export const ContextProvider = 10;
export const ForwardRef = 11;
export const Profiler = 12;
export const SuspenseComponent = 13;
export const MemoComponent = 14;
export const SimpleMemoComponent = 15;
export const LazyComponent = 16;
export const IncompleteClassComponent = 17;
export const DehydratedFragment = 18;
export const SuspenseListComponent = 19;
export const FundamentalComponent = 20;
export const ScopeComponent = 21;
export const Block = 22;
export const OffscreenComponent = 23;
export const LegacyHiddenComponent = 24;
```
可以看到目前有 25 个枚举值。那么结合我们的例子分析一下创建的顺序。
![beginwork-workinpregress-tag](~@/assets/react-source-2steps-render/beginwork-workinpregress-tag.png)
有上述的log，我们可以看到各个节点对应的 Fiber 节点的 tag 都是多少，那么这 tag 属性是怎么样赋值上去的呢？

其实首次渲染在执行到 `renderRootSync` 函数时有一个判断：
```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function renderRootSync(root: FiberRoot, lanes: Lanes) {
  // ...

  // If the root or lanes have changed, throw out the existing stack
  // and prepare a fresh one. Otherwise we'll continue where we left off.
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    prepareFreshStack(root, lanes);
    startWorkOnPendingInteractions(root, lanes);
  }
  // ...
}
```
此时 `workInProgressRoot` 为 null，自然逻辑就会走到 `prepareFreshStack` 函数中：
```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function prepareFreshStack(root: FiberRoot, lanes: Lanes) {
  // ...
  if (workInProgress !== null) {
    // ...
  }
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = subtreeRenderLanes = workInProgressRootIncludedLanes = lanes;
  workInProgressRootExitStatus = RootIncomplete;
  workInProgressRootFatalError = null;
  workInProgressRootSkippedLanes = NoLanes;
  workInProgressRootUpdatedLanes = NoLanes;
  workInProgressRootPingedLanes = NoLanes;
  // ...
}
```
::: warning
在首次渲染进入 `prepareFreshStack` 函数时，也同时将 root 赋值给 workInProgressRoot。
:::
我们可以看到，在首次渲染进入 render 阶段时，首个 workInProgress Fiber 节点通过 `createWorkInProgress` 函数创建的，那么我们继续看一下 `createWorkInProgress` 函数的声明：
```javascript
// packages/react-reconciler/src/ReactFiber.old.js

// This is used to create an alternate fiber to do work on.
export function createWorkInProgress(current: Fiber, pendingProps: any): Fiber {
  let workInProgress = current.alternate;
  if (workInProgress === null) {
    // We use a double buffering pooling technique because we know that we'll
    // only ever need at most two versions of a tree. We pool the "other" unused
    // node that we're free to reuse. This is lazily created to avoid allocating
    // extra objects for things that are never updated. It also allow us to
    // reclaim the extra memory if needed.
    workInProgress = createFiber(
      current.tag,
      pendingProps,
      current.key,
      current.mode,
    );
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    // ...
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // ...
  }

  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;

  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;

  // Clone the dependencies object. This is mutated during the render phase, so
  // it cannot be shared with the current fiber.
  const currentDependencies = current.dependencies;
  workInProgress.dependencies =
    currentDependencies === null
      ? null
      : {
          lanes: currentDependencies.lanes,
          firstContext: currentDependencies.firstContext,
        };

  // These will be overridden during the parent's reconciliation
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  // ...
  return workInProgress;
}
```
因为首次渲染，所以 `let workInProgress = current.alternate;` 我们可知，workInProgress 为 null，所以就会进入 if 判断逻辑，通过 `createFiber` 函数创建 workInProgress Fiber，而此时创建的正是 workInProgress Fiber 树的根节点，和 rootFiber 节点通过alternate属性相关联，这一步在上一篇文章介绍过：
```javascript
workInProgress.alternate = current;
current.alternate = workInProgress;
```
那么在创建完 workInProgress Fiber 树的第一个节点后，则会顺利的走到 `workLoopSync` 函数的 while 中，从而开始循环执行 `beginWork`，传入当前workInProgress Fiber 节点进而依次创建下一个 workInProgress Fiber 节点，并且并将这两个Fiber节点连接起来。

那么现在我们根据例子看几个对应 Fiber 节点的构造方法。
#### HostRoot
```javascript {26}
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function updateHostRoot(current, workInProgress, renderLanes) {
  pushHostRootContext(workInProgress);
  const updateQueue = workInProgress.updateQueue;
  // ...
  const nextProps = workInProgress.pendingProps;
  const prevState = workInProgress.memoizedState;
  const prevChildren = prevState !== null ? prevState.element : null;
  cloneUpdateQueue(current, workInProgress);
  processUpdateQueue(workInProgress, nextProps, null, renderLanes);
  const nextState = workInProgress.memoizedState;
  // Caution: React DevTools currently depends on this property
  // being called "element".
  const nextChildren = nextState.element;
  if (nextChildren === prevChildren) {
    resetHydrationState();
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  const root: FiberRoot = workInProgress.stateNode;
  if (root.hydrate && enterHydrationState(workInProgress)) {
    // ...
  } else {
    // Otherwise reset hydration state in case we aborted and resumed another
    // root.
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    resetHydrationState();
  }
  return workInProgress.child;
}
```
#### IndeterminateComponent
```javascript {67}
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function mountIndeterminateComponent(
  _current,
  workInProgress,
  Component,
  renderLanes,
) {
  if (_current !== null) {
    // An indeterminate component only mounts if it suspended inside a non-
    // concurrent tree, in an inconsistent state. We want to treat it like
    // a new mount, even though an empty version of it already committed.
    // Disconnect the alternate pointers.
    _current.alternate = null;
    workInProgress.alternate = null;
    // Since this is conceptually a new fiber, schedule a Placement effect
    workInProgress.flags |= Placement;
  }

  const props = workInProgress.pendingProps;
  let context;
  if (!disableLegacyContext) {
    const unmaskedContext = getUnmaskedContext(
      workInProgress,
      Component,
      false,
    );
    context = getMaskedContext(workInProgress, unmaskedContext);
  }

  prepareToReadContext(workInProgress, renderLanes);
  let value;
  // ...
  value = renderWithHooks(
    null,
    workInProgress,
    Component,
    props,
    context,
    renderLanes,
  );
  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  // ...
  if (
    // Run these checks in production only if the flag is off.
    // Eventually we'll delete this branch altogether.
    !disableModulePatternComponents &&
    typeof value === 'object' &&
    value !== null &&
    typeof value.render === 'function' &&
    value.$$typeof === undefined
  ) {
    // ...
    return finishClassComponent(
      null,
      workInProgress,
      Component,
      true,
      hasContext,
      renderLanes,
    );
  } else {
    // Proceed under the assumption that this is a function component
    workInProgress.tag = FunctionComponent;
    // ...
    reconcileChildren(null, workInProgress, value, renderLanes);
    // ...
    return workInProgress.child;
  }
}
```
```javascript {61}
function finishClassComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: any,
  shouldUpdate: boolean,
  hasContext: boolean,
  renderLanes: Lanes,
) {
  // Refs should update even if shouldComponentUpdate returns false
  markRef(current, workInProgress);

  const didCaptureError = (workInProgress.flags & DidCapture) !== NoFlags;

  if (!shouldUpdate && !didCaptureError) {
    // Context providers should defer to sCU for rendering
    if (hasContext) {
      invalidateContextProvider(workInProgress, Component, false);
    }

    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }

  const instance = workInProgress.stateNode;

  // Rerender
  ReactCurrentOwner.current = workInProgress;
  let nextChildren;
  if (
    didCaptureError &&
    typeof Component.getDerivedStateFromError !== 'function'
  ) {
    // If we captured an error, but getDerivedStateFromError is not defined,
    // unmount all the children. componentDidCatch will schedule an update to
    // re-render a fallback. This is temporary until we migrate everyone to
    // the new API.
    // TODO: Warn in a future release.
    nextChildren = null;

    if (enableProfilerTimer) {
      stopProfilerTimerIfRunning(workInProgress);
    }
  } else {
    // ...
    nextChildren = instance.render();
  }

  // React DevTools reads this flag.
  workInProgress.flags |= PerformedWork;
  if (current !== null && didCaptureError) {
    // If we're recovering from an error, reconcile without reusing any of
    // the existing children. Conceptually, the normal children and the children
    // that are shown on error are two different sets, so we shouldn't reuse
    // normal children even if their identities match.
    forceUnmountCurrentAndReconcile(
      current,
      workInProgress,
      nextChildren,
      renderLanes,
    );
  } else {
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  }

  // Memoize state using the values we just used to render.
  // TODO: Restructure so we never read values from the instance.
  workInProgress.memoizedState = instance.state;

  // The context might have changed so we need to recalculate it.
  if (hasContext) {
    invalidateContextProvider(workInProgress, Component, true);
  }

  return workInProgress.child;
}
```
#### HostComponent
```javascript {34}
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function updateHostComponent(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
) {
  pushHostContext(workInProgress);

  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }

  const type = workInProgress.type;
  const nextProps = workInProgress.pendingProps;
  const prevProps = current !== null ? current.memoizedProps : null;

  let nextChildren = nextProps.children;
  const isDirectTextChild = shouldSetTextContent(type, nextProps);

  if (isDirectTextChild) {
    // We special case a direct text child of a host node. This is a common
    // case. We won't handle it as a reified child. We will instead handle
    // this in the host environment that also has access to this prop. That
    // avoids allocating another HostText fiber and traversing it.
    nextChildren = null;
  } else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
    // If we're switching from a direct text child to a normal child, or to
    // empty, we need to schedule the text content to be reset.
    workInProgress.flags |= ContentReset;
  }

  markRef(current, workInProgress);
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}

function updateHostText(current, workInProgress) {
  if (current === null) {
    tryToClaimNextHydratableInstance(workInProgress);
  }
  // Nothing to do here. This is terminal. We'll do the completion step
  // immediately after.
  return null;
}
```
#### reconcileChildren
对于我们常见的组件类型，如（`FunctionComponent` / `ClassComponent` / `HostComponent`），最终会进入reconcileChildren方法。

那么我们来看一下 `reconcileChildren` 的定义：
```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

export function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any,
  renderLanes: Lanes,
) {
  if (current === null) {
    // If this is a fresh new component that hasn't been rendered yet, we
    // won't update its child set by applying minimal side-effects. Instead,
    // we will add them all to the child before it gets rendered. That means
    // we can optimize this reconciliation pass by not tracking side-effects.
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderLanes,
    );
  } else {
    // If the current child is the same as the work in progress, it means that
    // we haven't yet started any work on these children. Therefore, we use
    // the clone algorithm to create a copy of all the current children.

    // If we had any progressed work already, that is invalid at this point so
    // let's throw it out.
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderLanes,
    );
  }
}
```
从代码可以看出，和 `beginWork` 一样，他也是通过 `current === null` 来区分mount与update。

其实 `reconcilerChildren` 的核心逻辑很简单，主体只有一个判断，用来区分是首次渲染还是更新：
* 对于 mount 的组件，他会创建新的子 Fiber 节点
* 对于 update 的组件，他会将当前组件与该组件在上次更新时对应的 Fiber 节点比较（也就是俗称的 Diff 算法），将比较的结果生成新 Fiber 节点

不论走哪个逻辑，最终他会生成新的子 Fiber 节点并赋值给 `workInProgress.child`，作为本次 `beginWork` 函数的返回值，并作为下次 `performUnitOfWork` 函数执行时 workInProgress 的传参。
::: warning
值得一提的是，`mountChildFibers` 函数与 `reconcileChildFibers` 函数这两个方法的逻辑基本一致。唯一的区别是：`reconcileChildFibers` 函数会维护 workInProgress Fiber tree 的状态，会为生成的 Fiber 节点带上 flags 属性；而`mountChildFibers` 函数则不会。
:::
#### flags
我们知道，render 阶段的工作是在内存中进行，当工作结束后会通知 Renderer 需要执行的 DOM 操作。要执行 DOM 操作的具体类型就保存在 fiber.flags 中。
```javascript
// packages/react-reconciler/src/ReactFiberFlags.js

// Don't change these two values. They're used by React Dev Tools.
export const NoFlags = /*                      */ 0b0000000000000000000;
export const PerformedWork = /*                */ 0b0000000000000000001;

// You can change the rest (and add more).
export const Placement = /*                    */ 0b0000000000000000010;
export const Update = /*                       */ 0b0000000000000000100;
export const PlacementAndUpdate = /*           */ 0b0000000000000000110;
export const Deletion = /*                     */ 0b0000000000000001000;
export const ContentReset = /*                 */ 0b0000000000000010000;
export const Callback = /*                     */ 0b0000000000000100000;
export const DidCapture = /*                   */ 0b0000000000001000000;
export const Ref = /*                          */ 0b0000000000010000000;
export const Snapshot = /*                     */ 0b0000000000100000000;
export const Passive = /*                      */ 0b0000000001000000000;
export const Hydrating = /*                    */ 0b0000000010000000000;
export const HydratingAndUpdate = /*           */ 0b0000000010000000100;
export const Visibility = /*                   */ 0b0000000100000000000;
// ...
```
::: warning
通过二进制表示 flags，可以方便的使用位操作为 fiber.flags 赋值多个 flags。
:::
那么，如果要通知Renderer将Fiber节点对应的DOM节点插入页面中，需要满足两个条件：
* 1.fiber.stateNode存在，即Fiber节点中保存了对应的DOM节点
* 2.`(fiber.flags & Placement) !== 0` ，即 Fiber 节点存在 Placement flags

我们知道，首次渲染时，`fiber.stateNode === null`，且在 `reconcileChildren` 函数中调用的 `mountChildFibers` 函数不会为 Fiber 节点赋值 flags。那么首屏渲染如何完成呢？

针对第一个问题，fiber.stateNode 会在 completeWork 阶段中创建，我们会在下一节介绍。

第二个问题的答案十分巧妙：假设 `mountChildFibers` 函数也会赋值 flags，那么可以预见首次渲染时整棵 Fiber 树所有节点都会有 Placement flag。那么 commit 阶段在执行 DOM操作时每个节点都会执行一次插入操作，这样大量的DOM操作是极低效的。

为了解决这个问题，在首次渲染时只有 rootFiber 会赋值 Placement flag，在 commit 阶段只会执行一次插入操作。
### completeWork
我们了解组件在render阶段会经历 `beginWork` 与 `completeWork` 。

上一节我们讲解了组件执行 `beginWork` 函数后会创建子 Fiber 节点，节点上可能存在 flags。

这一节让我们看看 `completeWork` 会做什么工作。
#### 流程概览
`completeWork` 函数定义如下：
```javascript
// packages/react-reconciler/src/ReactFiberCompleteWork.old.js

function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    case IndeterminateComponent:
    case LazyComponent:
    case SimpleMemoComponent:
    case FunctionComponent:
    case ForwardRef:
    case Fragment:
    case Mode:
    case Profiler:
    case ContextConsumer:
    case MemoComponent:
      return null;
    case ClassComponent:
      // ...
    case HostRoot: 
      // ...
    case HostComponent: 
      // ...
    case HostText: 
      // ...
    case SuspenseComponent: 
      // ...
    case HostPortal:
      // ...
    case ContextProvider:
      // ...
    case IncompleteClassComponent: 
      // ...
    case SuspenseListComponent: 
      // ...
    case FundamentalComponent: 
      // ...
    case ScopeComponent: 
      // ...
    case Block:
      // ...
    case OffscreenComponent:
    case LegacyHiddenComponent:
      // ...
  }
  // ...
}
```
类似 `beginWork` 函数，`completeWork` 函数也是针对不同 fiber.tag 调用不同的处理逻辑。

我们重点关注页面渲染所必须的 HostComponent（即原生DOM组件对应的Fiber节点），其他类型Fiber的处理留在具体功能实现时讲解。
#### 处理HostComponent
和 `beginWork` 函数一样，我们根据 `current === null` 判断是首次渲染还是更新渲染。

同时针对 HostComponent ，判断更新渲染时我们还需要考虑 `workInProgress.stateNode != null`（即该Fiber节点是否存在对应的DOM节点）
```javascript {35,43}
// packages/react-reconciler/src/ReactFiberCompleteWork.old.js

function completeWork(
  current: Fiber | null,
  workInProgress: Fiber,
  renderLanes: Lanes,
): Fiber | null {
  const newProps = workInProgress.pendingProps;

  switch (workInProgress.tag) {
    // ...
    case HostComponent: {
      popHostContext(workInProgress);
      const rootContainerInstance = getRootHostContainer();
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
        // update ...
      } else {
        if (!newProps) {
          invariant(
            workInProgress.stateNode !== null,
            'We must have new props for new mounts. This error is likely ' +
              'caused by a bug in React. Please file an issue.',
          );
          // This can happen when we abort work.
          return null;
        }

        const currentHostContext = getHostContext();
        // ...
        if (wasHydrated) {
          // ...
        } else {
          // 为fiber创建对应DOM节点
          const instance = createInstance(
            type,
            newProps,
            rootContainerInstance,
            currentHostContext,
            workInProgress,
          );
          // 将子孙DOM节点插入刚生成的DOM节点中
          appendAllChildren(instance, workInProgress, false, false);
          // DOM节点赋值给fiber.stateNode
          workInProgress.stateNode = instance;

          // Certain renderers require commit-time effects for initial mount.
          // (eg DOM renderer supports auto-focus for certain elements).
          // Make sure such renderers get scheduled for later work.
          // 与update逻辑中的updateHostComponent类似的处理props的过程
          if (
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext,
            )
          ) {
            markUpdate(workInProgress);
          }
        }

        if (workInProgress.ref !== null) {
          // If there is a ref on a host node we need to schedule a callback
          markRef(workInProgress);
        }
      }
      return null;
    }
    // ...
  }
  // ...
}
```
可以看到，首次渲染时的主要逻辑包括三个：
* 为 Fiber 节点生成对应的 DOM 节点
* 将子孙 DOM 节点插入刚生成的DOM节点中
* 与 update 逻辑中的 `updateHostComponent` 函数类似的处理 props 的过程

还记得之前我们讲到：mount 时只会在 rootFiber 存在 Placement flag 。那么 commit 阶段是如何通过一次插入 DOM 操作（对应一个Placement flag）将整棵 DOM 树插入页面的呢？
原因就在于 `completeWork` 函数中的 `appendAllChildren` 函数方法。

由于 `completeWork` 函数属于“归”阶段调用的函数，每次调用 `appendAllChildren` 函数时都会将已生成的子孙 DOM 节点插入当前生成的 DOM 节点下。那么当“归”到 rootFiber 时，我们已经有一个构建好的离屏 DOM 树。
#### effectList
至此render阶段的绝大部分工作就完成了。

还有一个问题：作为 DOM 操作的依据，commit 阶段需要找到所有有 effectTag 的 Fiber 节点并依次执行 effectTag 对应操作。难道需要在 commit 阶段再遍历一次 Fiber 树寻找 `effectTag !== null` 的 Fiber 节点么？

这显然是很低效的。

为了解决这个问题，在 `completeWork` 函数的上层函数 `completeUnitOfWork` 中，每个执行完 `completeWork` 且存在 flags 的 Fiber 节点会被保存在一条被称为 effectList 的单向链表中。

effectList 中第一个 Fiber 节点保存在 fiber.firstEffect ，最后一个元素保存在 fiber.lastEffect 。

类似 `appendAllChildren` 函数，在“归”阶段，所有有 flags 的 Fiber 节点都会被追加在 `effectList` 中，最终形成一条以 `rootFiber.firstEffect` 为起点的单向链表。
```
                       nextEffect         nextEffect
rootFiber.firstEffect -----------> fiber -----------> fiber
```
这样，在commit阶段只需要遍历effectList就能执行所有effect了。
```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> completeUnitOfWork function

if (
  returnFiber !== null &&
  // Do not append effects to parents if a sibling failed to complete
  (returnFiber.flags & Incomplete) === NoFlags
) {
  // Append all the effects of the subtree and this fiber onto the effect
  // list of the parent. The completion order of the children affects the
  // side-effect order.
  if (returnFiber.firstEffect === null) {
    returnFiber.firstEffect = completedWork.firstEffect;
  }
  if (completedWork.lastEffect !== null) {
    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = completedWork.firstEffect;
    }
    returnFiber.lastEffect = completedWork.lastEffect;
  }

  // If this fiber had side-effects, we append it AFTER the children's
  // side-effects. We can perform certain side-effects earlier if needed,
  // by doing multiple passes over the effect list. We don't want to
  // schedule our own side-effect on our own list because if end up
  // reusing children we'll schedule this effect onto itself since we're
  // at the end.
  const flags = completedWork.flags;

  // Skip both NoWork and PerformedWork tags when creating the effect
  // list. PerformedWork effect is read by React DevTools but shouldn't be
  // committed.
  if (flags > PerformedWork) {
    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = completedWork;
    } else {
      returnFiber.firstEffect = completedWork;
    }
    returnFiber.lastEffect = completedWork;
  }
}
} else {
  // ...
}
```
借用React团队成员Dan Abramov的话：effectList相较于Fiber树，就像圣诞树上挂的那一串彩灯。
#### 流程结束
至此，render 阶段全部工作完成。在 `performSyncWorkOnRoot` 函数中 fiberRootNode 被传递给 `commitRoot` 函数，开启 commit 阶段工作流程。
```javascript {66}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

// This is the entry point for synchronous tasks that don't go
// through Scheduler
function performSyncWorkOnRoot(root) {
  // ...
  flushPassiveEffects();

  let lanes;
  let exitStatus;
  if (
    root === workInProgressRoot &&
    includesSomeLane(root.expiredLanes, workInProgressRootRenderLanes)
  ) {
    // There's a partial tree, and at least one of its lanes has expired. Finish
    // rendering it before rendering the rest of the expired work.
    lanes = workInProgressRootRenderLanes;
    exitStatus = renderRootSync(root, lanes);
    if (
      includesSomeLane(
        workInProgressRootIncludedLanes,
        workInProgressRootUpdatedLanes,
      )
    ) {
      // The render included lanes that were updated during the render phase.
      // For example, when unhiding a hidden tree, we include all the lanes
      // that were previously skipped when the tree was hidden. That set of
      // lanes is a superset of the lanes we started rendering with.
      //
      // Note that this only happens when part of the tree is rendered
      // concurrently. If the whole tree is rendered synchronously, then there
      // are no interleaved events.
      lanes = getNextLanes(root, lanes);
      exitStatus = renderRootSync(root, lanes);
    }
  } else {
    lanes = getNextLanes(root, NoLanes);
    exitStatus = renderRootSync(root, lanes);
  }

  if (root.tag !== LegacyRoot && exitStatus === RootErrored) {
    executionContext |= RetryAfterError;

    // If an error occurred during hydration,
    // discard server response and fall back to client side render.
    if (root.hydrate) {
      root.hydrate = false;
      clearContainer(root.containerInfo);
    }

    // If something threw an error, try rendering one more time. We'll render
    // synchronously to block concurrent data mutations, and we'll includes
    // all pending updates are included. If it still fails after the second
    // attempt, we'll give up and commit the resulting tree.
    lanes = getLanesToRetrySynchronouslyOnError(root);
    if (lanes !== NoLanes) {
      exitStatus = renderRootSync(root, lanes);
    }
  }
  // ...
  // We now have a consistent tree. Because this is a sync render, we
  // will commit it even if something suspended.
  const finishedWork: Fiber = (root.current.alternate: any);
  root.finishedWork = finishedWork;
  root.finishedLanes = lanes;
  commitRoot(root);

  // Before exiting, make sure there's a callback scheduled for the next
  // pending level.
  ensureRootIsScheduled(root, now());

  return null;
}
```
## Commit 阶段
### 流程概览
`commitRoot` 函数是 commit 阶段工作的起点。fiberRootNode 会作为传参。

在 rootFiber.firstEffect 上保存了一条需要执行副作用的 Fiber 节点的单向链表 effectList，这些 Fiber 节点的 updateQueue 中保存了变化的 props。

这些副作用对应的 DOM 操作在 commit 阶段执行。
::: warning
Commit 阶段的完整代码定义在 `packages/react-reconciler/src/ReactFiberWorkLoop.old.js` 的 `commitRootImpl` 函数。
::: 
除此之外，一些生命周期钩子（比如componentDidXXX）、hook（比如useEffect）需要在 commit 阶段执行。

commit 阶段的主要工作（即 Renderer 的工作流程）分为三部分：
* Before Mutation 阶段（执行DOM操作前）
* Mutation 阶段（执行DOM操作）
* Layout 阶段（执行DOM操作后）

在 Before Mutation 阶段之前和 Layout 阶段之后还有一些额外工作，涉及到比如 useEffect 的触发、优先级相关的重置、ref 的绑定/解绑。

这些对我们当前属于超纲内容，为了内容完整性，在这节简单介绍。
#### Before Mutation 阶段之前
```javascript
  // packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> commitRootImpl function

  do {
    // 触发useEffect回调与其他同步任务。由于这些任务可能触发新的渲染，所以这里要一直遍历执行直到没有任务
    flushPassiveEffects();
  } while (rootWithPendingPassiveEffects !== null);
  // ...
  // root指 fiberRootNode
  // root.finishedWork指当前应用的rootFiber
  const finishedWork = root.finishedWork;
  // 凡是变量名带lane的都是优先级相关
  const lanes = root.finishedLanes;
  // ...
  if (finishedWork === null) {
    // ...
    return null;
  }
  root.finishedWork = null;
  root.finishedLanes = NoLanes;
  // ...
  // 重置Scheduler绑定的回调函数
  root.callbackNode = null;

  // Update the first and last pending times on this root. The new first
  // pending time is whatever is left on the root fiber.
  let remainingLanes = mergeLanes(finishedWork.lanes, finishedWork.childLanes);
  markRootFinished(root, remainingLanes);

  // 清除已完成的discrete updates，例如：用户鼠标点击触发的更新。
  if (rootsWithPendingDiscreteUpdates !== null) {
    if (
      !hasDiscreteLanes(remainingLanes) &&
      rootsWithPendingDiscreteUpdates.has(root)
    ) {
      rootsWithPendingDiscreteUpdates.delete(root);
    }
  }
  // 重置全局变量
  if (root === workInProgressRoot) {
    // We can reset these now that they are finished.
    workInProgressRoot = null;
    workInProgress = null;
    workInProgressRootRenderLanes = NoLanes;
  } else {
    // This indicates that the last root we worked on is not the same one that
    // we're committing now. This most commonly happens when a suspended root
    // times out.
  }

  // 将effectList赋值给firstEffect
  // 由于每个fiber的effectList只包含他的子孙节点
  // 所以根节点如果有effectTag则不会被包含进来
  // 所以这里将有effectTag的根节点插入到effectList尾部
  // 这样才能保证有effect的fiber都在effectList中
  let firstEffect;
  if (finishedWork.flags > PerformedWork) {
    // A fiber's effect list consists only of its children, not itself. So if
    // the root has an effect, we need to add it to the end of the list. The
    // resulting list is the set that would belong to the root's parent, if it
    // had one; that is, all the effects in the tree including the root.
    if (finishedWork.lastEffect !== null) {
      finishedWork.lastEffect.nextEffect = finishedWork;
      firstEffect = finishedWork.firstEffect;
    } else {
      firstEffect = finishedWork;
    }
  } else {
    // 根节点没有 effect
    firstEffect = finishedWork.firstEffect;
  }
```
可以看到，Before Mutation 之前主要做一些变量赋值，状态重置的工作。

这一长串代码我们只需要关注最后赋值的 firstEffect ，在 Commit 的三个子阶段都会用到他。
#### Layout 阶段之后
```javascript
  // packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> commitRootImpl function

  const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;
  // useEffect相关
  if (rootDoesHavePassiveEffects) {
    // This commit has passive effects. Stash a reference to them. But don't
    // schedule a callback until after flushing layout work.
    rootDoesHavePassiveEffects = false;
    rootWithPendingPassiveEffects = root;
    pendingPassiveEffectsLanes = lanes;
    pendingPassiveEffectsRenderPriority = renderPriorityLevel;
  } else {
    // 清除 nextEffect 协助 GC。如果还有 passive effects，则使用 `flushPassiveEffects` 清除。
    nextEffect = firstEffect;
    while (nextEffect !== null) {
      const nextNextEffect = nextEffect.nextEffect;
      nextEffect.nextEffect = null;
      if (nextEffect.flags & Deletion) {
        detachFiberAfterEffects(nextEffect);
      }
      nextEffect = nextNextEffect;
    }
  }

  // Read this again, since an effect might have updated it
  remainingLanes = root.pendingLanes;

  // 性能优化相关
  if (remainingLanes !== NoLanes) {
    if (enableSchedulerTracing) {
      if (spawnedWorkDuringRender !== null) {
        // ...
      }
      // ...
    }
  } else {
      // ...
  }
  // 性能优化相关
  if (enableSchedulerTracing) {
    if (!rootDidHavePassiveEffects) {
      // ...
    }
  }
  // 检测无限循环的同步任务
  if (remainingLanes === SyncLane) {
    if (root === rootWithNestedUpdates) {
      nestedUpdateCount++;
    } else {
      nestedUpdateCount = 0;
      rootWithNestedUpdates = root;
    }
  } else {
    nestedUpdateCount = 0;
  }
  // ...
  // 在离开commitRoot函数前调用，触发一次新的调度，确保任何附加的任务被调度
  ensureRootIsScheduled(root, now());
  // 处理未捕获错误
  if (hasUncaughtError) {
    hasUncaughtError = false;
    const error = firstUncaughtError;
    firstUncaughtError = null;
    throw error;
  }
  // ...
  // If layout work was scheduled, flush it now.
  flushSyncCallbackQueue();
  // ...
  return null;
```
主要包括三点内容：
* 1. useEffect相关的处理。
  * 我们会在讲解layout阶段时讲解。
* 2. 性能追踪相关。
  * 源码里有很多和 interaction 相关的变量。他们都和追踪 React 渲染时间、性能相关，在 Profiler API 和 DevTools 中使用。
::: warning
你可以在这里看到 [interaction的定义](https://gist.github.com/bvaughn/8de925562903afd2e7a12554adcdda16) 。
:::
* 3. 在commit阶段会触发一些生命周期钩子（如 componentDidXXX）和hook（如useLayoutEffect、useEffect）。
  * 在这些回调方法中可能触发新的更新，新的更新会开启新的render-commit流程。
### Before Mutation 阶段
Before Mutation 阶段的代码很短，整个过程就是遍历 effectList 并调用 `commitBeforeMutationEffects` 函数处理。
```javascript {33}
  // packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> commitRootImpl function

  if (firstEffect !== null) {
    let previousLanePriority;
    if (decoupleUpdatePriorityFromScheduler) {
      previousLanePriority = getCurrentUpdateLanePriority();
      setCurrentUpdateLanePriority(SyncLanePriority);
    }

    const prevExecutionContext = executionContext;
    executionContext |= CommitContext;
    const prevInteractions = pushInteractions(root);

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    // The commit phase is broken into several sub-phases. We do a separate pass
    // of the effect list for each phase: all mutation effects come before all
    // layout effects, and so on.

    // The first phase a "before mutation" phase. We use this phase to read the
    // state of the host tree right before we mutate it. This is where
    // getSnapshotBeforeUpdate is called.
    focusedInstanceHandle = prepareForCommit(root.containerInfo);
    shouldFireAfterActiveInstanceBlur = false;

    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        // ...
      } else {
        try {
          commitBeforeMutationEffects();
        } catch (error) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);
    // We no longer need to track the active instance fiber
    focusedInstanceHandle = null;
    // ...
  }
```
我们重点关注 Before Mutation 阶段的主函数 `commitBeforeMutationEffects` 做了什么。

#### commitBeforeMutationEffects
`commitBeforeMutationEffects` 函数的定义如下：
```javascript {7,16,25-28}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitBeforeMutationEffects() {
  while (nextEffect !== null) {
    const current = nextEffect.alternate;

    if (!shouldFireAfterActiveInstanceBlur && focusedInstanceHandle !== null) {
      // focus blur相关 ...
    }

    const flags = nextEffect.flags;
    
    // 调用getSnapshotBeforeUpdate
    if ((flags & Snapshot) !== NoFlags) {
      // ...
      commitBeforeMutationEffectOnFiber(current, nextEffect);
      // ...
    }
    // 调度useEffect
    if ((flags & Passive) !== NoFlags) {
      // If there are passive effects, schedule a callback to flush at
      // the earliest opportunity.
      if (!rootDoesHavePassiveEffects) {
        rootDoesHavePassiveEffects = true;
        scheduleCallback(NormalSchedulerPriority, () => {
          flushPassiveEffects();
          return null;
        });
      }
    }
    nextEffect = nextEffect.nextEffect;
  }
}
```
整体可以分为三部分：
* 1. 处理 DOM 节点渲染/删除后的 autoFocus、blur 逻辑
* 2. 通过调用 `commitBeforeMutationLifeCycles` 函数调用 ClassComponent 实例的 `getSnapshotBeforeUpdate` 生命周期钩子
* 3. 调度 useEffect
#### getSnapshotBeforeUpdate 声明周期
`commitBeforeMutationEffectOnFiber` 函数是 `commitBeforeMutationLifeCycles` 函数的别名。

在该方法内会调用ClassComponent实例的 `getSnapshotBeforeUpdate` 方法。
```javascript {21-26}
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitBeforeMutationLifeCycles(
  current: Fiber | null,
  finishedWork: Fiber,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      return;
    }
    case ClassComponent: {
      if (finishedWork.flags & Snapshot) {
        if (current !== null) {
          const prevProps = current.memoizedProps;
          const prevState = current.memoizedState;
          const instance = finishedWork.stateNode;
          // ...
          const snapshot = instance.getSnapshotBeforeUpdate(
            finishedWork.elementType === finishedWork.type
              ? prevProps
              : resolveDefaultProps(finishedWork.type, prevProps),
            prevState,
          );
          // ...
          instance.__reactInternalSnapshotBeforeUpdate = snapshot;
        }
      }
      return;
    }
    // ...
  }
}
```
从 React 16 开始，`componentWillXXX` 钩子前增加了 `UNSAFE_` 前缀。

究其原因，是因为 `Stack Reconciler` 重构为 `Fiber Reconciler` 后，render 阶段的任务可能中断/重新开始，对应的组件在 render 阶段的生命周期钩子（即 `componentWillXXX`）可能触发多次。

这种行为和 React 15 不一致，所以标记为 `UNSAFE_`。
::: warning
更详细的解释参照[这里](https://zh-hans.reactjs.org/docs/react-component.html#the-component-lifecycle)。
:::
为此，React提供了替代的生命周期钩子getSnapshotBeforeUpdate。

我们可以看见，`getSnapshotBeforeUpdate` 钩子是在 Commit 阶段内的 Before Mutation 阶段调用的，由于 Commit 阶段是同步的，所以不会遇到多次调用的问题。
#### useEffect 调用
在这几行代码内，`scheduleCallback` 函数由 Scheduler 模块提供，用于以某个优先级异步调度一个回调函数。
```javascript
// 调度 useEffect
if ((flags & Passive) !== NoFlags) {
  // If there are passive effects, schedule a callback to flush at
  // the earliest opportunity.
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true;
    scheduleCallback(NormalSchedulerPriority, () => {
      // 触发 useEffect
      flushPassiveEffects();
      return null;
    });
  }
}
```
在此处，被异步调度的回调函数就是触发 useEffect 的函数 `flushPassiveEffects`。

我们接下来讨论 useEffect 如何被异步调度，以及为什么要异步（而不是同步）调度。
##### 如何异步调度
在 `flushPassiveEffects` 函数内部调用 `flushPassiveEffectsImpl` 函数，而其又会从全局变量 rootWithPendingPassiveEffects 获取 effectList 。

在 completeWork 一节我们讲到，effectList 中保存了需要执行副作用的 Fiber 节点。其中副作用包括：
* 插入 DOM 节点（Placement）
* 更新 DOM 节点（Update）
* 删除 DOM 节点（Deletion）

除此外，当一个 FunctionComponent 含有 useEffect 或 useLayoutEffect ，他对应的 Fiber 节点也会被赋值 flags。
::: warning
你可以从 `packages/react-reconciler/src/ReactHookEffectTags.js` 看到 hook 相关的 HookFlags
:::
在 flushPassiveEffects 方法内部会遍历 rootWithPendingPassiveEffects（即effectList）执行 effect 回调函数。
```javascript
  // packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> flushPassiveEffectsImpl function

  // Note: This currently assumes there are no passive effects on the root fiber
  // because the root is not part of its own effect list.
  // This could change in the future.
  let effect = root.current.firstEffect;
  while (effect !== null) {
    const nextNextEffect = effect.nextEffect;
    // Remove nextEffect pointer to assist GC
    effect.nextEffect = null;
    if (effect.flags & Deletion) {
      detachFiberAfterEffects(effect);
    }
    effect = nextNextEffect;
  }
```
如果在此时直接执行，`rootWithPendingPassiveEffects === null`。那么 `rootWithPendingPassiveEffects` 会在何时赋值呢？

在上一节 Layout 之后的代码片段中会根据 `rootDoesHavePassiveEffects === true` 决定是否赋值 srootWithPendingPassiveEffects。
```javascript
const rootDidHavePassiveEffects = rootDoesHavePassiveEffects;
if (rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = false;
  rootWithPendingPassiveEffects = root;
  pendingPassiveEffectsLanes = lanes;
  pendingPassiveEffectsRenderPriority = renderPriorityLevel;
}
```
所以整个useEffect异步调用分为三步：
* 1. Before Mutation 阶段在 `scheduleCallback` 中调度 `flushPassiveEffects` 函数
* 2. Layout 阶段之后将 effectList 赋值给 rootWithPendingPassiveEffects
* 3. `scheduleCallback` 触发 `flushPassiveEffects`，`flushPassiveEffects` 内部遍历 rootWithPendingPassiveEffects
##### 为什么需要异步调用
摘录自React文档 [effect 的执行时机](https://zh-hans.reactjs.org/docs/hooks-reference.html#timing-of-effects) ：

> 与 componentDidMount、componentDidUpdate 不同的是，在浏览器完成布局与绘制之后，传给 useEffect 的函数会延迟调用。这使得它适用于许多常见的副作用场景，比如设置订阅和事件处理等情况，因此不应在函数中执行阻塞浏览器更新屏幕的操作。

可见，useEffect异步执行的原因主要是防止同步执行时阻塞浏览器渲染。
### Mutation 阶段
类似 Before Mutation 阶段，Mutation 阶段也是遍历 effectList，执行函数。这里执行的是 `commitMutationEffects` 函数。
```javascript {12}
  // packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> commitRootImpl function

  if (firstEffect !== null) {
    // ...
    // The next phase is the mutation phase, where we mutate the host tree.
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        // ...
      } else {
        try {
          commitMutationEffects(root, renderPriorityLevel);
        } catch (error) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);
    // ...
  }
```
#### commitMutationEffects
commitMutationEffects 函数的代码定义如下：
```javascript {38,48,75,81}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitMutationEffects(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel,
) {
  // TODO: Should probably move the bulk of this function to commitWork.
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;
    // 根据 ContentReset flags重置文字节点
    if (flags & ContentReset) {
      commitResetTextContent(nextEffect);
    }
    // 更新ref
    if (flags & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        commitDetachRef(current);
      }
      if (enableScopeAPI) {
        // TODO: This is a temporary solution that allowed us to transition away
        // from React Flare on www.
        if (nextEffect.tag === ScopeComponent) {
          commitAttachRef(nextEffect);
        }
      }
    }

    // The following switch statement is only concerned about placement,
    // updates, and deletions. To avoid needing to add a case for every possible
    // bitmap value, we remove the secondary effects from the effect tag and
    // switch on that value.
    const primaryFlags = flags & (Placement | Update | Deletion | Hydrating);
    switch (primaryFlags) {
      // 插入DOM
      case Placement: {
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        // TODO: findDOMNode doesn't rely on this any more but isMounted does
        // and isMounted is deprecated anyway so we should be able to kill this.
        nextEffect.flags &= ~Placement;
        break;
      }
      // 插入DOM 并 更新DOM
      case PlacementAndUpdate: {
        // 插入
        commitPlacement(nextEffect);
        // Clear the "placement" from effect tag so that we know that this is
        // inserted, before any life-cycles like componentDidMount gets called.
        nextEffect.flags &= ~Placement;

        // 更新
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // SSR相关
      case Hydrating: {
        nextEffect.flags &= ~Hydrating;
        break;
      }
      // SSR相关
      case HydratingAndUpdate: {
        nextEffect.flags &= ~Hydrating;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // 更新DOM
      case Update: {
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
        break;
      }
      // 删除DOM
      case Deletion: {
        commitDeletion(root, nextEffect, renderPriorityLevel);
        break;
      }
    }
    // ...
    nextEffect = nextEffect.nextEffect;
  }
}
```
`commitMutationEffects` 函数会遍历 effectList，对每个 Fiber 节点执行如下三个操作：
* 根据 ContentReset flags 重置文字节点
* 更新 ref
* 根据 flags 分别处理，其中 flags 包括(Placement | Update | Deletion | Hydrating)

我们关注步骤三中的Placement | Update | Deletion。Hydrating作为服务端渲染相关，我们先不关注。

#### Placement Effect
当 Fiber 节点含有 Placement flags ，意味着该 Fiber 节点对应的 DOM 节点需要插入到页面中。

调用的方法为 `commitPlacement` 函数，其定义如下：
```javascript {9,14,42,45-49}
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitPlacement(finishedWork: Fiber): void {
  if (!supportsMutation) {
    return;
  }

  // Recursively insert all host nodes into the parent.
  const parentFiber = getHostParentFiber(finishedWork);

  // Note: these two variables *must* always be updated together.
  let parent;
  let isContainer;
  const parentStateNode = parentFiber.stateNode;
  switch (parentFiber.tag) {
    case HostComponent:
      parent = parentStateNode;
      isContainer = false;
      break;
    case HostRoot:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case HostPortal:
      parent = parentStateNode.containerInfo;
      isContainer = true;
      break;
    case FundamentalComponent:
      if (enableFundamentalAPI) {
        parent = parentStateNode.instance;
        isContainer = false;
      }
    // ...
  }
  if (parentFiber.flags & ContentReset) {
    // Reset the text content of the parent before doing any insertions
    resetTextContent(parent);
    // Clear ContentReset from the effect tag
    parentFiber.flags &= ~ContentReset;
  }

  const before = getHostSibling(finishedWork);
  // We only have the top Fiber that was inserted but we need to recurse down its
  // children to find all the terminal nodes.
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
}
```
该方法所做的工作分为三步：

1. 获取父级 DOM 节点。其中 finishedWork 为传入的 Fiber 节点。
```javascript
  const parentFiber = getHostParentFiber(finishedWork);
  // 父级DOM节点
  const parentStateNode = parentFiber.stateNode;
```
2. 获取 Fiber 节点的 DOM 兄弟节点
```javascript
  const before = getHostSibling(finishedWork);
```
3. 根据 DOM 兄弟节点是否存在决定调用 parentNode.insertBefore 或 parentNode.appendChild 执行 DOM 插入操作。
```javascript
// parentStateNode 是否是 rootFiber
  if (isContainer) {
    insertOrAppendPlacementNodeIntoContainer(finishedWork, before, parent);
  } else {
    insertOrAppendPlacementNode(finishedWork, before, parent);
  }
```
值得注意的是，`getHostSibling` 函数（获取兄弟DOM节点）的执行很耗时，当在同一个父 Fiber 节点下依次执行多个插入操作，`getHostSibling` 函数算法的复杂度为指数级。

这是由于 Fiber 节点不只包括 HostComponent ，所以 Fiber 树和渲染的 DOM 树节点并不是一一对应的。要从 Fiber 节点找到 DOM 节点很可能跨层级遍历。

那么我们考虑如下的例子梳理他的 Fiber 树和 DOM 树结构：
```jsx
function Item() {
  return <li><li>;
}

function App() {
  return (
    <div>
      <Item/>
    </div>
  )
}

ReactDOM.render(<App/>, document.getElementById('root'));
```
对应的 Fiber 树和 DOM 树结构为：
![fiber-tree-dom-tree-1](~@/assets/react-source-2steps-render/fiber-tree-dom-tree-1.png)
当在 div 的子节点 Item 前插入一个新节点 p，即 App变为：
```javascript
function App() {
  return (
    <div>
      <p></p>
      <Item/>
    </div>
  )
}
```
对应的 Fiber 树和 DOM 树结构为：
![fiber-tree-dom-tree-2](~@/assets/react-source-2steps-render/fiber-tree-dom-tree-2.png)
此时 DOM 节点 p 的兄弟节点为 li，而 Fiber 节点 p 对应的兄弟 DOM 节点为：`fiberP.sibling.child` 
即 `fiber p` 的兄弟 `fiber Item` 的子 `fiber li`
#### Update Effect
当 Fiber 节点含有 Update flags，意味着该 Fiber 节点需要更新。调用的函数为 `commitWork` ，他会根据 `Fiber.tag` 分别处理。

`commitWork` 函数的定义如下：
```javascript {6,29-54}
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitWork(current: Fiber | null, finishedWork: Fiber): void {
  // ...
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent:
    case Block: {
      // Layout effects are destroyed during the mutation phase so that all
      // destroy functions for all fibers are called before any create functions.
      // This prevents sibling component effects from interfering with each other,
      // e.g. a destroy function in one component should never override a ref set
      // by a create function in another component during the same commit.
      if (
        enableProfilerTimer &&
        enableProfilerCommitHooks &&
        finishedWork.mode & ProfileMode
      ) {
        // ...
      } else {
        commitHookEffectListUnmount(HookLayout | HookHasEffect, finishedWork);
      }
      return;
    }
    case ClassComponent: 
      // ...
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;
      if (instance != null) {
        // Commit the work prepared earlier.
        const newProps = finishedWork.memoizedProps;
        // For hydration we reuse the update path but we treat the oldProps
        // as the newProps. The updatePayload will contain the real change in
        // this case.
        const oldProps = current !== null ? current.memoizedProps : newProps;
        const type = finishedWork.type;
        // TODO: Type the updateQueue to be specific to host components.
        const updatePayload: null | UpdatePayload = (finishedWork.updateQueue: any);
        finishedWork.updateQueue = null;
        if (updatePayload !== null) {
          commitUpdate(
            instance,
            updatePayload,
            type,
            oldProps,
            newProps,
            finishedWork,
          );
        }
      }
      return;
    }
    case HostText: 
      // ...
    case HostRoot: 
      // ...
    case Profiler: 
      // ...
    case SuspenseComponent: 
      // ...
    case SuspenseListComponent: 
      // ...
    case IncompleteClassComponent: 
      // ...
    case FundamentalComponent: 
      // ...
    case ScopeComponent: 
      // ...
    case OffscreenComponent:
    case LegacyHiddenComponent: 
      // ...
  }
  // ...
}
```
这里我们主要关注 `FunctionComponent tag` 和 `HostComponent tag` 。
##### FunctionComponent Mutation
当 fiber.tag 为 FunctionComponent ，会调用 `commitHookEffectListUnmount` 函数。该方法会遍历 effectList，执行所有 `useLayoutEffect hook` 的销毁函数。
```javascript
function commitHookEffectListUnmount(tag: number, finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      if ((effect.tag & tag) === tag) {
        // Unmount
        const destroy = effect.destroy;
        effect.destroy = undefined;
        if (destroy !== undefined) {
          destroy();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}
```
所谓“销毁函数”，见如下例子：
```javascript
useLayoutEffect(() => {
  // ...一些副作用逻辑

  return () => {
    // ...这就是销毁函数
  }
})
```
你不需要很了解 `useLayoutEffect` ，之后会详细介绍。你只需要知道在 Mutation 阶段会执行 `useLayoutEffect` 的销毁函数。
##### HostComponent Mutation
当 fiber.tag 为 HostComponent ，会调用 `commitUpdate` 函数。
```javascript
// packages/react-dom/src/client/ReactDOMHostConfig.js ?

export function commitUpdate(
  domElement: Instance,
  updatePayload: Array<mixed>,
  type: string,
  oldProps: Props,
  newProps: Props,
  internalInstanceHandle: Object,
): void {
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
}
```
最终会在 `updateDOMProperties` 函数中将 render阶段 completeWork 中为 Fiber 节点赋值的 updateQueue 对应的内容渲染在页面上。
```javascript
function updateDOMProperties(
  domElement: Element,
  updatePayload: Array<any>,
  wasCustomComponentTag: boolean,
  isCustomComponentTag: boolean,
): void {
  // TODO: Handle wasCustomComponentTag
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      setValueForStyles(domElement, propValue);
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domElement, propValue);
    } else if (propKey === CHILDREN) {
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue, isCustomComponentTag);
    }
  }
}
```
#### Deletion Effect
当Fiber节点含有Deletion effectTag，意味着该Fiber节点对应的DOM节点需要从页面中删除。调用的方法为commitDeletion。
```javascript
function commitDeletion(
  finishedRoot: FiberRoot,
  current: Fiber,
  renderPriorityLevel: ReactPriorityLevel,
): void {
  if (supportsMutation) {
    // Recursively delete all host nodes from the parent.
    // Detach refs and call componentWillUnmount() on the whole subtree.
    unmountHostComponents(finishedRoot, current, renderPriorityLevel);
  } else {
    // Detach refs and call componentWillUnmount() on the whole subtree.
    commitNestedUnmounts(finishedRoot, current, renderPriorityLevel);
  }
  const alternate = current.alternate;
  detachFiberMutation(current);
  if (alternate !== null) {
    detachFiberMutation(alternate);
  }
}
```
该方法会执行如下操作：
* 递归调用 Fiber 节点及其子孙 Fiber 节点中 fiber.tag 为 ClassComponent 的 `componentWillUnmount` 生命周期钩子，从页面移除 Fiber 节点对应 DOM 节点
* 解绑 ref
* 调度 useEffect 的销毁函数
#### 总结
从这节我们学到，Mutation 阶段会遍历 effectList，依次执行 `commitMutationEffects` 函数。该函数的主要工作为：**根据 flags 调用不同的处理函数处理 Fiber**。
### Layout 阶段
与前两个阶段类似，Layout 阶段也是遍历 effectList，执行函数。
具体执行的函数是 `commitLayoutEffects` 。
```javascript {14}
  // packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> commitRootImpl function

  if (firstEffect !== null) {
    // ...
    // The next phase is the layout phase, where we call effects that read
    // the host tree after it's been mutated. The idiomatic use case for this is
    // layout, but class component lifecycles also fire here for legacy reasons.
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        // ...s
      } else {
        try {
          commitLayoutEffects(root, lanes);
        } catch (error) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);

    nextEffect = null;
    // ...
  }
```
#### commitLayoutEffects
`commitLayoutEffects` 函数的定义如下：
```javascript {12,17}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitLayoutEffects(root: FiberRoot, committedLanes: Lanes) {
  // ...
  // TODO: Should probably move the bulk of this function to commitWork.
  while (nextEffect !== null) {
    // ...
    const flags = nextEffect.flags;
    // 调用生命周期钩子和hook
    if (flags & (Update | Callback)) {
      const current = nextEffect.alternate;
      commitLayoutEffectOnFiber(root, current, nextEffect, committedLanes);
    }
    // ...
    if (flags & Ref) {
      // 赋值ref
      commitAttachRef(nextEffect);
    }
    // ...
    nextEffect = nextEffect.nextEffect;
  }
  // ...
}
```
`commitLayoutEffects` 函数一共做了两件事：
* `commitLayoutEffectOnFiber`（调用生命周期钩子和hook相关操作）
* `commitAttachRef`（赋值 ref）
#### commitLayoutEffectOnFiber
`commitLayoutEffectOnFiber` 函数会根据 fiber.tag 对不同类型的节点分别处理。
`commitLayoutEffectOnFiber` 为别名，方法原名为 `commitLifeCycles`，定义如下：
```javascript {10,25,59}
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitLifeCycles(
  finishedRoot: FiberRoot,
  current: Fiber | null,
  finishedWork: Fiber,
  committedLanes: Lanes,
): void {
  switch (finishedWork.tag) {
    case FunctionComponent:
    case ForwardRef:
    case SimpleMemoComponent:
    case Block: {
      // At this point layout effects have already been destroyed (during mutation phase).
      // This is done to prevent sibling component effects from interfering with each other,
      // e.g. a destroy function in one component should never override a ref set
      // by a create function in another component during the same commit.
      // ...
      // 执行useLayoutEffect的回调函数
      commitHookEffectListMount(HookLayout | HookHasEffect, finishedWork);
      // 调度useEffect的销毁函数与回调函数
      schedulePassiveEffects(finishedWork);
      return;
    }
    case ClassComponent: {
      const instance = finishedWork.stateNode;
      if (finishedWork.flags & Update) {
        if (current === null) {
          // ...
          instance.componentDidMount();
        } else {
          const prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          const prevState = current.memoizedState;
          // ...
          instance.componentDidUpdate(
            prevProps,
            prevState,
            instance.__reactInternalSnapshotBeforeUpdate,
          );
        }
      }

      // TODO: I think this is now always non-null by the time it reaches the
      // commit phase. Consider removing the type check.
      const updateQueue: UpdateQueue<
        *,
      > | null = (finishedWork.updateQueue: any);
      if (updateQueue !== null) {
        // We could update instance props and state here,
        // but instead we rely on them being set during last render.
        // TODO: revisit this when we implement resuming.
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostRoot: {
      // TODO: I think this is now always non-null by the time it reaches the
      // commit phase. Consider removing the type check.
      const updateQueue: UpdateQueue<
        *,
      > | null = (finishedWork.updateQueue: any);
      if (updateQueue !== null) {
        let instance = null;
        if (finishedWork.child !== null) {
          switch (finishedWork.child.tag) {
            case HostComponent:
              instance = getPublicInstance(finishedWork.child.stateNode);
              break;
            case ClassComponent:
              instance = finishedWork.child.stateNode;
              break;
          }
        }
        commitUpdateQueue(finishedWork, updateQueue, instance);
      }
      return;
    }
    case HostComponent: {
      const instance: Instance = finishedWork.stateNode;

      // Renderers may schedule work to be done after host components are mounted
      // (eg DOM renderer may schedule auto-focus for inputs and form controls).
      // These effects should only be committed when components are first mounted,
      // aka when there is no current/alternate.
      if (current === null && finishedWork.flags & Update) {
        const type = finishedWork.type;
        const props = finishedWork.memoizedProps;
        commitMount(instance, type, props, finishedWork);
      }

      return;
    }
    case HostText: 
      // ...
    case HostPortal: 
      // ...
    case Profiler: 
      // ...
    case SuspenseComponent: 
      // ...
    case SuspenseListComponent:
    case IncompleteClassComponent:
    case FundamentalComponent:
    case ScopeComponent:
    case OffscreenComponent:
    case LegacyHiddenComponent:
      return;
  }
  // ...
}
```
* 对于 ClassComponent，他会通过 `current === null` 区分是首次渲染还是更新渲染，调用 `componentDidMount` 或 `componentDidUpdate` 。

触发状态更新的 `this.setState` 如果赋值了第二个参数回调函数，也会在此时调用。

* 对于 FunctionComponent 及相关类型，他会调用 `useLayoutEffect hook` 的回调函数，调度 useEffect 的销毁与回调函数
::: warning
`相关类型`指特殊处理后的 FunctionComponent ，比如 ForwardRef 、 React.memo 包裹的 FunctionComponent
:::
在上一节介绍Update effect时介绍过，Mutation 阶段会执行 `useLayoutEffect hook` 的销毁函数。

结合这里我们可以发现，`useLayoutEffect hook` 从上一次更新的销毁函数调用到本次更新的回调函数调用是同步执行的。

而 useEffect 则需要先调度，在 Layout 阶段完成后再异步执行。

这就是 useLayoutEffect 与 useEffect 的区别。
* 对于HostRoot，即rootFiber，如果赋值了第三个参数回调函数，也会在此时调用。

```jsx
ReactDOM.render(<App />, document.querySelector("#root"), function() {
  console.log("i am mount~");
});
```
#### commitAttachRef
`commitLayoutEffects` 会做的第二件事是 `commitAttachRef`。

`commitAttachRef` 函数的定义如下：
```javascript
function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    let instanceToUse;
    switch (finishedWork.tag) {
      case HostComponent:
        instanceToUse = getPublicInstance(instance);
        break;
      default:
        instanceToUse = instance;
    }
    // Moved outside to ensure DCE works with this flag
    if (enableScopeAPI && finishedWork.tag === ScopeComponent) {
      instanceToUse = instance;
    }
    if (typeof ref === 'function') {
      // ...
      ref(instanceToUse);
    } else {
      // ...
      ref.current = instanceToUse;
    }
  }
}
```
代码逻辑很简单：获取DOM实例，更新ref。
#### current Fiber树切换
至此，整个layout阶段就结束了。

在结束本节的学习前，我们关注下这行代码：
```javascript {9}
  // packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> commitRootImpl function

  if (firstEffect !== null) {
    // ...
    // The work-in-progress tree is now the current tree. This must come after
    // the mutation phase, so that the previous tree is still current during
    // componentWillUnmount, but before the layout phase, so that the finished
    // work is current during componentDidMount/Update.
    root.current = finishedWork;

    // The next phase is the layout phase, where we call effects that read
    // the host tree after it's been mutated. The idiomatic use case for this is
    // layout, but class component lifecycles also fire here for legacy reasons.
    nextEffect = firstEffect;
    do {
      if (__DEV__) {
        // ...s
      } else {
        try {
          commitLayoutEffects(root, lanes);
        } catch (error) {
          invariant(nextEffect !== null, 'Should be working on an effect.');
          captureCommitPhaseError(nextEffect, error);
          nextEffect = nextEffect.nextEffect;
        }
      }
    } while (nextEffect !== null);

    nextEffect = null;
    // ...
  }
```
在之前我们 介绍React 中的双缓存机制，`workInProgress Fiber树` 在 Commit 阶段完成渲染后会变为 `current Fiber树`。这行代码的作用就是切换 fiberRootNode 指向的 `current Fiber树` 。

那么这行代码为什么在这里呢？（在mutation阶段结束后，layout阶段开始前。）

我们知道 `componentWillUnmount` 会在 Mutation 阶段执行。此时 `current Fiber树` 还指向前一次更新的Fiber树，在生命周期钩子内获取的DOM还是更新前的。

`componentDidMount` 和 `componentDidUpdate` 会在 Layout 阶段执行。此时 `current Fiber` 树已经指向更新后的 Fiber 树，在生命周期钩子内获取的DOM就是更新后的。
#### 总结
从这节我们学到，Layout 阶段会遍历 effectList，依次执行 `commitLayoutEffects` 。该方法的主要工作为：**根据 flags 调用不同的处理函数处理 Fiber 并更新 rsef**。
## 流程图解
![full-process](~@/assets/react-source-2steps-render/full-process.png)
## 整体总结
👻