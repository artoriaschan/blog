---
title: 改善既有代码的设计
subtitle: 重温《重构》有感
date: 2021-01-15
tags:
  - thinking
author: ArtoriasChan
location: Beijing  
---
## 概览
### 何为重构
重构（名词）：对软件内部结构的一种调整，目的是在不改变软件可观察行为的前提下，提高其可理解性，降低其修改成本。

重构（动词）：使用一些列重构手法，在不改变软件可观察行为的前提下，调整其结构。

重构和性能优化有很多相似的地方：两者都需要修改代码，而且两者都不会改变程序的整体功能。两者的差别在于其目的：重构是为了让代码“更容易理解，更易于修改”。
### 为何重构
重构是一个工具，它可以用于以下几个目的：
* 重构改进软件的设计
* 重构使软件更容易理解
* 重构帮助找到bug
* 重构提高编程速度
### 何时重构
首先我们需要了解下三次原则：
> 第一次做某件事时只管去做；第二次做类似的事情会产生反感，但无论如何还是可以去做；第三次做类似的事情，你就应该重构。

这里可以列举几个重构的时机：
* 预备性重构：让添加新功能更加容易
* 帮助理解的重构：使代码更易懂
* 捡垃圾式重构：“至少让营地比你到达时更干净”
* 有计划的重构和见机行事的重构
* 长期重构：循序渐进
* 复审代码时重构
### 重构的挑战
有必要充分了解重构会遇到的挑战，这样才能做出有效应对。

尽管重构的目的是为了加快开发速度，但是，仍有很多人认为花时间重构是在拖慢新功能的开发速度。但是我们之所以重构，是因为它能让我们更快 —— 追加功能更快，修复 bug 更快。

另外，代码的所有权的边界会影响重构。这时更加推荐团队代码所有制，这样一直团队里的成员都可以修改这个团队拥有的代码。甚至这种较为宽松的代码所有制也可以应用于跨团队的场景。

重构的第一块基石是自测试代码，应该拥有一套自动化的测试，可以频繁的运行它们，并且可以使重构者有信心，一定程度上保证重构后程序功能的正确性。

并且在开展重构时，不会干扰其他人的工作，所以鼓励持续集成（CI），有了CI之后，重构的部分能快速的分享给其他同事，不会加剧分支合并的困难。

所以说，自测试代码、持续集成、重构之间有着很强的协同效应。
## 代码的坏味道
决定何时重构及何时停止和知道重构机制如何运作一样重要。那么问题来了，如何知道和决定何时重构呢？

这里提出了“味道”的概念，这不是一个精准衡量标准，你必须培养自己的判断力，来凭自己的直觉判断是否该重构。

以下所列的是“坏味道条款”，但愿它们能为你指引正确的方向。
* 神秘命名
* 重复代码
* 过长函数
* 过长参数列表
* 全局数据
* 可变数据
* 发散式变化
  * 每次只关心一个上下文
* 霰弹式修改
  * 每遇到某种变化需要在不同的模块中做出许多小的修改
* 依赖情结
  * 所谓模块化，就是力求将代码划分区域，最大化区域内交互，最小化区域外交互，俗称高内聚，低耦合。
  * 当发现某两个模块之间交互格外频繁，远胜于内部的交互
* 数据泥团
  * 当你常常可以在很多地方看到相同的几项数据时，并且这几项数据聚在一起才会有意义
* 基本类型偏执
  * 不愿创建对自己的问题域有用的基本类型
* 重复的switch
* 循环语句
* 冗余的元素
* 夸夸其谈通用性
  * 企图以各种各样的钩子和特殊情况来处理一些非必要的事情
* 临时字段
* 过长的消息链
* 中间人
  * 过渡运用委托
* 内幕交易
  * 模块之间私下过度耦合
* 过大的类
* 异曲同工的类
* 纯数据类
* 被拒绝的馈赠
  * 如果子类复用了超类的行为，但是不愿意支持超类的接口
* 注释

## 重构名录
该名录是一本操作手册，用来提示如何以安全且高效的方式进行重构。
### 第一组重构
**1、提炼函数**

**将意图和实现分开**
```js {5,6,15-18}
function printOwing(invoice){
  printBanner();
  let outstanding = calculateOutstanding();

  consosle.log(`name: ${invoice.customer}`);
  consosle.log(`amount: ${outstanding}`);
}

// 重构后
function printOwing(invoice){
  printBanner();
  let outstanding = calculateOutstanding();
  printDetails(outstanding);

  function printDetails(outstanding){
    consosle.log(`name: ${invoice.customer}`);
    consosle.log(`amount: ${outstanding}`);
  }
}
```
**2、内联函数**

