import { compile } from '@vue/compiler-dom'
import { registerRuntimeCompiler } from 'packages/runtime-core/src/component'

// 把编译生成的字符串，转换成真正的函数返回出去
function compileToFunction(template, options?) {
  const { code } = compile(template, options)

  console.log(code)
  const render = new Function(code)()

  return render
}

registerRuntimeCompiler(compileToFunction)

export { compileToFunction as compile }
