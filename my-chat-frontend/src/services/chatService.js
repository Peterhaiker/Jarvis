// 与Node.js后端通信的API
import {renderMarkdown} from '@/utils/renderer'
import { useChatStore } from '@/store/chatStore'
import { reactive } from 'vue';

//提供访问后端聊天API的函数
//userInput为用户输入，onProgress为回调函数，用于回传 加工过的AI回复的流式数据
export async function fetchChatStream(userInput){
    const response = await fetch(`http://localhost:3000/api/chat-stream?message=${encodeURIComponent(userInput)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!response.body) {
	    throw new Error('ReadableStream not supported');
	}
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';//缓冲区，临时缓冲文字，防止格式不全导致解析异常
    const chatStore=useChatStore();//用于上传AI回复内容
    let aiMsg=reactive({
        id:Date.now()+Math.random(),//生成ID
        role:'ai',
        content:'',
        html:''
    })//AI回复消息空对象
    chatStore.msgList.push(aiMsg);//将AI回复消息对象添加到消息列表中
    // 读取流数据
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // 按 SSE 的 "\n\n" 分割事件
        const parts = buffer.split("\n\n");//一次可能到达多个块
        buffer = parts.pop(); // 可能是未完成的一部分，留给下次循环
        for (const part of parts) {
        if (part.startsWith("data: ")) {
            const data = part.slice(6);
            //流式结束标志
            if (data === "[DONE]") {
                // console.log("✅ Stream done");
                aiMsg.content+="[DONE]\n"
                aiMsg.html=renderMarkdown(aiMsg.content);
            }
            else{
                aiMsg.content += data.replace(/\\n/g, "\n");
                // console.log("data=",data);
            }
        }
        }
    }
}