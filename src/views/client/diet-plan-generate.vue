<template>
  <div class="plan-gen-page">
    <div class="page-head">
      <h2>AI生成饮食计划</h2>
      <span class="status-tag" :class="planStatus">{{ statusText }}</span>
    </div>

    <section class="panel summary">
      <div class="date-field">
        <span class="field-label">计划日期</span>
        <el-date-picker
          v-model="planDate"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="推荐当天"
          :picker-options="dateOptions"
          @change="onDateChange"
        />
      </div>
      <div class="summary-text">
        身高 {{ profile.height || '--' }} ·
        体重 {{ profile.weight || '--' }} ·
        目标 {{ profile.goalName || '未设置' }} ·
        偏好 {{ preferenceText }}
      </div>
      <el-button
        v-if="profile.profileReady === false || profile.goalReady === false"
        type="text"
        class="link-btn"
        @click="$router.push('/user/health-profile')"
      >去完善</el-button>
    </section>

    <div v-if="existHint" class="exist-bar">{{ existHint }}</div>

    <div class="actions">
      <el-button class="primary-btn" :loading="generating" @click="generate(false)">生成今日计划</el-button>
      <el-button v-if="exists" :loading="generating" @click="generate(true)">重新生成</el-button>
    </div>

    <div v-if="genError" class="state-box">
      <p>{{ genError }}</p>
      <el-button class="primary-btn" @click="generate(lastRegenerate)">重试</el-button>
    </div>

    <div v-loading="generating">
      <div class="totals" v-if="hasPlan">
        合计 {{ formatNumber(totals.calorie) }} 千卡 ·
        蛋白质 {{ formatNumber(totals.protein) }}g ·
        脂肪 {{ formatNumber(totals.fat) }}g ·
        碳水 {{ formatNumber(totals.carbohydrate) }}g
      </div>
      <markdown-view v-if="advice" class="advice" :content="advice" />

      <section v-for="meal in meals" :key="meal.code" class="panel meal-panel">
        <div class="meal-head">
          <h3>{{ meal.name }}</h3>
          <el-button type="text" class="link-btn" @click="openAdd(meal)">添加食物</el-button>
        </div>
        <table v-if="meal.foods && meal.foods.length" class="meal-table">
          <thead>
            <tr>
              <th>食物</th>
              <th>份量</th>
              <th>热量</th>
              <th>来源</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(food, index) in meal.foods" :key="food.foodId + '-' + index">
              <td>{{ food.foodName }}</td>
              <td>
                <el-input v-model="food.portion" size="mini" class="portion-input" @change="onPortionChange(food)" />
                {{ food.unit || 'g' }}
              </td>
              <td>{{ formatNumber(food.calorie) }} 千卡</td>
              <td>{{ food.source || 'AI' }}</td>
              <td>
                <el-button type="text" class="danger-btn" @click="removeFood(meal, index)">删除食物</el-button>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">暂无食物，可添加或等待生成</p>
      </section>
    </div>

    <div class="save-bar">
      <el-button @click="cancel">取消</el-button>
      <el-button class="primary-btn" :loading="saving" @click="savePlan">保存计划</el-button>
    </div>

    <el-dialog title="添加食物" :visible.sync="addVisible" width="520px">
      <el-input v-model="foodKeyword" placeholder="搜索食物" size="small" clearable @keyup.enter.native="searchFood" @clear="searchFood">
        <el-button slot="append" @click="searchFood">搜索</el-button>
      </el-input>
      <p class="dialog-tip">{{ foodKeyword ? '搜索结果' : '推荐列表' }}</p>
      <div v-loading="foodLoading" class="food-list">
        <button
          v-for="item in foodList"
          :key="item.id"
          type="button"
          class="food-option"
          :class="{ active: Number(selectedFoodId) === Number(item.id) }"
          @click="selectedFoodId = Number(item.id)"
        >
          <strong>{{ item.name }}</strong>
          <span>{{ item.unit }} · {{ formatNumber(item.calorie) }} 千卡</span>
        </button>
        <p v-if="!foodLoading && !foodList.length" class="muted">暂无相关食物</p>
      </div>
      <el-form label-width="64px">
        <el-form-item label="份量">
          <el-input v-model="addPortion" placeholder="大于0" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addVisible = false">取消</el-button>
        <el-button class="primary-btn" @click="confirmAdd">添加</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getDailyPlan, generateDailyPlan, saveDailyPlan } from '@/api/client-daily-plan'
import { getFoodList, getFoodDetail } from '@/api/client-food'
import MarkdownView from '@/components/MarkdownView'

