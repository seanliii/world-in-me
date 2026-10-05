import { e } from './render.mjs';

const EXPECTED = new Set(Array.from({ length: 6 }, (_, index) => `email-${index + 1}`));
const STEPS = ['bodyReceived', 'bodyFullyRead', 'questionsMapped', 'majorClaimsReviewed', 'integrated', 'independentlyChecked'];

export function intakeSummary(data) {
  const rows = Array.isArray(data?.entries) ? data.entries.filter(row => row && EXPECTED.has(row.id)) : [];
  const unique = new Map(rows.map(row => [row.id, row]));
  const counts = STEPS.map((_, index) => [...unique.values()].filter(row => STEPS.slice(0, index + 1).every(step => row[step] === true)).length);
  return {
    expected: 6, received: counts[0], read: counts[1], mapped: counts[2],
    claimsReviewed: counts[3], integrated: counts[4], reviewed: counts[5],
    complete: rows.length === 6 && unique.size === 6 && counts[5] === 6
  };
}

export function renderEmailIntake(data) {
  if (!data) return '';
  const summary = intakeSummary(data);
  return `<section class="email-intake"><h2>六封补充邮件，逐封检查。</h2><p>${e(data.boundary || '')}</p>
    <div class="email-summary"><span>完整读取 <strong>${summary.read}/6</strong></span><span>问题整理 <strong>${summary.mapped}/6</strong></span><span>融入作品 <strong>${summary.integrated}/6</strong></span><span>独立回查 <strong>${summary.reviewed}/6</strong></span></div>
    <div class="email-grid">${data.entries.map(entry => `<article><div><strong>${e(entry.label)}</strong><small>${e(entry.status)}</small></div><p>${e(entry.note)}</p><ol>${STEPS.map((step, index) => `<li class="${entry[step] === true ? 'checked' : ''}"><span aria-hidden="true">${entry[step] === true ? '✓' : '○'}</span>${['原文取得', '完整阅读', '问题整理', '主要主张核查', '融入作品', '独立回查'][index]}</li>`).join('')}</ol></article>`).join('')}</div>
    <p class="email-boundary">这些数字是可追查的处理登记，不是“已彻底理解一个人”或“行为已经改变”的证明。原文、邮箱地址与私人项目资料不公开。</p></section>`;
}
