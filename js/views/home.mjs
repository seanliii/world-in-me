import { e, arrow, photo, bookCover, saveButton, sectionHeader, short, byId, paragraphs, citations } from '../render.mjs';
import { intakeSummary, intakeStatusText } from '../intake.mjs';

export function renderHome(ctx) {
  const images = ctx.manifest.heroImages || ctx.media.slice(0, 3).map(image => image.id);
  const featured = ['empires', 'money', 'freedom', 'method'].map(id => byId(ctx.chapters, id)).filter(Boolean);
  const books = (ctx.manifest.featuredBooks || ctx.books.slice(0, 4).map(book => book.id)).map(id => byId(ctx.books, id)).filter(Boolean);
  const missing = ctx.manifest.intake.filter(item => item.kind === 'doubao' && item.status !== '正文完整读取').length;
  const mail = intakeSummary(ctx.emailIntake);
  return `<div class="home">
    <section class="hero page-shell">
      <div class="hero-copy">
        <h1>走过世界，<br>重新理解<span>自己。</span></h1>
        <p class="hero-deck">从非洲的海岸，到巴尔干的街巷。<br>把旅途中的追问，变成一部有出处、能反驳、也能带回日常的世界史。</p>
        <div class="hero-actions"><a class="button" href="#chapter/method">从这里开始 <span aria-hidden="true">→</span></a><a class="text-link" href="#atlas">沿着地图探索 ${arrow}</a></div>
        <div class="hero-index"><span>${ctx.journey.stops.length} <small>路线站点</small></span><span>${ctx.chapters.length} <small>研究主题</small></span><span>${ctx.questions.filter(q => q.origin === 'kimi-secondary').length} <small>旧稿问题</small></span></div>
      </div>
      <div class="hero-art" aria-label="旅程与世界历史的资料照片">
        ${photo(ctx, images[0], 'hero-tall', true)}${photo(ctx, images[1], 'hero-wide', true)}${photo(ctx, images[2], 'hero-small')}
        <div class="hero-marginalia"><span class="compass-mark" aria-hidden="true">✳</span><p>远方不是答案。<br>它让我们开始<br>问更好的问题。</p></div>
      </div>
    </section>
    <div class="intake-strip page-shell"><span class="status-dot" aria-hidden="true"></span><p>这是一部<strong>可修订的作品</strong>。已完整读取三卷旧稿；${ctx.emailIntake ? `补充邮件完整读取 ${mail.read}/6，独立回查 ${mail.reviewed}/6。` : missing ? `${missing} 段豆包原文仍待补入，不能冒充已全量读完。` : '原始分享内容的读取范围详见来源记录。'} </p><a href="#sources">资料边界 ${arrow}</a></div>
    <section class="reading-routes page-shell">
      ${sectionHeader('01', '今天，想走多远？', '不用从第一页硬读到最后。选一个入口，把一次阅读带进生活。')}
      <div class="route-options">
        <a href="#answer/human" class="route-option"><span class="route-time">10 分钟</span><h3>先回答一个大问题</h3><p>人是什么？在制度之中，自由还可能吗？</p><span class="route-link">去看关键回答 →</span></a>
        <a href="#chapter/money" class="route-option"><span class="route-time">30 分钟</span><h3>顺着一个细节往下挖</h3><p>从钱包里的一张钞票，追到央行、殖民与改革。</p><span class="route-link">进入一篇长文 →</span></a>
        <a href="#practice" class="route-option"><span class="route-time">接下来一个月</span><h3>让理解变成一次行动</h3><p>留下证据、提出反例、尝试小改变，再回来检查。</p><span class="route-link">打开个人工作台 →</span></a>
      </div>
    </section>
    <section class="journey-band">
      <div class="page-shell journey-band-inner"><div><span class="small-label">从具体的地方出发</span><h2>一条路线，<br>不止一种世界史。</h2><p>开罗的文物、西非的港口、伊斯坦布尔的清真寺、萨拉热窝的街道。不是把国家排成“文明高低”，而是看见它们如何彼此连接。</p><a href="#atlas" class="button button-light">展开旅程地图 →</a></div><div class="journey-ribbon"><div class="ribbon-region">非洲与地中海</div><p>开罗 <span>→</span> 约翰内斯堡 <span>→</span> 亚的斯亚贝巴<br>科托努 <span>→</span> 阿比让 <span>→</span> 达喀尔<br>卡萨布兰卡 <span>→</span> 突尼斯</p><div class="ribbon-region">中东、巴尔干与高加索</div><p>安曼 <span>→</span> 贝鲁特 <span>→</span> 阿布扎比 <span>→</span> 吉达<br>伊斯坦布尔 <span>→</span> 萨拉热窝 <span>→</span> 贝尔格莱德<br>波德戈里察 <span>→</span> 埃里温 <span>→</span> 第比利斯<br>巴库 <span>→</span> 莫斯科</p><small>按原计划呈现，不是已到访证明。美洲八国另作旧稿提及层。</small></div></div>
    </section>
    <section class="page-shell featured-section">
      ${sectionHeader('02', '把问题，连成脉络', '地理提供条件，历史改变选择；制度塑造人，人也能改变制度。', '#themes', `查看全部 ${ctx.chapters.length} 个主题`)}
      <div class="featured-grid">${featured.map((chapter, index) => `<a class="featured-essay" href="#chapter/${e(chapter.id)}"><span class="essay-no">0${index + 1}</span><div><small>${e(chapter.group)}</small><h3>${e(chapter.title)}</h3><p>${e(short(chapter.subtitle, 90))}</p><span class="text-link">进入主题 ${arrow}</span></div></a>`).join('')}</div>
    </section>
    <section class="question-interlude page-shell"><span aria-hidden="true">“</span><blockquote>我想要的，不是知道更多地名，<br>而是下一次做选择时，<em>不再和从前一样。</em></blockquote><p>这是对本次目标的重述，不是把“彻底改变”当作一次阅读的保证。</p><a href="#answers" class="text-link">把最后的问题，重新回答一遍 ${arrow}</a></section>
    <section class="page-shell library-preview">
      ${sectionHeader('03', '和原著面对面', '不把思想家变成金句。看原词、读语境，也给反方一把椅子。', '#library', '进入原典书架')}
      <div class="books-preview">${books.map((book, index) => `<a href="#book/${e(book.id)}">${bookCover(book, index)}<h3>${e(book.title)}</h3><p>${e(book.author)}</p><small>${e(book.access)}</small></a>`).join('')}</div>
    </section>
    <section class="closing-band page-shell"><div><h2>理解世界之后，<br>从一件小事重新开始。</h2><p>读一篇，写下一个反例；做一次，回来检查结果。<br>没有排名，没有打卡惩罚，只有你自己的记录。</p></div><a href="#practice" class="button">开始我的阅读与行动 →</a></section>
  </div>`;
}

