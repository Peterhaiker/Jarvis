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
import {renderMathJax,escapeBackslash,hasUnclosedMath} from '@/utils/mathjax'
import {normalizeMarkdownTables,hasUnclosedTable} from '@/utils/renderTable'
import {CreateCodeContainer} from '@/utils/CodeHighlightUtil'


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
        container.value.innerHTML=content.content;
    }
})
// 相关变量
let isCodeBlock = false;
let CodeStartBuffer='';//缓存代码块起始部分，直到遇到\n结束
let CodeBuffer='';//代码正文缓存区域
let TextBuffer = '';//普通文本缓存区域
let rawDisplayEl = null;


//监视pinia中AI回复的内容，一旦发生变化就渲染到组件中
watch(()=>content.content,async (newVal,oldVal)=>{
    if(newVal){
        //仅获取新增的值，避免重复渲染。后面的正则为了渲染数学公式时，去掉$首尾的空行
        const trunk=newVal.slice(oldVal.length);
        console.log("trunk AIMessage.vue=",trunk/*,'ASCII码:',Array.from(trunk).map(ch => ch.charCodeAt(0))*/);
        //如果是流式结束标志，直接渲染
        if(trunk.endsWith("[DONE]\n")){
            console.log("✅ 监视：Stream done");
            if (TextBuffer.length > 0) {
                // 处理剩余的缓冲文本
                const fullText = TextBuffer;
                TextBuffer = '';
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
            await nextTick();
            renderMathJax(container.value);
            return;
        }
        //渲染新增的内容
        if(trunk.trim().includes("```") || CodeStartBuffer.length>0){
            if(trunk.trim().includes("```")){
                isCodeBlock = !isCodeBlock;
            }                
            // 代码块开始
            if(isCodeBlock){
                if(/```[\s\S]*?\r?\n/.test(trunk) || (CodeStartBuffer.length>0 && trunk.includes("\n"))){
                //同时包含```和\n，且\n在```之后，说明代码块起始部分结束，可以开始识别并构造代码块了
                    //先将缓存内容拆分到各自的缓冲区中：
                    // 1.```前的部分追加到TextBuffer
                    // 2.```后且在\n之前的部分追加到CodeStartBuffer
                    // 3.```后且在\n之后的部分追加到CodeBuffer
                    const combined = CodeStartBuffer + trunk
                    // 找到代码标识符位置
                    const fenceIndex = combined.indexOf("```")
                    // 找到回车符位置
                    const newlineIndex = combined.indexOf("\n", fenceIndex + 3)
                    // === 1. 提取  ```  前面的普通文本 ===
                    const beforeFence = combined.slice(0, fenceIndex)
                    TextBuffer += beforeFence
                    // === 2. 提取  ```  后到换行符前（语言标识部分） ===
                    const afterFence = combined.slice(fenceIndex + 3, combined[newlineIndex-1]==='\r'?newlineIndex-1:newlineIndex).trim()
                    CodeStartBuffer = afterFence // 可能是语言名，如 "js"、"python"
                    // === 3. 提取  换行符之后（正式代码内容） ===
                    const afterNewline = combined.slice(newlineIndex + 1)
                    CodeBuffer = afterNewline        
                    // ---------- 匹配并提取 ----------
                    // 捕获 ``` 、可选语言名、可选换行符
                    let CodeLanguage = CodeStartBuffer.length>0?CodeStartBuffer:"plaintext";// 默认无语言
                    let safeLang = '';//加工过的语言类型
                    // 动态安全降级
                    safeLang = hljs.getLanguage(CodeLanguage) ? CodeLanguage : 'nohighlight';
                    await nextTick();
                    container.value.insertAdjacentHTML('beforeend',CreateCodeContainer(CodeBuffer,safeLang));
                    //重置开头缓冲区，表示已经成功解析代码开头部分
                    CodeStartBuffer='';
                }else{
                    //缓存代码块起始部分，直到遇到\n结束后再整体解析
                    CodeStartBuffer+=trunk;                   
                }
                return
            }
            //代码块结束时
            if(!isCodeBlock){
                // 若标识符前面还有部分代码内容，也要提取出来，同时若缓存区有代码，也要一并输出
                if(trunk.split("```")[0] !== "" || CodeBuffer.length>0){
                    const codeEl=container.value?.querySelector(".code-block-container:last-child pre:last-child code:last-child");
                    if(codeEl){
                        appendAndHighlightChunk(codeEl,CodeBuffer+trunk.split("```")[0]);
                    }
                }
                //若标识符后面还有内容，需要追加到普通文本里
                if(trunk.split("```")[1].trim() !== ""){
                    TextBuffer+=trunk.split("```")[1];
                }
                // 清空代码缓存区
                CodeBuffer='';
                // console.log("代码块结束");	
                return;
            }
        }
        //开始读取代码块
        if(isCodeBlock && CodeStartBuffer.length === 0){
            if(trunk.includes("\n")){
                CodeBuffer+=trunk.split("\n")[0];
                const codeEl=container.value?.querySelector(".code-block-container:last-child pre:last-child code:last-child");
                if(codeEl){
                    // 节流高亮，防止每次都卡顿
                    appendAndHighlightChunk(codeEl,CodeBuffer);
                }
                //若回车后面还有代码，说明是下一行代码，上一行的代码需要先清空
                if(trunk.split("\n")[1] !== ""){
                    CodeBuffer='\n'+trunk.split("\n")[1];
                }else{
                    //若回车后面没有代码，直接清空上一行代码，准备存储下一行
                    CodeBuffer="\n";
                }
            }else{
                CodeBuffer+=trunk;
            }
            return;
        }
        // 这里是 AI 新生成的文字(非代码块)
        if (!isCodeBlock) {
            rawDisplayEl = document.querySelector('.raw-streaming');
            const newText = trunk;
            // 如果不是以空格或换行结尾，说明当前语句可能不完整（例如 markdown 语法还没结束）
            if ((!newText.endsWith('\n') && !newText.endsWith('\n\n')) || hasUnclosedMath(TextBuffer+newText) || hasUnclosedTable(TextBuffer+newText) || (TextBuffer.length<10)) {
                //不是完整语句或者缓存的字符数量<10个，缓存起来，等待下一次读取
                TextBuffer += newText;
                if(hasUnclosedMath(TextBuffer+newText) || hasUnclosedTable(TextBuffer+newText)){
                    //如果包含未关闭的数学公式，缓存起来，等待下一次读取，不要输出数学公式的原样形式
                    return;
                }
                // 原样显示（未修饰）
                if (!rawDisplayEl) {
                    rawDisplayEl = document.createElement('span');
                    rawDisplayEl.className = 'raw-streaming';
                    rawDisplayEl.textContent = TextBuffer;
                    container.value.appendChild(rawDisplayEl);
                } else {
                    rawDisplayEl.textContent += newText;
                }
                // 不进行 markdown 渲染
                return;
            }
            // 到这里说明语句完整，可以进行 Markdown 解析
            let fullText = TextBuffer + newText;
            if(fullText.trim().endsWith('[DONE]\n')){
                // 移除 [DONE] 标志
                fullText = fullText.trim().replace('[DONE]', '');
            }
            TextBuffer = '';
            // 先清理掉原始显示区
            if (rawDisplayEl) {
                rawDisplayEl.remove();
                rawDisplayEl = null;
            }
            // 渲染 Markdown
            const rendered = renderMarkdown(escapeBackslash(fullText));
            container.value.insertAdjacentHTML('beforeend',rendered);
            //渲染数学公式
            await nextTick();
            renderMathJax(container.value);
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
.ai-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 15px;
}

.ai-content th,
.ai-content td {
  border: 1px solid #ccc;
  padding: 6px 10px;
  text-align: center;
  vertical-align: middle;
}

.ai-content th {
  background-color: #f7f7f7;
  font-weight: 600;
}

</style>