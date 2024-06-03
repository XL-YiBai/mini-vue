import { NodeTypes } from '../ast'
import { isText } from '../utils'

/**
 * 将相邻的文本节点和表达式，合并成一个表达式
 * 例如：<div>hello {{ msg }}</div>
 * 这个模板包含两个节点
 * 1. hello: TEXT 文本节点
 * 2. {{ msg }}: INTERPOLATION 表达式节点
 * 这两个节点在生成 render 函数时，需要被合并：'hello' + _toDisplayString(_ctx.msg)
 * 那么在合并时就要多出来这个 + 号
 * 例如：
 * children: [
 *  {{ TEXT 文本节点 }},
 *  " + ",
 *  {{ INTERPOLATION 表达式节点 }}
 * ]
 */
export const transformText = (node, context) => {
  if (
    node.type === NodeTypes.ROOT ||
    node.type === NodeTypes.ELEMENT ||
    node.type === NodeTypes.FOR ||
    node.type === NodeTypes.IF_BRANCH
  ) {
    return () => {
      const children = node.children
      let currentContainer
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isText(child)) {
          for (let j = i + 1; j < children.length; j++) {
            const next = children[j]

            // 如果 child 是 TEXT 并且下一个节点也是文本或者双括号表达式，那么就在下一个节点之前放一个加号，再 push 到 currentContainer.children 数组
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = createCompoundExpression(
                  [child],
                  child.loc
                )
              }
              currentContainer.children.push(` + `, next)

              // 因为 j 已经处理了，就先删掉
              children.splice(j, 1)
              j--
            }
            // 如果 child 是 TEXT 但下一个节点不是
            else {
              currentContainer = undefined
              break
            }
          }
        }
      }
    }
  }
}

export function createCompoundExpression(children, loc) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    loc,
    children
  }
}