export function renderThemes(ctx) {
  return `<div class="page-shell">
    <header class="page-heading"><span class="small-label">主题目录</span><h1>不是一条万能解释，<br>而是一组彼此校正的视角。</h1><p>从旅行观察，走到历史研究，再回到自己的生活。每篇都包含证据、另一种解释和一个小练习。</p></header>
    <div class="theme-directory">${ctx.chapters.map((chapter, index) => `<article class="theme-entry"><div class="theme-index">${String(index + 1).padStart(2, '0')}</div><div><div class="entry-topline"><span>${e(chapter.group)}</span><span>${ctx.questions.filter(q => q.theme === chapter.id).length} 个关联问题</span></div><h2><a href="#chapter/${e(chapter.id)}">${e(chapter.title)}</a></h2><p>${e(chapter.subtitle)}</p><div class="entry-actions"><a href="#chapter/${e(chapter.id)}" class="text-link">开始阅读 ${arrow}</a>${saveButton(ctx, chapter.id)}</div></div></article>`).join('')}</div>
  </div>`;
}

export function renderAnswers(ctx) {
  return `<div class="page-shell"><header class="page-heading"><span class="small-label">关键回答</span><h1>一路追问，<br>最终还是回到自己。</h1><p>旧稿可恢复的关键问题，加上本次对成长与行动的要求。这里的“最后”指旧稿结构，不冒充未取得的豆包原话顺序。</p></header>
    <div class="answer-directory">${ctx.answers.map((answer, index) => `<a class="answer-entry" href="#answer/${e(answer.id)}"><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${e(answer.title)}</h2><p>${e(answer.summary)}</p><small>${e(answer.origin)}</small></div>${arrow}</a>`).join('')}</div></div>`;
}

