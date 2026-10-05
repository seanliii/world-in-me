import { blankState, readState, writeState, mergeState, parseRoute, searchCatalog, STORAGE_KEY, MAX_IMPORT_BYTES, localDay } from './model.mjs';
import { e, arrow, byId, notFound } from './render.mjs';
import { renderHome, renderThemes, renderAnswers, renderSaved, renderAbout } from './views/home.mjs';
import { renderChapter, renderAnswer, renderQuestion, renderQuestions, questionRows } from './views/reading.mjs';
import { renderLibrary, renderBook, renderSource, renderSources, renderComparison, bookCards, sourcesRows } from './views/library.mjs';
import { renderPractice } from './views/practice.mjs';
import { renderAtlas, timelineEvents, zoomMap } from './map.mjs';
import { normalizePrivateReport, renderPersonal, PRIVATE_REPORT_LIMIT } from './private-report.mjs';

const main = document.getElementById('main');
const dialog = document.getElementById('search-dialog');
const searchInput = document.getElementById('global-search');
const toastElement = document.getElementById('toast');
const optionalFont = document.getElementById('optional-reading-font');
if (optionalFont) {
  const enableFont = () => { optionalFont.media = 'all'; };
  if (optionalFont.sheet) enableFont();
  else optionalFont.addEventListener('load', enableFont, { once: true });
}
let toastTimer;
let noteTimer;
let ctx;
let route;
let mapLayer = 'main';
let privateReport = null;
let storage;
try { storage = window.localStorage; }
catch { storage = { getItem() { throw Error('unavailable'); }, setItem() { throw Error('unavailable'); } }; }

function toast(message) {
  clearTimeout(toastTimer);
  toastElement.textContent = message;
  toastElement.classList.add('visible');
  toastTimer = setTimeout(() => toastElement.classList.remove('visible'), 5000);
}

function applyPreferences() {
  document.documentElement.dataset.largeText = String(ctx.state.preferences.largeText);
  document.documentElement.dataset.reduceMotion = String(ctx.state.preferences.reduceMotion);
}

function persist(notify = false) {
  clearTimeout(noteTimer);
  const result = writeState(storage, ctx.state);
  if (!result.ok) {
    const warning = document.getElementById('storage-warning');
    warning.hidden = false;
    warning.textContent = result.error;
    toast(result.error);
  } else if (notify) toast('已保存在当前浏览器，不会上传。');
  document.getElementById('saved-count').textContent = ctx.state.saved.length;
  return result.ok;
}

async function getJSON(name) {
  const response = await fetch(new URL(`../data/${name}.json`, import.meta.url));
  if (!response.ok) throw new Error(`${name}.json：HTTP ${response.status}`);
  return response.json();
}

function searchResults(query) {
  const results = searchCatalog(ctx, query);
  if (!query.trim()) return '<p class="muted">搜索主题、问题、原著和出处。输入中文、原文书名或作者都可以。</p>';
  if (!results.length) return '<div class="empty-state"><h3>暂时没有匹配的内容。</h3><p>试试换一个词，或缩短你的问题。</p></div>';
  return `<p class="result-count">找到 ${results.length} 项${results.length > 80 ? '，显示前 80 项' : ''}</p>${results.slice(0, 80).map(result => `<a class="search-result" href="${e(result.route)}"><span>${e(result.type)}</span><h3>${e(result.title)}</h3><p>${e(result.subtitle)}</p>${arrow}</a>`).join('')}`;
}

