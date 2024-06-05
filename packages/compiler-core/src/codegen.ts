import { helperNameMap } from './runtimeHelpers'

function createCodegenContext(ast) {
  const context = {
    code: '',
    runtimeGlobalName: 'Vue',
    source: ast.loc.source,
    indentLevel: 0, // 缩进级别
    helper(key) {
      return `_${helperNameMap[key]}`
    },
    push(code) {
      context.code += code
    },
    // 换行
    newline() {
      newline(context.indentLevel)
    },
    // 缩进
    indent() {
      newline(++context.indentLevel)
    },
    // 反缩进
    deindent() {
      newline(--context.indentLevel)
    }
  }

  function newline(n: number) {
    // ` `.repeat(n) 生成 n 个空格
    context.code += '\n' + ` `.repeat(n)
  }

  return context
}

export function generate(ast) {
  const context = createCodegenContext(ast)

  const { push, newline, indent, deindent } = context
}
