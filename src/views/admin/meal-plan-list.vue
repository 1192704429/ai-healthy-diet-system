<template>
  <div class="plan-admin">
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="方案名称关键字"
        clearable
        maxlength="50"
        class="filter-input"
        @keyup.enter.native="handleSearch"
      />
      <el-select v-model="goalId" placeholder="全部目标" clearable class="filter-select">
        <el-option
          v-for="item in goals"
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
      <el-button class="add-btn" @click="openCreate">新增方案</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border empty-text="暂无饮食方案">
      <el-table-column prop="planName" label="方案名称" min-width="150" show-overflow-tooltip />
      <el-table-column prop="goalNames" label="适用目标" min-width="160" show-overflow-tooltip />
      <el-table-column prop="dailyCalorie" label="总热量" width="100" />
      <el-table-column prop="mealCount" label="餐次数量" width="90" />
      <el-table-column label="状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="statusTag(scope.row.status)" size="small">{{ scope.row.statusName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
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

    <el-dialog :title="form.id ? '编辑方案' : '新增方案'" :visible.sync="dialogVisible" width="720px" @close="saving = false">
      <el-form ref="planForm" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="方案名称" prop="planName">
          <el-input v-model="form.planName" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="适用目标" prop="goalIds">
          <el-select v-model="form.goalIds" multiple placeholder="可多选" style="width:100%">
            <el-option
              v-for="item in goals"
              :key="'g-' + item.value"
              :label="item.label"
              :value="Number(item.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="总热量(kcal)" prop="dailyCalorie">
          <el-input-number v-model="form.dailyCalorie" :min="500" :max="5000" :precision="0" :step="50" style="width:100%" />
        </el-form-item>
        <el-form-item
          v-for="meal in mealMeta"
          :key="meal.key"
          :label="meal.label"
          :required="meal.required"
        >
          <div v-for="(row, index) in form[meal.key]" :key="meal.key + index" class="meal-row">
            <el-input v-model="row.foodName" placeholder="食物名称" class="food-name" />
            <el-input-number v-model="row.portion" :min="1" :max="2000" :precision="0" class="food-portion" />
            <span class="unit">g</span>
            <el-button type="text" @click="removeFood(meal.key, index)">删除</el-button>
          </div>
          <el-button size="mini" @click="addFood(meal.key)">添加食物</el-button>
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
  createAdminMealPlan,
  deleteAdminMealPlan,
  getAdminMealPlanDetail,
  getAdminMealPlanGoals,
  getAdminMealPlanPage,
  offShelfAdminMealPlan,
  onShelfAdminMealPlan,
  updateAdminMealPlan
} from '@/api/admin-meal-plans'

