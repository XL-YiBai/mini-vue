import { isString } from '@vue/shared'

export function patchStyle(el: Element, prev, next) {
  // 获取 style 对象
  const style = (el as HTMLElement).style
  const isCssString = isString(next)

  if (next && !isCssString) {
    // 新样式的挂载
    for (const key in next) {
      setStyle(style, key, next[key])
    }

    // 清理旧样式，如果在 prev 原始样式对象中有的 key，在 next 新样式对象中没有，那么就把 style[key] 设为空
    if (prev && !isString(prev)) {
      for (const key in prev) {
        // 旧样式属性在新样式中没有
        if (next[key] == null) {
          setStyle(style, key, '')
        }
      }
    }
  }
}

// 这里只处理了 style 是 string 的情况，没处理 string[]
function setStyle(style: CSSStyleDeclaration, name: string, val: string) {
  style[name] = val
}
