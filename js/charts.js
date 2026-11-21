import { esc } from './util.js';

/** 막대 차트: items [{label, value, color, hi}] */
export function barChart(items, { height = 170, fmt = (v) => v, color = 'var(--accent)', showZero = false, slot: slotW = 48, values = true } = {}) {
  const n = items.length || 1;
  const slot = slotW, W = n * slot, top = 20, bottom = 22, H = height;
  const max = Math.max(1, ...items.map((i) => i.value));
  const ch = H - top - bottom;
  const bars = items.map((it, i) => {
    const h = Math.max(it.value > 0 ? 3 : 0, (it.value / max) * ch);
    const x = i * slot + slot * 0.2, w = slot * 0.6, y = top + ch - h;
    const c = it.color || color;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}" opacity="${it.hi === false ? 0.45 : 1}"/>
      ${values && (it.value > 0 || showZero) ? `<text class="val" x="${x + w / 2}" y="${y - 5}" text-anchor="middle">${esc(fmt(it.value))}</text>` : ''}
      <text x="${x + w / 2}" y="${H - 6}" text-anchor="middle" ${it.hi ? 'style="fill:var(--text);font-weight:700"' : ''}>${esc(it.label)}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img">
    <line class="gridline" x1="0" x2="${W}" y1="${top + ch}" y2="${top + ch}"/>${bars}</svg>`;
}

/** 꺾은선: points [{label, value}] (value null 허용) */
export function lineChart(points, { height = 180, fmt = (v) => v, goal = null, color = 'var(--accent)', invert = false } = {}) {
  const vals = points.map((p) => p.value).filter((v) => v != null);
  if (!vals.length) return '<div class="empty">아직 기록이 없어요</div>';
  const W = 560, H = height, padL = 10, padR = 10, top = 22, bottom = 24;
  let min = Math.min(...vals, goal ?? Infinity), max = Math.max(...vals, goal ?? -Infinity);
  if (max - min < 1) { max += 0.5; min -= 0.5; }
  const span = max - min; min -= span * 0.12; max += span * 0.12;
  const xs = (i) => padL + (points.length === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (points.length - 1));
  const ys = (v) => { const r = (v - min) / (max - min); return top + (invert ? r : 1 - r) * (H - top - bottom); };
  let d = '', dots = '';
  points.forEach((p, i) => {
    if (p.value == null) return;
    d += (d ? ' L' : 'M') + xs(i).toFixed(1) + ' ' + ys(p.value).toFixed(1);
    const showVal = points.length <= 14 || i === points.length - 1 || p.value === Math.max(...vals) || p.value === Math.min(...vals);
    dots += `<circle cx="${xs(i)}" cy="${ys(p.value)}" r="${points.length > 20 ? 3 : 4}" fill="${color}"/>
      ${showVal ? `<text class="val" x="${xs(i)}" y="${ys(p.value) - 9}" text-anchor="middle">${esc(fmt(p.value))}</text>` : ''}`;
  });
  const step = Math.ceil(points.length / 10);
  const labels = points.map((p, i) => (i % step === 0 || i === points.length - 1 ? `<text x="${xs(i)}" y="${H - 6}" text-anchor="middle">${esc(p.label)}</text>` : '')).join('');
  const goalLine = goal != null ? `<line x1="0" x2="${W}" y1="${ys(goal)}" y2="${ys(goal)}" stroke="var(--good)" stroke-dasharray="6 5"/>
    <text x="${W - 4}" y="${ys(goal) - 5}" text-anchor="end" style="fill:var(--good)">목표 ${esc(fmt(goal))}</text>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${goalLine}
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}${labels}</svg>`;
}

/** 원형 진행 링 */
export function ring(ratio, { size = 300, stroke = 18, color = 'var(--accent)' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(1, Math.max(0, ratio)));
  return `<svg viewBox="0 0 ${size} ${size}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--surface2)" stroke-width="${stroke}"/>
    <circle data-ring cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .5s"/></svg>`;
}
export function setRing(svgRoot, ratio) {
  const el = svgRoot.querySelector('[data-ring]');
  if (!el) return;
  const c = Number(el.getAttribute('stroke-dasharray'));
  el.setAttribute('stroke-dashoffset', c * (1 - Math.min(1, Math.max(0, ratio))));
}
