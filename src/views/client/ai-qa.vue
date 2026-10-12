<template>
  <div class="qa-page">
    <div class="chat-shell">
      <aside class="history-panel">
        <div class="panel-head">
          <strong>会话</strong>
          <button type="button" class="new-session-btn" :disabled="creating || sending" @click="createSession">新建会话</button>
        </div>
        <div v-if="loading && !sessions.length" class="history-skeleton">
          <i></i><i></i><i></i>
        </div>
        <template v-else>
          <div v-if="!sessions.length" class="empty-history">还没有会话，先新建一个</div>
          <button
            v-for="item in sessions"
            :key="item.id"
            type="button"
            class="session-item"
            :class="{ active: item.id === sessionId }"
            @click="switchSession(item.id)"
          >
            <strong>{{ item.sessionTitle || '新的健康问答' }}</strong>
            <small>{{ item.lastChatTime || '刚刚' }} · {{ item.messageCount || 0 }} 条</small>
          </button>
          <el-button
            v-if="total > list.length"
            class="load-more"
            size="mini"
            :loading="loadingMore"
            @click="loadHistory(current + 1)"
          >加载更多</el-button>
        </template>
      </aside>

      <main class="chat-panel">
        <div class="chat-top">
          <div class="chat-top-copy">
            <h3>{{ currentSessionTitle }}</h3>
            <p>结合健康档案、饮食记录和知识库给出建议</p>
          </div>
          <div class="chat-top-actions">
            <span class="status-pill"><i></i>在线</span>
            <el-button size="mini" class="ghost-btn" @click="loadHistory(1)">刷新</el-button>
          </div>
        </div>

        <div ref="messageScroller" class="message-list" v-loading="loading && !list.length">
          <div v-if="pageError" class="state-box">
            <p>{{ pageError }}</p>
            <el-button class="primary-btn" size="mini" @click="loadHistory(1)">重试</el-button>
          </div>

          <template v-else>
            <div v-if="!messages.length" class="welcome-card">
              <strong>可以这样问我</strong>
              <p>我最近在减重，晚餐应该怎么吃？</p>
              <p>今天蛋白质够不够？</p>
              <p>控糖期间早餐怎么搭配？</p>
            </div>

            <div v-for="message in messages" :key="message.key" class="message-row" :class="message.role">
              <div class="avatar">{{ message.role === 'user' ? '我' : 'AI' }}</div>
              <div class="bubble">
                <div class="bubble-meta">
                  <span>{{ message.role === 'user' ? '你' : '健康饮食助手' }}</span>
                  <small>{{ message.time }}</small>
                </div>
                <div class="bubble-content">
                  <markdown-view v-if="message.role === 'ai'" :content="message.content" />
                  <span v-else>{{ message.content }}</span>
                </div>
                <p v-if="message.source" class="source">来源：{{ message.source }}</p>
              </div>
            </div>

            <div v-if="sending" class="message-row ai">
              <div class="avatar">AI</div>
              <div class="bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </template>
        </div>

        <section class="quick-bar" v-if="quickQuestions.length">
          <button
            type="button"
            class="quick-nav"
            :disabled="!canScrollLeft"
            @click="scrollQuick(-1)"
          >‹</button>
          <div
            ref="quickScroller"
            class="quick-scroller"
            @scroll="updateQuickScroll"
            @wheel.prevent="onQuickWheel"
          >
            <button
              v-for="item in quickQuestions"
              :key="item"
              type="button"
              class="quick-chip"
              @click="askQuick(item)"
            >{{ item }}</button>
          </div>
          <button
            type="button"
            class="quick-nav"
            :disabled="!canScrollRight"
            @click="scrollQuick(1)"
          >›</button>
        </section>

        <section class="composer">
          <el-input
            v-model="question"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="输入健康饮食问题，Enter 发送，Shift + Enter 换行"
            @keydown.enter.native.exact.prevent="send"
          />
          <button type="button" class="send-btn" :disabled="sending" @click="send">
            {{ sending ? '思考中' : '发送' }}
          </button>
        </section>
        <p class="disclaimer">AI 回答仅供健康管理参考，不替代医生诊断或用药建议。</p>
      </main>
    </div>
  </div>
</template>

<script>
import { getAiQaHistory, askAiQa, createAiQaSession } from '@/api/client-ai-qa'
import MarkdownView from '@/components/MarkdownView'