export default {
  name: 'AdminMealPlanList',
  data() {
    const checkCalorie = (rule, value, callback) => {
      if (value === undefined || value === null || value === '') {
        callback(new Error('请填写总热量'))
        return
      }
      const num = Number(value)
      if (!Number.isInteger(num) || num < 500 || num > 5000) {
        callback(new Error('总热量须为500-5000的整数'))
        return
      }
      callback()
    }
    return {
      keyword: '',
      goalId: '',
      statusFilter: '',
      pageNum: 1,
      total: 0,
      list: [],
      loading: false,
      goals: [],
      dialogVisible: false,
      saving: false,
      mealMeta: [
        { key: 'breakfast', label: '早餐', required: true },
        { key: 'lunch', label: '午餐', required: true },
        { key: 'dinner', label: '晚餐', required: true },
        { key: 'snack', label: '加餐', required: false }
      ],
      form: this.emptyForm(),
      rules: {
        planName: [
          { required: true, message: '请填写方案名称', trigger: 'blur' },
          { max: 50, message: '方案名称最多50字符', trigger: 'blur' }
        ],
        goalIds: [{ type: 'array', required: true, min: 1, message: '请选择适用目标', trigger: 'change' }],
        dailyCalorie: [{ required: true, validator: checkCalorie, trigger: 'change' }]
      }
    }
  },
  created() {
    this.loadGoals()
    this.loadList()
  },
  methods: {
    emptyMeal() {
      return { foodName: '', portion: 100, unit: 'g' }
    },
    emptyForm() {
      return {
        id: null,
        planName: '',
        goalIds: [],
        dailyCalorie: 1800,
        breakfast: [this.emptyMeal()],
        lunch: [this.emptyMeal()],
        dinner: [this.emptyMeal()],
        snack: []
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
    loadGoals() {
      getAdminMealPlanGoals().then(res => {
        this.goals = res.data || []
      })
    },
    loadList() {
      this.loading = true
      getAdminMealPlanPage({
        pageNum: this.pageNum,
        keyword: this.keyword,
        goalId: this.goalId || undefined,
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
    addFood(key) {
      this.form[key].push(this.emptyMeal())
    },
    removeFood(key, index) {
      this.form[key].splice(index, 1)
    },
    validMeals() {
      const required = [
        { key: 'breakfast', label: '早餐' },
        { key: 'lunch', label: '午餐' },
        { key: 'dinner', label: '晚餐' }
      ]
      for (let i = 0; i < required.length; i++) {
        const meal = required[i]
        const rows = (this.form[meal.key] || []).filter(item => item.foodName && String(item.foodName).trim() && item.portion > 0)
        if (!rows.length) {
          this.$message.error(meal.label + '需指定食物及份量')
          return false
        }
      }
      return true
    },
    openCreate() {
      this.form = this.emptyForm()
      this.dialogVisible = true
      this.$nextTick(() => this.$refs.planForm && this.$refs.planForm.clearValidate())
    },
    openEdit(row) {
      getAdminMealPlanDetail(row.id).then(res => {
        const data = res.data || {}
        this.form = {
          id: data.id,
          planName: data.planName || '',
          goalIds: (data.goalIds || []).map(id => Number(id)),
          dailyCalorie: data.dailyCalorie,
          breakfast: this.asMeals(data.breakfast),
          lunch: this.asMeals(data.lunch),
          dinner: this.asMeals(data.dinner),
          snack: this.asMeals(data.snack, true)
        }
        this.dialogVisible = true
        this.$nextTick(() => this.$refs.planForm && this.$refs.planForm.clearValidate())
      })
    },
    asMeals(list, allowEmpty) {
      const rows = (list || []).map(item => ({
        foodId: item.foodId,
        foodName: item.foodName || '',
        portion: item.portion || 100,
        unit: item.unit || 'g'
      }))
      if (!rows.length && !allowEmpty) {
        return [this.emptyMeal()]
      }
      return rows
    },
    saveForm() {
      this.$refs.planForm.validate(valid => {
        if (!valid) return
        if (!this.validMeals()) return
        this.saving = true
        const payload = {
          planName: this.form.planName.trim(),
          goalIds: this.form.goalIds,
          dailyCalorie: this.form.dailyCalorie,
          breakfast: this.form.breakfast,
          lunch: this.form.lunch,
          dinner: this.form.dinner,
          snack: this.form.snack
        }
        const req = this.form.id ? updateAdminMealPlan(this.form.id, payload) : createAdminMealPlan(payload)
        req.then(() => {
          this.$message.success(this.form.id ? '编辑成功' : '新增成功')
          this.dialogVisible = false
          this.loadList()
        }).catch(err => {
          this.$message.error((err && err.message) || (this.form.id ? '编辑失败，请重试' : '新增失败，请重试'))
        }).finally(() => {
          this.saving = false
        })
      })
    },
    handleOn(row) {
      onShelfAdminMealPlan(row.id).then(() => {
        this.$message.success('上架成功')
        this.loadList()
      }).catch(err => {
        this.$message.error((err && err.message) || '上架失败')
      })
    },
    handleOff(row) {
      this.$confirm('确认下架该方案？', '提示', { type: 'warning' }).then(() => {
        return offShelfAdminMealPlan(row.id)
      }).then(() => {
        this.$message.success('下架成功')
        this.loadList()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || '下架失败')
      })
    },
    handleDelete(row) {
      if (row.status === 1) {
        this.$message.warning('请先下架')
        return
      }
      this.$confirm('确认永久删除该方案？', '提示', { type: 'warning' }).then(() => {
        return deleteAdminMealPlan(row.id)
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
.plan-admin {
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

.meal-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.food-name {
  flex: 1;
}

.food-portion {
  width: 130px;
}

.unit {
  color: #909399;
  font-size: 12px;
}
</style>
