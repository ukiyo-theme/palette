import { accentRole } from './variants.js';

// A woodblock seascape: slow noise cut into flat bands of palette ink, with paper grain on top.
const vertex = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uTide;
uniform float uLift;
uniform float uQuiet;
uniform float uHorizon;
uniform vec3 uMouse;
uniform vec3 uSky[3];
uniform vec3 uSea[4];
uniform vec3 uMist;
uniform vec3 uFoam;
uniform vec3 uMoon;
uniform vec3 uRing;
uniform vec3 uStar;
uniform vec3 uPage;
uniform float uStars;
uniform float uMoonY;
uniform float uHalo;
uniform float uGrain;

float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fill(float d, float px) { return 1.0 - smoothstep(-px, px, d); }

float mistBand(vec2 p, float aspect, float y, float len, float height, float speed, float offset, float px) {
  float span = aspect + len * 2.0 + 0.6;
  float x = mod(offset + uTime * speed, span) - len - 0.3;
  vec2 q = vec2(max(abs(p.x - x) - len, 0.0), p.y - y);
  return fill(length(q) - height, px);
}

float wave(float x, float k) {
  float f = 2.1 + k * 1.35;
  return sin(x * f + uTide * (0.32 + 0.1 * k) + k * 1.7) * 0.5
    + sin(x * f * 2.17 - uTide * (0.46 + 0.08 * k) + k * 4.1) * 0.2
    + (noise(vec2(x * f * 0.8 + uTide * 0.15, k * 7.0)) - 0.5) * 0.7;
}

