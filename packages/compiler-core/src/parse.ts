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
      node = parseInterpolation(context)
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

function parseInterpolation(context: ParserContext) {
  // {{ xx }} 只需要处理 xx
  const [open, close] = ['{{', '}}']

  // 移动游标去除开头的 {{
  advanceBy(context, open.length)

  // 拿到中间的内容 xx
  const closeIndex = context.source.indexOf(close, open.length)
  const preTrimContext = parseTextData(context, closeIndex)
  const content = preTrimContext.trim()

  // 移动游标去除结尾的 }}
  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      content
    }
  }
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

  // 属性和指令的处理
  advanceSpaces(context)
  let props = parseAttributes(context, type)

  // 判断这个标签是否是自闭和的
  let isSelfClosing = startsWith(context.source, '/>')
  // 如果是自闭和的 '/>' 那么游标需要移动 2 位，如果不是，那么移动 1 位
  advanceBy(context, isSelfClosing ? 2 : 1)

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    children: [],
    props
  }
}

function advanceSpaces(context: ParserContext): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source)

  if (match) {
    advanceBy(context, match[0].length)
  }
}

function parseAttributes(context, type) {
  const props: any = []
  const attributeNames = new Set<string>()
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    const attr = parseAttribute(context, attributeNames)
    if (type === TagType.Start) {
      props.push(attr)
    }
    advanceSpaces(context)
  }

  return props
}

function parseAttribute(context: ParserContext, nameSet: Set<string>) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!
  const name = match[0]
  nameSet.add(name)

  advanceBy(context, name.length)
  let value: any = undefined

  if (/^[\t\r\n\f ]*=/) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
  }

  // v- 指令
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    // 匹配指令名，如 if
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      )!
    let dirName = match[1]
    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        loc: {}
      },
      art: undefined,
      modifiers: undefined,
      loc: {}
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
      loc: {}
    },
    loc: {}
  }
}

function parseAttributeValue(context: ParserContext) {
  let content = ''

  const quote = context.source[0]
  advanceBy(context, 1)
  const endIndex = context.source.indexOf(quote)
  if (endIndex === -1) {
    content = parseTextData(context, context.source.length)
  } else {
    content = parseTextData(context, endIndex)
    advanceBy(context, 1)
  }

  return {
    content,
    isQuoted: true,
    loc: {}
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
