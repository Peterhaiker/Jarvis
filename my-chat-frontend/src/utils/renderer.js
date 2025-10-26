import MarkdownIt from "markdown-it"
import mila from "markdown-it-link-attributes"
import katex from "markdown-it-katex"
import * as markdownItTable from "markdown-it-multimd-table";
import hljs from "highlight.js"
import "highlight.js/styles/atom-one-light.css"
import "katex/dist/katex.min.css"
// 测试新的代码渲染函数
import { highlightCode } from "@/utils/CodeHighlightUtil.js"

const markdownItTablePlugin = markdownItTable.default || markdownItTable;
// 独立 highlight 函数，避免循环引用
function safeHighlight(str, lang) {
  const language = lang && hljs.getLanguage(lang) ? lang : "plaintext"
  try {
    return hljs.highlight(str, { language }).value
  } catch (_) {
    // return hljs.escapeHTML(str)
    return md.utils.escapeHtml(str)
  }
}

// Markdown 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: highlightCode,
  // highlight: safeHighlight,
})
  .use(mila, {
    attrs: {
      target: "_blank",
      rel: "noopener",
    },
  })
  .use(markdownItTablePlugin, { multiline: true, rowspan: true, headerless: true })
  .use(katex)

  // 启用扩展规则（必须）
md.enable(["table", "strikethrough", "link", "list"])

// 自定义代码块结构
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  let lang = token.info.trim() || "plaintext"
  const code = token.content

  const highlighted = options.highlight
    ? options.highlight(code, lang)
    : hljs.escapeHTML(code)

  const langClass = `language-${lang}`
  return `<pre class="hljs"><code class="hljs ${langClass}">${highlighted}</code></pre>`
}

// 导出函数
export function renderMarkdown(text) {
  return md.render(text || "")
}
