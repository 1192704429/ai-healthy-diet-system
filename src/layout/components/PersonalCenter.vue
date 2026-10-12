<template>
  <el-dialog
          :visible.sync="dialogVisible"
          width="600px"
          :before-close="handleClose"
          custom-class="sci-fi-dialog"
          append-to-body
  >
    <div slot="title" class="sci-fi-header">
      <span class="header-text">个人中心</span>
    </div>

    <div class="sci-fi-body">
      <el-tabs v-model="activeTab" class="sci-fi-tabs">
        <el-tab-pane name="info">
          <span slot="label" class="tab-label">
            <i class="el-icon-monitor"></i> 个人信息
          </span>
          <div class="content-wrapper">
              <UserInfoadmin ref="userInfoRef" v-if="role === 'admin'" />
          </div>
        </el-tab-pane>

        <el-tab-pane name="password">
          <span slot="label" class="tab-label">
            <i class="el-icon-lock"></i> 修改密码
          </span>
          <div class="content-wrapper">
            <personal-center-change-password ref="passwordRef" @success="handlePasswordSuccess" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="sci-fi-footer-decoration">
      <div class="line"></div>
      <div class="dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  </el-dialog>
</template>

<script>
  import { mapGetters } from 'vuex'
  import PersonalCenterChangePassword from '@/layout/components/ChangePassword.vue'
    import UserInfoadmin from '@/views/personalCenter/UserInfoadmin.vue'

  export default {
    name: 'PersonalCenter',
    components: {
      PersonalCenterChangePassword,
          UserInfoadmin,
    },
    computed: {
      ...mapGetters([
        'role'
      ])
    },
    data() {
      return {
        dialogVisible: false,
        activeTab: 'info'
      }
    },
    methods: {
      open() {
        this.dialogVisible = true
        this.$nextTick(() => {
          if (this.$refs.userInfoRef && this.$refs.userInfoRef.initUserInfo) {
            this.$refs.userInfoRef.initUserInfo()
          }
        })
      },
      handleClose() {
        this.dialogVisible = false
        this.resetForm()
      },
      resetForm() {
        if (this.$refs.userInfoRef && this.$refs.userInfoRef.reset) {
          this.$refs.userInfoRef.reset()
        }
        if (this.$refs.passwordRef && this.$refs.passwordRef.reset) {
          this.$refs.passwordRef.reset()
        }
      },
      handlePasswordSuccess() {
        this.handleClose()
      }
    }
  }
</script>

<style lang="scss" scoped>
  // UI 主题参数统一配置
    $primary-color: #304156; // 主题粉色
    $primary-light: rgba(255, 105, 180, 0.1);
    $primary-glow: rgba(255, 105, 180, 0.4);
    $bg-glass: rgba(255, 255, 255, 0.85);
    $text-main: #303133;
    $text-secondary: #909399;

  ::v-deep .sci-fi-dialog {
    background: $bg-glass;
    backdrop-filter: blur(20px);
    border: 1px solid rgba($primary-color, 0.3);
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba($primary-color, 0.05);
    overflow: hidden;

    .el-dialog__header {
      padding: 30px 40px 10px;
    }

    .el-dialog__body {
      padding: 10px 40px 30px;
      color: $text-main;
    }

    .el-dialog__headerbtn {
      top: 30px;
      right: 30px;
      .el-dialog__close {
        color: $primary-color;
        font-size: 20px;
        transition: all 0.3s;
        &:hover {
          transform: rotate(90deg);
          text-shadow: 0 0 10px $primary-glow;
        }
      }
    }
  }

  .sci-fi-header {
    display: flex;
    align-items: center;
    gap: 15px;

    .header-icon {
      width: 24px;
      height: 24px;
      border: 2px solid $primary-color;
      position: relative;
      transform: rotate(45deg);

      .icon-inner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 10px;
        height: 10px;
        background: $primary-color;
        box-shadow: 0 0 10px rgba($primary-color, 0.8);
      }
    }

    .header-text {
      font-size: 20px;
      font-weight: 800;
      color: $primary-color;
      letter-spacing: 2px;
      text-shadow: 0 2px 4px rgba($primary-color, 0.2);
      font-family: 'Courier New', Courier, monospace;
    }
  }

  .sci-fi-tabs {
    border: none !important;
    background: transparent !important;

    ::v-deep .el-tabs__header {
      background: transparent;
      border-bottom: 1px solid rgba($primary-color, 0.1);
      margin-bottom: 25px;
    }

    ::v-deep .el-tabs__nav {
      border: none !important;
    }

    ::v-deep .el-tabs__active-bar {
      background-color: $primary-color !important;
      box-shadow: 0 0 10px $primary-glow;
      height: 3px;
      border-radius: 3px;
    }

    ::v-deep .el-tabs__item {
      color: $text-secondary !important;
      height: 45px;
      line-height: 45px;
      padding: 0 30px !important;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: none !important;
      font-weight: 600;
      letter-spacing: 1px;

      i {
        color: inherit;
      }

      &.is-active {
        color: $primary-color !important;
        text-shadow: 0 0 10px rgba($primary-color, 0.3);
        position: relative;

        i {
          color: $primary-color;
        }
      }

      &:hover {
        color: $primary-color !important;
        opacity: 0.8;
      }
    }

    ::v-deep .el-tabs__content {
      overflow: visible;
    }
  }

  .content-wrapper {
    padding: 10px 0;

    ::v-deep .el-form {
      .el-form-item__label {
        color: #606266 !important;
        font-weight: bold;
      }

      .el-input__inner {
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid #dcdfe6;
        border-radius: 8px;
        color: $text-main;
        transition: all 0.3s;

        &:focus {
          border-color: $primary-color;
          box-shadow: 0 0 8px rgba($primary-color, 0.2);
          background: #fff;
        }

        &:disabled {
          background: #f5f7fa;
          border-color: #e4e7ed;
          color: #c0c4cc;
        }
      }

      .el-button--primary {
        background: linear-gradient(135deg, lighten($primary-color, 10%) 0%, $primary-color 100%);
        border: none;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba($primary-color, 0.3);
        font-weight: bold;
        letter-spacing: 1px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba($primary-color, 0.4);
          filter: brightness(1.05);
        }
      }
    }
  }

  .sci-fi-footer-decoration {
    position: absolute;
    bottom: 10px;
    left: 0;
    width: 100%;
    padding: 0 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;

    .line {
      width: 100%;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba($primary-color, 0.2), transparent);
    }

    .dots {
      display: flex;
      gap: 8px;
      margin-top: 5px;

      span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: rgba($primary-color, 0.4);
        animation: pulse 2s infinite;

        &:nth-child(2) { animation-delay: 0.3s; }
        &:nth-child(3) { animation-delay: 0.6s; }
      }
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.5); }
  }
</style>
