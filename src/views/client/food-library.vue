<template>
  <div class="food-page">
    <div class="page-head">
      <h2>食物库</h2>
      <span class="result-count">共 {{ total }} 条结果</span>
    </div>

    <section class="panel search-panel">
      <el-input
        v-model="filters.keyword"
        placeholder="搜索食物名称"
        size="small"
        clearable
        class="search-item"
        @keyup.enter.native="search(1)"
        @input="onFilterChange"
        @clear="search(1)"
      />
      <el-select
        v-model="filters.categoryId"
        placeholder="分类"
        size="small"
        clearable
        class="search-item"
        @change="search(1)"
      >
        <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="filter-label">热量</span>
      <el-input v-model="filters.calorieMin" placeholder="最小" size="small" class="range-input" @blur="search(1)" @keyup.enter.native="search(1)" />
      <span class="range-sep">-</span>
      <el-input v-model="filters.calorieMax" placeholder="最大" size="small" class="range-input" @blur="search(1)" @keyup.enter.native="search(1)" />
      <span class="filter-label">蛋白质</span>
      <el-input v-model="filters.proteinMin" placeholder="最小" size="small" class="range-input" @blur="search(1)" @keyup.enter.native="search(1)" />
      <span class="range-sep">-</span>
      <el-input v-model="filters.proteinMax" placeholder="最大" size="small" class="range-input" @blur="search(1)" @keyup.enter.native="search(1)" />
      <el-button class="primary-btn" size="small" :loading="loading" @click="search(1)">搜索</el-button>
      <el-button size="small" @click="resetFilters">重置</el-button>
    </section>

    <div v-if="listError" class="state-box">
      <p>{{ listError }}</p>
      <el-button class="primary-btn" @click="search(current)">重试</el-button>
    </div>

    <el-skeleton v-else-if="loading && !list.length" class="panel" :rows="8" animated />

    <div v-else v-loading="loading">
      <div v-if="list.length" class="food-grid">
        <article
          v-for="item in list"
          :key="item.id"
          class="food-card"
          @click="openDetail(item.id)"
        >
          <div class="food-cover">
            <img
              v-if="foodCover(item)"
              :src="foodCover(item)"
              :alt="item.name"
              @error="onCoverError($event)"
            >
            <span v-else>暂无图片</span>
          </div>
          <div class="card-body">
            <div class="card-head">
              <h4>{{ item.name }}</h4>
              <span class="cat-tag">{{ item.categoryName }}</span>
            </div>
            <p class="calorie">{{ item.unit || '100g' }} · {{ formatNumber(item.calorie) }} 千卡</p>
            <p class="nutrients">
              蛋白质 {{ formatNumber(item.protein) }}g ·
              脂肪 {{ formatNumber(item.fat) }}g ·
              碳水 {{ formatNumber(item.carbohydrate) }}g
            </p>
          </div>
        </article>
      </div>
      <div v-else class="state-box">
        <p>暂无相关食物</p>
        <p class="muted">可更换关键字、分类或营养范围后再试</p>
      </div>

      <div v-if="total > 0" class="pager">
        <el-pagination
          background
          layout="prev, pager, next"
          :page-size="10"
          :current-page="current"
          :total="total"
          @current-change="search"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { getFoodCategories, getFoodList } from '@/api/client-food'

