<template>
  <div class="trend-page">
    <div class="page-head">
      <h2>健康趋势</h2>
      <el-select v-model="range" size="small" @change="loadData">
        <el-option value="7" label="最近7天" />
        <el-option value="30" label="最近30天" />
        <el-option value="90" label="最近90天" />
        <el-option value="all" label="全部" />
      </el-select>
    </div>

    <section class="panel metric-bar">
      <el-checkbox-group v-model="metrics" @change="onMetricChange">
        <el-checkbox v-for="item in metricOptions" :key="item.code" :label="item.code">{{ item.name }}</el-checkbox>
      </el-checkbox-group>
      <el-button size="mini" @click="resetMetrics">重置</el-button>
    </section>

    <div v-if="pageError" class="state-box">
      <p>{{ pageError }}</p>
      <el-button class="primary-btn" @click="loadData">重试</el-button>
    </div>
    <el-skeleton v-else-if="loading" class="panel" :rows="8" animated />

    <template v-else>
      <section v-for="chart in charts" :key="chart.code" class="panel chart-card">
        <div class="chart-head">
          <h3>{{ chart.name }}</h3>
          <span class="muted">{{ chart.unit }}</span>
        </div>
        <div v-if="chart.empty" class="state-box">
          <p>暂无数据</p>
          <p class="muted">请先{{ chart.actionLabel === '去记录饮食' ? '记录饮食' : '录入该指标' }}后再查看趋势</p>
          <el-button class="primary-btn" size="small" @click="$router.push(chart.actionPath)">{{ chart.actionLabel }}</el-button>
        </div>
        <template v-else>
          <div :ref="'chart-' + chart.code" class="chart" />
          <el-collapse v-model="openedStats">
            <el-collapse-item :name="chart.code" title="平均值 / 最大值 / 最小值">
              <p v-for="stat in chart.stats" :key="stat.name" class="stat-line">
                {{ stat.name }}：平均 {{ formatNumber(stat.avg) }} · 最大 {{ formatNumber(stat.max) }} · 最小 {{ formatNumber(stat.min) }} {{ chart.unit }}
              </p>
            </el-collapse-item>
          </el-collapse>
        </template>
      </section>
    </template>
  </div>
</template>

<script>
import { getHealthTrend } from '@/api/client-health-trend'

const DEFAULT_METRICS = ['weight', 'diet']

export default {
  name: 'ClientHealthTrend',
  data() {
    return {
      range: '30',
      metrics: DEFAULT_METRICS.slice(),
      metricOptions: [
        { code: 'weight', name: '体重' },
        { code: 'bloodPressure', name: '血压' },
        { code: 'glucose', name: '血糖' },
        { code: 'heartRate', name: '心率' },
        { code: 'diet', name: '饮食摄入' }
      ],
      loading: false,
      pageError: '',
      charts: [],
      openedStats: [],
      chartMap: {}
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
    resetMetrics() {
      this.metrics = DEFAULT_METRICS.slice()
      this.loadData()
    },
    onMetricChange(value) {
      if (!value || !value.length) {
        this.$message.error('请至少选择一项指标')
        this.metrics = DEFAULT_METRICS.slice()
      }
      this.loadData()
    },
    async loadData() {
      this.loading = true
      this.pageError = ''
      this.disposeCharts()
      try {
        const res = await getHealthTrend({
          range: this.range,
          metrics: (this.metrics || []).join(',')
        })
        const data = (res && res.data) || {}
        this.charts = data.charts || []
        this.openedStats = this.charts.filter(item => !item.empty).map(item => item.code)
        this.loading = false
        this.$nextTick(this.renderCharts)
      } catch (error) {
        this.pageError = '加载失败，请稍后重试'
        this.charts = []
      } finally {
        if (this.loading) {
          this.loading = false
        }
      }
    },
    renderCharts() {
      this.charts.forEach(chart => {
        if (chart.empty) {
          return
        }
        const nodes = this.$refs['chart-' + chart.code]
        const el = Array.isArray(nodes) ? nodes[0] : nodes
        if (!el) {
          return
        }
        const instance = this.$echarts.init(el)
        const colors = ['#2e7d32', '#42a5f5']
        instance.setOption({
          color: colors,
          tooltip: {
            trigger: 'axis',
            formatter(params) {
              if (!params || !params.length) {
                return ''
              }
              const lines = [params[0].axisValue]
              params.forEach(item => {
                lines.push(item.marker + item.seriesName + '：' + item.data)
              })
              return lines.join('<br/>')
            }
          },
          legend: { data: (chart.series || []).map(item => item.name), top: 0 },
          grid: { left: 54, right: 28, top: 48, bottom: 36, containLabel: true },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            axisLabel: {
              margin: 14,
              hideOverlap: true
            },
            data: this.axisDates(chart)
          },
          yAxis: { type: 'value', name: chart.unit },
          series: (chart.series || []).map(item => ({
            name: item.name,
            type: 'line',
            smooth: true,
            showSymbol: true,
            data: this.alignPoints(chart, item.points || [])
          }))
        })
        this.chartMap[chart.code] = instance
      })
    },
    axisDates(chart) {
      const dates = []
      ;(chart.series || []).forEach(item => {
        (item.points || []).forEach(point => {
          if (dates.indexOf(point.date) === -1) {
            dates.push(point.date)
          }
        })
      })
      dates.sort()
      return dates
    },
    alignPoints(chart, points) {
      const map = {}
      points.forEach(item => {
        map[item.date] = item.value
      })
      return this.axisDates(chart).map(date => (map[date] === undefined ? null : map[date]))
    },
    resizeCharts() {
      Object.keys(this.chartMap).forEach(key => {
        this.chartMap[key].resize()
      })
    },
    disposeCharts() {
      Object.keys(this.chartMap).forEach(key => {
        this.chartMap[key].dispose()
      })
      this.chartMap = {}
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
.trend-page {
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
.chart-head h3 {
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

.metric-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.chart-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.chart {
  width: 100%;
  height: 320px;
}

.stat-line {
  margin: 6px 0;
  color: #3f5344;
  font-size: 13px;
}

.muted {
  color: #6b7c6e;
  font-size: 13px;
}

.state-box {
  padding: 28px 12px;
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

.metric-bar ::v-deep .el-checkbox__input.is-checked .el-checkbox__inner,
.metric-bar ::v-deep .el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background-color: #2e7d32;
  border-color: #2e7d32;
}

.metric-bar ::v-deep .el-checkbox__label {
  color: #3f5344;
}
</style>
