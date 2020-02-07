---
title: Exploring ES6 data structures
date: "2020-01-08T00:00:00.001Z"
template: "post"
draft: false
slug: "/posts/exploring-es6-data structures"
category: "programming"
tags:
  - "programming"
  - "JavaScript"
  - "ES6"
description: "A deep dive into new data structures in ES6 - Map, Set, Typed
Arrays and more..."
socialImage: ""
---

Up & until ES5 the arrays and objects have been the primary mechanism for
creating data structures in JS. With the introduction of ES6 specification, some
new and useful data structure abstractions have been added.

We'll be looking at

- [Map](#map)
- [WeakMap](#weakmap)
- [Set](#set)
- [WeakSet](#weakset)
- [Typed Array](#typed-array)

### Map

If you've worked with JS objects, which are the primary mechanism for creating
key/value pairs, then you are already familiar with maps.

```js
const person = {
  name: 'John Doe',
  age: 30
};
```

The main limitation with normal objects is that keys have to be of
[_string_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Property_Accessors)
type or an ES6 Symbol.

With ES6 Maps objects can also be used as keys. The `[]` bracket syntax has been
replaced in favour of `set` and `get` .

**\* _Working with Map_ \***

```js
const foo = { bar: 'baz' };

const person = new Map();
person.set('name', 'John Doe');
person.set('age', 30);
person.set(foo, { hello: 'world' }); // notice that object is used as a key
person.get(foo); // {'hello': 'world'}
```

Map comes with a handy helper `has(...)` which returns a boolean asserting
whether a value has been associated to the key in the Map object or not.

```js
person.has(foo); // true
person.has('foo'); // false
```

With normal objects one would use `delete` keyword to delete a property on
an object. On a Map, we use `delete(...)` on the map object which returns `true`
if the key exists and when its deleted, and `false` if not.

```js
person.delete(foo); // true
person.delete(foo); // false - because foo has been deleted already
```

Use `clear()` to clear all key-value pairs on the map object.

```js
person.clear(foo);
```

To get the list of keys, use `keys()`, which returns an iterator over the keys
in the map:

```js
const foo = { bar: 'baz' };

const person = new Map();
person.set('name', 'John Doe');
person.set('age', 30);
person.set(foo, { hello: 'world' });

const keys = [...person.keys()];

person.get(keys[0]); // John Doe
person.get(keys[1]); // 30
person.get(keys[2]); // {'hello': 'world'}
```

We could also use `entries()`, the default map iterator, on the map object
with the good old `for-of` loop.

```js
// Assuming we use the same person Map from above
for (let [key, val] of person.entries()) {
  console.log(`${key} = ${val}`);
}

// Output
// name = John Doe
// age = 30
// {'bar': 'baz'} = {'hello': 'world'}
```

Map API [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)

---

### WeakMap

A WeakMap works in the same way as Map but only allows objects as keys.

It mainly differs underneath, in how the memory is allocated (specifically
Garbage Collection). In WeakMap the keys (objects only) are weakly referenced
meaning that if the key object is GC'd then the entry in the weakmap is also
removed. This behaviour is particularly useful if you are dealing with objects
that you don't have complete control of like a DOM element.

```js
const person = {
  name: 'John Doe',
  age: 30
};

const obj = {
  key1: {
    id: 1
  }
};

const personMap = new WeakMap();
personMap.set(obj.key1, person);

personMap.set('hello', 'world'); // TypeError: WeakMap key must be an object

personMap.has(obj.key1); // true
delete obj.key1; // true
personMap.has(obj.key1); // false because of weak reference on key1
```

Other thing to note is that WeakMap doesn't have `clear()` method like Map.

WeakMap API [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)

---

### Set

The mathematical definition of a [Set](https://books.google.co.in/books?id=yZ68h97pnAkC&pg=PA1&redir_esc=y#v=onepage&q&f=false).

> A set is a well-defined collection of distinct objects, considered as an
> object in its own right.

In ES6 a Set is collection of unique values (duplicates) are ignored. A set can
contain primitve values like `strings`, `numbers`, `boolean` and also complex
values like objects and other ES6 data structures (Maps, Sets, etc).

**\* _Working with Set_ \***

A Set can be created by invoking the `Set()` constructor. Additionally an array
of values can be passed to initialize it. Similar to the `set()` method on a
Map, Set has an `add()` method to add values but doesn't have a `get(...)`
method.

```js
const set1 = new Set(['x', 'x', 'y', 'y', 'z', 'z', { hello: 'world' }]);
const set2 = new Set();
set2
  .add('x')
  .add('y')
  .add('z')
  .add({ hello: 'world' });
```

A Set has `keys()` and `values()` iterator which yields a list of unique values
in the set.

```js
const set1 = new Set(['x', 'y', 'z', { hello: 'world' }]);
const keys = [...set1.keys()];
const values = [...set1.values()];

console.log(keys[0]); // x
console.log(values[0]); // x

keys[1] === values[1]; // true

for (let val of set1.values()) {
  console.log(val);
}

// Output
// x
// y
// z
// {'hello': 'world'}
```

Use `delete(...)` to remove an entry from a Set and `clear()` to remove all
entries in the Set.

```js
const set1 = new Set(['x', 'y', 'z', { hello: 'world' }]);
set1.delete('x'); // true
set1.delete('p'); // false - as p doesn't exist
set1.clear();
[...set1.keys()].length; // 0
```

Set API [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)

---

### WeakSet

WeakSet is similar to a Set, but it holds its values weakly, meaning if the
value object is GC'd then the entry is also removed from the weakset object.
Another important distinction is that a WeakSet can contain only object values,
primitive values like `string`, `number`, `boolean` are not allowed.

```js
const obj = { id1: { hello: 'world' } };
const set1 = new WeakSet([obj.id1]);

set1.add('x'); // TypeError: WeakSet value must be an object

set1.has(obj.id1); // true
delete obj.id1; // true
set1.has(obj.id1); // false
```

WeakSet API [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)

---

### Typed Array

A Typed Array is a chunk of memory with a typed view inside, with array like
access. Each entry in a Typed Array is a raw binary value in one of a number of
supported formats, from 8-bit integers to 64-bit floating-point numbers. They
provide support for arbitrary byte-based data structures to implement network
protocols, cryptographic algorithms, file format manipulations, efficiently
pass data to WebGL etc.

**\* _Working with Typed Array_ \***

```js
const buff = new ArrayBuffer(32); // allocates 32 bytes of memory
buff.byteLength; // 32
buff[0] = 10;
buff[1] = 20;
buff[2] = buff[0] + buff[1]; // 30

// Floating point arrays.
var f64 = new Float64Array(8);
var f32 = new Float32Array(16);

// Signed integer arrays.
var i32 = new Int32Array(16);
var i16 = new Int16Array(32);
var i8 = new Int8Array(64);

// Unsigned integer arrays.
var u32 = new Uint32Array(16);
var u16 = new Uint16Array(32);
var u8 = new Uint8Array(64);
var pixels = new Uint8ClampedArray(64); // clamps input values between 0 and 255
```

Typed arrays shouldn't be confused with normal arrays. `Array.isArray()` on a
typed array return `false`. Also, not all the methods on normal arrays are
available on typed arrays.

Typed Array API [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray)

---

### Reference

- [You dont know JS - ES Next & Beyond](https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/es-next-beyond/ch5.md)
- [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures)
