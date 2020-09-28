---
title: 原型与原型链
date: 2019-07-20
tags:
  - 原型
  - 原型链
  - javascript
author: ArtoriasChan
location: Beijing  
---

## 构造函数

### 什么是构造函数

构造函数本身就是一个函数，与普通函数没有任何区别，不过为了规范一般将其首字母大写。构造函数和普通函数的区别在于，使用 `new` 生成实例的函数就是构造函数，直接调用的就是普通函数。

对于引用类型来说 `constructor` 属性值是可以修改的，但是对于基本类型来说是只读的。

## 原型

每个对象拥有一个**原型对象**，对象以其原型为模板，从原型继承方法和属性，这些属性和方法定义在对象的构造器函数的 `prototype` 属性上，而非对象实例本身。

![2019-07-24-60302](~@assets/prototype-chain/2019-07-24-60302.jpg)



上图可以看到 Parent 原型（ `Parent.prototype` ）上有 `__proto__` 属性，这是一个**访问器属性**（即 getter 函数和 setter 函数），通过它可以访问到对象的内部 `[[Prototype]]` (一个对象或 `null` )。

`__proto__` 发音 dunder proto，最先被 Firefox使用，后来在 ES6 被列为 Javascript 的标准内建属性。

`[[Prototype]]` 是对象的一个内部属性，外部代码无法直接访问。

> 遵循 ECMAScript 标准，someObject.[[Prototype]] 符号用于指向 someObject 的原型。

这里用 `p.__proto__` 获取对象的原型，`__proto__` 是每个实例上都有的属性，`prototype` 是构造函数的属性，这两个并不一样，但 `p.__proto__` 和 `Parent.prototype` 指向同一个对象。

```JavaScript
function Parent() {}
var p = new Parent();
p.__proto__ === Parent.prototype	// true
```

所以构造函数 `Parent`、`Parent.prototype` 和 `p` 的关系如下图。

![2019-07-24-060305](~@assets/prototype-chain/2019-07-24-060305.jpg)

`__proto__` 属性在 `ES6` 时才被标准化，以确保 Web 浏览器的兼容性，但是不推荐使用，除了标准化的原因之外还有性能问题。为了更好的支持，推荐使用 `Object.getPrototypeOf()`。

```JavaScript
// 获取
Object.getPrototypeOf()
Reflect.getPrototypeOf()

// 修改
Object.setPrototypeOf()
Reflect.setPrototypeOf()
```

## 原型链

每个对象拥有一个原型对象，通过 `__proto__` 指针指向上一个原型 ，并从中继承方法和属性，同时原型对象也可能拥有原型，这样一层一层，最终指向 `null`。这种关系被称为**原型链 (prototype chain)**，通过原型链一个对象会拥有定义在其他对象中的属性和方法。

```javascript
function Parent(age) {
    this.age = age;
}
var p = new Parent(50);

p;	// Parent {age: 50}
p.__proto__ === Parent.prototype; // true
p.__proto__.__proto__ === Object.prototype; // true
p.__proto__.__proto__.__proto__ === null; // true
```

下图展示了原型链的运作机制:

![2019-07-24-060308](~@assets/prototype-chain/2019-07-24-060308.jpg)

原型上的方法和属性被 **继承** 到新对象中，并不是被复制到新对象。

当访问一个对象的属性 / 方法时，它不仅仅在该对象上查找，还会查找该对象的原型，以及该对象的原型的原型，一层一层向上查找，直到找到一个名字匹配的属性 / 方法或到达原型链的末尾（`null`）。

![2019-07-24-060314](~@assets/prototype-chain/2019-07-24-060314.jpg)

## instanceof 原理及实现

`instanceof` 运算符用来检测 `constructor.prototype` 是否存在于参数 `object` 的原型链上。

instanceof 原理就是一层一层查找 `__proto__`，如果和 `constructor.prototype` 相等则返回 true，如果一直没有查找成功则返回 false。

所以instanceof的原理实现如下:

```javascript
function instance_of(L, R) {//L 表示左表达式，R 表示右表达式
   var O = R.prototype;// 取 R 的显示原型
   L = L.__proto__;// 取 L 的隐式原型
   while (true) { 
       // Object.prototype.__proto__ === null
       if (L === null) 
         return false; 
       if (O === L)// 这里重点：当 O 严格等于 L 时，返回 true 
         return true; 
       L = L.__proto__; 
   } 
}

// 测试
function C(){} 
function D(){} 

var o = new C();

instance_of(o, C); // true
instance_of(o, D); // false
```

## Object.prototype

