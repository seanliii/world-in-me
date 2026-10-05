import { e, arrow, paragraphs, citations, notePanel } from '../render.mjs';
import { localDay } from '../model.mjs';

export function renderPractice(ctx) {
  const day = localDay();
  return `<div class="page-shell"><header class="page-heading"><span class="small-label">我的阅读与行动</span><h1>让一次顿悟，<br>活过下一个星期一。</h1><p>不用成为“更高效的人”。先试着把你认可的一点理解，变成一种更自由、更清楚的生活方式。</p></header>
    <div class="privacy-notice"><span aria-hidden="true">⌑</span><div><strong>这里是你的私人工作台。</strong><p>所有记录只保存在当前设备、当前浏览器与当前网址，不上传、不排名。换设备前导出，清理浏览器数据可能丢失记录。</p></div></div>
    <section class="practice-overview"><div><strong>${ctx.state.read.length}</strong><span>篇标记读完</span></div><div><strong>${ctx.state.saved.length}</strong><span>项想要再读</span></div><div><strong>${Object.values(ctx.state.notes).filter(value => value.trim()).length}</strong><span>段自己的笔记</span></div><p>这不是分数。读得少但有一次真实改变，也很好。</p></section>
    <section class="thirty-days"><h2>接下来一个月，只做四件事</h2><ol><li><span>第 1 周</span><strong>观察，不急着解释</strong><p>记录一个具体场景，把“看到的”和“猜测的”分开。</p></li><li><span>第 2 周</span><strong>给自己的判断找反例</strong><p>读两种解释，问：什么事实会使我改变看法？</p></li><li><span>第 3 周</span><strong>只改变一个小动作</strong><p>把愿望写成“如果……，我就……”，允许调整和取消。</p></li><li><span>第 4 周</span><strong>回来检查，保留有效的</strong><p>比较行为、感受和代价，不以新鲜感代替结果。</p></li></ol></section>
    <section class="practice-cards"><div class="section-heading"><div><h2>选一个实验，就够了。</h2><p>这些是安全、低成本的练习设计，不是治疗方案，也不是保证有效的配方。</p></div></div>${ctx.practices.map((practice, index) => {
      const experiment = ctx.state.experiments[practice.id] || { intention: '', days: [] };
      const done = experiment.days.includes(day);
      return `<article class="practice-card"><div class="practice-number">${String(index + 1).padStart(2, '0')}</div><div><span class="small-label">${e(practice.duration)}</span><h3>${e(practice.title)}</h3>${paragraphs(practice.description)}${practice.steps?.length ? `<ol>${practice.steps.map(step => `<li>${e(step)}</li>`).join('')}</ol>` : ''}<div class="experiment-review"><strong>如何判断有用</strong><p>${e(practice.measure)}</p></div>
      <label for="intention-${e(practice.id)}">把它写成我的“如果……就……”</label><textarea id="intention-${e(practice.id)}" rows="2" maxlength="2000" data-intention="${e(practice.id)}" placeholder="${e(practice.example)}">${e(experiment.intention)}</textarea><div class="practice-actions"><button class="button button-small${done ? ' is-done' : ''}" data-practice-check="${e(practice.id)}" aria-pressed="${done}">${done ? '✓ 今天做过了 · 可撤销' : '今天试过一次'}</button><span class="practice-day-count" data-days="${e(practice.id)}">已记录 ${experiment.days.length} 天，不要求连续</span></div>${citations(ctx, practice.refs)}</div></article>`;
    }).join('')}</section>
    <section class="field-notes"><h2>把一个现场，写成一页自己的研究</h2><p>不必记录陌生人的姓名或隐私；询问与拍摄先征得同意，不逼问创伤和政治立场。</p><div class="field-grid">${[
      ['field-observation', '我实际观察到的', '只写时间、地点、可见现象与对方确实说过的话，不做群体推断。'],
      ['field-interpretation', '我目前的解释', '我用了什么概念？有没有把比喻误当机制？'],
      ['field-counterexample', '最有力的另一种解释', '哪条证据会推翻我的判断？还有谁的声音没听到？'],
      ['field-action', '我愿意改变的一件小事', '什么时候，在哪里，具体做什么？不把人生决定押在一次顿悟上。'],
      ['field-review', '几天以后，结果怎样', '做到了什么？有什么代价？保留、缩小，还是停止？']
    ].map(([id, title, prompt]) => `<div><label for="note-${id}">${title}</label><textarea id="note-${id}" data-note="${id}" maxlength="12000" rows="5" placeholder="${prompt}">${e(ctx.state.notes[id] || '')}</textarea><button class="quiet-button" data-save-note="${id}">保存这一项</button></div>`).join('')}</div></section>
    ${notePanel(ctx, 'journal', '留给下一次回来的自己：现在的困惑、做过的事，以及仍不知道的。')}
    <section class="backup-panel"><div><h2>把记录，留在自己手里。</h2><p>JSON 包含收藏、笔记、阅读和实验记录。导入会合并收藏；同名笔记以导入文件为准，请先备份当前记录。文件不上传。</p></div><div class="backup-actions"><button class="button" id="export-data">导出我的备份 ↓</button><label class="button button-outline import-button" for="import-data">导入已有备份 ↑<input id="import-data" type="file" accept=".json,application/json"></label></div></section>
    <section class="reading-preferences"><h2>读得舒服一点</h2><label><input id="large-text" type="checkbox"${ctx.state.preferences.largeText ? ' checked' : ''}>放大正文</label><label><input id="reduce-motion" type="checkbox"${ctx.state.preferences.reduceMotion ? ' checked' : ''}>关闭非必要动画</label><p>系统已设置“减少动态效果”时，本站也会遵从。</p></section>
    <p class="closing-note">如果持续的疲惫、焦虑或失去兴趣影响日常生活，仅靠这部作品不够，值得向合格专业人员寻求支持。这里不依据你的旅行或一段对话做心理诊断。</p>
    <a class="text-link" href="#answer/myself">回到那封写给这位旅行者的信 ${arrow}</a>
  </div>`;
}
