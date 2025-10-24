<template>
    <div class="title" ref="titleRef">jarvis</div>
</template>

<script setup>
    // import { watch,ref } from 'vue'
    // import { useChatStore } from '@/store/chatStore'

    // //引用组件dom
    // const titleRef = ref(null)
    // //引入pinia
    // const chatStore = useChatStore()
    // // 监听 chatStore 中的 mess 变化
    // watch(() => chatStore.msgList.length, async(newLen) => {
    //     // 当 msgList 聊天次数超过4次，自动生成标题并赋值给组件
    //     if(newLen === 5){
    //         chatStore.sendMessage('请为我生成一个标题')
    //         titleRef.value.textContent = chatStore.msgList.at(-1).role==='ai'?chatStore.msgList.at(-1).content:'Jarvis'            
    //     }        
    // });
</script>

<style scoped>
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
</style>
