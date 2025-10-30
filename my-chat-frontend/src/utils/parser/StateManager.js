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
    /**
     * 拆分缓冲区内容并分配给对应的状态缓冲区
     * @param {string} fullText - 当前拼接的缓冲文本 (prevTail + trunk)
     * @param {object} transition - 检测出的状态变化信息 { action, type }
     */
    processTransition(fullText, transition){
        if (transition.action === 'enter' && transition.type === StateType.CODE_BLOCK) {
            const match = fullText.match(/([\s\S]*?)(?:^|\r?\n)\s*```([a-zA-Z0-9_-]*)\s*\r?\n([\s\S]*)$/)
            if (match) {
                const [, before, lang, after] = match
                this.textBuffer += before
                this.currentLang = lang || 'plaintext'
                this.codeBuffer = after
            }
        } else if (transition.action === 'exit' && transition.type === StateType.CODE_BLOCK) {
            const match = fullText.match(/([\s\S]*?)(?:^|\r?\n)\s*```\s*$/)
            if (match) {
                const [, before] = match
                this.codeBuffer += before
            }
        }   
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
