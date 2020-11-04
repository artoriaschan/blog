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
## 深入理解优先级
## ReactDOM.render
## this.setState