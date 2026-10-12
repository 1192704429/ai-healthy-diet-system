<template>
  <div class="detail-page">
    <div class="back-row">
      <el-button type="text" @click="$router.push('/user/articles')">返回资讯列表</el-button>
    </div>

    <div v-if="pageError" class="state-box">
      <p>{{ pageError }}</p>
      <el-button class="primary-btn" @click="load">重试</el-button>
    </div>
    <el-skeleton v-else-if="loading" class="panel" :rows="10" animated />

    <article v-else-if="detail" class="panel">
      <p class="cat-tag">{{ detail.categoryName }}</p>
      <h1>{{ detail.title }}</h1>
      <p class="meta">
        {{ detail.authorName || '系统' }} ·
        {{ detail.publishTime || '-' }} ·
        阅读 {{ detail.viewCount || 0 }} ·
        点赞 {{ detail.likeCount || 0 }} ·
        收藏 {{ detail.collectCount || 0 }}
      </p>
      <div v-if="detail.coverImage" class="cover">
        <img :src="detail.coverImage" :alt="detail.title">
      </div>
      <markdown-view class="content" :content="detail.content" />
      <div class="actions-bar">
        <div class="action-hint">
          <span class="hint-title">互动操作</span>
          <span class="hint-desc">点赞或收藏这篇文章，帮助系统更懂你的偏好</span>
        </div>
        <div class="actions">
          <el-button
            class="action-btn like-btn"
            :class="{ active: detail.liked }"
            :loading="acting"
            @click="toggleLike"
          >
            <span class="action-icon">♥</span>
            <span class="action-text">{{ detail.liked ? '已点赞' : '点赞' }}</span>
            <span class="action-count">{{ detail.likeCount || 0 }}</span>
          </el-button>
          <el-button
            class="action-btn collect-btn"
            :class="{ active: detail.collected }"
            :loading="acting"
            @click="toggleCollect"
          >
            <span class="action-icon">★</span>
            <span class="action-text">{{ detail.collected ? '已收藏' : '收藏' }}</span>
            <span class="action-count">{{ detail.collectCount || 0 }}</span>
          </el-button>
        </div>
      </div>
    </article>

    <section v-if="detail && related.length" class="related">
      <h3>相关推荐</h3>
      <button
        v-for="item in related"
        :key="item.id"
        type="button"
        class="related-item"
        @click="openRelated(item.id)"
      >
        <strong>{{ item.title }}</strong>
        <span>{{ item.categoryName }} · {{ item.publishTime }}</span>
      </button>
    </section>
  </div>
</template>

<script>
import {
  getArticleDetail,
  likeArticle,
  unlikeArticle,
  collectArticle,
  uncollectArticle
} from '@/api/client-articles'
import MarkdownView from '@/components/MarkdownView'

