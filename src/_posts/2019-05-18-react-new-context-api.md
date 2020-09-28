---
title: React的新版Context API
date: 2019-05-18
tags:
  - react
author: ArtoriasChan
location: Beijing  
---

# React的新版Context API

React从16.3版本开始，更新了新版的Context API，使用了更加优雅的方式在组件中传递props属性，官网中对Context有以下的介绍
> Context 通过组件树提供了一个传递数据的方法，从而避免了在每一个层级手动的传递 props 属性。


## API介绍
### React.createContext
```javascript
const {Provider, Consumer} = React.createContext(defaultValue);
```

创建一对 `{ Provider, Consumer }`。当 React 渲染 context 组件 Consumer 时，它将从组件树的上层中最接近的匹配的 Provider 读取当前的 context 值。

**如果上层的组件树没有一个匹配的 Provider，而此时你需要渲染一个 Consumer 组件，那么你可以用到 defaultValue**``** 。这有助于在不封装它们的情况下对组件进行测试。**

### Provider
```javascript
<Provider value={/* some value */}>
```

React 组件允许 Consumers 订阅 context 的改变。

接收一个 `value` 属性传递给 Provider 的后代 Consumers。一个 Provider 可以联系到多个 Consumers。Providers 可以被嵌套以覆盖组件树内更深层次的值。

### Consumer
```javascript
<Consumer>
  {value => /* render something based on the context value */}
</Consumer>
```

一个可以订阅 context 变化的 React 组件。

接收一个 [函数作为子节点](https://react.docschina.org/docs/render-props.html#using-props-other-than-render). 函数接收当前 context 的值并返回一个 React 节点。传递给函数的 `value` 将等于组件树中上层 context 的最近的 Provider 的 `value` 属性。如果 context 没有 Provider ，那么 `value` 参数将等于被传递给 `createContext()` 的 `defaultValue` 。

每当Provider的值发送改变时, 作为Provider后代的所有Consumers都会重新渲染。 **从Provider到其后代的Consumers传播不受shouldComponentUpdate方法的约束，因此即使祖先组件退出更新时，后代Consumer也会被更新。**

通过使用与[Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is#Description)相同的算法比较新值和旧值来确定变化。

## 范例
使用新版Context API和Mobx写一个TodoList
### 1.目录结构
![](~@assets/react-new-context-api/1536220593388-94382a12-da62-45f9-ab97-2028716dc6bb.png)
### 2.编写Store
使用Mobx编写Store
```javascript
import {observable,action,computed,configure} from 'mobx'
//严格模式，必须action来修改state
configure({ enforceActions: true }) 
export default class Store{
    // 定义可观察状态
    @observable todos = [
        {
            id:1,
            title:'todo标题',
            done:false,
        },
        {
            id:2,
            title:'已经完成todo的标题',
            done:true,
        }
    ]
    @observable id = 3
    // 定义Actions
    @action changeTodoTitle({index,title,done}){
        this.todos[index].title = title
        this.todos[index].done = done
    }
    // 改变Todo的状态
    @action isShow(id){
        this.todos.forEach((item,index) => {
            if(item.id === id){
                item.done = !item.done
            }
        })
    }
    // 增长id，严格模式下，所有的state必须用action改变
    @action growId(){
        this.id += 1
    }
    // 新加Todo
    @action setUnfinishedTodos(todo){
        console.log(todo)
        todo.id = this.id
        this.growId()
        this.todos = this.todos.concat(todo)
    }
    // 获得完成的todos
    @computed get finishedTodos(){
        return this.todos.filter((todo) => todo.done)
    }
    // 获得未完成的todos
    @computed get unfinishedTodos(){
        return this.todos.filter((todo) => {
            return !todo.done
        })
    }
}
```

### 2.编写Context
```javascript
import React from 'react'
import Store from '../store'
const store = new Store()
// 使用新版的content Api
// 设置defaultValue，当Consumer没有被Provider包裹时，会调用默认store
const {Provider, Consumer} = React.createContext(store);
export {
    Provider,
    Consumer
}
```

### 3.编写App组件
```javascript
import React, { Component } from 'react';
import './App.css';
import Hello from './components/Hello'
import { Consumer} from './context'

class App extends Component {
  render() {
    return (
      // 应用Consumer组件
      <Consumer>
      // render props
      {(store) => (
          <Hello {...this.props} store={store}/>
      )}
      </Consumer>
    );
  }
}

export default App;
```

### 4.编写index.js
```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import registerServiceWorker from './registerServiceWorker';
import App from './App'
ReactDOM.render(
        <App/>
    , document.getElementById('root'));
registerServiceWorker();
```
其实可以使用Provider将App进行包裹
```javascript
ReactDOM.render(
    <Provider value={store}>
        <App/>
    </Provider>
    , document.getElementById('root'));
```

