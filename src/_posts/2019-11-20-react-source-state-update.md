---
title: ⚛ React 16.x 源码解读(三)
subtitle: 理解状态更新的流程
date: 2019-11-20
tags:
  - react
author: ArtoriasChan
location: Beijing  
---
## 流程概述
这一章我们看看几种常见的触发状态更新的方法是如何完成工作的。
### 几个关键节点
### Render 阶段
`Render阶段` 开始于 `performSyncWorkOnRoot` 或 `performConcurrentWorkOnRoot` 函数的调用。这取决于本次更新是同步更新还是异步更新。
### Commit 阶段
`Commit阶段` 开始于 `commitRoot` 函数的调用。其中 rootFiber 会作为传参传入 `commitRoot` 函数。

我们已经知道，`Render阶段` 完成后会进入 `Commit阶段`。让我们继续补全从触发状态更新到 `Render阶段`的路径。

![state-update-path-1](~@/assets/react-source-state-update/state-update-path-1.png)
### 创建 Update 对象
在 React 中，有如下方法可以触发状态更新（排除 SSR 相关）：
* `ReactDOM.render`
* `this.setState`
* `this.forceUpdate`
* `useState`
* `useReducer`

这些方法调用的场景各不相同，他们是如何接入同一套状态更新机制呢？

React 中的做法是每次状态更新都会创建一个保存更新状态相关内容的对象，我们叫他 `Update` 。在 `Render阶段` 的 `beginWork` 中会根据 `Update` 计算新的 `state`。

我们会在下一节详细讲解 `Update`。
### 从 fiber 到 root
现在 `触发状态更新的fiber` 上已经包含 `Update` 对象。

我们知道，`Render阶段` 是从 `rootFiber` 开始向下遍历。那么如何从 `触发状态更新的fiber` 得到 `rootFiber` 呢？

React 中的做法是调用 `markUpdateLaneFromFiberToRoot` 函数。
```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

// This is split into a separate function so we can mark a fiber with pending
// work without treating it as a typical update that originates from an event;
// e.g. retrying a Suspense boundary isn't an update, but it does schedule work
// on a fiber.
function markUpdateLaneFromFiberToRoot(
  sourceFiber: Fiber,
  lane: Lane,
): FiberRoot | null {
  // Update the source fiber's lanes
  sourceFiber.lanes = mergeLanes(sourceFiber.lanes, lane);
  let alternate = sourceFiber.alternate;
  if (alternate !== null) {
    alternate.lanes = mergeLanes(alternate.lanes, lane);
  }
  // ...
  // Walk the parent path to the root and update the child expiration time.
  let node = sourceFiber;
  let parent = sourceFiber.return;
  while (parent !== null) {
    parent.childLanes = mergeLanes(parent.childLanes, lane);
    alternate = parent.alternate;
    if (alternate !== null) {
      alternate.childLanes = mergeLanes(alternate.childLanes, lane);
    } else {
      // ...
    }
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    const root: FiberRoot = node.stateNode;
    return root;
  } else {
    return null;
  }
}
```
该方法做的工作可以概括为：从 `触发状态更新的fiber` 一直向上遍历到 `rootFiber` ，并返回 `rootFiber`。

由于不同更新优先级不尽相同，所以过程中还会更新遍历到的 fiber 的优先级。
### 调度更新
现在我们拥有一个 `rootFiber` ，该 `rootFiber` 对应的 `Fiber树` 中某个 `Fiber节点` 包含一个 `Update`。

接下来通知 `Scheduler` 根据更新的优先级，决定以同步还是异步的方式调度本次更新。

这里调用的函数是 `ensureRootIsScheduled`。