export function renderSaved(ctx) {
  const groups = [['主题长文', ctx.chapters, 'chapter'], ['关键回答', ctx.answers, 'answer'], ['原典书籍', ctx.books, 'book'], ['研究问题', ctx.questions, 'question'], ['出处', ctx.sources, 'source']];
  return `<div class="page-shell"><header class="page-heading"><span class="small-label">只属于当前设备</span><h1>留下的，值得再读。</h1><p>${ctx.state.saved.length} 项收藏 · ${ctx.state.read.length} 项已标记读完。数量不是成绩，下一次行动才是这部作品的续篇。</p></header>
    ${ctx.state.saved.length ? groups.map(([label, items, page]) => {
      const selected = items.filter(item => ctx.state.saved.includes(item.id));
      return selected.length ? `<section class="saved-group"><h2>${e(label)}</h2>${selected.map(item => `<article class="saved-row"><a href="#${page}/${e(item.id)}"><h3>${e(item.title)}</h3><p>${e(short(item.subtitle || item.author || item.answer || '', 100))}</p></a>${saveButton(ctx, item.id)}</article>`).join('')}</section>` : '';
    }).join('') : `<div class="empty-state"><h2>先留下一处想回来的地方。</h2><p>主题、书籍和回答旁的“收藏”会出现在这里。你不需要读完所有东西。</p><a class="button" href="#themes">找到第一篇 →</a></div>`}
    <a class="text-link" href="#practice">导出收藏与私人笔记 ${arrow}</a></div>`;
}

export function renderAbout(ctx) {
  return `<div class="page-shell"><header class="page-heading"><span class="small-label">阅读说明</span><h1>一部有厚度，<br>也知道自己边界的作品。</h1><p>不是百科全书，不是心理诊断，不是“读完就改变人生”的承诺。</p></header>
    <div class="reading-layout"><aside class="reading-aside"><strong>先看这四件事</strong><ol><li>从哪份材料来</li><li>事实与解释分开</li><li>怎么读原著</li><li>怎么留下改变</li></ol></aside><article class="reading-body">
    <h2>从哪份材料来</h2><p>材料不只有最初的五个豆包分享入口、Kimi三卷和旅行规划，也包括后来补充的六封邮件，以及获授权的项目协作记录。Kimi的六十六条问题和十一篇重点问答属于AI二次整理，不是逐字聊天；邮件内的本人提问、AI回答和重复转述也分别辨认。</p><p>${e(intakeStatusText(ctx.emailIntake))}逐封的实际研究位置和未完成项在资料页公开；具体私人原话、邮件原件与项目事件只在本机研究包中保留。</p><p>地图主线按本地规划的二十站排列。旧稿中的科托尔与本地规划的波德戈里察分开看；美洲八国是旧稿明确提及，不能由此推断确切城市、路线顺序和到访日期。</p>
    <h2>这里怎样使用证据</h2><p>正文旁的方括号可以点开，看来源、语言、查阅范围以及它不能支持什么。“核实书存在”不等于“核实了书里的所有论点”；“找到一篇论文”也不等于“结论已经没有争议”。</p><p>为了不把引用做成装饰，作品保留旧稿纠错清单。需要改变的结论在正文中重写，而不是只在末尾加一句免责声明。</p>
    <h2>所谓“原味”，不是伪装通读</h2><p>原典页面区分原语言短引、本网站自译、公开章节导读与书目信息。没有取得可靠原文的书，不制作假引文或假页码。视频的中文导读不是全片逐句翻译。译名若未核实正式中译本，会明确标注为暂译。</p>
    <h2>如何把阅读带回生活</h2><p>选一个你真正关心的问题，先写现在的判断，再找最有力的反例。最后只改一个可执行动作，过几天回来观察。记录是为了检查想法，不是为了维持连续打卡。</p><p>收藏、笔记、完成记录保存在当前网址、当前浏览器。不同设备不会自动同步；隐私模式、清理网站数据或浏览器存储失败可能导致记录丢失。请定期导出 JSON 备份，勿把私人备份上传到公开仓库。</p>
    <h2>影像、地图与离线</h2><p>影像是有出处的资料照片，不是用户亲摄，也不是过去事件的直接见证。底图采用 Natural Earth 公共领域数据；示意边界不代表法律立场，路线连线不等于实际航路。</p><p>完整打开一次页面后，正文导航和笔记功能在当前标签页里可以离线使用。本站不承诺断网后重新打开，外部照片、字体、视频和来源页仍需联网。网络故障时保留文字与影像说明。</p>
    <h2>更新，而不是封口</h2><p>这部作品的价值不在于最后一个答案，而在于下一次能更快发现自己的错误。补入原始对话时，需要重新做问题覆盖对照，再决定新增、合并或改写，不能仅在末尾拼接更多文章。</p>
    <a class="button" href="#sources">查看资料覆盖与纠错 →</a></article></div></div>`;
}
