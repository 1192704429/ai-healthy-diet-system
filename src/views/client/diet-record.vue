<template>
  <div class="record-page">
    <div class="page-head">
      <h2>饮食记录</h2>
      <div class="date-tools">
        <el-date-picker
          v-model="recordDate"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="选择日期"
          @change="onDateChange"
        />
        <el-button size="small" @click="goToday">今天</el-button>
      </div>
    </div>

    <div class="layout">
      <div class="main">
        <section class="quick-record-grid">
          <div class="action-card manual-card">
            <div>
              <p class="card-kicker">手动记录</p>
              <h3>从食物库选择</h3>
              <p class="card-desc">适合精确记录食物、份量和餐次，营养数据会自动计算。</p>
            </div>
            <el-button class="primary-btn add-btn" @click="openAdd">添加一餐</el-button>
          </div>

          <div class="action-card ai-card">
            <div class="ai-card-head">
              <div>
                <p class="card-kicker">AI 解析</p>
                <h3>一句话快速记录</h3>
              </div>
              <span class="auto-tag">自动入库</span>
            </div>
            <el-input
              v-model="naturalLanguage"
              type="textarea"
              :rows="4"
              placeholder="例如：午饭吃了一份三文鱼和半碗米饭"
              @input="parseLocked = false"
            />
            <div class="tab-toolbar">
              <el-button class="primary-btn" :loading="parsing" @click="parseText">解析并记录</el-button>
              <el-button :loading="parsing" @click="confirmParse">{{ parseLocked ? '已入库' : '确认入库' }}</el-button>
            </div>
            <p v-if="parseMessage" class="success-text">{{ parseMessage }}</p>
            <div v-if="parseError" class="error-row">
              <p class="error-text">{{ parseError }}</p>
              <el-button v-if="parseError.indexOf('手动') !== -1" type="text" class="link-btn" @click="openAdd">去手动记录</el-button>
            </div>
            <div v-if="parsePreview.length" class="preview-list">
              <p class="muted">解析结果预览（已入库 {{ parsePreview.length }} 条）</p>
              <div v-for="item in parsePreview" :key="item.id || item.foodName" class="preview-item">
                <strong>{{ item.foodName }}</strong>
                <span>{{ item.mealTypeName }} · {{ formatNumber(item.portion) }}g · {{ formatNumber(item.calorie) }} 千卡</span>
              </div>
            </div>
          </div>
        </section>

        <section class="records-panel panel">
          <div class="records-head">
            <div>
              <p class="card-kicker">饮食明细</p>
              <h3>{{ recordDate }} 记录</h3>
            </div>
            <el-select v-model="mealFilter" placeholder="餐次" size="small" class="filter-select" @change="loadRecords">
              <el-option label="全部餐次" :value="''" />
              <el-option v-for="item in mealOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>

          <div v-if="listError" class="state-box">
            <p>{{ listError }}</p>
            <el-button class="primary-btn" @click="loadRecords">重试</el-button>
          </div>
          <div v-else v-loading="loading">
            <table v-if="records.length" class="record-table">
              <thead>
                <tr>
                  <th>食物</th>
                  <th>份量</th>
                  <th>餐次</th>
                  <th>热量</th>
                  <th>来源</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in records" :key="item.id">
                  <td>{{ item.foodName }}</td>
                  <td>{{ formatNumber(item.portion) }} g</td>
                  <td>{{ item.mealTypeName }}</td>
                  <td>{{ formatNumber(item.calorie) }} 千卡</td>
                  <td>{{ item.sourceName }}</td>
                  <td>{{ item.recordTime }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="state-box">
              <p>暂无饮食记录</p>
              <p class="muted">可以手动添加，也可以用 AI 一句话记录。</p>
            </div>
          </div>
        </section>
      </div>

      <aside class="stats panel">
        <h3>{{ statsTitle }}</h3>
        <p>总热量 {{ formatNumber(stats.calorie) }} 千卡</p>
        <p>蛋白质 {{ formatNumber(stats.protein) }} g</p>
        <p>脂肪 {{ formatNumber(stats.fat) }} g</p>
        <p>碳水 {{ formatNumber(stats.carbohydrate) }} g</p>
        <p class="muted">目标上限 {{ formatNumber(stats.calorieTarget) }} 千卡</p>
        <p :class="Number(stats.calorieDiff) < 0 ? 'over' : 'remain'">
          {{ Number(stats.calorieDiff) < 0 ? '超出' : '剩余' }}
          {{ formatNumber(Math.abs(Number(stats.calorieDiff || 0))) }} 千卡
          <span v-if="stats.goalName">（{{ stats.goalName }}）</span>
        </p>
      </aside>
    </div>

    <el-dialog title="添加记录" :visible.sync="addVisible" width="520px">
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
          :class="{ active: Number(addForm.foodId) === Number(item.id) }"
          @click="addForm.foodId = Number(item.id)"
        >
          <strong>{{ item.name }}</strong>
          <span>{{ item.unit }} · {{ formatNumber(item.calorie) }} 千卡</span>
        </button>
        <p v-if="!foodLoading && !foodList.length" class="muted">暂无相关食物</p>
      </div>
      <el-form label-width="64px">
        <el-form-item label="份量">
          <el-input v-model="addForm.portion" placeholder="大于0" />
        </el-form-item>
        <el-form-item label="餐次">
          <el-select v-model="addForm.mealType" placeholder="请选择">
            <el-option v-for="item in mealOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addVisible = false">取消</el-button>
        <el-button class="primary-btn" :loading="saving" @click="submitManual">保存</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { getDietRecords, addManualDietRecord, parseDietRecord } from '@/api/client-diet-record'
import { getFoodList } from '@/api/client-food'

export default {
  name: 'ClientDietRecord',
  data() {
    return {
      recordDate: this.todayText(),
      mealFilter: '',
      records: [],
      stats: {},
      loading: false,
      listError: '',
      mealOptions: [
        { label: '早餐', value: 1 },
        { label: '午餐', value: 2 },
        { label: '晚餐', value: 3 },
        { label: '加餐', value: 4 }
      ],
      addVisible: false,
      foodKeyword: '',
      foodList: [],
      foodLoading: false,
      saving: false,
      addForm: { foodId: null, portion: '100', mealType: 1 },
      naturalLanguage: '',
      parsing: false,
      parsePreview: [],
      parseMessage: '',
      parseError: '',
      parseLocked: false
    }
  },
  computed: {
    statsTitle() {
      const today = this.todayText()
      return this.recordDate === today ? '今日营养统计' : (this.recordDate || '') + ' 营养统计'
    }
  },
  created() {
    this.loadRecords()
    if (this.$route.query.foodId) {
      this.openAdd()
    }
  },
  methods: {
    todayText() {
      const date = new Date()
      const pad = value => (value < 10 ? '0' + value : '' + value)
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
    },
    goToday() {
      this.recordDate = this.todayText()
      this.loadRecords()
    },
    onDateChange() {
      if (!this.recordDate) {
        this.recordDate = this.todayText()
      }
      this.loadRecords()
    },
    async loadRecords() {
      this.loading = true
      this.listError = ''
      try {
        const res = await getDietRecords({
          recordDate: this.recordDate,
          mealType: this.mealFilter || undefined
        })
        const data = (res && res.data) || {}
        this.records = data.records || []
        this.stats = data.stats || {}
      } catch (error) {
        this.listError = '加载失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    async openAdd() {
      this.addVisible = true
      this.addForm = {
        foodId: this.$route.query.foodId ? Number(this.$route.query.foodId) : null,
        portion: '100',
        mealType: this.defaultMealType()
      }
      this.foodKeyword = this.$route.query.foodName || ''
      await this.searchFood()
    },
    defaultMealType() {
      const hour = new Date().getHours()
      if (hour < 10) {
        return 1
      }
      if (hour < 14) {
        return 2
      }
      if (hour < 17) {
        return 4
      }
      return 3
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
    async submitManual() {
      if (!this.addForm.foodId) {
        this.$message.error('请选择食物')
        return
      }
      const portion = Number(this.addForm.portion)
      if (!portion || portion <= 0) {
        this.$message.error('份量必须大于0')
        return
      }
      if (!this.addForm.mealType) {
        this.$message.error('请选择餐次')
        return
      }
      this.saving = true
      try {
        await addManualDietRecord({
          foodId: this.addForm.foodId,
          portion,
          mealType: this.addForm.mealType,
          recordDate: this.recordDate
        })
        this.addVisible = false
        this.$message.success('记录成功')
        await this.loadRecords()
      } catch (error) {
        const message = error && error.message ? error.message : ''
        if (message.indexOf('食物') !== -1) {
          this.$message.error('请选择食物')
        } else if (message.indexOf('份量') !== -1) {
          this.$message.error('份量必须大于0')
        } else {
          this.$message.error('记录失败，请重试')
        }
      } finally {
        this.saving = false
      }
    },
    async parseText() {
      if (!this.naturalLanguage || !this.naturalLanguage.trim()) {
        this.$message.error('请输入饮食描述')
        return
      }
      this.parsing = true
      this.parseError = ''
      this.parseMessage = ''
      try {
        const res = await parseDietRecord({
          naturalLanguage: this.naturalLanguage.trim(),
          recordDate: this.recordDate
        })
        const data = (res && res.data) || {}
        this.parsePreview = data.records || []
        this.parseMessage = (data.parseMessage || '解析成功，已自动记录') + '，共 ' + (data.parseCount || this.parsePreview.length) + ' 条'
        this.parseLocked = true
        await this.loadRecords()
      } catch (error) {
        const message = error && error.message ? error.message : ''
        this.parsePreview = []
        this.parseLocked = false
        if (message.indexOf('无法解析') !== -1) {
          this.parseError = '无法解析，请尝试手动记录'
        } else if (message.indexOf('描述') !== -1) {
          this.parseError = '请输入饮食描述'
        } else {
          this.parseError = '解析服务异常'
        }
      } finally {
        this.parsing = false
      }
    },
    confirmParse() {
      if (this.parseLocked) {
        this.$message.success('解析成功，已自动记录')
        return
      }
      this.parseText()
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
.record-page {
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

.page-head h2 {
  margin: 0;
  color: #1f3d24;
}

.date-tools,
.tab-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin: 12px 0;
}

.filter-select,
.date-tools ::v-deep .el-date-editor {
  margin-right: 12px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 18px;
  align-items: start;
}

.main {
  min-width: 0;
}

.panel,
.stats {
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
  padding: 16px;
}

.quick-record-grid {
  display: grid;
  grid-template-columns: 0.86fr 1.14fr;
  gap: 16px;
  margin-bottom: 18px;
}

.action-card {
  min-height: 210px;
  padding: 18px;
  border: 1px solid #dcebdc;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(46, 125, 50, 0.06);
}

.manual-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background:
    linear-gradient(135deg, rgba(232, 245, 233, 0.92), rgba(255, 255, 255, 0.88)),
    #fff;
}

.ai-card {
  background:
    linear-gradient(135deg, rgba(255, 248, 232, 0.78), rgba(255, 255, 255, 0.92)),
    #fff;
}

.ai-card-head,
.records-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  color: #2e7d32;
  font-weight: 600;
}

.action-card h3,
.records-head h3 {
  margin: 0;
  color: #1f3d24;
  font-size: 18px;
}

.card-desc {
  margin: 10px 0 0;
  color: #5f7462;
  font-size: 14px;
  line-height: 1.7;
}

.add-btn {
  align-self: flex-start;
}

.auto-tag {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 12px;
}

.records-panel {
  padding: 18px;
}

.stats {
  position: sticky;
  top: 76px;
}

.stats h3 {
  margin: 0 0 12px;
  color: #1f3d24;
}

.dialog-tip {
  margin: 10px 0 0;
  font-size: 13px;
  color: #3f5344;
}

.error-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-btn,
.link-btn:hover {
  color: #2e7d32;
}

.ai-card ::v-deep .el-textarea__inner {
  border-color: #d7e3d7;
  border-radius: 10px;
  line-height: 1.7;
}

.stats p {
  margin: 8px 0;
  color: #3f5344;
  font-size: 14px;
}

.remain {
  color: #2e7d32;
}

.over {
  color: #c62828;
}

.record-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.record-table th,
.record-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #eef3ee;
  text-align: left;
  color: #3f5344;
}

.record-table th {
  color: #6b7c6e;
  font-weight: 500;
}

.state-box {
  padding: 28px 12px;
  text-align: center;
  color: #6b7c6e;
}

.muted,
.success-text,
.error-text {
  font-size: 13px;
}

.muted {
  color: #6b7c6e;
}

.success-text {
  color: #2e7d32;
}

.error-text {
  color: #c62828;
}

.food-list {
  max-height: 220px;
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
  margin-top: 4px;
  color: #6b7c6e;
  font-size: 12px;
}

.preview-item {
  padding: 8px 0;
  border-bottom: 1px solid #eef3ee;
  color: #3f5344;
}

.preview-item span {
  display: block;
  font-size: 12px;
  color: #6b7c6e;
  margin-top: 4px;
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

@media (max-width: 860px) {
  .layout,
  .quick-record-grid {
    grid-template-columns: 1fr;
  }

  .page-head,
  .records-head,
  .ai-card-head {
    flex-direction: column;
    align-items: stretch;
  }

  .date-tools,
  .tab-toolbar {
    flex-wrap: wrap;
  }
}
</style>
