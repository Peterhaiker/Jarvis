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
  const inlineDollarCount = (fullText.match(/\$/g) || []).length;
  const blockDollarCount = (fullText.match(/\$\$/g) || []).length;
  const leftBracketCount = (fullText.match(/\\\[/g) || []).length;
  const rightBracketCount = (fullText.match(/\\\]/g) || []).length;
  const leftParenCount = (fullText.match(/\\\(/g) || []).length;
  const rightParenCount = (fullText.match(/\\\)/g) || []).length;

  // 成对匹配检查
  if (inlineDollarCount % 2 !== 0) return true;
  if (blockDollarCount % 2 !== 0) return true;
  if (leftBracketCount > rightBracketCount) return true;
  if (leftParenCount > rightParenCount) return true;

  // 新增时序检查：
  // 如果文本以 "$$" 结尾，但后面还没有空格、换行或内容，
  // 那么暂时视为未闭合（等待下一块）
  if (/\$\s*$/.test(fullText) || /\$\$\s*$/.test(fullText)) {
    return true;
  }
  return false;
}

