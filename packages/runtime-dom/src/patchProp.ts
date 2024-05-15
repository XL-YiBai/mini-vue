import { isOn } from '@vue/shared'
import { patchClass } from './modules/class'
import { patchDOMProp } from './modules/prop'
import { patchAttr } from './modules/attrs'
import { patchStyle } from './modules/style'

export const patchProp = (el: Element, key, prevValue, nextValue) => {
  if (key === 'class') {
    patchClass(el, nextValue)
  } else if (key === 'style') {
    patchStyle(el, prevValue, nextValue)
  } else if (isOn(key)) {
  } else if (shouldSetAsProp(el, key)) {
    // 通过 el[key] = value 更新属性
    patchDOMProp(el, key, nextValue)
  } else {
    // 通过 el.setAttribute(value) 设置属性
    patchAttr(el, key, nextValue)
  }
}

function shouldSetAsProp(el: Element, key: string) {
  if (key === 'form') {
    return false
  }

  if (key === 'list' && el.tagName === 'INPUT') {
    return false
  }

  if (key === 'type' && el.tagName === 'TEXTAREA') {
    return false
  }

  return key in el
}
