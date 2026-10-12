<template>
  <div class="record-admin">
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">总记录数</div>
        <div class="stat-value">{{ displayStat(summary.totalCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">今日记录数</div>
        <div class="stat-value">{{ displayStat(summary.todayCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">涉及用户数</div>
        <div class="stat-value">{{ displayStat(summary.userCount) }}</div>
      </div>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="username"
        placeholder="用户名"
        clearable
        maxlength="50"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="yyyy-MM-dd"
        class="filter-date"
      />
      <el-select v-model="source" placeholder="全部来源" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="1" label="手动" />
        <el-option :value="2" label="AI解析" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border empty-text="暂无饮食记录">
      <el-table-column prop="id" label="记录ID" width="90" />
      <el-table-column prop="username" label="用户名" width="120" show-overflow-tooltip />
      <el-table-column prop="recordDate" label="记录日期" width="120" />
      <el-table-column prop="mealName" label="餐次" width="80" />
      <el-table-column prop="foodName" label="食物名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="portion" label="份量(克)" width="100" />
      <el-table-column prop="calorie" label="总热量" width="90" />
      <el-table-column prop="sourceName" label="记录来源" width="100" />
      <el-table-column prop="recordTime" label="记录时间" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="openDetail(scope.row)">查看详情</el-button>
          <el-button type="text" size="mini" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :current-page="pageNum"
        :page-size="10"
        :total="total"
        @current-change="onPageChange"
      />
    </div>

    <el-dialog title="记录详情" :visible.sync="detailVisible" width="640px">
      <div v-if="detailError" class="detail-error">{{ detailError }}</div>
      <div v-else-if="detailLoading" class="detail-loading">加载中...</div>
      <div v-else-if="detail" class="detail-body">
        <p><span>用户名</span>{{ detail.username }}</p>
        <p><span>日期</span>{{ detail.recordDate }}</p>
        <p><span>餐次</span>{{ detail.mealName }}</p>
        <p><span>总热量</span>{{ detail.calorie }} kcal</p>
        <p><span>记录来源</span>{{ detail.sourceName }}</p>
        <p><span>记录时间</span>{{ detail.recordTime }}</p>
        <p v-if="detail.originalContent"><span>原始描述</span>{{ detail.originalContent }}</p>
        <el-table :data="detail.foods || []" border size="small" class="food-table">
          <el-table-column prop="foodName" label="食物名称" min-width="120" />
          <el-table-column prop="portion" label="份量(g)" width="90" />
          <el-table-column prop="calorie" label="热量" width="80" />
          <el-table-column prop="protein" label="蛋白质" width="80" />
          <el-table-column prop="fat" label="脂肪" width="70" />
          <el-table-column prop="carbohydrate" label="碳水" width="70" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  deleteAdminDietRecord,
  getAdminDietRecordDetail,
  getAdminDietRecordPage,
  getAdminDietRecordSummary
} from '@/api/admin-diet-records'

export default {
  name: 'AdminDietRecordList',
  data() {
    return {
      username: '',
      dateRange: [],
      source: '',
      pageNum: 1,
      total: 0,
      list: [],
      loading: false,
      summary: {
        totalCount: null,
        todayCount: null,
        userCount: null
      },
      detailVisible: false,
      detailLoading: false,
      detailError: '',
      detail: null
    }
  },
  created() {
    this.loadSummary()
    this.loadList()
  },
  methods: {
    displayStat(value) {
      return value === null || value === undefined ? '--' : value
    },
    queryParams() {
      const startDate = this.dateRange && this.dateRange[0]
      const endDate = this.dateRange && this.dateRange[1]
      return {
        username: this.username || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        source: this.source === '' ? undefined : this.source
      }
    },
    handleSearch() {
      const startDate = this.dateRange && this.dateRange[0]
      const endDate = this.dateRange && this.dateRange[1]
      if (startDate && endDate && endDate < startDate) {
        this.$message.error('结束日期必须大于等于开始日期')
        return
      }
      this.pageNum = 1
      this.loadSummary()
      this.loadList()
    },
    onPageChange(page) {
      this.pageNum = page
      this.loadList()
    },
    loadSummary() {
      getAdminDietRecordSummary(this.queryParams()).then(res => {
        this.summary = res.data || { totalCount: null, todayCount: null, userCount: null }
      }).catch(() => {
        this.summary = { totalCount: null, todayCount: null, userCount: null }
      })
    },
    loadList() {
      this.loading = true
      getAdminDietRecordPage(Object.assign({ pageNum: this.pageNum }, this.queryParams())).then(res => {
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
      getAdminDietRecordDetail(row.id).then(res => {
        this.detail = res.data
        this.detailLoading = false
      }).catch(() => {
        this.detailLoading = false
        this.detailError = '记录详情加载失败'
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除该条饮食记录？此操作不可恢复', '提示', { type: 'warning' }).then(() => {
        return deleteAdminDietRecord(row.id)
      }).then(() => {
        this.$message.success('删除成功')
        this.loadList()
        this.loadSummary()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || '删除失败，请重试')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.record-admin {
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
  width: 180px;
}

.filter-date {
  width: 280px;
}

.filter-select {
  width: 140px;
}

.search-btn {
  background: #2e7d32;
  border-color: #2e7d32;
}

.pager {
  margin-top: 16px;
  text-align: right;
}

.detail-body p {
  margin: 0 0 10px;
  color: #303133;
  span {
    display: inline-block;
    width: 80px;
    color: #909399;
  }
}

.food-table {
  margin-top: 8px;
}

.detail-error {
  color: #f56c6c;
  text-align: center;
  padding: 24px 0;
}

.detail-loading {
  color: #909399;
  text-align: center;
  padding: 24px 0;
}
</style>
