export function normalizeMarkdownTables(text) {
  const lines = text.split('\n');
  const tableBlocks = [];
  let current = [];

  for (const line of lines) {
    if (/^\s*\|.*\|\s*$/.test(line)) {
      current.push(line);
    } else {
      if (current.length > 0) {
        tableBlocks.push(current.join('\n'));
        current = [];
      }
    }
  }

  // 对每个表格块进行对齐修复
  for (const tbl of tableBlocks) {
    const cleanTbl = tbl.replace(/\s*-\s*/g, '-').replace(/\s*\|\s*/g, '|');
    text = text.replace(tbl, cleanTbl);
  }

  return text;
}
//检测是否完整接收了表格
/**
 * 判断单行是否像表格的分隔线（divider），例如:
 * | --- | ---: | :---: |
 */
function isTableDividerLine(line) {
  if (!line) return false;
  return /^(\s*\|?\s*:?-{3,}:?\s*)(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
}

function isTableRowLine(line) {
  if (!line) return false;
  if (/^\s*```/.test(line)) return false;
  // 认为含有至少一个竖线且不是 divider 的行就是表格行
  return /\|/.test(line) && !isTableDividerLine(line);
}


/**
 * 判断文本中是否存在“未闭合”的表格。
 * 返回 true 表示“尚未完成”（需要继续缓存，不要渲染）
 */
export function hasUnclosedTable(text) {
  if (!text) return false;
  const lines = text.split(/\r?\n/);

  // 找到最后一个非空行索引
  let lastNonEmpty = lines.length - 1;
  while (lastNonEmpty >= 0 && lines[lastNonEmpty].trim() === '') lastNonEmpty--;
  if (lastNonEmpty < 0) return false;

  // 是否存在任何带 '|' 的行（表格痕迹）
  const lastPipeIdx = (() => {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (/\|/.test(lines[i])) return i;
    }
    return -1;
  })();

  // 找到最后一个 divider 的索引（若有）
  let lastDividerIdx = -1;
  for (let i = 0; i <= lastNonEmpty; i++) {
    if (isTableDividerLine(lines[i])) lastDividerIdx = i;
  }

  // 情形 A：根本没有任何包含 '|' 的行 -> 不是表格
  if (lastPipeIdx === -1 && lastDividerIdx === -1) return false;

  // 情形 B：存在管道符号但没有 divider 行（可能只有 header，divider 尚未到达）
  if (lastDividerIdx === -1 && lastPipeIdx !== -1) {
    // 如果最后可见的行就是一行含 '|' 的行（且没有后续非空行），认为表格仍在构建中
    return lastNonEmpty === lastPipeIdx;
  }

  // 情形 C：有 divider 存在
  // - 若 divider 在末尾（即 divider 后没有任何行），说明仍待接收表格数据
  if (lastNonEmpty <= lastDividerIdx) return true;

  // - 若 divider 存在且末尾行仍是表格行，说明还可能有更多表格行没到
  if (isTableRowLine(lines[lastNonEmpty])) return true;

  // 其余情况视为表格已经结束
  return false;
}

