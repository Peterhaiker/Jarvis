// stateManager.js
//状态管理类
import { StateType } from "./stateTypes";

export class StateManager {
  constructor() {
    this.stack = [StateType.TEXT];
    // 缓冲区：用于流式拼接
    this.buffer = ''
    this.textBuffer = ''
    this.codeBuffer = ''
    this.tableBuffer = ''
    this.quoteBuffer = ''
    this.formulaBuffer = ''
    this.chartBuffer = ''

    // 辅助上下文
    this.prevTail = ''      // 用于跨 trunk 拼接
    this.currentLang = null // 代码块语言标签
  }

  getState() {
    return this.stack[this.stack.length - 1];
  }

  pushState(newState) {
    this.stack.push(newState);
  }

  popState() {
    if (this.stack.length > 1) this.stack.pop();
  }

  resetState() {
    this.stack = [StateType.TEXT];
  }

  snapshot() {
    return [...this.stack];
  }
// 清理所有缓冲区
  resetBuffers() {
    this.buffer = ''
    this.textBuffer = ''
    this.codeBuffer = ''
    this.tableBuffer = ''
    this.quoteBuffer = ''
    this.formulaBuffer = ''
    this.chartBuffer = ''
  }
}