以下是 `ensureRootIsScheduled` 函数最核心的一段代码：
```javascript {46-66}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

// Use this function to schedule a task for a root. There's only one task per
// root; if a task was already scheduled, we'll check to make sure the priority
// of the existing task is the same as the priority of the next level that the
// root has work on. This function is called on every update, and right before
// exiting a task.
function ensureRootIsScheduled(root: FiberRoot, currentTime: number) {
  const existingCallbackNode = root.callbackNode;

  // Check if any lanes are being starved by other work. If so, mark them as
  // expired so we know to work on those next.
  markStarvedLanesAsExpired(root, currentTime);

  // Determine the next lanes to work on, and their priority.
  const nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : NoLanes,
  );
  // This returns the priority level computed during the `getNextLanes` call.
  const newCallbackPriority = returnNextLanesPriority();

  if (nextLanes === NoLanes) {
    // Special case: There's nothing to work on.
    if (existingCallbackNode !== null) {
      cancelCallback(existingCallbackNode);
      root.callbackNode = null;
      root.callbackPriority = NoLanePriority;
    }
    return;
  }

  // Check if there's an existing task. We may be able to reuse it.
  if (existingCallbackNode !== null) {
    const existingCallbackPriority = root.callbackPriority;
    if (existingCallbackPriority === newCallbackPriority) {
      // The priority hasn't changed. We can reuse the existing task. Exit.
      return;
    }
    // The priority changed. Cancel the existing callback. We'll schedule a new
    // one below.
    cancelCallback(existingCallbackNode);
  }

  // Schedule a new callback.
  let newCallbackNode;
  if (newCallbackPriority === SyncLanePriority) {
    // Special case: Sync React callbacks are scheduled on a special
    // internal queue
    newCallbackNode = scheduleSyncCallback(
      performSyncWorkOnRoot.bind(null, root),
    );
  } else if (newCallbackPriority === SyncBatchedLanePriority) {
    newCallbackNode = scheduleCallback(
      ImmediateSchedulerPriority,
      performSyncWorkOnRoot.bind(null, root),
    );
  } else {
    const schedulerPriorityLevel = lanePriorityToSchedulerPriority(
      newCallbackPriority,
    );
    newCallbackNode = scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root),
    );
  }

  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}
```
其中，`scheduleCallback` 函数和 `scheduleSyncCallback` 函数会调用 `Scheduler` 提供的调度方法根据优先级调度回调函数执行。

可以看到，这里调度的回调函数为：
```javascript
performSyncWorkOnRoot.bind(null, root),
performConcurrentWorkOnRoot.bind(null, root),
```
即render阶段的入口函数。

至此，状态更新就和我们所熟知的render阶段连接上了。
### 总结
让我们梳理下 `状态更新` 的整个调用路径的关键节点：

![state-update-path-2](~@/assets/react-source-state-update/state-update-path-2.png)
## 心智模型
在深入源码前，让我们先建立更新机制的心智模型。
### React 同步更新
我们可以将 `更新机制` 类比 `代码版本控制` 。

在没有代码版本控制前，我们在代码中逐步叠加功能。一切看起来井然有序，直到我们遇到了一个紧急线上bug（红色节点）。

![git-version-control-1](~@/assets/react-source-state-update/git-version-control-1.png)

为了修复这个bug，我们需要首先将之前的代码提交。

在 React 中，所有通过 `ReactDOM.render` 创建的应用都是通过类似的方式更新状态。

即没有` 优先级` 概念，`高优更新（红色节点）` 需要排在其他更新后面执行。
### React 并发更新
当有了 `代码版本控制` ，有 `紧急线上bug` 需要修复时，我们暂存当前分支的修改，在 `master分支` 修复bug并紧急上线。
![git-version-control-2](~@/assets/react-source-state-update/git-version-control-2.png)

bug修复上线后通过 `git rebase` 命令和开发分支连接上。开发分支基于修复bug的版本继续开发。

![git-version-control-3](~@/assets/react-source-state-update/git-version-control-3.png)

在React中，通过 `ReactDOM.createBlockingRoot` 和 `ReactDOM.createRoot` 创建的应用会采用并发的方式更新状态。

`高优更新（红色节点）` 中断正在进行中的 `低优更新（蓝色节点）` ，先完成 `render-commit` 流程。

待 `高优更新` 完成后，`低优更新` 基于 `高优更新` 的结果重新更新。
## Update
### 分类
我们先来了解Update的结构。

