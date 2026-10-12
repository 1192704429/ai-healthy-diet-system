<template>
  <div class="home-page">
    <section class="welcome-banner">
      <div>
        <p class="banner-kicker">今日健康饮食</p>
        <h2 class="welcome-title">你好，{{ displayName }}</h2>
        <p class="welcome-tip">{{ healthTip }}</p>
      </div>
      <div class="quick-links">
        <button type="button" @click="$router.push('/user/diet-record')">记一餐</button>
        <button type="button" @click="$router.push('/user/nutrition-analysis')">看营养</button>
        <button type="button" @click="$router.push('/user/ai-qa')">问 AI</button>
      </div>
    </section>

    <div v-if="needGuide" class="guide-bar">
      <span>{{ guideMessage }}</span>
      <button class="guide-btn" type="button" @click="goHealthProfile">去完善</button>
    </div>

    <div class="filter-bar">
      <button
        v-for="item in filterOptions"
        :key="item.value"
        type="button"
        class="filter-item"
        :class="{ active: activeFilter === item.value }"
        @click="activeFilter = item.value"
      >
        {{ item.label }}
      </button>
    </div>

    <div v-if="loadError" class="state-box">
      <p>{{ loadError }}</p>
      <button class="retry-btn" type="button" @click="loadRecommend">重新加载</button>
    </div>

    <template v-else-if="loading">
      <el-skeleton class="skeleton-block" :rows="4" animated />
      <el-skeleton class="skeleton-block" :rows="3" animated />
      <el-skeleton class="skeleton-block" :rows="5" animated />
    </template>

    <template v-else>
      <section v-if="showSection('food')" class="section">
        <h3 class="section-title">推荐食物</h3>
        <div v-if="foods.length" class="food-grid">
          <article
            v-for="item in foods"
            :key="item.id"
            class="food-card"
            @click="openFood(item)"
          >
            <div class="food-cover">
              <img v-if="item.image" :src="item.image" :alt="item.name">
              <span v-else>暂无图片</span>
            </div>
            <div class="card-body">
              <div class="card-head">
                <h4>{{ item.name }}</h4>
                <span v-if="item.reason" class="reason-tag">{{ item.reason }}</span>
              </div>
              <p class="calorie">热量 {{ formatNumber(item.calorie) }} kcal</p>
              <p class="nutrients">
                蛋白质 {{ formatNumber(item.protein) }}g ·
                脂肪 {{ formatNumber(item.fat) }}g ·
                碳水 {{ formatNumber(item.carbohydrate) }}g
              </p>
            </div>
          </article>
        </div>
        <p v-else class="empty-text">暂无推荐食物，完善健康档案后获得更精准推荐</p>
      </section>

      <section v-if="showSection('plan')" class="section">
        <h3 class="section-title">推荐饮食方案</h3>
        <div v-if="plans.length" class="plan-grid">
          <article
            v-for="item in plans"
            :key="item.id"
            class="plan-card"
            @click="openPlan(item)"
          >
            <div class="card-head">
              <h4>{{ item.name }}</h4>
              <span v-if="item.reason" class="reason-tag">{{ item.reason }}</span>
            </div>
            <p class="scene">适用场景：{{ item.goalName || '均衡营养' }}</p>
            <p class="summary">{{ item.summary || '暂无简介' }}</p>
          </article>
        </div>
        <p v-else class="empty-text">暂无推荐饮食方案</p>
      </section>

      <section v-if="showSection('article')" class="section">
        <h3 class="section-title">推荐健康资讯</h3>
        <ul v-if="articles.length" class="article-list">
          <li
            v-for="item in articles"
            :key="item.id"
            class="article-item"
            @click="openArticle(item)"
          >
            <h4>{{ item.title }}</h4>
            <div class="article-meta">
              <span>{{ formatTime(item.publishTime) }}</span>
              <span>阅读 {{ item.viewCount || 0 }}</span>
            </div>
          </li>
        </ul>
        <p v-else class="empty-text">暂无推荐资讯</p>
      </section>
    </template>
  </div>
</template>

<script>
import { getHomeRecommend, recordRecommendClick } from '@/api/client-recommend'