export default {
  name: 'ClientArticleDetail',
  components: { MarkdownView },
  data() {
    return {
      detail: null,
      loading: false,
      acting: false,
      pageError: ''
    }
  },
  computed: {
    related() {
      return (this.detail && this.detail.related) || []
    },
    articleId() {
      return this.$route.query.id
    }
  },
  watch: {
    articleId: {
      immediate: true,
      handler() {
        this.load()
      }
    }
  },
  methods: {
    async load() {
      if (!this.articleId) {
        this.pageError = '文章不存在'
        this.detail = null
        return
      }
      this.loading = true
      this.pageError = ''
      try {
        const res = await getArticleDetail(this.articleId)
        this.detail = (res && res.data) || null
        if (!this.detail) {
          this.pageError = '文章不存在'
        }
      } catch (error) {
        this.detail = null
        const message = error && error.message ? error.message : ''
        this.pageError = message.indexOf('不存在') !== -1 ? '文章不存在' : '加载失败，请稍后重试'
      } finally {
        this.loading = false
      }
    },
    async toggleLike() {
      if (!this.detail || this.acting) {
        return
      }
      this.acting = true
      try {
        const res = this.detail.liked
          ? await unlikeArticle(this.detail.id)
          : await likeArticle(this.detail.id)
        this.applyDetail(res)
        this.$message.success(this.detail.liked ? '已点赞' : '已取消点赞')
      } catch (error) {
        this.$message.error(this.likeError(error, this.detail.liked))
      } finally {
        this.acting = false
      }
    },
    async toggleCollect() {
      if (!this.detail || this.acting) {
        return
      }
      this.acting = true
      try {
        const res = this.detail.collected
          ? await uncollectArticle(this.detail.id)
          : await collectArticle(this.detail.id)
        this.applyDetail(res)
        this.$message.success(this.detail.collected ? '已收藏' : '已取消收藏')
      } catch (error) {
        this.$message.error(this.collectError(error, this.detail.collected))
      } finally {
        this.acting = false
      }
    },
    applyDetail(res) {
      if (res && res.data) {
        this.detail = res.data
      }
    },
    likeError(error, wasLiked) {
      const message = error && error.message ? error.message : ''
      if (message.indexOf('重复') !== -1) {
        return '请勿重复点赞'
      }
      if (wasLiked) {
        return '取消失败'
      }
      return '点赞失败'
    },
    collectError(error, wasCollected) {
      const message = error && error.message ? error.message : ''
      if (message.indexOf('重复') !== -1) {
        return '请勿重复收藏'
      }
      if (wasCollected) {
        return '取消失败'
      }
      return '收藏失败'
    },
    openRelated(id) {
      if (!id || String(id) === String(this.articleId)) {
        return
      }
      this.$router.push({ path: '/user/article-detail', query: { id } })
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.panel {
  padding: 24px;
  background: #fff;
  border: 1px solid #e3eee3;
  border-radius: 12px;
  box-shadow: 0 14px 40px rgba(56, 96, 64, 0.06);
}

h1 {
  margin: 8px 0 12px;
  color: #1f3d24;
  font-size: 26px;
  line-height: 1.4;
}

.meta,
.related-item span {
  color: #6b7c6e;
  font-size: 13px;
}

.cat-tag {
  display: inline-block;
  margin: 0;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
}

.cover {
  margin: 16px 0;
}

.cover img {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: 8px;
}

.content {
  color: #3f5344;
  line-height: 1.8;
  word-break: break-word;
}

.content ::v-deep img {
  max-width: 100%;
}

.actions-bar {
  margin-top: 28px;
  padding: 18px 18px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #fbfefb 0%, #f4faf4 100%);
  border: 1px solid #e3eee3;
}

.action-hint {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.hint-title {
  color: #1f3d24;
  font-size: 14px;
  font-weight: 700;
}

.hint-desc {
  color: #6b7c6e;
  font-size: 12px;
  line-height: 1.6;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action-btn {
  min-width: 136px;
  height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border-width: 1px;
  font-weight: 600;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease;
}

.action-btn:hover,
.action-btn:focus {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(46, 125, 50, 0.12);
}

.action-btn ::v-deep span {
  display: inline-flex;
  align-items: center;
}

.action-icon {
  width: 22px;
  margin-right: 8px;
  font-size: 14px;
}

.action-text {
  font-size: 14px;
}

.action-count {
  margin-left: 10px;
  min-width: 24px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(46, 125, 50, 0.12);
  color: #2e7d32;
  font-size: 12px;
  line-height: 22px;
}

.like-btn {
  color: #2e7d32;
  background: #eef8ef;
  border-color: #cfe8d0;
}

.like-btn:hover,
.like-btn:focus {
  background: #e3f3e4;
  border-color: #b8ddb9;
  color: #1f6b36;
}

.like-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #ff7a87 0%, #ea4f64 100%);
  border-color: transparent;
  box-shadow: 0 12px 26px rgba(234, 79, 100, 0.24);
}

.like-btn.active .action-count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.collect-btn {
  color: #8a6b00;
  background: #fff8e6;
  border-color: #f1ddb0;
}

.collect-btn:hover,
.collect-btn:focus {
  background: #fff2cc;
  border-color: #e8c97b;
  color: #6d5300;
}

.collect-btn.active {
  color: #fff;
  background: linear-gradient(135deg, #f0b429 0%, #dd8c1f 100%);
  border-color: transparent;
  box-shadow: 0 12px 26px rgba(221, 140, 31, 0.24);
}

.collect-btn.active .action-count {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.related {
  margin-top: 24px;
}

.related h3 {
  margin: 0 0 12px;
  color: #1f3d24;
}

.related-item {
  width: 100%;
  text-align: left;
  margin-bottom: 8px;
  padding: 12px 14px;
  border: 1px solid #e3eee3;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.related-item:hover {
  border-color: #2e7d32;
}

.related-item strong {
  color: #1f3d24;
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

@media (max-width: 768px) {
  .detail-page {
    padding: 16px 12px 32px;
  }

  .panel {
    padding: 18px;
  }

  h1 {
    font-size: 22px;
  }

  .actions-bar {
    padding: 16px 14px 14px;
  }

  .action-btn {
    width: 100%;
    min-width: 0;
    justify-content: center;
  }
}
</style>