首先，我们将可以触发更新的方法所隶属的组件分类：
* ReactDOM.render —— HostRoot
* this.setState —— ClassComponent
* this.forceUpdate —— ClassComponent
* useState —— FunctionComponent
* useReducer —— FunctionComponent

可以看到，一共三种组件（ `HostRoot` | `ClassComponent` | `FunctionComponent` ）可以触发更新。

由于不同类型组件工作方式不同，所以存在两种不同结构的`Update`，其中 `ClassComponent` 与 `HostRoot` 共用一套 `Update结构` ，`FunctionComponent` 单独使用一种 `Update结构`。

虽然他们的结构不同，但是他们工作机制与工作流程大体相同。在本节我们介绍前一种`Update`，`FunctionComponent` 对应的 `Update` 之后结合 `Hooks` 介绍。
### 结构
`ClassComponent` 与 `HostRoot`（即 `rootFiber.tag` 对应类型）共用同一种 `Update结构`。

对应的结构如下：
```javascript {4-13}
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function createUpdate(eventTime: number, lane: Lane): Update<*> {
  const update: Update<*> = {
    eventTime,
    lane,

    tag: UpdateState,
    payload: null,
    callback: null,

    next: null,
  };
  return update;
}
```
各字段含义如下：
* eventTime ：任务时间，通过 `performance.now()` 获取的毫秒数。由于该字段在未来会重构，当前我们不需要理解他。
* lane ：优先级相关字段。当前还不需要掌握他，只需要知道不同 `Update` 优先级可能是不同的。
* tag ：更新的类型，包括 `UpdateState | ReplaceState | ForceUpdate | CaptureUpdate` 。
* payload ：更新挂载的数据，不同类型组件挂载的数据不同。对于 `ClassComponent`，`payload` 为 `this.setState` 的第一个传参。对于 `HostRoot` ，`payload` 为 `ReactDOM.render` 的第一个传参。
* callback ：更新的回调函数。
* next ：与其他Update连接形成链表。
### Update与Fiber的联系
我们发现，`Update` 存在一个连接其他 `Update` 形成链表的字段 `next` 。联系 React 中另一种以链表形式组成的结构 `Fiber`，他们之间有什么关联么？

答案是肯定的。

从 `双缓存机制` 我们知道，`Fiber节点` 组成 `Fiber树` ，页面中最多同时存在两棵Fiber树：
* 代表当前页面状态的 `current Fiber树`
* 代表正在 `Render阶段` 的 `workInProgress Fiber树`

类似 `Fiber节点` 组成 `Fiber树`，`Fiber节点` 上的多个 `Update` 会组成链表并被包含在 `fiber.updateQueue` 中。
```javascript {4,17-18,20}
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function enqueueUpdate<State>(fiber: Fiber, update: Update<State>) {
  const updateQueue = fiber.updateQueue;
  if (updateQueue === null) {
    // Only occurs if the fiber has been unmounted.
    return;
  }

  const sharedQueue: SharedQueue<State> = (updateQueue: any).shared;
  const pending = sharedQueue.pending;
  if (pending === null) {
    // This is the first update. Create a circular list.
    update.next = update;
  } else {
    // 插入到当前更新的之后
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
  // ...
}
```
::: warning 什么情况下一个Fiber节点会存在多个Update？
你可能疑惑为什么一个 `Fiber节点` 会存在多个 `Update`。这其实是很常见的情况。

在这里介绍一种最简单的情况：
```javascript
class App extends Component {
  // ...
  onClick: () => {
    this.setState({
      a: 1
    })
    this.setState({
      b: 2
    })
  }
  // ...
}
```
在一个 `ClassComponent` 中触发 `this.onClick` 方法，方法内部调用了两次 `this.setState`。这会在该 `fiber` 中产生两个 `Update`。
:::
`Fiber节点` 最多同时存在两个 `updateQueue`：
* `current fiber` 保存的 `updateQueue` 即 `current updateQueue`
* `workInProgress fiber` 保存的 `updateQueue` 即 `workInProgress updateQueue`

