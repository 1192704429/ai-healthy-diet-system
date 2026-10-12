<template>
  <div class="plan-page">
    <div class="page-head">
      <h2>饮食方案</h2>
      <el-button class="primary-btn" size="small" @click="goGenerate()">生成今日计划</el-button>
    </div>

    <section class="panel filter-bar">
      <el-select v-model="goalId" placeholder="按目标筛选" size="small" class="filter-item" @change="loadList">
        <el-option label="全部" :value="''" />
        <el-option v-for="item in goals" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <div class="tag-filters">
        <span class="filter-label">标签</span>
        <label
          v-for="item in tags"
          :key="item"
          class="tag-check"
          :class="{ active: selectedTags.indexOf(item) !== -1 }"
        >
          <el-checkbox :value="selectedTags.indexOf(item) !== -1" @change="val => toggleTag(item, val)">
            {{ item }}
          </el-checkbox>
        </label>
      </div>
    </section>

    <div v-if="listError" class="state-box">
      <p>{{ listError }}</p>
      <el-button class="primary-btn" @click="loadList">重试</el-button>
    </div>
    <el-skeleton v-else-if="loading && !list.length" class="panel" :rows="6" animated />
    <div v-else v-loading="loading">
      <div v-if="list.length" class="plan-grid">
        <article
          v-for="item in list"
          :key="item.id"
          class="plan-card"
          @click="openDetail(item.id)"
        >
          <div class="cover">
            <img v-if="item.coverImage" :src="item.coverImage" :alt="item.name">
            <span v-else>暂无封面</span>
          </div>
          <div class="card-body">
            <div class="card-head">
              <h4>{{ item.name }}</h4>
              <span v-if="item.recommended" class="rec-tag">推荐</span>
            </div>
            <p class="meta">{{ item.goalName || '通用目标' }} · {{ formatNumber(item.calorie) }} 千卡 · 热度 {{ item.viewCount || 0 }}</p>
            <p class="summary">{{ item.summary || '暂无简介' }}</p>
            <div class="tags">
              <span v-for="tagItem in item.tags" :key="tagItem" class="tag">{{ tagItem }}</span>
            </div>
            <el-button class="link-btn" type="text" @click.stop="goGenerate(item.id)">生成今日计划</el-button>
          </div>
        </article>
      </div>
      <div v-else class="state-box">
        <p>暂无饮食方案</p>
      </div>
    </div>

    <el-dialog
      :title="detail ? detail.name : '方案详情'"
      :visible.sync="detailVisible"
      width="640px"
      @closed="detail = null"
    >
      <div v-if="detailError" class="state-box">
        <p>{{ detailError }}</p>
        <el-button class="primary-btn" size="small" @click="openDetail(pendingId)">重新打开</el-button>
      </div>
      <div v-else-if="detailLoading" class="muted">加载中...</div>
      <div v-else-if="detail" class="detail-body">
        <p v-if="detail.matchTip" class="match-tip" :class="{ warn: !detail.matched }">{{ detail.matchTip }}</p>
        <p class="muted">{{ detail.goalName }} · 合计 {{ formatNumber(detail.calorie) }} 千卡</p>
        <p v-if="detail.summary">{{ detail.summary }}</p>
        <div class="meal-block" v-for="meal in detail.meals" :key="meal.code">
          <h4>{{ meal.name }} · {{ formatNumber(meal.calorie) }} 千卡</h4>
          <table class="meal-table">
            <tr v-for="food in meal.foods" :key="food.foodId + '-' + food.foodName">
              <td>{{ food.foodName }}</td>
              <td>{{ formatNumber(food.portion) }}{{ food.unit || 'g' }}</td>
              <td>{{ formatNumber(food.calorie) }} 千卡</td>
            </tr>
            <tr v-if="!meal.foods || !meal.foods.length">
              <td colspan="3" class="muted">暂无菜品</td>
            </tr>
          </table>
        </div>
        <div v-if="detail.advice" class="notes">
          <strong>营养均衡建议</strong>
          <markdown-view :content="detail.advice" />
        </div>
        <div v-if="detail.notes" class="notes">
          <strong>注意事项</strong>
          <markdown-view :content="detail.notes" />
        </div>
      </div>
      <div slot="footer">
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button class="primary-btn" :disabled="!detail" @click="goGenerate(detail && detail.id)">生成今日计划</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getMealPlanList, getMealPlanDetail } from '@/api/client-meal-plan'
import MarkdownView from '@/components/MarkdownView'

