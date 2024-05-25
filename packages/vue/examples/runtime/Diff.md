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

### 3. 新节点比旧节点多

经过前两轮的情况循环，如果从前往后的指针 i 大于从后向前的旧节点指针 oldChildrenEnd，并且 i 还小于等于新节点指针 newChildrenEnd，
那说明新节点都便利完了但是旧节点有没遍历到的，我们通过 nextPos 拿到新节点从后向前的指针的后一位，然后计算锚点 anchor
如果 nextPos < newChildrenLength 也就是小于新节点的数量，那么 nextPos 可以从新节点中取到一个元素，就以这个元素作为锚点，把剩余新节点插入这个元素之前；
如果不满足条件，那么就用参数中的 parentAnchor 作为锚点，在这个 Demo 中是 null，也就是插入到最后，
然后继续循环剩下的新节点依次 patch 挂载上去即可

1. 新的在后面

   - (a b)
   - (a b) c
   - i = 2, e1 = 1, e2 = 2,
   - nextPos = 3，通过 newChildren[nextPos] 取不到元素，所以用 parentAnchor(null) 作为锚点，把剩下的新节点插入最后

2. 新的在前面

   - (a b)
   - c (a b)
   - i = 0, e1 = -1, e2 = 0
   - nextPos = 1，通过 newChildren[nextPos] 此时通过取到的元素是 a，所以用 a 作为锚点，把剩下的新节点插入 a 元素前面

3. 新的在中间

   - (a b)
   - (a) c (b)
   - i = 1, e1 = 0, e2 = 1
   - nextPos = 2，通过 newChildren[nextPos] 此时通过取到的元素是 b，所以用 b 作为锚点，把剩下的新节点插入 b 元素前面

源码：

```ts
// 3. common sequence + mount
// (a b)
// (a b) c
// i = 2, e1 = 1, e2 = 2
// (a b)
// c (a b)
// i = 0, e1 = -1, e2 = 0
if (i > e1) {
  if (i <= e2) {
    const nextPos = e2 + 1
    const anchor = nextPos < l2 ? (c2[nextPos] as VNode).el : parentAnchor
    while (i <= e2) {
      patch(
        null,
        (c2[i] = optimized
          ? cloneIfMounted(c2[i] as VNode)
          : normalizeVNode(c2[i])),
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      )
      i++
    }
  }
}
```

当前项目：

```ts
// 3. 新节点多余旧节点
if (i > oldChildrenEnd) {
  if (i <= newChildrenEnd) {
    // 拿到新节点从后向前遍历的位置的后一位
    const nextPos = newChildrenEnd + 1
    // 获取锚点，如果 nextPos 能取到元素，就把节点查到这个元素前面，如果取不到，就用参数中的锚点，demo中是null，就是插入最后
    const anchor =
      nextPos < newChildrenLength ? newChildren[nextPos].el : parentAnchor
    while (i <= newChildrenEnd) {
      patch(null, normalizeVNode(newChildren[i]), container, anchor)
      i++
    }
  }
}
```
