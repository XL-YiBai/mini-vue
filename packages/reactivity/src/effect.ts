type KeyToDepMap = Map<any, ReactiveEffect>
/**
 * 收集所有依赖的 WeakMap 实例
 * 1. key： 响应性对象
 * 2. value： Map 对象
 *    1. key：响应性对象上的指定属性
 *    2. value：对象上指定属性的 执行函数
 */
const targetMap = new WeakMap<any, KeyToDepMap>()

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn)

  _effect.run()
}

let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}

  run() {
    activeEffect = this

    return this.fn()
  }
}

/**
 * 收集依赖
 * @param target
 * @param key
 */
export function track(target: object, key: unknown) {
  // 不存在执行函数
  if (!activeEffect) return
  // 尝试从 targetMap 中根据 target 获取 map
  let depsMap = targetMap.get(target)
  // 不存在 则生成新的
  if (!depsMap) {
    // depsMap = new Map()
    targetMap.set(target, (depsMap = new Map()))
  }

  // 为指定的属性设置依赖函数
  depsMap.set(key, activeEffect)
}

/**
 * 触发依赖
 * @param target WeakMap 的 key
 * @param key 代理对象的 key，依赖被触发时，根据 key 在 depsMap 获取依赖执行
 * @param newValue
 */
export function trigger(target: object, key: unknown, newValue: unknown) {
  const depsMap = targetMap.get(target)

  if (!depsMap) {
    return
  }

  const effect = depsMap.get(key) as ReactiveEffect

  if (!effect) {
    return
  }

  effect.fn()
}