function render() {
  if (!ctx) return;
  route = parseRoute(location.hash);
  const renderers = {
    home: () => renderHome(ctx), themes: () => renderThemes(ctx),
    atlas: () => renderAtlas(ctx, route.id, mapLayer),
    chapter: () => renderChapter(ctx, route.id),
    questions: () => renderQuestions(ctx), question: () => renderQuestion(ctx, route.id),
    answers: () => renderAnswers(ctx), answer: () => renderAnswer(ctx, route.id),
    library: () => renderLibrary(ctx), book: () => renderBook(ctx, route.id),
    sources: () => renderSources(ctx), source: () => renderSource(ctx, route.id),
    practice: () => renderPractice(ctx), saved: () => renderSaved(ctx),
    personal: () => renderPersonal(ctx, privateReport),
    about: () => renderAbout(ctx),
    search: () => `<div class="page-shell"><header class="page-heading"><h1>搜索：${e(route.id)}</h1></header>${searchResults(route.id)}</div>`
  };
  main.innerHTML = (renderers[route.page] || notFound)();
  main.dataset.page = route.page;
  main.dataset.id = route.id;
  main.dataset.ready = 'true';
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.title = `${main.querySelector('h1')?.textContent || '从旅途，到历史，到自己'} · 世界照见我`;
  const activePage = ({ chapter: 'themes', question: 'questions', answer: 'questions', answers: 'questions', book: 'library' })[route.page] || route.page;
  document.querySelectorAll('.site-header nav a').forEach(link => {
    const active = link.getAttribute('href') === `#${activePage}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  document.getElementById('reading-progress').hidden = !['chapter', 'answer', 'book', 'question'].includes(route.page);
  if (['chapter', 'answer', 'book'].includes(route.page) && route.id) {
    ctx.state.lastVisited = `#${route.page}/${encodeURIComponent(route.id)}`;
    persist();
  }
  updateReadingProgress();
}

function updateReadingProgress() {
  const distance = document.documentElement.scrollHeight - innerHeight;
  document.getElementById('reading-progress').style.width = `${Math.max(0, Math.min(100, distance > 0 ? scrollY / distance * 100 : 0))}%`;
}

function openSearch() {
  if (!ctx || dialog.open) return;
  searchInput.value = '';
  document.getElementById('search-results').innerHTML = searchResults('');
  dialog.showModal();
  searchInput.focus();
}

function refreshQuestionList() {
  document.getElementById('question-results').innerHTML = questionRows(ctx,
    document.getElementById('question-search').value,
    document.getElementById('question-theme').value,
    document.getElementById('question-status').value);
}

function refreshBookList() {
  document.getElementById('book-results').innerHTML = bookCards(ctx,
    document.getElementById('book-search').value, document.getElementById('book-kind').value);
}

function toggleCollection(kind, id) {
  const collection = ctx.state[kind];
  const index = collection.indexOf(id);
  if (index >= 0) collection.splice(index, 1); else collection.push(id);
  persist();
  const attribute = kind === 'saved' ? 'data-save' : 'data-read';
  document.querySelectorAll(`[${attribute}]`).forEach(button => {
    if (button.getAttribute(attribute) !== id) return;
    const enabled = collection.includes(id);
    button.setAttribute('aria-pressed', String(enabled));
    button.classList.toggle('is-saved', enabled);
    button.textContent = kind === 'saved' ? (enabled ? '✓ 已收藏' : '+ 收藏') : (enabled ? '✓ 已读过' : '标记读完');
  });
  if (route.page === 'saved' && kind === 'saved') render();
}

document.addEventListener('click', event => {
  const target = event.target.closest('button,a,label');
  if (!target) return;
  if (target.classList.contains('skip-link')) {
    event.preventDefault();
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: 'instant', block: 'start' });
    return;
  }
  if (target.id === 'search-open') return openSearch();
  if (target.id === 'search-close') return dialog.close();
  if (target.dataset.retry !== undefined) return location.reload();
  if (dialog.open && target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) dialog.close();
  if (!ctx) return;
  if (target.id === 'forget-private-report') {
    privateReport = null;
    render();
    return toast('已从当前标签页移除；你的本地原文件没有改变。');
  }
  if (target.hasAttribute('data-save')) return toggleCollection('saved', target.dataset.save);
  if (target.hasAttribute('data-read')) return toggleCollection('read', target.dataset.read);
  if (target.hasAttribute('data-save-note')) {
    const textarea = [...document.querySelectorAll('[data-note]')].find(input => input.dataset.note === target.dataset.saveNote);
    if (textarea) ctx.state.notes[target.dataset.saveNote] = textarea.value.slice(0, 12000);
    return persist(true);
  }
  if (target.dataset.jump) {
    event.preventDefault();
    const reduced = ctx.state.preferences.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(target.dataset.jump)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    return;
  }
  if (target.dataset.city) {
    location.hash = `atlas/${target.dataset.city}`;
    return;
  }
  if (target.dataset.mapLayer) {
    mapLayer = target.dataset.mapLayer;
    render();
    return;
  }
  if (target.dataset.mapZoom) return zoomMap(target.dataset.mapZoom);
  if (target.id === 'clear-question-filters') {
    document.getElementById('question-search').value = '';
    document.getElementById('question-theme').value = 'all';
    document.getElementById('question-status').value = 'all';
    return refreshQuestionList();
  }
  if (target.dataset.practiceCheck) {
    const id = target.dataset.practiceCheck;
    if (!byId(ctx.practices, id)) return;
    const experiment = ctx.state.experiments[id] ||= { intention: '', days: [] };
    const day = localDay();
    const index = experiment.days.indexOf(day);
    if (index >= 0) experiment.days.splice(index, 1); else experiment.days.push(day);
    const done = experiment.days.includes(day);
    target.setAttribute('aria-pressed', String(done));
    target.classList.toggle('is-done', done);
    target.textContent = done ? '✓ 今天做过了 · 可撤销' : '今天试过一次';
    document.querySelectorAll('[data-days]').forEach(span => {
      if (span.dataset.days === id) span.textContent = `已记录 ${experiment.days.length} 天，不要求连续`;
    });
    persist();
    return;
  }
  if (target.id === 'export-data') {
    persist();
    const blob = new Blob([JSON.stringify({ ...ctx.state, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `世界照见我-私人备份-${localDay()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }
  if (target.dataset.video) {
    const video = byId(ctx.videos, target.dataset.video);
    if (!video || !/^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]+(?:\?.*)?$/.test(video.embedUrl || '')) {
      return toast('请使用旁边的官方原站观看入口。');
    }
    const frame = document.createElement('iframe');
    frame.src = video.embedUrl;
    frame.title = video.title;
    frame.allow = 'encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'no-referrer';
    frame.loading = 'lazy';
    frame.allowFullscreen = true;
    document.getElementById(`video-${video.id}`).replaceChildren(frame);
    target.disabled = true;
    target.textContent = '已加载；无法播放可到原站';
  }
});

document.addEventListener('input', event => {
  if (!ctx) return;
  const target = event.target;
  if (target.id === 'global-search') document.getElementById('search-results').innerHTML = searchResults(target.value);
  if (target.id === 'question-search') refreshQuestionList();
  if (target.id === 'book-search') refreshBookList();
  if (target.id === 'source-search') document.getElementById('source-results').innerHTML = sourcesRows(ctx, target.value);
  if (target.id === 'timeline-range') {
    ctx.timelineYear = Number(target.value);
    document.getElementById('timeline-label').textContent = Number(target.value) < 0 ? `公元前 ${Math.abs(Number(target.value))} 年` : `${target.value} 年`;
    document.getElementById('timeline-events').innerHTML = timelineEvents(ctx, Number(target.value));
  }
  if (target.dataset.note) {
    ctx.state.notes[target.dataset.note] = target.value.slice(0, 12000);
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => persist(), 400);
  }
  if (target.dataset.intention && byId(ctx.practices, target.dataset.intention)) {
    const experiment = ctx.state.experiments[target.dataset.intention] ||= { intention: '', days: [] };
    experiment.intention = target.value.slice(0, 2000);
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => persist(), 300);
  }
});

document.addEventListener('change', async event => {
  if (!ctx) return;
  const target = event.target;
  if (target.id === 'private-report-file') {
    const file = target.files?.[0];
    if (!file) return;
    try {
      if (file.size > PRIVATE_REPORT_LIMIT) throw new Error('研究包超过 6 MB，未导入。');
      const report = normalizePrivateReport(JSON.parse(await file.text()));
      privateReport = report;
      render();
      toast('私人研究包已在本页打开，没有上传或自动保存。');
    } catch (error) {
      toast(`打开失败：${error instanceof SyntaxError ? '不是有效的研究 JSON；原页面资料未改变。' : error.message}`);
    } finally {
      target.value = '';
    }
    return;
  }
  if (['question-theme', 'question-status'].includes(target.id)) refreshQuestionList();
  if (target.id === 'book-kind') refreshBookList();
  if (['book-a', 'book-b'].includes(target.id)) {
    document.getElementById('book-comparison').innerHTML = renderComparison(ctx,
      document.getElementById('book-a').value, document.getElementById('book-b').value);
  }
  if (target.id === 'large-text' || target.id === 'reduce-motion') {
    ctx.state.preferences[target.id === 'large-text' ? 'largeText' : 'reduceMotion'] = target.checked;
    applyPreferences();
    persist();
  }
  if (target.dataset.intention) persist();
  if (target.id === 'import-data') {
    const file = target.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('文件超过 20 MB，未导入。');
      const incoming = JSON.parse(await file.text());
      ctx.state = mergeState(ctx.state, incoming, ctx);
      applyPreferences();
      const saved = persist();
      render();
      toast(saved ? '备份已导入并合并；同名笔记使用导入内容。' : '已导入当前标签页，但无法持久保存；请立即导出。');
    } catch (error) {
      toast(`导入失败：${error instanceof SyntaxError ? '文件不是有效 JSON，原记录未改变。' : error.message}`);
    } finally {
      target.value = '';
    }
  }
});

document.addEventListener('error', event => {
  const image = event.target;
  if (image?.tagName !== 'IMG') return;
  const figure = image.closest('.photo');
  if (!figure) return;
  image.hidden = true;
  figure.classList.add('is-missing');
  const fallback = figure.querySelector('.photo-fallback');
  if (fallback) fallback.hidden = false;
}, true);

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && dialog.open) {
    event.preventDefault();
    dialog.close();
    return;
  }
  if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
    event.preventDefault();
    openSearch();
  }
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});
window.addEventListener('hashchange', () => { if (ctx) { persist(); render(); } });
window.addEventListener('pagehide', () => { if (ctx) persist(); });
window.addEventListener('scroll', updateReadingProgress, { passive: true });
window.addEventListener('storage', event => {
  if (!ctx || event.key !== STORAGE_KEY) return;
  const result = readState(storage, ctx);
  if (result.ok) {
    ctx.state = result.state;
    applyPreferences();
    document.getElementById('saved-count').textContent = ctx.state.saved.length;
    toast('另一标签页更新了记录。当前未提交的输入不会被强制覆盖；切换页面后显示新记录。');
  }
});

async function start() {
  const names = ['manifest', 'chapters', 'questions', 'answers', 'library', 'sources', 'journey', 'media', 'corrections', 'practices', 'videos', 'email-intake', 'book-register', 'coverage'];
  const values = await Promise.all(names.map(getJSON));
  ctx = Object.fromEntries(names.map((name, index) => [name, values[index]]));
  ctx.books = ctx.library;
  ctx.emailIntake = ctx['email-intake'];
  ctx.bookRegister = ctx['book-register'];
  for (const question of ctx.questions) {
    const coverage = ctx.coverage.questions.find(item => item.id === question.id);
    if (coverage) {
      question.status = coverage.status;
      question.semanticReview = coverage;
    }
  }
  try {
    const response = await fetch(new URL('../assets/world.geo.json', import.meta.url));
    if (!response.ok) throw Error('map');
    ctx.world = await response.json();
  } catch { ctx.world = { features: [] }; }
  ctx.state = blankState();
  const loaded = readState(storage, ctx);
  ctx.state = loaded.state;
  if (!loaded.ok) {
    const warning = document.getElementById('storage-warning');
    warning.hidden = false;
    warning.textContent = loaded.error;
  }
  applyPreferences();
  document.getElementById('saved-count').textContent = ctx.state.saved.length;
  render();
}

start().catch(error => {
  main.innerHTML = `<div class="page-shell empty-page"><span class="empty-symbol">↶</span><h1>正文暂时没有完整打开</h1><p>可能是网络或某个数据文件未加载。你的私人笔记不会因此被删除。</p><p class="muted">${e(error.message)}</p><button class="button" data-retry>重新加载</button><a href="research/研究总稿.md">或打开文字研究总稿 →</a></div>`;
});
