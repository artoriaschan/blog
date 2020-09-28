---
title: Vue的观察者模式
date: 2019-05-26
tags:
  - vue
  - 设计模式
author: ArtoriasChan
location: Beijing  
---

## 观察者模式的定义
观察者模式描述的是一种一对多的关系「一个被观察者对应多个观察者」，当被观察者的状态发生改变时，所有观察者都会得到通知。通俗的理解：观察者模式就是在特定的时刻「被观察者发送通知」干特定的事情「观察者收到通知处理自己相应的事件」<br />观察者模式的三要素：观察者，被观察者，事件「订阅」

## 观察者的应用
其实在前端，观察者模式的应用场景是很多的，前端的使用的JS，是事件驱动的编程语言，与观察者模式，发布、订阅模式有很高的契合度。<br />尤其在一票前端框架中，应用也是很广泛的，以Vue为例，在数据双向绑定上，就是应用了数据劫持+观察者模式的组合。<br />下面就以简单的双向绑定实现为例，讲解一下观察者模式。

## 双向绑定的简单实现
首先定义观察者Observer：
```javascript
import Dep from './dep.js'
class Observer{
    constructor(data){
        this.data = data
        this.walk(data)
    }
    walk(data){
        let me = this
        Object.keys(data).forEach((key) => {
          me.convert(key,data[key])
        })
    }
    convert(key,val){
        this.defineReactive(this.data,key,val)
    }
    defineReactive(data,key,val){
        var dep = new Dep();
        var childObj = observe(val);
        Object.defineProperty(data,key,{
            enumerable:true,
            configurable:false,
            get(){
                if(Dep.target){
                    dep.depend()
                }
                return val
            },
            set(newVal){
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        })
    }
}
```
其中核心的部分就是defineReactive方法，用来进行数据劫持，定义数据响应。将数据进行存取描述符进行描述。

在setter方法中，触发监听者队列的通知方法，通知监听者执行相应的callback方法。

在getter方法中，将生成的相应的监听者（Watcher）放入Dep队列中。这里存放Watcher的过程有点绕，首先在蛇生成Watcher实例对象时，将Dep.target赋予当前的Watcher对象。并且在Watcher对象生成时，对相应的进行取值，这样就会调用getter方法，就会调用dep.depend方法，从而调用Dep.target.addDep，将当前的Watcher对象放入到Dep对象中。

再看看Dep队列的声明：

```javascript
let uid = 0
class Dep{
    constructor(){
        this.subs = []
        this.id = uid
        uid ++ 
    }
    addSub(sub){
        this.subs.push(sub)
    }
    depend(){
        Dep.target.addDep(this)
    }
    notify(){
        this.subs.forEach((sub) => {
            sub.update();
        })
    }
}
Dep.target = null
export default Dep
```
对于Dep类来说，最核心的就是addSub和notify方法，用来添加监听者和通知监听者更新数据。

最后看一下监听者Watcher的声明：

```javascript
import Dep from './dep.js'
class Watcher{
    constructor(vm, expOrFn, callback){
        this.vm = vm
        this.callback = callback
        this.depIds = {}
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn;
        } else {
            this.getter = this.parseGetter(expOrFn);
        }
        this.value = this.get();    // 触发劫持的数据的getter方法，从而将watcher放到Dep队列中
    }
    addDep(dep){    //将Watcher放到Dep队列中
        if(!this.depIds.hasOwnProperty(dep.id)){
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    }
    update() {
        this.run();
    }
    run() {
        let value = this.get();
        let oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.callback.call(this.vm, value, oldVal);
        }
    }
    get() {
        Dep.target = this;
        let value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    }
    parseGetter(exp) {
        if (/[^\w.$]/.test(exp)) return; 

        let exps = exp.split('.');

        return function(obj) {
            for (let i = 0, len = exps.length; i < len; i++) {
                if (!obj) return;
                obj = obj[exps[i]]; // 属性代理
            }
            return obj;
        }
    }
}
```

核心的方法就是update方法，用来进行视图的更新。
