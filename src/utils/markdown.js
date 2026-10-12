function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(text) {
  return String(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(^|[^\*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
}

export function renderMarkdown(raw) {
  if (!raw) {
    return ''
  }
  const source = String(raw).replace(/\r\n/g, '\n')
  if (/<(p|div|h[1-6]|ul|ol|li|img|table|br)\b/i.test(source)) {
    return source
  }

  const lines = escapeHtml(source).split('\n')
  const html = []
  let listType = ''

  const closeList = () => {
    if (listType) {
      html.push(listType === 'ul' ? '</ul>' : '</ol>')
      listType = ''
    }
  }

  lines.forEach(line => {
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      closeList()
      const level = heading[1].length
      html.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>')
      return
    }

    const quote = line.match(/^&gt;\s?(.*)$/)
    if (quote) {
      closeList()
      html.push('<blockquote>' + inline(quote[1]) + '</blockquote>')
      return
    }

    if (/^[-*]{3,}$/.test(line.trim())) {
      closeList()
      html.push('<hr/>')
      return
    }

    const ul = line.match(/^[-*•]\s+(.+)$/)
    if (ul) {
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push('<li>' + inline(ul[1]) + '</li>')
      return
    }

    const ol = line.match(/^\d+\.\s+(.+)$/)
    if (ol) {
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push('<li>' + inline(ol[1]) + '</li>')
      return
    }

    if (!line.trim()) {
      closeList()
      return
    }

    closeList()
    html.push('<p>' + inline(line) + '</p>')
  })

  closeList()
  return html.join('')
}
