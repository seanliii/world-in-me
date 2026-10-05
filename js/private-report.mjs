import { e, paragraphs, citations, arrow } from './render.mjs';

export const PRIVATE_REPORT_LIMIT = 6_000_000;
const STATUSES = ['有直接证据', '暂定假说', '证据不足', '待补材料', '需本人确认'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function string(value, name, limit = 60000) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error(`${name}格式不正确。`);
  if (value.length > limit) throw new Error(`${name}过长；为避免静默丢失内容，未导入。`);
  return value;
}

function list(value, name, mapper, limit = 100) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${name}格式不正确。`);
  if (value.length > limit) throw new Error(`${name}项目过多；未导入而不是截断。`);
  return value.map((item, index) => mapper(item, `${name}第${index + 1}项`));
}

function strings(value, name, limit = 100) {
  return list(value, name, (item, label) => string(item, label), limit);
}

function id(value, name) {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(value)) throw new Error(`${name}编号格式不正确。`);
  return value;
}

function item(value, name) {
  if (!object(value)) throw new Error(`${name}格式不正确。`);
  return value;
}

function evidence(value, name) {
  return list(value, name, (raw, label) => {
    const entry = item(raw, label);
    return {
      source: string(entry.source, `${label}来源`, 500),
      location: string(entry.location, `${label}位置`, 1500),
      quote: string(entry.quote, `${label}引文`, 15000),
      authorship: string(entry.authorship, `${label}角色`, 300),
      context: string(entry.context, `${label}上下文`, 15000)
    };
  }, 80);
}

export function normalizePrivateReport(value) {
  if (!object(value) || value.kind !== 'world-in-me-private-assessment') throw new Error('研究包格式不正确，请选择本作品的私人研究 JSON，而不是邮件原文。');
  if (value.schemaVersion !== 1) throw new Error('不支持这个私人研究包版本。');
  const report = {
    schemaVersion: 1,
    kind: 'world-in-me-private-assessment',
    title: string(value.title, '标题', 400),
    createdAt: string(value.createdAt, '日期', 100),
    scope: strings(value.scope, '研究范围', 40),
    summary: string(value.summary, '摘要'),
    dimensions: list(value.dimensions, '研究维度', (raw, label) => {
      const entry = item(raw, label);
      if (!STATUSES.includes(entry.status)) throw new Error(`${label}证据状态格式不正确。`);
      return {
        id: id(entry.id, label), title: string(entry.title, `${label}标题`, 300),
        status: entry.status,
        observation: string(entry.observation, `${label}观察`),
        hypothesis: string(entry.hypothesis, `${label}假说`),
        alternative: string(entry.alternative, `${label}其他解释`),
        test: string(entry.test, `${label}检验`),
        wouldChange: string(entry.wouldChange, `${label}反证`),
        evidence: evidence(entry.evidence, `${label}证据`),
        refs: strings(entry.refs, `${label}参考资料`, 80)
      };
    }, 64),
    cases: list(value.cases, '代表事件', (raw, label) => {
      const entry = item(raw, label);
      return {
        id: id(entry.id, label), title: string(entry.title, `${label}标题`, 300),
        date: string(entry.date, `${label}日期`, 100),
        event: string(entry.event, `${label}事件`),
        meaning: string(entry.meaning, `${label}解释`),
        alternative: string(entry.alternative, `${label}其他解释`),
        evidence: evidence(entry.evidence, `${label}证据`)
      };
    }, 80),
    plans: list(value.plans, '行动方案', (raw, label) => {
      const entry = item(raw, label);
      return {
        id: id(entry.id, label), title: string(entry.title, `${label}标题`, 300),
        horizon: string(entry.horizon, `${label}时间`, 1000),
        why: string(entry.why, `${label}目的`),
        steps: strings(entry.steps, `${label}动作`, 30),
        measure: string(entry.measure, `${label}观察`),
        review: string(entry.review, `${label}回顾`),
        stop: string(entry.stop, `${label}停止条件`),
        refs: strings(entry.refs, `${label}参考资料`, 80)
      };
    }, 20),
    futures: list(value.futures, '条件情景', (raw, label) => {
      const entry = item(raw, label);
      return {
        title: string(entry.title, `${label}标题`, 300),
        conditions: string(entry.conditions, `${label}条件`),
        upside: string(entry.upside, `${label}可能收益`),
        risks: string(entry.risks, `${label}风险`),
        signals: string(entry.signals, `${label}观察信号`)
      };
    }, 10),
    coverage: list(value.coverage, '覆盖登记', (raw, label) => {
      const entry = item(raw, label);
      return { label: string(entry.label, `${label}名称`, 500), status: string(entry.status, `${label}状态`, 5000) };
    }, 80),
    unknowns: strings(value.unknowns, '未知范围', 80),
    nextQuestions: strings(value.nextQuestions, '待本人确认的问题', 40)
  };
  for (const name of ['dimensions', 'cases', 'plans']) {
    if (new Set(report[name].map(entry => entry.id)).size !== report[name].length) throw new Error(`${name}编号重复，未导入。`);
  }
  return report;
}

function evidenceBlock(entries) {
  if (!entries.length) return '<p class="private-no-evidence">这项尚无足够直接材料，不能靠理论补写事实。</p>';
  return `<details class="personal-evidence"><summary>查看 ${entries.length} 条具体材料</summary>${entries.map(entry => `<div><strong>${e(entry.source)} · ${e(entry.location)}</strong><small>${e(entry.authorship)}</small>${entry.quote ? `<blockquote>${paragraphs(entry.quote)}</blockquote>` : ''}${entry.context ? paragraphs(entry.context) : ''}</div>`).join('')}</details>`;
}

export function renderPersonal(ctx, report = null) {
  const intro = `<header class="page-heading"><span class="small-label">个人研究室 · 本地读取</span><h1>不急着给自己贴标签，<br>先看清反复发生的事。</h1><p>优势、代价、兴趣、能力、盲区与目标，都需要放回具体情境。这里不输出天赋排名、人格诊断或命运预测。</p></header>
    <section class="personal-import-panel"><div><h2>${report ? '你的私人研究包，已在本页打开。' : '导入本地研究包'}</h2><p>选择本作品生成的私人研究 JSON。内容只在当前标签页中读取，<strong>不会上传</strong>、不会自动保存；刷新后需要重新导入。文件本身未加密，请自行妥善保管，不放进公开仓库。</p></div><label class="button import-button" for="private-report-file">${report ? '换一个研究包 ↑' : '选择私人研究包 ↑'}<input id="private-report-file" type="file" accept=".json,application/json"></label>${report ? '<button class="quiet-button" id="forget-private-report">从本页移除</button>' : ''}</section>`;
  if (!report) return `<div class="page-shell personal-page">${intro}
    <section class="personal-method"><h2>这不是一张“你是什么样的人”的判决书。</h2><p>一个可靠的个人研究包，应该同时展示下面六件事。只有结论、没有具体事件和反例，批评再猛烈也未必有帮助。</p><ol><li><strong>你确实说过、做过什么</strong><span>分开人的原话、AI 代写、自动续航与研究者推断。</span></li><li><strong>哪些模式反复出现</strong><span>说明在哪些情境出现，也寻找没有出现的反例。</span></li><li><strong>同一个强项怎样付出代价</strong><span>例如广度与专注、标准与交付、控制与协作之间的具体取舍。</span></li><li><strong>还有哪些解释同样可能</strong><span>工具失败、环境限制、任务性质都可能影响行为，不能全归为性格。</span></li><li><strong>怎样用一个小实验分辨</strong><span>先写可观察行为，再约定回顾与停止条件，不用“更努力”代替动作。</span></li><li><strong>哪些部分还不知道</strong><span>健康、关系、财务、真实能力比较等，没有材料就保持未知。</span></li></ol>
    <div class="boundary-note"><strong>“检查过一块”不等于“知道了结论”。</strong><p>逐封邮件和项目材料的完整性会单独登记。这里没有预填假画像；未导入私人研究包前，只展示研究方法。</p><a href="#chapter/method">先看：旅行和个人观察能证明什么 ${arrow}</a></div></section>
    <a class="text-link personal-bottom-link" href="#practice">记录你自己的观察与行动 ${arrow}</a></div>`;
  return `<div class="page-shell personal-page">${intro}
    <section class="private-report-heading"><span class="small-label">${e(report.createdAt)} · 本地文件中的评估，不是在线诊断</span><h2>${e(report.title)}</h2>${paragraphs(report.summary)}<ul>${report.scope.map(line => `<li>${e(line)}</li>`).join('')}</ul></section>
    <nav class="personal-section-nav" aria-label="个人研究内容导航"><button data-jump="personal-coverage">材料覆盖</button><button data-jump="personal-dimensions">逐块分析</button>${report.cases.length ? '<button data-jump="personal-cases">具体事件</button>' : ''}<button data-jump="personal-plans">候选行动</button>${report.futures.length ? '<button data-jump="personal-futures">未来情景</button>' : ''}<button data-jump="personal-unknowns">仍然未知</button></nav>
    <details class="personal-index"><summary>${report.dimensions.length} 个维度：直接找到想看的部分</summary><div>${report.dimensions.map(dimension => `<button data-jump="personal-${e(dimension.id)}"><span>${e(dimension.title)}</span><small>${e(dimension.status)}</small></button>`).join('')}</div></details>
    <section class="personal-coverage" id="personal-coverage"><h2>作者登记的材料覆盖</h2><p>这是研究包记录的覆盖范围；导入动作本身不重新认证原始邮件和日志。</p><div>${report.coverage.map(entry => `<article><strong>${e(entry.label)}</strong><p>${e(entry.status)}</p></article>`).join('')}</div></section>
    <section class="personal-dimensions" id="personal-dimensions"><div class="section-heading"><div><h2>逐块看，也逐块保留怀疑。</h2><p>${report.dimensions.length} 个研究维度；“证据不足”是允许且必要的结果。</p></div></div>${report.dimensions.map((dimension, index) => `<article id="personal-${e(dimension.id)}" class="personal-dimension"><header><span>${String(index + 1).padStart(2, '0')}</span><h3>${e(dimension.title)}</h3><small>${e(dimension.status)}</small></header><dl><dt>观察到了什么</dt><dd>${paragraphs(dimension.observation)}</dd><dt>暂时怎样解释</dt><dd>${paragraphs(dimension.hypothesis)}</dd><dt>其他解释与反例</dt><dd>${paragraphs(dimension.alternative)}</dd><dt>怎样检验，不靠猜</dt><dd>${paragraphs(dimension.test)}</dd>${dimension.wouldChange ? `<dt>什么会让我改变这个判断</dt><dd>${paragraphs(dimension.wouldChange)}</dd>` : ''}</dl>${evidenceBlock(dimension.evidence)}${citations(ctx, dimension.refs)}</article>`).join('')}</section>
    ${report.cases.length ? `<section class="personal-cases" id="personal-cases"><h2>把判断放回具体事件</h2>${report.cases.map(entry => `<details class="personal-case"><summary><span>${e(entry.date)}</span>${e(entry.title)}</summary><div><h3>发生了什么</h3>${paragraphs(entry.event)}<h3>它可能说明什么</h3>${paragraphs(entry.meaning)}<h3>为什么还不能下定论</h3>${paragraphs(entry.alternative)}${evidenceBlock(entry.evidence)}</div></details>`).join('')}</section>` : ''}
    <section class="personal-plans" id="personal-plans"><h2>人生规划，先缩成可实行的一步。</h2><p>以下是候选方案，不是已经执行的成果。没有观察结果，不把计划宣称为有效改变。</p>${report.plans.map(plan => `<article class="personal-plan"><span class="small-label">${e(plan.horizon)}</span><h3>${e(plan.title)}</h3>${paragraphs(plan.why)}<ol>${plan.steps.map(step => `<li>${e(step)}</li>`).join('')}</ol><dl><dt>观察什么</dt><dd>${e(plan.measure)}</dd><dt>何时回顾</dt><dd>${e(plan.review)}</dd><dt>何时缩小或停止</dt><dd>${e(plan.stop)}</dd></dl>${citations(ctx, plan.refs)}</article>`).join('')}</section>
    ${report.futures.length ? `<section class="personal-futures" id="personal-futures"><h2>未来不是预测，而是条件不同的几条路。</h2>${report.futures.map(future => `<article><h3>${e(future.title)}</h3><dl><dt>成立条件</dt><dd>${e(future.conditions)}</dd><dt>可能的收益</dt><dd>${e(future.upside)}</dd><dt>风险与代价</dt><dd>${e(future.risks)}</dd><dt>早期观察信号</dt><dd>${e(future.signals)}</dd></dl></article>`).join('')}</section>` : ''}
    <section class="personal-unknowns" id="personal-unknowns"><h2>仍然不知道，不替你编。</h2><ul>${report.unknowns.map(line => `<li>${e(line)}</li>`).join('')}</ul>${report.nextQuestions.length ? `<h3>需要你本人提供或选择的</h3><ol>${report.nextQuestions.map(line => `<li>${e(line)}</li>`).join('')}</ol>` : ''}</section>
    <a class="button personal-bottom-link" href="#practice">把选择写进我的行动记录 →</a></div>`;
}
