/**
 * 判断是否是数组
 */
export const isArray = Array.isArray

/**
 * 判断 value 是否是 object
 * @param value
 * @returns
 */
export const isObject = (value: unknown) =>
  value !== null && typeof value === 'object'

/**
 * 对比两个数据是否发生改变
 * @param value
 * @param oldValue
 * @returns
 */
export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue)

/**
 * 判断是否为函数
 * @param val boolean
 * @returns
 */
export const isFunction = (val: unknown): val is Function => {
  return typeof val === 'function'
}

export const extend = Object.assign

// 空对象
export const EMPTY_OBJ: { readonly [key: string]: any } = {}
