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

### 4. 旧节点比新节点多

经过第一二轮循环处理，如果从前往后的指针 i 大于从后向前的新节点指针 newChildrenEnd，，并且 i 还小于等于旧节点指针 oldChildrenEnd，
那说明新节点便利完了，但旧节点还有多出来的，要删除掉，此时 i 指向的节点就是多出来的，使用 while (i <= oldChildrenEnd) 依次 umount 卸载即可
我们这里应该使用 else if 接着第三种场景的继续判断

1. 多的在后面

   - (a b) c
   - (a b)
   - i = 2, e1 = 2, e2 = 1, 说明应该卸载第三个 oldChildren[i] 也就是 oldChildren[2]

2. 多的在前面

   - c (a b)
   - (a b)
   - i = 0, e1 = 0, e2 = -1，说明应该卸载第一个 oldChildren[i] 也就是 oldChildren[0]

3. 多的在中间

   - (a) c (b)
   - (a b)
   - i = 1, e1 = 1, e2 = 0，说明应该卸载第二个 oldChildren[i] 也就是 oldChildren[1]

源码：

```ts
// 4. common sequence + unmount
// (a b) c
// (a b)
// i = 2, e1 = 2, e2 = 1
// a (b c)
// (b c)
// i = 0, e1 = 0, e2 = -1
else if (i > e2) {
  while (i <= e1) {
    unmount(c1[i], parentComponent, parentSuspense, true)
    i++
  }
}
```

当前项目：

```ts
// 4. 新节点少于旧节点，说明要删除一部分旧节点
else if (i > newChildrenEnd) {
  while (i <= oldChildrenEnd) {
    unmount(oldChildren[i])
    i++
  }
}
```

### 5. 乱序

#### 求最长递增子序列

这里是求最长递增子序列的索引，例如 1、3、2、5、4、6，最终返回的是 1 2 4 6 对应的索引 [0, 2, 4, 5]
主要思路是：
依次向后遍历，把最长子序列对应的索引保存在 result，如果遍历的值比 result 最后一个索引对应的值，也就是目前保存的最大值还要大，
就把当前遍历的索引 push 到 result；反之，把 result 最后一个值替换成当前索引。例如遍历了 1 3，此时遍历 2，那么子序列会更新为 1 2，因为 2<3

```ts
// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence(arr: number[]): number[] {
  // 获取一个数组浅拷贝。p 中元素的改变，不会影响 arr
  // p 是一个最终的回溯数组，它会在最终的 result 回溯中被使用
  // 它会在每次 result 数组发生变化时，记录 result 更新前最后一个索引的值
  const p = arr.slice()
  // 定义返回值（最长递增子序列下标），因为下标从 0 开始，所以它的初始值为 0
  const result = [0]
  let i, j, u, v, c
  // 当前遍历的数组的长度
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      // result 中的最后一个元素，即 result 所保存当前最大值的那个下标
      j = result[result.length - 1]
      // 如果遍历的元素比 result 存储的最大值要大，说明存在更大的序列，就把当前下标 push 到 result 的最后，作为新的最大值下标，然后跳过本次循环
      // 在 push 之前执行的 p[i] = j 是保存更新前的那个最大值下标，说明遍历到 i 下标时，发生了更新，并且更新前的最大值下标是 j
      if (arr[j] < arrI) {
        p[i] = j
        // 把当前下标 i 放入到 result 的最后位置
        result.push(i)
        continue
      }
      // 在下标 u 和 v 之间进行二分查找
      u = 0
      v = result.length - 1
      while (u < v) {
        c = (u + v) >> 1
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      // 如果当前遍历的元素，比 result 存储的最大值
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
```

#### 场景五的 Diff 逻辑

先把一样的元素进行 patch 更新，然后用一个数组(newIndexToOldIndexMap)模拟 Map，数组的索引是新子节点的索引，数组的值是旧节点的索引 +1。
如果说 patch 完需要进行移动，那么就基于这个数组求最长递增子序列，该子序列的节点是不动的，只移动其他子节点。
求最长递增子序列的原因是因为这样可以减少移动的操作，需要移动的元素更少。

源码：

