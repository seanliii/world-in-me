import { e, arrow, byId, photo, citations, formatYear, getTheme } from './render.mjs';

const WIDTH = 1000;
const HEIGHT = 500;
export const project = (longitude, latitude) => [(longitude + 180) / 360 * WIDTH, (90 - latitude) / 180 * HEIGHT];

function ringPath(ring) {
  return ring.map(([longitude, latitude], index) => {
    const [x, y] = project(longitude, latitude);
    return `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ') + 'Z';
}

function countryPath(feature) {
  const geometry = feature.geometry;
  if (geometry.type === 'Polygon') return geometry.coordinates.map(ringPath).join(' ');
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.flatMap(polygon => polygon.map(ringPath)).join(' ');
  return '';
}

function buildSVG(ctx, selected, layer) {
  const stops = ctx.journey.stops;
  const line = stops.map(stop => project(stop.lng, stop.lat).map(n => n.toFixed(2)).join(',')).join(' ');
  const active = byId(stops, selected) || stops[0];
  const countries = (ctx.world?.features || []).filter(feature => feature.properties.name !== 'Antarctica');
  const mainRoute = layer !== 'americas';
  const view = mainRoute ? '395 70 370 320' : '130 70 290 325';
  return `<svg id="journey-map" viewBox="${view}" role="img" aria-label="${mainRoute ? '非洲、中东、巴尔干与高加索的二十个原计划站点' : '旧稿提及的美洲八国；国家锚点不是实际行程城市'}" preserveAspectRatio="xMidYMid meet">
    <rect x="0" y="0" width="1000" height="500" class="map-ocean"/>
    <g class="map-grid" aria-hidden="true">${[-120, -60, 0, 60, 120].map(longitude => `<path d="M${project(longitude, 0)[0]} 0V500"/>`).join('')}${[-60, -30, 0, 30, 60].map(latitude => `<path d="M0 ${project(0, latitude)[1]}H1000"/>`).join('')}</g>
    <g class="map-countries">${countries.map(feature => `<path d="${countryPath(feature)}"><title>${e(feature.properties.name)}</title></path>`).join('')}</g>
    ${mainRoute ? `<polyline points="${line}" class="journey-line" fill="none"/>
    <g class="map-points">${stops.map((stop, index) => {
      const [x, y] = project(stop.lng, stop.lat);
      const chosen = stop.id === active.id;
      return `<a href="#atlas/${e(stop.id)}" aria-label="${e(stop.city)}，原计划第${index + 1}站"><circle class="map-stop${chosen ? ' active' : ''}" cx="${x}" cy="${y}" r="${chosen ? 4.8 : 2.5}"><title>${index + 1}. ${e(stop.city)}</title></circle>${chosen ? `<circle class="map-halo" cx="${x}" cy="${y}" r="9"/><text class="map-city-label" x="${x + 9}" y="${y - 8}">${e(stop.city)}</text>` : ''}</a>`;
    }).join('')}</g>` : `<g class="map-points">${(ctx.journey.americas || []).map(country => {
      const [x, y] = project(country.lng, country.lat);
      return `<g><circle class="country-stop" cx="${x}" cy="${y}" r="3.8"/><text class="map-city-label" x="${x + 7}" y="${y - 2}">${e(country.country)}</text></g>`;
    }).join('')}</g>`}
  </svg>`;
}

export function timelineEvents(ctx, year) {
  const available = ctx.journey.events.filter(event => event.year <= Number(year));
  const selected = available.slice(-4);
  return selected.length ? selected.map(event => `<article class="timeline-event"><span>${formatYear(event.year)}</span><h3>${e(event.title)}</h3><p>${e(event.body)}</p>${citations(ctx, event.refs)}${event.theme ? `<a href="#chapter/${e(event.theme)}">关联主题 ↗</a>` : ''}</article>`).join('') : '<p class="muted">当前时间范围之前，本作品尚未收录事件。可向右移动时间轴。</p>';
}

export function renderAtlas(ctx, selected = '', layer = 'main') {
  const active = byId(ctx.journey.stops, selected) || ctx.journey.stops[0];
  const theme = getTheme(ctx, active.theme);
  const image = active.photoId || ctx.media.find(image => image.cityIds?.includes(active.id))?.id;
  const year = ctx.timelineYear ?? 2024;
  const alternate = layer === 'americas';
  return `<div class="page-shell atlas-page">
    <header class="page-heading"><span class="small-label">旅程地图</span><h1>先看见一个地方，<br>再看见它与世界的关系。</h1><p>二十个原计划站点，加上旧稿提及的美洲八国。地点是研究入口，不是国家的缩影，更不是“我已经证明了什么”。</p></header>
    <div class="map-tabs" role="group" aria-label="选择地图"><button data-map-layer="main" aria-pressed="${!alternate}" class="${!alternate ? 'selected' : ''}">欧亚非 · 原计划二十站</button><button data-map-layer="americas" aria-pressed="${alternate}" class="${alternate ? 'selected' : ''}">美洲 · 旧稿提及八国</button></div>
    <div class="atlas-grid"><div class="map-panel">${buildSVG(ctx, active.id, layer)}
      <div class="map-tools"><button data-map-zoom="in" aria-label="放大地图">＋</button><button data-map-zoom="out" aria-label="缩小地图">−</button><button data-map-zoom="reset" aria-label="重置地图范围">↺</button></div>
      <div class="map-caption"><span>Natural Earth · 等经纬示意图</span><span>连线表示顺序，不是实际航路；不重建历史疆界。</span></div>
    </div><aside id="city-detail" class="city-detail">${alternate ? `<span class="small-label">另一个讨论范围</span><h2>美洲八国</h2><p>美国、墨西哥、哥斯达黎加、巴拿马、哥伦比亚、秘鲁、智利、阿根廷。</p><p>这些国名来自可读旧稿。点位是国家示意锚点，不是已确认的城市、实际航线或到访证据。</p><h3>可以比较什么</h3><p>土地、强制劳动、宗教、贸易、独立以后制度的延续；也要看到每国和每个社群之间的差异。不要把“美洲”压成一种结局。</p><a class="button button-small" href="#chapter/empires">从征服与殖民开始 →</a><a class="text-link" href="#chapter/consciousness">意识、仪式与旅游 ${arrow}</a>` : `<span class="small-label">原计划 · 第 ${ctx.journey.stops.indexOf(active) + 1} 站</span><h2>${e(active.city)}<small>${e(active.country)}</small></h2>${image ? photo(ctx, image, 'city-photo') : ''}<h3>${e(active.title || '从这里追问')}</h3><p>${e(active.observation)}</p><p>${e(active.history)}</p>${citations(ctx, active.refs || [])}${theme ? `<a class="button button-small" href="#chapter/${e(theme.id)}">读关联主题 →</a><p class="city-theme-title">${e(theme.title)}</p>` : ''}`}</aside></div>
    ${!alternate ? `<div class="city-list" aria-label="原计划站点">${ctx.journey.stops.map((stop, index) => `<button data-city="${e(stop.id)}" class="city-item${stop.id === active.id ? ' selected' : ''}" aria-pressed="${stop.id === active.id}"><span>${String(index + 1).padStart(2, '0')}</span>${e(stop.city)}<small>${e(stop.country)}</small></button>`).join('')}</div>` : `<div class="americas-list">${ctx.journey.americas.map(country => `<div><strong>${e(country.country)}</strong><p>${e(country.question)}</p><a href="#chapter/${e(country.theme)}">进入问题 →</a></div>`).join('')}</div>`}
    <section class="timeline-section"><div class="section-heading"><div><h2>把不同地方，放进同一条时间里。</h2><p>拖动年份，显示此前最近的四个已收录事件。不是完整世界年表，也不暗示事件之间必然相继。</p></div><output id="timeline-label" for="timeline-range">${formatYear(year)}</output></div><label class="sr-only" for="timeline-range">时间轴年份</label><input type="range" min="-3000" max="2026" step="1" value="${year}" id="timeline-range"><div class="timeline-scale"><span>公元前 3000</span><span>公元 1</span><span>1000</span><span>2026</span></div><div id="timeline-events">${timelineEvents(ctx, year)}</div></section>
    <div class="boundary-note"><strong>地图有两处值得留意的差异</strong><p>旧稿写了黑山科托尔，本地规划的正式停留站是波德戈里察；不能合并成同一个坐标。旧稿十九城不含莫斯科，本地规划含该站。地图采用本地规划二十站，差异不抹平。</p><a href="#chapter/method">为什么路线不是自然实验 ${arrow}</a></div>
  </div>`;
}

export function zoomMap(direction) {
  const map = document.getElementById('journey-map');
  if (!map) return;
  if (!map.dataset.originalViewbox) map.dataset.originalViewbox = map.getAttribute('viewBox');
  if (direction === 'reset') {
    map.setAttribute('viewBox', map.dataset.originalViewbox);
    return;
  }
  const [x, y, width, height] = map.getAttribute('viewBox').split(/\s+/).map(Number);
  const scale = direction === 'in' ? 0.75 : 1 / 0.75;
  const nextWidth = Math.min(1000, Math.max(55, width * scale));
  const nextHeight = nextWidth / width * height;
  map.setAttribute('viewBox', [x + (width - nextWidth) / 2, y + (height - nextHeight) / 2, nextWidth, nextHeight].join(' '));
}
