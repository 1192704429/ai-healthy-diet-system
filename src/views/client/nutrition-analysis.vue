<template>
  <div class="analysis-page">
    <div class="page-head">
      <h2>营养分析</h2>
      <el-select v-model="days" size="small" @change="loadData">
        <el-option :value="7" label="最近7天" />
        <el-option :value="30" label="最近30天" />
        <el-option :value="90" label="最近90天" />
      </el-select>
    </div>

    <div v-if="pageError" class="state-box">
      <p>{{ pageError }}</p>
      <el-button class="primary-btn" @click="loadData">重试</el-button>
    </div>
    <el-skeleton v-else-if="loading" class="panel" :rows="10" animated />

    <template v-else-if="empty">
      <div class="state-box panel">
        <p>{{ emptyMessage || '暂无数据' }}</p>
        <el-button class="primary-btn" @click="$router.push('/user/diet-record')">去记录饮食</el-button>
      </div>
    </template>

    <template v-else>
      <p class="muted range-text">{{ data.startDate }} 至 {{ data.endDate }} · 有记录 {{ data.recordedDays }} 天 · 目标 {{ data.goalName || '均衡营养' }}</p>
      <section class="card-grid">
        <article class="panel metric-card" v-for="item in metricCards" :key="item.key">
          <h4>{{ item.label }}</h4>
          <p class="metric-value">{{ formatNumber(item.average) }} <span>{{ item.unit }}</span></p>
          <p class="muted">推荐 {{ formatNumber(item.recommend) }} {{ item.unit }}</p>
          <p :class="Number(item.rate) > 110 ? 'over' : (Number(item.rate) < 85 ? 'low' : 'ok')">达标率 {{ formatNumber(item.rate) }}%</p>
        </article>
      </section>

      <section class="panel">
        <h3>{{ days > 30 ? '营养摄入周趋势' : '营养摄入趋势' }}</h3>
        <div ref="trendChart" class="chart" />
      </section>

      <div class="chart-row">
        <section class="panel">
          <h3>营养素构成</h3>
          <div ref="pieChart" class="chart" />
        </section>
        <section class="panel">
          <h3>与推荐比例对比</h3>
          <table class="share-table">
            <tr>
              <th></th>
              <th>实际</th>
              <th>推荐</th>
            </tr>
            <tr>
              <td>蛋白质</td>
              <td>{{ formatNumber(actualShare.protein) }}%</td>
              <td>{{ formatNumber(recommendShare.protein) }}%</td>
            </tr>
            <tr>
              <td>脂肪</td>
              <td>{{ formatNumber(actualShare.fat) }}%</td>
              <td>{{ formatNumber(recommendShare.fat) }}%</td>
            </tr>
            <tr>
              <td>碳水</td>
              <td>{{ formatNumber(actualShare.carbohydrate) }}%</td>
              <td>{{ formatNumber(recommendShare.carbohydrate) }}%</td>
            </tr>
          </table>
        </section>
      </div>

      <section class="panel">
        <h3>关键发现</h3>
        <ul class="findings">
          <li v-for="(item, index) in findings" :key="index">{{ item }}</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script>
import { getNutritionAnalysis } from '@/api/client-nutrition'