```ts
// 5. unknown sequence
// [i ... e1 + 1]: a b [c d e] f g
// [i ... e2 + 1]: a b [e d c h] f g
// i = 2, e1 = 4, e2 = 5
else {
  const s1 = i // prev starting index
  const s2 = i // next starting index

  // 5.1 build key:index map for newChildren
  const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
  for (i = s2; i <= e2; i++) {
    const nextChild = (c2[i] = optimized
      ? cloneIfMounted(c2[i] as VNode)
      : normalizeVNode(c2[i]))
    if (nextChild.key != null) {
      if (__DEV__ && keyToNewIndexMap.has(nextChild.key)) {
        warn(
          `Duplicate keys found during update:`,
          JSON.stringify(nextChild.key),
          `Make sure keys are unique.`
        )
      }
      keyToNewIndexMap.set(nextChild.key, i)
    }
  }

  // 5.2 loop through old children left to be patched and try to patch
  // matching nodes & remove nodes that are no longer present
  let j
  let patched = 0
  const toBePatched = e2 - s2 + 1
  let moved = false
  // used to track whether any node has moved
  let maxNewIndexSoFar = 0
  // works as Map<newIndex, oldIndex>
  // Note that oldIndex is offset by +1
  // and oldIndex = 0 is a special value indicating the new node has
  // no corresponding old node.
  // used for determining longest stable subsequence
  const newIndexToOldIndexMap = new Array(toBePatched)
  for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

  for (i = s1; i <= e1; i++) {
    const prevChild = c1[i]
    if (patched >= toBePatched) {
      // all new children have been patched so this can only be a removal
      unmount(prevChild, parentComponent, parentSuspense, true)
      continue
    }
    let newIndex
    if (prevChild.key != null) {
      newIndex = keyToNewIndexMap.get(prevChild.key)
    } else {
      // key-less node, try to locate a key-less node of the same type
      for (j = s2; j <= e2; j++) {
        if (
          newIndexToOldIndexMap[j - s2] === 0 &&
          isSameVNodeType(prevChild, c2[j] as VNode)
        ) {
          newIndex = j
          break
        }
      }
    }
    if (newIndex === undefined) {
      unmount(prevChild, parentComponent, parentSuspense, true)
    } else {
      newIndexToOldIndexMap[newIndex - s2] = i + 1
      if (newIndex >= maxNewIndexSoFar) {
        maxNewIndexSoFar = newIndex
      } else {
        moved = true
      }
      patch(
        prevChild,
        c2[newIndex] as VNode,
        container,
        null,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      )
      patched++
    }
  }

  // 5.3 move and mount
  // generate longest stable subsequence only when nodes have moved
  const increasingNewIndexSequence = moved
    ? getSequence(newIndexToOldIndexMap)
    : EMPTY_ARR
  j = increasingNewIndexSequence.length - 1
  // looping backwards so that we can use last patched node as anchor
  for (i = toBePatched - 1; i >= 0; i--) {
    const nextIndex = s2 + i
    const nextChild = c2[nextIndex] as VNode
    const anchor =
      nextIndex + 1 < l2 ? (c2[nextIndex + 1] as VNode).el : parentAnchor
    if (newIndexToOldIndexMap[i] === 0) {
      // mount new
      patch(
        null,
        nextChild,
        container,
        anchor,
        parentComponent,
        parentSuspense,
        isSVG,
        slotScopeIds,
        optimized
      )
    } else if (moved) {
      // move if:
      // There is no stable subsequence (e.g. a reverse)
      // OR current node is not among the stable sequence
      if (j < 0 || i !== increasingNewIndexSequence[j]) {
        move(nextChild, container, anchor, MoveType.REORDER)
      } else {
        j--
      }
    }
  }
}
```

本项目：
直接复制 Vue 的逻辑，修改一下变量名适配

