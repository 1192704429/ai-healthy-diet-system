<template>
  <div class="articles-page">
    <div class="page-head">
      <h2>健康资讯</h2>
      <span class="result-count">共 {{ total }} 条</span>
    </div>

    <section class="panel toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索标题或摘要"
        size="small"
        clearable
        class="search-input"
        @keyup.enter.native="search(1)"
        @clear="search(1)"
      />
      <el-button class="primary-btn" size="small" :loading="loading" @click="search(1)">搜索</el-button>
      <el-select v-model="sort" size="small" class="sort-select" @change="search(1)">
        <el-option label="按发布时间" value="publishTime" />
        <el-option label="按阅读量" value="viewCount" />
        <el-option label="按点赞数" value="likeCount" />
      </el-select>
    </section>

    <div class="category-tabs">
      <button
        v-for="item in categories"
        :key="item.value === null ? 'all' : item.value"
        type="button"
        class="cat-btn"
        :class="{ active: articleType === item.value }"
        @click="changeCategory(item.value)"
      >{{ item.label }}</button>
    </div>

    <div v-if="listError" class="state-box">
      <p>{{ listError }}</p>
      <el-button class="primary-btn" @click="search(current)">重试</el-button>
    </div>
    <el-skeleton v-else-if="loading && !list.length" class="panel" :rows="8" animated />
    <div v-else v-loading="loading">
      <div v-if="list.length" class="article-list">
        <article
          v-for="item in list"
          :key="item.id"
          class="article-card"
          @click="openDetail(item)"
        >
          <div class="cover">
            <img v-if="item.coverImage" :src="item.coverImage" :alt="item.title">
            <span v-else>暂无封面</span>
          </div>
          <div class="body">
            <div class="card-head">
              <h3>{{ item.title }}</h3>
              <span class="cat-tag">{{ item.categoryName }}</span>
            </div>
            <p class="summary">{{ item.summary || '暂无摘要' }}</p>
            <p class="meta">
              {{ item.publishTime || '-' }} ·
              阅读 {{ item.viewCount || 0 }} ·
              点赞 {{ item.likeCount || 0 }} ·
              收藏 {{ item.collectCount || 0 }}
            </p>
          </div>
        </article>
      </div>
      <div v-else class="state-box">
        <p>暂无资讯</p>
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
import { getArticleList } from '@/api/client-articles'

export default {
  name: 'ClientArticles',
  data() {
    return {
      keyword: '',
      articleType: null,
      sort: 'publishTime',
      list: [],
      current: 1,
      total: 0,
      loading: false,
      listError: '',
      categories: [
        { label: '全部', value: null },
        { label: '饮食', value: 1 },
        { label: '运动', value: 2 },
        { label: '疾病防治', value: 3 }
      ]
    }
  },
  created() {
    this.search(1)
  },
  methods: {
    changeCategory(value) {
      this.articleType = value
      this.search(1)
    },
    async search(page) {
      this.loading = true
      this.listError = ''
      this.current = page || 1
      try {
        const res = await getArticleList({
          keyword: this.keyword,
          articleType: this.articleType,
          sort: this.sort,
          current: this.current
        })
        const data = (res && res.data) || {}
        this.list = data.records || []
        this.total = Number(data.total || 0)
        this.current = data.current || this.current
      } catch (error) {
        this.list = []
        this.total = 0
        this.listError = '加载失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    openDetail(item) {
      if (!item || !item.id) {
        return
      }
      this.$router.push({ path: '/user/article-detail', query: { id: item.id } })
    }
  }
}
</script>

<style lang="scss" scoped>
.articles-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.page-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.page-head h2 {
  margin: 0;
  color: #1f3d24;
}

.result-count,
.meta,
.summary {
  color: #6b7c6e;
}

.panel {
  margin-top: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 280px;
  margin-right: 4px;
}

.sort-select {
  width: 150px;
  margin-left: auto;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.cat-btn {
  border: 1px solid #cde3cf;
  background: #fff;
  color: #2e7d32;
  border-radius: 16px;
  padding: 4px 12px;
  cursor: pointer;
}

.cat-btn.active {
  background: #2e7d32;
  color: #fff;
  border-color: #2e7d32;
}

.article-list {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.article-card {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 14px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.article-card:hover {
  border-color: #2e7d32;
}

.cover {
  min-height: 110px;
  background: #eef6ee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8aa08c;
  font-size: 12px;
}

.cover img {
  width: 100%;
  height: 110px;
  object-fit: cover;
}

.body {
  padding: 12px 12px 12px 0;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.card-head h3 {
  margin: 0;
  font-size: 16px;
  color: #1f3d24;
}

.cat-tag {
  flex-shrink: 0;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
}

.summary {
  margin: 8px 0;
  line-height: 1.6;
}

.meta {
  margin: 0;
  font-size: 12px;
}

.pager {
  margin-top: 16px;
  text-align: right;
}

.state-box {
  padding: 36px 12px;
  text-align: center;
  color: #6b7c6e;
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

@media (max-width: 720px) {
  .article-card {
    grid-template-columns: 1fr;
  }

  .body {
    padding: 0 12px 12px;
  }
}
</style>
