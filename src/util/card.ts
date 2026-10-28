import path from 'node:path'
import type { CommonPost } from '../type'
import { coverSize } from './cover'
import { getTimeDiffString } from './time'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderCard(post: CommonPost, coverFile: string | undefined, directory: string) {
  const title = escapeHtml(post.title)
  const link = escapeHtml(post.link)
  const time = escapeHtml(getTimeDiffString(post.publish_time))
  const cover = coverFile
    ? `<a href="${link}" target="_blank"><img src="${escapeHtml(path.posix.join(directory, coverFile))}" width="${coverSize.width}" height="${coverSize.height}" alt="${title}"></a>\n<br>\n<br>\n`
    : ''

  return `<table align="center" width="${coverSize.width}">
  <tr>
    <td>
      ${cover}<a href="${link}" target="_blank">${title}</a>
      <br>
      ${time}
    </td>
  </tr>
</table>`
}

export function renderPostCards(posts: CommonPost[], covers: Map<string, string>, directory: string) {
  return `\n${posts.map(post => renderCard(post, covers.get(post.link), directory)).join('\n<br>\n')}\n`
}
