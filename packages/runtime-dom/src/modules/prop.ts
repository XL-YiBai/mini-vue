export function patchDOMProp(el, key, value) {
  try {
    console.log('el.xxx', key)
    el[key] = value
  } catch (e) {}
}
