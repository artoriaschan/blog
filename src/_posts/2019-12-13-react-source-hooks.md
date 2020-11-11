---
title: ⚛ React 16.x 源码解读(四)
subtitle: Hooks在React中的实现
date: 2019-12-13
tags:
  - react
author: ArtoriasChan
location: Beijing  
---
## 极简 Hooks 实现
首先我们先通过遵循 `React` 的运行流程，实现一个简单的 `useState Hooks`，从而让我们更加深刻具体的了解 `Hooks` 的相应的原理。
### useState 流程
![usestate-process](~@assets/react-source-hooks/usestate-process.png)
### 工作原理
对于useState Hook，考虑如下例子：
```jsx
function App() {
  const [num, updateNum] = useState(0);

  function handleButtonClick(){
    updateNum(num => num + 1)
  }

  return (
    <div className="App">
      <p>{num}</p>
      <button onClick={handleButtonClick}>计数</button>
    </div>
  );
}
```
可以将工作分为两部分：
* 通过一些途径产生 `更新` ，更新会造成组件 `render` 。
* 组件 `render` 时 `useState` 返回的 `state` 为 `更新` 后的结果。

其中步骤1的更新可以分为 `mount` 和 `update`：
* 调用 `ReactDOM.render` 会产生 `mount` 的更新，更新内容为 `useState` 的 `initialValue`（即 `0` ）。
* 点击 `button标签` 触发 `updateNum` 会产生一次 `update` 的 `更新` ，更新内容为 `num => num + 1` 。

接下来讲解这两个步骤如何实现。

### 更新是什么
> 通过一些途径产生更新，更新会造成组件render。

首先我们要明确 `更新` 是什么。在我们的 `极简 Hooks` 例子中， `更新` 就是如下数据结构：
```javascript
const update = {
  // 更新执行的函数
  action,
  // 与同一个Hook的其他更新形成链表
  next: null
}
```
对于 `App` 来说，点击 `button标签` 产生的 `update` 的 `action` 为 `num => num + 1`。

如果一次点击时间中触发多个更新操作，如下所示：
```javascript
// 之前
function handleButtonClick(){
  updateNum(num => num + 1);
}

// 之后
function handleButtonClick(){
  updateNum(num => num + 1);
  updateNum(num => num + 1);
  updateNum(num => num + 1);
}
```
那么这些多个 `update` 如何组织呢？

### Update数据结构
看过上一章状态更新文章的同学应该很快想到，在 `ClassComponent` 中，`updateQueue` 也是通过 `环状单向链表` 进行组织的，和这个的思路相似。

