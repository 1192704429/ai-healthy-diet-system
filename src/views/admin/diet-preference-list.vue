<template>
  <div class="pref-admin">
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="偏好名称关键字"
        clearable
        maxlength="30"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-select v-model="typeFilter" placeholder="全部类别" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="1" label="口味" />
        <el-option :value="2" label="忌口" />
        <el-option :value="3" label="喜好类别" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
      <el-button class="add-btn" @click="openCreate">新增偏好</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border empty-text="暂无饮食偏好">
      <el-table-column prop="preferenceName" label="偏好名称" width="160" />
      <el-table-column prop="preferenceTypeName" label="类别" width="120" />
      <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
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

    <el-dialog :title="form.id ? '编辑偏好' : '新增偏好'" :visible.sync="dialogVisible" width="480px">
      <el-form ref="prefForm" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="偏好名称" prop="preferenceName">
          <el-input v-model="form.preferenceName" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="偏好类别" prop="preferenceType">
          <el-select v-model="form.preferenceType" placeholder="请选择类别" style="width: 100%">
            <el-option :value="1" label="口味" />
            <el-option :value="2" label="忌口" />
            <el-option :value="3" label="喜好类别" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="4" maxlength="200" show-word-limit />
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
  checkAdminDietPreferenceName,
  createAdminDietPreference,
  deleteAdminDietPreference,
  getAdminDietPreferenceDetail,
  getAdminDietPreferencePage,
  updateAdminDietPreference,
  updateAdminDietPreferenceStatus
} from '@/api/admin-diet-preferences'

export default {
  name: 'AdminDietPreferenceList',
  data() {
    const uniqueName = (rule, value, callback) => {
      if (!value || !String(value).trim()) {
        callback(new Error('请填写偏好名称'))
        return
      }
      if (String(value).trim().length > 30) {
        callback(new Error('偏好名称最长30字符'))
        return
      }
      checkAdminDietPreferenceName({
        name: String(value).trim(),
        excludeId: this.form.id || undefined
      }).then(res => {
        if (res.data && res.data.available === false) {
          callback(new Error(this.form.id ? '已存在' : '偏好名称已存在'))
        } else {
          callback()
        }
      }).catch(() => callback())
    }
    return {
      keyword: '',
      typeFilter: '',
      pageNum: 1,
      total: 0,
      list: [],
      loading: false,
      dialogVisible: false,
      saving: false,
      form: { id: null, preferenceName: '', preferenceType: '', description: '' },
      rules: {
        preferenceName: [{ required: true, validator: uniqueName, trigger: 'blur' }],
        preferenceType: [{ required: true, message: '请选择偏好类别', trigger: 'change' }],
        description: [{ max: 200, message: '描述最长200字符', trigger: 'blur' }]
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
      getAdminDietPreferencePage({
        pageNum: this.pageNum,
        keyword: this.keyword,
        preferenceType: this.typeFilter === '' ? undefined : this.typeFilter
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
      this.form = { id: null, preferenceName: '', preferenceType: '', description: '' }
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.prefForm && this.$refs.prefForm.clearValidate())
    },
    openEdit(row) {
      getAdminDietPreferenceDetail(row.id).then(res => {
        const data = res.data || {}
        this.form = {
          id: data.id,
          preferenceName: data.preferenceName || '',
          preferenceType: data.preferenceType,
          description: data.description || ''
        }
        this.dialogVisible = true
        this.$nextTick(() => this.$refs.prefForm && this.$refs.prefForm.clearValidate())
      })
    },
    saveForm() {
      this.$refs.prefForm.validate(valid => {
        if (!valid) return
        this.saving = true
        const payload = {
          preferenceName: this.form.preferenceName.trim(),
          preferenceType: this.form.preferenceType,
          description: this.form.description
        }
        const req = this.form.id
          ? updateAdminDietPreference(this.form.id, payload)
          : createAdminDietPreference(payload)
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
      updateAdminDietPreferenceStatus(row.id, next).then(() => {
        this.$message.success(next === 1 ? '已启用' : '已禁用')
        this.loadList()
      }).catch(err => {
        this.$message.error((err && err.message) || '操作失败')
      })
    },
    handleDelete(row) {
      this.$confirm('确认删除该偏好？', '提示', { type: 'warning' }).then(() => {
        return deleteAdminDietPreference(row.id)
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
.pref-admin {
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
  width: 160px;
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
