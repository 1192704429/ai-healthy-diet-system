<template>
  <div class="kb-admin">
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="问题关键词关键字"
        clearable
        maxlength="100"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-select v-model="typeFilter" placeholder="全部分类" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="1" label="营养" />
        <el-option :value="2" label="疾病" />
        <el-option :value="3" label="运动" />
        <el-option :value="4" label="其他" />
      </el-select>
      <el-select v-model="statusFilter" placeholder="全部状态" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="1" label="启用" />
        <el-option :value="0" label="禁用" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
      <el-button class="add-btn" @click="openCreate">新增语料</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border empty-text="暂无语料">
      <el-table-column prop="keywords" label="问题关键词" min-width="160" show-overflow-tooltip />
      <el-table-column prop="answer" label="答案内容" min-width="240" show-overflow-tooltip />
      <el-table-column prop="knowledgeTypeName" label="分类" width="90" />
      <el-table-column prop="useCount" label="使用次数" width="100" />
      <el-table-column label="状态" width="90">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">{{ scope.row.statusName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
          <el-button type="text" size="mini" @click="toggleStatus(scope.row)">
            {{ scope.row.status === 1 ? '禁用' : '启用' }}
          </el-button>
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

    <el-dialog :title="form.id ? '编辑语料' : '新增语料'" :visible.sync="dialogVisible" width="560px">
      <el-form ref="kbForm" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="问题关键词" prop="keywords">
          <el-input v-model="form.keywords" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="答案内容" prop="answer">
          <el-input v-model="form.answer" type="textarea" :rows="6" maxlength="2000" show-word-limit placeholder="支持 Markdown" />
          <div v-if="form.answer" class="md-preview">
            <p class="preview-label">预览</p>
            <markdown-view :content="form.answer" />
          </div>
        </el-form-item>
        <el-form-item label="分类" prop="knowledgeType">
          <el-select v-model="form.knowledgeType" placeholder="请选择分类" style="width: 100%">
            <el-option :value="1" label="营养" />
            <el-option :value="2" label="疾病" />
            <el-option :value="3" label="运动" />
            <el-option :value="4" label="其他" />
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveForm">保存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  createAdminAiKnowledge,
  deleteAdminAiKnowledge,
  getAdminAiKnowledgeDetail,
  getAdminAiKnowledgePage,
  updateAdminAiKnowledge,
  updateAdminAiKnowledgeStatus
} from '@/api/admin-ai-knowledge'
import MarkdownView from '@/components/MarkdownView'

export default {
  name: 'AdminAiKnowledgeList',
  components: { MarkdownView },
  data() {
    return {
      keyword: '',
      typeFilter: '',
      statusFilter: '',
      pageNum: 1,
      total: 0,
      list: [],
      loading: false,
      dialogVisible: false,
      saving: false,
      form: { id: null, keywords: '', answer: '', knowledgeType: '' },
      rules: {
        keywords: [
          { required: true, message: '请填写问题关键词', trigger: 'blur' },
          { max: 100, message: '问题关键词最长100字符', trigger: 'blur' }
        ],
        answer: [
          { required: true, message: '请填写答案内容', trigger: 'blur' },
          { max: 2000, message: '答案内容最长2000字符', trigger: 'blur' }
        ],
        knowledgeType: [{ required: true, message: '请选择分类', trigger: 'change' }]
      }
    }
  },
  created() {
    this.loadList()
  },
  methods: {
    handleSearch() {
      this.pageNum = 1
      this.loadList()
    },
    onPageChange(page) {
      this.pageNum = page
      this.loadList()
    },
    loadList() {
      this.loading = true
      getAdminAiKnowledgePage({
        pageNum: this.pageNum,
        keyword: this.keyword,
        knowledgeType: this.typeFilter === '' ? undefined : this.typeFilter,
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
    openCreate() {
      this.form = { id: null, keywords: '', answer: '', knowledgeType: '' }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.kbForm && this.$refs.kbForm.clearValidate())
    },
    openEdit(row) {
      getAdminAiKnowledgeDetail(row.id).then(res => {
        const data = res.data || {}
        this.form = {
          id: data.id,
          keywords: data.keywords || '',
          answer: data.answer || '',
          knowledgeType: data.knowledgeType
        }
        this.dialogVisible = true
        this.$nextTick(() => this.$refs.kbForm && this.$refs.kbForm.clearValidate())
      })
    },
    saveForm() {
      this.$refs.kbForm.validate(valid => {
        if (!valid) return
        this.saving = true
        const payload = {
          keywords: this.form.keywords.trim(),
          answer: this.form.answer.trim(),
          knowledgeType: this.form.knowledgeType
        }
        const req = this.form.id
          ? updateAdminAiKnowledge(this.form.id, payload)
          : createAdminAiKnowledge(payload)
        req.then(() => {
          this.$message.success(this.form.id ? '编辑成功' : '新增成功')
          this.dialogVisible = false
          this.loadList()
        }).catch(err => {
          this.$message.error((err && err.message) || (this.form.id ? '编辑失败' : '新增失败，请重试'))
        }).finally(() => {
          this.saving = false
        })
      })
    },
    toggleStatus(row) {
      const next = row.status === 1 ? 0 : 1
      updateAdminAiKnowledgeStatus(row.id, next).then(() => {
        this.$message.success(next === 1 ? '已启用' : '已禁用')
        this.loadList()
      }).catch(err => {
        this.$message.error((err && err.message) || '操作失败')
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除该语料？', '提示', { type: 'warning' }).then(() => {
        return deleteAdminAiKnowledge(row.id)
      }).then(() => {
        this.$message.success('删除成功')
        this.loadList()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || '删除失败')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.kb-admin {
  padding: 20px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-input {
  width: 240px;
}

.filter-select {
  width: 140px;
}

.search-btn,
.add-btn {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}

.pager {
  margin-top: 16px;
  text-align: right;
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