export default {
  name: 'ClientNutritionAnalysis',
  data() {
    return {
      days: 30,
      loading: false,
      pageError: '',
      empty: false,
      emptyMessage: '',
      data: {},
      trendChart: null,
      pieChart: null
    }
  },
  computed: {
    metricCards() {
      const overview = (this.data && this.data.overview) || {}
      return [
        { key: 'calorie', label: '平均热量', ...(overview.calorie || {}), unit: '千卡' },
        { key: 'protein', label: '平均蛋白质', ...(overview.protein || {}), unit: 'g' },
        { key: 'fat', label: '平均脂肪', ...(overview.fat || {}), unit: 'g' },
        { key: 'carbohydrate', label: '平均碳水', ...(overview.carbohydrate || {}), unit: 'g' }
      ]
    },
    actualShare() {
      return (this.data && this.data.actualShare) || {}
    },
    recommendShare() {
      return (this.data && this.data.recommendShare) || {}
    },
    findings() {
      return (this.data && this.data.findings) || []
    }
  },
  created() {
    this.loadData()
  },
  mounted() {
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCharts)
    this.disposeCharts()
  },
  methods: {
    async loadData() {
      this.loading = true
      this.pageError = ''
      this.disposeCharts()
      try {
        const res = await getNutritionAnalysis({ days: this.days })
        const data = (res && res.data) || {}
        this.data = data
        this.empty = Boolean(data.empty)
        this.emptyMessage = data.emptyMessage || '暂无数据'
        if (!this.empty) {
          this.loading = false
          this.$nextTick(this.renderCharts)
        }
      } catch (error) {
        this.pageError = '加载失败，请稍后重试'
        this.empty = false
      } finally {
        if (this.loading) {
          this.loading = false
        }
      }
    },
    renderCharts() {
      this.renderTrend()
      this.renderPie()
    },
    renderTrend() {
      if (!this.$refs.trendChart) {
        return
      }
      this.trendChart = this.$echarts.init(this.$refs.trendChart)
      const trend = this.data.trend || []
      this.trendChart.setOption({
        color: ['#2e7d32', '#66bb6a', '#f9a825', '#42a5f5'],
        tooltip: { trigger: 'axis' },
        legend: { data: ['热量', '蛋白质', '脂肪', '碳水'] },
        grid: { left: 48, right: 24, top: 40, bottom: 32 },
        xAxis: { type: 'category', data: trend.map(item => item.label), boundaryGap: false },
        yAxis: { type: 'value', name: this.days > 30 ? '日均' : '' },
        series: [
          { name: '热量', type: 'line', smooth: true, data: trend.map(item => item.calorie) },
          { name: '蛋白质', type: 'line', smooth: true, data: trend.map(item => item.protein) },
          { name: '脂肪', type: 'line', smooth: true, data: trend.map(item => item.fat) },
          { name: '碳水', type: 'line', smooth: true, data: trend.map(item => item.carbohydrate) }
        ]
      })
    },
    renderPie() {
      if (!this.$refs.pieChart) {
        return
      }
      this.pieChart = this.$echarts.init(this.$refs.pieChart)
      const share = this.actualShare
      this.pieChart.setOption({
        color: ['#2e7d32', '#f9a825', '#42a5f5'],
        tooltip: { trigger: 'item', formatter: '{b} {d}%' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['42%', '68%'],
          label: { formatter: '{b}\n{d}%' },
          data: [
            { name: '蛋白质', value: Number(share.protein || 0) },
            { name: '脂肪', value: Number(share.fat || 0) },
            { name: '碳水', value: Number(share.carbohydrate || 0) }
          ]
        }]
      })
    },
    resizeCharts() {
      if (this.trendChart) {
        this.trendChart.resize()
      }
      if (this.pieChart) {
        this.pieChart.resize()
      }
    },
    disposeCharts() {
      if (this.trendChart) {
        this.trendChart.dispose()
        this.trendChart = null
      }
      if (this.pieChart) {
        this.pieChart.dispose()
        this.pieChart = null
      }
    },
    formatNumber(value) {
      if (value === null || value === undefined || value === '') {
        return '--'
      }
      return Number(value).toFixed(1)
    }
  }
}
</script>

<style lang="scss" scoped>
.analysis-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-head h2,
.panel h3,
.metric-card h4 {
  margin: 0;
  color: #1f3d24;
}

.panel {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  margin-top: 12px;
}

.metric-value {
  margin: 8px 0 4px;
  font-size: 22px;
  color: #1f3d24;
}

.metric-value span,
.muted,
.range-text {
  color: #6b7c6e;
  font-size: 13px;
}

.ok {
  color: #2e7d32;
}

.low {
  color: #ef6c00;
}

.over {
  color: #c62828;
}

.chart {
  width: 100%;
  height: 320px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
}

.share-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  font-size: 13px;
}

.share-table th,
.share-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #eef3ee;
  text-align: left;
  color: #3f5344;
}

.findings {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #3f5344;
  line-height: 1.8;
}

.state-box {
  margin-top: 16px;
  padding: 36px 16px;
  text-align: center;
  color: #6b7c6e;
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

@media (max-width: 900px) {
  .card-grid,
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>
