import { NodeTypes } from './ast'

export interface TransformContext {
  root
  parent: ParentNode | null
  childIndex: number
  currentNode
  helpers: Map<symbol, number>
  helper<T extends symbol>(name: T): T
  nodeTransforms: any[]
}

export function createTransformContext(root, { nodeTransforms = [] }) {
  const context: TransformContext = {
    nodeTransforms,
    root,
    helpers: new Map(),
    currentNode: root,
    parent: null,
    childIndex: 0,
    helper(name) {
      const count = context.helpers.get(name) || 0
      context.helpers.set(name, count + 1)
      return name
    }
  }

  return context
}

export function transform(root, options) {
  // 生成上下文 context
  const context = createTransformContext(root, options)
  traverseNode(root, context)
}

/*
遍历和转化节点 遍历 AST，转化成 JavaScript AST，转化的过程是深度优先遍历
转化的过程分为两个阶段：
1. 进入阶段：存储所有节点的转化函数到 exitFns 中
2. 退出阶段：循环执行 exitFns 中缓存的转化函数，且一定是倒叙的。因为只有这样才能保证整个处理过程是深度优先的
*/
export function traverseNode(node, context: TransformContext) {
  context.currentNode = node
  const { nodeTransforms } = context
  const exitFns: any = []

  // 保存所有的 transform 函数到 exitFns
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context)
    if (onExit) {
      exitFns.push(onExit)
    }
  }

  switch (node.type) {
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
      // 处理子节点
      traverseChildren(node, context)
      break
  }

  // 在上面处理完子节点回溯回来时，再从后向前取出 transform 方法依次执行
  context.currentNode = node
  let i = exitFns.length
  while (i--) {
    exitFns[i]()
  }
}

export function traverseChildren(parent, context: TransformContext) {
  parent.children.forEach((node, index) => {
    context.parent = parent
    context.childIndex = index
    // 递归
    traverseNode(node, context)
  })
}
