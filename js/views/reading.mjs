import { e, arrow, byId, paragraphs, citations, saveButton, notePanel, readingSections, sourceList, notFound, getTheme } from '../render.mjs';

function tableOfContents(sections) {
  return `<aside class="reading-aside"><a class="back-link" href="#themes">← 回到主题目录</a><strong>这一篇的路标</strong><ol>${sections.map((section, index) => `<li><button data-jump="part-${index + 1}">${e(section.title)}</button></li>`).join('')}<li><button data-jump="article-boundary">另一种解释与边界</button></li><li><button data-jump="article-practice">带回日常</button></li><li><button data-jump="article-sources">继续查证</button></li></ol><p class="aside-note">看到方括号就能点开出处。不要只记住结论，也记住它适用到哪里。</p></aside>`;
}

export function renderChapter(ctx, id) {
  const chapter = byId(ctx.chapters, id);
  if (!chapter) return notFound();
  const related = ctx.questions.filter(q => q.theme === id).slice(0, 5);
  const books = ctx.books.filter(book => book.theme === id).slice(0, 3);
  const minutes = Math.max(3, Math.round(chapter.sections.reduce((total, section) => total + section.body.length, 0) / 350));
  const read = ctx.state.read.includes(id);
  return `<div class="page-shell">
    <header class="article-heading"><div class="article-kicker">${e(chapter.group)} <span>· 主题 ${String(ctx.chapters.indexOf(chapter) + 1).padStart(2, '0')}</span></div><h1>${e(chapter.title)}</h1><p class="article-deck">${e(chapter.subtitle)}</p><div class="article-meta"><span>约 ${minutes} 分钟 · 按字数粗估</span><span>更新 ${e(ctx.manifest.date)}</span>${saveButton(ctx, id)}<button class="quiet-button" data-read="${e(id)}" aria-pressed="${read}">${read ? '✓ 已读过' : '标记读完'}</button></div></header>
    <div class="reading-layout">${tableOfContents(chapter.sections)}
      <article class="reading-body">
        <div class="essay-lead">${paragraphs(chapter.lead)}</div>
        ${readingSections(ctx, chapter.sections)}
        <section class="counterpoint" id="article-boundary"><span class="small-label">请给反方一把椅子</span><h2>另一种解释，以及这篇的边界</h2>${paragraphs(chapter.counterpoint)}${citations(ctx, chapter.counterRefs || chapter.refs)}</section>
        <section class="practice-prompt" id="article-practice"><span class="small-label">带回日常</span><h2>不必同意我，试着做一次。</h2>${paragraphs(chapter.exercise)}<a class="text-link" href="#practice">把它写成一个小实验 ${arrow}</a></section>
        ${notePanel(ctx, id)}
        ${related.length ? `<section class="related-questions"><h2>你可能还会追问</h2>${related.map(q => `<a href="#question/${e(q.id)}"><span>${e(q.title)}</span>${arrow}</a>`).join('')}</section>` : ''}
        ${books.length ? `<section class="related-books"><h2>继续读原著</h2>${books.map(book => `<a href="#book/${e(book.id)}"><strong>${e(book.title)}</strong><span>${e(book.author)} · ${e(book.access)}</span>${arrow}</a>`).join('')}</section>` : ''}
        <section id="article-sources"><h2>这篇文章，从哪里来</h2>${sourceList(ctx, chapter.refs)}</section>
      </article>
    </div>
    <div class="next-reading"><a href="#themes">← 返回全部主题</a><a href="#answers">读关键回答 →</a></div>
  </div>`;
}

export function renderAnswer(ctx, id) {
  const answer = byId(ctx.answers, id);
  if (!answer) return notFound();
  const theme = getTheme(ctx, answer.theme);
  return `<div class="page-shell"><header class="article-heading"><div class="article-kicker">关键回答 <span>· ${e(answer.origin)}</span></div><h1>${e(answer.title)}</h1><p class="article-deck">${e(answer.summary)}</p><div class="article-meta"><span>答案可以修改，来源可以追查</span>${saveButton(ctx, id)}<a href="#answers" class="text-link">全部关键问题 ${arrow}</a></div></header>
    <div class="reading-layout">${tableOfContents(answer.sections)}<article class="reading-body">
    ${id === 'myself' ? '<div class="boundary-note"><strong>具体个人分析不放进公开页面</strong><p>结合实际项目与协作事件的阶段研究，保存在本地私人研究包中。到“自己”页选择文件即可阅读；它不会随公共网页上传，也不冒充六封邮件已全部分析完成。</p><a href="#personal">打开个人研究室 →</a></div>' : ''}
    ${readingSections(ctx, answer.sections)}
    <section class="counterpoint" id="article-boundary"><h2>答案到这里，仍然有边界</h2>${paragraphs(answer.boundary || '这是根据当前已取得的材料提出的解释，不是关于所有人、所有国家或所有时代的定律。应继续用具体证据和个人实际情况修订。')}</section>
    <section class="practice-prompt" id="article-practice"><h2>把这个回答带回今天</h2>${paragraphs(answer.exercise)}</section>
    ${notePanel(ctx, id)}
    ${theme ? `<a class="related-theme" href="#chapter/${e(theme.id)}"><span>关联主题</span><strong>${e(theme.title)}</strong>${arrow}</a>` : ''}
    <section id="article-sources"><h2>证据与继续阅读</h2>${sourceList(ctx, answer.refs)}</section></article></div></div>`;
}

