<template>
  <div class="profile-page">
    <div class="page-head">
      <h2>健康档案</h2>
      <el-button class="primary-btn" @click="openDialog">新增指标记录</el-button>
    </div>

    <div v-if="pageError" class="state-box">
      <p>{{ pageError }}</p>
      <el-button class="primary-btn" @click="loadProfile">重新加载</el-button>
    </div>

    <el-skeleton v-else-if="pageLoading" class="panel" :rows="8" animated />

    <template v-else>
      <section class="panel">
        <div class="panel-head indicator-head">
          <h3>身体指标</h3>
          <div class="filters">
            <el-select v-model="filterType" placeholder="指标类型" size="small" clearable class="filter-select" @change="applyFilter">
              <el-option label="全部" :value="0" />
              <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              size="small"
              unlink-panels
              clearable
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
              @change="applyFilter"
            />
          </div>
        </div>

        <el-collapse v-model="activeGroups">
          <el-collapse-item
            v-for="group in visibleGroups"
            :key="group.code"
            :name="group.code"
          >
            <template slot="title">
              <div class="group-title">
                <strong>{{ group.name }}</strong>
                <span>{{ group.latestDisplay || '暂无历史记录' }} {{ group.latestDisplay ? group.unit : '' }}</span>
                <span class="muted">{{ formatTime(group.latestTime) || '尚未录入' }}</span>
              </div>
            </template>
            <div class="history-wrap" @scroll="onHistoryScroll(group, $event)">
              <table class="history-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>数值</th>
                    <th>单位</th>
                    <th>录入时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in group.records" :key="row.id">
                    <td>{{ formatDate(row.measureTime) }}</td>
                    <td>{{ row.displayValue }}</td>
                    <td>{{ row.unit }}</td>
                    <td>{{ formatTime(row.createTime) }}</td>
                  </tr>
                  <tr v-if="!group.records || !group.records.length">
                    <td colspan="4" class="empty-cell">暂无历史记录</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="group.loadingMore" class="load-more">加载中...</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </section>

      <section id="goal-section" class="panel">
        <div class="panel-head">
          <h3>健康目标</h3>
          <el-button class="primary-btn" size="small" :loading="goalSaving" @click="saveGoal">保存目标</el-button>
        </div>
        <div v-if="!currentGoalId" class="unset-bar">
          <span>未设置</span>
          <el-button type="text" class="guide-link" @click="focusGoalCards">去设置</el-button>
        </div>
        <div v-if="goals.length" class="goal-grid" :class="{ hint: goalHint }">
          <button
            v-for="item in goals"
            :key="item.id"
            type="button"
            class="goal-card"
            :class="{ active: Number(selectedGoalId) === Number(item.id) }"
            @click="selectedGoalId = Number(item.id); goalHint = false"
          >
            <div class="goal-name">
              {{ item.name }}
              <span v-if="Number(currentGoalId) === Number(item.id)" class="current-tag">当前目标</span>
            </div>
            <p>{{ item.description || '选择后将作为推荐和计划基准' }}</p>
          </button>
        </div>
        <p v-else class="empty-text">暂无可选健康目标</p>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h3>饮食偏好</h3>
          <el-button class="primary-btn" size="small" :loading="prefSaving" @click="savePreferences">保存偏好</el-button>
        </div>
        <div v-if="preferences.length" class="pref-list">
          <div
            v-for="item in preferences"
            :key="item.id"
            class="pref-item"
            :class="{ active: selectedPreferenceIds.indexOf(Number(item.id)) !== -1 }"
            @click="togglePreference(Number(item.id), selectedPreferenceIds.indexOf(Number(item.id)) === -1)"
          >
            <el-checkbox
              :value="selectedPreferenceIds.indexOf(Number(item.id)) !== -1"
              @click.native.stop
              @change="val => togglePreference(Number(item.id), val)"
            >
              {{ item.name }}
            </el-checkbox>
          </div>
        </div>
        <p v-else class="empty-text">暂无可选饮食偏好</p>
      </section>
    </template>

    <el-dialog title="新增健康指标记录" :visible.sync="dialogVisible" width="560px" @closed="resetForm">
      <p class="dialog-tip">每次保存都会新增一条历史记录，可同时填写多项，空白项不会保存</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="身高" prop="height">
          <el-input v-model="form.height" placeholder="30-250 cm，可不填" />
        </el-form-item>
        <el-form-item label="体重" prop="weight">
          <el-input v-model="form.weight" placeholder="2-500 kg，可不填" />
        </el-form-item>
        <el-form-item label="收缩压" prop="systolic">
          <el-input v-model="form.systolic" placeholder="60-260 mmHg，可不填" />
        </el-form-item>
        <el-form-item label="舒张压" prop="diastolic">
          <el-input v-model="form.diastolic" placeholder="40-200 mmHg，可不填" />
        </el-form-item>
        <el-form-item label="血糖" prop="glucose">
          <el-input v-model="form.glucose" placeholder="1-50 mmol/L，可不填" />
        </el-form-item>
        <el-form-item label="心率" prop="heartRate">
          <el-input v-model="form.heartRate" placeholder="20-220 次/分，可不填" />
        </el-form-item>
        <el-form-item label="录入时间" prop="recordTime">
          <el-date-picker
            v-model="form.recordTime"
            type="datetime"
            placeholder="默认当前时间"
            value-format="yyyy-MM-dd HH:mm:ss"
            clearable
            :picker-options="timePickerOptions"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button class="primary-btn" :loading="savingIndicator" @click="submitIndicator">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getHealthProfile, getIndicatorGroup, saveIndicators, saveHealthGoal, saveDietPreferences } from '@/api/client-health-profile'

