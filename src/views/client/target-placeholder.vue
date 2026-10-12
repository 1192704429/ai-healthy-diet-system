<template>
  <div class="placeholder-page">
    <p>{{ pageTitle }}</p>
  </div>
</template>

<script>
export default {
  name: 'ClientTargetPlaceholder',
  computed: {
    pageTitle() {
      return (this.$route.meta && this.$route.meta.title) || '页面'
    }
  }
}
</script>

<style lang="scss" scoped>
.placeholder-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px;
  color: #6b7c6e;
}
</style>