间接层有其价值，但不是所有间接层都有价值。
```js
function getRating(driver) { 
  return moreThanFiveLateDeliveries(driver) ? 2 : 1; 
}

function moreThanFiveLateDeliveries(driver) { 　
  return driver.numberOfLateDeliveries > 5; 
}

// 重构后
function getRating(driver) { 　
  return (driver.numberOfLateDeliveries > 5) ? 2 : 1; 
}
```
**3、提炼变量**

表达式有可能非常复杂而难以阅读。这种情况下，局部变量可以帮助我们将表达式分解为比较容易管理的形式。
```js
return 
  order.quantity * order.itemPrice - 
  Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
  Math.min(order.quantity * order.itemPrice * 0.1, 100);

// 重构后
const basePrice = order.quantity * order.itemPrice; 
const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05; 
const shipping = Math.min(basePrice * 0.1, 100); 
return basePrice - quantityDiscount + shipping;
```
**4、内联变量**

变量可能会妨碍重构附近的代码。
```js
let basePrice = anOrder.basePrice; 
return (basePrice > 1000);

// 重构后
return anOrder.basePrice > 1000;
```
**5、改变函数声明**

函数是我们将程序拆分成小块的主要方式。函数声明则展现了如何将这些小块组合在一起工作。

最重要的元素当属函数的名字。

对于函数的参数，道理也是一样。函数的参数列表阐述了函数如何与外部世界共处。
```js
function circum(radius) {/* */}

// 重构后
function circumference(radius) {/* */}
```
**6、封装变量**

重构的作用就是调整程序中的元素。函数相对容易调整一些，因为函数只有一种用法，就是**调用**。

所以，如果想要搬移一处被广泛使用的数据，最好的办法往往是先以**函数形式**封装所有对该数据的访问。

这样，我就能把 **“重新组织数据”** 的困难任务转化为 **“重新组织函数”** 这个相对简单的任务。
```js
let defaultOwner = {firstName: "Martin", lastName: "Fowler"};

// 重构后
let defaultOwnerData = {firstName: "Martin", lastName: "Fowler"}; 

export function defaultOwner() {return defaultOwnerData;} 
export function setDefaultOwner(arg) {defaultOwnerData = arg;}
```
**7、变量改名**

好的命名是整洁编程的核心。
```js
let a = height * width;

// 重构后
let area = height * width;
```
**8、引入参数对象**

将数据组织成结构是一件有价值的事，因为这让数据项之间的关系变得明晰。

使用新的数据结构，参数的参数列表也能缩短。

并且经过重构之后，所有使用该数据结构的函数都会通过同样的名字来访问其中的元素，从而提升代码的一致性。

```js
function amountInvoiced(startDate, endDate) {/* */} 
function amountReceived(startDate, endDate) {/* */} 
function amountOverdue(startDate, endDate) {/* */}

// 重构后
function amountInvoiced(aDateRange) {/* */} 
function amountReceived(aDateRange) {/* */} 
function amountOverdue(aDateRange) {/* */}
```
**9、函数组合成类**

如果发现一组函数形影不离地操作同一块数据（通常是将这块数据作为参数传递给函数），就可以认为，是时候组建一个类了。
```js
function base(aReading) {/* */}
function taxableCharge(aReading) {/* */}
function calculateBaseCharge(aReading) {/* */}

// 重构后
class Reading { 
  base() {/* */}
  taxableCharge() {/* */}
  calculateBaseCharge() {/* */}
}
```
**10、函数组合成变换**

在软件中，经常需要把数据“喂”给一个程序，让它再计算出各种派生信息。

这些派生数值可能会在几个不同地方用到，因此这些计算逻辑也常会在用到派生数据的地方重复。

把所有计算派生数据的逻辑收拢到一处，这样始终可以在固定的地方找到和更新这些逻辑，避免到处重复。

```js
function base(aReading) {/* */} 
function taxableCharge(aReading) {/* */}

// 重构后
function base(aReading) {/* */} 
function taxableCharge(aReading) {/* */}

function enrichReading(argReading) { 
  const aReading = _.cloneDeep(argReading); 
  aReading.baseCharge = base(aReading); 
  aReading.taxableCharge = taxableCharge(aReading); 
  return aReading; 
}
```
**11、拆分阶段**
每当一段代码在同时处理两件不同的事，就想把它拆分成各自独立的模块。因为这样到了需要修改的时候，就可以单独处理每个主题。

最简洁的拆分方法之一，就是把一大段行为分成顺序执行的两个阶段。
```js
const orderData = orderString.split(/\s+/);
const productPrice = priceList[orderData[0].split("-")[1]];
const orderPrice = parseInt(orderData[1]) * productPrice;

// 重构后
const orderRecord = parseOrder(order); 
const orderPrice = price(orderRecord, priceList);

function parseOrder(aString) { 　
  const values = aString.split(/\s+/);
  return ({
    productID: values[0].split("-")[1],
    quantity: parseInt(values[1]),
  }); 
}
function price(order, priceList) {
  return order.quantity * priceList[order.productID];
}
```