const TYPE_OPTIONS = [
  { label: '身高', value: 1, unit: 'cm', min: 30, max: 250 },
  { label: '体重', value: 2, unit: 'kg', min: 2, max: 500 },
  { label: '血压', value: 3, unit: 'mmHg' },
  { label: '血糖', value: 4, unit: 'mmol/L', min: 1, max: 50 },
  { label: '心率', value: 5, unit: '次/分', min: 20, max: 220 }
]

export default {
  name: 'ClientHealthProfile',
  data() {
    const optionalRange = (min, max) => (rule, value, callback) => {
      if (value === '' || value === null || value === undefined) {
        callback()
        return
      }
      const number = Number(value)
      if (Number.isNaN(number) || number < min || number > max) {
        callback(new Error('请输入合理的数值'))
        return
      }
      callback()
    }
    return {
      pageError: '',
      pageLoading: false,
      groups: [],
      goals: [],
      preferences: [],
      currentGoalId: null,
      selectedGoalId: null,
      selectedPreferenceIds: [],
      goalHint: false,
      activeGroups: [],
      filterType: 0,
      dateRange: [],
      dialogVisible: false,
      savingIndicator: false,
      goalSaving: false,
      prefSaving: false,
      typeOptions: TYPE_OPTIONS,
      timePickerOptions: {
        disabledDate(date) {
          return date.getTime() > Date.now()
        }
      },
      form: {
        height: '',
        weight: '',
        systolic: '',
        diastolic: '',
        glucose: '',
        heartRate: '',
        recordTime: ''
      },
      rules: {
        height: [{ validator: optionalRange(30, 250), trigger: ['blur', 'change'] }],
        weight: [{ validator: optionalRange(2, 500), trigger: ['blur', 'change'] }],
        systolic: [{ validator: optionalRange(60, 260), trigger: ['blur', 'change'] }],
        diastolic: [{ validator: optionalRange(40, 200), trigger: ['blur', 'change'] }],
        glucose: [{ validator: optionalRange(1, 50), trigger: ['blur', 'change'] }],
        heartRate: [{ validator: optionalRange(20, 220), trigger: ['blur', 'change'] }]
      }
    }
  },
  computed: {
    visibleGroups() {
      if (!this.filterType) {
        return this.groups
      }
      return this.groups.filter(item => item.type === this.filterType)
    }
  },
  created() {
    this.loadProfile()
  },
  methods: {
    async loadProfile() {
      this.pageError = ''
      this.pageLoading = true
      try {
        const res = await getHealthProfile()
        const data = (res && res.data) || {}
        this.groups = (data.indicatorGroups || []).map(item => ({
          ...item,
          records: item.records || [],
          page: 1,
          loadingMore: false
        }))
        this.goals = data.goals || []
        this.preferences = data.preferences || []
        this.currentGoalId = data.currentGoalId ? Number(data.currentGoalId) : null
        this.selectedGoalId = this.currentGoalId
        this.selectedPreferenceIds = (data.selectedPreferenceIds || []).map(id => Number(id))
      } catch (error) {
        this.pageError = '档案加载失败，请稍后重试'
      } finally {
        this.pageLoading = false
      }
    },
    async applyFilter() {
      try {
        const tasks = this.visibleGroups.map(group => this.reloadGroup(group, 1, false))
        await Promise.all(tasks)
      } catch (error) {
        this.$message.error('筛选失败，请稍后重试')
      }
    },
    async reloadGroup(group, page, append) {
      const params = {
        type: group.type,
        current: page,
        size: 10
      }
      if (this.dateRange && this.dateRange.length === 2) {
        params.startTime = this.dateRange[0] + ' 00:00:00'
        params.endTime = this.dateRange[1] + ' 23:59:59'
      }
      const res = await getIndicatorGroup(params)
      const data = (res && res.data) || {}
      group.total = data.total || 0
      group.hasMore = Boolean(data.hasMore)
      if (page === 1) {
        group.latestDisplay = data.latestDisplay
        group.latestTime = data.latestTime
      }
      group.page = page
      group.records = append ? (group.records || []).concat(data.records || []) : (data.records || [])
    },
    onHistoryScroll(group, event) {
      const el = event.target
      if (!group.hasMore || group.loadingMore) {
        return
      }
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 16) {
        this.loadMore(group)
      }
    },
    async loadMore(group) {
      group.loadingMore = true
      try {
        await this.reloadGroup(group, (group.page || 1) + 1, true)
      } finally {
        group.loadingMore = false
      }
    },
    openDialog() {
      this.dialogVisible = true
      this.form.recordTime = this.nowText()
    },
    resetForm() {
      this.form = {
        height: '',
        weight: '',
        systolic: '',
        diastolic: '',
        glucose: '',
        heartRate: '',
        recordTime: this.nowText()
      }
      if (this.$refs.formRef) {
        this.$refs.formRef.clearValidate()
      }
    },
    nowText() {
      const date = new Date()
      const pad = value => (value < 10 ? '0' + value : '' + value)
      return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
        ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds())
    },
    submitIndicator() {
      this.$refs.formRef.validate(async valid => {
        if (!valid) {
          this.$message.error('请输入合理的数值')
          return
        }
        const filled = ['height', 'weight', 'systolic', 'diastolic', 'glucose', 'heartRate']
          .some(key => String(this.form[key] || '').trim() !== '')
        if (!filled) {
          this.$message.error('请至少录入一项指标')
          return
        }
        const hasSys = String(this.form.systolic || '').trim() !== ''
        const hasDia = String(this.form.diastolic || '').trim() !== ''
        if (hasSys !== hasDia) {
          this.$message.error('请完整录入收缩压和舒张压')
          return
        }
        if (this.form.recordTime && new Date(this.form.recordTime.replace(/-/g, '/')).getTime() > Date.now()) {
          this.$message.error('录入时间不能晚于当前时间')
          return
        }
        this.savingIndicator = true
        try {
          await saveIndicators({
            height: this.form.height,
            weight: this.form.weight,
            systolic: this.form.systolic,
            diastolic: this.form.diastolic,
            glucose: this.form.glucose,
            heartRate: this.form.heartRate,
            recordTime: this.form.recordTime
          })
          this.$message.success('录入成功')
          this.dialogVisible = false
          await this.loadProfile()
        } catch (error) {
          const message = error && error.message ? error.message : ''
          this.$message.error(message || '录入失败，请稍后重试')
        } finally {
          this.savingIndicator = false
        }
      })
    },
    focusGoalCards() {
      this.goalHint = true
      const el = document.getElementById('goal-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    },
    async saveGoal() {
      if (!this.selectedGoalId) {
        this.$message.error('请选择目标')
        return
      }
      if (this.currentGoalId && this.currentGoalId !== this.selectedGoalId) {
        try {
          await this.$confirm('将替换原目标', '提示', { type: 'warning' })
        } catch (error) {
          return
        }
      }
      this.goalSaving = true
      try {
        await saveHealthGoal({ goalId: this.selectedGoalId })
        this.currentGoalId = this.selectedGoalId
        this.$message.success('目标已更新')
      } catch (error) {
        this.$message.error('目标保存失败，请检查')
      } finally {
        this.goalSaving = false
      }
    },
    togglePreference(id, checked) {
      const next = this.selectedPreferenceIds.slice()
      const index = next.indexOf(id)
      if (checked && index === -1) {
        next.push(id)
      }
      if (!checked && index !== -1) {
        next.splice(index, 1)
      }
      this.selectedPreferenceIds = next
    },
    async savePreferences() {
      this.prefSaving = true
      try {
        await saveDietPreferences({ preferenceIds: this.selectedPreferenceIds })
        this.$message.success('偏好已保存')
      } catch (error) {
        this.$message.error('保存失败，请重试')
      } finally {
        this.prefSaving = false
      }
    },
    formatTime(value) {
      if (!value) {
        return ''
      }
      return String(value).replace('T', ' ').slice(0, 19)
    },
    formatDate(value) {
      const text = this.formatTime(value)
      return text ? text.slice(0, 10) : ''
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
  box-sizing: border-box;
}

.page-head,
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-head h2,
.panel-head h3 {
  margin: 0;
  color: #1f3d24;
}

.indicator-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  column-gap: 24px;
  margin-bottom: 14px;
}

.dialog-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: #6b7c6e;
}

