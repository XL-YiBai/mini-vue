import { extend, isArray } from '@vue/shared'
import { Dep, createDep } from './dep'
import { ComputedRefImpl } from './computed'

export type EffectScheduler = (...args: any[]) => any

type KeyToDepMap = Map<any, Dep>
/**
 * 收集所有依赖的 WeakMap 实例
 * 1. key： 响应性对象
 * 2. value： Map 对象
 *    1. key：响应性对象上的指定属性
 *    2. value：对象上指定属性的 执行函数
 */
const targetMap = new WeakMap<any, KeyToDepMap>()

export interface ReactiveEffectOptions {
  lazy?: boolean
  scheduler?: EffectScheduler
}

export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions) {
  const _effect = new ReactiveEffect(fn)

  if (options) {
    // 把 options 合并进 _effect，这样如果options存在调度器的话，_effect就也会有调度器，trigger触发时，会执行传入的调度器
    extend(_effect, options)
  }

  if (!options || !options.lazy) {
    _effect.run()
  }
}

export let activeEffect: ReactiveEffect | undefined

export class ReactiveEffect<T = any> {
  computed?: ComputedRefImpl<T>

  constructor(public fn: () => T, public scheduler?: EffectScheduler | null) {}

  run() {
    activeEffect = this

    return this.fn()
  }

  // 后续可以在这实现stop方法，取消响应式
  stop() {}
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

  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = createDep()))
  }

  trackEffects(dep)
}

/**
 * 利用 dep 依次跟踪指定 key 的所有 effect
 * @param dep 依赖函数的 Set 集合
 */
export function trackEffects(dep: Dep) {
  dep.add(activeEffect!)
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

  const dep: Dep | undefined = depsMap.get(key)

  if (!dep) {
    return
  }

  triggerEffects(dep)
}

/**
 * 依次触发 dep 中保存的依赖
 * @param dep 依赖函数的 Set 集合
 */
export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep]

  // 依次触发依赖，先触发computed的，再触发其他的，避免后触发computed因为_dirty的值导致死循环
  for (const effect of effects) {
    if (effect.computed) {
      triggerEffect(effect)
    }
  }

  for (const effect of effects) {
    if (!effect.computed) {
      triggerEffect(effect)
    }
  }
}

/**
 * 触发具体的指定依赖
 * @param effect 具体依赖，ReactiveEffect 的实例
 */
export function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler()
  } else {
    effect.run()
  }
}
