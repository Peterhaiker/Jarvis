<template>
  <div class="info-area" ref="ScrollContainer">
      <template v-for="msg in chatStore.msgList" :key="msg.id">
          <AIMessage v-if="msg.role === 'ai'" :content="msg.content" @mounted="aiContainer"/>
          <UserMessage v-else :content="msg.content"/>
      </template>
    </div>
</template>

<script setup>
import { ref,onMounted,watch, nextTick } from 'vue'
import { useChatStore } from '@/store/chatStore'
import AIMessage from '@/components/chat/AIMessage.vue'
import UserMessage from '@/components/chat/UserMessage.vue'

const chatStore = useChatStore();
//接收ai回复的容器，用于操控流式输出
const aiContainer=ref(null);
//用来实现输出时自动滚动
const ScrollContainer=ref(null);
const autoScroll=ref(true)//是否自动滚动

//挂载后监听用户是否有鼠标滚动行为，以此判断是否自动滚动到消息底部
onMounted(() => {
  const el = ScrollContainer.value
  if (!el) return
  el.addEventListener('scroll', () => {
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    autoScroll.value = distanceToBottom <= 150
  })
});
// 自动滚动函数
function scrollToBottom() {
  const el = ScrollContainer.value
  if (!el || !autoScroll.value) return
  el.scrollTo({
    top: el.scrollHeight,
    behavior: 'smooth'
  })
};

watch(()=>chatStore.msgList.map(msg=>msg.content),async ()=>{
    await nextTick();
  scrollToBottom();
})

</script>

<style scoped>
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
</style>
