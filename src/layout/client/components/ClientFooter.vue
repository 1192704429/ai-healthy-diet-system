<template>
  <footer class="client-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <section class="footer-col">
          <h4 class="col-title">关于我们</h4>
          <ul class="link-list">
            <li><a href="javascript:void(0)">平台介绍</a></li>
            <li><a href="javascript:void(0)">健康理念</a></li>
            <li><a href="javascript:void(0)">联系方式</a></li>
          </ul>
        </section>

        <section class="footer-col">
          <h4 class="col-title">用户帮助</h4>
          <ul class="link-list">
            <li><a href="javascript:void(0)">饮食记录说明</a></li>
            <li><a href="javascript:void(0)">常见问题</a></li>
            <li><a href="javascript:void(0)">使用指南</a></li>
          </ul>
        </section>

        <section class="footer-col">
          <h4 class="col-title">健康服务</h4>
          <ul class="link-list">
            <li><a href="javascript:void(0)">营养分析</a></li>
            <li><a href="javascript:void(0)">AI饮食建议</a></li>
            <li><a href="javascript:void(0)">健康资讯</a></li>
          </ul>
        </section>

        <section class="footer-col">
          <h4 class="col-title">联系我们</h4>
          <ul class="link-list contact-list">
            <li>电话：400-888-5200</li>
            <li>邮箱：service@healthdiet.com</li>
          </ul>
          <div class="social-wrap">
            <div class="icon-group">
              <i class="el-icon-chat-dot-round social-icon" />
              <i class="el-icon-message social-icon" />
              <i class="el-icon-phone social-icon" />
            </div>
          </div>
        </section>
      </div>

      <div class="footer-bottom">
        <p>© 2026 个性化健康饮食管理平台 All Rights Reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'ClientFooter'
}
</script>

<style lang="scss" scoped>
@import "../client-theme.scss";

.client-footer {
  margin-top: 36px;
  background: linear-gradient(180deg, $client-footer-bg-start 0%, $client-footer-bg-end 100%);
  border-top: 1px solid $client-footer-border;
  box-shadow: 0 -2px 10px $client-footer-shadow;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 34px 20px 18px;
}

.footer-top {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
  padding-bottom: 24px;
  border-bottom: 1px solid #d7e3d7;
}

.col-title {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 700;
  color: $client-footer-title;
}

.link-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.link-list li {
  margin-bottom: 10px;
  line-height: 1.7;
  color: $client-footer-text;
  font-size: 14px;
}

.link-list a {
  color: $client-footer-text;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link-list a:hover {
  color: $client-footer-link-hover;
}

.contact-list li {
  margin-bottom: 8px;
}

.social-wrap {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.social-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #fff;
  color: #2e7d32;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(46, 125, 50, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
}

.social-icon:hover {
  color: #43a047;
  transform: scale(1.08);
}

.footer-bottom {
  text-align: center;
  padding-top: 16px;
}

.footer-bottom p {
  margin: 6px 0;
  font-size: 12px;
  color: $client-footer-bottom-text;
}

@media (max-width: 960px) {
  .footer-top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .footer-top {
    grid-template-columns: 1fr;
  }
}
</style>
