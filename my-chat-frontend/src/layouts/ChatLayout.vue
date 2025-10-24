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
            <ChatTitle />
            <!-- 信息展示区 -->
			<ChatMessage />
            <!-- 输入区 -->
			 <ChatInput />
            <div class="warning-info">内容由AI生成，仅供参考</div>
        </div>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<script setup>
	import ChatMessage from '@/components/chat/ChatMessage.vue'
	import ChatInput from '@/components/chat/ChatInput.vue'
    import ChatTitle from '@/components/chat/ChatTitle.vue'
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
/* .title{
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
} */
.warning-info{
    font-size: 12px;
    color: #999;
    text-align: center;
}
</style>
