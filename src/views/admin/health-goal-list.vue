<template>
  <div class="goal-admin">
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="目标名称关键字"
        clearable
        maxlength="20"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-select v-model="statusFilter" placeholder="全部状态" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="1" label="启用" />
        <el-option :value="0" label="禁用" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
      <el-button class="add-btn" @click="openCreate">新增目标</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border empty-text="暂无健康目标">
      <el-table-column prop="goalName" label="目标名称" width="160" />
      <el-table-column prop="goalTypeName" label="目标类型" width="110" />
      <el-table-column prop="goalDescription" label="描述" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'" size="small">{{ scope.row.statusName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
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

    <el-dialog :title="form.id ? '编辑目标' : '新增目标'" :visible.sync="dialogVisible" width="480px">
      <el-form ref="goalForm" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="目标名称" prop="goalName">
          <el-input v-model="form.goalName" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="目标类型" prop="goalType">
          <el-select v-model="form.goalType" placeholder="请选择类型" style="width: 100%">
            <el-option :value="1" label="减重" />
            <el-option :value="2" label="控糖" />
            <el-option :value="3" label="控压" />
            <el-option :value="4" label="增肌" />
            <el-option :value="5" label="均衡营养" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标描述" prop="goalDescription">
          <el-input v-model="form.goalDescription" type="textarea" :rows="4" maxlength="200" show-word-limit />
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
  checkAdminHealthGoalName,
  createAdminHealthGoal,
  deleteAdminHealthGoal,
  getAdminHealthGoalDetail,
  getAdminHealthGoalPage,
  updateAdminHealthGoal,
  updateAdminHealthGoalStatus
} from '@/api/admin-health-goals'

export default {
  name: 'AdminHealthGoalList',
  data() {
    const uniqueName = (rule, value, callback) => {
      if (!value || !String(value).trim()) {
        callback(new Error('请填写目标名称'))
        return
      }
      if (String(value).trim().length > 20) {
        callback(new Error('目标名称最长20字符'))
        return
      }
      checkAdminHealthGoalName({
        name: String(value).trim(),
        excludeId: this.form.id || undefined
      }).then(res => {
        if (res.data && res.data.available === false) {
          callback(new Error(this.form.id ? '已存在' : '目标名称已存在'))
        } else {
          callback()
        }
      }).catch(() => callback())
    }
    return {
      keyword: '',
      statusFilter: '',
      pageNum: 1,
      total: 0,
      list: [],
      loading: false,
      dialogVisible: false,
      saving: false,
      form: { id: null, goalName: '', goalType: null, goalDescription: '' },
      rules: {
        goalName: [{ required: true, validator: uniqueName, trigger: 'blur' }],
        goalType: [{ required: true, message: '请选择目标类型', trigger: 'change' }],
        goalDescription: [{ max: 200, message: '目标描述最长200字符', trigger: 'blur' }]
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
      getAdminHealthGoalPage({
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
    openCreate() {
      this.form = { id: null, goalName: '', goalType: null, goalDescription: '' }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.goalForm && this.$refs.goalForm.clearValidate())
    },
    openEdit(row) {
      getAdminHealthGoalDetail(row.id).then(res => {
        const data = res.data || {}
        this.form = {
          id: data.id,
          goalName: data.goalName || '',
          goalType: data.goalType,
          goalDescription: data.goalDescription || ''
        }
        this.dialogVisible = true
        this.$nextTick(() => this.$refs.goalForm && this.$refs.goalForm.clearValidate())
      })
    },
    saveForm() {
      this.$refs.goalForm.validate(valid => {
        if (!valid) return
        this.saving = true
        const payload = {
          goalName: this.form.goalName.trim(),
          goalType: this.form.goalType,
          goalDescription: this.form.goalDescription
        }
        const req = this.form.id ? updateAdminHealthGoal(this.form.id, payload) : createAdminHealthGoal(payload)
        req.then(() => {
          this.$message.success(this.form.id ? '编辑成功' : '新增成功')
          this.dialogVisible = false
          this.loadList()
        }).catch(err => {
          this.$message.error((err && err.message) || (this.form.id ? '编辑失败' : '新增失败'))
        }).finally(() => {
          this.saving = false
        })
      })
    },
    toggleStatus(row) {
      const next = row.status === 1 ? 0 : 1
      updateAdminHealthGoalStatus(row.id, next).then(() => {
        this.$message.success(next === 1 ? '已启用' : '已禁用')
        this.loadList()
      }).catch(err => {
        this.$message.error((err && err.message) || '操作失败')
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除该目标？', '提示', { type: 'warning' }).then(() => {
        return deleteAdminHealthGoal(row.id)
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
.goal-admin {
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
  width: 220px;
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
</style>
