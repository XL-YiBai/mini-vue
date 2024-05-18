需求：对页面中的 button 绑定事件，点击提示 hello ，两秒后，点击提示 你好

## 方法一：

先 addEventListener ，两秒后 removeEventListener 再 addEventListener

```js
const btnEle = document.querySelector('button')
const invoker = () => {
  alert('hello')
}
btnEle.addEventListener('click', invoker)

setTimeout(() => {
  btnEle.removeEventListener('click', invoker)

  btnEle.addEventListener('click', () => {
    alert('你好')
  })
})
```

## 方法二：

像 Vue 一样，把真正的事件放在在 invoker.value 上，addEventListener 绑定 invoker 这个匿名函数，
invoker 执行时本质是执行 invoker.value，因此更换函数时只需要给 invoker.value 重新赋值，而不需要先 removeEventListener 再 addEventListener

```js
const btnEle = document.querySelector('button')
const invoker = () => {
  invoker.value()
}
invoker.value = () => {
  alert('hello')
}

btnEle.addEventListener('click', invoker)

setTimeout(() => {
  invoker.value = () => {
    alert('你好')
  }
})
```

## 总结

平时可能会对一个元素频繁的绑定或解绑事件，但因为对 Dom 的操作，addEventListener 和 removeEventListener 都比较耗费性能。
因此 Vue 通过 invoker 包装了真正的事件回调函数，这样更换回调函数时只需要更新 invoker.value 的值，把操作放在 JS 层面，减少了对 DOM 的操作。
Vue 在 el 身上绑定了一个 vei 对象(vue event invokers)，在这个对象上保存了这个元素的所有的 invokers ，因此如果在更新时，能从这个对象上取到 `existingInvoker = invokers[rawName]`，就直接 existingInvoker.value = nextValue 更新回调函数。等于就是一个缓存的作用。

Vue 源码中 patchEvent 的处理：

```js
export function patchEvent(
  el: Element & { _vei?: Record<string, Invoker | undefined> },
  rawName: string,
  prevValue: EventValue | null,
  nextValue: EventValue | null,
  instance: ComponentInternalInstance | null = null
) {
  // vei = vue event invokers
  const invokers = el._vei || (el._vei = {})
  const existingInvoker = invokers[rawName]
  if (nextValue && existingInvoker) {
    // patch 更新
    existingInvoker.value = nextValue
  } else {
    const [name, options] = parseName(rawName)
    if (nextValue) {
      // add 新增
      const invoker = (invokers[rawName] = createInvoker(nextValue, instance))
      addEventListener(el, name, invoker, options)
    } else if (existingInvoker) {
      // remove 卸载
      removeEventListener(el, name, existingInvoker, options)
      invokers[rawName] = undefined
    }
  }
}
```