void main() {
  float aspect = uRes.x / uRes.y;
  float px = 1.5 / uRes.y;
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes.y;
  p.y += uLift;

  float h = uHorizon;
  float moonR = mix(0.062, 0.088, clamp(aspect - 0.8, 0.0, 1.0));
  vec2 moon = vec2(aspect - max(aspect * 0.23, moonR * 1.9), uMoonY);
  float moonD = length(p - moon);

  // Sky in three printed steps, with uneven edges like hand-wiped bokashi.
  float sky = clamp(p.y / h, 0.0, 1.0) + (noise(vec2(p.x * 2.5, 3.0)) - 0.5) * 0.06;
  vec3 color = uSky[0];
  color = mix(color, uSky[1], smoothstep(0.42 - px, 0.42 + px, sky));
  color = mix(color, uSky[2], smoothstep(0.78 - px, 0.78 + px, sky));

  vec2 cell = p * 38.0;
  vec2 id = floor(cell);
  float star = hash(id);
  if (star > 1.0 - 0.09 * uStars) {
    vec2 offset = vec2(hash(id + 3.1), hash(id + 7.7)) - 0.5;
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + star * 2.0) + star * 40.0);
    float spark = 1.0 - smoothstep(0.035, 0.09, length(fract(cell) - 0.5 - offset * 0.6));
    color = mix(color, uStar, spark * twinkle * (1.0 - smoothstep(h * 0.5, h * 0.92, p.y)));
  }

  // The halo is stepped too, so it reads as printed rings rather than a glow.
  float halo = 1.0 - smoothstep(moonR, moonR * 2.7, moonD);
  color = mix(color, uMoon, floor(halo * 3.0) / 3.0 * 0.11 * uHalo);
  color = mix(color, uMoon, fill(moonD - moonR, px));
  color = mix(color, uRing, fill(abs(moonD - moonR * 0.84) - 0.0028, px) * uHalo);

  float mist = 0.0;
  mist = max(mist, mistBand(p, aspect, moon.y + moonR * 0.38, 0.2, 0.0105, 0.006, 0.4, px));
  mist = max(mist, mistBand(p, aspect, moon.y + moonR * 0.78, 0.13, 0.0105, -0.004, 1.3, px));
  mist = max(mist, mistBand(p, aspect, moon.y - moonR * 0.7, 0.07, 0.007, 0.003, 2.1, px));
  mist = max(mist, mistBand(p, aspect, h * 0.42, 0.11, 0.008, -0.0025, 0.2, px));
  mist = max(mist, mistBand(p, aspect, h - 0.035, 0.3, 0.012, 0.0035, 1.7, px));
  color = mix(color, uMist, mist * (p.y < h ? 1.0 : 0.0));

  float ripple = uMouse.z * exp(-dot(p - uMouse.xy, p - uMouse.xy) * 90.0) * sin(length(p - uMouse.xy) * 90.0 - uTime * 5.0) * 0.008;

  for (int i = 0; i < 4; i++) {
    float k = float(i);
    float base = h + 0.012 + 0.035 * k + 0.019 * k * k;
    float amp = 0.005 + 0.009 * k;
    float y = base + amp * wave(p.x, k) + ripple;
    color = mix(color, uSea[i], smoothstep(y - px, y + px, p.y));
    for (int j = 1; j < 3; j++) {
      float line = y + float(j) * (0.011 + 0.006 * k) + 0.003 * sin(p.x * 9.0 + uTide * 0.3 + k);
      float dash = smoothstep(0.42, 0.5, noise(vec2(p.x * (5.0 + k) + k * 3.0 + float(j) * 11.0, uTide * 0.05)));
      float mark = fill(abs(p.y - line) - 0.0012 - 0.0006 * k, px) * dash * step(y, p.y);
      color = mix(color, mix(uSea[i], uFoam, 0.4), mark);
    }
  }

  // The moon's path across the water, broken into short strokes.
  if (p.y > h) {
    float depth = clamp((p.y - h) / max(1.0 - h, 0.1), 0.0, 1.0);
    float row = floor(p.y * 110.0);
    float drift = floor(uTide * 1.5);
    float seed = hash(vec2(row, drift));
    float width = moonR * (0.08 + 0.7 * seed * seed) * (1.0 - depth * 0.6);
    float shift = (hash(vec2(row + 5.0, drift)) - 0.5) * moonR * 0.9;
    float stroke = step(0.55, fract(p.y * 110.0)) * step(0.3, seed);
    color = mix(color, uMoon, fill(abs(p.x - moon.x - shift) - width, px) * stroke * 0.3 * (1.0 - depth * 0.7));
  }

  float grain = hash(floor(gl_FragCoord.xy)) - 0.5;
  float fiber = noise(vec2(gl_FragCoord.x * 0.018, gl_FragCoord.y * 0.55)) - 0.5;
  color += (grain * 0.03 + fiber * 0.022) * uGrain;
  color = mix(color, uPage, uQuiet);
  gl_FragColor = vec4(color, 1.0);
}
`;

const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function scene(name, variant) {
  const c = Object.fromEntries(Object.entries(variant.colors).map(([role, hex]) => [role, rgb(hex)]));
  const moon = c[accentRole[name]];
  if (variant.appearance === 'light') {
    // Kami is a daylight print: paper sky, ink-blue water, and a red sun like a seal.
    return {
      uSky: [c.bg, mix(c.bg, c.visual, 0.22), mix(c.bg, c.visual, 0.5)],
      uSea: [0.24, 0.4, 0.56, 0.74].map(t => mix(c.bg, c.func, t)),
      uMist: mix(c.bg, c.visual, 0.62), uFoam: c.bg, uMoon: moon, uRing: moon, uStar: c.bg,
      uPage: c.bg0, uStars: 0, uMoonY: 0.16, uHalo: 0, uGrain: 1.4,
    };
  }
  const night = name === 'yoru';
  return {
    uSky: [c.bg0, mix(c.bg0, c.bg_p1, 0.9), mix(c.bg, c.visual, 0.42)],
    uSea: [mix(c.bg, c.visual, 0.75), c.visual, mix(c.search, c.func, night ? 0.18 : 0.28), mix(c.search, c.func, night ? 0.38 : 0.55)],
    uMist: night ? mix(c.visual, c.bg3, 0.4) : c.visual, uFoam: mix(c.func, c.fg, 0.5), uMoon: moon, uRing: mix(moon, c.bg, 0.16),
    uStar: c.ui_special, uPage: c.bg0, uStars: night ? 1 : 0.55, uMoonY: night ? 0.27 : 0.19, uHalo: night ? 0.75 : 1, uGrain: night ? 0.9 : 0.7,
  };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export function initializeSea(canvas, variants) {
  const gl = canvas?.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const program = gl.createProgram();
  try {
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn('karazuri: the animated sea is unavailable.', error);
    return null;
  }
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const locations = {};
  const uniform = name => (locations[name] ??= gl.getUniformLocation(program, name));
  const scenes = Object.fromEntries(Object.entries(variants).map(([name, variant]) => [name, scene(name, variant)]));
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const hero = document.querySelector('.hero');
  let current = null;
  let from = null;
  let to = null;
  let tweenStart = 0;
  let time = 9;
  let last = 0;
  let frame = 0;
  let horizon = 0.6;
  const mouse = { x: -1, y: -1, strength: 0 };

  function upload(values) {
    for (const [name, value] of Object.entries(values)) {
      if (typeof value === 'number') gl.uniform1f(uniform(name), value);
      else if (Array.isArray(value[0])) gl.uniform3fv(uniform(name), value.flat());
      else gl.uniform3fv(uniform(name), value);
    }
  }

  function blend(a, b, t) {
    if (typeof a === 'number') return a + (b - a) * t;
    if (Array.isArray(a[0])) return a.map((v, i) => mix(v, b[i], t));
    return mix(a, b, t);
  }

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1 : 1.5);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    // Keep the hero text on the sky: the sea starts just below the variant cards.
    const content = [...hero.children].filter(child => child.getClientRects().length && getComputedStyle(child).position !== 'absolute').at(-1) ?? hero;
    const end = content.getBoundingClientRect().bottom + scrollY;
    horizon = Math.min(Math.max((end + 36) / canvas.clientHeight, 0.46), 0.74);
    request();
  }

  function draw(now) {
    const viewport = canvas.clientHeight || 1;
    const moving = motion.matches;
    if (to) {
      const t = moving ? Math.min((now - tweenStart) / 1100, 1) : 1;
      const eased = 1 - (1 - t) ** 3;
      current = Object.fromEntries(Object.entries(to).map(([name, value]) => [name, blend(from[name], value, eased)]));
      if (t === 1) to = null;
    }
    const scroll = Math.max(scrollY, 0);
    mouse.strength *= 0.965;
    upload(current);
    gl.uniform2f(uniform('uRes'), canvas.width, canvas.height);
    gl.uniform1f(uniform('uTime'), time);
    gl.uniform1f(uniform('uTide'), time + (moving ? scroll * 0.0025 : 0));
    gl.uniform1f(uniform('uLift'), moving ? (scroll * 0.3) / viewport : 0);
    gl.uniform1f(uniform('uQuiet'), Math.min(scroll / (viewport * 0.9), 1) * 0.86);
    gl.uniform1f(uniform('uHorizon'), horizon);
    gl.uniform3f(uniform('uMouse'), mouse.x / viewport, (mouse.y + (moving ? scroll * 0.3 : 0)) / viewport, mouse.strength);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function tick(now) {
    frame = 0;
    if (document.hidden) return;
    const deepScroll = scrollY > (canvas.clientHeight || 1) * 1.3;
    const interval = deepScroll && !to ? 100 : 1000 / 45;
    if (now - last >= interval || to) {
      if (motion.matches) time += Math.min((now - last) / 1000, 0.1);
      last = now;
      draw(now);
    }
    if (motion.matches || to) frame = requestAnimationFrame(tick);
  }

  function request() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function restart() {
    last = performance.now();
    request();
  }

  new ResizeObserver(resize).observe(canvas);
  new ResizeObserver(resize).observe(hero);
  addEventListener('scroll', () => { if (!motion.matches) request(); }, { passive: true });
  addEventListener('pointermove', event => {
    if (!motion.matches || event.pointerType === 'touch') return;
    const moved = Math.hypot(event.clientX - mouse.x, event.clientY - mouse.y);
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.strength = Math.min(mouse.strength + moved / 400, 1);
  }, { passive: true });
  document.addEventListener('visibilitychange', restart);
  motion.addEventListener('change', restart);
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    document.documentElement.classList.remove('sea-live');
  });

  document.documentElement.classList.add('sea-live');
  return {
    setVariant(name) {
      const target = scenes[name];
      if (!current) current = target;
      from = current;
      to = target;
      tweenStart = performance.now();
      resize();
    },
  };
}
