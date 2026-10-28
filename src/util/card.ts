import path from 'node:path'
import type { CommonPost } from '../type'
import { getTimeDiffString } from './time'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const COLUMNS = 3

function renderCell(post: CommonPost, coverFile: string | undefined, directory: string) {
  const title = escapeHtml(post.title)
  const link = escapeHtml(post.link)
  const time = escapeHtml(getTimeDiffString(post.publish_time))
  const cover = coverFile
    ? `<a href="${link}" target="_blank"><img src="${escapeHtml(path.posix.join(directory, coverFile))}" width="100%" alt="${title}"></a><br>\n`
    : ''

  return `<td width="33%" valign="top">
      ${cover}<a href="${link}" target="_blank">${title}</a>
      <br>
      ${time}
    </td>`
}

export function renderPostCards(posts: CommonPost[], covers: Map<string, string>, directory: string) {
  const rows: string[] = []
  for (let index = 0; index < posts.length; index += COLUMNS) {
    const cells = posts
      .slice(index, index + COLUMNS)
      .map(post => renderCell(post, covers.get(post.link), directory))
    while (cells.length < COLUMNS)
      cells.push('<td width="33%"></td>')
    rows.push(`  <tr>\n${cells.join('\n')}\n  </tr>`)
  }

  return `\n<table width="100%">\n${rows.join('\n')}\n</table>\n`
}
