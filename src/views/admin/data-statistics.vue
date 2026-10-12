<template>
  <div class="stat-admin">
    <div class="filter-bar">
      <span class="filter-label">时间范围</span>
      <el-select v-model="range" class="filter-select" @change="loadAll">
        <el-option value="7" label="近7天" />
        <el-option value="30" label="近30天" />
        <el-option value="all" label="全部" />
      </el-select>
    </div>

    <div v-if="overviewError" class="error-box">数据加载失败</div>
    <div v-else class="stat-row" v-loading="overviewLoading">
      <div class="stat-card">
        <div class="stat-label">用户总数</div>
        <div class="stat-value">{{ displayStat(overview.userCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日新增用户</div>
        <div class="stat-value">{{ displayStat(overview.todayNewUserCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">饮食记录总数</div>
        <div class="stat-value">{{ displayStat(overview.dietRecordCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">文章总数</div>
        <div class="stat-value">{{ displayStat(overview.articleCount) }}</div>
      </div>
    </div>

    <div class="chart-card" v-loading="userTrendLoading">
      <h3>用户增长趋势</h3>
      <div v-if="userTrendError" class="error-box">数据加载失败</div>
      <div v-else-if="isTrendEmpty(userTrend)" class="empty-box">暂无数据</div>
      <div v-else ref="userChart" class="chart" />
    </div>

    <div class="chart-card" v-loading="dietTrendLoading">
      <h3>饮食记录趋势</h3>
      <div v-if="dietTrendError" class="error-box">数据加载失败</div>
      <div v-else-if="isTrendEmpty(dietTrend)" class="empty-box">暂无数据</div>
      <div v-else ref="dietChart" class="chart" />
    </div>

    <div class="chart-card" v-loading="distLoading">
      <h3>内容分布</h3>
      <div v-if="distError" class="error-box">数据加载失败</div>
      <div v-else-if="isDistEmpty(dist)" class="empty-box">暂无数据</div>
      <div v-else class="pie-row">
        <div class="pie-col">
          <p class="pie-title">文章状态</p>
          <div ref="articlePie" class="pie" />
        </div>
        <div class="pie-col">
          <p class="pie-title">食物状态</p>
          <div ref="foodPie" class="pie" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getAdminStatContentDist,
  getAdminStatDietTrend,
  getAdminStatOverview,
  getAdminStatUserTrend
} from '@/api/admin-statistics'

export default {
  name: 'AdminDataStatistics',
  data() {
    return {
      range: '30',
      overviewLoading: false,
      overviewError: false,
      overview: { userCount: null, todayNewUserCount: null, dietRecordCount: null, articleCount: null },
      userTrendLoading: false,
      userTrendError: false,
      userTrend: [],
      dietTrendLoading: false,
      dietTrendError: false,
      dietTrend: [],
      distLoading: false,
      distError: false,
      dist: { articles: [], foods: [] },
      charts: {}
    }
  },
  created() {
    this.loadAll()
  },
  beforeDestroy() {
    this.disposeCharts()
  },
  methods: {
    displayStat(value) {
      return value === null || value === undefined ? '--' : value
    },
    isTrendEmpty(points) {
      return !points || !points.length || !points.some(item => item.count > 0)
    },
    isDistEmpty(dist) {
      const articles = (dist && dist.articles) || []
      const foods = (dist && dist.foods) || []
      const sum = list => list.reduce((total, item) => total + (item.value || 0), 0)
      return sum(articles) === 0 && sum(foods) === 0
    },
    loadAll() {
      this.loadOverview()
      this.loadUserTrend()
      this.loadDietTrend()
      this.loadDist()
    },
    loadOverview() {
      this.overviewLoading = true
      this.overviewError = false
      getAdminStatOverview({ range: this.range }).then(res => {
        this.overview = res.data || {}
      }).catch(() => {
        this.overviewError = true
        this.overview = { userCount: null, todayNewUserCount: null, dietRecordCount: null, articleCount: null }
      }).finally(() => {
        this.overviewLoading = false
      })
    },
    loadUserTrend() {
      this.userTrendLoading = true
      this.userTrendError = false
      getAdminStatUserTrend({ range: this.range }).then(res => {
        this.userTrend = (res.data && res.data.points) || []
        this.$nextTick(() => this.renderLine('userChart', this.userTrend, '新增用户'))
      }).catch(() => {
        this.userTrendError = true
        this.userTrend = []
        this.disposeOne('userChart')
      }).finally(() => {
        this.userTrendLoading = false
      })
    },
    loadDietTrend() {
      this.dietTrendLoading = true
      this.dietTrendError = false
      getAdminStatDietTrend({ range: this.range }).then(res => {
        this.dietTrend = (res.data && res.data.points) || []
        this.$nextTick(() => this.renderLine('dietChart', this.dietTrend, '饮食记录'))
      }).catch(() => {
        this.dietTrendError = true
        this.dietTrend = []
        this.disposeOne('dietChart')
      }).finally(() => {
        this.dietTrendLoading = false
      })
    },
    loadDist() {
      this.distLoading = true
      this.distError = false
      getAdminStatContentDist({ range: this.range }).then(res => {
        this.dist = res.data || { articles: [], foods: [] }
        this.$nextTick(() => {
          this.renderPie('articlePie', this.dist.articles || [])
          this.renderPie('foodPie', this.dist.foods || [])
        })
      }).catch(() => {
        this.distError = true
        this.dist = { articles: [], foods: [] }
        this.disposeOne('articlePie')
        this.disposeOne('foodPie')
      }).finally(() => {
        this.distLoading = false
      })
    },
    renderLine(refName, points, name) {
      this.disposeOne(refName)
      if (this.isTrendEmpty(points) || !this.$refs[refName]) return
      const chart = this.$echarts.init(this.$refs[refName])
      chart.setOption({
        color: ['#2e7d32'],
        tooltip: { trigger: 'axis' },
        grid: { left: 40, right: 16, top: 24, bottom: 28 },
        xAxis: { type: 'category', data: points.map(item => item.date) },
        yAxis: { type: 'value', minInterval: 1, name: name === '新增用户' ? '用户数' : '记录条数' },
        series: [{ name, type: 'line', smooth: true, data: points.map(item => item.count) }]
      })
      this.charts[refName] = chart
    },
    renderPie(refName, slices) {
      this.disposeOne(refName)
      if (!this.$refs[refName]) return
      const chart = this.$echarts.init(this.$refs[refName])
      chart.setOption({
        color: ['#2e7d32', '#90a4ae', '#ef6c00'],
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['36%', '62%'],
          data: slices.map(item => ({ name: item.name, value: item.value }))
        }]
      })
      this.charts[refName] = chart
    },
    disposeOne(refName) {
      if (this.charts[refName]) {
        this.charts[refName].dispose()
        delete this.charts[refName]
      }
    },
    disposeCharts() {
      Object.keys(this.charts).forEach(key => this.disposeOne(key))
    }
  }
}
</script>

<style lang="scss" scoped>
.stat-admin {
  padding: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-label {
  color: #606266;
  font-size: 14px;
}

.filter-select {
  width: 160px;
}

.stat-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border: 1px solid #e8f5e9;
  border-radius: 6px;
  padding: 16px 20px;
}

.stat-label {
  color: #909399;
  font-size: 13px;
}

.stat-value {
  margin-top: 8px;
  font-size: 24px;
  color: #2e7d32;
  font-weight: 600;
}

.chart-card {
  background: #fff;
  border: 1px solid #e8f5e9;
  border-radius: 6px;
  padding: 16px 20px 20px;
  margin-bottom: 16px;

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.chart {
  height: 280px;
}

.pie-row {
  display: flex;
  gap: 16px;
}

.pie-col {
  flex: 1;
}

.pie-title {
  margin: 0 0 8px;
  text-align: center;
  color: #606266;
  font-size: 13px;
}

.pie {
  height: 280px;
}

.error-box,
.empty-box {
  padding: 40px 0;
  text-align: center;
  color: #909399;
}

.error-box {
  color: #f56c6c;
}
</style>
