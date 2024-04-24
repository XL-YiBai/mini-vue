import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Comment, Fragment, Text } from './vnode'

export interface RenderOptions {
  /**
   * 为制定的 element 的 props 打补丁
   */
  patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
  /**
   * 为制定的Element 设置text
   */
  setElementText(node: Element, text: string): void
  /**
   * 插入制定的 el 到 parent 中，anchor 表示插入的位置，即：锚点
   */
  insert(el, parent: Element, anchor): void
  /**
   * 创建 element
   */
  createElement(type: string)
}

export function createRender(options: RenderOptions) {
  return baseCreateRender(options)
}

// 通过 options 参数，接受不同宿主环境下对应的元素操作方法，这里我们是客户端渲染，所以对应DOM相关操作
function baseCreateRender(options: RenderOptions): any {
  const {
    insert: hostInsert,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    setElementText: hostSetElementText
  } = options

  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      // 挂载操作
      mountElement(newVNode, container, anchor)
    } else {
      // TODO: 更新操作
    }
  }

  const mountElement = (vnode, container, anchor) => {
    const { type, props, shapeFlag } = vnode

    // 1. 创建 element
    const el = (vnode.el = hostCreateElement(type))

    // 如果是 text children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 2. 设置文本
      hostSetElementText(el, vnode.children)
      // 如果是 array children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    }

    // 3. 设置 props
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key])
      }
    }

    // 4. 插入
    hostInsert(el, container, anchor)
  }

  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }

    const { type, shapeFlag } = newVNode

    switch (type) {
      case Text:
        break
      case Comment:
        break
      case Fragment:
        break

      default:
        // 如果 newVNode 是 Element
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(oldVNode, newVNode, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
        }
        break
    }
  }
  const render = (vnode, container) => {
    if (vnode === null) {
      // TODO: 卸载
    } else {
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode
  }

  return {
    render
  }
}
