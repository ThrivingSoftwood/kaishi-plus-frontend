<!-- src/App.vue -->
<template>
  <router-view />
</template>

<style>
/* 终极全局重置，拒绝任何多余的布局干扰 */
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  /* 隐藏滚动条，防止页面抖动 */
  overflow: hidden;
  /* 兜底背景色 */
  background-color: #141414;
  color: #E5EAF3;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}
</style>
