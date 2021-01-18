---
title: JavaScript 设计模式核心原理
subtitle: 读《JavaScript 设计模式核⼼原理与应⽤实践》总结
date: 2021-01-18
tags:
  - design patterns
author: ArtoriasChan
location: Beijing  
---
## 前言
能够决定一个前端工程师的本质的，不是那些瞬息万变的技术点，而是那些**不变的东西**。

所谓“不变的东西”，说的就是这种**驾驭技术的能力**。

具体来说，它分为以下三个层次：
* 能用健壮的代码去解决具体的问题；
* 能用抽象的思维去应对复杂的系统；
* 能用工程化的思想去规划更大规模的业务。

整本小册的知识体系与格局，用思维导图展示如下：
![abstract](~@assets/posts/javascript-design-patterns/abstract.png)

设计原则是设计模式的指导理论，它可以帮助我们规避不良的软件设计。 **SOLID** 指代的五个基本原则分别是：
* **单一功能原则** （Single Responsibility Principle）
* **开放封闭原则** （Opened Closed Principle）
* **里式替换原则** （Liskov Substitution Principle）
* **接口隔离原则** （Interface Segregation Principle）
* **依赖反转原则** （Dependency Inversion Principle）

在 JavaScript 设计模式中，主要用到的设计模式基本都围绕 **单一功能** 和 **开放封闭** 这两个原则来展开。

设计模式的核心思想就是封装变化。在实际开发中，不发生变化的代码可以说是不存在的。我们能做的只有将这个变化造成的影响最小化 —— **将变与不变分离** ，确保变化的部分灵活、不变的部分稳定。这个过程，就叫 **封装变化**。
在这本书中，将23种设计模式按照“创建型”、“行为型”和“结构型”进行划分：
![all-design-patterns](~@assets/posts/javascript-design-patterns/all-design-patterns.png)
## 创建型
### 工厂模式之简单工厂
简单工厂模式的核心就是抽离了变与不变。

假如我们有这样一个例子：使用JS创建一个Person对象。
```js
const liLei = {
    name: '李雷',
    age: 25,
    career: 'coder',
}
```
那如果场景变为创建多个Person对象呢？我们应该不会适应对象字面量的方式来进行创建吧。这时我们就会用到**构造函数**。
```js
function User(name , age, career) {
  this.name = name;
  this.age = age;
  this.career = career;
}

const user = new User(name, age, career);
```
像 User 这样当新建对象的内存被分配后，用来初始化该对象的特殊函数，就叫做**构造器**。

在 JavaScript 中，我们使用构造函数去初始化对象，就是应用了**构造器模式**。

在创建一个user过程中，**谁变了，谁不变**？很明显，变的是每个user的姓名、年龄、工种这些值，这是用户的个性，不变的是每个员工都具备姓名、年龄、工种这些属性，这是用户的共性。

但是如果在迭代的过程中遇到这样一个需求：**增加给不同工种分配职责说明的功能**。那这样就导致员工的共性被拆离了。
```js
function Coder(name , age) {
  this.name = name;
  this.age = age;
  this.career = 'coder';
  this.work = ['写代码','写系分', '修Bug'];
}
function ProductManager(name, age) {
  this.name = name;
  this.age = age;
  this.career = 'product manager';
  this.work = ['订会议室', '写PRD', '催更'];
}
```
但是在根本上 Coder 和 ProductManager 都具有name，age，career，work属性，只是work属性需要根据career自动的添加。

现在我们把相同的逻辑封装回User类里，然后把这个承载了共性的 User 类和个性化的逻辑判断写入同一个函数：
```js
function User(name , age, career, work) {
  this.name = name;
  this.age = age;
  this.career = career;
  this.work = work;
}

function Factory(name, age, career) {
  let work;
  switch(career) {
    case 'coder':
      work =  ['写代码','写系分', '修Bug'];
      break;
    case 'product manager':
      work = ['订会议室', '写PRD', '催更'];
      break;
    case 'boss':
      work = ['喝茶', '看报', '见客户'];
      break;
    //case 'xxx':
    //  其它工种的职责分配
    //  ...
  }
  return new User(name, age, career, work)
}
```

现在我们一起来总结一下什么是工厂模式：**工厂模式其实就是将创建对象的过程单独封装**。

总结一下：工厂模式的目的，就是为了实现**无脑传参**，就是为了爽！
### 工厂模式之抽象工厂
### 单例模式
### 原型模式
## 结构型
### 装饰器模式
### 适配器模式
### 代理模式
## 行为型
### 策略模式
### 状态模式
### 观察者模式
### 迭代器模式