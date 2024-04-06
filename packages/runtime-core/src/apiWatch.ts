import { EMPTY_OBJ, hasChanged, isObject } from '@vue/shared'
import { isReactive } from 'packages/reactivity/src/reactive'
import { queuePreFlushCb } from './scheduler'
import { ReactiveEffect } from 'packages/reactivity/src/effect'

export interface WatchOptions<immediate = boolean> {
  immediate?: immediate
  deep?: boolean
}

export function watch(source, cb: Function, options?: WatchOptions) {
  return doWatch(source, cb, options)
}

function doWatch(
  source,
  cb: Function,
  { immediate, deep }: WatchOptions = EMPTY_OBJ
) {
  let getter: () => any

  if (isReactive(source)) {
    getter = () => source
    // watch直接监听reactive对象(而不是对象上某个属性)的话，那么默认开启deep
    deep = true
  } else {
    // 其他的情况这里就先省略
    getter = () => {}
  }

  if (cb && deep) {
    const baseGetter = getter
    // 通过traverse方法，递归处理对象每一个属性，手动触发getter进行依赖收集
    getter = () => traverse(baseGetter())
  }

  let oldValue = {}

  // job函数的执行，本质上就是watch传入的回调的执行，只不过在这里处理了oldValue和newValue的更新
  const job = () => {
    if (cb) {
      const newValue = effect.run()
      if (deep || hasChanged(newValue, oldValue)) {
        cb(newValue, oldValue)
        oldValue = newValue
      }
    }
  }

  let scheduler = () => queuePreFlushCb(job)

  const effect = new ReactiveEffect(getter, scheduler)

  if (cb) {
    if (immediate) {
      job()
    } else {
      oldValue = effect.run()
    }
  } else {
    effect.run()
  }

  // 返回一个函数，控制关闭watch监听
  return () => {
    effect.stop()
  }
}

// 递归处理对象每一个属性，手动触发getter
export function traverse(value: unknown) {
  if (!isObject(value)) {
    return value
  }

  for (const key in value as object) {
    traverse((value as object)[key])
  }

  return value
}