在 `Commit阶段` 完成页面渲染后，`workInProgress Fiber树` 变为 `current Fiber树`，`workInProgress Fiber树` 内 `Fiber节点` 的 `updateQueue` 就变成 `current updateQueue`。
### updateQueue
ClassComponent与HostRoot使用的UpdateQueue结构如下：
```javascript {4-12}
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function initializeUpdateQueue<State>(fiber: Fiber): void {
  const queue: UpdateQueue<State> = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null,
    },
    effects: null,
  };
  fiber.updateQueue = queue;
}
```
字段含义如下：
* baseState ：本次更新前该 `Fiber节点` 的 `state` ，`Update` 基于该 `state` 计算更新后的 `state` 。
* firstBaseUpdate/lastBaseUpdate ：本次更新前该 `Fiber节点` 已保存的 `Update` 。以链表形式存在，链表头为 `firstBaseUpdate`，链表尾为 `lastBaseUpdate` 。之所以在更新产生前该 `Fiber节点` 内就存在 `Update`，是由于某些 `Update` 优先级较低所以在上次 `render阶段` 由 `Update` 计算 `state` 时被跳过。
* shared ：触发更新时，产生的 `Update` 会保存在 `shared.pending` 中形成 `单向环状链表`。当由 `Update` 计算 `state` 时这个环会被剪开并连接在 `lastBaseUpdate` 后面。
* effects ：数组。保存 `update.calback !== null` 的 `Update`。
### updateQueue 处理流程
`updateQueue` 相关代码逻辑涉及到大量 `链表操作` ，比较难懂。在此我们举例对 `updateQueue` 的工作流程讲解下。

假设有一个 `fiber` 刚经历 `Commit阶段` 完成渲染。

该 `fiber` 上有两个由于 `优先级过低` 所以在上次的 `Render阶段` 并没有处理的 `Update` 。他们会成为下次更新的 `baseUpdate`。

我们称其为 u1 和 u2 ，其中 `u1.next === u2`。
```javascript
fiber.updateQueue.firstBaseUpdate === u1;
fiber.updateQueue.lastBaseUpdate === u2;
u1.next === u2;
// summary
fiber.updateQueue.baseUpdate：u1 ---> u2
```
现在我们在 `fiber` 上触发两次状态更新，这会产生两个新 `Update`。

我们称其为 u3 和 u4 。
```javascript
fiber.updateQueue.shared.pending === u3;
u3.next === u4;
u4.next === u3;
```
由于 `shared.pending` 是环状链表，用图表示为：
```javascript
fiber.updateQueue.shared.pending:   u3 ---> u4 
                                    ↑        |
                                    |________|
```
更新调度完成后进入 `Render阶段` 。

此时 `shared.pending` 的环被剪开并连接在 `updateQueue.lastBaseUpdate` 后面：
```javascript
// summary
fiber.updateQueue.baseUpdate：u1 ---> u2 ---> u3 ---> u4
```
接下来遍历 `updateQueue.baseUpdate` 链表，以 `fiber.updateQueue.baseState` 为 `初始state` ，依次与遍历到的每个 `Update` 计算并产生 `新的state`（该操作类比 `Array.prototype.reduce` ）。

在遍历时如果有 `优先级低的Update` 会被跳过。

当遍历完成后获得的 `state` ，就是该 `Fiber节点` 在本次更新的 `state`（源码中叫做 `memoizedState` ）。
```javascript {34-42,50-56,70}
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes,
): void {
  // This is always non-null on a ClassComponent or HostRoot
  const queue: UpdateQueue<State> = (workInProgress.updateQueue: any);

  hasForceUpdate = false;
  // ...
  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;

  // Check if there are pending updates. If so, transfer them to the base queue.
  let pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    // 将 pending update 整合到 current tree 的 updateQueue 中
    // ...
  }

  if (firstBaseUpdate !== null) {
    let newLanes = NoLanes;

    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;

    let update = firstBaseUpdate;
    do {
      // ...
      // 处理 update，计算 newState
      newState = getStateFromUpdate(
        workInProgress,
        queue,
        update,
        newState,
        props,
        instance,
      );
      // ...
      update = update.next;
      if (update === null) {
        pendingQueue = queue.shared.pending;
        if (pendingQueue === null) {
          break;
        } else {
          // `shared.pending` 的环被剪开并连接在 `updateQueue.lastBaseUpdate` 后面
          const lastPendingUpdate = pendingQueue;
          const firstPendingUpdate = ((lastPendingUpdate.next: any): Update<State>);
          lastPendingUpdate.next = null;
          update = firstPendingUpdate;
          queue.lastBaseUpdate = lastPendingUpdate;
          queue.shared.pending = null;
        }
      }
    } while (true);

    if (newLastBaseUpdate === null) {
      newBaseState = newState;
    }

    queue.baseState = ((newBaseState: any): State);
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    markSkippedUpdateLanes(newLanes);
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
  // ...
}
```
`state` 的变化在 `Render阶段` 产生与上次更新不同的 `JSX对象` ，通过 `Diff算法` 产生 `flags`，在 `Commit阶段` 渲染在页面上。

