let isFlushPending = false

const resolvedPromise = Promise.resolve() as Promise<any>

let currentFlushPromise: Promise<void> | null

const pendingPreFlushCbs: Function[] = []

// 用于把传入的回调放入pending队列，通过Promise.resolve创建微任务使这些任务在同步任务执行完再执行
export function queuePreFlushCb(cb: Function) {
  queueCb(cb, pendingPreFlushCbs)
}

function queueCb(cb: Function, pendingQueue: Function[]) {
  // 把回调函数放入pending队列
  pendingQueue.push(cb)
  queueFlush()
}

function queueFlush() {
  // resolvedPromise.then(flushJobs)控制整个微任务队列的调度，只需要触发一次，
  // 所以这里isFlushPending改为true之后，if条件就进不去了。在这个期间就只要往里面塞任务就行，
  // 后续等这个.then(flushJobs)触发，之前塞入的任务都被取出来执行
  if (!isFlushPending) {
    isFlushPending = true
    // 使用异步微任务执行 flushJobs
    currentFlushPromise = resolvedPromise.then(flushJobs)
  }
}

function flushJobs() {
  isFlushPending = false
  flushPreFlushCbs()
}

/**
 * 依次取出pending队列中的任务执行
 */
export function flushPreFlushCbs() {
  if (pendingPreFlushCbs.length) {
    let activePreFlushCbs = [...new Set(pendingPreFlushCbs)]
    pendingPreFlushCbs.length = 0

    for (let i = 0; i < activePreFlushCbs.length; i++) {
      activePreFlushCbs[i]()
    }
  }
}
