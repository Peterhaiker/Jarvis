// Pinia状态管理：聊天会话状态
import {defineStore} from 'pinia'
import {ref,reactive} from 'vue'
import {fetchChatStream} from '@/services/chatService'

export const useChatStore=defineStore('useChatStore',()=>{
    //定义消息列表，用于存储用户消息和AI回复消息
    const msgList = reactive([]);
    const isLoading=ref(false);
    //添加AI问候语
    msgList.push({
        id:Date.now()+Math.random(),//生成ID
        role: 'ai', content: '你好，我是AI助手，有什么我可以帮助你的吗？' ,html:'<p>你好，我是AI助手，有什么我可以帮助你的吗？</p>'
    });

    async function sendMessage(userInput) {
        if(!userInput.trim())
            return;
        //添加用户消息
        msgList.push({ id:Date.now()+Math.random(), role: 'user', content: userInput ,html:'<p>'+userInput+'</p>'});
        try{
            isLoading.value=true;
            //多轮对话，添加最后的5轮对话
            const lastMessages = msgList.slice(-5);
            const lastMessagesStr = lastMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
            await fetchChatStream(lastMessagesStr);
        }catch(error){
            console.error('发送消息失败:',error);
            aiMsg.content='发送消息失败，请稍后重试';
        }finally{
            isLoading.value=false;
        }
    }
    return {msgList,isLoading,sendMessage};
});