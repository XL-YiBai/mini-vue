import { ShapeFlags } from 'packages/shared/src/shapeFlags'
import { Comment, Fragment, Text, isSameVNodeType } from './vnode'
import { EMPTY_OBJ } from '@vue/shared'

export interface RenderOptions {
  /**
   * 为指定的 element 的 props 打补丁
   */
  patchProp(el: Element, key: string, prevValue: any, nextValue: any): void
  /**
   * 为指定的 Element 设置 text
   */
  setElementText(node: Element, text: string): void
  /**
   * 插入指定的 el 到 parent 中，anchor 表示插入的位置，即：锚点
   */
  insert(el, parent: Element, anchor): void
  /**
   * 创建 element
   */
  createElement(type: string)
  /**
   * 删除 element
   */
  remove(el: Element)
  /**
   * 创建 Text 节点
   */
  createText(text: string)
  /**
   * 更新 Text 节点的内容
   */
  setText(node, text)
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
    setElementText: hostSetElementText,
    remove: hostRemove,
    createText: hostCreateText,
    setText: hostSetText
  } = options

  const processText = (oldVNode, newVNode, container, anchor) => {
    // 挂载
    if (oldVNode === null) {
      newVNode.el = hostCreateText(newVNode.children)
      hostInsert(newVNode.el, container, anchor)
      // 更新
    } else {
      const el = (newVNode.el = oldVNode.el!)
      // 更新文本节点的内容
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children)
      }
    }
  }

  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode == null) {
      // 挂载操作
      mountElement(newVNode, container, anchor)
    } else {
      // TODO: 更新操作
      patchElement(oldVNode, newVNode)
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

  const patchElement = (oldVNode, newVNode) => {
    const el = (newVNode.el = oldVNode.el)

    const oldProps = oldVNode.props || EMPTY_OBJ
    const newProps = newVNode.props || EMPTY_OBJ

    // 更新子节点
    patchChildren(oldVNode, newVNode, el, null)

    // 更新 props
    patchProps(el, newVNode, oldProps, newProps)
  }

  const patchChildren = (oldVNode, newVNode, container, anchor = null) => {
    // 获取新旧节点的子节点，以及他们的 shapeFlag
    const c1 = oldVNode && oldVNode.children
    const prevShapeFlag = oldVNode ? oldVNode.shapeFlag : 0
    const c2 = newVNode && newVNode.children
    const { shapeFlag } = newVNode

    // 如果新节点的子节点是 text children
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 新节点的子节点是 text children 的情况下，旧节点的子节点是 array children
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // TODO: 卸载旧子节点
      }

      // 新节点的子节点是 text children 的情况下，旧节点的子节点不是 array children，并且新旧子节点不是同一个
      if (c2 !== c1) {
        // 挂载新子节点的文本
        hostSetElementText(container, c2)
      }
      // 如果新节点的子节点不是 text children
    } else {
      // 如果旧节点的子节点是 array children
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 如果新节点的子节点也是 array children
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: diff
          // 如果新节点的子节点不是 array
        } else {
          // TODO: 卸载
        }
        // 如果旧节点的子节点不是 array
      } else {
        // 如果旧节点的子节点是 text (旧：text，新：text)
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          // 删除旧节点的 text
          hostSetElementText(container, '')
        }
        // 新节点的子节点是 array
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // TODO: 单独新子节点的挂载
        }
      }
    }
  }

  const patchProps = (el: Element, vnode, oldProps, newProps) => {
    if (oldProps !== newProps) {
      // 用新的属性覆盖旧的属性
      for (const key in newProps) {
        const next = newProps[key]
        const prev = oldProps[key]
        if (next !== prev) {
          hostPatchProp(el, key, prev, next)
        }
      }

      // 循环旧的props，如果属性在新的props中没有，那么需要删除掉。比如旧属性有一个class，但是新的节点没有了，就把class属性移除掉
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null)
          }
        }
      }
    }
  }

  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) {
      return
    }

    // 如果新旧节点不是同一个节点，那么把旧的从 Dom 中删除
    // 这样 oldVNode 就没有了，之后在 processElement 时，就不是执行更新操作，而是直接执行挂载操作了
    if (oldVNode && !isSameVNodeType(oldVNode, newVNode)) {
      unmount(oldVNode)
      oldVNode = null
    }

    const { type, shapeFlag } = newVNode

    switch (type) {
      case Text:
        processText(oldVNode, newVNode, container, anchor)
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

  const unmount = vnode => {
    hostRemove(vnode.el)
  }

  const render = (vnode, container) => {
    if (vnode === null) {
      // 卸载
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }

    container._vnode = vnode
  }

  return {
    render
  }
}
