---
title: React 源码解读(五)
subtitle: 船新的版本，船新的模式 —— Concurrent Mode
date: 2020-01-18
tags:
  - react
author: ArtoriasChan
location: Beijing  
---
## 概览
在[通过首次渲染看React两阶段渲染 - React的其他入口函数](/blog/2019/10/28/react-source-2steps-render/#react的其他入口函数)一文我们介绍了React当前的三种入口函数。日常开发主要使用的是Legacy Mode（通过ReactDOM.render创建）。

从[React v17.0 RC 版本发布：没有新特性](https://zh-hans.reactjs.org/blog/2020/08/10/react-v17-rc.html)一文可以看到，v17.0没有包含新特性。究其原因，v17.0主要的工作在于源码内部对Concurrent Mode的支持。所以v17版本也被称为“垫脚石”版本。

你可以从[官网 - Concurrent 模式介绍 (实验性)](https://zh-hans.reactjs.org/docs/concurrent-mode-intro.html)了解其基本概念。

一句话概括：
> `Concurrent` 模式是一组 `React` 的 `新功能` ，可帮助应用保持响应，并根据用户的设备 `性能` 和 `网速` 进行 `适当的调整` 。

`Concurrent Mode` 是 `React` 过去2年 `重构Fiber架构` 的源动力，也是 `React` 未来的 `发展方向` 。

可以预见，当v17 完美支持 `Concurrent Mode` 后，v18会迎来一大波基于 `Concurrent Mode` 的库。

`底层基础架构` 决定了 `上层API` 的实现，接下来让我们了解下， `Concurrent Mode` 自底向上都包含哪些组成部分，能够发挥哪些能力？
### fiber 架构 - 底层基础架构
从 `设计理念` 我们了解到要实现 `Concurrent Mode` ，最关键的一点是：实现 `异步可中断的更新` 。

基于这个前提， `React` 花费2年时间重构完成了 `Fiber架构` 。

`Fiber架构` 的意义在于，他将 `单个组件` 作为 `工作单元` ，使 `以组件为粒度` 的 `异步可中断的更新` 成为可能。
### Scheduler 调度 - 驱动力
如果我们 `同步` 运行 `Fiber架构` （通过 `ReactDOM.render` ），则 `Fiber架构` 与 `重构前` 并无区别。

但是当我们配合 `时间切片` ，就能根据 `宿主环境性能` ，为每个工作单元分配一个 `可运行时间` ，实现 `异步可中断的更新` 。

于是，[scheduler](https://github.com/facebook/react/tree/master/packages/scheduler)（调度器）产生了。
### lane 模型 - 运行策略
到目前为止， `React` 可以控制更新在 `Fiber架构` 中运行/中断/继续运行。

基于当前的架构，当一次更新在运行过程中被中断，过段时间再继续运行，这就是 `异步可中断的更新` 。

当一次更新在运行过程中被中断，转而重新开始一次新的更新，我们可以说：后一次更新打断了前一次更新。

这就是 `优先级` 的概念：后一次更新的 `优先级` 更高，他打断了正在进行的前一次更新。

多个 `优先级` 之间如何互相 `打断` ？优先级能否 `升降` ？本次更新应该 `赋予` 什么优先级？

这就需要一个模型控制不同 `优先级` 之间的关系与行为，于是 `lane模型` 诞生了。
### 上层实现
现在，我们可以说：

从源码层面讲， `Concurrent Mode` 是一套可控的 `多优先级更新架构` 。

那么基于该架构之上可以实现哪些有意思的功能？我们举几个例子：
#### batchedUpdates

如果我们在一次事件回调中触发 `多次更新` ，他们会 `被合并` 为一次更新进行处理。

如下代码执行只会触发一次更新：
```javascript
onClick() {
  this.setState({stateA: 1});
  this.setState({stateB: false});
  this.setState({stateA: 2});
}
```
这种 `合并` 多个更新的 `优化方式` 被称为 `batchedUpdates` 。

`batchedUpdates` 在很早的版本就存在了，不过之前的实现 `局限很多` （脱离当前上下文环境的更新不会被合并）。

在 `Concurrent Mode` 中，是以 `优先级` 为依据对更新进行 `合并` 的，使用范围更广。
#### Suspense
[Suspense](https://zh-hans.reactjs.org/docs/concurrent-mode-suspense.html) 可以在组件请求数据时展示一个 `pending状态` ，请求成功后渲染数据。

本质上讲 `Suspense` 内的组件子树比组件树的其他部分拥有 `更低的优先级` 。
#### useDeferredValue
[useDeferredValue](https://zh-hans.reactjs.org/docs/concurrent-mode-reference.html#usedeferredvalue) 返回一个 `延迟响应` 的值，该值可能 `延后` 的最长时间为timeoutMs。

例子：
```javascript
const deferredValue = useDeferredValue(value, { timeoutMs: 2000 });
```
在 `useDeferredValue` 内部会调用 `useState` 并触发一次 `更新` 。

这次更新的 `优先级很低` ，所以当前如果有正在进行中的更新，不会受 `useDeferredValue` 产生的更新影响。所以 `useDeferredValue` 能够返回延迟的值。

当超过 `timeoutMs` 后 `useDeferredValue` 产生的 `更新还没进行` （由于优先级太低一直被打断），则会 `再触发` 一次 `高优先级更新` 。
## Scheduler 原理与实现
在[React 16.x 架构 - Scheduler（调度器）](/2019/10/19/react-source-architecture-and-concept/#scheduler-调度器) 一节我们介绍了Scheduler，他包含两个功能：
* 时间切片
* 优先级调度

本节我们学习这个两个功能是如何在Scheduler中实现的。
### 时间切片原理
时间切片的本质是模拟实现[requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)。

关于 `requestIdleCallback` 的详细介绍，可以看一下这篇博文：[requestIdleCallback-后台任务调度](/2019/06/08/requestidlecallback/)。

除去“浏览器重排/重绘”，下图是浏览器一帧中可以用于执行JS的时机。
![life-of-a-frame](~@assets/posts/react-source-concurrent-mode/life-of-a-frame.png)

`requestIdleCallback` 是在 `浏览器重排/重绘` 后如果 `当前帧` 还有 `空余时间` 时被调用的。

浏览器并 `没有提供` 其他API能够在同样的时机（ `浏览器重排/重绘` 后）调用以 `模拟` 其实现。

唯一能精准控制调用时机的API是 `requestAnimationFrame` ，他能让我们在 `浏览器重排/重绘` 之前执行JS。

这也是为什么我们通常用这个API实现 `JS动画` —— 这是浏览器 `渲染前` 的最后时机，所以动画能快速被渲染。

所以，退而求其次， `Scheduler` 的时间切片功能是通过 `task(宏任务)` 实现的。

最常见的 `task` 当属 `setTimeout` 了。但是有个 `task` 比 `setTimeout` 执行时机更 `靠前` ，那就是 [MessageChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel)。

所以 `Scheduler` 将需要被执行的 `回调函数` 作为 `MessageChannel` 的 `回调` 执行。如果当前宿主环境不支持 `MessageChannel` ，则降级使用 `setTimeout` API。

`MessageChannel` 的实现如下：
```javascript
// packages/scheduler/src/forks/SchedulerHostConfig.default.js

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

requestHostCallback = function(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
};
```
`setTimeout` 的实现如下：
```javascript {}
// packages/scheduler/src/forks/SchedulerHostConfig.default.js

if (
  typeof window === 'undefined' ||
  typeof MessageChannel !== 'function'
) {
  let _callback = null;
  let _timeoutID = null;
  const _flushCallback = function() {
    if (_callback !== null) {
      try {
        const currentTime = getCurrentTime();
        const hasRemainingTime = true;
        _callback(hasRemainingTime, currentTime);
        _callback = null;
      } catch (e) {
        setTimeout(_flushCallback, 0);
        throw e;
      }
    }
  };
  requestHostCallback = function(cb) {
    if (_callback !== null) {
      // Protect against re-entrancy.
      setTimeout(requestHostCallback, 0, cb);
    } else {
      _callback = cb;
      setTimeout(_flushCallback, 0);
    }
  };
  // ...
}
```
在 `React` 的 `render阶段` ，开启 `Concurrent Mode` 时，每次遍历前，都会通过 `Scheduler` 提供的 `shouldYield` 函数判断是否需要 `中断` 遍历，使浏览器有时间渲染：
```javascript {3}
function workLoopConcurrent() {
  // Perform work until Scheduler asks us to yield
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}
```
是否中断的 `依据` ，最重要的一点便是每个任务的 `剩余时间` 是否用完。

在 `Schdeduler` 中，为任务分配的 `初始剩余时间` 为 `5ms` 。
```javascript {7}
// packages/scheduler/src/forks/SchedulerHostConfig.default.js

// Scheduler periodically yields in case there is other work on the main
// thread, like user events. By default, it yields multiple times per frame.
// It does not attempt to align with frame boundaries, since most tasks don't
// need to be frame aligned; for those that do, use requestAnimationFrame.
let yieldInterval = 5;
let deadline = 0;
```
随着应用运行，会通过 `fps` 动态调整分配给任务的 `可执行时间` 。
```javascript {4,12-14}
// packages/scheduler/src/forks/SchedulerHostConfig.default.js

forceFrameRate = function(fps) {
  if (fps < 0 || fps > 125) {
    // Using console['error'] to evade Babel and ESLint
    console['error'](
      'forceFrameRate takes a positive int between 0 and 125, ' +
        'forcing frame rates higher than 125 fps is not supported',
    );
    return;
  }
  if (fps > 0) {
    yieldInterval = Math.floor(1000 / fps);
  } else {
    // reset the framerate
    yieldInterval = 5;
  }
};
```
这也解释了为什么启用 `Concurrent Mode` 后每个任务的执行时间大体都是多于5ms的一小段时间：每个时间切片被设定为5ms，任务本身再执行一小段时间，所以整体时间是多于5ms的时间。、

那么当 `shouldYield` 返回值为 `true` ，以至于 `performUnitOfWork` 被 `中断` 后是如何 `重新启动` 的呢？我们会在之后进行解析。
### 优先级调度
首先我们来了解 `优先级` 的来源。需要明确的一点是， `Scheduler` 是独立于 `React` 的包，所以他的 `优先级` 也是独立于 `React` 的 `优先级` 的。

`Scheduler` 对外暴露了一个方法 `unstable_runWithPriority` 。

这个方法接受一个 `优先级` 与一个 `回调函数` ，在 `回调函数` 内部调用获取 `优先级` 的方法都会取得第一个参数对应的 `优先级` ：
```javascript {5-9}
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
可以看到， `Scheduler` 内部存在 `5种优先级` 。

在 `React` 内部凡是涉及到 `优先级调度` 的地方，都会使用 `unstable_runWithPriority` 函数。

比如，我们知道 `commit阶段` 是 `同步执行` 的。可以看到， `commit阶段` 的起点 `commitRoot` 函数的 `优先级` 为 `ImmediateSchedulerPriority` 。

`ImmediateSchedulerPriority` 即 `ImmediatePriority` 的别名，为`最高`优先级，会立即执行。
```javascript {5,10-13}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

import {
  // ...
  ImmediatePriority as ImmediateSchedulerPriority,
} from './SchedulerWithReactIntegration.old';

function commitRoot(root) {
  const renderPriorityLevel = getCurrentPriorityLevel();
  runWithPriority(
    ImmediateSchedulerPriority,
    commitRootImpl.bind(null, root, renderPriorityLevel),
  );
  return null;
}
```
### 优先级的意义
`Scheduler` 对外暴露最重要的方法便是 `unstable_scheduleCallback` 函数。该方法用于以某个优先级 `注册` 回调函数。
```javascript {12-19,26,42}
function unstable_scheduleCallback(priorityLevel, callback, options) {
  var currentTime = getCurrentTime();
  // 根据当前时间和 options.delay 获取开始时间
  var startTime;
  // ...
  // 根据优先级 priorityLevel 获取该任务的 timeout
  var timeout;
  // ...
  // 计算过期时间
  var expirationTime = startTime + timeout;
  // 创建任务
  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  // ...
  // 根据任务类型选择放入的队列
  if (startTime > currentTime) {
    // 未过期任务
    // sortIndex为该任务的开始时间
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    // taskQueue 为空并且 当前任务为 timerQueue 中第一个任务时
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        // 取消当前运行的 timeout 任务
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // 调度 timeout 任务
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // 已过期任务
    // sortIndex为该任务的过期时间
    newTask.sortIndex = expirationTime; 
    push(taskQueue, newTask);
    // ...
  }

  return newTask;
}
```
比如在 `React` 中，之前讲过在 `commit阶段` 的 `beforeMutation阶段` 会调度 `useEffect` 的回调：
```javascript {5-8}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> commitBeforeMutationEffects function

if (!rootDoesHavePassiveEffects) {
  rootDoesHavePassiveEffects = true;
  scheduleCallback(NormalSchedulerPriority, () => {
    flushPassiveEffects();
    return null;
  });
}
```
这里的回调便是通过 `scheduleCallback` 调度的，优先级为 `NormalSchedulerPriority` ，即 `NormalPriority` 。

不同优先级意味着什么？不同 `优先级` 意味着不同 `时长` 的 `任务过期时间` ：
```javascript
// packages/scheduler/src/Scheduler.js -> unstable_scheduleCallback function

var timeout;
switch (priorityLevel) {
  case ImmediatePriority:
    timeout = IMMEDIATE_PRIORITY_TIMEOUT;
    break;
  case UserBlockingPriority:
    timeout = USER_BLOCKING_PRIORITY_TIMEOUT;
    break;
  case IdlePriority:
    timeout = IDLE_PRIORITY_TIMEOUT;
    break;
  case LowPriority:
    timeout = LOW_PRIORITY_TIMEOUT;
    break;
  case NormalPriority:
  default:
    timeout = NORMAL_PRIORITY_TIMEOUT;
    break;
}
```
其中各过期时间具体的值如下：
```javascript
// packages/scheduler/src/Scheduler.js

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;
```
可以看到，如果一个任务的优先级是 `ImmediatePriority` ，对应 `IMMEDIATE_PRIORITY_TIMEOUT` 为 -`1` ，那么：
```javascript
var expirationTime = startTime + (-1);
```
则该任务的过期时间比当前时间还短，表示他已经过期了，需要立即被执行。
### 不同优先级任务的排序

我们已经知道 `优先级` 意味着任务的 `过期时间` 。设想一个大型React项目，在某一刻，存在很多不同 `优先级` 的任务，对应不同的 `过期时间` 。

我们可以将这些 `任务` 按 `是否过期` 分为：
* 已过期任务
* 未过期任务

所以， `Scheduler` 存在两个队列：
* timerQueue：保存未过期任务
* taskQueue：保存已过期任务

每当有新的 `未过期` 任务被注册，我们将其插入 `timerQueue` 并重新排列 `timerQueue` 中任务的顺序。

当 `timerQueue` 中有任务 `过期` ，我们将其取出并加入 `taskQueue` 。

取出 `taskQueue` 中最早过期的任务并执行他。

为了能在 `O(1)` 复杂度找到两个队列中 `时间最早` 的那个任务， `Scheduler` 使用 `小顶堆` 实现了 `优先级队列` 。
```javascript
// packages/scheduler/src/SchedulerMinHeap.js

type Heap = Array<Node>;
type Node = {|
  id: number,
  sortIndex: number,
|};

export function push(heap: Heap, node: Node): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

export function peek(heap: Heap): Node | null {
  const first = heap[0];
  return first === undefined ? null : first;
}

export function pop(heap: Heap): Node | null {
  const first = heap[0];
  if (first !== undefined) {
    const last = heap.pop();
    if (last !== first) {
      heap[0] = last;
      siftDown(heap, last, 0);
    }
    return first;
  } else {
    return null;
  }
}

function siftUp(heap, node, i) {
  let index = i;
  while (true) {
    const parentIndex = (index - 1) >>> 1;
    const parent = heap[parentIndex];
    if (parent !== undefined && compare(parent, node) > 0) {
      // The parent is larger. Swap positions.
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // The parent is smaller. Exit.
      return;
    }
  }
}

function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  while (index < length) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // If the left or right node is smaller, swap with the smaller of those.
    if (left !== undefined && compare(left, node) < 0) {
      if (right !== undefined && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (right !== undefined && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // Neither child is smaller. Exit.
      return;
    }
  }
}

function compare(a, b) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
```
至此，我们了解了 `Scheduler` 的实现。现在可以回答介绍 时间切片 时提到的问题：

> 那么当 `shouldYield` 为 `true` ，以至于 `performUnitOfWork` 被中断后是如何 重新启动 的呢？
在 `ensureRootIsScheduled` 函数中，会使用 `scheduleCallback` 生成 `task` ，并放入 `root.callbackNode` 中：
```javascript
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> ensureRootIsScheduled function

newCallbackNode = scheduleCallback(
  schedulerPriorityLevel,
  performConcurrentWorkOnRoot.bind(null, root),
);
// ...
root.callbackPriority = newCallbackPriority;
root.callbackNode = newCallbackNode;
```
在“取出taskQueue中最早过期的任务并执行他”这一步中有如下关键步骤：
```javascript
// packages/scheduler/src/Scheduler.js -> workLoop function

const continuationCallback = callback(didUserCallbackTimeout);
currentTime = getCurrentTime();
if (typeof continuationCallback === 'function') {
  currentTask.callback = continuationCallback;
  markTaskYield(currentTask, currentTime);
} else {
  if (enableProfiling) {
    markTaskCompleted(currentTask, currentTime);
    currentTask.isQueued = false;
  }
  if (currentTask === peek(taskQueue)) {
    pop(taskQueue);
  }
}
advanceTimers(currentTime);
```
当注册的 回调函数 执行后的返回值 `continuationCallback` 为 `function` ，会将 `continuationCallback` 作为当前任务的回调函数。

如果 `返回值` 不是 `function` ，则将当前被执行的任务 `清除` 出 `taskQueue` 。

`render阶段` 被调度的函数为 `performConcurrentWorkOnRoot` ，在该函数末尾有这样一段代码：
```javascript {6}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> performConcurrentWorkOnRoot function

if (root.callbackNode === originalCallbackNode) {
  // The task node scheduled for this root is the same one that's
  // currently executed. Need to return a continuation.
  return performConcurrentWorkOnRoot.bind(null, root);
}
```
可以看到，在满足一定条件时，该函数会将自己作为返回值。
![performConcurrentWorkOnRoot](~@assets/posts/react-source-concurrent-mode/performConcurrentWorkOnRoot.png)
## lane 模型
上一节我们提到 `Scheduler` 与 `React` 是两套 `优先级` 机制。在 `React` 中，存在多种使用不同 `优先级` 的情况，比如：
> 注：以下例子皆为 `Concurrent Mode` 开启情况
* `过期任务` 或者 `同步任务` 使用 `同步优先级`
* `用户交互` 产生的 `更新` （比如点击事件）使用 `高优先级`
* `网络请求` 产生的更新使用 `一般优先级`
* `Suspense` 使用 `低优先级` 

`React` 需要设计一套满足如下需要的优先级机制：
* 可以表示 `优先级` 的 不同
* 可能同时存在几个 `同优先级` 的 `更新` ，所以还得能表示 `批` 的概念
* 方便进行 `优先级` 相关 `计算`

为了满足如上需求，React设计了lane模型。接下来我们来看lane模型如何满足以上3个条件
### 表示优先级的不同
> 想象你身处赛车场。不同的赛车疾驰在不同的赛道。内圈的赛道总长度更短，外圈更长。某几个临近的赛道的长度可以看作差不多长。

lane模型借鉴了同样的概念，使用31位的二进制表示31条赛道，位数越小的赛道优先级越高，某些相邻的赛道拥有相同优先级。如下：
```javascript
// packages/react-reconciler/src/ReactFiberLane.js

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;

export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
export const SyncBatchedLane: Lane = /*                 */ 0b0000000000000000000000000000010;

export const InputDiscreteHydrationLane: Lane = /*      */ 0b0000000000000000000000000000100;
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;

const InputContinuousHydrationLane: Lane = /*           */ 0b0000000000000000000000000100000;
const InputContinuousLanes: Lanes = /*                  */ 0b0000000000000000000000011000000;

export const DefaultHydrationLane: Lane = /*            */ 0b0000000000000000000000100000000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;

const TransitionHydrationLane: Lane = /*                */ 0b0000000000000000001000000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;

const RetryLanes: Lanes = /*                            */ 0b0000011110000000000000000000000;

export const SomeRetryLane: Lanes = /*                  */ 0b0000010000000000000000000000000;

export const SelectiveHydrationLane: Lane = /*          */ 0b0000100000000000000000000000000;

const NonIdleLanes = /*                                 */ 0b0000111111111111111111111111111;

export const IdleHydrationLane: Lane = /*               */ 0b0001000000000000000000000000000;
const IdleLanes: Lanes = /*                             */ 0b0110000000000000000000000000000;

export const OffscreenLane: Lane = /*                   */ 0b1000000000000000000000000000000;
```
其中，同步优先级占用的赛道为第一位：
```javascript
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;
```
从SyncLane往下一直到SelectiveHydrationLane，赛道的优先级逐步降低。
### 表示“批”的概念
可以看到其中有几个变量占用了几条赛道，比如：
```javascript
const InputDiscreteLanes: Lanes = /*                    */ 0b0000000000000000000000000011000;
const InputContinuousLanes: Lanes = /*                  */ 0b0000000000000000000000011000000;
export const DefaultLanes: Lanes = /*                   */ 0b0000000000000000000111000000000;
const TransitionLanes: Lanes = /*                       */ 0b0000000001111111110000000000000;
const RetryLanes: Lanes = /*                            */ 0b0000011110000000000000000000000;
const NonIdleLanes = /*                                 */ 0b0000111111111111111111111111111;
const IdleLanes: Lanes = /*                             */ 0b0110000000000000000000000000000;
```
这就是 `批` 的概念，被称作 `lanes` （区别于优先级的 `lane` ）。

其中 `InputDiscreteLanes` 是“用户交互”触发更新会拥有的优先级范围。

`DefaultLanes` 是“请求数据返回后触发更新”拥有的优先级范围。

`TransitionLanes` 是 `Suspense` 、 `useTransition` 、 `useDeferredValue` 拥有的优先级范围。

这其中有个细节，越 `低优先级` 的 `lanes` 占用的位 `越多` 。比如 `InputDiscreteLanes` 占了2个位， `TransitionLanes` 占了9个位。

原因在于：越 `低优先级` 的更新越容易 `被打断` ，导致积压下来，所以需要更多的位。相反，最高优的同步更新的 `SyncLane` 不需要多余的 `lanes` 。
### 方便进行优先级相关计算
既然 `lane` 对应了 `二进制` 的位，那么 `优先级` 相关计算其实就是 `位运算` 。

比如，计算a、b两个lane是否存在 `交集` ，只需要判断a与b `按位与` 的结果是否为0：
```javascript
export function includesSomeLane(a: Lanes | Lane, b: Lanes | Lane) {
  return (a & b) !== NoLanes;
}
```
计算 `b` 这个 `lanes` 是否是 `a` 对应的 `lanes` 的 `子集` ，只需要判断a与b `按位与` 的结果是否为 `b` ：
```javascript
export function isSubsetOfLanes(set: Lanes, subset: Lanes | Lane) {
  return (set & subset) === subset;
}
```
将两个 `lane` 或 `lanes` 的位 `合并` 只需要执行 `按位或` 操作：
```javascript
export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}
```
从 `set` 对应 `lanes` 中移除 `subset` 对应 `lane` （或 `lanes` ），只需要对 `subset` 的 `lane` （或 `lanes` ）执行 `按位非` ，结果再对 `set` 执行 `按位与` 。
```javascript
export function removeLanes(set: Lanes, subset: Lanes | Lane): Lanes {
  return set & ~subset;
}
```
## 总结
👻