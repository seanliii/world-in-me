import { e, arrow, external, byId, bookCover, citations, sourceList, paragraphs, saveButton, notePanel, notFound, short } from '../render.mjs';
import { renderEmailIntake } from '../intake.mjs';

const readingPairs = [
  { label: '征服：地理条件与地方行动者', first: 'book-original-01', second: 'book-af-03' },
  { label: '制度：训练身体与共同治理', first: 'book-ag-01', second: 'book-commons' },
  { label: '自我：能力与未来感受', first: 'book-personal-02', second: 'book-personal-03' }
];

export function renderComparison(ctx, firstId, secondId) {
  const first = byId(ctx.books, firstId || readingPairs[0].first) || ctx.books[0];
  const second = byId(ctx.books, secondId || readingPairs[0].second) || ctx.books[1];
  if (!first || !second) return '';
  return [first, second].map(book => `<div class="compare-column"><span class="small-label">${e(book.author)}</span><h3>${e(book.title)}</h3><dl><dt>它让你看见什么</dt><dd>${e(book.thesis)}</dd><dt>怎样读，而非怎样背</dt><dd>${e(book.reading)}</dd><dt>局限与不能回答的事</dt><dd>${e(book.limits)}</dd></dl><a class="text-link" href="#book/${e(book.id)}">进入原典卡 ${arrow}</a></div>`).join('');
}

export function bookCards(ctx, search = '', kind = 'all') {
  const selected = ctx.books.filter(book => (kind === 'all' || book.kind === kind) &&
    `${book.title} ${book.originalTitle} ${book.author} ${book.country || ''}`.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()));
  return selected.length ? selected.map(book => `<article class="book-card"><a href="#book/${e(book.id)}">${bookCover(book, ctx.books.indexOf(book))}</a><div class="book-card-copy"><div class="book-kind">${e(book.kind)}${book.country ? ` · ${e(book.country)}` : ''}</div><h3><a href="#book/${e(book.id)}">${e(book.title)}</a></h3><p class="book-author">${e(book.author)}</p><p>${e(short(book.why || book.thesis, 120))}</p><small>${e(book.access)}</small><div class="book-actions"><a class="text-link" href="#book/${e(book.id)}">读法与边界 ${arrow}</a>${saveButton(ctx, book.id)}</div></div></article>`).join('') : '<div class="empty-state"><h2>没有找到这本书。</h2><p>换一个作者、原题或国家名称试试。</p></div>';
}

export function renderVideos(ctx) {
  if (!ctx.videos?.length) return '';
  return `<section class="video-section" id="video-library"><div class="section-heading"><div><h2>换一种方式，听作者说</h2><p>真实讲座与官方课程入口。中文是导读，不冒充全片逐句翻译；不会自动播放或预加载视频。</p></div></div><div class="video-grid">${ctx.videos.map(video => `<article class="video-card"><div class="video-top"><span class="video-symbol" aria-hidden="true">▶</span><span>${e(video.language)} · ${e(video.access || '官方视频入口')}</span></div><h3>${e(video.title)}</h3><p>${e(video.description)}</p>${video.questions?.length ? `<ul>${video.questions.map(q => `<li>${e(q)}</li>`).join('')}</ul>` : ''}<div id="video-${e(video.id)}" class="video-target"></div><div class="video-actions">${video.embedUrl ? `<button class="button button-small" data-video="${e(video.id)}">在此加载视频</button>` : ''}<a href="${external(video.url)}" target="_blank" rel="noopener noreferrer">到原站观看 ${arrow}</a></div>${citations(ctx, video.refs || [])}</article>`).join('')}</div></section>`;
}

