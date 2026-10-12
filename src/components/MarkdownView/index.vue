<template>
  <div class="md-view" v-html="html" />
</template>

<script>
import { renderMarkdown } from '@/utils/markdown'

export default {
  name: 'MarkdownView',
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  computed: {
    html() {
      return renderMarkdown(this.content)
    }
  }
}
</script>

<style lang="scss" scoped>
.md-view {
  color: inherit;
  font-size: 14px;
  line-height: 1.75;
  word-break: break-word;
}

.md-view ::v-deep > *:first-child {
  margin-top: 0;
}

.md-view ::v-deep > *:last-child {
  margin-bottom: 0;
}

.md-view ::v-deep h1,
.md-view ::v-deep h2,
.md-view ::v-deep h3,
.md-view ::v-deep h4,
.md-view ::v-deep h5,
.md-view ::v-deep h6 {
  margin: 14px 0 8px;
  font-weight: 600;
  line-height: 1.4;
  color: inherit;
}

.md-view ::v-deep h1 { font-size: 22px; }
.md-view ::v-deep h2 { font-size: 18px; }
.md-view ::v-deep h3 { font-size: 16px; }
.md-view ::v-deep h4,
.md-view ::v-deep h5,
.md-view ::v-deep h6 { font-size: 14px; }

.md-view ::v-deep p {
  margin: 0 0 8px;
}

.md-view ::v-deep ul,
.md-view ::v-deep ol {
  margin: 6px 0 10px;
  padding-left: 22px;
}

.md-view ::v-deep li {
  margin: 3px 0;
}

.md-view ::v-deep strong {
  font-weight: 600;
}

.md-view ::v-deep blockquote {
  margin: 8px 0;
  padding: 6px 12px;
  border-left: 3px solid #c8e6c9;
  background: rgba(232, 245, 233, 0.45);
  color: inherit;
}

.md-view ::v-deep code {
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 12px;
}

.md-view ::v-deep a {
  color: #2e7d32;
}

.md-view ::v-deep hr {
  border: 0;
  border-top: 1px solid #e4eee4;
  margin: 12px 0;
}

.md-view ::v-deep img {
  max-width: 100%;
  border-radius: 8px;
}
</style>
