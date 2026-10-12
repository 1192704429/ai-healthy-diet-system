<template>
  <div class="pagination-wrapper" v-show="total > 0">
    <el-pagination
      :current-page="currentPage"
      :page-sizes="computedPageSizes"
      :page-size="pageSize"
      :total="total"
      :layout="layout"
      :background="background"
      :small="small"
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  computed: {
    // 确保当前的 pageSize 在 pageSizes 选项中
    computedPageSizes() {
      const sizes = [...this.pageSizes]
      // 如果当前的 pageSize 不在选项中，则添加进去并排序
      if (!sizes.includes(this.pageSize)) {
        sizes.push(this.pageSize)
        sizes.sort((a, b) => a - b)
      }
      return sizes
    }
  },
  props: {
    // 当前页码
    currentPage: {
      type: Number,
      default: 1
    },
    // 每页显示数量
    pageSize: {
      type: Number,
      default: 10
    },
    // 总记录数
    total: {
      type: Number,
      default: 0,
      required: true
    },
    // 每页显示数量选项
    pageSizes: {
      type: Array,
      default: () => [10, 20, 50, 100]
    },
    // 组件布局，子组件名用逗号分隔
    layout: {
      type: String,
      default: 'total, sizes, prev, pager, next, jumper'
    },
    // 是否为分页按钮添加背景色
    background: {
      type: Boolean,
      default: false
    },
    // 是否使用小型分页样式
    small: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    // 每页显示数量改变时触发
    handleSizeChange(val) {
      this.$emit('update:pageSize', val)
      this.$emit('size-change', val)
    },
    // 当前页改变时触发
    handleCurrentChange(val) {
      this.$emit('update:currentPage', val)
      this.$emit('current-change', val)
    }
  }
}
</script>

<style scoped lang="scss">
// 导入全局变量
@import '@/styles/variables.scss';

// 使用现有变量
$primary-color: $menuHover;
$primary-hover: $subMenuHover;
$primary-light: rgba($menuHover, 0.1);
$neutral-text: darken($menuText, 60%);
$neutral-text-light: darken($menuText, 40%);
$neutral-bg: $menuText;
$neutral-bg-hover: lighten($menuBg, 85%);
$neutral-border: $menuBg;
$neutral-button-bg: lighten($menuBg, 80%);
$transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  
  .pagination {
    // 白色卡片容器
    background-color: $neutral-bg;
    border-radius: 8px;
    padding: 12px 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
    display: inline-flex;
    align-items: center;
    gap: 12px;

    // 总数文字样式
    ::v-deep .el-pagination__total {
      color: $neutral-text;
      font-size: 14px;
      font-weight: 400;
      margin-right: 0;
      white-space: nowrap;
    }

    // 每页数量选择器 - 与整体风格保持一致
    ::v-deep .el-pagination__sizes {
      margin-right: 0;
      
      .el-select {
        .el-input {
          .el-input__inner {
            border-radius: 6px;
            border: 1px solid $neutral-border;
            background-color: $neutral-bg;
            transition: $transition-base;
            font-size: 14px;
            height: 32px;
            line-height: 32px;
            color: $neutral-text;
            padding: 0 24px 0 8px;
            
            &:hover {
              border-color: $menuHover;
            }
            
            &:focus {
              border-color: $menuHover;
              box-shadow: 0 0 0 2px $primary-light;
            }
          }
        }
        
        .el-input__suffix {
          .el-select__caret {
            color: $neutral-text-light;
          }
        }
      }
    }

    // 上一页/下一页按钮 - 灰色圆角按钮
    ::v-deep .btn-prev,
    ::v-deep .btn-next {
      background-color: $neutral-button-bg;
      border: none;
      border-radius: 6px;
      color: $neutral-text;
      min-width: 70px;
      height: 32px;
      line-height: 32px;
      transition: $transition-base;
      margin: 0;
      padding: 0 12px;
      font-size: 14px;
      
      &:hover:not(.disabled) {
        background-color: darken($neutral-button-bg, 5%);
        color: $menuHover;
      }
      
      &:active:not(.disabled) {
        background-color: darken($neutral-button-bg, 8%);
      }
      
      &.disabled {
        color: #c0c4cc;
        cursor: not-allowed;
        background-color: $neutral-button-bg;
        opacity: 0.6;
        
        &:hover {
          background-color: $neutral-button-bg;
          color: #c0c4cc;
        }
      }
    }

    // 页码按钮 - 圆形激活状态
    ::v-deep .el-pager {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      
      li {
        background-color: transparent;
        border: none;
        border-radius: 50%;
        color: $neutral-text;
        min-width: 32px;
        width: 32px;
        height: 32px;
        line-height: 32px;
        margin: 0;
        padding: 0;
        transition: $transition-base;
        font-weight: 400;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        // 非激活状态
        &:not(.active):hover {
          color: $menuHover;
          background-color: $primary-light;
        }
        
        // 激活状态 - 使用 menuBg 作为主要颜色
        &.active {
          background-color: $menuBg;
          color: #ffffff;
          font-weight: 500;
          
          &:hover {
            background-color: $menuHover;
          }
        }
        
        // 更多按钮样式
        &.more {
          color: $neutral-text-light;
          border-radius: 4px;
          
          &:hover {
            color: $menuHover;
            background-color: $primary-light;
          }
        }
      }
    }

    // 跳转输入框 - "前往 X 页" 样式
    ::v-deep .el-pagination__jump {
      margin-left: 0;
      color: $neutral-text;
      font-size: 14px;
      font-weight: 400;
      display: flex;
      align-items: center;
      gap: 8px;
      
      .el-input {
        width: 50px;
        margin: 0;
        
        .el-input__inner {
          border-radius: 6px;
          border: 1px solid $neutral-border;
          background-color: $neutral-bg;
          transition: $transition-base;
          text-align: center;
          height: 32px;
          line-height: 32px;
          font-size: 14px;
          color: $neutral-text;
          padding: 0 8px;
          
          &:hover {
            border-color: $primary-color;
          }
          
          &:focus {
            border-color: $primary-color;
            background-color: $neutral-bg;
            box-shadow: 0 0 0 2px $primary-light;
          }
        }
      }
    }

    // 小型分页样式
    &.el-pagination--small {
      padding: 8px 16px;
      
      ::v-deep .btn-prev,
      ::v-deep .btn-next {
        min-width: 60px;
        height: 28px;
        line-height: 28px;
        font-size: 13px;
      }
      
      ::v-deep .el-pager li {
        min-width: 28px;
        width: 28px;
        height: 28px;
        line-height: 28px;
        font-size: 13px;
      }
      
      ::v-deep .el-pagination__jump .el-input .el-input__inner {
        height: 28px;
        line-height: 28px;
        font-size: 13px;
      }
    }
  }
}

// 响应式设计 - 移动端简化
@media (max-width: 768px) {
  .pagination-wrapper {
    justify-content: center;
    
    .pagination {
      padding: 10px 16px;
      
      ::v-deep .el-pagination__total,
      ::v-deep .el-pagination__jump {
        display: none;
      }
    }
  }
}
</style>
