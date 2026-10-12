<template>
  <div class="food-detail-page">
    <div class="back-row">
      <el-button type="text" icon="el-icon-arrow-left" @click="goBack">返回食物库</el-button>
    </div>

    <div v-if="pageError" class="state-box">
      <p>{{ pageError }}</p>
      <el-button class="primary-btn" @click="load">重试</el-button>
    </div>
    <el-skeleton v-else-if="loading" class="panel" :rows="10" animated />

    <div v-else-if="detail" class="detail-layout">
      <section class="hero panel">
        <div class="hero-cover">
          <img v-if="detail.image" :src="detail.image" :alt="detail.name">
          <span v-else>暂无图片</span>
        </div>
        <div class="hero-info">
          <span class="cat-tag">{{ detail.categoryName || '未分类' }}</span>
          <h1>{{ detail.name }}</h1>
          <p class="hero-unit">基准份量 {{ detail.unit || (detail.servingSize ? detail.servingSize + 'g' : '100g') }}</p>
          <markdown-view v-if="detail.description" class="hero-desc" :content="detail.description" />
          <div v-if="tagList.length" class="tag-list">
            <span v-for="tag in tagList" :key="tag">{{ tag }}</span>
          </div>
          <div class="hero-actions">
            <el-button class="primary-btn" @click="goRecord">记录此食物</el-button>
            <el-button @click="goBack">继续浏览</el-button>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="section-head">
          <h3>营养成分</h3>
          <div class="portion-row">
            <span>按份量换算</span>
            <el-input v-model="portionGrams" size="small" class="portion-input" @input="normalizePortion" />
            <span>g</span>
          </div>
        </div>
        <div class="nutri-grid">
          <article v-for="item in nutrientCards" :key="item.label" class="nutri-card">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <em>{{ item.unit }}</em>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { getFoodDetail } from '@/api/client-food'
import MarkdownView from '@/components/MarkdownView'

export default {
  name: 'ClientFoodDetail',
  components: { MarkdownView },
  data() {
    return {
      detail: null,
      loading: false,
      pageError: '',
      portionGrams: '100'
    }
  },
  computed: {
    foodId() {
      return this.$route.query.id
    },
    tagList() {
      const tags = this.detail && this.detail.healthTags
      if (!tags) {
        return []
      }
      return String(tags).split(/[,，、]/).map(item => item.trim()).filter(Boolean)
    },
    nutrientCards() {
      return [
        { label: '热量', value: this.formatScaled(this.detail && this.detail.calorie), unit: '千卡' },
        { label: '蛋白质', value: this.formatScaled(this.detail && this.detail.protein), unit: 'g' },
        { label: '脂肪', value: this.formatScaled(this.detail && this.detail.fat), unit: 'g' },
        { label: '碳水', value: this.formatScaled(this.detail && this.detail.carbohydrate), unit: 'g' },
        { label: '膳食纤维', value: this.formatScaled(this.detail && this.detail.dietaryFiber), unit: 'g' },
        { label: '糖', value: this.formatScaled(this.detail && this.detail.sugar), unit: 'g' },
        { label: '钠', value: this.formatScaled(this.detail && this.detail.sodium), unit: 'mg' },
        { label: '钙', value: this.formatScaled(this.detail && this.detail.calcium), unit: 'mg' },
        { label: '铁', value: this.formatScaled(this.detail && this.detail.iron), unit: 'mg' }
      ]
    }
  },
  watch: {
    foodId: {
      immediate: true,
      handler() {
        this.load()
      }
    }
  },
  methods: {
    async load() {
      if (!this.foodId) {
        this.pageError = '食物不存在'
        this.detail = null
        return
      }
      this.loading = true
      this.pageError = ''
      try {
        const res = await getFoodDetail(this.foodId)
        this.detail = (res && res.data) || null
        if (!this.detail) {
          this.pageError = '食物不存在'
        } else {
          this.portionGrams = String(this.detail.servingSize || 100)
        }
      } catch (error) {
        this.detail = null
        this.pageError = '加载失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    normalizePortion() {
      if (this.portionGrams === '' || this.portionGrams === null) {
        return
      }
      const number = Number(this.portionGrams)
      if (Number.isNaN(number) || number <= 0) {
        this.portionGrams = String((this.detail && this.detail.servingSize) || 100)
      }
    },
    formatScaled(value) {
      if (value === null || value === undefined || value === '') {
        return '--'
      }
      const base = Number((this.detail && this.detail.servingSize) || 100)
      const grams = Number(this.portionGrams)
      if (!base || Number.isNaN(grams) || grams <= 0) {
        return Number(value).toFixed(1)
      }
      return (Number(value) * grams / base).toFixed(1)
    },
    goRecord() {
      if (!this.detail) {
        return
      }
      this.$router.push({
        path: '/user/diet-record',
        query: { foodId: this.detail.id, foodName: this.detail.name }
      })
    },
    goBack() {
      this.$router.push('/user/food-library')
    }
  }
}
</script>

<style lang="scss" scoped>
.food-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.back-row {
  margin-bottom: 8px;
}

.panel {
  background: #fff;
  border: 1px solid #d7e3d7;
  border-radius: 16px;
}

.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero {
  display: grid;
  grid-template-columns: 420px 1fr;
  overflow: hidden;
}

.hero-cover {
  min-height: 320px;
  background: #eef6ee;
  color: #8a9a8c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-info {
  padding: 28px 32px;
}

.cat-tag {
  display: inline-block;
  font-size: 12px;
  color: #2e7d32;
  background: #e8f5e9;
  border-radius: 999px;
  padding: 4px 10px;
}

.hero-info h1 {
  margin: 12px 0 8px;
  font-size: 28px;
  color: #1f3d24;
}

.hero-unit,
.hero-desc {
  margin: 0 0 12px;
  color: #5f7462;
  line-height: 1.7;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tag-list span {
  padding: 4px 10px;
  border-radius: 8px;
  background: #f3faf3;
  color: #3f6b44;
  font-size: 12px;
}

.hero-actions {
  display: flex;
  gap: 10px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 24px 0;
}

.section-head h3 {
  margin: 0;
  color: #1f3d24;
}

.portion-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5f7462;
  font-size: 13px;
}

.portion-input {
  width: 88px;
}

.nutri-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 18px 24px 24px;
}

.nutri-card {
  padding: 16px;
  border-radius: 12px;
  background: #f6faf6;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nutri-card span {
  font-size: 13px;
  color: #6b7c6e;
}

.nutri-card strong {
  font-size: 22px;
  color: #1f3d24;
}

.nutri-card em {
  font-style: normal;
  font-size: 12px;
  color: #8a9a8c;
}

.state-box {
  padding: 28px 16px;
  text-align: center;
  color: #6b7c6e;
  background: #fff;
  border: 1px solid #d7e3d7;
  border-radius: 12px;
}

.primary-btn {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}

.primary-btn:hover,
.primary-btn:focus {
  background: #256628;
  border-color: #256628;
  color: #fff;
}

@media (max-width: 860px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .hero-cover {
    min-height: 220px;
  }

  .nutri-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