渲染完成后 `workInProgress Fiber树` 变为 `current Fiber树` ，整个更新流程结束。
## 深入理解优先级
通过心智模型一节，我们了解到 `更新` 具有 `优先级` 。

那么什么是 `优先级` ？`优先级` 以什么为依据？如何通过 `优先级` 决定哪个状态应该先被更新？
### what - 什么是优先级
`状态更新` 由用户 `交互` 产生，用户心里对 `交互` 执行顺序有个预期。`React` 根据人机交互研究的结果中用户对 `交互` 的预期顺序为交互产生的 `状态更新` 赋予不同 `优先级`。
所以说这里的优先级是启发性的，具体如下：
* 生命周期方法：同步执行。
* 受控的用户输入：比如输入框内输入文字，同步执行。
* 交互事件：比如动画，高优先级执行。
* 其他：比如数据请求，低优先级执行。
### how - 如何调度优先级
`React` 通过 `Scheduler` 调度任务。

具体到代码，每当需要调度任务时，`React` 会调用 `Scheduler` 提供的方法 `runWithPriority`。

该方法接收一个 `优先级常量` 与一个 `回调函数` 作为 `参数` 。`回调函数` 会以 `优先级` 高低为顺序排列在一个 `定时器` 中并在合适的时间触发。
```javascript
// packages/scheduler/src/Scheduler.js

function unstable_runWithPriority(priorityLevel, eventHandler) {
  switch (priorityLevel) {
    case ImmediatePriority:
    case UserBlockingPriority:
    case NormalPriority:
    case LowPriority:
    case IdlePriority:
      break;
    default:
      priorityLevel = NormalPriority;
  }

  var previousPriorityLevel = currentPriorityLevel;
  currentPriorityLevel = priorityLevel;

  try {
    return eventHandler();
  } finally {
    currentPriorityLevel = previousPriorityLevel;
  }
}
```
Scheduler对优先级常量的定义如下：
```javascript
// packages/scheduler/src/SchedulerPriorities.js

export type PriorityLevel = 0 | 1 | 2 | 3 | 4 | 5;

// TODO: Use symbols?
export const NoPriority = 0;
export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;
```
### 例子
`优先级` 最终会反映到 `update.lane` 变量上。当前我们只需要知道这个变量能够区分 `Update` 的 `优先级` 。

