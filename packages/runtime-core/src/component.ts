import { reactive } from '@vue/reactivity'
import { isObject } from '@vue/shared'
import { onBeforeMount, onMounted } from './apiLifecycle'

let uid = 0

export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm'
}

export function createComponentInstance(vnode) {
  const type = vnode.type
  const instance = {
    uid: uid++,
    vnode,
    type,
    subTree: null, // 组件真正要渲染的部分（是一个 vnode）
    effect: null,
    update: null,
    render: null,
    isMounted: false,
    bc: null,
    c: null,
    bm: null,
    m: null
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
  const {
    data: dataOptions,
    beforeCreate,
    created,
    beforeMount,
    mounted
  } = instance.type

  // 在数据初始化之前执行 beforeCreated
  if (beforeCreate) {
    callHook(beforeCreate)
  }

  if (dataOptions) {
    const data = dataOptions()
    if (isObject(data)) {
      // 把 data 转换成响应性数据，挂载到 instance.data
      instance.data = reactive(data)
    }
  }

  // 在数据初始化之后，执行 created
  if (created) {
    callHook(created)
  }

  function registerLifecycleHook(register: Function, hook?: Function) {
    register(hook, instance)
  }

  // 其他的生命周期都通过 registerLifecycleHook 包装注册，放到 instance 实例上，
  // 例如 instance.bm 存储 beforeMount， instance.m 存储 mounted
  // 之后在对应需要调用的位置，从 instance 上取出来执行
  registerLifecycleHook(onBeforeMount, beforeMount)
  registerLifecycleHook(onMounted, mounted)
  // ... 其他的这里没写
}

function callHook(hook: Function) {
  hook()
}
