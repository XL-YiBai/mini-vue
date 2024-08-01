import { extend } from '@vue/shared'
import { baseParse } from './parse'
import { transform } from './transform'
import { transformElement } from './transforms/transformElement'
import { transformText } from './transforms/transformText'
import { generate } from './codegen'

export function baseCompile(template: string, options = {}) {
  const ast = baseParse(template)
  console.log('ast', JSON.stringify(ast))

  transform(
    ast,
    extend(options, {
      nodeTransforms: [transformElement, transformText]
    })
  )

  // console.log(ast)
  return generate(ast)
}
const obj = {
  type: 0,
  children: [
    {
      type: 1,
      tag: 'div',
      tagType: 0,
      children: [
        { type: 2, content: 'hello ' },
        { type: 5, content: { type: 4, isStatic: false } }
      ],
      props: []
    }
  ],
  loc: {}
}
