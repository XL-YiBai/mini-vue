import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Text, createVNode } from './vnode'

export function renderComponentRoot(instance) {
  const { vnode, render, data } = instance

  let result

  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 通过 call 改变 this 指向，这样在 render 中通过 this.xxx 就能拿到 data 中的数据
      result = normalizeVNode(render!.call(data))
    }
  } catch (error) {
    console.error(error)
  }

  return result
}

export function normalizeVNode(child) {
  if (typeof child === 'object') {
    return cloneIfMounted(child)
  } else {
    return createVNode(Text, null, String(child))
  }
}

export function cloneIfMounted(child) {
  return child
}
