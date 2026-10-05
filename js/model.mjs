export const STORAGE_KEY = 'world-in-me.personal.v1';
export const MAX_IMPORT_BYTES = 20_000_000;
export const NOTE_LIMIT = 12000;

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value, limit = NOTE_LIMIT) => typeof value === 'string' ? value.slice(0, limit) : '';
const unique = values => [...new Set(values)];
const fields = ['journal', 'field-observation', 'field-interpretation', 'field-counterexample', 'field-action', 'field-review'];

export function blankState() {
  return {
    version: 1, saved: [], read: [], notes: {}, experiments: {},
    preferences: { reduceMotion: false, largeText: false },
    lastVisited: ''
  };
}

function idsFor(catalog) {
  return new Set([
    ...fields,
    ...['chapters', 'questions', 'books', 'practices', 'answers', 'sources']
      .flatMap(key => (catalog[key] || []).map(item => item.id))
  ]);
}

function validDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === day;
}

export function normalizeState(value, catalog) {
  if (!record(value)) throw new Error('备份格式不正确：需要一个数据对象。');
  if (value.version !== 1) throw new Error('不支持这个备份版本，请使用本网站导出的备份。');
  const clean = blankState();
  const ids = idsFor(catalog);
  for (const name of ['saved', 'read']) {
    clean[name] = unique((Array.isArray(value[name]) ? value[name] : [])
      .filter(id => typeof id === 'string' && ids.has(id)));
  }
  if (record(value.notes)) {
    for (const [id, note] of Object.entries(value.notes)) {
      if (ids.has(id) && typeof note === 'string') clean.notes[id] = text(note);
    }
  }
  if (record(value.experiments)) {
    for (const practice of catalog.practices || []) {
      const experiment = value.experiments[practice.id];
      if (!record(experiment)) continue;
      clean.experiments[practice.id] = {
        intention: text(experiment.intention, 2000),
        days: unique((Array.isArray(experiment.days) ? experiment.days : [])
          .filter(validDay)).slice(-3660)
      };
    }
  }
  if (record(value.preferences)) {
    clean.preferences.reduceMotion = value.preferences.reduceMotion === true;
    clean.preferences.largeText = value.preferences.largeText === true;
  }
  if (typeof value.lastVisited === 'string' && value.lastVisited.length < 180) {
    const route = parseRoute(value.lastVisited);
    if (route.id && ids.has(route.id)) clean.lastVisited = `#${route.page}/${encodeURIComponent(route.id)}`;
  }
  return clean;
}

export function readState(storage, catalog) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { ok: true, state: raw ? normalizeState(JSON.parse(raw), catalog) : blankState() };
  } catch {
    return {
      ok: false, state: blankState(),
      error: '此浏览器无法读取已存资料，或原备份已损坏。当前仍可阅读；新笔记请及时导出。'
    };
  }
}

export function writeState(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch {
    return { ok: false, error: '未能保存到设备，可能是隐私模式或存储空间已满。请立即导出备份。' };
  }
}

export function mergeState(current, imported, catalog) {
  const incoming = normalizeState(imported, catalog);
  const base = normalizeState(current, catalog);
  const experiments = { ...base.experiments };
  for (const [id, value] of Object.entries(incoming.experiments)) {
    experiments[id] = {
      intention: value.intention || experiments[id]?.intention || '',
      days: unique([...(experiments[id]?.days || []), ...value.days])
    };
  }
  return normalizeState({
    ...base,
    saved: unique([...base.saved, ...incoming.saved]),
    read: unique([...base.read, ...incoming.read]),
    notes: { ...base.notes, ...incoming.notes },
    experiments,
    preferences: incoming.preferences,
    lastVisited: incoming.lastVisited || base.lastVisited
  }, catalog);
}

export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function parseRoute(hash) {
  try {
    const [page = 'home', ...pieces] = decodeURIComponent(String(hash).replace(/^#/, '')).split('/');
    const allowed = ['home', 'atlas', 'themes', 'chapter', 'questions', 'question', 'answers', 'answer',
      'library', 'book', 'practice', 'personal', 'sources', 'source', 'search', 'saved', 'about'];
    if (!allowed.includes(page)) return { page: 'home', id: '' };
    return { page, id: pieces.join('/') };
  } catch {
    return { page: 'home', id: '' };
  }
}

export function searchCatalog(catalog, query) {
  const terms = String(query || '').toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const groups = [
    ['chapters', 'chapter', '主题长文'], ['questions', 'question', '研究问题'],
    ['books', 'book', '原典书架'], ['sources', 'source', '参考资料'],
    ['answers', 'answer', '关键回答']
  ];
  return groups.flatMap(([key, page, type]) => (catalog[key] || []).flatMap(item => {
    const title = item.title || item.q || '';
    const searchable = JSON.stringify(item).toLocaleLowerCase();
    if (!terms.every(term => searchable.includes(term))) return [];
    const score = terms.reduce((sum, term) => sum + (title.toLocaleLowerCase().includes(term) ? 4 : 1), 0);
    return [{
      id: item.id, title, type, page,
      subtitle: item.subtitle || item.author || item.organization || '',
      route: `#${page}/${encodeURIComponent(item.id)}`, score
    }];
  })).sort((a, b) => b.score - a.score);
}

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
