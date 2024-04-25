import { isArray, isFunction, isObject, isString } from '@vue/shared'
import { normalizeClass } from 'packages/shared/src/normalizeProp'
import { ShapeFlags } from 'packages/shared/src/shapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export const Comment = Symbol('Comment')

export interface VNode {
  __v_isVNode: true
  type: any
  props: any
  children: any
  shapeFlag: number
  key: any
}

export function isVNode(value: any): value is VNode {
  return value ? value.__v_isVNode === true : false
}

export function createVNode(type, props, children): VNode {
  if (props) {
    let { class: klass, style } = props
    if (klass && !isString(klass)) {
      props.class = normalizeClass(klass)
    }
  }

  const shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0

  return createBaseVNode(type, props, children, shapeFlag)
}

function createBaseVNode(type, props, children, shapeFlag) {
  const vnode = {
    __v_isVNode: true,
    type,
    props,
    shapeFlag
  } as VNode

  normalizeChildren(vnode, children)

  return vnode
}

export function normalizeChildren(vnode: VNode, children: unknown) {
  let type = 0

  // 这里我们使用两等号为了兼容 children 是 undefined 也就是没传的情况，如果是组件作为 h 函数参数，children 就是 undefined
  if (children == null) {
    children = null
  } else if (isArray(children)) {
    type = ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'object') {
  } else if (isFunction(children)) {
  } else {
    children = String(children)
    type = ShapeFlags.TEXT_CHILDREN
  }

  vnode.children = children
  // 按位或运算
  vnode.shapeFlag |= type
}

/**
 * 判断两个 VNode 节点是不是同一个
 * @param n1 VNode
 * @param n2 VNode
 * @returns boolean
 */
export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type && n1.key === n2.key
}
