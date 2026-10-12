<template>
  <div class="profile-admin">
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">档案总数</div>
        <div class="stat-value">{{ displayStat(summary.totalCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">有完整指标用户数</div>
        <div class="stat-value">{{ displayStat(summary.completeCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均BMI</div>
        <div class="stat-value">{{ displayStat(summary.avgBmi) }}</div>
      </div>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="username"
        placeholder="用户名关键字"
        clearable
        maxlength="50"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-select v-model="indicatorType" placeholder="指标筛选" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="1" label="身高" />
        <el-option :value="2" label="体重" />
        <el-option :value="3" label="血压" />
        <el-option :value="4" label="血糖" />
        <el-option :value="5" label="心率" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border size="small" max-height="460" empty-text="暂无健康档案">
      <el-table-column prop="username" label="用户名" min-width="110" />
      <el-table-column prop="height" label="身高" min-width="90" />
      <el-table-column prop="weight" label="体重" min-width="90" />
      <el-table-column prop="bloodPressure" label="血压" min-width="100" />
      <el-table-column prop="glucose" label="血糖" min-width="110" />
      <el-table-column prop="heartRate" label="心率" min-width="100" />
      <el-table-column prop="lastRecordTime" label="最近记录时间" min-width="160" />
      <el-table-column label="档案完善度" min-width="110">
        <template slot-scope="scope">{{ scope.row.completeness }}%</template>
      </el-table-column>
      <el-table-column label="操作" min-width="160">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="openDetail(scope.row)">查看档案</el-button>
          <el-button type="text" size="mini" @click="openAnalysis(scope.row)">分析档案</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="total, sizes, prev, pager, next"
        :current-page="pageNum"
        :page-size="pageSize"
        :page-sizes="[5, 8, 10]"
        :total="total"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </div>

    <el-dialog title="查看档案" :visible.sync="detailVisible" width="720px">
      <div v-if="detailLoading">加载中...</div>
      <div v-else-if="detailError">{{ detailError }}</div>
      <div v-else-if="detail">
        <p class="meta">用户：{{ detail.username }}</p>
        <p class="meta">健康目标：{{ detail.goalName || '未设置' }}</p>
        <p class="meta">饮食偏好：{{ detail.preferenceSummary || '未设置' }}</p>
        <div v-for="group in detail.groups" :key="group.name" class="group-block">
          <h4>{{ group.name }}（最新：{{ group.latestDisplay || '--' }}
            <span v-if="group.latestTime"> · {{ group.latestTime }}</span>）</h4>
          <el-table :data="group.records" border size="mini" max-height="200" empty-text="暂无记录">
            <el-table-column prop="displayValue" label="数值" />
            <el-table-column prop="measureTime" label="记录时间" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <el-dialog title="分析档案" :visible.sync="analysisVisible" width="860px" @opened="renderCharts" @close="disposeCharts">
      <div v-if="analysisLoading">加载中...</div>
      <div v-else-if="analysisError">{{ analysisError }}</div>
      <div v-else-if="analysis">
        <div class="conclusion">
          <h4>营养分析结论</h4>
          <p v-for="(item, index) in analysis.conclusions" :key="index">{{ item }}</p>
        </div>
        <div v-for="chart in analysis.charts" :key="chart.code" class="chart-block">
          <h4>{{ chart.name }}（{{ chart.unit }}）</h4>
          <div v-if="isChartEmpty(chart)" class="empty-line">暂无该指标历史数据</div>
          <div v-else :ref="'chart-' + chart.code" class="chart" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  getAdminHealthProfileAnalysis,
  getAdminHealthProfileDetail,
  getAdminHealthProfilePage,
  getAdminHealthProfileSummary
} from '@/api/admin-health-profiles'

export default {
  name: 'AdminHealthProfileList',
  data() {
    return {
      username: '',
      indicatorType: '',
      pageNum: 1,
      pageSize: 8,
      total: 0,
      list: [],
      loading: false,
      summary: { totalCount: null, completeCount: null, avgBmi: null },
      detailVisible: false,
      detailLoading: false,
      detailError: '',
      detail: null,
      analysisVisible: false,
      analysisLoading: false,
      analysisError: '',
      analysis: null,
      chartMap: {}
    }
  },
  created() {
    this.loadSummary()
    this.loadList()
  },
  methods: {
    displayStat(value) {
      return value === null || value === undefined || value === '' ? '--' : value
    },
    handleSearch() {
      this.pageNum = 1
      this.loadList()
    },
    onPageChange(page) {
      this.pageNum = page
      this.loadList()
    },
    onSizeChange(size) {
      this.pageSize = size
      this.pageNum = 1
      this.loadList()
    },
    loadSummary() {
      getAdminHealthProfileSummary().then(res => {
        this.summary = res.data || { totalCount: null, completeCount: null, avgBmi: null }
      }).catch(() => {
        this.summary = { totalCount: null, completeCount: null, avgBmi: null }
      })
    },
    loadList() {
      this.loading = true
      getAdminHealthProfilePage({
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        username: this.username,
        indicatorType: this.indicatorType === '' ? undefined : this.indicatorType
      }).then(res => {
        const data = res.data || {}
        this.list = data.records || []
        this.total = data.total || 0
        this.pageNum = data.pageNum || this.pageNum
      }).finally(() => {
        this.loading = false
      })
    },
    openDetail(row) {
      this.detailVisible = true
      this.detailLoading = true
      this.detailError = ''
      this.detail = null
      getAdminHealthProfileDetail(row.userId).then(res => {
        this.detail = res.data
      }).catch(() => {
        this.detailError = '档案加载失败'
      }).finally(() => {
        this.detailLoading = false
      })
    },
    openAnalysis(row) {
      this.analysisVisible = true
      this.analysisLoading = true
      this.analysisError = ''
      this.analysis = null
      this.disposeCharts()
      getAdminHealthProfileAnalysis(row.userId).then(res => {
        this.analysis = res.data
        this.$nextTick(() => this.renderCharts())
      }).catch(err => {
        this.analysisError = (err && err.message) || '数据不足，无法分析'
      }).finally(() => {
        this.analysisLoading = false
      })
    },
    isChartEmpty(chart) {
      const series = (chart && chart.series) || []
      return !series.some(item => item.points && item.points.length)
    },
    renderCharts() {
      this.disposeCharts()
      if (!this.analysis || !this.analysis.charts) return
      this.analysis.charts.forEach(chart => {
        if (this.isChartEmpty(chart)) return
        const refs = this.$refs['chart-' + chart.code]
        const el = Array.isArray(refs) ? refs[0] : refs
        if (!el) return
        const instance = this.$echarts.init(el)
        instance.setOption({
          color: ['#2e7d32', '#1565c0', '#ef6c00', '#6a1b9a'],
          tooltip: { trigger: 'axis' },
          legend: { data: chart.series.map(item => item.name) },
          grid: { left: 44, right: 16, top: 36, bottom: 28 },
          xAxis: {
            type: 'category',
            data: (chart.series[0] && chart.series[0].points || []).map(item => item.date)
          },
          yAxis: { type: 'value' },
          series: chart.series.map(item => ({
            name: item.name,
            type: 'line',
            smooth: true,
            data: (item.points || []).map(point => point.value)
          }))
        })
        this.chartMap[chart.code] = instance
      })
    },
    disposeCharts() {
      Object.keys(this.chartMap).forEach(key => {
        this.chartMap[key].dispose()
      })
      this.chartMap = {}
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-admin {
  padding: 20px;
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

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-input {
  width: 220px;
}

.filter-select {
  width: 160px;
}

.search-btn {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}

.pager {
  margin-top: 16px;
  text-align: right;
}

.profile-admin ::v-deep .el-dialog__body {
  max-height: 62vh;
  overflow: auto;
}

.meta {
  margin: 0 0 8px;
  color: #606266;
}

.group-block {
  margin-top: 16px;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
  }
}

.conclusion {
  margin-bottom: 16px;
  padding: 12px;
  background: #f6fbf6;
  border: 1px solid #e8f5e9;
  border-radius: 6px;

  h4 {
    margin: 0 0 8px;
  }

  p {
    margin: 4px 0;
    color: #303133;
  }
}

.chart-block {
  margin-bottom: 16px;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
  }
}

.chart {
  height: 240px;
}

.empty-line {
  color: #909399;
  font-size: 13px;
}
</style>
