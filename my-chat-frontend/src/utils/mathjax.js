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
//用来检测缓冲区中的数学标识符是否完整，若不完整则不解析，继续进行接收
export function hasUnclosedMath(fullText) {
  // 统计各种公式标识符的出现次数
  const inlineDollarCount = (fullText.match(/\$/g) || []).length;
  const blockDollarCount = (fullText.match(/\$\$/g) || []).length;
  const leftBracketCount = (fullText.match(/\\\[/g) || []).length;
  const rightBracketCount = (fullText.match(/\\\]/g) || []).length;
  const leftParenCount = (fullText.match(/\\\(/g) || []).length;
  const rightParenCount = (fullText.match(/\\\)/g) || []).length;

  // 检查是否有未闭合
  if (inlineDollarCount % 2 !== 0) return true;
  if (blockDollarCount % 2 !== 0) return true;
  if (leftBracketCount > rightBracketCount) return true;
  if (leftParenCount > rightParenCount) return true;

  return false;
}