export default {
  name: 'ClientAiQa',
  components: { MarkdownView },
  data() {
    return {
      question: '',
      list: [],
      quickQuestions: [],
      current: 1,
      total: 0,
      loading: false,
      loadingMore: false,
      sending: false,
      creating: false,
      pageError: '',
      pendingMessages: [],
      sessionId: null,
      sessionTitle: '',
      sessions: [],
      canScrollLeft: false,
      canScrollRight: false
    }
  },
  computed: {
    currentSessionTitle() {
      return this.sessionTitle || 'AI 健康饮食助手'
    },
    messages() {
      const rows = []
      this.list.slice().reverse().forEach(item => {
        rows.push({
          key: 'q-' + item.id,
          role: 'user',
          content: item.question,
          time: item.askTime || '',
          source: ''
        })
        if (item.answer) {
          rows.push({
            key: 'a-' + item.id,
            role: 'ai',
            content: item.answer,
            time: item.askTime || '',
            source: item.sourceName || ''
          })
        }
      })
      return rows.concat(this.pendingMessages)
    }
  },
  created() {
    this.loadHistory(1)
  },
  methods: {
    async loadHistory(page) {
      if (page === 1) {
        this.loading = true
        this.pageError = ''
      } else {
        this.loadingMore = true
      }
      try {
        const res = await getAiQaHistory({ current: page, size: 10, sessionId: this.sessionId })
        const data = (res && res.data) || {}
        const records = data.records || []
        this.current = data.current || page
        this.total = Number(data.total || 0)
        this.quickQuestions = data.quickQuestions || this.quickQuestions
        this.sessions = data.sessions || this.sessions
        this.sessionId = data.sessionId || this.sessionId
        this.sessionTitle = data.sessionTitle || this.sessionTitle
        this.list = page === 1 ? records : this.list.concat(records)
        this.$nextTick(() => {
          this.scrollToBottom()
          this.updateQuickScroll()
        })
      } catch (error) {
        if (page === 1) {
          this.pageError = 'AI服务暂时不可用'
        }
      } finally {
        this.loading = false
        this.loadingMore = false
      }
    },
    async createSession() {
      if (this.creating || this.sending) {
        return
      }
      this.creating = true
      try {
        const res = await createAiQaSession()
        const item = (res && res.data) || {}
        if (!item.id) {
          this.$message.error('新建会话失败')
          return
        }
        this.sessionId = item.id
        this.sessionTitle = item.sessionTitle || '新的健康问答'
        this.sessions = [item].concat(this.sessions.filter(session => session.id !== item.id))
        this.list = []
        this.total = 0
        this.pendingMessages = []
        this.pageError = ''
      } catch (error) {
        this.$message.error('新建会话失败')
      } finally {
        this.creating = false
      }
    },
    switchSession(id) {
      if (!id || id === this.sessionId || this.sending) {
        return
      }
      this.sessionId = id
      this.pendingMessages = []
      this.loadHistory(1)
    },
    askQuick(text) {
      this.question = text
      this.send()
    },
    async send() {
      const text = (this.question || '').trim()
      if (!text) {
        this.$message.error('请输入问题')
        return
      }
      if (text.length > 500) {
        this.$message.error('问题最多 500 字')
        return
      }
      const pendingKey = 'pending-' + Date.now()
      this.pendingMessages.push({
        key: pendingKey,
        role: 'user',
        content: text,
        time: '刚刚',
        source: ''
      })
      this.question = ''
      this.sending = true
      this.$nextTick(this.scrollToBottom)
      try {
        const res = await askAiQa({ question: text, sessionId: this.sessionId })
        const item = (res && res.data) || {}
        this.pendingMessages = this.pendingMessages.filter(row => row.key !== pendingKey)
        if (item.id) {
          this.list.unshift(item)
          this.total += 1
          if (item.sessionId) {
            this.sessionId = item.sessionId
          }
          this.sessionTitle = text.length > 20 ? text.slice(0, 20) : text
          this.bumpCurrentSession()
        }
        this.$nextTick(this.scrollToBottom)
      } catch (error) {
        this.$message.error('AI服务暂时不可用')
      } finally {
        this.sending = false
      }
    },
    bumpCurrentSession() {
      const current = this.sessions.find(item => item.id === this.sessionId)
      const next = {
        id: this.sessionId,
        sessionTitle: this.sessionTitle,
        lastChatTime: '刚刚',
        messageCount: current ? Number(current.messageCount || 0) + 2 : 2
      }
      this.sessions = [next].concat(this.sessions.filter(item => item.id !== this.sessionId))
    },
    scrollToBottom() {
      const el = this.$refs.messageScroller
      if (el) {
        el.scrollTop = el.scrollHeight
      }
    },
    updateQuickScroll() {
      const el = this.$refs.quickScroller
      if (!el) {
        this.canScrollLeft = false
        this.canScrollRight = false
        return
      }
      this.canScrollLeft = el.scrollLeft > 2
      this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    },
    scrollQuick(dir) {
      const el = this.$refs.quickScroller
      if (el) {
        el.scrollBy({ left: dir * 200, behavior: 'smooth' })
      }
    },
    onQuickWheel(event) {
      const el = this.$refs.quickScroller
      if (!el) {
        return
      }
      el.scrollLeft += event.deltaY + event.deltaX
      this.updateQuickScroll()
    },
  }
}
</script>

<style lang="scss" scoped>
.qa-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 12px 16px 16px;
  height: calc(100vh - 148px);
  min-height: 560px;
  display: flex;
  flex-direction: column;
}

.chat-shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.history-panel,
.chat-panel {
  border: 1px solid #dce8dc;
  background: #fff;
  border-radius: 12px;
}

.history-panel {
  padding: 12px;
  min-height: 0;
  overflow: auto;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #1f3d24;
  margin-bottom: 10px;
  font-size: 13px;
}

