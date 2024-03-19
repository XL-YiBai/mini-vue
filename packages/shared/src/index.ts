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
