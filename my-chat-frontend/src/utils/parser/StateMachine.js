// parserStateMachine.js
//检测内容属于哪种类别（代码块、数学、普通文本等等）
import { StateType } from "./stateTypes.js";
import { StateManager } from "./StateManager.js";
import { parseRules } from "./rules.js";

//创建状态机
export function createStateMachine(){
    const stateManager=new StateManager();

    //检测文本trunk属于哪个状态类型
    function detectContentState(trunk){
        if(trunk.includes('```')){
            return StateType.CODE_BLOCK
        }
    }

    //操作状态栈
    function transitionState(trunk) {
        const { action, type } = detectContentState(trunk);
        if (action === "ENTER") stateManager.pushState(type);
        else if (action === "EXIT") stateManager.popState();
        return stateManager.getState();
    }
    return { transitionState, detectContentState, stateManager };
}
