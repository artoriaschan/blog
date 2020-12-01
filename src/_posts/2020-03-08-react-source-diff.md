---
title: ⚛ React 源码解读(六)
subtitle: Diff in React
date: 2020-03-08
tags:
  - react
author: ArtoriasChan
location: Beijing  
---
## 概览
在[React两阶段渲染 - Render阶段](/2019/10/28/react-source-2steps-render/#reconcilechildren)中提到：
::: warning
对于 `update` 的组件，他会将当前组件与该组件在上次更新时对应的 `Fiber节点` 比较（也就是俗称的 `Diff算法` ），将比较的结果生成新 `Fiber节点` 。
:::
这一章我们讲解 `Diff算法` 的实现。可以通过官网的[协调](https://zh-hans.reactjs.org/docs/reconciliation.html)这篇文章了解 `React` 使用 `Diff算法` 的初衷。
::: warning 为了防止概念混淆，这里再强调下
一个 `DOM节点` 在某一时刻最多会有4个节点和他相关。
* `current Fiber`。如果该 `DOM节点` 已在页面中， `current Fiber` 代表该 `DOM节点` 对应的 `Fiber节点` 。
* `workInProgress Fiber`。如果该 `DOM节点` 将在本次更新中渲染到页面中， `workInProgress Fiber` 代表该 `DOM节点` 对应的 `Fiber节点` 。
* `DOM节点` 本身。
* `JSX对象`。即 `ClassComponent` 的 `render方法` 的返回结果，或 `FunctionComponent` 的调用结果。 `JSX对象` 中包含描述 `DOM节点` 的信息。

Diff算法的本质是对比1和4，生成2。
:::
### Diff的瓶颈以及React如何应对
根据官网的介绍，由于 `Diff` 操作本身也会带来 `性能损耗` ，即使在 `最前沿` 的算法中，将前后两棵树完全比对的算法的复杂程度为 `O(n^3)` ，其中 `n` 是树中元素的数量。
> 如果在 `React` 中使用了该算法，那么展示 `1000` 个元素所需要执行的计算量将在十亿的量级范围。这个开销实在是太过高昂。

为了降低算法复杂度， 于是 `React` 在以下两个假设的基础之上提出了一套 `O(n)` 的 `启发式算法` ：
* 两个 `不同` 类型的元素会产生出 `不同` 的树；
  * 如果元素由 div 变为 p ， React 会销毁 div 及其子孙节点，并新建 p 及其子孙节点。
* 开发者可以通过 `key prop` 来暗示哪些子元素在不同的渲染下能保持稳定；
```html
<ul>
  <li key="2015">Duke</li>
  <li key="2016">Villanova</li>
</ul>

<ul>
  <li key="2014">Connecticut</li>
  <li key="2015">Duke</li>
  <li key="2016">Villanova</li>
</ul>
```
当子元素拥有 `key` 时， `React` 使用 `key` 来匹配原有树上的子元素以及最新树上的子元素。现在 `React` 知道只有带着 `'2014'` key 的元素是新元素，带着 `'2015'` 以及 `'2016'` key 的元素仅仅移动了。
### Diff是如何实现的
我们从 `Diff` 的入口函数 `reconcileChildFibers` 出发，该函数会根据 `newChild` （即 `JSX对象` ）类型调用不同的 `处理函数` 。
```javascript
// packages/react-reconciler/src/ReactChildFiber.old.js

function reconcileChildFibers(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  // 处理顶级非键片段，两种情况：<>{[...]}</> 和 <>...</>.
  const isUnkeyedTopLevelFragment =
    typeof newChild === 'object' &&
    newChild !== null &&
    newChild.type === REACT_FRAGMENT_TYPE &&
    newChild.key === null;
  if (isUnkeyedTopLevelFragment) {
    newChild = newChild.props.children;
  }

  // Handle object types
  const isObject = typeof newChild === 'object' && newChild !== null;

  if (isObject) {
    // object类型，可能是 REACT_ELEMENT_TYPE, REACT_PORTAL_TYPE, REACT_LAZY_TYPE
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE:
        return placeSingleChild(
          reconcileSingleElement(
            returnFiber,
            currentFirstChild,
            newChild,
            lanes,
          ),
        );
      // 省略其他case ...
    }
  }

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    // 调用 reconcileSingleTextNode 处理
    // ...
  }

  if (isArray(newChild)) {
    // 调用 reconcileChildrenArray 处理
    // ...
  }  

  if (getIteratorFn(newChild)) {
    // 调用 reconcileChildrenArray 处理
    // ...
  }
  // 一些其他情况调用处理函数
  // ...

  // 以上都没有命中，删除节点
  return deleteRemainingChildren(returnFiber, currentFirstChild);
}
```
我们可以从同级的节点数量将Diff分为两类：
* 当newChild类型为object、number、string，代表同级只有一个节点
* 当newChild类型为Array、迭代器，同级有多个节点

在接下来两节我们会分别讨论这两类节点的Diff。
## 单节点 Diff
对于单个节点，我们以 `类型object` 为例，会进入 `reconcileSingleElement` 函数：
```javascript {13,18,33,37}
// packages/react-reconciler/src/ReactChildFiber.old.js

function reconcileSingleElement(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  element: ReactElement,
  lanes: Lanes,
): Fiber {
  const key = element.key;
  let child = currentFirstChild;
  while (child !== null) {
    // 首先比较key是否相同
    if (child.key === key) {
      // key相同，接下来比较type是否相同
      switch (child.tag) {
        // 省略其他case ...
        default: {
          if (child.elementType === element.type) {
            deleteRemainingChildren(returnFiber, child.sibling);
            const existing = useFiber(child, element.props);
            existing.ref = coerceRef(returnFiber, child, element);
            existing.return = returnFiber;
            return existing;
            // type相同则表示可以复用
            // 返回复用的fiber
          }
          // type不同则跳出循环
          break;
        }
      }
      // 代码执行到这里代表：key相同但是type不同
      // 将该fiber及其兄弟fiber标记为删除
      deleteRemainingChildren(returnFiber, child);
      break;
    } else {
      // key不同，将该fiber标记为删除
      deleteChild(returnFiber, child);
    }
    child = child.sibling;
  }
  // 根据 element 创建新的 fiber，并返回
  if (element.type === REACT_FRAGMENT_TYPE) {
    const created = createFiberFromFragment(
      element.props.children,
      returnFiber.mode,
      lanes,
      element.key,
    );
    created.return = returnFiber;
    return created;
  } else {
    const created = createFiberFromElement(element, returnFiber.mode, lanes);
    created.ref = coerceRef(returnFiber, currentFirstChild, element);
    created.return = returnFiber;
    return created;
  }
}
```
根据 `React` 预设的限制，从代码可以看出，React 通过先判断 key 是否相同，如果 key 相同则判断 type 是否相同，只有都相同时一个 DOM节点 才能复用。

这里有个细节需要关注下：
* 当 `child !== null` 且 `key相同` 且 `type不同` 时执行 `deleteRemainingChildren` 将 `child` 及其 `兄弟fiber` 都标记 `删除` 。
* 当 `child !== null` 且 `key不同` 时仅将 `child` 标记 `删除` 。

我们考虑如下的例子：当前页面有 `3个li` ，我们要 `全部删除` ，再插入一个 `p` 。

由于本次更新时只有一个 `p` ，属于 `单一节点` 的 `Diff` ，会走上面介绍的代码逻辑。

在 `reconcileSingleElement` 中遍历之前的3个 `fiber` （对应的 `DOM` 为 `3个li` ），寻找本次更新的 `p` 是否可以复用之前的 `3个fiber` 中某个的 `DOM` 。

当 `key相同` 且 `type不同` 时，代表我们已经找到本次更新的p对应的上次的 `fiber` ，但是 `p` 与 `li type` 不同，不能复用。既然唯一的可能性已经不能复用，则剩下的 `fiber` 都没有机会了，所以都需要标记删除。

当 `key不同` 时只代表遍历到的 `该fiber` 不能被 `p` 复用 ，后面还有 `兄弟fiber` 还没有遍历到。所以仅仅标记该 `fiber` 删除。

::: warning
`deleteRemainingChildren` 函数及 `deleteChild` 函数定义如下：
```javascript
// packages/react-reconciler/src/ReactChildFiber.old.js

function deleteRemainingChildren(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
): null {
  if (!shouldTrackSideEffects) {
    // Noop.
    return null;
  }

  let childToDelete = currentFirstChild;
  while (childToDelete !== null) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
  return null;
}

  function deleteChild(returnFiber: Fiber, childToDelete: Fiber): void {
  if (!shouldTrackSideEffects) {
    // Noop.
    return;
  }
  // 将 childToDelete 插入 returnFiber 的 effectList 中
  const last = returnFiber.lastEffect;
  if (last !== null) {
    last.nextEffect = childToDelete;
    returnFiber.lastEffect = childToDelete;
  } else {
    returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
  }
  childToDelete.nextEffect = null;
  // 将 childToDelete 的 flags 标记为 Deletion
  childToDelete.flags = Deletion;
}
```
:::
## 多节点 Diff
上一节我们介绍了 单一节点 的 Diff ，现在考虑我们有一个 FunctionComponent ：
```javascript
function List () {
  return (
    <ul>
      <li key="0">0</li>
      <li key="1">1</li>
      <li key="2">2</li>
      <li key="3">3</li>
    </ul>
  )
}
```
他的返回值 JSX对象 的 children属性 不是 单一节点 ，而是包含四个对象的数组：
```javascript
{
  $$typeof: Symbol(react.element),
  key: null,
  props: {
    children: [
      {$$typeof: Symbol(react.element), type: "li", key: "0", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "1", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "2", ref: null, props: {…}, …}
      {$$typeof: Symbol(react.element), type: "li", key: "3", ref: null, props: {…}, …}
    ]
  },
  ref: null,
  type: "ul"
}
```
这种情况下，reconcileChildFibers 函数中的 newChild参数 类型为 Array ，在 reconcileChildFibers 函数内部对应如下情况：
```javascript {4-9}
// packages/react-reconciler/src/ReactChildFiber.old.js -> reconcileChildFibers function

if (isArray(newChild)) {
  return reconcileChildrenArray(
    returnFiber,
    currentFirstChild,
    newChild,
    lanes,
  );
}
```
这一节我们来看看，如何处理同级多个节点的Diff。
### 概览
首先归纳下我们需要处理的情况：我们以 `之前` 代表 `更新前` 的 `JSX对象` ， `之后` 代表 `更新后` 的 `JSX对象` 
#### 情况1：节点更新
```html
<!-- 之前 -->
<ul>
  <li key="0" className="before">0<li>
  <li key="1">1<li>
</ul>

<!-- 之后 情况1 —— 节点属性变化 -->
<ul>
  <li key="0" className="after">0<li>
  <li key="1">1<li>
</ul>

<!-- 之后 情况2 —— 节点类型更新 -->
<ul>
  <div key="0">0<li>
  <li key="1">1<li>
</ul>
```
#### 情况2：节点新增或减少
```html
<!-- 之前 -->
<ul>
  <li key="0">0<li>
  <li key="1">1<li>
</ul>

<!-- 之后 情况1 —— 新增节点 -->
<ul>
  <li key="0">0<li>
  <li key="1">1<li>
  <li key="2">2<li>
</ul>

<!-- 之后 情况2 —— 删除节点 -->
<ul>
  <li key="1">1<li>
</ul>
```
#### 情况3：节点位置变化
```html
<!-- 之前 -->
<ul>
  <li key="0">0<li>
  <li key="1">1<li>
</ul>

<!-- 之后 -->
<ul>
  <li key="1">1<li>
  <li key="0">0<li>
</ul>
```
同级 `多个节点` 的 `Diff` ，一定属于以上三种情况中的 `一种` 或 `多种`。
### Diff 的思路
该如何设计算法呢？如果让我设计一个 Diff算法 ，我首先想到的方案是：
* 判断当前节点的 `变化` 属于哪种情况
* 如果是 `新增` ，执行 `新增逻辑`
* 如果是 `删除` ，执行 `删除逻辑`
* 如果是 `更新` ，执行 `更新逻辑`

按这个方案，其实有个隐含的前提 —— 不同操作的 `优先级` 是 `相同` 的。
但是 `React团队` 发现，在日常开发中，相较于 `新增` 和 `删除` ， `更新` 组件发生的频率更高。所以 `Diff` 会优先判断当前节点是否属于 `更新` 。
::: warning
在我们做数组相关的算法题时，经常使用 `双指针` 从数组头和尾同时遍历以提高效率，但是这里却不行。

虽然本次更新的 `JSX对象` `newChildren` 为数组形式，但是和 `newChildren` 中每个组件进行比较的是 `current fiber` ，同级的 `Fiber节点` 是由 `sibling指针` 链接形成的 `单链表` ，即不支持 `双指针遍历` 。

即 `newChildren[0]` 与 `fiber` 比较， `newChildren[1]` 与 `fiber.sibling` 比较。

所以无法使用双指针优化。
:::
基于以上原因， `Diff算法` 的整体逻辑会经历 `两轮遍历` ：
* 第一轮遍历：处理 `更新` 的节点。
* 第二轮遍历：处理剩下的 `不属于更新` 的节点。
### 第一轮遍历
第一轮遍历步骤如下：
* 1. `let i = 0` ，遍历 `newChildren` ，将 `newChildren[i]` 与 `oldFiber` 比较，判断 `DOM节点` 是否可复用。
* 2. 如果 `可复用` ， `i++` ，继续比较 `newChildren[i]` 与 `oldFiber.sibling` ，可以 `复用` 则 `继续遍历` 。
* 3. 如果不可复用，分两种情况: (主要的判断逻辑在 `updateSlot` 函数中)
  * `key不同` 导致不可复用，立即 `跳出整个遍历` ，第一轮遍历结束。
  * `key相同` `type不同` 导致不可复用，会将 `oldFiber` 标记为 `DELETION` ，并继续遍历
* 4. 如果 `newChildren` 遍历完（即 `newIdx === newChildren.length` ）或者 `oldFiber` 遍历完（即 `oldFiber === null` ），跳出遍历，第一轮遍历结束。
```javascript {26-31,33-38,41-43,100-113}
// packages/react-reconciler/src/ReactChildFiber.old.js

function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<*>,
  lanes: Lanes,
): Fiber | null {

  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;

  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    // oldFiber 和 newChildren[newIdx] 比较
    const newFiber = updateSlot(
      returnFiber,
      oldFiber,
      newChildren[newIdx],
      lanes,
    );
    // 若不可复用，直接跳出循环
    if (newFiber === null) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }
    if (shouldTrackSideEffects) {
      // key 相同， type 不同， 标记 oldFiber 为 DELETION
      if (oldFiber && newFiber.alternate === null) {
        deleteChild(returnFiber, oldFiber);
      }
    }
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }
  // 遍历完 newChildren
  if (newIdx === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
    return resultingFirstChild;
  }
  // 遍历完 oldFiber
  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
      if (newFiber === null) {
        continue;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }
  // ...
  return resultingFirstChild;
}

function updateSlot(
  returnFiber: Fiber,
  oldFiber: Fiber | null,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  // Update the fiber if the keys match, otherwise return null.

  const key = oldFiber !== null ? oldFiber.key : null;

  if (typeof newChild === 'string' || typeof newChild === 'number') {
    if (key !== null) {
      return null;
    }
    return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
  }

  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        if (newChild.key === key) {
          if (newChild.type === REACT_FRAGMENT_TYPE) {
            return updateFragment(
              returnFiber,
              oldFiber,
              newChild.props.children,
              lanes,
              key,
            );
          }
          return updateElement(returnFiber, oldFiber, newChild, lanes);
        } else {
          return null;
        }
      }
      // 省略其他 case ...
    }

    if (isArray(newChild) || getIteratorFn(newChild)) {
      if (key !== null) {
        return null;
      }
      return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
    }
    // ...
  }

  return null;
}
```

当遍历结束后，会有两种结果：
#### 步骤3跳出的遍历
此时newChildren没有遍历完，oldFiber也没有遍历完。

举个例子，考虑如下代码：
```html
<!-- 之前 -->
<li key="0">0</li>
<li key="1">1</li>
<li key="2">2</li>

<!-- 之后 -->
<li key="0">0</li>
<li key="2">1</li>
<li key="1">2</li>
```
第一个节点可复用，遍历到 `key === 2` 的节点发现 key 改变，不可复用，跳出遍历，等待第二轮遍历处理。

此时 `oldFiber` 剩下 `key === 1` 、 `key === 2` 未遍历， `newChildren` 剩下 `key === 2` 、 `key === 1` 未遍历。
#### 步骤4跳出的遍历
可能 `newChildren` 遍历完，或 `oldFiber` 遍历完，或他们同时遍历完。

举个例子，考虑如下代码：
```html
<!-- 之前 -->
<li key="0" className="a">0</li>
<li key="1" className="b">1</li>

<!-- 之后 情况1 —— newChildren与oldFiber都遍历完 -->
<li key="0" className="aa">0</li>
<li key="1" className="bb">1</li>

<!-- 之后 情况2 —— newChildren没遍历完，oldFiber遍历完 -->
<!-- newChildren剩下 key==="2" 未遍历 -->
<li key="0" className="aa">0</li>
<li key="1" className="bb">1</li>
<li key="2" className="cc">2</li>

<!-- 之后 情况3 —— newChildren遍历完，oldFiber没遍历完 -->
<!-- oldFiber剩下 key==="1" 未遍历 -->
<li key="0" className="aa">0</li>
```
带着第一轮遍历的结果，我们开始第二轮遍历。
### 第二轮遍历
对于第一轮遍历的结果，我们分别讨论：
#### newChildren与oldFiber同时遍历完
那就是最理想的情况：只需在第一轮遍历进行组件更新。此时 `Diff` 结束。

函数的出口同 `newChildren遍历完，oldFiber没遍历完` 情况一致
#### newChildren遍历完，oldFiber没遍历完
意味着本次更新比之前的节点 `数量少` ，有节点 `被删除` 了。所以需要遍历剩下的 `oldFiber` ，依次标记 `Deletion` 。
```javascript
// 遍历完 newChildren
if (newIdx === newChildren.length) {
  deleteRemainingChildren(returnFiber, oldFiber);
  return resultingFirstChild;
}
```
#### newChildren没遍历完，oldFiber遍历完
已有的 `DOM节点` 都复用了，这时还有新加入的节点，意味着本次更新有 `新节点` 插入，我们只需要遍历剩下的 `newChildren` 为生成的 `workInProgress fiber` 依次标记 `Placement` 。
```javascript
// 遍历完 oldFiber
if (oldFiber === null) {
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
    if (newFiber === null) {
      continue;
    }
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
    if (previousNewFiber === null) {
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }
  return resultingFirstChild;
}
```
#### newChildren与oldFiber都没遍历完
这意味着有节点在这次更新中 `改变了位置` 。

这是 `Diff算法` `最精髓` 也是 `最难懂` 的部分。我们接下来会重点讲解。
```javascript {10,32,55-62}
// packages/react-reconciler/src/ReactChildFiber.old.js

function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<*>,
  lanes: Lanes,
): Fiber | null {
  // ...
  let lastPlacedIndex = 0;
  // ...
  for (; newIdx < newChildren.length; newIdx++) {
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes,
    );
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          // The new fiber is a work in progress, but if there exists a
          // current, that means that we reused the fiber. We need to delete
          // it from the child list so that we don't add it to the deletion
          // list.
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key,
          );
        }
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }
  // ...
  return resultingFirstChild;
}

function placeChild(
  newFiber: Fiber,
  lastPlacedIndex: number,
  newIndex: number,
): number {
  newFiber.index = newIndex;
  // ...
  const current = newFiber.alternate;
  if (current !== null) {
    const oldIndex = current.index;
    if (oldIndex < lastPlacedIndex) {
      // 移动
      newFiber.flags = Placement;
      return lastPlacedIndex;
    } else {
      // lastPlacedIndex = oldIndex 未移动
      return oldIndex;
    }
  } else {
    // 插入
    newFiber.flags = Placement;
    return lastPlacedIndex;
  }
}
```
### 处理移动的节点
由于有节点改变了位置，所以不能再用 `位置索引i` 对比前后的节点，那么如何才能将同一个节点在两次更新中对应上呢？

我们需要使用 `key` 。

为了快速的找到 `key` 对应的 `oldFiber` ，我们将所有还未处理的 `oldFiber` 存入以 `key` 为 `key` ， `oldFiber` 为 `value` 的 `Map` 中。
```javascript
const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
```
接下来遍历剩余的 `newChildren` ，通过 `newChildren[i].key` 就能在 `existingChildren` 中找到 `key` 相同的 `oldFiber` 。
### 标记节点是否移动
既然我们的目标是寻找 `移动的节点` ，那么我们需要明确：节点是否移动是以什么为 `参照物` ？

我们的参照物是：最后一个可复用的节点在 `oldFiber` 中的位置索引（用变量 `lastPlacedIndex` 表示）。

由于本次更新中节点是按 `newChildren` 的顺序排列。在遍历 `newChildren` 过程中，每个遍历到的 `可复用节点` 一定是当前遍历到的 `所有可复用节点` 中 `最靠右` 的那个，即一定在 `lastPlacedIndex` 对应的 `可复用的节点` 在本次更新中位置的 `后面` 。

那么我们只需要比较遍历到的 `可复用节点` 在上次更新时是否也在 `lastPlacedIndex` 对应的 `oldFiber` 后面，就能知道两次更新中这两个节点的 `相对位置` 改变没有。

我们用变量 `oldIndex` 表示遍历到的可复用节点在 `oldFiber` 中的位置索引。如果 `oldIndex < lastPlacedIndex` ，代表本次更新该节点需要 `向右移动` 。

`lastPlacedIndex` 初始为 `0`，每遍历一个可复用的节点，如果 `oldIndex >= lastPlacedIndex` ，则 `lastPlacedIndex = oldIndex`。
## 总结
👻