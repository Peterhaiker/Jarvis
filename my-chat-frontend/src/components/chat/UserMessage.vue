<template>
  <div class="user-info">
    <el-avatar class="user-logo" :size="50" style="background-color: transparent">
      <SvgIcon name="userLogo" style="width: 45px;height: 45px;"/>
    </el-avatar>
    <div class="user-content">{{ content }}</div>
  </div>
</template>

<script setup>
defineProps({
  content: String
})
</script>

<style scoped>
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
    white-space: normal;
    word-wrap: break-word;
    word-break: break-word;
    overflow-wrap: break-word;
}
</style>