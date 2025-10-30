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
        //检测代码块
        if(parseRules[0].enter.test(stateManager.prevTail+trunk)){
            if(stateManager.getState()===StateType.CODE_BLOCK){
                //说明已经在代码块，需要返回退出代码块状态
                return { action: "EXIT", type: StateType.CODE_BLOCK }
            }
            //否则，代表刚进入代码块，需要返回进入代码块状态
            return { action: "ENTER", type: StateType.CODE_BLOCK }
        }
        //检测图表
        if(parseRules[5].enter.test(trunk)){
            return { action: "ENTER", type: StateType.CHART }
        }
        //检测数学公式
        if(parseRules[4].enter.test(trunk)){
            return { action: "ENTER", type: StateType.FORMULA }
        }
        //检测表格
        if(parseRules[1].enter.test(trunk)){
            return { action: "ENTER", type: StateType.TABLE }
        }
        //检测引用
        if(parseRules[2].enter.test(trunk)){
            return { action: "ENTER", type: StateType.QUOTE }
        }
        //检测列表
        if(parseRules[3].enter.test(trunk)){
            return { action: "ENTER", type: StateType.LIST }
        }
        
        //都没有检测出来，可能是trunk截断，先缓存再整体判断一次，提高容错
        stateManager.prevTail+=trunk;
        return { action: "NONE", type: StateType.TEXT }
    }

    //操作状态栈
    function transitionState(trunk) {
        const { action, type } = detectContentState(trunk);
        if (action === "enter") stateManager.pushState(type);
        else if (action === "exit") stateManager.popState();
        return stateManager.getState();
    }
    return { transitionState, detectContentState, stateManager };
}
