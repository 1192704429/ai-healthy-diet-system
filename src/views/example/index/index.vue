<template>
  <div class="app-container">
    <div class="page-placeholder">
      <p>Index 页面</p>
      <p class="tip">可在项目根目录下添加 index_config.json 表格配置后重新生成，以生成完整 CRUD 页面。</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Index',
  data() {
    return {}
  }
}
</script>

<style scoped lang="scss">
.page-placeholder {
  padding: 40px;
  text-align: center;
  color: #606266;
  .tip {
    margin-top: 12px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
