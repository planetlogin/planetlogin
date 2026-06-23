import {
  geoOrthographic,
  geoPath,
  geoGraticule10,
  geoContains,
  geoCentroid,
  geoArea,
  type GeoProjection,
} from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import { geocode, reverseMeta } from './geocode';
import { countryToLanguage } from './locale';
import type { PlanetLocale, PlanetPassOptions } from './types';

type Mode = 'idle' | 'travel' | 'zoom';
type Listener = (l: PlanetLocale) => void;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const shortLon = (a: number, b: number) => ((b - a) % 360 + 540) % 360 - 180;
const dataUrl = (res: string) => `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-${res}.json`;

/**
 * A self-contained globe locale picker. Mounts a canvas (and an optional search
 * box) into `target`, lets the user spin / drag / zoom / click a country, and
 * emits a {@link PlanetLocale} when a place is picked.
 */
export class PlanetPass {
  private target: HTMLElement;
  private opts: Required<Pick<PlanetPassOptions, 'accent' | 'search' | 'autoSpin' | 'resolution'>> & PlanetPassOptions;
  private cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input?: HTMLInputElement;
  private wm?: HTMLAnchorElement;
  private listeners: Listener[] = [];

  private W = 0; private H = 0; private DPR = 1;
  private cx = 0; private cy = 0; private baseR = 0; private R = 0;
  private stars = Array.from({ length: 140 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.2, a: Math.random() * 0.6 + 0.2, p: Math.random() * 6,
  }));

  private countriesFC: any = null;
  private bordersMesh: any = null;
  private graticule: any = geoGraticule10();
  private lastProjection: GeoProjection | null = null;
  private hoverFeat: any = null;
  private selectedFeat: any = null;

  private mode: Mode = 'idle';
  private lon0 = 20; private lat0 = 25;
  private fromLon = 0; private fromLat = 0; private toLon = 0; private toLat = 0;
  private t0 = 0; private zStart = 1; private zTarget = 2.6; private zFrom = 1;
  private dragging = false; private vlon = 0.12; private vlat = 0; private zoomK = 1;
  private autoSpin: boolean;
  private detected: PlanetLocale | null = null;

  private raf = 0;
  private ro?: ResizeObserver;
  private lastX = 0; private lastY = 0; private moved = 0;

  constructor(target: HTMLElement, options: PlanetPassOptions = {}) {
    this.target = target;
    this.opts = {
      accent: options.accent ?? '#f6a13c',
      search: options.search ?? true,
      autoSpin: options.autoSpin ?? true,
      resolution: options.resolution ?? '110m',
      ...options,
    };
    this.autoSpin = this.opts.autoSpin;

    if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
    target.style.overflow = 'hidden';

    this.cv = document.createElement('canvas');
    Object.assign(this.cv.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none' } as CSSStyleDeclaration);
    target.appendChild(this.cv);
    this.ctx = this.cv.getContext('2d')!;

    if (this.opts.search) this.buildSearch();
    this.buildWatermark();
    this.bindEvents();
    this.loadData();
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(target);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  /** Register a listener fired whenever a place is picked. */
  on(_event: 'locale', cb: Listener): this {
    this.listeners.push(cb);
    return this;
  }

  /** Fly to coordinates and pick them. */
  flyTo(lon: number, lat: number): void {
    this.fromLon = this.lon0; this.fromLat = this.lat0;
    this.toLon = lon; this.toLat = lat;
    this.zFrom = this.zoomK; this.selectedFeat = null;
    this.t0 = performance.now(); this.mode = 'travel';
  }

  /** Search by postal code / city / country and fly to the result. */
  async search(query: string): Promise<void> {
    const q = query.trim();
    if (!q) return;
    const res = await geocode(q);
    if (!res) return;
    this.detected = { lat: res.lat, lon: res.lon, country: res.cc, timezone: res.tz, language: countryToLanguage(res.cc), label: res.label, approxTimezone: res.approxTz };
    this.flyTo(res.lon, res.lat);
  }

  /** Stop everything and remove the DOM it created. */
  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.cv.remove();
    this.input?.parentElement?.remove();
    this.wm?.remove();
    this.listeners = [];
  }

  // ---- internals ----

  private emit(): void {
    if (!this.detected) return;
    const loc = this.detected;
    for (const cb of this.listeners) cb(loc);
    this.target.dispatchEvent(new CustomEvent<PlanetLocale>('locale', { detail: loc, bubbles: true }));
    this.opts.onLocale?.(loc);
  }

  private buildSearch(): void {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, { position: 'absolute', left: '50%', bottom: '7%', transform: 'translateX(-50%)', zIndex: '5', display: 'flex', gap: '8px', width: 'min(440px,90%)', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: '14px', padding: '7px 7px 7px 14px', backdropFilter: 'blur(8px)' } as CSSStyleDeclaration);
    const input = document.createElement('input');
    input.placeholder = this.opts.placeholder ?? 'Postal code, city or country…';
    Object.assign(input.style, { flex: '1', background: 'none', border: '0', outline: '0', color: '#eef2fb', fontSize: '1rem', minWidth: '0', fontFamily: 'inherit' } as CSSStyleDeclaration);
    const btn = document.createElement('button');
    btn.textContent = 'Locate';
    Object.assign(btn.style, { border: '0', cursor: 'pointer', borderRadius: '10px', padding: '9px 16px', fontWeight: '600', background: this.opts.accent, color: '#231400', fontFamily: 'inherit' } as CSSStyleDeclaration);
    const go = () => this.search(input.value);
    btn.addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    wrap.append(input, btn);
    this.target.appendChild(wrap);
    this.input = input;
  }

  // Attribution required by the license (AGPLv3 §7b). Please keep it.
  private buildWatermark(): void {
    const a = document.createElement('a');
    a.href = 'https://ricajos.com'; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'PlanetPass · by Ricajos';
    Object.assign(a.style, { position: 'absolute', left: '14px', bottom: '12px', zIndex: '20', fontSize: '12px', letterSpacing: '.3px', color: 'rgba(154,167,189,.85)', textDecoration: 'none', fontFamily: 'inherit' } as CSSStyleDeclaration);
    this.target.appendChild(a);
    this.wm = a;
  }

  private async loadData(): Promise<void> {
    try {
      const url = this.opts.dataUrl ?? dataUrl(this.opts.resolution);
      const world: any = await fetch(url).then((r) => r.json());
      this.countriesFC = feature(world, world.objects.countries);
      this.bordersMesh = mesh(world, world.objects.countries, (a: any, b: any) => a !== b);
    } catch (e) {
      // No data → a plain ocean globe still renders.
      console.warn('[planetpass] country data failed to load', e);
    }
  }

  private resize(): void {
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.W = this.target.clientWidth; this.H = this.target.clientHeight;
    this.cv.width = this.W * this.DPR; this.cv.height = this.H * this.DPR;
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.baseR = Math.min(this.W, this.H) * 0.34;
    if (this.mode === 'idle') this.R = this.baseR * this.zoomK;
  }

  private featureCenter(f: any): [number, number] {
    const g = f.geometry;
    if (g.type === 'Polygon') return geoCentroid(f) as [number, number];
    let best: any = null, bestA = -1;
    for (const coords of g.coordinates) {
      const poly = { type: 'Polygon', coordinates: coords } as any;
      const a = geoArea(poly);
      if (a > bestA) { bestA = a; best = poly; }
    }
    return geoCentroid(best || f) as [number, number];
  }

  private countryAt(clientX: number, clientY: number): any {
    if (!this.countriesFC || !this.lastProjection) return null;
    const r = this.cv.getBoundingClientRect();
    const p = this.lastProjection.invert?.([clientX - r.left, clientY - r.top]);
    if (!p || isNaN(p[0])) return null;
    for (const f of this.countriesFC.features) if (geoContains(f, p as [number, number])) return f;
    return null;
  }

  private async pickFeature(f: any): Promise<void> {
    const [lon, lat] = this.featureCenter(f);
    this.flyTo(lon, lat);
    const meta = await reverseMeta(lon, lat);
    this.detected = { lat, lon, country: meta.cc, timezone: meta.tz, language: countryToLanguage(meta.cc), label: f.properties?.name ?? '', approxTimezone: meta.approxTz };
  }

  private onLocated(): void {
    if (!this.detected) return;
    this.autoSpin = false;
    this.selectedFeat = this.countriesFC
      ? this.countriesFC.features.find((f: any) => geoContains(f, [this.detected!.lon, this.detected!.lat])) || null
      : null;
    this.emit();
  }

  private bindEvents(): void {
    const cv = this.cv;
    cv.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'idle') { this.mode = 'idle'; this.autoSpin = false; }
      this.dragging = true; this.moved = 0; this.lastX = e.clientX; this.lastY = e.clientY; this.vlon = 0; this.vlat = 0;
      cv.style.cursor = 'grabbing'; cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', (e) => {
      if (this.dragging) {
        const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
        this.lastX = e.clientX; this.lastY = e.clientY; this.moved += Math.abs(dx) + Math.abs(dy);
        const k = 0.26 / this.zoomK;
        this.lon0 += -dx * k; this.lat0 = clamp(this.lat0 + dy * k, -82, 82);
        this.vlon = clamp(-dx * k, -8, 8); this.vlat = clamp(dy * k, -8, 8);
      } else if (this.mode === 'idle') {
        this.hoverFeat = this.countryAt(e.clientX, e.clientY);
        cv.style.cursor = this.hoverFeat ? 'pointer' : 'grab';
      }
    });
    const end = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false; cv.style.cursor = 'grab';
      try { cv.releasePointerCapture(e.pointerId); } catch { /* */ }
    };
    cv.addEventListener('pointerup', (e) => {
      const wasClick = this.dragging && this.moved < 6;
      end(e);
      if (wasClick && this.mode === 'idle') {
        const f = this.countryAt(e.clientX, e.clientY);
        if (f) { this.hoverFeat = null; this.pickFeature(f); }
      }
    });
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', (e) => { end(e); this.hoverFeat = null; });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.mode !== 'idle') { this.mode = 'idle'; this.autoSpin = false; }
      this.zoomK = clamp(this.zoomK * Math.exp(-e.deltaY * 0.0012), 0.7, 9);
      this.R = this.baseR * this.zoomK; this.hoverFeat = this.countryAt(e.clientX, e.clientY);
    }, { passive: false });
  }

  private loop(now: number): void {
    if (this.mode === 'idle') {
      if (!this.dragging) {
        this.vlon += ((this.autoSpin ? 0.12 : 0) - this.vlon) * (this.autoSpin ? 0.035 : 0.08);
        this.vlat += (0 - this.vlat) * 0.06;
        this.lon0 += this.vlon; this.lat0 = clamp(this.lat0 + this.vlat, -82, 82);
      }
    } else if (this.mode === 'travel') {
      const k = Math.min(1, (now - this.t0) / 1100), e = ease(k);
      this.lon0 = this.fromLon + shortLon(this.fromLon, this.toLon) * e;
      this.lat0 = this.fromLat + (this.toLat - this.fromLat) * e;
      this.zoomK = this.zFrom + (1 - this.zFrom) * e; this.R = this.baseR * this.zoomK;
      if (k >= 1) { this.mode = 'zoom'; this.t0 = now; this.zStart = 1; this.zTarget = 2.6; }
    } else {
      const k = Math.min(1, (now - this.t0) / 750), e = easeOut(k);
      this.zoomK = this.zStart + (this.zTarget - this.zStart) * e; this.R = this.baseR * this.zoomK;
      this.lon0 = this.toLon; this.lat0 = this.toLat;
      if (k >= 1) { this.mode = 'idle'; this.onLocated(); }
    }
    this.draw(now);
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  private draw(now: number): void {
    const { ctx, cx, cy, R, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#070b16'; ctx.fillRect(0, 0, W, H);
    for (const s of this.stars) {
      const tw = 0.6 + 0.4 * Math.sin(now / 700 + s.p);
      ctx.globalAlpha = s.a * tw; ctx.fillStyle = '#cdd8f0';
      ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.25);
    halo.addColorStop(0, 'rgba(120,170,255,.18)'); halo.addColorStop(1, 'rgba(120,170,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.25, 0, 7); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    const og = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
    og.addColorStop(0, '#2a5e90'); og.addColorStop(1, '#0c2138');
    ctx.fillStyle = og; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);

    const projection = geoOrthographic().translate([cx, cy]).scale(R).clipAngle(90).rotate([-this.lon0, -this.lat0]);
    this.lastProjection = projection;
    const path = geoPath(projection, ctx);
    ctx.beginPath(); path(this.graticule); ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; ctx.stroke();
    if (this.countriesFC) { ctx.beginPath(); path(this.countriesFC); ctx.fillStyle = 'rgba(70,160,116,.92)'; ctx.fill(); }
    if (this.selectedFeat) {
      ctx.beginPath(); path(this.selectedFeat);
      ctx.fillStyle = this.hexA(this.opts.accent, 0.7); ctx.fill();
      ctx.strokeStyle = this.opts.accent; ctx.lineWidth = 1.4; ctx.stroke();
    }
    if (this.hoverFeat && this.hoverFeat !== this.selectedFeat) {
      ctx.beginPath(); path(this.hoverFeat); ctx.fillStyle = this.hexA(this.opts.accent, 0.5); ctx.fill();
    }
    if (this.bordersMesh) { ctx.beginPath(); path(this.bordersMesh); ctx.strokeStyle = 'rgba(10,28,48,.85)'; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.restore();

    ctx.strokeStyle = 'rgba(150,200,255,.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
  }

  private hexA(hex: string, a: number): string {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const r = parseInt(n.slice(0, 2), 16), g = parseInt(n.slice(2, 4), 16), b = parseInt(n.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
}
