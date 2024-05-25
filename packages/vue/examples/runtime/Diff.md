## Vue 中的 Diff 处理

在 patchChildren 函数中，如果新旧子节点都是 Array 时，会进行 Diff 比对，执行 patchKeyedChildren 方法
这个比对分为了五个过程：

### 1. 从前到后比对：

从前向后依次比对，如果是相通的 VNode，那么就直接执行 patch，否则 break 跳出循环。
源码：

```ts
// 1. sync from start
// (a b) c
// (a b) d e
while (i <= e1 && i <= e2) {
  const n1 = c1[i]
  const n2 = (c2[i] = optimized
    ? cloneIfMounted(c2[i] as VNode)
    : normalizeVNode(c2[i]))
  if (isSameVNodeType(n1, n2)) {
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized
    )
  } else {
    break
  }
  i++
}
```

当前项目：

```ts
// 1. 自前向后
while (i <= oldChildrenEnd && i <= newChildrenEnd) {
  const oldVNode = oldChildren[i]
  const newVNode = normalizeVNode(newChildren[i])
  if (isSameVNodeType(oldChildren, newChildren)) {
    patch(oldVNode, newVNode, container, null)
  } else {
    break
  }
  i++
}
```

### 2. 从后向前比对

如果在第一个情况自前向后比对时，出现了不同的 vnode 那么会走 break 逻辑跳出循环，此时的 i 就保存了自前向后比对到了哪个位置
然后再从后向前比对，通过控制 oldChildrenEnd 和 newChildrenEnd 的值控制从后向前的指针，记录比对的位置
如果两个 vnode 相同，同样直接执行 patch，如果不相同，也是 break 直接跳出循环

源码：

```ts
// 2. sync from end
// a (b c)
// d e (b c)
while (i <= e1 && i <= e2) {
  const n1 = c1[e1]
  const n2 = (c2[e2] = optimized
    ? cloneIfMounted(c2[e2] as VNode)
    : normalizeVNode(c2[e2]))
  if (isSameVNodeType(n1, n2)) {
    patch(
      n1,
      n2,
      container,
      null,
      parentComponent,
      parentSuspense,
      isSVG,
      slotScopeIds,
      optimized
    )
  } else {
    break
  }
  e1--
  e2--
}
```

当前项目：

```ts
// 2. 自后向前
while (i <= oldChildrenEnd && i <= newChildrenEnd) {
  const oldVNode = oldChildren[oldChildrenEnd]
  const newVNode = normalizeVNode(newChildren[newChildrenEnd])
  if (isSameVNodeType(oldVNode, newVNode)) {
    patch(oldVNode, newVNode, container, null)
  } else {
    break
  }
  oldChildrenEnd--
  newChildrenEnd--
}
```