export default {
  name: 'ClientHome',
  data() {
    return {
      loading: false,
      loadError: '',
      needGuide: false,
      guideMessage: '请完善健康档案和设置健康目标，以获取个性化推荐',
      displayName: '',
      healthTip: '保持良好饮食习惯',
      foods: [],
      plans: [],
      articles: [],
      activeFilter: 'all',
      filterOptions: [
        { label: '全部', value: 'all' },
        { label: '食物', value: 'food' },
        { label: '方案', value: 'plan' },
        { label: '资讯', value: 'article' }
      ]
    }
  },
  created() {
    this.displayName = this.$store.getters.clientName || '用户'
    this.loadRecommend()
  },
  methods: {
    showSection(type) {
      return this.activeFilter === 'all' || this.activeFilter === type
    },
    async loadRecommend() {
      this.loading = true
      this.loadError = ''
      try {
        const res = await getHomeRecommend()
        const data = (res && res.data) || {}
        this.needGuide = Boolean(data.needGuide)
        this.guideMessage = data.guideMessage || '请完善健康档案和设置健康目标，以获取个性化推荐'
        this.displayName = data.displayName || this.$store.getters.clientName || '用户'
        this.healthTip = data.healthTip || '保持良好饮食习惯'
        this.foods = data.foods || []
        this.plans = data.plans || []
        this.articles = data.articles || []
      } catch (error) {
        this.loadError = '推荐内容加载失败，请稍后重试'
        this.foods = []
        this.plans = []
        this.articles = []
      } finally {
        this.loading = false
      }
    },
    formatNumber(value) {
      if (value === null || value === undefined || value === '') {
        return '--'
      }
      return Number(value).toFixed(1)
    },
    formatTime(value) {
      if (!value) {
        return '时间未知'
      }
      return String(value).replace('T', ' ').slice(0, 16)
    },
    openFood(item) {
      this.recordClick(1, item.id)
      this.$router.push({ path: '/user/food-detail', query: { id: item.id } })
    },
    openPlan(item) {
      this.recordClick(2, item.id)
      this.$router.push({ path: '/user/meal-plan', query: { id: item.id } })
    },
    openArticle(item) {
      this.recordClick(3, item.id)
      this.$router.push({ path: '/user/article-detail', query: { id: item.id } })
    },
    goHealthProfile() {
      this.$router.push('/user/health-profile')
    },
    recordClick(recommendType, targetId) {
      recordRecommendClick({ recommendType, targetId }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  padding: 28px 28px 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0.2)),
    linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%);
  border: 1px solid #d7e3d7;
  border-radius: 20px;
  box-shadow: 0 12px 28px rgba(46, 125, 50, 0.12);
}

.banner-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  letter-spacing: 2px;
  color: #2e7d32;
}

.welcome-title {
  margin: 0;
  font-size: 26px;
  color: #1f3d24;
}

.welcome-tip {
  margin: 8px 0 0;
  font-size: 14px;
  color: #5f7462;
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-links button {
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #1f3d24;
  cursor: pointer;
}

.quick-links button:hover {
  background: #fff;
}

.guide-bar {
  margin-top: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  background: #fff8e8;
  border: 1px solid #f0e0b8;
  border-radius: 12px;
  color: #7a5b16;
  font-size: 14px;
  line-height: 1.5;
}

.filter-bar {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-item {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #d7e3d7;
  border-radius: 16px;
  background: #fff;
  color: #5f7462;
  cursor: pointer;
}

.filter-item.active {
  color: #fff;
  background: #2e7d32;
  border-color: #2e7d32;
}

.guide-btn,
.retry-btn {
  border: none;
  background: #2e7d32;
  color: #fff;
  height: 32px;
  padding: 0 14px;
  border-radius: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.guide-btn:hover,
.retry-btn:hover,
.filter-item:hover {
  opacity: 0.92;
}

.state-box {
  margin-top: 24px;
  padding: 28px 16px;
  text-align: center;
  color: #5f7462;
  background: #fff;
  border: 1px solid #d7e3d7;
  border-radius: 16px;
}

.skeleton-block {
  margin-top: 20px;
}

.section {
  margin-top: 28px;
}

.section-title {
  margin: 0 0 14px;
  font-size: 18px;
  color: #1f3d24;
}

.food-grid,
.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.food-card,
.plan-card,
.article-item {
  background: #fff;
  border: 1px solid #d7e3d7;
  border-radius: 16px;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(93, 59, 74, 0.05);
}

.food-card:hover,
.plan-card:hover,
.article-item:hover {
  border-color: #f6a6c5;
  transform: translateY(-2px);
}

.food-cover {
  height: 148px;
  background: #fff4f7;
  color: #b39aa0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.food-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body,
.plan-card {
  padding: 12px 14px 14px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-head h4,
.article-item h4 {
  margin: 0;
  font-size: 15px;
  color: #1f3d24;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reason-tag {
  flex-shrink: 0;
  font-size: 12px;
  color: #2e7d32;
  background: #fff0f5;
  border-radius: 10px;
  padding: 2px 8px;
}

.calorie,
.scene {
  margin: 8px 0 0;
  font-size: 13px;
  color: #2e7d32;
}

.nutrients,
.summary,
.article-meta {
  margin: 6px 0 0;
  font-size: 12px;
  color: #5f7462;
  line-height: 1.5;
}

.summary {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.article-item {
  padding: 14px 16px;
  margin-bottom: 10px;
}

.article-meta {
  display: flex;
  gap: 16px;
}

.empty-text {
  margin: 0;
  padding: 20px 12px;
  text-align: center;
  color: #b39aa0;
  background: #fff;
  border: 1px dashed #d7e3d7;
  border-radius: 12px;
}

@media (max-width: 720px) {
  .welcome-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