export default {
  name: 'ClientFoodLibrary',
  data() {
    return {
      categories: [],
      filters: this.emptyFilters(),
      list: [],
      total: 0,
      current: 1,
      loading: false,
      listError: '',
      searchTimer: null
    }
  },
  created() {
    this.loadCategories()
    this.search(1)
  },
  beforeDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  },
  methods: {
    foodCover(item) {
      return (item && (item.image || item.foodImage)) || ''
    },
    onCoverError(event) {
      const img = event && event.target
      if (img) {
        img.style.display = 'none'
        if (img.parentNode && !img.parentNode.querySelector('.cover-fallback')) {
          const tip = document.createElement('span')
          tip.className = 'cover-fallback'
          tip.textContent = '暂无图片'
          img.parentNode.appendChild(tip)
        }
      }
    },
    emptyFilters() {
      return {
        keyword: '',
        categoryId: '',
        calorieMin: '',
        calorieMax: '',
        proteinMin: '',
        proteinMax: ''
      }
    },
    async loadCategories() {
      try {
        const res = await getFoodCategories()
        this.categories = (res && res.data) || []
      } catch (error) {
        this.categories = []
      }
    },
    validateRange() {
      const calorieMin = this.toNumber(this.filters.calorieMin)
      const calorieMax = this.toNumber(this.filters.calorieMax)
      if ((this.filters.calorieMin && calorieMin === null) || (this.filters.calorieMax && calorieMax === null)) {
        this.$message.error('热量范围必须为数字，且最小值不大于最大值')
        return false
      }
      if (calorieMin !== null && calorieMax !== null && calorieMin > calorieMax) {
        this.$message.error('热量范围必须为数字，且最小值不大于最大值')
        return false
      }
      const proteinMin = this.toNumber(this.filters.proteinMin)
      const proteinMax = this.toNumber(this.filters.proteinMax)
      if ((this.filters.proteinMin && proteinMin === null) || (this.filters.proteinMax && proteinMax === null) ||
          (proteinMin !== null && proteinMax !== null && proteinMin > proteinMax)) {
        this.$message.error('请输入有效数值')
        return false
      }
      return true
    },
    toNumber(value) {
      if (value === '' || value === null || value === undefined) {
        return null
      }
      const number = Number(value)
      return Number.isNaN(number) ? null : number
    },
    async search(page) {
      if (!this.validateRange()) {
        return
      }
      this.current = page || 1
      this.loading = true
      this.listError = ''
      try {
        const res = await getFoodList({
          keyword: this.filters.keyword || undefined,
          categoryId: this.filters.categoryId || undefined,
          calorieMin: this.filters.calorieMin || undefined,
          calorieMax: this.filters.calorieMax || undefined,
          proteinMin: this.filters.proteinMin || undefined,
          proteinMax: this.filters.proteinMax || undefined,
          current: this.current,
          size: 10
        })
        const data = (res && res.data) || {}
        this.list = data.records || []
        this.total = data.total || 0
        this.current = data.current || this.current
      } catch (error) {
        this.list = []
        this.total = 0
        this.listError = (error && error.message) || '查询失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    onFilterChange() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.search(1)
      }, 350)
    },
    resetFilters() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.filters = this.emptyFilters()
      this.search(1)
    },
    openDetail(id) {
      this.$router.push({ path: '/user/food-detail', query: { id } })
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
.food-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 40px;
}

.page-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.page-head h2 {
  margin: 0;
  color: #1f3d24;
}

.result-count,
.muted {
  color: #8a9a8c;
  font-size: 13px;
}

.panel,
.search-panel {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.search-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.search-item {
  width: 180px;
  margin-right: 4px;
}

.range-input {
  width: 110px;
}

.range-sep {
  color: #8a9a8c;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.food-card {
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.food-card:hover {
  border-color: #2e7d32;
}

.food-cover {
  height: 120px;
  background: #eef6ee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a9a8c;
  font-size: 13px;
}

.food-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-body {
  padding: 12px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.card-head h4 {
  margin: 0;
  font-size: 15px;
  color: #1f3d24;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-label {
  font-size: 13px;
  color: #3f5344;
}

.cat-tag {
  font-size: 12px;
  color: #2e7d32;
  background: #e8f5e9;
  border-radius: 10px;
  padding: 2px 8px;
  white-space: nowrap;
}

.calorie,
.nutrients {
  margin: 6px 0 0;
  font-size: 13px;
  color: #3f5344;
}

.nutrients {
  color: #6b7c6e;
}

.pager {
  margin-top: 20px;
  text-align: center;
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