```ts
else {
  const oldStartIndex = i // 旧子节点的开始索引
  const newStartIndex = i // 新子节点的开始索引

  // 5.1 创建一个 <key (新节点的 key): index (新节点的位置)> 的 Map 对象 KeyToNewIndexMap。
  // 通过该对象可知：新的 child (根据 key 判断指定 child) 更新后的位置（根据对应的 index 判断）在哪里
  const keyToNewIndexMap: Map<string | number | symbol, number> = new Map()
  for (i = newStartIndex; i <= newChildrenEnd; i++) {
    const nextChild = normalizeVNode(newChildren[i])
    if (nextChild.key != null) {
      keyToNewIndexMap.set(nextChild.key, i)
    }
  }

  // 5.2 loop through old children left to be patched and try to patch
  // matching nodes & remove nodes that are no longer present
  let j
  let patched = 0 // 已经更新的节点数量
  const toBePatched = newChildrenEnd - newStartIndex + 1 // 总共需要更新的节点数量
  let moved = false // 用于标记是否需要移动，在 5.3 使用
  // used to track whether any node has moved
  let maxNewIndexSoFar = 0
  // works as Map<newIndex, oldIndex>
  // Note that oldIndex is offset by +1
  // and oldIndex = 0 is a special value indicating the new node has
  // no corresponding old node.
  // used for determining longest stable subsequence
  // 这个数组的下标是新节点下标，元素是旧节点的元素索引值+1。这个数组到时候会用于求最长递增子序列。
  const newIndexToOldIndexMap = new Array(toBePatched)
  for (i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0

  // 遍历旧节点
  for (i = oldStartIndex; i <= oldChildrenEnd; i++) {
    const prevChild = oldChildren[i]
    // 如果已经处理的节点数大于了待处理的节点数，那说明此时处理的这个节点是多的，直接卸载就完了
    if (patched >= toBePatched) {
      // all new children have been patched so this can only be a removal
      unmount(prevChild)
      continue
    }

    let newIndex // 新节点需要存放的位置
    if (prevChild.key != null) {
      newIndex = keyToNewIndexMap.get(prevChild.key)
    } else {
      // 这个 else 的作用是处理边缘情况，如果在 keyToNewIndexMap 没有找到，那么还是尝试循环，希望能在循环里面找到新节点的位置。
      // key-less node, try to locate a key-less node of the same type
      for (j = newStartIndex; j <= newChildrenEnd; j++) {
        if (
          newIndexToOldIndexMap[j - newStartIndex] === 0 &&
          isSameVNodeType(prevChild, newChildren[j])
        ) {
          newIndex = j
          break
        }
      }
    }
    // 如果还是没找到这个节点需要存放的位置，那说明新子节点没有这个节点，就卸载掉
    if (newIndex === undefined) {
      unmount(prevChild)
    } else {
      // 更新那个列表，以剩余新节点的位置，映射出旧节点的位置。到时候拿来求最长递增子序列。
      newIndexToOldIndexMap[newIndex - newStartIndex] = i + 1
      // maxNewIndexSoFar 保存我们最近处理的节点的 index 的最大值，按理来说这个值应该是递增的，因为从左往右。
      if (newIndex >= maxNewIndexSoFar) {
        maxNewIndexSoFar = newIndex
      } else {
        // 在 else 中，如果 newIndex < maxNewIndexSoFar，这说明我们刚处理的节点的索引并没有递增，说明顺序不对了，那后续需要移动节点，因此把 moved 标记为 true，在 5.3 中进行移动操作
        moved = true
      }
      patch(prevChild, newChildren[newIndex], container, null)
      patched++
    }
  }

  // 5.3 move and mount
  // generate longest stable subsequence only when nodes have moved
  // 如果 moved 为 true，说明需要移动，那么就用 getSequence(newIndexToOldIndexMap) 求最长递增子序列。
  // 最长递增子序列对应的节点是不动的，除此之外的节点才可能需要移动。
  const increasingNewIndexSequence = moved
    ? getSequence(newIndexToOldIndexMap)
    : []
  j = increasingNewIndexSequence.length - 1
  // looping backwards so that we can use last patched node as anchor
  for (i = toBePatched - 1; i >= 0; i--) {
    const nextIndex = newStartIndex + i
    const nextChild = newChildren[nextIndex]
    const anchor =
      nextIndex + 1 < newChildrenLength
        ? newChildren[nextIndex + 1].el
        : parentAnchor
    // newIndexToOldIndexMap[i] === 0 说明，当前这个新节点没有与之对应的旧节点，那就是挂载新的节点。
    if (newIndexToOldIndexMap[i] === 0) {
      // mount new
      patch(null, nextChild, container, anchor)
    } else if (moved) {
      // move if:
      // There is no stable subsequence (e.g. a reverse)
      // OR current node is not among the stable sequence
      if (j < 0 || i !== increasingNewIndexSequence[j]) {
        move(nextChild, container, anchor)
      } else {
        j--
      }
    }
  }
}
```

### 总结

Diff 指的是：**添加、删除、打补丁、移动** 这四个行为。Diff 分成五大场景，先从左至右 Diff，相同元素打补丁，然后从右至左 Diff，相同元素打补丁。
然后对新节点更多的情况，挂载新增加的节点。如果新节点更少的情况，把旧的多余节点卸载。最后是对乱序情况下的处理。