我们先来看看 ECMAScript 上的定义（[15.2.4](http://www.ecma-international.org/ecma-262/5.1/#sec-15.2.4)）。

> The value of the [[Prototype]] internal property of the Object prototype object is **null**, the value of the [[Class]] internal property is `"Object"`, and the initial value of the [[Extensible]] internal property is **true**.

Object.prototype 表示 Object 的原型对象，其 `[[Prototype]]` 属性是 null，访问器属性 `__proto__` 暴露了一个对象的内部 `[[Prototype]]` 。 

`Object.prototype.__proto__` 是 null，所以 Object.prototype 并不是通过 Object 函数创建的，那它如何生成的？其实 Object.prototype 是浏览器底层根据 ECMAScript 规范创造的一个对象。

Object.prototype 就是原型链的顶端（不考虑 null 的情况下），所有对象继承了它的 toString 等方法和属性。

![20191215220242](~@assets/prototype-chain/20191215220242.png)

## Function.prototype

我们先来看看 ECMAScript 上的定义（[15.3.4](http://www.ecma-international.org/ecma-262/5.1/#sec-15.3.4)）。

> The Function prototype object is itself a Function object (its [[Class]] is `"Function"`).
>
> The value of the [[Prototype]] internal property of the Function prototype object is the standard built-in Object prototype object.
>
> The Function prototype object does not have a `valueOf` property of its own; however, it inherits the `valueOf` property from the Object prototype Object.

Function.prototype 对象是一个函数（对象），其 `[[Prototype]]` 内部属性值指向内建对象 Object.prototype。Function.prototype 对象自身没有 `valueOf` 属性，其从 Object.prototype 对象继承了`valueOf` 属性。

![20191215220335](~@assets/prototype-chain/20191215220335.png)

Function.prototype 的 `[[Class]]` 属性是 `Function`，所以这是一个函数，但又不大一样。为什么这么说呢？因为我们知道只有函数才有 prototype 属性，但并不是所有函数都有这个属性，因为 Function.prototype 这个函数就没有。

```javascript
Function.prototype // ƒ () { [native code] }

Function.prototype.prototype // undefined
```

为什么没有呢，我的理解是 `Function.prototype` 是引擎创建出来的函数，引擎认为不需要给这个函数对象添加 `prototype` 属性，不然 `Function.prototype.prototype…` 将无休无止并且没有存在的意义。

## function Object

我们先来看看 ECMAScript 上的定义（[15.2.3](http://www.ecma-international.org/ecma-262/5.1/#sec-15.2.3)）。

> The value of the [[Prototype]] internal property of the Object constructor is the standard built-in Function prototype object.

Object 作为构造函数时，其 `[[Prototype]]` 内部属性值指向 Function.prototype，即

```javascript
Object.__proto__ === Function.prototype // true
```

![20191215220404](~@assets/prototype-chain/20191215220404.png)

## function Function

我们先来看看 ECMAScript 上的定义（[15.3.3](http://www.ecma-international.org/ecma-262/5.1/#sec-15.3.3)）。

> The Function constructor is itself a Function object and its [[Class]] is `"Function"`. The value of the [[Prototype]] internal property of the Function constructor is the standard built-in Function prototype object.

Function 构造函数是一个函数对象，其 `[[Class]]` 属性是 `Function`。Function 的 `[[Prototype]]` 属性指向了 `Function.prototype`，即

```javascript
Function.__proto__ === Function.prototype // true
```

![20191215220504](~@assets/prototype-chain/20191215220504.png)

## Function & Object 鸡蛋问题

我们看下面这段代码

```javascript
Object instanceof Function 		// true
Function instanceof Object 		// true

Object instanceof Object 			// true
Function instanceof Function 	// true
```

`Object` 构造函数继承了 `Function.prototype`，同时 `Function` 构造函数继承了`Object.prototype`。这里就产生了 **鸡和蛋** 的问题。为什么会出现这种问题，因为 `Function.prototype` 和 `Function.__proto__` 都指向 `Function.prototype`。

```javascript
// Object instanceof Function 	即
Object.__proto__ === Function.prototype 					// true

// Function instanceof Object 	即
Function.__proto__.__proto__ === Object.prototype	// true

// Object instanceof Object 		即 			
Object.__proto__.__proto__ === Object.prototype 	// true

// Function instanceof Function 即	
Function.__proto__ === Function.prototype					// true
```

对于 `Function.__proto__ === Function.prototype` 这一现象有 2 种解释，争论点在于 Function 对象是不是由 Function 构造函数创建的一个实例？

**解释 1、YES**：按照 JavaScript 中“实例”的定义，a 是 b 的实例即 `a instanceof b` 为 true，默认判断条件就是 `b.prototype` 在 a 的原型链上。而 `Function instanceof Function` 为 true，本质上即 `Object.getPrototypeOf(Function) === Function.prototype`，正符合此定义。

**解释 2、NO**：Function 是 `built-in` 的对象，也就是并不存在“Function对象由Function构造函数创建”这样显然会造成鸡生蛋蛋生鸡的问题。实际上，当你直接写一个函数时（如 `function f() {}` 或 `x => x`），也不存在调用 Function 构造器，只有在显式调用 Function 构造器时（如 `new Function('x', 'return x')` ）才有。

我个人偏向于第二种解释，即先有 `Function.prototype` 然后有的 `function Function()` ，所以就不存在鸡生蛋蛋生鸡问题了，把 `Function.__proto__` 指向 `Function.prototype` 是为了保证原型链的完整，让 `Function` 可以获取定义在 `Object.prototype` 上的方法。

最后给一个完整的图，看懂这张图原型就没问题了。

![2019-07-24-060321](~@assets/prototype-chain/2019-07-24-060321.jpg)