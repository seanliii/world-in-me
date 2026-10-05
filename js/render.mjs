import { escapeHTML as e } from './model.mjs';
export { e };
export const arrow = '<span aria-hidden="true">↗</span>';
export const short = (value, length = 110) => String(value || '').length > length ? String(value).slice(0, length) + '…' : String(value || '');
export const paragraphs = value => String(value || '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${e(p)}</p>`).join('');
export const external = url => /^https:\/\//.test(String(url || '')) ? e(url) : '#sources';
export const formatYear = year => Number(year) < 0 ? `公元前 ${Math.abs(Number(year))} 年` : `${e(year)} 年`;
export const byId = (items, id) => (items || []).find(item => item.id === id);
export const getBook = (ctx, id) => byId(ctx.books, id);
export const getTheme = (ctx, id) => byId(ctx.chapters, id);

export function citations(ctx, refs = []) {
  return `<span class="citations">${[...new Set(refs)].map(id => {
    const source = byId(ctx.sources, id);
    const number = ctx.sources.findIndex(source => source.id === id) + 1;
    return source ? `<a class="citation" href="#source/${e(id)}" title="${e(source.title)}" aria-label="来源${number}：${e(source.title)}">[${number}]</a>` : '';
  }).join('')}</span>`;
}

export function photo(ctx, id, className = '', eager = false) {
  const image = byId(ctx.media, id);
  if (!image) return '';
  const fullCaption = image.caption || image.alt;
  const caption = className.startsWith('hero-') ? fullCaption.split('。')[0] + '。' : fullCaption;
  return `<figure class="photo ${e(className)}">
    <img src="${external(image.url)}" alt="${e(image.alt)}" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer">
    <span class="photo-fallback" hidden>资料影像暂未加载<br><small>${e(image.alt)}</small></span>
    <figcaption title="${e(fullCaption)}">${e(caption)} <a href="${external(image.sourcePage)}" target="_blank" rel="noopener noreferrer" aria-label="影像出处与许可：${e(image.alt)}">出处 ↗</a></figcaption>
  </figure>`;
}

export function bookCover(book, index = 0) {
  const colors = ['ink', 'rust', 'sand', 'blue', 'sage', 'plum'];
  return `<div class="book-cover cover-${colors[index % colors.length]}" aria-label="书目文字卡：${e(book.title)}">
    <span class="cover-author">${e(book.author)}</span>
    <strong>${e(book.title)}</strong>
    <span class="cover-original">${e(book.originalTitle)}</span>
    <span class="cover-year">${e(book.year || '原典阅读')}</span>
  </div>`;
}

export function saveButton(ctx, id, label = '收藏') {
  const saved = ctx.state.saved.includes(id);
  return `<button class="quiet-button${saved ? ' is-saved' : ''}" data-save="${e(id)}" aria-pressed="${saved}">${saved ? '✓ 已收藏' : '+ ' + e(label)}</button>`;
}

export function notePanel(ctx, id, prompt = '我原来怎么想？哪条证据改变了我？下一次具体做什么？') {
  return `<section class="note-panel" aria-label="私人阅读笔记">
    <div class="note-heading"><div><h3>留下一点自己的东西</h3><p>只存在此浏览器，不上传。换设备前记得导出。</p></div><span aria-hidden="true">✎</span></div>
    <label for="note-${e(id)}">${e(prompt)}</label>
    <textarea id="note-${e(id)}" data-note="${e(id)}" maxlength="12000" rows="5" placeholder="不求完整，先写下一个观察……">${e(ctx.state.notes[id] || '')}</textarea>
    <div class="note-actions"><button class="button button-small" data-save-note="${e(id)}">保存这段笔记</button><a href="#practice">导出备份与行动记录 ${arrow}</a></div>
  </section>`;
}

export function sectionHeader(number, title, description = '', href = '', label = '继续探索') {
  return `<div class="section-heading"><div class="section-number">${e(number)}</div><div><h2>${e(title)}</h2>${description ? `<p>${e(description)}</p>` : ''}</div>${href ? `<a class="text-link" href="${e(href)}">${e(label)} ${arrow}</a>` : ''}</div>`;
}

export function sourceList(ctx, refs) {
  return `<ol class="article-sources">${[...new Set(refs || [])].map(id => {
    const source = byId(ctx.sources, id);
    if (!source) return '';
    return `<li><a href="#source/${e(id)}">${e(source.title)}</a><span>${e(source.author || '')} · ${e(source.year || '')} · ${e(source.access)}</span></li>`;
  }).join('')}</ol>`;
}

export function readingSections(ctx, sections) {
  return (sections || []).map((section, index) => `<section class="essay-section" id="part-${index + 1}">
    <h2>${e(section.title)}</h2>${section.kind ? `<span class="evidence-label">${e(section.kind)}</span>` : ''}
    ${paragraphs(section.body)}
    ${section.quote ? `<blockquote lang="${e(section.quote.language || 'en')}"><p>${e(section.quote.original)}</p><p class="quote-translation">${e(section.quote.translation)}</p><footer>${e(section.quote.context || '原文短引；中文为本网站自译。')}</footer></blockquote>` : ''}
    ${citations(ctx, section.refs || [])}
  </section>`).join('');
}

export function notFound() {
  return `<section class="page-shell empty-page"><span class="empty-symbol">↶</span><h1>没有找到这篇内容</h1><p>这条链接可能已经更名。正文与笔记仍在，可以从目录重新找到它。</p><a class="button" href="#themes">返回主题目录</a></section>`;
}
