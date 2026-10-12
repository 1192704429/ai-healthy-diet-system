<template>
  <div class="food-admin">
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-label">食物总数</div>
        <div class="stat-value">{{ totalCount === null ? '--' : totalCount }}</div>
      </div>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="食物名称关键字"
        clearable
        maxlength="50"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-select v-model="categoryId" placeholder="全部分类" clearable class="filter-select">
        <el-option
          v-for="item in categories"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <el-select v-model="statusFilter" placeholder="全部状态" class="filter-select">
        <el-option value="" label="全部" />
        <el-option :value="0" label="待上架" />
        <el-option :value="1" label="正常" />
        <el-option :value="2" label="下架" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">搜索</el-button>
      <el-button class="add-btn" @click="openCreate">新增食物</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border empty-text="暂无食物">
      <el-table-column label="图片" width="88" align="center">
        <template slot-scope="scope">
          <el-image
            v-if="scope.row.foodImage"
            :src="scope.row.foodImage"
            :preview-src-list="[scope.row.foodImage]"
            fit="cover"
            class="food-thumb"
          >
            <div slot="error" class="thumb-empty">无图</div>
          </el-image>
          <span v-else class="thumb-empty">无图</span>
        </template>
      </el-table-column>
      <el-table-column prop="foodName" label="食物名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column prop="calorie" label="热量(kcal/100g)" width="140" />
      <el-table-column prop="protein" label="蛋白质" width="100" />
      <el-table-column prop="fat" label="脂肪" width="90" />
      <el-table-column prop="carbohydrate" label="碳水化合物" width="120" />
      <el-table-column label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="statusTag(scope.row.status)" size="small">{{ scope.row.statusName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template slot-scope="scope">
          <el-button v-if="scope.row.status !== 2" type="text" size="mini" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-if="scope.row.status === 1" type="text" size="mini" @click="handleOff(scope.row)">下架</el-button>
          <el-button v-else type="text" size="mini" @click="handleOn(scope.row)">上架</el-button>
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

    <el-dialog :title="form.id ? '编辑食物' : '新增食物'" :visible.sync="dialogVisible" width="560px" @close="resetForm">
      <el-form ref="foodForm" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="食物名称" prop="foodName">
          <el-input v-model="form.foodName" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width:100%">
            <el-option
              v-for="item in categories"
              :key="'f-' + item.value"
              :label="item.label"
              :value="Number(item.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="热量(kcal/100g)" prop="calorie">
          <el-input-number v-model="form.calorie" :min="0" :max="1000" :precision="1" :step="0.1" style="width:100%" />
        </el-form-item>
        <el-form-item label="蛋白质(g/100g)" prop="protein">
          <el-input-number v-model="form.protein" :min="0" :max="100" :precision="1" :step="0.1" style="width:100%" />
        </el-form-item>
        <el-form-item label="脂肪(g/100g)" prop="fat">
          <el-input-number v-model="form.fat" :min="0" :max="100" :precision="1" :step="0.1" style="width:100%" />
        </el-form-item>
        <el-form-item label="碳水化合物(g/100g)" prop="carbohydrate">
          <el-input-number v-model="form.carbohydrate" :min="0" :max="100" :precision="1" :step="0.1" style="width:100%" />
        </el-form-item>
        <el-form-item label="图片">
          <img-upload
            :key="(form.id || 'new') + '-' + dialogVisible"
            v-model="form.foodImage"
            :limit="1"
            :file-size="2"
            :file-type="['png', 'jpg', 'jpeg']"
          />
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
  checkAdminFoodName,
  createAdminFood,
  deleteAdminFood,
  getAdminFoodCategories,
  getAdminFoodDetail,
  getAdminFoodPage,
  getAdminFoodSummary,
  offShelfAdminFood,
  onShelfAdminFood,
  updateAdminFood
} from '@/api/admin-foods'
import ImgUpload from '@/components/ImgUpload'

export default {
  name: 'AdminFoodList',
  components: { ImgUpload },
  data() {
    const uniqueName = (rule, value, callback) => {
      if (!value || !String(value).trim()) {
        callback(new Error('请填写食物名称'))
        return
      }
      if (String(value).trim().length > 50) {
        callback(new Error('食物名称最多50字符'))
        return
      }
      checkAdminFoodName({ name: String(value).trim(), excludeId: this.form.id || undefined }).then(res => {
        if (res.data && res.data.available === false) {
          callback(new Error('食物名称已存在'))
        } else {
          callback()
        }
      }).catch(() => callback())
    }
    const numRule = (min, max, label) => (rule, value, callback) => {
      if (value === undefined || value === null || value === '') {
        callback(new Error('请填写' + label))
        return
      }
      const num = Number(value)
      if (Number.isNaN(num) || num < min || num > max) {
        callback(new Error(label + '范围为' + min + '-' + max))
        return
      }
      callback()
    }
    return {
      keyword: '',
      categoryId: '',
      statusFilter: '',
      pageNum: 1,
      total: 0,
      list: [],
      loading: false,
      totalCount: null,
      categories: [],
      dialogVisible: false,
      saving: false,
      form: this.emptyForm(),
      rules: {
        foodName: [{ required: true, validator: uniqueName, trigger: 'blur' }],
        categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
        calorie: [{ required: true, validator: numRule(0, 1000, '热量'), trigger: 'change' }],
        protein: [{ required: true, validator: numRule(0, 100, '蛋白质'), trigger: 'change' }],
        fat: [{ required: true, validator: numRule(0, 100, '脂肪'), trigger: 'change' }],
        carbohydrate: [{ required: true, validator: numRule(0, 100, '碳水化合物'), trigger: 'change' }]
      }
    }
  },
  created() {
    this.loadCategories()
    this.loadSummary()
    this.loadList()
  },
  methods: {
    emptyForm() {
      return {
        id: null,
        foodName: '',
        categoryId: null,
        calorie: undefined,
        protein: undefined,
        fat: undefined,
        carbohydrate: undefined,
        foodImage: ''
      }
    },
    statusTag(status) {
      if (status === 1) return 'success'
      if (status === 2) return 'info'
      return 'warning'
    },
    handleSearch() {
      this.pageNum = 1
      this.loadList()
    },
    onPageChange(page) {
      this.pageNum = page
      this.loadList()
    },
    loadCategories() {
      getAdminFoodCategories().then(res => {
        this.categories = res.data || []
      })
    },
    loadSummary() {
      getAdminFoodSummary().then(res => {
        this.totalCount = res.data && res.data.totalCount != null ? res.data.totalCount : null
      }).catch(() => {
        this.totalCount = null
      })
    },
    loadList() {
      this.loading = true
      getAdminFoodPage({
        pageNum: this.pageNum,
        keyword: this.keyword,
        categoryId: this.categoryId || undefined,
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
      this.form = this.emptyForm()
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.foodForm && this.$refs.foodForm.clearValidate())
    },
    openEdit(row) {
      getAdminFoodDetail(row.id).then(res => {
        const data = res.data || {}
        this.form = {
          id: data.id,
          foodName: data.foodName || '',
          categoryId: data.categoryId == null ? null : Number(data.categoryId),
          calorie: data.calorie,
          protein: data.protein,
          fat: data.fat,
          carbohydrate: data.carbohydrate,
          foodImage: data.foodImage || ''
        }
        this.dialogVisible = true
        this.$nextTick(() => this.$refs.foodForm && this.$refs.foodForm.clearValidate())
      })
    },
    resetForm() {
      this.saving = false
    },
    saveForm() {
      this.$refs.foodForm.validate(valid => {
        if (!valid) return
        this.saving = true
        const payload = {
          foodName: this.form.foodName.trim(),
          categoryId: this.form.categoryId,
          calorie: this.form.calorie,
          protein: this.form.protein,
          fat: this.form.fat,
          carbohydrate: this.form.carbohydrate,
          foodImage: this.form.foodImage
        }
        const req = this.form.id ? updateAdminFood(this.form.id, payload) : createAdminFood(payload)
        req.then(() => {
          this.$message.success(this.form.id ? '编辑成功' : '新增成功')
          this.dialogVisible = false
          this.loadList()
          this.loadSummary()
        }).catch(err => {
          this.$message.error((err && err.message) || (this.form.id ? '编辑失败，请重试' : '新增失败，请重试'))
        }).finally(() => {
          this.saving = false
        })
      })
    },
    handleOn(row) {
      onShelfAdminFood(row.id).then(() => {
        this.$message.success('上架成功')
        this.loadList()
        this.loadSummary()
      }).catch(err => {
        this.$message.error((err && err.message) || '上架失败')
      })
    },
    handleOff(row) {
      this.$confirm('确认下架该食物？', '提示', { type: 'warning' }).then(() => {
        return offShelfAdminFood(row.id)
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
      this.$confirm('确认永久删除该食物？', '提示', { type: 'warning' }).then(() => {
        return deleteAdminFood(row.id)
      }).then(() => {
        this.$message.success('删除成功')
        this.loadList()
        this.loadSummary()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || '删除失败')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.food-admin {
  padding: 20px;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  display: inline-block;
  min-width: 200px;
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
  width: 150px;
}

.search-btn,
.add-btn {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}

.add-btn:hover,
.search-btn:hover {
  background: #1b5e20;
  border-color: #1b5e20;
  color: #fff;
}

.pager {
  margin-top: 16px;
  text-align: right;
}

.food-thumb {
  width: 52px;
  height: 52px;
  border-radius: 4px;
}

.thumb-empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 4px;
  background: #f5f7fa;
  color: #909399;
  font-size: 12px;
}

</style>
