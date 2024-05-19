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
}
