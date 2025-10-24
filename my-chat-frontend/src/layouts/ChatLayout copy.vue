<template>
	<!-- 顶层布局：左侧会话列表，右侧聊天主区域 -->
  <div
    style="height: 100%; box-shadow: var(--el-border-color-light) 0px 0px 10px"
  >
    <el-splitter>
      <el-splitter-panel :min="40" size="20%">
        <div class="demo-panel">信息列表</div>
      </el-splitter-panel>
      <el-splitter-panel :min="200">
        <div class="right-panel">
          <!-- 标题 -->
            <div class="title">jarvis</div>
            <!-- 信息展示区 -->
            <div class="info-area">
				<!-- 欢迎消息 -->
				<WelcomeMessage />
                <template v-for="msg in msgList" :key="msg.id">
                    <!-- 用户消息 -->
                    <!-- <div v-if="msg.role === 'user'" :class="{'user-info':msg.role === 'user'}">
                        <el-avatar class="user-logo" :size="50" style="background-color: transparent">
                          <SvgIcon name="userLogo" style="width: 45px;height: 45px;"/>
                        </el-avatar>
                        <div class=" user-content">{{msg.content}}</div>
                    </div> -->
					<UserMessage v-if="msg.role==='user'" :content="msg.content" />
                    <!-- AI回复消息 -->
                    <!-- <div v-else :class="{'ai-info':msg.role === 'ai'}">
                        <el-avatar class="ai-logo" :size="50" style="background-color: transparent">
                          <SvgIcon name="logo" style="width: 45px;height: 45px;"/>
                        </el-avatar>
                        <div class=" ai-content" ref="aiContents" v-html="msg.html"></div>
                    </div> -->
					<AIMessage v-else v-html="msg.html" ref="aiContents" />
                </template>
            </div>
            <!-- 输入区 -->
            <div class="input-area">
                <div class="input-container">
                    <textarea name="chat-input" cols="30" rows="10" placeholder="给Jarvis发送消息" @keydown.enter.prevent="sendMsg"></textarea>
                    <div class="input-button"></div>
                </div>
            </div>
            <div class="warning-info">内容由AI生成，仅供参考</div>
        </div>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup>
    import { reactive,nextTick, ref } from 'vue';
    import { renderMarkdown } from '@/utils/renderer';
    import hljs from "highlight.js"
	import WelcomeMessage from '@/components/chat/WelcomeMessage.vue'
	import AIMessage from '@/components/chat/AIMessage.vue'
	import UserMessage from '@/components/chat/UserMessage.vue'

	//定义消息列表，用于存储用户消息和AI回复消息
    const msgList = reactive([]);
	//存储AI内容dom容器
	const aiContents=ref([]);
	//添加消息时生成ID
	function addMessage(role,content,html=''){
		const msg={
			id:Date.now()+Math.random(),//生成ID
			role,
			content,
			html
		}
		msgList.push(msg);
		return msg;
	}
	// 发送消息
    async function sendMsg(event) {
		//获取用户输入内容
		if (!event.target.value.trim()) {
			return;
		}
		const userInfo = event.target.value;
		//存储用户信息
		// msgList.push({ role: 'user', content: userInfo });
		addMessage('user',userInfo);
		//重置输入框
		event.target.value = '';
		// 消息发送后自动滚动到底部
		nextTick(() => {
		const infoArea = document.querySelector('.info-area');
		if (infoArea) {
			infoArea.scrollTop = infoArea.scrollHeight;
		}
		});
		// 添加AI回复的空消息，准备动态更新
		// const aiMsg = reactive({ role: 'ai', content: '' , html: '' });
		const aiMsg=addMessage('ai','','');
		await nextTick();
		// 通过Fetch API发送请求，处理流式响应
		try {
			const response = await fetch(`http://localhost:3000/api/chat-stream?message=${encodeURIComponent(userInfo)}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});

			if (!response.body) {
				throw new Error('ReadableStream not supported');
			}
			const reader = response.body.getReader();
			const decoder = new TextDecoder('utf-8');
			let buffer = '';
			let isCodeBlock = false;
			let bufferedText = '';
			let CodeLanguage = '';
			let rawDisplayEl = null;
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
						console.log("✅ Stream done");
						if (bufferedText.length > 0) {
							// 处理剩余的缓冲文本
							const fullText = bufferedText;
							bufferedText = '';
							// 先清理掉原始显示区
							if (rawDisplayEl) {
								rawDisplayEl.remove();
								rawDisplayEl = null;
							}
							// 渲染 Markdown
							const rendered = renderMarkdown(fullText);
							// 更新AI内容
							aiContents.value.at(-1).insertAdjacentHTML('beforeend',rendered);
							// 高亮新出现的代码块（仅高亮尚未标记的）
							aiContents.value.at(-1).querySelectorAll("pre code").forEach((el) => {
								if (!el.dataset.highlighted) {
									el.removeAttribute('data-highlighted'); // 保险起见
									hljs.highlightElement(el);
									el.dataset.highlighted = "true";
								}
							});
						}
						return;
					}
					//检测是否是```开始并判断是否是代码块开始或结束。区分行内代码和代码块
					if (data.startsWith("```")) {//deepseek格式
						isCodeBlock = !isCodeBlock;
						// 代码块开始
						if(isCodeBlock){
							console.log("代码块开始");
							if(data.endsWith('\\n')){//行内代码
								CodeLanguage='plaintext';//默认语言
							}else{
								CodeLanguage='prepare';//准备读取代码语言
							}
							aiContents.value.at(-1).insertAdjacentHTML('beforeend','<pre><code class="hljs"></code></pre>');
							aiMsg.content += data.replace(/\\n/g, "\n");							
							continue;
						}
						//在代码块结束时,不进行任何操作
						if(!isCodeBlock){
							console.log("代码块结束");
							aiMsg.content += data.replace(/\\n/g, "\n");				
							continue;
						}
					}
					//读取完代码标识符后的下一个trunk就是代码语言
					if(isCodeBlock && CodeLanguage === 'prepare'){
						console.log("读取到代码语言:", CodeLanguage);
						CodeLanguage = data.replace(/\\n/g, "\n").trim();
						// 更新最后一个pre code代码块的class属性以支持高亮
						if(!CodeLanguage && CodeLanguage.length===0){
							CodeLanguage = 'plaintext'; // 默认语言
						}
						aiMsg.content += data.replace(/\\n/g, "\n");
						// 获取最后一个 AI 回复容器
						// 找到刚刚插入的代码块（最新的）
						const codeEl = aiContents.value.at(-1).querySelector("pre:last-child code:last-child");
						if (codeEl) {
							// 添加语言 class，例如 hljs javascript
							codeEl.classList.add(CodeLanguage);
						}
						continue;
					}
					//开始读取代码块
					if(isCodeBlock && CodeLanguage !== 'prepare'){
						//将\\n变成\n，同时转义<和>
						const SafeChunk=data.replace(/\\n/g, "\n").replace(/</g, "&lt;").replace(/>/g, "&gt;");
						aiMsg.content += data.replace(/\\n/g, "\n");
						//在最后一个<pre><code>...</code></pre>中间添加代码内容
						const codeEl=aiContents.value.at(-1)?.querySelector("pre:last-child code:last-child");
						console.log("codeEl=",codeEl);
						if(codeEl){
							codeEl.innerHTML += SafeChunk;	
							  // 节流高亮，防止每次都卡顿
							if (!codeEl._highlighting) {
								codeEl._highlighting = true;
								setTimeout(() => {
								codeEl.removeAttribute("data-highlighted");
								hljs.highlightElement(codeEl);
								codeEl._highlighting = false;
								}, 50);
							}
						}
						continue;
					}
					// 这里是 AI 新生成的文字(非代码块)
					if (!isCodeBlock) {
						rawDisplayEl = document.querySelector('.raw-streaming');
						const newText = data.replace(/\\n/g, "\n");
						aiMsg.content += newText;
						// 如果不是以空格或换行结尾，说明当前语句可能不完整（例如 markdown 语法还没结束）
						if (!newText.endsWith('\n') && !newText.endsWith('\n\n')) {
							bufferedText += newText;
							// 原样显示（未修饰）
							if (!rawDisplayEl) {
								rawDisplayEl = document.createElement('span');
								rawDisplayEl.className = 'raw-streaming';
								rawDisplayEl.textContent = bufferedText;
								aiContents.value.at(-1).appendChild(rawDisplayEl);
							} else {
								rawDisplayEl.textContent += newText;
							}
							// 不进行 markdown 渲染
							continue;
						}
						// ✅ 到这里说明语句完整，可以进行 Markdown 解析
						const fullText = bufferedText + newText;
						bufferedText = '';
						// 先清理掉原始显示区
						if (rawDisplayEl) {
							rawDisplayEl.remove();
							rawDisplayEl = null;
						}
						// 渲染 Markdown
						const rendered = renderMarkdown(fullText);
						// 更新 aiMsg.html（以便 Vue 响应式触发）
						aiContents.value.at(-1).insertAdjacentHTML('beforeend',rendered);
					}
					// 每次更新后滚动到底部
					await new Promise(resolve => setTimeout(resolve, 0)); // 确保 DOM 更新完成
					const infoArea = document.querySelector(".info-area");
					if (infoArea) infoArea.scrollTop = infoArea.scrollHeight;
				}
				}
			}  
			// 最终渲染 Markdown    
		} catch (err) {
		console.error('发生错误' + err);
		aiMsg.content = '请求失败' + err;
		}
	}
