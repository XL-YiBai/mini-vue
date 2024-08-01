import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Text, createVNode } from './vnode'

export function renderComponentRoot(instance) {
  const { vnode, render, data = {} } = instance

  let result

  try {
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 通过 call 改变 this 指向，这样在 render 中通过 this.xxx 就能拿到 data 中的数据
      // 额外传入 data 作为参数，这样在最后生成 render 函数中，就可以直接通过 变量取到 data 上的内容
      result = normalizeVNode(render!.call(data, data))
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
