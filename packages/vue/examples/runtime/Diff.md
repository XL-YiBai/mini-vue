## Vue 中的 Diff 处理

在 patchChildren 函数中，如果新旧子节点都是 Array 时，会进行 Diff 比对，执行 patchKeyedChildren 方法
这个比对分为了五个过程：

### 1. 从前到后比对：

从前向后依次比对，如果是相通的 VNode，那么就直接执行 patch，否则 break 跳出循环。
源码逻辑：

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

当前项目的逻辑：

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
