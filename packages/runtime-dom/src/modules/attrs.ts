export function patchAttr(el: Element, key, value) {
  console.log('setAttr', key)
  if (value === null) {
    el.removeAttribute(key)
  } else {
    el.setAttribute(key, value)
  }
}
