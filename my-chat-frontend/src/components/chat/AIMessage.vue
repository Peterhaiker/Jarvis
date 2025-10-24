<template>
  <div class="ai-info">
    <el-avatar class="ai-logo" :size="50" style="background-color: transparent">
      <SvgIcon name="logo" style="width: 45px;height: 45px;"/>
    </el-avatar>
    <div class="ai-content" ref="container"></div>
  </div>
</template>

<script setup>
import {ref,onMounted,watch, nextTick} from 'vue'
import {renderMarkdown} from '@/utils/renderer'
import hljs from "highlight.js"
import {appendAndHighlightChunk} from '@/utils/appendHighlight'
import {renderMathJax,escapeBackslash} from '@/utils/mathjax'

let content=defineProps({
    //选项名需要和父组件的Props保持一致
    content: {
        type: String,
        default: ''
    }
})
const emit=defineEmits(['mounted'])
const container=ref(null)
//挂载的时候将内容dom的引用发送给父组件
onMounted(()=>{
    emit('mounted',container.value)
    //显示欢迎消息
    if(content.content==='你好，我是AI助手，有什么我可以帮助你的吗？'){
        container.value.innerHTML=content.content
    }
})
// 相关变量
let isCodeBlock = false;
let CodeStartBuffer='';//缓存代码块起始部分，直到遇到\n结束
let bufferedText = '';
let rawDisplayEl = null;

