<template>
  <div class="article-admin">
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">文章总数</div>
        <div class="stat-value">{{ displayStat(summary.totalCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">已发布文章数</div>
        <div class="stat-value">{{ displayStat(summary.publishedCount) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">总阅读量</div>
        <div class="stat-value">{{ displayStat(summary.totalViewCount) }}</div>
      </div>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="文章标题关键字"
        clearable
        maxlength="50"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-select v-model="statusFilter" placeholder="状态筛选" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="0" label="草稿" />
        <el-option :value="1" label="已发布" />
        <el-option :value="2" label="已下架" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
      <el-button type="success" class="create-btn" @click="openCreate">新增文章</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border empty-text="暂无文章">
      <el-table-column prop="articleTitle" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column prop="authorName" label="作者" width="110" />
      <el-table-column prop="viewCount" label="阅读量" width="90" />
      <el-table-column prop="likeCount" label="点赞数" width="90" />
      <el-table-column prop="collectCount" label="收藏数" width="90" />
      <el-table-column label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="statusTag(scope.row.status)" size="small">{{ scope.row.statusName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="publishTime" label="发布时间" width="170" />
      <el-table-column label="操作" width="280" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="openStats(scope.row)">查看统计</el-button>
          <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status === 1" type="text" size="mini" @click="handleUnpublish(scope.row)">下架</el-button>
          <el-button v-else type="text" size="mini" @click="handlePublish(scope.row)">发布</el-button>
          <el-button
            type="text"
            size="mini"
            :disabled="scope.row.status === 1"
            @click="handleDelete(scope.row)"
          >删除</el-button>
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

    <el-dialog :title="editForm.id ? '编辑文章' : '新增文章'" :visible.sync="editVisible" width="640px" @close="resetEdit">
      <el-form ref="editForm" :model="editForm" :rules="editRules" label-width="88px">
        <el-form-item label="标题" prop="articleTitle">
          <el-input v-model="editForm.articleTitle" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="articleType">
          <el-select v-model="editForm.articleType" placeholder="请选择分类">
            <el-option :value="1" label="健康知识" />
            <el-option :value="2" label="营养饮食" />
            <el-option :value="3" label="疾病预防" />
            <el-option :value="4" label="运动健康" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图">
          <el-upload
            class="cover-upload"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :on-success="onCoverSuccess"
            :before-upload="beforeCover"
          >
            <img v-if="editForm.coverImage" :src="editForm.coverImage" class="cover-preview">
            <el-button v-else size="small">上传封面</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="内容" prop="articleContent">
          <el-input v-model="editForm.articleContent" type="textarea" :rows="10" placeholder="支持 Markdown，如 ## 标题、- 列表、**加粗**" />
          <div v-if="editForm.articleContent" class="md-preview">
            <p class="preview-label">预览</p>
            <markdown-view :content="editForm.articleContent" />
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog title="文章统计" :visible.sync="statsVisible" width="620px" @close="disposeChart">
      <div v-if="statsError" class="stats-error">{{ statsError }}</div>
      <div v-else-if="statsLoading" class="stats-loading">加载中...</div>
      <template v-else-if="statsData">
        <div class="stats-nums">
          <div><span>阅读量</span><strong>{{ statsData.viewCount }}</strong></div>
          <div><span>点赞数</span><strong>{{ statsData.likeCount }}</strong></div>
          <div><span>收藏数</span><strong>{{ statsData.collectCount }}</strong></div>
        </div>
        <div ref="trendChart" class="trend-chart" />
        <p v-if="!statsData.trend || !statsData.trend.length" class="chart-empty">近7日暂无阅读数据</p>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  deleteAdminArticle,
  createAdminArticle,
  getAdminArticleDetail,
  getAdminArticlePage,
  getAdminArticleStats,
  getAdminArticleSummary,
  publishAdminArticle,
  unpublishAdminArticle,
  updateAdminArticle
} from '@/api/admin-articles'
import { getToken } from '@/utils/auth'
import MarkdownView from '@/components/MarkdownView'

export default {
  name: 'AdminArticleList',
  components: { MarkdownView },
  data() {
    const requiredContent = (rule, value, callback) => {
      if (!value || !String(value).replace(/<[^>]+>/g, '').trim()) {
        callback(new Error('内容不能为空'))
        return
      }
      callback()
    }
    return {
      keyword: '',
      statusFilter: '',
      pageNum: 1,
      total: 0,
      list: [],
      loading: false,
      summary: {
        totalCount: null,
        publishedCount: null,
        totalViewCount: null
      },
      editVisible: false,
      saving: false,
      editForm: {
        id: null,
        articleTitle: '',
        articleContent: '',
        articleType: 1,
        coverImage: ''
      },
      editRules: {
        articleTitle: [
          { required: true, message: '标题不能为空', trigger: 'blur' },
          { max: 100, message: '文章标题最多100字符', trigger: 'blur' }
        ],
        articleContent: [{ validator: requiredContent, trigger: 'blur' }]
      },
      statsVisible: false,
      statsLoading: false,
      statsError: '',
      statsData: null,
      chart: null
    }
  },
  computed: {
    uploadUrl() {
      return (process.env.VUE_APP_BASE_API || '') + '/upload/file/url'
    },
    uploadHeaders() {
      return { Authorization: getToken() || '' }
    }
  },
  created() {
    this.loadSummary()
    this.loadList()
  },
  beforeDestroy() {
    this.disposeChart()
  },
  methods: {
    displayStat(value) {
      return value === null || value === undefined ? '--' : value
    },
    statusTag(status) {
      if (status === 1) return 'success'
      if (status === 2) return 'danger'
      return 'info'
    },
    handleSearch() {
      this.pageNum = 1
      this.loadList()
    },
    onPageChange(page) {
      this.pageNum = page
      this.loadList()
    },
    loadSummary() {
      getAdminArticleSummary().then(res => {
        this.summary = res.data || { totalCount: '--', publishedCount: '--', totalViewCount: '--' }
      }).catch(() => {
        this.summary = { totalCount: null, publishedCount: null, totalViewCount: null }
      })
    },
    loadList() {
      this.loading = true
      getAdminArticlePage({
        pageNum: this.pageNum,
        keyword: this.keyword,
        status: this.statusFilter === '' ? undefined : this.statusFilter
      }).then(res => {
        const data = res.data || {}
        this.list = data.records || []
        this.total = data.total || 0
        this.pageNum = data.pageNum || this.pageNum
      }).finally(() => {
        this.loading = false
      })
    },
    handlePublish(row) {
      this.$confirm('确认发布该文章？', '提示', { type: 'warning' }).then(() => {
        return publishAdminArticle(row.id)
      }).then(() => {
        this.$message.success('发布成功')
        this.loadList()
        this.loadSummary()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || '发布失败，请稍后重试')
      })
    },
    handleUnpublish(row) {
      this.$confirm('确认下架该文章？下架后用户不可见', '提示', { type: 'warning' }).then(() => {
        return unpublishAdminArticle(row.id)
      }).then(() => {
        this.$message.success('下架成功')
        this.loadList()
        this.loadSummary()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || '下架失败')
      })
    },
    handleDelete(row) {
      if (row.status === 1) {
        this.$message.warning('请先下架再删除')
        return
      }
      this.$confirm('确认永久删除该文章？此操作不可恢复', '提示', { type: 'warning' }).then(() => {
        return deleteAdminArticle(row.id)
      }).then(() => {
        this.$message.success('删除成功')
        this.loadList()
        this.loadSummary()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || '删除失败')
      })
    },
    openEdit(row) {
      getAdminArticleDetail(row.id).then(res => {
        const data = res.data || {}
        this.editForm = {
          id: data.id,
          articleTitle: data.articleTitle || '',
          articleContent: data.articleContent || '',
          articleType: data.articleType || 1,
          coverImage: data.coverImage || ''
        }
        this.editVisible = true
        this.$nextTick(() => {
          this.$refs.editForm && this.$refs.editForm.clearValidate()
        })
      })
    },
    openCreate() {
      this.editForm = {
        id: null,
        articleTitle: '',
        articleContent: '',
        articleType: 1,
        coverImage: ''
      }
      this.editVisible = true
      this.$nextTick(() => {
        this.$refs.editForm && this.$refs.editForm.clearValidate()
      })
    },
    resetEdit() {
      this.saving = false
    },
    beforeCover(file) {
      const ok = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!ok) {
        this.$message.error('仅支持 jpg/png')
        return false
      }
      return true
    },
    onCoverSuccess(res) {
      if (res && res.code === 200) {
        this.editForm.coverImage = res.data
      } else {
        this.$message.error((res && res.msg) || '封面上传失败')
      }
    },
    saveEdit() {
      this.$refs.editForm.validate(valid => {
        if (!valid) return
        this.saving = true
        const payload = {
          articleTitle: this.editForm.articleTitle,
          articleContent: this.editForm.articleContent,
          articleType: this.editForm.articleType,
          coverImage: this.editForm.coverImage
        }
        const saveRequest = this.editForm.id
          ? updateAdminArticle(this.editForm.id, payload)
          : createAdminArticle(payload)
        saveRequest.then(() => {
          this.$message.success(this.editForm.id ? '编辑成功' : '新增成功，文章已保存为草稿')
          this.editVisible = false
          this.loadList()
          this.loadSummary()
        }).catch(err => {
          this.$message.error((err && err.message) || '保存失败，请重试')
        }).finally(() => {
          this.saving = false
        })
      })
    },
    openStats(row) {
      this.statsVisible = true
      this.statsLoading = true
      this.statsError = ''
      this.statsData = null
      getAdminArticleStats(row.id).then(res => {
        this.statsData = res.data
        this.statsLoading = false
        this.$nextTick(() => this.renderChart())
      }).catch(() => {
        this.statsLoading = false
        this.statsError = '统计数据加载失败'
      })
    },
    renderChart() {
      this.disposeChart()
      const trend = (this.statsData && this.statsData.trend) || []
      if (!trend.length || !this.$refs.trendChart) return
      this.chart = this.$echarts.init(this.$refs.trendChart)
      this.chart.setOption({
        color: ['#2e7d32'],
        tooltip: { trigger: 'axis' },
        grid: { left: 36, right: 16, top: 24, bottom: 28 },
        xAxis: {
          type: 'category',
          data: trend.map(item => item.date)
        },
        yAxis: { type: 'value', minInterval: 1 },
        series: [{
          name: '阅读量',
          type: 'line',
          smooth: true,
          data: trend.map(item => item.count)
        }]
      })
    },
    disposeChart() {
      if (this.chart) {
        this.chart.dispose()
        this.chart = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.article-admin {
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
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-input {
  width: 260px;
}

.filter-select {
  width: 160px;
}

.search-btn {
  background: #2e7d32;
  border-color: #2e7d32;
}

.pager {
  margin-top: 16px;
  text-align: right;
}

.cover-preview {
  width: 120px;
  height: 72px;
  object-fit: cover;
  border-radius: 4px;
}

.stats-nums {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  div {
    flex: 1;
    background: #f6f8f6;
    padding: 12px;
    border-radius: 6px;
    span {
      display: block;
      color: #909399;
      font-size: 12px;
    }
    strong {
      display: block;
      margin-top: 6px;
      font-size: 20px;
      color: #303133;
    }
  }
}

.trend-chart {
  width: 100%;
  height: 260px;
}

.chart-empty,
.stats-error,
.stats-loading {
  text-align: center;
  color: #909399;
  padding: 24px 0;
}

.stats-error {
  color: #f56c6c;
}

.md-preview {
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid #e8eee8;
  border-radius: 6px;
  background: #f8faf8;
}

.preview-label {
  margin: 0 0 8px;
  font-size: 12px;
  color: #909399;
}
</style>
