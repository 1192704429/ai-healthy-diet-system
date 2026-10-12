<template>
  <div class="client-layout">
    <client-header />
    <main class="client-main">
      <router-view />
    </main>
    <client-footer />
  </div>
</template>

<script>
import ClientHeader from './components/ClientHeader'
import ClientFooter from './components/ClientFooter'

export default {
  name: 'ClientLayout',
  components: {
    ClientHeader,
    ClientFooter
  }
}
</script>

<style lang="scss" scoped>
.client-layout {
  min-height: 100vh;
  background: #f4f7f4;
  display: flex;
  flex-direction: column;
}

.client-main {
  flex: 1;
}
</style>
