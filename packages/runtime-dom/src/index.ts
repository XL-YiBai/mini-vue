import { patchProp } from './patchProp'
import { extend, isString } from '@vue/shared'
import { createRender } from 'packages/runtime-core/src/renderer'
import { nodeOps } from './nodeOps'

// 把 patchProp 和 nodeOps 合并成一个对象，这里是拿到对应宿主环境下元素的操作方法，作为参数传递给 createRender
const rendererOptions = extend({ patchProp }, nodeOps)

let renderer

function ensureRenderer() {
  // 因为 rendererOptions 对应宿主环境的操作，这样就把 runtime-dom 和 runtime-core 结合起来了
  return renderer || (renderer = createRender(rendererOptions))
}

// 通过这个函数导出 render 的功能。因为render函数本质上是 createRender 返回的对象中的一个函数
export const render = (...args) => {
  ensureRenderer().render(...args)
}

export const createApp = (...args) => {
  const app = ensureRenderer().createApp(...args)

  const { mount } = app
  app.mount = (containerOrSelector: Element | string) => {
    const container = normalizeContainer(containerOrSelector)
    if (!container) {
      console.error('容器必须存在')
      return
    }
    mount(container)
  }

  return app
}

function normalizeContainer(container: Element | string): Element | null {
  if (isString(container)) {
    const res = document.querySelector(container)
    return res
  }
  return container
}