</script>

<style scoped>
.demo-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
.right-panel{
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
}
.title{
    position: absolute;
    top: 0;
    left: 0;
    height: 50px;
    width: 100%;
    line-height: 50px;
    text-align: center;
    font-size: 24px;
    background-color: #fff;
    z-index: 10;
}
.info-area{
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 2px 10px;
    margin-top: 50px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #aaa #f5f5f5;
    scroll-behavior: smooth;
    /* margin: 50px auto 0 auto; */
}
/* Chrome / Edge / Safari */
.info-area::-webkit-scrollbar {
    width: 6px; /* 滚动条整体宽度 */
}

.info-area::-webkit-scrollbar-track {
    background: #f5f5f5; /* 滚动槽颜色 */
    border-radius: 8px;
}

.info-area::-webkit-scrollbar-thumb {
    background-color: #b0b0b0; /* 滚动条颜色 */
    border-radius: 8px;
    border: 1px solid #f5f5f5; /* 让thumb与track分离感更强 */
}

.info-area::-webkit-scrollbar-thumb:hover {
    background-color: #999; /* 鼠标悬停时变深 */
}
.user-info{
    display: flex;
    flex-direction: row-reverse;
    align-self: flex-end;
    flex-wrap: wrap;
    width: fit-content;
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
    text-align: right;
}
.user-info .user-content{
    margin: 10px;
    width: fit-content;
    align-self: flex-end;
    padding: 10px;
    border-radius: 10px;
	background-color: #edf3fe;
    white-space: normal; /* 允许文本换行 */
    word-wrap: break-word; /* 长单词或URL换行 */
    word-break: break-word; /* 兼容性换行 */
    overflow-wrap: break-word; /* 标准换行 */
}
.ai-info{
    display: flex;
    align-self: flex-start;
    flex-wrap: wrap;
    width: fit-content;
    /* width: 100%; */
    padding: 10px;
    border-radius: 5px;
    margin-bottom: 10px;
}
.ai-info .ai-content{
    margin: 10px;
    height: fit-content;
    align-self: flex-end;
    /* width: 100%; */
    padding: 5px;
    background-color: #ffffff;
    border-radius: 10px;
    white-space: normal; /* 允许文本换行 */
    word-wrap: break-word; /* 长单词或URL换行 */
    word-break: break-word; /* 兼容性换行 */
    overflow-wrap: break-word; /* 标准换行 */
}
.input-area {
    display: flex;
    align-items: center;
    height: 120px;
    justify-content: center;
}
.input-area .input-container{
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 120px;
    border-radius: 15px;
    /* border: 1px solid rgb(184, 183, 183); */
    box-shadow: 0 1px 2px 2px rgba(10, 10, 10, 0.1);
}
.input-area textarea{
    margin: 10px;
    height: 80px;
}
.input-area textarea {
    /* 去除边框和轮廓 */
    border: none;
    outline: none;
    /* 禁止调整大小 */
    resize: none;
    /* 重置内边距和外边距 */
    padding: 0;
    /* margin: 0; */
    /* 背景和文字颜色 */
    /* background: rgb(234, 235, 234); */
    color: inherit;
    /* 字体继承 */
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    /* 去除滚动条（如果需要） */
    overflow: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
}

/* 隐藏Webkit浏览器的滚动条 */
.input-area textarea::-webkit-scrollbar {
    display: none;
}
.input-area textarea::placeholder {
    color: #a0aec0;
    font-size: 14px;
}
.warning-info{
    font-size: 12px;
    color: #999;
    text-align: center;
}
</style>
