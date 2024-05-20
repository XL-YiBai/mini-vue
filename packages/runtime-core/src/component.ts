import { reactive } from '@vue/reactivity'
import { isObject } from '@vue/shared'

let uid = 0

export function createComponentInstance(vnode) {
  const type = vnode.type
  const instance = {
    uid: uid++,
    vnode,
    type,
    subTree: null, // 组件真正要渲染的部分（是一个 vnode）
    effect: null,
    update: null,
    render: null
  }

  return instance
}

export function setupComponent(instance) {
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance) {
  finishComponentSetup(instance)
}

export function finishComponentSetup(instance) {
  const Component = instance.type

  // 把组件上的 render 方法赋值到 instance 实例上
  instance.render = Component.render

  applyOptions(instance)
}

function applyOptions(instance: any) {
  // 这里解构出来的 dataOptions 其实就是 component 中那个 data() { return { msg: 'xx', ... } }
  const { data: dataOptions } = instance.type

  if (dataOptions) {
    const data = dataOptions()
    if (isObject(data)) {
      // 把 data 转换成响应性数据，挂载到 instance.data
      instance.data = reactive(data)
    }
  }
}
