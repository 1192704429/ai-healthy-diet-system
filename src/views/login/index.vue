<template>
  <div class="admin-login">
    <header class="topbar">
      <div class="topbar-brand">
        <span class="mark">管</span>
        <div>
          <strong>个性化健康饮食管理系统</strong>
          <small>ADMIN CONSOLE</small>
        </div>
      </div>
      <button type="button" class="user-entry" @click="$router.push('/user/login')">
        去用户端登录
      </button>
    </header>

    <div class="workspace">
      <section class="brief">
        <p class="kicker">运营管理中心</p>
        <h1>统一管理用户、内容<br>与推荐策略</h1>
        <p class="lead">登录后可查看数据看板、审核资讯、维护食物库，并配置推荐参数。</p>
        <ul class="modules">
          <li>
            <span>01</span>
            <div>
              <b>数据看板</b>
              <em>掌握使用情况与核心指标</em>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <b>内容审核</b>
              <em>维护健康资讯与食物数据</em>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <b>策略配置</b>
              <em>优化推荐效果与运营规则</em>
            </div>
          </li>
        </ul>
      </section>

      <section class="login-panel">
        <p class="panel-kicker">Administrator</p>
        <h2>管理员登录</h2>
        <p class="panel-sub">仅限管理员账号进入后台</p>

        <el-alert
          v-if="formError"
          :title="formError"
          type="error"
          show-icon
          :closable="false"
          class="login-error"
        />

        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" @keyup.enter.native="handleLogin">
          <el-form-item prop="username">
            <label class="field-label">管理员账号</label>
            <el-input
              v-model="loginForm.username"
              prefix-icon="el-icon-user"
              placeholder="请输入管理员账号"
              maxlength="50"
              @input="formError = ''"
            />
          </el-form-item>
          <el-form-item prop="password">
            <label class="field-label">密码</label>
            <el-input
              v-model="loginForm.password"
              prefix-icon="el-icon-lock"
              type="password"
              placeholder="请输入密码"
              maxlength="20"
              show-password
              @input="formError = ''"
            />
          </el-form-item>
          <el-button type="primary" :loading="loading" class="login-button" @click="handleLogin">进入后台</el-button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value || !String(value).trim()) {
        callback(new Error('请输入用户名'))
        return
      }
      if (/\s/.test(value)) {
        callback(new Error('用户名不能包含空格'))
        return
      }
      if (value.length > 50) {
        callback(new Error('用户名最长50个字符'))
        return
      }
      callback()
    }
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
        return
      }
      if (/\s/.test(value)) {
        callback(new Error('密码不能包含空格'))
        return
      }
      if (value.length < 6 || value.length > 20) {
        callback(new Error('密码长度为6-20位'))
        return
      }
      callback()
    }
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [{ validator: validateUsername, trigger: 'blur' }],
        password: [{ validator: validatePassword, trigger: 'blur' }]
      },
      loading: false,
      formError: ''
    }
  },
  methods: {
    handleLogin() {
      this.formError = ''
      this.$refs.loginForm.validate(valid => {
        if (!valid) {
          return false
        }
        this.loading = true
        this.$store.dispatch('user/login', this.loginForm).then(() => {
          this.$router.push('/admin-data-statistics')
          this.loading = false
        }).catch(error => {
          this.loading = false
          this.formError = (error && error.message) ? error.message : '用户名或密码错误'
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.admin-login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: $menuText;
  background: #f0f2f5;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: $menuBg;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mark {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: $menuActiveText;
  color: #fff;
  font-weight: 700;
}

.topbar-brand strong,
.topbar-brand small {
  display: block;
}

.topbar-brand strong {
  font-size: 14px;
  color: #fff;
}

.topbar-brand small {
  margin-top: 2px;
  font-size: 11px;
  letter-spacing: 0.12em;
  color: $menuText;
}

.user-entry {
  border: 0;
  background: none;
  color: $menuText;
  font-size: 13px;
  cursor: pointer;
}

.user-entry:hover {
  color: $menuActiveText;
  text-decoration: underline;
}

.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 400px;
  gap: 36px;
  align-items: center;
  width: min(1040px, calc(100% - 48px));
  margin: 0 auto;
  padding: 36px 0;
}

.kicker,
.panel-kicker {
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: $menuActiveText;
}

.brief h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.3;
  font-weight: 650;
  color: $menuBg;
}

.lead {
  max-width: 460px;
  margin: 14px 0 24px;
  font-size: 14px;
  line-height: 1.7;
  color: #606266;
}

.modules {
  list-style: none;
  margin: 0;
  padding: 0;
  max-width: 420px;
}

.modules li {
  display: flex;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid #e4e7ed;
}

.modules span {
  width: 28px;
  color: $menuActiveText;
  font-size: 12px;
}

.modules b,
.modules em {
  display: block;
}

.modules b {
  color: $menuBg;
  font-size: 14px;
}

.modules em {
  margin-top: 3px;
  font-style: normal;
  font-size: 12px;
  color: #909399;
}

.login-panel {
  padding: 28px 26px 24px;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.login-panel h2 {
  margin: 0;
  font-size: 22px;
  color: $menuBg;
}

.panel-sub {
  margin: 8px 0 18px;
  font-size: 13px;
  color: #909399;
}

.login-error {
  margin-bottom: 14px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.login-form {
  ::v-deep .el-input__inner {
    height: 42px;
    border-radius: 4px;
  }

  .el-form-item {
    margin-bottom: 16px;
  }
}

.login-button {
  width: 100%;
  height: 42px;
  margin-top: 4px;
  font-size: 15px;
  letter-spacing: 2px;
  border: none;
  border-radius: 4px;
  background: $menuBg;
}

.login-button:hover,
.login-button:focus {
  background: $menuHover;
}

@media (max-width: 860px) {
  .workspace {
    grid-template-columns: 1fr;
    width: calc(100% - 32px);
  }

  .brief {
    display: none;
  }
}
</style>
