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
## render 阶段
render 阶段开始于 `performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot` 方法的调用。这取决于本次更新是同步更新还是异步更新。
```javascript
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
在上述代码的注释中，我们解释了首次渲染会执行到 else 分支，并执行 renderRootSync 函数，name我们看一下该函数的定义：
```javascript
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
我们可以看到在 renderRootSync 函数中最核心的一块代码则是一块 `do...while();` 循环：
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
而 workLoopSync 函数的定义如下，通过 while 循环同步执行 performUnitOfWork 函数，传入的参数则是 `workInProgress`：
```javascript
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
那么我们接着看 performUnitOfWork 函数的执行逻辑是什么：
```javascript
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
performUnitOfWork 函数的逻辑很简单，尽管有几个判断，但大致逻辑就是调用 beginWork 函数 获得 next Fiber，若 next Fiber 为 null，则调用 completeUnitOfWork 函数结束当前任务；若 next 不为空，则将 next 赋值给 workInProgress，以便使 workLoopSync 函数中循环的条件继续成立。

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

完整的 beginWork 代码有400多行，这里我们只讲主干部分。首先我们看一下 beginWork 的定义：
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

从双缓存机制一节我们知道，除rootFiber以外， 组件mount时，由于是首次渲染，是不存在当前组件对应的Fiber节点在上一次更新时的Fiber节点，即mount时current === null。

组件update时，由于之前已经mount过，所以current !== null。

所以我们可以通过current === null ?来区分组件是处于mount还是update。

基于此原因，beginWork的工作可以分为两部分：
* update时：如果 current 存在，在满足一定条件时可以复用 current 节点，这样就能克隆 current.child 作为 workInProgress.child ，而不需要新建 workInProgress.child。
* mount时：除 fiberRootNode 以外，current === null。会根据fiber.tag不同，创建不同类型的子Fiber节点
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
在首次渲染进入 `prepareFreshStack` 时，也同时将 root 赋值给 workInProgressRoot。
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
```javascript
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
```javascript
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
```javascript
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
```javascript
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
值得一提的是，`mountChildFibers` 函数与 `reconcileChildFibers` 函数这两个方法的逻辑基本一致。唯一的区别是：`reconcileChildFibers` 函数会为生成的 Fiber 节点带上 effectTag 属性，而`mountChildFibers` 函数则不会。
:::
#### effectTag
### completeWork
## commit 阶段
### beforeMutation 阶段
### mutation 阶段
### layout 阶段
