import hljs from "highlight.js";

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
