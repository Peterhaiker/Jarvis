import MarkdownIt from "markdown-it"
import mila from "markdown-it-link-attributes"
import katex from "markdown-it-katex"
import * as markdownItTable from "markdown-it-multimd-table";
import "highlight.js/styles/atom-one-light.css"
import "katex/dist/katex.min.css"

const markdownItTablePlugin = markdownItTable.default || markdownItTable;

// Markdown 实例
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
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

// 导出函数
export function renderMarkdown(text) {
  return md.render(text || "")
}
