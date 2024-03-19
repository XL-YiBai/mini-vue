import { isObject } from '@vue/shared'
import { mutableHandlers } from './baseHandlers'

// 响应性 Map 缓存对象
export const reactiveMap = new WeakMap<object, any>()

// 为复杂数据类型创建响应式对象
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandlers, reactiveMap)
}

// 创建 Proxy 响应性对象
function createReactiveObject(
  target: object,
  baseHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  const existingProxy = proxyMap.get(target)
  // 如果实例已经被代理，直接返回
  if (existingProxy) {
    return existingProxy
  }

  // 没有则创建新的 Proxy 实例
  const proxy = new Proxy(target, baseHandlers)
  // 缓存起来
  proxyMap.set(target, proxy)
  return proxy
}

export const toReactive = <T extends unknown>(value: T): T =>
  isObject(value) ? reactive(value as object) : value