接下来我们通过一个例子结合上一节介绍的 `Update` 相关字段讲解 `优先级` 如何决定更新的顺序。
> 该例子来自React Core Team Andrew向网友讲解Update工作流程的 [推文](https://twitter.com/acdlite/status/978412930973687808) 

![update-process-1](~@/assets/react-source-state-update/update-process-1.jpeg)
![update-process-2](~@/assets/react-source-state-update/update-process-2.jpeg)

在这个例子中，有两个 `Update` 。我们将“关闭黑夜模式”产生的 `Update` 称为 `u1` ，输入字母“I”产生的 `Update` 称为 `u2`。

其中 `u1` 先触发并进入 `Render阶段` 。其 `优先级` 较低，执行时间较长。此时：
```javascript
fiber.updateQueue = {
  baseState: {
    blackTheme: true,
    text: 'H'
  },
  firstBaseUpdate: null,
  lastBaseUpdate: null
  shared: {
    pending: u1
  },
  effects: null
};
```
在 `u1` 完成 `Render阶段` 前用户通过键盘输入字母“i”，产生了 `u2` 。根据 `React` 中规定的优先级，`u2` 属于受控的用户输入， `优先级` 高于 `u1` ，于是中断 `u1` 产生的 `Render阶段` 。

此时，当前 `fiber` 中的 `updateQueue.shared.pending` 如下所示：
```javascript
fiber.updateQueue.shared.pending:   u1 ---> u2 
                                    ↑        |
                                    |________|
// 即
u2.next === u1;
u1.next === u2;
```
其中 `u2` 优先级高于 `u1`。

接下来进入 `u2` 产生的 `Render阶段` 。

在 `processUpdateQueue` 函数中，`shared.pending` 环状链表会被剪开并拼接在 `baseUpdate` 后面。

需要明确一点，因为在 `enqueueUpdate` 函数中，在将当前 `Update` 插入到 `shared.pending` 时，会执行 `sharedQueue.pending = update;` 。 所以 `shared.pending` 指向最后一个插入的 `update` ，所以实际执行时 `update` 的顺序为：
```
u1 -- u2
```

接下来遍历 `baseUpdate` ，处理 `优先级` 合适的 `Update`（这一次处理的是 `更高优的u2` ）。

由于 `u2` 不是 `baseUpdate` 中的第一个 `update` ，在其之前的 `u1` 由于 `优先级` 不够被 `跳过`。

`update` 之间可能有 `依赖关系` ，所以被跳过的 `update` 及其后面所有 `update` 会成为下次更新的 `baseUpdate`。（即u1 -- u2）。

最终 `u2` 完成 `Render - Commit阶段`。
```javascript
fiber.updateQueue = {
  baseState: {
    blackTheme: true,
    text: 'HI'
  },
  firstBaseUpdate: u1,
  lastBaseUpdate: u2
  shared: {
    pending: null
  },
  effects: null
};
```
在 `Commit阶段` 结尾会再调度一次更新。在该次更新中会基于 `baseState` 中 `firstBaseUpdate` 保存的 `u1`，开启一次新的 `Render阶段`。

最终两次 `Update` 都完成后的结果如下：
```javascript
fiber.updateQueue = {
  baseState: {
    blackTheme: false,
    text: 'HI'
  },
  firstBaseUpdate: null,
  lastBaseUpdate: null
  shared: {
    pending: null
  },
  effects: null
};
```
我们可以看见， `u2` 对应的更新执行了两次，相应的 `Render阶段` 的生命周期勾子 `componentWillXXX` 也会触发两次。这也是为什么这些勾子会被标记为 `unsafe_` 。
### 如何保证状态正确
现在我们基本掌握了 `updateQueue` 的工作流程。还有两个疑问：
* `Render阶段` 可能被中断。如何保证 `updateQueue` 中保存的 `Update` 不丢失？
* 有时候当前 `状态` 需要依赖前一个 `状态` 。如何在支持跳过 `低优先级状态` 的同时**保证状态依赖的连续性**？
#### 保证Update不丢失
在 `Render阶段` ，`shared.pending` 的环被剪开并连接在 `updateQueue.lastBaseUpdate` 后面。

实际上 `shared.pending` 会被同时连接在 `workInProgress updateQueue.lastBaseUpdate` 与 `current updateQueue.lastBaseUpdate` 后面。
```javascript {33-45}
// packages/react-reconciler/src/ReactUpdateQueue.old.js

export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes,
): void {
  // This is always non-null on a ClassComponent or HostRoot
  const queue: UpdateQueue<State> = (workInProgress.updateQueue: any);

  hasForceUpdate = false;
  // ...
  let firstBaseUpdate = queue.firstBaseUpdate;
  let lastBaseUpdate = queue.lastBaseUpdate;

  let pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    queue.shared.pending = null;

    const lastPendingUpdate = pendingQueue;
    const firstPendingUpdate = lastPendingUpdate.next;

    lastPendingUpdate.next = null;
    if (lastBaseUpdate === null) {
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;

    // 将 pending update 整合到 current tree 的 updateQueue 中
    const current = workInProgress.alternate;
    if (current !== null) {
      const currentQueue: UpdateQueue<State> = (current.updateQueue: any);
      const currentLastBaseUpdate = currentQueue.lastBaseUpdate;
      if (currentLastBaseUpdate !== lastBaseUpdate) {
        if (currentLastBaseUpdate === null) {
          currentQueue.firstBaseUpdate = firstPendingUpdate;
        } else {
          currentLastBaseUpdate.next = firstPendingUpdate;
        }
        currentQueue.lastBaseUpdate = lastPendingUpdate;
      }
    }
  }
  // ...
}
```
当 `Render阶段` 被中断后重新开始时，会基于 `current updateQueue` 克隆出 `workInProgress updateQueue`。由于 `current updateQueue.lastBaseUpdate` 已经保存了上一次的 `Update` ，所以不会丢失。

当 `Commit阶段` 完成渲染，由于 `workInProgress updateQueue.lastBaseUpdate` 中保存了上一次的 `Update` ，所以 `workInProgress Fiber树` 变成 `current Fiber树` 后也不会造成 `Update` 丢失。
#### 保证状态依赖的连续性
当某个 `Update` 由于 `优先级` 低而被跳过时，保存在 `baseUpdate` 中的不仅是该 `Update` ，还包括链表中该 `Update` 之后的所有 `Update` 。

考虑如下例子：
```
baseState: ''
shared.pending: A1 --> B2 --> C1 --> D2
```
其中字母代表该 `Update` 要在页面插入的字母，数字代表 `优先级` ，值越低 `优先级` 越高。

第一次 `Render阶段` ， `优先级` 为1。
```
baseState: ''
baseUpdate: null
render阶段使用的Update: [A1, C1]
memoizedState: 'AC'
```
其中 `B2` 由于 `优先级` 为2，低于当前优先级，所以他及其后面的所有 `Update` 会被保存在 `baseUpdate` 中作为下次更新的 `Update`（即B2 C1 D2）。
```javascript {22}
export function processUpdateQueue<State>(
  workInProgress: Fiber,
  props: any,
  instance: any,
  renderLanes: Lanes,
): void {
  // This is always non-null on a ClassComponent or HostRoot
  const queue: UpdateQueue<State> = (workInProgress.updateQueue: any);
  // ...
  if (firstBaseUpdate !== null) {
    let newLanes = NoLanes;

    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;

    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      const updateEventTime = update.eventTime;
      // 优先级不足，跳过此次更新
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        const clone: Update<State> = {
          eventTime: updateEventTime,
          lane: updateLane,

          tag: update.tag,
          payload: update.payload,
          callback: update.callback,

          next: null,
        };
        // 维护 低优先级 update 链表
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        // 更新队列中的剩余优先级
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        // ...
      }
      // ...
    } while (true);
    // newLastBaseUpdate 为空，说明没有更新，当前的 newState 为最新的 baseState
    if (newLastBaseUpdate === null) {
      newBaseState = newState;
    }

    queue.baseState = ((newBaseState: any): State);
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    markSkippedUpdateLanes(newLanes);
    workInProgress.lanes = newLanes;
    workInProgress.memoizedState = newState;
  }
  // ...
}
```
这么做是为了**保持状态的前后依赖顺序**。

第二次 `Render阶段`， `优先级` 为2。
```
baseState: 'A'
baseUpdate: B2 --> C1 --> D2
render阶段使用的Update: [B2, C1, D2]
memoizedState: 'ABCD'
```
::: warning
注意这里 `baseState` 并不是上一次更新的 `memoizedState` 。这是由于 `B2` 被跳过了。

即当有 `Update` 被跳过时，下次更新的 `baseState` 不等于上次更新的 `memoizedState` 。
:::
通过以上例子我们可以发现，`React` 保证最终的状态一定和用户触发的交互一致，但是中间过程状态可能由于设备不同而不同。
## ReactDOM.render
## this.setState