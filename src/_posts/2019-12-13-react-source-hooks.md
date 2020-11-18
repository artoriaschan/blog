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
![usestate-process](~@assets/posts/react-source-hooks/usestate-process.png)
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
Redux的作者Dan加入React核心团队后的一大贡献就是 "**将 `Redux` 的理念带入 `React`** "。

这里面最显而易见的影响莫过于 `useState` 与 `useReducer` 这两个 `Hook`。本质来说，`useState` 只是预置了 `reducer` 的 `useReducer`。

本节我们来学习 `useState` 与 `useReducer` 的实现。
### 流程概览
我们将这两个 `Hook` 的工作流程分为 `申明阶段` 和 `调用阶段`，对于：
```jsx {12-13,22,24-25}
function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1};
    case 'decrement':
      return {count: state.count - 1};
    default:
      throw new Error();
  }
}
function Demo() {
  const [num, updateNum] = useState(0);
  const [state, dispatch] = useReducer(reducer, {count: 1});

  function handleButtonClick(){
    updateNum(num => num + 1)
  }

  return (
    <div className="App">
      <p>{num}</p>
      <button onClick={handleButtonClick}>计数</button>
      <p>{state.count}</p>
      <button onClick={() => dispatch({type: 'decrement'})}>-</button>
      <button onClick={() => dispatch({type: 'increment'})}>+</button>
    </div>
  );
}
```
`申明阶段` 即 `App` 调用时，会依次执行 `useReducer` 与 `useState` 方法。

`调用阶段` 即点击按钮后，`dispatch` 或 `updateNum` 被调用时。
### 申明阶段
当 `FunctionComponent` 进入 `Render阶段` 的 `beginWork` 函数时，会调用 `renderWithHooks` 函数。

