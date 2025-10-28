import hljs from "highlight.js"
import "highlight.js/styles/atom-one-light.css"

/**
 * 创建代码容器（含复制按钮，语言标签）
 * @param {string} code - 代码内容
 * @param {string} lang - 语言（可选）
 * @returns {string} 渲染后的 HTML 片段
 */
export function CreateCodeContainer(code, lang = "plaintext") {
  // 判断语言是否存在
  const validLang = lang && hljs.getLanguage(lang) ? lang : "plaintext"
    let highlighted = ""
    if(!code || code.trim() === ""){
        highlighted="";
    }else{
        try {
            highlighted =
            validLang === "plaintext"
                ? hljs.highlightAuto(code).value
                : hljs.highlight(code, { language: validLang }).value
        } catch (err) {
            console.error("代码高亮出错:", err)
            highlighted = escapeHtml(code)
        }
    }
  // 行号处理，添加行号
  // const lines = highlighted.split(/\r?\n/)
  // const numbered = lines
  //   .map(
  //     (line, i) =>
  //       `<span class="line"><span class="line-number">${i + 1}</span><span class="code-line">${line}</span></span>`
  //   )
  //   .join("\n")
  // 生成语言标签
  const langLabel = validLang === "plaintext" ? "Text" : validLang
  // 生成最终 HTML
  return `
  <div class="code-block-container">
    <div class="code-header">
      <span class="code-lang">${langLabel}</span>
      <button class="copy-btn" onclick="copyCode(this)">Copy</button>
    </div>
    <pre class="hljs"><code class="hljs language-${validLang}">${highlighted}</code></pre>
  </div>`
}

/**
 * 简单 HTML 转义
 */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]))
}

/**
 * 前端复制函数（需挂载到全局）
 */
if (typeof window !== "undefined") {
  window.copyCode = async function (btn) {
    const code = btn.closest(".code-block-container").querySelector("pre code").innerText
    try {
      await navigator.clipboard.writeText(code)
      btn.textContent = "Copied!"
      btn.classList.add("copied")
      setTimeout(() => {
        btn.textContent = "Copy"
        btn.classList.remove("copied")
      }, 1200)
    } catch (err) {
      console.error("复制失败:", err)
    }
  }
}

/**
 * 向 <code> 元素追加新内容并高亮新增部分（稳健实现，支持纯换行）。
 * @param {HTMLElement} codeEl
 * @param {string} trunk
 * @param {number} throttleMs
 */
export function appendAndHighlightChunk(codeEl, trunk, throttleMs = 120) {
  if (!codeEl || trunk == null) return;

  if (typeof codeEl._buffer === "undefined") codeEl._buffer = "";
  if (typeof codeEl._lastLength === "undefined") codeEl._lastLength = 0;
  if (typeof codeEl._highlighted === "undefined") codeEl._highlighted = false;
  if (typeof codeEl._highlighting === "undefined") codeEl._highlighting = false;

  const langMatch = (codeEl.className || "").match(/language-([^\s]+)/);
  const lang = langMatch ? langMatch[1] : "plaintext";
  const safeLang = hljs.getLanguage(lang) ? lang : "plaintext";

  // 1️⃣ 缓存完整内容
  codeEl._buffer += trunk;

  // 2️⃣ 如果还没高亮过，节流高亮整个内容
  if (!codeEl._highlighted) {
    codeEl.textContent = codeEl._buffer;
    if (!codeEl._highlighting) {
      codeEl._highlighting = true;
      setTimeout(() => {
        try {
          const html = (() => {
            try {
              return hljs.highlight(codeEl._buffer, { language: safeLang }).value;
            } catch {
              return hljs.highlightAuto(codeEl._buffer).value;
            }
          })();
          codeEl.innerHTML = html;
          codeEl._highlighted = true;
          codeEl._lastLength = codeEl._buffer.length;
        } finally {
          codeEl._highlighting = false;
        }
      }, throttleMs);
    }
    return;
  }

  // 3️⃣ 处理新增部分
  const newPart = codeEl._buffer.slice(codeEl._lastLength);
  if (!newPart) return;

  // 🔹 如果是仅有换行符或空格，也要保留显示
  if (!newPart.trim()) {
    const textNode = document.createTextNode(newPart);
    codeEl.appendChild(textNode);
    codeEl._lastLength = codeEl._buffer.length;
    return;
  }

  // 4️⃣ 局部高亮新增部分
  let highlightedNewHtml = "";
  try {
    highlightedNewHtml = hljs.highlight(newPart, { language: safeLang }).value;
  } catch {
    highlightedNewHtml = hljs.highlightAuto(newPart).value;
  }

  codeEl.insertAdjacentHTML("beforeend", highlightedNewHtml);
  codeEl._lastLength = codeEl._buffer.length;
}