export function renderLibrary(ctx) {
  return `<div class="page-shell"><header class="page-heading"><span class="small-label">原典书架</span><h1>不要只借来结论，<br>去看看它怎样长出来。</h1><p>研究著作与十一国文学并置。短引保留原词，中文为自译；未取得原文的书，只提供可核查书目与有边界的读法。</p></header>
    <div class="library-note"><strong>“原味阅读”的承诺</strong><p>不编引句、不捏页码、不把出版社简介说成通读全书。书目卡是文字设计，不是原版封面。文学入口包含原来的十一国，也加入埃塞俄比亚的对照阅读。</p></div>
    ${ctx.bookRegister?.works?.length ? `<details class="original-book-register"><summary>旧稿里的 ${ctx.bookRegister.works.length} 部书，都去了哪里？<span>查看逐本处理与阅读范围 ＋</span></summary><div><p>${e(ctx.bookRegister.note)}</p>${ctx.bookRegister.works.map(work => `<a href="#book/${e(work.libraryId)}"><span>${String(work.originalNumber).padStart(2, '0')}</span><div><strong>${e(work.title)}</strong><small>${e(work.siteAccess)}</small></div>${arrow}</a>`).join('')}<a class="text-link" href="data/book-register.json" download>下载逐本登记 ${arrow}</a></div></details>` : ''}
    <section class="comparison"><div class="comparison-heading"><div><span class="small-label">给一个问题，换一副眼光</span><h2>把两本书，放在一起读。</h2></div><div class="compare-controls"><label for="book-a">第一本<select id="book-a">${ctx.books.map(book => `<option value="${e(book.id)}"${book.id === readingPairs[0].first ? ' selected' : ''}>${e(book.title)}</option>`).join('')}</select></label><span aria-hidden="true">×</span><label for="book-b">第二本<select id="book-b">${ctx.books.map(book => `<option value="${e(book.id)}"${book.id === readingPairs[0].second ? ' selected' : ''}>${e(book.title)}</option>`).join('')}</select></label></div></div><div class="reading-pairs">${readingPairs.filter(pair => byId(ctx.books, pair.first) && byId(ctx.books, pair.second)).map(pair => `<button class="quiet-button" data-book-pair="${e(pair.first)}|${e(pair.second)}">${e(pair.label)}</button>`).join('')}</div><p class="comparison-note">对读不意味着两本书必然对立。先看它们在解释哪个问题、采用什么尺度，再判断哪些部分能够互相校正。</p><div id="book-comparison">${renderComparison(ctx)}</div></section>
    <div class="filter-bar"><label for="book-search">找到一本书<input id="book-search" type="search" placeholder="书名、作者、原文标题或国家"></label><label for="book-kind">书架<select id="book-kind"><option value="all">全部书架</option>${[...new Set(ctx.books.map(book => book.kind))].map(kind => `<option>${e(kind)}</option>`).join('')}</select></label></div>
    <div class="book-grid" id="book-results">${bookCards(ctx)}</div>
    ${renderVideos(ctx)}</div>`;
}

export function renderBook(ctx, id) {
  const book = byId(ctx.books, id);
  if (!book) return notFound();
  return `<div class="page-shell"><header class="book-detail-heading"><div class="book-detail-cover">${bookCover(book, ctx.books.indexOf(book))}<small>文字书目卡，非原版封面</small></div><div><span class="small-label">${e(book.kind)}${book.country ? ` · ${e(book.country)}` : ''}</span><h1>${e(book.title)}</h1><p class="book-original" lang="en">${e(book.originalTitle)}</p><p class="book-author">${e(book.author)} · ${e(book.year || '')}</p><p>${e(book.why || book.thesis)}</p><div class="article-meta"><span class="access-label">${e(book.access)}</span>${saveButton(ctx, id)}</div>${book.translationNote ? `<p class="muted">${e(book.translationNote)}</p>` : ''}</div></header>
    <article class="reading-body standalone"><section><h2>它真正要处理的问题</h2>${paragraphs(book.thesis)}${citations(ctx, book.refs)}</section>
    ${book.quote?.original ? `<section><h2>停在原词上，读慢一点</h2><blockquote lang="${e(book.quote.language || 'en')}"><p>${e(book.quote.original)}</p><p class="quote-translation">${e(book.quote.translation)}</p><footer>${e(book.quote.context || '极短原文引用；中文为本网站自译。')}</footer></blockquote>${book.quote.explanation ? paragraphs(book.quote.explanation) : ''}${citations(ctx, book.quote.refs || book.refs)}</section>` : `<div class="boundary-note"><strong>这里没有假引文</strong><p>本次未取得足以核对的原著短引，故不制作“名言”。下面是公开可读范围内的导读，不替代阅读原书。</p></div>`}
    ${book.closeReading ? `<section class="close-reading"><span class="small-label">不是简介，而是实际读过的片段</span><h2>停下来，读这一段。</h2><p class="close-reading-scope">${e(book.closeReadingScope)}</p>${paragraphs(book.closeReading)}${citations(ctx, book.closeReadingRefs || book.refs)}</section>` : ''}
    <section><h2>怎样进入这本书</h2>${paragraphs(book.reading)}</section>
    ${book.concepts?.length ? `<section><h2>保留几个原词</h2><dl class="concept-list">${book.concepts.map(concept => `<dt>${e(concept.term)}</dt><dd>${e(concept.meaning)}</dd>`).join('')}</dl></section>` : ''}
    <section class="counterpoint"><h2>它的局限，以及该读的反方</h2>${paragraphs(book.limits)}</section>
    <section class="practice-prompt"><h2>读完之后，带走什么</h2>${paragraphs(book.exercise || '选一个你赞同的判断，写下它需要哪些证据、适用于哪些情况、最有力的反例是什么。不要用整本书替一个具体的人下结论。')}</section>
    ${notePanel(ctx, id, '哪一个原词改变了理解？它和另一位作者在哪里分歧？')}
    <section><h2>书目与原文入口</h2>${sourceList(ctx, book.refs)}</section><a class="text-link" href="#library">← 返回原典书架</a></article></div>`;
}