export function questionRows(ctx, search = '', theme = 'all', status = 'all') {
  const terms = search.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const selected = ctx.questions.filter(question =>
    (theme === 'all' || question.theme === theme) &&
    (status === 'all' || question.status === status) &&
    terms.every(term => `${question.title} ${question.answer}`.toLocaleLowerCase().includes(term)));
  if (!selected.length) return '<div class="empty-state"><h2>没有找到符合条件的问题。</h2><p>试试更短的词，或切换到全部主题。</p><button id="clear-question-filters" class="quiet-button">清除筛选</button></div>';
  return `<p class="result-count">显示 ${selected.length} / ${ctx.questions.length} 项</p>${selected.map(question => `<a class="question-row" href="#question/${e(question.id)}"><span class="question-number">${question.originalNumber ? String(question.originalNumber).padStart(2, '0') : '＋'}</span><div><h3>${e(question.title)}</h3><p>${e(getTheme(ctx, question.theme)?.title || '')} · ${question.origin === 'kimi-secondary' ? '旧稿问题重述' : '本轮要求整理'}</p></div><span class="question-status">${e(question.status)}</span><span aria-hidden="true">↗</span></a>`).join('')}`;
}

export function renderQuestions(ctx) {
  const statuses = [...new Set(ctx.questions.map(q => q.status))];
  return `<div class="page-shell"><header class="page-heading"><span class="small-label">研究清单</span><h1>把每一次追问，<br>放回它的位置。</h1><p>旧稿六十六问逐条重述、合并到主题，并另列本轮要求。不沿用旧稿“已解”的自我认证；原始豆包缺失的部分不计作已恢复。</p></header>
    <div class="filter-bar"><label for="question-search">寻找问题<input id="question-search" type="search" placeholder="例如：突厥、法郎、工作、自由"></label><label for="question-theme">主题<select id="question-theme"><option value="all">全部主题</option>${ctx.chapters.map(chapter => `<option value="${e(chapter.id)}">${e(chapter.title)}</option>`).join('')}</select></label><label for="question-status">研究状态<select id="question-status"><option value="all">全部状态</option>${statuses.map(status => `<option>${e(status)}</option>`).join('')}</select></label></div>
    <div id="question-results">${questionRows(ctx)}</div>
    <div class="boundary-note"><strong>清单完整性 ≠ 原始对话完整性</strong><p>这里覆盖的是可读取旧稿中的全部编号问题。五段豆包若补入新问题，清单仍需重新核对和增补。</p><a href="#sources">看材料读取记录 →</a></div></div>`;
}

export function renderQuestion(ctx, id) {
  const question = byId(ctx.questions, id);
  if (!question) return notFound();
  const theme = getTheme(ctx, question.theme);
  return `<div class="page-shell"><header class="article-heading"><div class="article-kicker">研究问题 ${e(question.originalNumber || '· 本轮')} <span>· ${e(question.status)}</span></div><h1>${e(question.title)}</h1><p class="article-deck">${question.origin === 'kimi-secondary' ? '根据旧稿问题重述，不冒充逐字聊天原文。' : '从本次明确要求整理出的工作问题。'}</p><div class="article-meta">${saveButton(ctx, id)}<a href="#questions" class="text-link">全部研究问题 ${arrow}</a></div></header><article class="reading-body standalone">
    <section><h2>先把问题回答清楚</h2>${paragraphs(question.answer)}${citations(ctx, question.refs)}</section>
    ${question.semanticReview ? `<div class="boundary-note"><strong>语义回查：${e(question.semanticReview.status)}</strong><p>${e(question.semanticReview.remaining)}</p><a href="#sources">查看全部问题的覆盖状态 →</a></div>` : ''}
    ${question.caveat ? `<section class="counterpoint"><h2>不能顺着这个答案多走的一步</h2>${paragraphs(question.caveat)}</section>` : ''}
    ${theme ? `<a class="related-theme" href="#chapter/${e(theme.id)}"><span>这条问题融入了哪篇长文</span><strong>${e(theme.title)}</strong>${arrow}</a>` : ''}
    ${question.answerId && byId(ctx.answers, question.answerId) ? `<a class="related-theme" href="#answer/${e(question.answerId)}"><span>继续深入</span><strong>${e(byId(ctx.answers, question.answerId).title)}</strong>${arrow}</a>` : ''}
    ${notePanel(ctx, id)}<section><h2>继续查证</h2>${sourceList(ctx, question.refs)}</section></article></div>`;
}
