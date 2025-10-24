<template>
  <div class="input-area">
    <div class="input-container">
      <textarea name="chat-input" cols="30" rows="10"
        ref="inputRef"
        v-model="userInput"
        placeholder="给Jarvis发送消息"
        @keydown.enter.prevent="chatStore.sendMessage(userInput);inputRef.value = '';"
      ></textarea>
      <div class="input-button"></div>
    </div>
  </div>
</template>

<script setup>
    import { ref } from 'vue';
    import { useChatStore } from '@/store/chatStore'

    const chatStore = useChatStore();
    //存储用户输入内容并发送给Pinia
    const userInput = ref('');
    // 发送消息后清空输入框内容
    const inputRef = ref(null);
</script>

<style scoped>
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
</style>