export function sourcesRows(ctx, query = '') {
  const selected = ctx.sources.filter(source => JSON.stringify(source).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return selected.length ? selected.map(source => `<a class="source-row" href="#source/${e(source.id)}"><span class="source-number">${String(ctx.sources.indexOf(source) + 1).padStart(2, '0')}</span><div><h3>${e(source.title)}</h3><p>${e(source.author)} · ${e(source.year || '')} · ${e(source.language)}</p><small>${e(source.kind)} · ${e(source.access)}</small></div>${arrow}</a>`).join('') : '<div class="empty-state">没有匹配的出处，试试作者或主题词。</div>';
}

function semanticCoverage(ctx) {
  if (!ctx.coverage) return '';
  const count = (items, status) => items.filter(item => item.status === status).length;
  return `<section class="semantic-coverage"><h2>编号齐全，不等于每一问都答到了。</h2><p>${e(ctx.coverage.boundary)}</p><div class="email-summary">${['已有实质答复', '部分实答', '尚未实答'].map(status => `<span>${e(status)} <strong>${count(ctx.coverage.questions, status)}</strong></span>`).join('')}</div><details class="original-book-register"><summary>逐问查看：已经回答什么，还缺什么<span>原六十六问的独立语义回查 ＋</span></summary><div>${ctx.coverage.questions.map(item => {
    const question = byId(ctx.questions, item.id);
    return `<a href="#question/${e(item.id)}"><span>${String(item.originalNumber).padStart(2, '0')}</span><div><strong>${e(question?.title || item.id)}</strong><small>${e(item.status)} · ${e(item.remaining)}</small></div>${arrow}</a>`;
  }).join('')}</div></details><details class="original-book-register"><summary>旧稿最后的十一项重点问答<span>区别正面解释、概念纠正与仍需补充的历史过程 ＋</span></summary><div>${ctx.coverage.answers.map(item => `<a href="#answer/${e(item.id)}"><span>${item.originalNumber}</span><div><strong>${e(byId(ctx.answers, item.id)?.title || item.id)}</strong><small>${e(item.status)} · ${e(item.answered)}<br>仍待补充：${e(item.remaining)}</small></div>${arrow}</a>`).join('')}</div></details>${ctx.coverage.structure?.length ? `<details class="original-book-register"><summary>不止问答：旧稿其他部分也逐项登记<span>叙事、主题、原文与反方、画像、研究路线、五问与地图 ＋</span></summary><div>${ctx.coverage.structure.map((item, index) => `<a href="${e(item.target)}"><span>${index + 1}</span><div><strong>${e(item.group)} · ${e(item.label)}</strong><small>${e(item.status)}<br>${e(item.note)}</small></div>${arrow}</a>`).join('')}</div></details>` : ''}</section>`;
}

export function renderSources(ctx) {
  return `<div class="page-shell"><header class="page-heading"><span class="small-label">出处、边界与纠错</span><h1>每一个有分量的判断，<br>都应该有来处。</h1><p>原典、论文、官方文件与作者材料；也记录哪些只能核实题录，哪些仍需读全文。来源不是结论的装饰。</p></header>
    <section class="intake-section"><h2>这次，究竟读到了什么</h2><div class="intake-grid">${ctx.manifest.intake.map(item => `<article class="intake-item"><div><strong>${e(item.title)}</strong><span class="intake-status">${e(item.status)}</span></div><p>${e(item.note)}</p></article>`).join('')}</div><p class="privacy-line">原始对话分享地址不随本网站公开。这里的记录不包含私人订单、确切交通时刻或个人笔记。</p></section>
    ${renderEmailIntake(ctx.emailIntake)}
    ${semanticCoverage(ctx)}
    <section class="corrections-section"><div class="section-heading"><div><h2>旧稿里，需要改写的地方</h2><p>不是抹掉好奇心，而是让漂亮的解释接受证据检查。</p></div></div>${ctx.corrections.map(correction => `<details class="correction"><summary><span>${e(correction.severity || '需要修订')}</span>${e(correction.title)}<b aria-hidden="true">＋</b></summary><div class="correction-body"><p class="old-claim"><strong>旧稿说法（重述）</strong>${e(correction.before)}</p><p><strong>现在怎样写更准确</strong>${e(correction.after)}</p>${correction.why ? `<p><strong>为什么重要</strong>${e(correction.why)}</p>` : ''}${citations(ctx, correction.refs)}</div></details>`).join('')}</section>
    <section class="references-section"><div class="section-heading"><div><h2>${ctx.sources.length} 条参考资料</h2><p>英文、法文等资料以中文概述；原始语言与读取范围保留。</p></div><a class="text-link" href="data/sources.json" download>下载来源目录 ${arrow}</a></div><label class="source-search" for="source-search">查找出处<input id="source-search" type="search" placeholder="作者、机构、题名、语言或关键词"></label><div id="source-results">${sourcesRows(ctx)}</div></section>
    <section class="credits-section"><h2>影像与地图的来处</h2><p>以下是资料影像，不是用户照片；现代照片不是过去事件的直接证据。网页会按版式裁切，不改写图像的历史身份。Natural Earth 底图为公共领域数据，边界显示不代表法律立场。</p><div class="credits-grid">${ctx.media.map(image => `<article class="media-credit"><h3>${e(image.alt)}</h3><p>${e(image.caption)}</p><p>${e(image.credit)} · ${e(image.license)}</p><a href="${external(image.sourcePage)}" target="_blank" rel="noopener noreferrer">原文件与署名 ${arrow}</a>${image.licenseUrl ? `<a href="${external(image.licenseUrl)}" target="_blank" rel="noopener noreferrer">许可条款 ${arrow}</a>` : ''}</article>`).join('')}</div></section></div>`;
}

export function renderSource(ctx, id) {
  const source = byId(ctx.sources, id);
  if (!source) return notFound();
  const relatedChapters = ctx.chapters.filter(chapter => chapter.refs.includes(id));
  const relatedBooks = ctx.books.filter(book => book.refs.includes(id));
  return `<div class="page-shell"><header class="article-heading"><div class="article-kicker">参考资料 ${ctx.sources.indexOf(source) + 1} <span>· ${e(source.kind)}</span></div><h1>${e(source.title)}</h1>${source.originalTitle ? `<p class="book-original">${e(source.originalTitle)}</p>` : ''}<p class="article-deck">${e(source.author)} · ${e(source.year || '')} · ${e(source.language)}</p><div class="article-meta"><span class="access-label">${e(source.access)}</span>${saveButton(ctx, id)}</div></header><article class="reading-body standalone">
    <section><h2>本次查阅范围</h2><p>${e(source.access)}</p>${source.yearNote ? `<p><strong>版本与年份：</strong>${e(source.yearNote)}</p>` : ''}${source.locator ? `<p><strong>原文定位：</strong>${e(source.locator)}</p>` : ''}${source.checked ? `<p>核对日期：${e(source.checked)}</p>` : ''}</section>
    <section><h2>它能支持什么</h2>${paragraphs(source.supports)}</section>
    <section class="counterpoint"><h2>它不能替我们证明什么</h2>${paragraphs(source.limits)}</section>
    <a class="button" href="${external(source.url)}" target="_blank" rel="noopener noreferrer">打开原始资料 ${arrow}</a>
    <p class="source-url">${e(source.url)}</p>
    ${(source.verifiedReadUrls || []).filter(url => url !== source.url).length ? `<section><h2>实际核读的其他版本或页面</h2><ul class="alternate-sources">${source.verifiedReadUrls.filter(url => url !== source.url).map((url, index) => `<li><a href="${external(url)}" target="_blank" rel="noopener noreferrer">已核读入口 ${index + 2} ${arrow}</a><p>${e(url)}</p></li>`).join('')}</ul></section>` : ''}
    ${source.bibliographicUrl && source.bibliographicUrl !== source.url ? `<p class="source-origin"><a href="${external(source.bibliographicUrl)}" target="_blank" rel="noopener noreferrer">书目或机构主入口 ${arrow}</a> · 主入口和实际核读副本不是两份独立证据。</p>` : ''}
    ${relatedChapters.length || relatedBooks.length ? `<section><h2>在这部作品里，沿哪里继续</h2>${relatedChapters.map(chapter => `<a class="related-theme" href="#chapter/${e(chapter.id)}"><span>主题</span><strong>${e(chapter.title)}</strong>${arrow}</a>`).join('')}${relatedBooks.map(book => `<a class="related-theme" href="#book/${e(book.id)}"><span>原典</span><strong>${e(book.title)}</strong>${arrow}</a>`).join('')}</section>` : ''}
    <a class="text-link" href="#sources">← 回到全部出处</a></article></div>`;
}
