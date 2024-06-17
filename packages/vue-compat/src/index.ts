import { compile } from '@vue/compiler-dom'

// 把编译生成的字符串，转换成真正的函数返回出去
function compileToFunction(template, options?) {
  const { code } = compile(template, options)

  const render = new Function(code)()

  return render
}

export { compileToFunction as compile }
