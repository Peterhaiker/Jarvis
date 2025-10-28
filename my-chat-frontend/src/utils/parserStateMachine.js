// parserStateMachine.js
//检测内容属于哪种类别（代码块、数学、普通文本等等）
export function detectContentState(trunk, prevState) {
    //检测顺序：代码块->mermaid图表->数学公式块（这三个内部不再嵌套解析）
    //表格->引用块->有序/无序列表->普通文本(这些块内再嵌套解析)
    
}
//更新状态机
export function updateParseState(trunk) {

}
//状态转换
export function transitionState(trunk, prevState) {

 }
