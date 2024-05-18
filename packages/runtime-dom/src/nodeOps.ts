const doc = document

export const nodeOps = {
  insert: (child, parent, anchor) => {
    // 把子节点插入到锚点(anchor)之前
    parent.insertBefore(child, anchor || null)
  },

  createElement: (tag): Element => {
    const el = doc.createElement(tag)
    return el
  },

  setElementText: (el: Element, text) => {
    el.textContent = text
  },

  remove: (child: Element) => {
    const parent = child.parentNode
    if (parent) {
      parent.removeChild(child)
    }
  },

  // 创建文本节点
  createText: text => doc.createTextNode(text),

  // 更新文本节点
  setText: (el: Element, text: string) => {
    el.nodeValue = text
  },

  // 创建注释节点
  createComment: text => doc.createComment(text)
}