调用 `updateNum` 实际调用的是 `dispatchAction.bind(null, hook.queue)` ，我们先来了解下 `React` 中的这个函数：
```javascript {8-15}
function dispatchAction(queue, action) {
  // 创建update
  const update = {
    action,
    next: null
  }

  // 环状单向链表操作
  if (queue.pending === null) {
    update.next = update;
  } else {
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  queue.pending = update;

  // 模拟React开始调度更新
  schedule();
}
```
上述高亮的代码逻辑和上一章的[updatequeue 处理流程](/2019/11/20/react-source-state-update/#updatequeue-处理流程) 相似，具体的代码解析可以看一下之前的解析。

### 状态如何保存
现在我们知道，更新产生的update对象会保存在queue中。

不同于 `ClassComponent` 的实例可以存储数据，对于 `FunctionComponent` ，`queue` 存储在哪里呢？答案是：`FunctionComponent` 对应的 `fiber` 中。

我们使用如下精简的fiber结构：
```javascript
// App组件对应的fiber对象
const fiber = {
  // 保存该FunctionComponent对应的Hooks链表
  memoizedState: null,
  // 指向App函数
  stateNode: App
};
```
### 极简 Hook 数据结构
接下来我们关注 `fiber.memoizedState` 中保存的 `Hook` 的数据结构。

可以看到，`Hook` 与 `update` 类似，都通过 `链表` 连接。不过 `Hook` 是 `无环` 的 `单向链表`。
```javascript
hook = {
  // 保存update的queue，即上文介绍的queue
  queue: {
    pending: null
  },
  // 保存hook对应的state
  memoizedState: initialState,
  // 与下一个Hook连接形成单向无环链表
  next: null
}
```
::: warning 注意区分update与hook的所属关系
每个 `useState` 对应一个hook对象。

调用 `const [num, updateNum] = useState(0);` 时 `updateNum`（即上文介绍的 `dispatchAction` ）产生的 `update` 保存在 `useState` 对应的 `hook.queue` 中。
:::
### 模拟 React 调度更新流程
在上文 `dispatchAction` 末尾我们通过 `schedule` 方法模拟 `React` 调度更新流程。
```javascript {7}
function dispatchAction(queue, action) {
  // ...创建update
  
  // ...环状单向链表操作

  // 模拟React开始调度更新
  schedule();
}
```
现在我们来实现他。这里我们用 `isMount变量` 指代是 `mount` 还是 `update`。
```javascript {3,11}
let workInProgressHook;
// 首次render时是mount
isMount = true;

function schedule() {
  // 更新前将workInProgressHook重置为fiber保存的第一个Hook
  workInProgressHook = fiber.memoizedState;
  // 触发组件render
  fiber.stateNode();
  // 组件首次render为mount，以后再触发的更新为update
  isMount = false;
}
```
通过 `workInProgressHook` 变量指向当前正在工作的 `hook` , `workInProgressHook = fiber.memoizedState;`。

在组件 `render` 时，每当遇到下一个 `useState` ，我们移动 `workInProgressHook` 的指针。
```javascript
workInProgressHook = workInProgressHook.next;
```
这样，只要每次组件 `render` 时 `useState` 的调用顺序及数量保持一致，那么始终可以通过 `workInProgressHook` 找到当前 `useState` 对应的 `hook` 对象。到此为止，我们已经完成第一步。

> 通过一些途径产生更新，更新会造成组件render。

接下来实现第二步。

> 组件render时useState返回的num为更新后的结果。
### 计算 state
组件 `render` 时会调用 `useState` ，他的大体逻辑如下：
```javascript {5-9,12-14}
function useState(initialState) {
  // 当前useState使用的hook会被赋值该该变量
  let hook;

  if (isMount) {
    // ...mount时需要生成hook对象
  } else {
    // ...update时从workInProgressHook中取出该useState对应的hook
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    // ...根据queue.pending中保存的update更新state
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```
我们首先关注如何获取 `hook对象` ：
```javascript {11-18,20-23}
if (isMount) {
  // mount时为该useState生成hook
  hook = {
    queue: {
      pending: null
    },
    memoizedState: initialState,
    next: null
  }

  // 将hook插入fiber.memoizedState链表末尾
  if (!fiber.memoizedState) {
    fiber.memoizedState = hook;
  } else {
    workInProgressHook.next = hook;
  }
  // 移动workInProgressHook指针
  workInProgressHook = hook;
} else {
  // update时找到对应hook
  hook = workInProgressHook;
  // 移动workInProgressHook指针
  workInProgressHook = workInProgressHook.next;
}
```
当找到该 `useState` 对应的 `hook` 后，如果该 `hook.queue.pending` 不为空（即存在 `update` ），则更新其 `state`。
```javascript {8-15}
// update执行前的初始state
let baseState = hook.memoizedState;

if (hook.queue.pending) {
  // 获取update环状单向链表中第一个update
  let firstUpdate = hook.queue.pending.next;

  do {
    // 执行update action
    const action = firstUpdate.action;
    baseState = action(baseState);
    firstUpdate = firstUpdate.next;

    // 最后一个update执行完后跳出循环
  } while (firstUpdate !== hook.queue.pending)

  // 清空queue.pending
  hook.queue.pending = null;
}

// 将update action执行完后的state作为memoizedState
hook.memoizedState = baseState;
```
完整代码如下：
```javascript
function useState(initialState) {
  let hook;

  if (isMount) {
    hook = {
      queue: {
        pending: null
      },
      memoizedState: initialState,
      next: null
    }
    if (!fiber.memoizedState) {
      fiber.memoizedState = hook;
    } else {
      workInProgressHook.next = hook;
    }
    workInProgressHook = hook;
  } else {
    hook = workInProgressHook;
    workInProgressHook = workInProgressHook.next;
  }

  let baseState = hook.memoizedState;
  if (hook.queue.pending) {
    let firstUpdate = hook.queue.pending.next;

    do {
      const action = firstUpdate.action;
      baseState = action(baseState);
      firstUpdate = firstUpdate.next;
    } while (firstUpdate !== hook.queue.pending)

    hook.queue.pending = null;
  }
  hook.memoizedState = baseState;

  return [baseState, dispatchAction.bind(null, hook.queue)];
}
```
### 对触发事件进行抽象
最后，让我们抽象一下React的事件触发方式。 通过调用App返回的click方法模拟组件click的行为。
```javascript
function App() {
  const [num, updateNum] = useState(0);

  console.log(`${isMount ? 'mount' : 'update'} num: `, num);

  return {
    click() {
      updateNum(num => num + 1);
    }
  }
}
```
### 与React的区别
我们用尽可能少的代码模拟了 `Hooks` 的运行，但是相比 `React Hooks`，他还有很多不足。以下是他与 `React Hooks` 的区别：
* `React Hooks` 没有使用 `isMount` 变量，而是在 `不同时机` 使用不同的 `dispatcher`。换言之，`mount` 时的 `useState` 与 `update` 时的 `useState`不是同一个函数。
* `React Hooks` 有中途 `跳过更新` 的优化手段。
* `React Hooks` 有 `batchedUpdates`，当在 `click` 中触发三次 `updateNum` ，`精简React Hooks` 会触发三次更新，而 `React` 只会触发一次。
* `React Hooks` 的 `update` 有 `优先级` 概念，可以跳过不高优先的 `update` 。
## Hooks 数据结构
### dispatcher
在上一节的 `极简useState` 实现中，使用 `isMount` 变量区分 `mount` 与 `update`。

在真实的 `Hooks` 中，组件 `mount` 时的 `hook` 与 `update` 时 `hook` 来源于不同的对象，这类对象在源码中被称为 `dispatcher`。
```javascript
// packages/react-reconciler/src/ReactFiberHooks.old.js

// mount 时的 Dispatcher
const HooksDispatcherOnMount: Dispatcher = {
  readContext,

  useCallback: mountCallback,
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: mountImperativeHandle,
  useLayoutEffect: mountLayoutEffect,
  useMemo: mountMemo,
  useReducer: mountReducer,
  useRef: mountRef,
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: mountDeferredValue,
  useTransition: mountTransition,
  useMutableSource: mountMutableSource,
  useOpaqueIdentifier: mountOpaqueIdentifier,

  unstable_isNewReconciler: enableNewReconciler,
};

// update 时的 Dispatcher
const HooksDispatcherOnUpdate: Dispatcher = {
  readContext,

  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: updateState,
  useDebugValue: updateDebugValue,
  useDeferredValue: updateDeferredValue,
  useTransition: updateTransition,
  useMutableSource: updateMutableSource,
  useOpaqueIdentifier: updateOpaqueIdentifier,

  unstable_isNewReconciler: enableNewReconciler,
};
```
可见，`mount` 时调用的 `hook` 和 `update` 时调用的 `hook` 其实是两个不同的函数。

而在 `React` 中使用一个 `全局变量对象` 来保存当前使用的是哪个 `dispatcher` :
```javascript
// packages/react/src/ReactCurrentDispatcher.js

const ReactCurrentDispatcher = {
  /**
   * @internal
   * @type {ReactComponent}
   */
  current: (null: null | Dispatcher),
};
```
在 `FunctionComponent` 进入 `render阶段` 时，会根据 `FunctionComponent` 对应 `fiber` 的以下条件区分 `mount` 与 `update` 。

并将不同情况对应的 `dispatcher` 赋值给全局变量 `ReactCurrentDispatcher` 的 `current` 属性。
```javascript {4}
// packages/react-reconciler/src/ReactFiberHooks.old.js -> renderWithHooks function

ReactCurrentDispatcher.current =
  current === null || current.memoizedState === null
    ? HooksDispatcherOnMount
    : HooksDispatcherOnUpdate;
```
在 `FunctionComponent` `render` 时，会从 `ReactCurrentDispatcher.current`（即当前 `dispatcher` ）中寻找需要的 `hook`。

换言之，不同的调用栈上下文为 `ReactCurrentDispatcher.current` 赋值不同的 `dispatcher` ，则 `FunctionComponent` `render` 时调用的 `hook` 也是不同的函数。
::: warning
当错误的书写了嵌套形式的hook，如：
```javascript
useEffect(() => {
  useState(0);
})
```
执行 `useEffect` 的回调参数时， `ReactCurrentDispatcher.current` 已经指向 `ContextOnlyDispatcher`，所以调用 `useState` 实际会调用 `throwInvalidHookError` ，直接抛出异常。
```javascript
// packages/react-reconciler/src/ReactFiberHooks.old.js

export const ContextOnlyDispatcher: Dispatcher = {
  readContext,

  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useMutableSource: throwInvalidHookError,
  useOpaqueIdentifier: throwInvalidHookError,

  unstable_isNewReconciler: enableNewReconciler,
};
```
具体的逻辑地址为：
```javascript {14}
// packages/react-reconciler/src/ReactFiberHooks.old.js

export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes,
): any {
  // ...
  // We can assume the previous dispatcher is always this one, since we set it
  // at the beginning of the render phase and there's no re-entrancy.
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  // ...
}
```
:::
### Hook 数据结构
我们来看一下 `Hook` 的数据结构：
```javascript
export type Hook = {|
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: UpdateQueue<any, any> | null,
  next: Hook | null,
|};
```
其中除 `memoizedState` 以外字段的意义与上一章介绍的 [updateQueue](/2019/11/20/react-source-state-update/#updatequeue) 类似
### memoizedState
::: warning
`hook` 与 `FunctionComponent fiber` 都存在 `memoizedState` 属性，不要混淆他们的概念。
* `fiber.memoizedState` ：`FunctionComponent` 对应 `fiber` 保存的 `Hooks` 链表。
* `hook.memoizedState` ：`Hooks` 链表中保存的单一 `hook` 对应的数据。
:::
不同类型hook的memoizedState保存不同类型数据，具体如下：
* `useState` ：对于 `const [state, updateState] = useState(initialState);` ， `memoizedState` 保存 `state` 的值
* `useReducer` ：对于 `const [state, dispatch] = useReducer(reducer, {});` ， `memoizedState` 保存 `state` 的值
* `useEffect` ： `memoizedState` 保存包含 `useEffect` 回调函数、依赖项等的链表数据结构 `effect`。`effect 链表` 同时会保存在 `fiber.updateQueue` 中
* `useRef` ：对于 `useRef(1)` ， `memoizedState` 保存 `{current: 1}`
* `useMemo` ：对于 `useMemo(callback, [depA])` ， `memoizedState` 保存 `[callback(), depA]` 
* `useCallback` ：对于 `useCallback(callback, [depA])` ， `memoizedState` 保存 `[callback, depA]` 。与 `useMemo` 的区别是， `useCallback` 保存的是 `callback` 函数本身，而`useMemo` 保存的是 `callback` 函数的执行结果

有些 `hook` 是没有 `memoizedState` 的，比如：`useContext`。
## useState & useReducer
## useEffect
## useRef
## useMemo & useCallback