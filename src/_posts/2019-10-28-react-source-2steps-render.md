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
## render 阶段
### beginWork
### completeWork
## commit 阶段
### beforeMutation 阶段
### mutation 阶段
### layout 阶段