//监视pinia中AI回复的内容，一旦发生变化就渲染到组件中
watch(()=>content.content,async (newVal,oldVal)=>{
    if(newVal){
        //仅获取新增的值，避免重复渲染。后面的正则为了渲染数学公式时，去掉$首尾的空行
        const trunk=newVal.slice(oldVal.length);
        // console.log("trunk AIMessage.vue=",trunk);
        //如果是流式结束标志，直接渲染
        if(trunk.endsWith("[DONE]\n")){
            console.log("✅ 监视：Stream done");
            if (bufferedText.length > 0) {
                // 处理剩余的缓冲文本
                const fullText = bufferedText;
                bufferedText = '';
                // 先清理掉原始显示区
                if (rawDisplayEl) {
                    rawDisplayEl.remove();
                    rawDisplayEl = null;
                }
                // 渲染 Markdown，然后转移反斜杠为了解析数学公式
                const rendered = renderMarkdown(escapeBackslash(fullText));
                // 更新AI内容
                container.value.insertAdjacentHTML('beforeend',rendered);
                // 高亮新出现的代码块（仅高亮尚未标记的）
            }
            //渲染数学公式（若有）
            // 等待 DOM 完整更新
            // nextTick(() => {
            await nextTick();
            renderMathJax(container.value)
            // });
            return
        }
        //渲染新增的内容
        if(trunk.trim().includes("```") || CodeStartBuffer.length>0){
            if(CodeStartBuffer.length===0){
                //代表首次进入代码块
                isCodeBlock = !isCodeBlock;
            }                
            // console.log('进入代码块状态:', isCodeBlock,'CodeStartBuffer=',CodeStartBuffer);
            // 代码块开始
            if(isCodeBlock){
                // console.log("trunk ASCII码=",Array.from(trunk).map(ch => ch.charCodeAt(0)));
                if(trunk.includes("\n")){
                    //说明代码块起始部分结束，可以开始识别并构造代码块了
                    //先拼上最后一段
                    CodeStartBuffer+=trunk;                    
                    // ---------- 匹配并提取 ----------
                    // 捕获 ``` 、可选语言名、可选换行符
                    const match = CodeStartBuffer.match(/^[\r\n\s]*```([\w-]*)\r?\n?/);
                    let after = "";
                    let CodeLanguage = "plaintext"; // 默认无语言
                    let safeLang = '';//加工过的语言类型
                    if (match) {
                        CodeLanguage = match[1] || "plaintext";
                        // 动态安全降级
                        safeLang = hljs.getLanguage(CodeLanguage) ? CodeLanguage : 'nohighlight';
                        // 提取换行符后的剩余部分（可能是首行代码）
                        after = CodeStartBuffer.slice(match[0].length);
                    }
                    //1.```\n 代码块无语言版本
                    if (match && match[1] === "" && after.trim() === ""){
                        container.value.insertAdjacentHTML('beforeend',`<pre class="hljs"><code class="hljs ${'language-'+safeLang}"></code></pre>`);
                    }
                    //2.```\nCodeContent 代码块无语言版本，且还跟了一部分内容
                    else if (match && match[1] === "" && after.trim() !== ""){
                        container.value.insertAdjacentHTML('beforeend',`<pre class="hljs"><code class="hljs ${'language-'+safeLang}"></code></pre>`);
                    }
                    //3.```python\n 代码块有语言版本
                    else if (match && match[1] !== "" && after.trim() === ""){
                        container.value.insertAdjacentHTML('beforeend',`<pre class="hljs"><code class="hljs ${'language-'+safeLang}"></code></pre>`);
                    }
                    //4.```python\nCodeContent 代码块有语言版本，且还跟了一部分内容
                    else if (match && match[1] !== "" && after.trim() !== ""){
                        container.value.insertAdjacentHTML('beforeend',`<pre class="hljs"><code class="hljs ${'language-'+safeLang}"></code></pre>`);
                    }
                    // ---------- 高亮（节流防卡顿） ----------
                    const codeEl = container.value.querySelector("pre:last-child code");
                    if(codeEl && after.trim().length > 0){
                        appendAndHighlightChunk(codeEl,after);
                    }
                    //重置缓冲区
                    CodeStartBuffer='';
                }else{
                    //缓存代码块起始部分，直到遇到\n结束
                    CodeStartBuffer+=trunk;                   
                }
                return
            }
            //在代码块结束时,不进行任何操作
            if(!isCodeBlock){
                bufferedText='';
                // console.log("代码块结束");	
                return;
            }
        }
        //开始读取代码块
        if(isCodeBlock && CodeStartBuffer.length === 0){
            const codeEl=container.value?.querySelector("pre:last-child code:last-child");
            if(codeEl){
                // 节流高亮，防止每次都卡顿
                appendAndHighlightChunk(codeEl,trunk);
            }
            return;
        }
        // 这里是 AI 新生成的文字(非代码块)
        if (!isCodeBlock) {
            rawDisplayEl = document.querySelector('.raw-streaming');
            const newText = trunk;
            // 如果不是以空格或换行结尾，说明当前语句可能不完整（例如 markdown 语法还没结束）
            if (!newText.endsWith('\n') && !newText.endsWith('\n\n')) {
                bufferedText += newText;
                // 原样显示（未修饰）
                if (!rawDisplayEl) {
                    rawDisplayEl = document.createElement('span');
                    rawDisplayEl.className = 'raw-streaming';
                    rawDisplayEl.textContent = bufferedText;
                    container.value.appendChild(rawDisplayEl);
                } else {
                    rawDisplayEl.textContent += newText;
                }
                // 不进行 markdown 渲染
                return;
            }
            // 到这里说明语句完整，可以进行 Markdown 解析
            let fullText = bufferedText + newText;
            if(fullText.trim().endsWith('[DONE]\n')){
                // 移除 [DONE] 标志
                fullText = fullText.trim().replace('[DONE]', '');
            }
            bufferedText = '';
            // 先清理掉原始显示区
            if (rawDisplayEl) {
                rawDisplayEl.remove();
                rawDisplayEl = null;
            }
            // 渲染 Markdown
            console.log('原始 Markdown 内容：',fullText);
            console.log('先渲染数学公式后的内容：',escapeBackslash(fullText));
            const rendered = renderMarkdown(escapeBackslash(fullText));
            console.log('渲染数学公式再Markdown后：',renderMarkdown(escapeBackslash(fullText)));
            // 更新 aiMsg.html（以便 Vue 响应式触发）
            container.value.insertAdjacentHTML('beforeend',rendered);
        }
    }
})
</script>

<style scoped>
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
</style>