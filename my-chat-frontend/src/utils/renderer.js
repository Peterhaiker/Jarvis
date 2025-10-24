import MarkdownIt from "markdown-it"
import hljs from "highlight.js"
import "highlight.js/styles/atom-one-light.css" // 代码高亮主题

//最终的结果是将代码块包裹在<pre class="hljs"><code class="hljs language-xxx"></code></pre>中

// 创建 MarkdownIt 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true, // 支持 \n 自动换行
  highlight(str, lang) {
    let highlighted
    // 没有语言时默认使用 plaintext
    const language = lang && hljs.getLanguage(lang) ? lang : "plaintext"

    try {
      highlighted = hljs.highlight(str, { language }).value
    } catch (_) {
      highlighted = md.utils.escapeHtml(str)
    }

    //返回纯高亮 HTML，不包 <pre><code>
    return highlighted
  },
})

// 重写 fence 渲染规则，保证结构 & 类名正确
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  let lang = token.info.trim()
  const code = token.content

  //没有语言时，强制使用 plaintext
  if (!lang) lang = "plaintext"

  const highlighted = options.highlight
    ? options.highlight(code, lang)
    : md.utils.escapeHtml(code)

  const langClass = `language-${lang}`

  //pre 和 code 都加 .hljs
  return `<pre class="hljs"><code class="hljs ${langClass}">${highlighted}</code></pre>`
}

//启用 GFM 扩展
md.enable(["table", "strikethrough", "link", "list"])

//导出渲染函数
export function renderMarkdown(text) {
  return md.render(text || "")
}
