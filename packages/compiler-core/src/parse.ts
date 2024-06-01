import { ElementTypes, NodeTypes } from './ast'

const enum TagType {
  Start,
  End
}

export interface ParserContext {
  source: string
}

function createParseContext(content: string): ParserContext {
  return {
    source: content
  }
}

export function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    loc: {}
  }
}

export function baseParse(content: string) {
  const context = createParseContext(content)

  const children = parseChildren(context, [])

  return createRoot(children)
}

// ancestors 是数组 ElementNode[]
function parseChildren(context: ParserContext, ancestors) {
  const nodes = []

  while (!isEnd(context, ancestors)) {
    const s = context.source

    let node

    if (startsWith(s, '{{')) {
      // TODO: {{
    } else if (s[0] === '<') {
      // 如果以 '<' 开头，并且第二个元素是字母，那么就表示这是一个标签的开始
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }

    // 如果上面两个 if 都没生成 node，那就当一个文本节点处理
    if (!node) {
      node = parseText(context)
    }

    pushNode(nodes, node)
  }

  return nodes
}

function parseElement(context: ParserContext, ancestors) {
  // 处理标签的开始
  const element = parseTag(context, TagType.Start)

  // 处理标签的 children
  ancestors.push(element)
  const children = parseChildren(context, ancestors)
  ancestors.pop()
  element.children = children

  // 处理标签的结束
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  }

  return element
}

function parseTag(context: ParserContext, type: TagType) {
  // 通过正则来从 source 中解析出标签名，比如source是<div>hello world</div>，那么解析出的数组第二位就是标签名 ['<div', 'div']
  const match: any = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source)
  const tag = match[1]

  advanceBy(context, match[0].length)

  // 判断这个标签是否是自闭和的
  let isSelfClosing = startsWith(context.source, '/>')
  // 如果是自闭和的 '/>' 那么游标需要移动 2 位，如果不是，那么移动 1 位
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    children: [],
    props: []
  }
}

// 解析普通文本
function parseText(context: ParserContext) {
  // 这是结束的标志，如果解析到 '<' 或者 '{{'，说明文本的部分读取结束了
  const endTokens = ['<', '{{']

  let endIndex = context.source.length

  // 如果能在 source 中找到结束的标志 '<' 或者 '{{'，并且 index 在 endIndex 之前，那么就更新 endIndex
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context: ParserContext, length: number) {
  const rawText = context.source.slice(0, length)

  advanceBy(context, length)
  return rawText
}

function pushNode(nodes, node) {
  nodes.push(node)
}

// 判断当前是否是结束标签
function isEnd(context: ParserContext, ancestors) {
  const s = context.source

  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true
      }
    }
  }

  return !s
}

// 判断是否是结束标签的开始 例如 </div
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return startsWith(source, '</')
}

function startsWith(source: string, searchString: string): boolean {
  return source.startsWith(searchString)
}

// 这个函数用于移动游标位置，移动的距离是 numberOfCharacters，这个函数再每解析一部分内容时都需要调用
// 比如source是 <div>hello world</div> ，当解析完 <div 之后，需要把游标往右移动 4 位，source 变成 '>hello world</div>'
function advanceBy(context: ParserContext, numberOfCharacters: number) {
  const { source } = context
  context.source = source.slice(numberOfCharacters)
}