export default {
  name: 'ClientDietPlanGenerate',
  components: { MarkdownView },
  data() {
    return {
      planDate: this.todayText(),
      profile: {},
      meals: this.emptyMeals(),
      totals: { calorie: 0, protein: 0, fat: 0, carbohydrate: 0 },
      advice: '',
      exists: false,
      existHint: '',
      planStatus: 'draft',
      generating: false,
      saving: false,
      genError: '',
      addVisible: false,
      addMeal: null,
      foodKeyword: '',
      foodList: [],
      foodLoading: false,
      selectedFoodId: null,
      addPortion: '100',
      lastRegenerate: false,
      dateOptions: {
        disabledDate(date) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return date.getTime() < today.getTime()
        }
      }
    }
  },
  computed: {
    preferenceText() {
      const list = this.profile.preferences || []
      return list.length ? list.join('、') : '未设置'
    },
    statusText() {
      return this.planStatus === 'saved' ? '已保存' : '草稿'
    },
    hasPlan() {
      return this.meals.some(meal => meal.foods && meal.foods.length)
    }
  },
  created() {
    this.loadPage()
  },
  methods: {
    todayText() {
      const date = new Date()
      const pad = value => (value < 10 ? '0' + value : '' + value)
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
    },
    emptyMeals() {
      return [
        { code: 'breakfast', name: '早餐', foods: [] },
        { code: 'lunch', name: '午餐', foods: [] },
        { code: 'dinner', name: '晚餐', foods: [] },
        { code: 'snack', name: '加餐', foods: [] }
      ]
    },
    applyData(data) {
      this.profile = (data && data.profile) || {}
      this.meals = (data && data.meals && data.meals.length) ? data.meals.map(meal => ({
        ...meal,
        foods: (meal.foods || []).map(food => ({ ...food, lastPortion: Number(food.portion || 100) }))
      })) : this.emptyMeals()
      this.totals = (data && data.totals) || { calorie: 0, protein: 0, fat: 0, carbohydrate: 0 }
      this.advice = (data && data.advice) || ''
      this.exists = Boolean(data && data.exists)
      this.planStatus = (data && data.status) || 'draft'
      this.existHint = this.exists
        ? (this.planDate === this.todayText() ? '今日已有计划，您可修改后保存' : '该日期已有计划，您可修改后保存')
        : ''
      this.recalc()
    },
    async loadPage() {
      this.genError = ''
      try {
        const res = await getDailyPlan({ planDate: this.planDate })
        this.applyData((res && res.data) || {})
      } catch (error) {
        this.genError = (error && error.message) || '加载失败，请稍后重试'
      }
    },
    onDateChange() {
      if (!this.planDate) {
        this.planDate = this.todayText()
      }
      this.loadPage()
    },
    async generate(regenerate) {
      this.lastRegenerate = Boolean(regenerate)
      if (this.profile.profileReady === false || this.profile.goalReady === false) {
        try {
          await this.$confirm('请先完善健康档案和设置健康目标', '提示', {
            confirmButtonText: '去设置',
            type: 'warning'
          })
          this.$router.push('/user/health-profile')
        } catch (error) {
        }
        return
      }
      if (regenerate && this.exists) {
        try {
          await this.$confirm('将覆盖当天计划，是否重新生成？', '提示', { type: 'warning' })
        } catch (error) {
          return
        }
      }
      this.generating = true
      this.genError = ''
      try {
        const res = await generateDailyPlan({
          planDate: this.planDate,
          regenerate: Boolean(regenerate),
          planId: this.$route.query.planId ? Number(this.$route.query.planId) : undefined
        })
        this.applyData((res && res.data) || {})
        if (regenerate) {
          this.planStatus = 'draft'
        }
        this.$message.success(regenerate ? '已重新生成计划' : '已生成计划')
      } catch (error) {
        const message = error && error.message ? error.message : ''
        if (message.indexOf('完善健康档案') !== -1) {
          this.genError = '请先完善健康档案和设置健康目标'
          this.$message.error(this.genError)
        } else if (message.indexOf('稍后') !== -1) {
          this.genError = '生成失败，请稍后'
        } else {
          this.genError = '生成失败，请重试或手动编辑'
        }
      } finally {
        this.generating = false
      }
    },
    async openAdd(meal) {
      this.addMeal = meal
      this.addVisible = true
      this.selectedFoodId = null
      this.addPortion = '100'
      this.foodKeyword = ''
      await this.searchFood()
    },
    async searchFood() {
      this.foodLoading = true
      try {
        const res = await getFoodList({ keyword: this.foodKeyword || undefined, current: 1, size: 10 })
        const data = (res && res.data) || {}
        this.foodList = data.records || []
      } catch (error) {
        this.foodList = []
      } finally {
        this.foodLoading = false
      }
    },
    async confirmAdd() {
      if (!this.selectedFoodId) {
        this.$message.error('请选择食物')
        return
      }
      const portion = Number(this.addPortion)
      if (!portion || portion <= 0) {
        this.$message.error('份量必须大于0')
        return
      }
      try {
        const res = await getFoodDetail(this.selectedFoodId)
        const detail = (res && res.data) || {}
        const item = this.scaleFood(detail, portion, '手动')
        this.addMeal.foods.push(item)
        this.planStatus = 'draft'
        this.recalc()
        this.addVisible = false
      } catch (error) {
        this.$message.error('请选择食物')
      }
    },
    async removeFood(meal, index) {
      try {
        await this.$confirm('确认删除该食物？', '提示', { type: 'warning' })
      } catch (error) {
        return
      }
      meal.foods.splice(index, 1)
      this.planStatus = 'draft'
      this.recalc()
    },
    onPortionChange(food) {
      const portion = Number(food.portion)
      if (!portion || portion <= 0) {
        this.$message.error('份量必须大于0')
        food.portion = food.lastPortion || 100
        return
      }
      const prev = Number(food.lastPortion || 0)
      if (prev > 0) {
        const ratio = portion / prev
        food.calorie = Number(food.calorie || 0) * ratio
        food.protein = Number(food.protein || 0) * ratio
        food.fat = Number(food.fat || 0) * ratio
        food.carbohydrate = Number(food.carbohydrate || 0) * ratio
      }
      food.lastPortion = portion
      this.planStatus = 'draft'
      this.recalc()
    },
    scaleFood(detail, portion, source) {
      const base = Number(detail.servingSize || 100) || 100
      const ratio = portion / base
      return {
        foodId: detail.id,
        foodName: detail.name,
        portion,
        unit: 'g',
        calorie: Number(detail.calorie || 0) * ratio,
        protein: Number(detail.protein || 0) * ratio,
        fat: Number(detail.fat || 0) * ratio,
        carbohydrate: Number(detail.carbohydrate || 0) * ratio,
        source,
        lastPortion: portion
      }
    },
    recalc() {
      const totals = { calorie: 0, protein: 0, fat: 0, carbohydrate: 0 }
      this.meals.forEach(meal => {
        (meal.foods || []).forEach(food => {
          totals.calorie += Number(food.calorie || 0)
          totals.protein += Number(food.protein || 0)
          totals.fat += Number(food.fat || 0)
          totals.carbohydrate += Number(food.carbohydrate || 0)
        })
      })
      this.totals = totals
    },
    async savePlan() {
      const mainMeals = this.meals.filter(meal => ['breakfast', 'lunch', 'dinner'].indexOf(meal.code) !== -1 && meal.foods && meal.foods.length)
      if (!mainMeals.length) {
        this.$message.error('请至少添加一顿餐食')
        return
      }
      const invalid = this.meals.some(meal => (meal.foods || []).some(food => !Number(food.portion) || Number(food.portion) <= 0))
      if (invalid) {
        this.$message.error('份量必须大于0')
        return
      }
      try {
        await this.$confirm(this.exists ? '将覆盖当天计划，确认保存？' : '确认保存该计划？', '提示', { type: 'warning' })
      } catch (error) {
        return
      }
      this.saving = true
      try {
        await saveDailyPlan({
          planDate: this.planDate,
          meals: this.meals,
          advice: this.advice
        })
        this.planStatus = 'saved'
        this.exists = true
        this.$message.success('计划已保存')
        this.$router.push('/user/diet-record')
      } catch (error) {
        const message = error && error.message ? error.message : ''
        if (message.indexOf('一顿') !== -1) {
          this.$message.error('请至少添加一顿餐食')
        } else if (message.indexOf('份量') !== -1) {
          this.$message.error('份量必须大于0')
        } else {
          this.$message.error('保存失败，请重试')
        }
      } finally {
        this.saving = false
      }
    },
    cancel() {
      this.$router.back()
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
.plan-gen-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-head h2 {
  margin: 0;
  color: #1f3d24;
}

.status-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #fff8e8;
  color: #7a5b16;
}

.status-tag.saved {
  background: #e8f5e9;
  color: #2e7d32;
}

.panel,
.summary {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.summary-text,
.muted,
.advice,
.totals {
  color: #3f5344;
  font-size: 13px;
  line-height: 1.6;
}

.exist-bar {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fff8e8;
  border: 1px solid #f0e0b8;
  border-radius: 8px;
  color: #7a5b16;
}

.actions,
.save-bar {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.save-bar {
  justify-content: flex-end;
}

.totals,
.advice {
  margin: 12px 0 0;
}

.advice {
  background: #f3faf3;
  padding: 10px 12px;
  border-radius: 8px;
}

.meal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meal-head h3 {
  margin: 0;
  color: #1f3d24;
}

.date-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label,
.dialog-tip {
  font-size: 13px;
  color: #3f5344;
}

.dialog-tip {
  margin: 10px 0 6px;
}

.meal-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
  font-size: 13px;
}

.meal-table th {
  text-align: left;
  padding: 6px 4px;
  color: #6b7c6e;
  font-weight: 500;
  border-bottom: 1px solid #e3eee3;
}

.meal-table td {
  padding: 8px 4px;
  border-bottom: 1px solid #eef3ee;
  color: #3f5344;
}

.portion-input {
  width: 72px;
}

.food-list {
  max-height: 240px;
  overflow: auto;
  margin: 12px 0;
}

.food-option {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  margin-bottom: 6px;
  border: 1px solid #e3eee3;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.food-option.active {
  border-color: #2e7d32;
  background: #f3faf3;
}

.food-option span {
  display: block;
  color: #6b7c6e;
  font-size: 12px;
  margin-top: 4px;
}

.link-btn,
.link-btn:hover {
  color: #2e7d32;
}

.danger-btn,
.danger-btn:hover {
  color: #c62828;
}

.state-box {
  margin-top: 16px;
  padding: 20px;
  text-align: center;
  color: #6b7c6e;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
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
</style>