.panel {
  margin-top: 20px;
  padding: 18px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px 16px;
  justify-self: end;
  max-width: 100%;
}

.filter-select {
  width: 128px;
}

.filters ::v-deep .el-date-editor {
  width: 300px;
  max-width: 100%;
}

.indicator-head + .el-collapse {
  clear: both;
}

.group-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 16px;
  padding-right: 8px;
  color: #243528;
}

.group-title strong {
  min-width: 48px;
}

.muted {
  color: #8a9a8c;
  font-size: 13px;
}

.history-wrap {
  max-height: 240px;
  overflow: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.history-table th,
.history-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #eef3ee;
  text-align: left;
  color: #3f5344;
}

.empty-cell,
.load-more,
.empty-text {
  text-align: center;
  color: #8a9a8c;
}

.unset-bar {
  margin: 12px 0;
  padding: 10px 12px;
  background: #fff8e8;
  border: 1px solid #f0e0b8;
  border-radius: 8px;
  color: #7a5b16;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.goal-card {
  text-align: left;
  padding: 14px;
  border: 1px solid #d7e3d7;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

.goal-card.active {
  border-color: #2e7d32;
  background: #f3faf3;
}

.goal-name {
  font-weight: 600;
  color: #1f3d24;
  margin-bottom: 6px;
}

.goal-card p {
  margin: 0;
  font-size: 12px;
  color: #6b7c6e;
  line-height: 1.5;
}

.current-tag {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: #2e7d32;
}

.pref-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.goal-grid.hint .goal-card {
  border-color: #81c784;
}

.pref-item {
  padding: 8px 12px;
  border: 1px solid #d7e3d7;
  border-radius: 18px;
  background: #fff;
  color: #3f5344;
  cursor: pointer;
}

.pref-item.active {
  border-color: #2e7d32;
  background: #e8f5e9;
  color: #1f3d24;
}

.guide-link,
.guide-link:hover,
.guide-link:focus {
  color: #2e7d32;
}

.panel ::v-deep .el-collapse-item__header {
  height: auto;
  line-height: 1.5;
  padding: 8px 0;
  color: #243528;
}

.panel ::v-deep .el-collapse-item__arrow {
  margin-right: 4px;
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

.state-box {
  margin-top: 20px;
  padding: 28px 16px;
  text-align: center;
  color: #6b7c6e;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

@media (max-width: 768px) {
  .profile-page {
    padding: 18px 14px 32px;
  }

  .page-head,
  .panel-head {
    align-items: center;
  }

  .indicator-head {
    grid-template-columns: 1fr;
    row-gap: 12px;
    align-items: stretch;
  }

  .filters,
  .filter-select,
  .filters ::v-deep .el-date-editor {
    width: 100%;
  }
}
</style>
