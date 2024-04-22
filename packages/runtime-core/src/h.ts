import { isArray, isObject } from '@vue/shared'
import { VNode, createVNode, isVNode } from './vnode'

export function h(type: any, propsOrChildren?: any, children?: any): VNode {
  const l = arguments.length

  if (l === 2) {
    if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
      // 如果第二个参数是对象，并且是 VNode，那么第二个参数就当 children 用
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren])
      }

      // 如果第二个参数是对象，但不是 VNode，就当 props 用
      return createVNode(type, propsOrChildren, [])
    } else {
      // 如果第二个参数是数组，就当 children 用
      return createVNode(type, null, propsOrChildren)
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2)
    } else if (l === 3 && isVNode(children)) {
      children = [children]
    }

    return createVNode(type, propsOrChildren, children)
  }
}