.new-session-btn {
  border: 1px solid #cfe1d0;
  background: #f4fbf4;
  color: #2e7d32;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}

.new-session-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.session-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 8px;
  border-radius: 8px;
  color: #334b39;
  cursor: pointer;
}

.session-item:hover,
.session-item.active {
  background: #eef6ef;
}

.session-item strong,
.session-item small {
  display: block;
}

.session-item strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: #1f3d24;
}

.session-item small {
  margin-top: 3px;
  color: #8a9a8d;
  font-size: 11px;
}

.empty-history,
.state-box {
  text-align: center;
  color: #6d7d70;
  padding: 24px 8px;
  font-size: 13px;
}

.history-skeleton i {
  display: block;
  height: 42px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #edf4ee;
}

.load-more {
  width: 100%;
  margin-top: 8px;
}

.chat-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.chat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid #eef3ee;
}

.chat-top h3 {
  margin: 0;
  color: #203c27;
  font-size: 15px;
  font-weight: 600;
}

.chat-top p {
  margin: 2px 0 0;
  color: #7a8b7c;
  font-size: 12px;
}

.chat-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eef7ef;
  color: #2e7d32;
  font-size: 12px;
}

.status-pill i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2e7d32;
}

.ghost-btn {
  border-color: #d6e6d7;
  color: #2e7d32;
}

.message-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px;
  background: #f7faf7;
}

.welcome-card {
  width: min(380px, 100%);
  margin: 48px auto;
  padding: 16px 18px;
  border-radius: 12px;
  text-align: left;
  color: #5f7462;
  background: #fff;
  border: 1px solid #e3eee3;
  font-size: 13px;
}

.welcome-card strong {
  display: block;
  margin-bottom: 8px;
  color: #1f3d24;
  font-size: 14px;
  font-weight: 600;
}

.welcome-card p {
  margin: 0 0 6px;
  line-height: 1.5;
}

.welcome-card p:last-child {
  margin-bottom: 0;
}

.message-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #2e7d32;
}

.message-row.user .avatar {
  background: #3d5342;
}

.bubble {
  max-width: min(640px, 78%);
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e6eee6;
  color: #31463a;
  font-size: 13px;
  line-height: 1.55;
}

.message-row.user .bubble {
  background: #2e7d32;
  border-color: #2e7d32;
  color: #fff;
}

.bubble-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
  font-size: 11px;
  opacity: 0.72;
}

.bubble-content {
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
}

.bubble-content ::v-deep h4 {
  margin: 6px 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: inherit;
}

.bubble-content ::v-deep p,
.bubble-content ::v-deep li {
  font-size: 13px;
  line-height: 1.55;
}

.bubble-content ::v-deep ul {
  margin: 4px 0;
  padding-left: 18px;
}

.bubble-content ::v-deep strong {
  font-weight: 600;
}

.source {
  margin: 6px 0 0;
  color: #78917c;
  font-size: 11px;
}

.message-row.user .source {
  color: rgba(255, 255, 255, 0.78);
}

.typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  min-width: 48px;
  min-height: 18px;
}

.typing span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #7aaa80;
  animation: bounce 1s infinite ease-in-out;
}

.typing span:nth-child(2) {
  animation-delay: 0.12s;
}

.typing span:nth-child(3) {
  animation-delay: 0.24s;
}

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-4px); opacity: 1; }
}

.quick-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px 2px;
  min-width: 0;
  flex-shrink: 0;
}

.quick-nav {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: 1px solid #d7e6d7;
  border-radius: 50%;
  background: #fff;
  color: #2e7d32;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.quick-nav:disabled {
  color: #b7c4b8;
  cursor: default;
}

.quick-scroller {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 6px;
  scrollbar-width: thin;
  scrollbar-color: #b7cbb8 transparent;
}

.quick-scroller::-webkit-scrollbar {
  height: 4px;
}

.quick-scroller::-webkit-scrollbar-thumb {
  background: #b7cbb8;
  border-radius: 999px;
}

.quick-chip {
  flex: 0 0 auto;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid #d7e6d7;
  color: #2e7d32;
  background: #f6faf6;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}

.quick-chip:hover {
  background: #e8f5e9;
}

.composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
  gap: 8px;
  padding: 8px 14px 4px;
  align-items: stretch;
  flex-shrink: 0;
}

.composer ::v-deep .el-textarea__inner {
  min-height: 64px;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.5;
  border-radius: 8px;
  border-color: #d7e3d7;
}

.send-btn,
.primary-btn {
  border: 0;
  border-radius: 8px;
  background: #2e7d32;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.disclaimer {
  color: #8a9a8d;
  font-size: 11px;
  text-align: center;
  margin: 0 0 8px;
  padding: 0 14px;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .qa-page {
    height: auto;
    min-height: 0;
  }

  .chat-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .chat-shell {
    grid-template-columns: 1fr;
  }

  .history-panel {
    max-height: 180px;
  }

  .chat-panel {
    min-height: 520px;
  }

  .composer {
    grid-template-columns: 1fr;
  }

  .send-btn {
    height: 36px;
  }
}
</style>