export default {
  name: 'ClientMealPlan',
  components: { MarkdownView },
  data() {
    return {
      goalId: '',
      selectedTags: [],
      goals: [],
      tags: [],
      list: [],
      loading: false,
      listError: '',
      detailVisible: false,
      detailLoading: false,
      detailError: '',
      detail: null,
      pendingId: null
    }
  },
  created() {
    this.loadList().then(() => {
      if (this.$route.query.id) {
        this.openDetail(this.$route.query.id)
      }
    })
  },
  watch: {
    '$route.query.id'(id) {
      if (id) {
        this.openDetail(id)
      }
    }
  },
  methods: {
    async loadList() {
      this.loading = true
      this.listError = ''
      try {
        const res = await getMealPlanList({
          goalId: this.goalId || undefined,
          tags: this.selectedTags
        })
        const data = (res && res.data) || {}
        this.goals = data.goals || []
        this.tags = data.tags || []
        this.list = data.records || []
      } catch (error) {
        this.list = []
        this.listError = (error && error.message) || '查询失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    toggleTag(tag, checked) {
      const next = this.selectedTags.slice()
      const index = next.indexOf(tag)
      if (checked && index === -1) {
        next.push(tag)
      }
      if (!checked && index !== -1) {
        next.splice(index, 1)
      }
      this.selectedTags = next
      this.loadList()
    },
    async openDetail(id) {
      this.pendingId = id
      this.detailVisible = true
      this.detailLoading = true
      this.detailError = ''
      this.detail = null
      try {
        const res = await getMealPlanDetail(id)
        this.detail = (res && res.data) || null
        if (!this.detail) {
          this.detailError = '加载失败'
        }
      } catch (error) {
        this.detailError = '加载失败'
      } finally {
        this.detailLoading = false
      }
    },
    goGenerate(planId) {
      this.$router.push({
        path: '/user/diet-plan-generate',
        query: planId ? { planId } : (this.detail ? { planId: this.detail.id } : {})
      })
    },
    formatNumber(value) {
      if (value === null || value === undefined || value === '') {
        return '--'
      }
      return Number(value).toFixed(0)
    }
  }
}
</script>

<style lang="scss" scoped>
.plan-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-head h2 {
  margin: 0;
  color: #1f3d24;
}

.panel,
.filter-bar {
  margin-top: 16px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.filter-bar {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  width: 180px;
  margin-right: 4px;
}

.tag-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.filter-label {
  font-size: 13px;
  color: #3f5344;
}

.tag-check {
  padding: 2px 8px;
  border: 1px solid #d7e3d7;
  border-radius: 16px;
  background: #fff;
}

.tag-check.active {
  border-color: #2e7d32;
  background: #e8f5e9;
}

.link-btn,
.link-btn:hover,
.link-btn:focus {
  color: #2e7d32;
  padding: 8px 0 0;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.plan-card {
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.plan-card:hover {
  border-color: #2e7d32;
}

.cover {
  height: 120px;
  background: #eef6ee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a9a8c;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body {
  padding: 12px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-head h4 {
  margin: 0;
  color: #1f3d24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rec-tag,
.tag {
  font-size: 12px;
  color: #2e7d32;
  background: #e8f5e9;
  border-radius: 10px;
  padding: 2px 8px;
}

.meta,
.summary,
.muted {
  color: #6b7c6e;
  font-size: 13px;
}

.summary {
  min-height: 36px;
  line-height: 1.5;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.state-box {
  margin-top: 20px;
  padding: 28px 16px;
  text-align: center;
  color: #6b7c6e;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.match-tip {
  padding: 8px 10px;
  border-radius: 8px;
  background: #e8f5e9;
  color: #1f3d24;
}

.match-tip.warn {
  background: #fff8e8;
  color: #7a5b16;
}

.meal-block h4 {
  margin: 14px 0 6px;
  color: #1f3d24;
}

.meal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.meal-table td {
  padding: 6px 4px;
  border-bottom: 1px solid #eef3ee;
  color: #3f5344;
}

.notes {
  background: #f3faf3;
  padding: 8px 10px;
  border-radius: 8px;
  color: #3f5344;
  line-height: 1.6;
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
</style>
