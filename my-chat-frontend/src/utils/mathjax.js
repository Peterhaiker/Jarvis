export async function renderMathJax(el) {
  if (!window.MathJax) return;
  try {
    await window.MathJax.typesetClear && window.MathJax.typesetClear([el]);
    await window.MathJax.typesetPromise([el]);
  } catch (err) {
    console.error('MathJax render error:', err);
  }
}
// 转义字符串中的反斜杠,将单斜杠增加为双斜杠，因为MathJax需要双斜杠来识别
export function escapeBackslash(str) {
  // 把单斜杠变成双斜杠，但避免重复转义
  return str.replace(/(?<!\\)\\/g, '\\\\')
            .replace(/\\\[\s*\n\s*/g, '\\[')  // \[ 后的换行移除
            .replace(/\s*\n\s*\\\]/g, '\\]'); // \] 前的换行移除;
}