在 `beginWork` 函数中，会根据 `workInProgress.tag` 执行相应的函数，这一部分的逻辑在之前的 [React 二阶段渲染文章](/2019/10/28/react-source-2steps-render/#beginwork)中详细介绍过。对于 `FunctionComponent` 来说， 会首先执行 `mountIndeterminateComponent` 函数。

对于 `mountIndeterminateComponent` 函数，
```javascript {34-41}
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
    !disableModulePatternComponents &&
    typeof value === 'object' &&
    value !== null &&
    typeof value.render === 'function' &&
    value.$$typeof === undefined
  ) {
    // 判断为 ClassComponent，执行 ClassComponent 相关的处理逻辑
  } else {

    // 判断为 FunctionComponent，执行 FunctionComponent 相关的处理逻辑
  }
}
```
在 renderWithHooks 函数中 会执行 `let children = Component(props, secondArg);` 来获取 `children`，从而会执行 `App()`，进而执行申明的 `Hooks` 。

对于这两个Hook，他们的源码如下：
```javascript
// packages/react/src/ReactHooks.js

export function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

export function useReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const dispatcher = resolveDispatcher();
  return dispatcher.useReducer(reducer, initialArg, init);
}
```
正如上一节 [dispatcher](#dispatcher) 所说，在不同场景下，同一个 `Hook` 会调用不同处理函数。

我们分别讲解 `mount` 与 `update` 两个场景。
#### mount 阶段
`mount` 时， `useReducer` 会调用 `mountReducer` ， `useState` 会调用 `mountState` 。

我们来简单对比这这两个方法：
```javascript {15,44}
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  const hook = mountWorkInProgressHook();
  if (typeof initialState === 'function') {
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: (initialState: any),
  });
  const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}

function mountReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = mountWorkInProgressHook();
  let initialState;
  if (init !== undefined) {
    initialState = init(initialArg);
  } else {
    initialState = ((initialArg: any): S);
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: (initialState: any),
  });
  const dispatch: Dispatch<A> = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
```
在 `mount阶段` 的 dispatcher 中， 都会调用 `const hook = mountWorkInProgressHook();`，`mountWorkInProgressHook` 方法会创建并返回对应 `hook`；
```javascript
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```
可以看到，`mount` 时这两个 `Hook` 源码的唯一区别为 `queue` 参数的 `lastRenderedReducer` 字段。

hook.queue 的数据结构如下：
```javascript
const queue = (hook.queue = {
  // 保存update对象
  pending: null,
  // 保存dispatchAction.bind()的值
  dispatch: null,
  // 上一次render时使用的reducer
  lastRenderedReducer: reducer,
  // 上一次render时的state
  lastRenderedState: (initialState: any),
});
```
其中，`useReducer` 的 `lastRenderedReducer` 为传入的 `reducer` 参数。`useState` 的 `lastRenderedReducer` 为 `basicStateReducer`。

`basicStateRender` 的定义如下：
```javascript
function basicStateReducer<S>(state: S, action: BasicStateAction<S>): S {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === 'function' ? action(state) : action;
}
```
可见， `useState` 即 `reducer参数` 为 `basicStateReducer` 的 `useReducer`。

两者都会返回 `return [hook.memoizedState, dispatch];`。
#### update 阶段
如果说 `mount` 时这两者还有区别，那 `update` 时，`useReducer` 与 `useState` 最终调用的则是同一个函数：`updateReducer` 。
```javascript {8,11}
// packages/react-reconciler/src/ReactFiberHooks.old.js

function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  // ...
  queue.lastRenderedReducer = reducer;

  // ...同 update 与 updateQueue 类似的更新逻辑, 获取 newSatte
  // 将 newState 赋值给 hook.memoizedState

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}
```
> 具体的 `updateQueue` 处理流程点击[此处](/2019/11/20/react-source-state-update/#updatequeue-处理流程)

整个流程可以概括为一句话：找到对应的 `hook` ，根据 `update` 计算该 `hook` 的新 `state` 并返回。

`mount阶段` 获取 `当前hook` 使用的是 `mountWorkInProgressHook` ，而 `update阶段` 使用的是 `updateWorkInProgressHook` ：
```javascript
// 此函数既用于更新，也用于由呈现阶段更新触发的重新呈现。
// 它假设存在一个我们可以克隆的当前钩子，或者一个从以前的渲染传递中复制过来的正在进行中的钩子，我们可以使用它作为 base。
// 当到达 base 列表的末尾时，必须切换到用于 mounts 的 dispatcher。
function updateWorkInProgressHook(): Hook {
  // 获得 nextCurrentHook
  let nextCurrentHook: null | Hook;
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }
  
  // 获得 nextWorkInProgressHook 
  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;
  } else {
    nextWorkInProgressHook = workInProgressHook.next;
  }

  if (nextWorkInProgressHook !== null) {
    workInProgressHook = nextWorkInProgressHook;
    nextWorkInProgressHook = workInProgressHook.next;

    currentHook = nextCurrentHook;
  } else {
    invariant(
      nextCurrentHook !== null,
      'Rendered more hooks than during the previous render.',
    );
    currentHook = nextCurrentHook;

    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };
    if (workInProgressHook === null) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
```
这里的原因是：
* `mount阶段` 时可以确定是调用 `ReactDOM.render` 或相关初始化API产生的更新，只会 `执行一次`。
* `update阶段` 可能是在 `事件回调` 或 `副作用` 中触发的 `更新` 或者是 `render阶段` 触发的 `更新` ，为了 `避免` 组件 `无限循环更新`，后者需要区别对待。

举个render阶段触发的更新的例子：
```javascript
function App() {
  const [num, updateNum] = useState(0);
  
  updateNum(num + 1);

  return (
    <button onClick={() => updateNum(num => num + 1)}>{num}</button>  
  )
}
```
在这个例子中， `App` 调用时，代表已经进入 `Render阶段` 执行 `renderWithHooks` 函数。

在 `App` 内部，调用 `updateNum` 会触发一次更新。如果不对这种情况下触发的更新作出限制，那么这次更新会开启一次新的 `Render阶段` ，最终会 `无限循环更新` 。

基于这个原因， `React` 用一个标记变量 `didScheduleRenderPhaseUpdate` 判断是否是 `Render阶段` 触发的更新。
```javascript {16} 
// packages/react-reconciler/src/ReactFiberHooks.old.js

function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  // ...
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  } else {
    // ...
  }
  // ...
}
```
`updateWorkInProgressHook` 方法也会 `区分` 这两种情况来获取对应 `hook` 。

获取对应 `hook` ，接下来会根据 `hook` 中保存的 `state` 计算 `新的state` ，这个步骤同 `状态更新计算newState` 一致。
### 调用阶段
调用阶段会执行 `dispatchAction` ，此时该 `FunctionComponent` 对应的 `fiber` 以及 `hook.queue` 已经通过调用 `bind` 方法预先作为参数传入。
```javascript {8-12}
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // ...

  const dispatch: Dispatch<
    BasicStateAction<S>,
  > = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  return [hook.memoizedState, dispatch];
}
```
而后执行 `dispatch` 之后只需要传入 `action参数` 即可：
```javascript {40-50,57}
// packages/react-reconciler/src/ReactFiberHooks.old.js

function dispatchAction<S, A>(
  fiber: Fiber,
  queue: UpdateQueue<S, A>,
  action: A,
) {
  // ...
  // 创建 update 
  const update: Update<S, A> = {
    lane,
    action,
    eagerReducer: null,
    eagerState: null,
    next: (null: any),
  };

  // 将update加入queue.pending
  // ...

  const alternate = fiber.alternate;
  if (
    fiber === currentlyRenderingFiber ||
    (alternate !== null && alternate === currentlyRenderingFiber)
  ) {
    // render 阶段触发的更新
    didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
  } else {
    // fiber 的 updateQueue 为空，优化路径
    if (
      fiber.lanes === NoLanes &&
      (alternate === null || alternate.lanes === NoLanes)
    ) {
      // 队列当前是空的，这意味着我们可以在进入 render 阶段之前快速计算下一个状态。
      // 如果新状态与当前状态相同，我们也许可以完全纾困。
      const lastRenderedReducer = queue.lastRenderedReducer;
      if (lastRenderedReducer !== null) {
        // ...
        try {
          const currentState: S = (queue.lastRenderedState: any);
          const eagerState = lastRenderedReducer(currentState, action);
          // 将快速计算的状态和用于计算它的reducer保存在update对象上。
          // 如果在我们进入渲染阶段的时候reducer还没有改变，那么 eagerState 可以使用而无需再次调用 reducer。
          update.eagerReducer = lastRenderedReducer;
          update.eagerState = eagerState;
          if (is(eagerState, currentState)) {
            // 快速路径。我们可以在不调度 React 去重新渲染的情况下退出。
            // 如果组件因为不同的原因重新渲染，并且到那时reducer已经改变了，我们仍然有可能需要在以后变基此 update。
            return;
          }
        } catch (error) {
        }
        // ...
      }
    }
    // 调度更新
    scheduleUpdateOnFiber(fiber, lane, eventTime);
  }
  // ...
  if (enableSchedulingProfiler) {
    markStateUpdateScheduled(fiber, lane);
  }
}
```
整个过程可以概括为：**创建 `update` ，将 `update` 加入 `queue.pending` 中，并开启调度**。

这里值得注意的是 `if...else...` 逻辑，其中：
```javascript
if (
  fiber === currentlyRenderingFiber ||
  (alternate !== null && alternate === currentlyRenderingFiber)
)
```
`currentlyRenderingFiber` 即 `workInProgress` ， `workInProgress` 存在代表当前处于 `render阶段` 。

触发更新时通过 `bind` 预先保存的 `fiber` 与 `workInProgress` 全等，代表本次更新发生于 `FunctionComponent` 对应 `fiber` 的 `render阶段` 。

所以这是一个 `render阶段` 触发的 `更新` ，需要标记变量 `didScheduleRenderPhaseUpdate` ，后续单独处理。

我们再来看 `else` 分支：
```javascript
if (
  fiber.lanes === NoLanes &&
  (alternate === null || alternate.lanes === NoLanes)
) 
```
`fiber.lanes` 保存 `fiber` 上存在的 `update` 的优先级。`fiber.lanes === NoLanes` 意味着 `fiber` 上不存在 `update` 。

我们已经知道，通过 `update` 计算 `state` 发生在 `申明阶段`，这是因为该 `hook` 上可能存在多个不同优先级的 `update` ，最终 `state` 的值由多个 `update` 共同决定。

但是当 `fiber` 上不存在 `update` ，则 `调用阶段` 创建的 `update` 为该 `hook` 上第一个 `update` ，在 `申明阶段` 计算 `state` 时也只 `依赖` 于该 `update` ，完全不需要进入 `申明阶段` 再计算 state 。

这样做的好处是：如果计算出的 `state` 与该 `hook` 之前保存的 `state` 一致，那么完全不需要开启一次调度。即使计算出的 `state` 与该 `hook` 之前保存的 `state` 不一致，在 `申明阶段` 也可以直接使用 `调用阶段` 已经计算出的 `state` 。
## useEffect
在[通过首次渲染看React两阶段渲染](/2019/10/28/react-source-2steps-render/#commit-阶段)我们讲解了useEffect的工作流程。

> 在 `flushPassiveEffects` 函数内部调用 `flushPassiveEffectsImpl` 函数，而其又会从全局变量 `rootWithPendingPassiveEffects` 获取 `effectList` 。

现在我们深入 `flushPassiveEffects` 方法内部探索 `useEffect` 的工作原理。
### flushPassiveEffectsImpl
`flushPassiveEffects` 内部会设置 `优先级` ，并执行 `flushPassiveEffectsImpl` 。
```javascript {17,22}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

export function flushPassiveEffects(): boolean {
  // Returns whether passive effects were flushed.
  if (pendingPassiveEffectsRenderPriority !== NoSchedulerPriority) {
    const priorityLevel =
      pendingPassiveEffectsRenderPriority > NormalSchedulerPriority
        ? NormalSchedulerPriority
        : pendingPassiveEffectsRenderPriority;
    pendingPassiveEffectsRenderPriority = NoSchedulerPriority;
    if (decoupleUpdatePriorityFromScheduler) {
      const previousLanePriority = getCurrentUpdateLanePriority();
      try {
        setCurrentUpdateLanePriority(
          schedulerPriorityToLanePriority(priorityLevel),
        );
        return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
      } finally {
        setCurrentUpdateLanePriority(previousLanePriority);
      }
    } else {
      return runWithPriority(priorityLevel, flushPassiveEffectsImpl);
    }
  }
  return false;
}
```
`flushPassiveEffectsImpl` 主要做三件事：
* 调用该 `useEffect` 在上一次 `render` 时的销毁函数
* 调用该 `useEffect` 在本次 `render` 时的回调函数
* 如果存在同步任务，不需要等待下次事件循环的宏任务，提前执行他
```javascript {36,53}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function flushPassiveEffectsImpl() {
  if (rootWithPendingPassiveEffects === null) {
    return false;
  }

  const root = rootWithPendingPassiveEffects;
  const lanes = pendingPassiveEffectsLanes;
  rootWithPendingPassiveEffects = null;
  pendingPassiveEffectsLanes = NoLanes;

  // ...

  const prevExecutionContext = executionContext;
  executionContext |= CommitContext;
  const prevInteractions = pushInteractions(root);

  // 在调用任何 passive effect 创建函数之前，必须先调用所有待处理的 passive effect 销毁函数，这一点很重要。
  // 否则，同级组件中的 effects 可能会相互干扰。例如一个组件中的 destroy 函数可能会无意中覆盖另一组件中 create 函数设置的 ref 值。
  // Layout effects 具有相同的约束。

  // First pass: Destroy stale passive effects.
  const unmountEffects = pendingPassiveHookEffectsUnmount;
  pendingPassiveHookEffectsUnmount = [];
  for (let i = 0; i < unmountEffects.length; i += 2) {
    const effect = ((unmountEffects[i]: any): HookEffect);
    const fiber = ((unmountEffects[i + 1]: any): Fiber);
    const destroy = effect.destroy;
    effect.destroy = undefined;
    // ...
    if (typeof destroy === 'function') {
      // ...
      try {
        // ...
        destroy();
      } catch (error) {
        invariant(fiber !== null, 'Should be working on an effect.');
        captureCommitPhaseError(fiber, error);
      }
    }
  }
  // Second pass: Create new passive effects.
  const mountEffects = pendingPassiveHookEffectsMount;
  pendingPassiveHookEffectsMount = [];
  for (let i = 0; i < mountEffects.length; i += 2) {
    const effect = ((mountEffects[i]: any): HookEffect);
    const fiber = ((mountEffects[i + 1]: any): Fiber);
    // ...
    try {
      const create = effect.create;
      // ...
      effect.destroy = create();
    } catch (error) {
      invariant(fiber !== null, 'Should be working on an effect.');
      captureCommitPhaseError(fiber, error);
    }
  }

  // 注意：当前假设在 root fiber 上没有 passive effects ，因为根不是其自身 effect list 的一部分。
  // 这在将来可能会改变。
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
  // ...
  executionContext = prevExecutionContext;
  // 执行同步任务
  flushSyncCallbackQueue();
  // ...
  return true;
}
```
目前我们先关注前两步。

在 `v16` 中第一步是同步执行的，在 [官方博客](https://zh-hans.reactjs.org/blog/2020/08/10/react-v17-rc.html#effect-cleanup-timing) 中提到：
> 副作用清理函数（如果存在）在 React 16 中同步运行。我们发现，对于大型应用程序来说，这不是理想选择，因为同步会减缓屏幕的过渡（例如，切换标签）。

基于这个原因，在v17.0.0中，useEffect的两个阶段会在页面渲染后（layout阶段后）异步执行。
> 事实上，从代码中看，v16.13.1中已经是异步执行了

接下来我们详细讲解这两个步骤。
### 阶段一：销毁函数的执行
`effect` 在每次渲染的时候都会执行。这就是为什么 `React` 会在执行当前 `effect` 之前对上一个 `effect` 进行清除。

`useEffect` 的执行需要保证所有组件 `useEffect` 的 `销毁函数` 必须都执行完后才能执行任意一个组件的 `useEffect` 的 `回调函数` 。

就如代码中的注释所举的例子体现的一样：可能存在多个组件间可能共用同一个ref。

如果不是按照“全部销毁”再“全部执行”的顺序，那么在某个组件 `useEffect` 的 `销毁函数` 中修改的 `ref.current` 可能影响另一个组件 `useEffect` 的 `回调函数` 中的同一个 `ref` 的 `current` 属性。

在 `useLayoutEffect` 中也有同样的问题，所以他们都遵循“全部销毁”再“全部执行”的顺序。

在阶段一，会遍历并执行所有 `useEffect` 的 `销毁函数` 。
```javascript {4,19}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> function flushPassiveEffectsImpl

// pendingPassiveHookEffectsUnmount中保存了所有需要执行销毁的useEffect
const unmountEffects = pendingPassiveHookEffectsUnmount;
pendingPassiveHookEffectsUnmount = [];
for (let i = 0; i < unmountEffects.length; i += 2) {
  // i 下标保存 effect
  const effect = ((unmountEffects[i]: any): HookEffect);
  // i + 1 下标保存 fiber
  const fiber = ((unmountEffects[i + 1]: any): Fiber);
  const destroy = effect.destroy;
  effect.destroy = undefined;
  // ...
  if (typeof destroy === 'function') {
    // ...
    try {
      // ...
      // 执行销毁函数
      destroy();
    } catch (error) {
      invariant(fiber !== null, 'Should be working on an effect.');
      captureCommitPhaseError(fiber, error);
    }
  }
}
```
向 `pendingPassiveHookEffectsUnmount` 数组内 `push数据` 的操作发生在 `layout阶段` 的 `commitLayoutEffectOnFiber` 函数内部的 `schedulePassiveEffects` 方法中。

其中 `commitLayoutEffectOnFiber` 为 `commitLifeCycles` 函数的别名。
> commitLayoutEffectOnFiber 方法我们在 [Layout阶段](/2019/10/28/react-source-2steps-render/#commitlayouteffectonfiber) 已经介绍
```javascript {15-16,29}
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function schedulePassiveEffects(finishedWork: Fiber) {
  const updateQueue: FunctionComponentUpdateQueue | null = (finishedWork.updateQueue: any);
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      const {next, tag} = effect;
      if (
        (tag & HookPassive) !== NoHookEffect &&
        (tag & HookHasEffect) !== NoHookEffect
      ) {
        enqueuePendingPassiveHookEffectUnmount(finishedWork, effect);
        enqueuePendingPassiveHookEffectMount(finishedWork, effect);
      }
      effect = next;
    } while (effect !== firstEffect);
  }
}

// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

export function enqueuePendingPassiveHookEffectUnmount(
  fiber: Fiber,
  effect: HookEffect,
): void {
  pendingPassiveHookEffectsUnmount.push(effect, fiber);
  
  if (!rootDoesHavePassiveEffects) {
    rootDoesHavePassiveEffects = true;
    scheduleCallback(NormalSchedulerPriority, () => {
      flushPassiveEffects();
      return null;
    });
  }
}
```
### 阶段二：回调函数的执行
与阶段一类似，同样遍历数组，执行对应 `effect` 的 `回调函数` 。

其中向 `pendingPassiveHookEffectsMount` 中 `push数据` 的操作同样发生在 `schedulePassiveEffects` 中。
```javascript {3,10-12}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js -> function flushPassiveEffectsImpl

const mountEffects = pendingPassiveHookEffectsMount;
pendingPassiveHookEffectsMount = [];
for (let i = 0; i < mountEffects.length; i += 2) {
  const effect = ((mountEffects[i]: any): HookEffect);
  const fiber = ((mountEffects[i + 1]: any): Fiber);
  // ...
  try {
    const create = effect.create;
    // ...
    effect.destroy = create();
  } catch (error) {
    invariant(fiber !== null, 'Should be working on an effect.');
    captureCommitPhaseError(fiber, error);
  }
}
```
## useRef
`ref` 是 `reference（引用）` 的缩写。和 `Vue` 相似， `React` 推荐用 `ref` 保存 `DOM对象` 。

事实上，任何需要被"引用"的数据都可以保存在 `ref` 中， `useRef` 的出现将这种思想进一步发扬光大。

在 `Hooks数据结构` 一节我们讲到：

对于 `useRef(1)` ， `memoizedState` 保存 `{current: 1}`

本节我们会介绍 `useRef` 的实现，以及 `ref` 的工作流程。

由于 `string类型` 的 `ref` 已不推荐使用，所以本节针对 `function | {current: any}类型` 的 `ref`。
### useRef的定义
与其他 `Hook` 一样，对于 `mount` 与 `update` ， `useRef` 对应两个不同 `dispatcher` 。
```javascript
// packages/react-reconciler/src/ReactFiberHooks.old.js

function mountRef<T>(initialValue: T): {|current: T|} {
  // 获取当前useRef hook
  const hook = mountWorkInProgressHook();
  // ...
  // 创建 ref
  const ref = {current: initialValue};
  // memoizedState 保存 ref 引用
  hook.memoizedState = ref;
  return ref;
}

function updateRef<T>(initialValue: T): {|current: T|} {
  // 获取当前useRef hook
  const hook = updateWorkInProgressHook();
  // 返回 memoizedState 中的 ref引用
  return hook.memoizedState;
}
```
可见， `useRef` 仅仅是返回一个包含 `current属性` 的 `对象` 。

为了验证这个观点，我们再看下 `React.createRef` 方法的实现：
```javascript {4-6}
// packages/react/src/ReactCreateRef.js

export function createRef(): RefObject {
  const refObject = {
    current: null,
  };
  // ...
  return refObject;
}
```
了解了 `ref` 的 `数据结构` 后，我们再来看看 `ref` 的 `工作流程` 。
### 工作流程
在React中，HostComponent、ClassComponent、ForwardRef可以赋值ref属性。
```javascript
// HostComponent
<div ref={domRef}></div>
// ClassComponent / ForwardRef
<App ref={cpnRef} />
```
其中，ForwardRef只是将ref作为第二个参数传递下去，不会进入ref的工作流程。

所以接下来讨论ref的工作流程时会排除ForwardRef。
```javascript
// packages/react-reconciler/src/ReactFiberHooks.old.js -> function renderWithHooks

// 对于ForwardRef，secondArg为传递下去的ref
let children = Component(props, secondArg);
```
我们知道 `HostComponent` 在 `commit阶段` 的 `mutaion阶段` 执行 `DOM操作` 。所以，对应 `ref` 的更新也是发生在 `mutaion阶段` 。

再进一步， `mutaion阶段` 执行 `DOM操作` 的依据为 `flags` 。

所以，对于 `HostComponent | ClassComponent` 如果包含 `ref` 操作，那么也会赋值相应的 `flags` 。
```javascript
// packages/react-reconciler/src/ReactFiberFlags.js

// You can change the rest (and add more).
export const Placement = /*                    */ 0b0000000000000000010;
export const Update = /*                       */ 0b0000000000000000100;
export const PlacementAndUpdate = /*           */ 0b0000000000000000110;
export const Deletion = /*                     */ 0b0000000000000001000;
// ...
```
所以， `ref` 的工作流程可以分为两部分：
* `render阶段` 为含有 `ref属性` 的 `fiber` 添加 `Ref flags`
* `commit阶段` 为包含 `Ref flags` 的 `fiber` 执行对应操作
### render 阶段
在 `render阶段` 的 `beginWork` 与 `completeWork` 中有个同名函数 `markRef` 用于为含有 `ref属性` 的 `fiber` 增加 `Ref flags`。
```javascript
// packages/react-reconciler/src/ReactFiberBeginWork.old.js

function markRef(current: Fiber | null, workInProgress: Fiber) {
  const ref = workInProgress.ref;
  if (
    (current === null && ref !== null) ||
    (current !== null && current.ref !== ref)
  ) {
    // Schedule a Ref effect
    workInProgress.flags |= Ref;
  }
}

// packages/react-reconciler/src/ReactFiberCompleteWork.old.js

function markRef(workInProgress: Fiber) {
  workInProgress.flags |= Ref;
}
```
在 `beginWork` 中，如下两处调用了 `markRef` ：
* `updateClassComponent` 内的 `finishClassComponent` ，对应 `ClassComponent` 
> 注意 `ClassComponent` 即使 `shouldComponentUpdate` 为 `false` 该组件也会调用 `markRef`
* `updateHostComponent` 函数，对应 `HostComponent`

在 `completeWork` 中，如下两处调用了 `markRef` ：
* `completeWork` 中的 `HostComponent` 类型
* `completeWork` 中的 `ScopeComponent` 类型

`ScopeComponent` 是一种用于 `管理focus` 的测试特性，详见[这个PR](https://github.com/facebook/react/pull/16587)

总结下组件对应 `fiber` 被赋值 `Ref flags` 需要满足的条件：
* `fiber类型` 为 `HostComponent` 、 `ClassComponent` 、 `ScopeComponent` （这种情况我们不讨论）
* 对于 `mount` ， `workInProgress.ref !== null` ，即存在 `ref属性` 
* 对于 `update` ， `current.ref !== workInProgress.ref` ，即 `ref属性改变` 
### commit 阶段
在 `commit阶段` 的 `mutation阶段` 中，对于 `ref属性` 改变的情况，需要先移除之前的 `ref属性` 。
```javascript {21}
// packages/react-reconciler/src/ReactFiberWorkLoop.old.js

function commitMutationEffects(
  root: FiberRoot,
  renderPriorityLevel: ReactPriorityLevel,
) {
  // TODO: Should probably move the bulk of this function to commitWork.
  while (nextEffect !== null) {
    setCurrentDebugFiberInDEV(nextEffect);

    const flags = nextEffect.flags;

    if (flags & ContentReset) {
      commitResetTextContent(nextEffect);
    }

    if (flags & Ref) {
      const current = nextEffect.alternate;
      if (current !== null) {
        // 移除之前的ref
        commitDetachRef(current);
      }
      // ...
    }
    // ...
  }
}
```
我们来看一下 `commitDetachRef` 函数的定义：
```javascript {8}
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitDetachRef(current: Fiber) {
  const currentRef = current.ref;
  if (currentRef !== null) {
    if (typeof currentRef === 'function') {
      // ...
      currentRef(null);
    } else {
      currentRef.current = null;
    }
  }
}
```
接下来，在 `mutation阶段` ，对于 `Deletion flags` 的 `fiber` （对应需要删除的DOM节点），需要递归他的子树，对 `子孙fiber` 的 `ref` 执行类似 `commitDetachRef` 的操作。

我们在 [通过首次渲染看React两阶段渲染 - Mutation阶段](/2019/10/28/react-source-2steps-render/#deletion-effect) 讲到：
> 而实际上对于 `Deletion flags` 的 `fiber` ，会执行 `commitDeletion` 。

在 `commitDeletion` —— `unmountHostComponents` —— `commitUnmount` —— `ClassComponent | HostComponent类型` 的 `case` 中调用的 `safelyDetachRef` 函数负责执行类似 `commitDetachRef` 的操作。
```javascript {10,15}
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function safelyDetachRef(current: Fiber) {
  const ref = current.ref;
  if (ref !== null) {
    if (typeof ref === 'function') {
        // ...
        try {
          // ...
          ref(null);
        } catch (refError) {
          captureCommitPhaseError(current, refError);
        }
    } else {
      ref.current = null;
    }
  }
}
```
接下来进入 `ref` 的赋值阶段。我们在[通过首次渲染看React两阶段渲染 - Layout阶段](/2019/10/28/react-source-2steps-render/#commitlayouteffects) 讲到：
> `commitLayoutEffect` 会执行 `commitAttachRef` （赋值ref）
```javascript
// packages/react-reconciler/src/ReactFiberCommitWork.old.js

function commitAttachRef(finishedWork: Fiber) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    // 获取ref属性对应的Component实例
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
    // 赋值ref
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
至此，ref的工作流程完毕。
## useMemo & useCallback