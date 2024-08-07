import { extend } from '@vue/shared'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformText } from './transforms/transformText'
import { generate } from './codegen'
import { transformIf } from './transforms/vif'

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template)
  // console.log('ast', JSON.stringify(ast))

  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText, transformIf]
    })
  )

  console.log(ast)
  return generate(ast)
}
