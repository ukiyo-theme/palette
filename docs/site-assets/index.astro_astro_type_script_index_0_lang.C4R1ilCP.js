function e(e){let[t,n,r]=[1,3,5].map(t=>parseInt(e.slice(t,t+2),16)/255).map(e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4);return .2126*t+.7152*n+.0722*r}function t(t,n){let[r,i]=[e(t),e(n)].sort((e,t)=>t-e);return(r+.05)/(i+.05)}function n(e,t){for(let[n,r]of Object.entries({...t.colors,...t.preview}))e.style.setProperty(`--${n}`,r);e.style.colorScheme=t.appearance}function r(e){let r=document.getElementById(`palette`),i=r.querySelector(`.swatch-groups`),a=r.querySelector(`.swatch-status`),o=r.querySelector(`.anatomy`),s=[...o.querySelectorAll(`[data-role]`),o],c=matchMedia(`(prefers-reduced-motion: no-preference)`),l=[...i.querySelectorAll(`.swatches`)].flatMap((e,t)=>[...e.querySelectorAll(`.swatch`)].map(e=>({button:e,index:t,chip:e.querySelector(`.chip`),hex:e.querySelector(`.hex`),ratio:e.querySelector(`.ratio`),feedback:e.querySelector(`.copy-feedback`)}))),u,d,f,p=0;function m(){clearTimeout(f),d?.removeAttribute(`data-feedback`),d=void 0,a.textContent=``}async function h(e){let t=++p,n=e.hex.textContent,r=!1;try{await navigator.clipboard.writeText(n),r=!0}catch{}t===p&&(m(),e.feedback.textContent=r?`Copied`:`Use hex`,d=e.button,d.setAttribute(`data-feedback`,``),a.textContent=r?`Copied ${n}`:`Copy this value: ${n}`,f=setTimeout(m,1150))}function g(e){let t=e.firstElementChild;t&&(t.getAnimations().forEach(e=>e.cancel()),t.remove())}function _(e){if(e===o.dataset.spot)return;e?o.dataset.spot=e:delete o.dataset.spot;let t=!1;for(let n of s){let r=n.dataset.role===e;n.classList.toggle(`is-lit`,r),t||=r&&n.classList.contains(`b`)}o.toggleAttribute(`data-spot-surface`,t);for(let{button:t}of l)t.toggleAttribute(`data-lit`,t.dataset.role===e)}for(let e of l)e.button.disabled=!1,e.button.addEventListener(`click`,()=>h(e)),e.button.addEventListener(`pointerenter`,()=>_(e.button.dataset.role)),e.button.addEventListener(`focus`,()=>_(e.button.dataset.role));return i.addEventListener(`pointerleave`,()=>_()),i.addEventListener(`focusout`,e=>{i.contains(e.relatedTarget)||_()}),o.addEventListener(`pointerover`,e=>_(e.target.closest(`.t, .d`)?.dataset.role)),o.addEventListener(`pointerleave`,()=>_()),c.addEventListener(`change`,e=>{e.matches||l.forEach(({chip:e})=>g(e))}),i=>{if(i===u)return;let a=u!==void 0&&c.matches;u=i,++p,m();let o=e[i];n(r,o);for(let e of l){let n=e.button.dataset.role,r=e.hex.textContent,i=o.colors[n].toUpperCase(),s=t(i,o.colors.bg).toFixed(1);if(g(e.chip),e.chip.style.backgroundColor=i,e.hex.textContent=i,e.ratio.textContent=`${s}:1`,e.button.setAttribute(`aria-label`,`Copy ${n} ${i}, contrast ${s} to 1`),a&&r!==i&&typeof e.chip.animate==`function`){let t=document.createElement(`span`);t.className=`chip-outgoing`,t.style.backgroundColor=r,e.chip.append(t);let n=t.animate([{clipPath:`inset(0)`},{clipPath:`inset(0 0 0 100%)`}],{duration:180,delay:e.index*28,easing:`cubic-bezier(.2, .75, .25, 1)`,fill:`both`});n.onfinish=()=>t.remove()}}}}var i={umi:`field`,yoru:`constant`,kami:`builtin`},a=`
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`,o=`
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
`,s=e=>[1,3,5].map(t=>parseInt(e.slice(t,t+2),16)/255),c=(e,t,n)=>e.map((e,r)=>e+(t[r]-e)*n);function l(e,t){let n=Object.fromEntries(Object.entries(t.colors).map(([e,t])=>[e,s(t)])),r=n[i[e]];if(t.appearance===`light`)return{uSky:[n.bg,c(n.bg,n.visual,.22),c(n.bg,n.visual,.5)],uSea:[.24,.4,.56,.74].map(e=>c(n.bg,n.func,e)),uMist:c(n.bg,n.visual,.62),uFoam:n.bg,uMoon:r,uRing:r,uStar:n.bg,uPage:n.bg0,uStars:0,uMoonY:.16,uHalo:0,uGrain:1.4};let a=e===`yoru`;return{uSky:[n.bg0,c(n.bg0,n.bg_p1,.9),c(n.bg,n.visual,.42)],uSea:[c(n.bg,n.visual,.75),n.visual,c(n.search,n.func,a?.18:.28),c(n.search,n.func,a?.38:.55)],uMist:a?c(n.visual,n.bg3,.4):n.visual,uFoam:c(n.func,n.fg,.5),uMoon:r,uRing:c(r,n.bg,.16),uStar:n.ui_special,uPage:n.bg0,uStars:a?1:.55,uMoonY:a?.27:.19,uHalo:a?.75:1,uGrain:a?.9:.7}}function u(e,t,n){let r=e.createShader(t);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS))throw Error(e.getShaderInfoLog(r));return r}function d(e,t){let n=e?.getContext(`webgl`,{alpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:`low-power`});if(!n)return null;let r=n.createProgram();try{if(n.attachShader(r,u(n,n.VERTEX_SHADER,a)),n.attachShader(r,u(n,n.FRAGMENT_SHADER,o)),n.linkProgram(r),!n.getProgramParameter(r,n.LINK_STATUS))throw Error(n.getProgramInfoLog(r))}catch(e){return console.warn(`karazuri: the animated sea is unavailable.`,e),null}n.useProgram(r),n.bindBuffer(n.ARRAY_BUFFER,n.createBuffer()),n.bufferData(n.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),n.STATIC_DRAW);let i=n.getAttribLocation(r,`position`);n.enableVertexAttribArray(i),n.vertexAttribPointer(i,2,n.FLOAT,!1,0,0);let s={},d=e=>s[e]??=n.getUniformLocation(r,e),f=Object.fromEntries(Object.entries(t).map(([e,t])=>[e,l(e,t)])),p=matchMedia(`(prefers-reduced-motion: no-preference)`),m=document.querySelector(`.hero`),h=null,g=null,_=null,v=0,y=9,b=0,x=0,S=.6,C={x:-1,y:-1,strength:0};function w(e){for(let[t,r]of Object.entries(e))typeof r==`number`?n.uniform1f(d(t),r):Array.isArray(r[0])?n.uniform3fv(d(t),r.flat()):n.uniform3fv(d(t),r)}function T(e,t,n){return typeof e==`number`?e+(t-e)*n:Array.isArray(e[0])?e.map((e,r)=>c(e,t[r],n)):c(e,t,n)}function E(){let t=Math.min(devicePixelRatio||1,matchMedia(`(pointer: coarse)`).matches?1:1.5),r=Math.round(e.clientWidth*t),i=Math.round(e.clientHeight*t);(e.width!==r||e.height!==i)&&(e.width=r,e.height=i,n.viewport(0,0,r,i));let a=([...m.children].filter(e=>e.getClientRects().length&&getComputedStyle(e).position!==`absolute`).at(-1)??m).getBoundingClientRect().bottom+scrollY;S=Math.min(Math.max((a+36)/e.clientHeight,.46),.74),k()}function D(t){let r=e.clientHeight||1,i=p.matches;if(_){let e=i?Math.min((t-v)/1100,1):1,n=1-(1-e)**3;h=Object.fromEntries(Object.entries(_).map(([e,t])=>[e,T(g[e],t,n)])),e===1&&(_=null)}let a=Math.max(scrollY,0);C.strength*=.965,w(h),n.uniform2f(d(`uRes`),e.width,e.height),n.uniform1f(d(`uTime`),y),n.uniform1f(d(`uTide`),y+(i?a*.0025:0)),n.uniform1f(d(`uLift`),i?a*.3/r:0),n.uniform1f(d(`uQuiet`),Math.min(a/(r*.9),1)*.86),n.uniform1f(d(`uHorizon`),S),n.uniform3f(d(`uMouse`),C.x/r,(C.y+(i?a*.3:0))/r,C.strength),n.drawArrays(n.TRIANGLES,0,3)}function O(t){if(x=0,document.hidden)return;let n=scrollY>(e.clientHeight||1)*1.3&&!_?100:1e3/45;(t-b>=n||_)&&(p.matches&&(y+=Math.min((t-b)/1e3,.1)),b=t,D(t)),(p.matches||_)&&(x=requestAnimationFrame(O))}function k(){!x&&!document.hidden&&(x=requestAnimationFrame(O))}function A(){b=performance.now(),k()}return new ResizeObserver(E).observe(e),new ResizeObserver(E).observe(m),addEventListener(`scroll`,()=>{p.matches||k()},{passive:!0}),addEventListener(`pointermove`,e=>{if(!p.matches||e.pointerType===`touch`)return;let t=Math.hypot(e.clientX-C.x,e.clientY-C.y);C.x=e.clientX,C.y=e.clientY,C.strength=Math.min(C.strength+t/400,1)},{passive:!0}),document.addEventListener(`visibilitychange`,A),p.addEventListener(`change`,A),e.addEventListener(`webglcontextlost`,e=>{e.preventDefault(),cancelAnimationFrame(x),document.documentElement.classList.remove(`sea-live`)}),document.documentElement.classList.add(`sea-live`),{setVariant(e){let t=f[e];h||=t,g=h,_=t,v=performance.now(),E()}}}var f={func:`Function`,keyword:`Keyword`,comment:`Comment`,string:`String`,number:`Number`,type:`Type`,field:`Field`,constant:`Constant`},p=[[`Neovim`,`nvim`],[`VS Code`,`vs-code`],[`Zed`,`zed`]],m=[[`Ghostty`,`ghostty`],[`kitty`,`kitty`],[`WezTerm`,`wezterm`]];function h(e,t){e.toggleAttribute(`data-open`,t),e.inert=!t}function g(e){let t=e.cloneNode(!0),n=e.querySelectorAll(`select`);return t.querySelectorAll(`select`).forEach((e,t)=>{e.value=n[t].value}),t}function _(e,r){let i=document.getElementById(`preview`),a=e=>i.querySelector(e),o=a(`.preview-base`),s=a(`.preview-overlay`),c=a(`.preview-primary`),l=a(`.preview-shelf`),u=a(`.workbench-stage`),d=[...o.querySelectorAll(`[data-pane]`)],_=a(`.editor-pane`),v=a(`.agent-pane`),y=[...document.querySelectorAll(`[data-variant]`)],b=[...i.querySelectorAll(`[data-view]`)],x=a(`.compare-button`),S=a(`#compare-options`),C=S.querySelector(`select`),w=a(`.compare-range`),T=a(`.quick-install-button`),E=a(`#quick-install`),D=matchMedia(`(prefers-reduced-motion: no-preference)`),O=getComputedStyle(u).getPropertyValue(`--ease-out`).trim(),k=`umi`,A=`kami`,j=`editor`,M=null,N=null,P=[];function F(){for(let e of P)e.cancel();P=[],N?.remove(),N=null}function I(e,t){let n=u.getBoundingClientRect().height;if(F(),!D.matches||typeof u.animate!=`function`){t();return}let r=document.createElement(`div`);r.className=`stage-snapshot`,r.inert=!0,r.setAttribute(`aria-hidden`,`true`),r.style.height=`${n}px`,r.append(g(o));let i=u.hasAttribute(`data-comparing`);if(i){let e=g(s);e.style.opacity=getComputedStyle(s).opacity,r.append(e)}t();let a=u.getBoundingClientRect().height;N=r,u.append(r);let c={duration:e===`pane`?230:270,easing:O},l=e===`pane`?[{opacity:1},{opacity:0}]:[{clipPath:`inset(0)`},{clipPath:e===`comparison`?`inset(0 100% 0 0)`:`inset(0 0 0 100%)`}],d=r.animate(l,c);if(P.push(d),e===`pane`)for(let e of i?[o,s]:[o])for(let t of e.children)P.push(t.animate([{transform:`translateY(4px)`},{transform:`translateY(0)`}],c));Math.abs(a-n)>1&&P.push(u.animate([{height:`${n}px`},{height:`${a}px`}],c)),d.onfinish=()=>{N===r&&F()}}function L(){u.hasAttribute(`data-comparing`)&&s.replaceChildren(...g(o).children)}function R(n){M=n;let{role:r,roleName:i,foreground:o}=n.dataset,s={...e[k].colors,...e[k].preview},c=n.closest(`.cursor-line`)?`bg_p1`:`bg`,l=s[r].toUpperCase(),u=o?t(s[o],l):t(l,s[c]);a(`.inspector-role`).textContent=i??f[r],a(`.inspector-hex`).textContent=l,a(`.inspector-chip`).style.backgroundColor=l,a(`.inspector-ratio`).textContent=`${u.toFixed(1)}:1`}function z(){let e=c.querySelector(`[data-sample]:not([hidden]), [data-agent-diff]:not([hidden])`)??c;R(e.querySelector(`[data-inspect-default], [data-role="func"]`)??e.querySelector(`[data-role]`))}function B(){let t=`Install ${e[k].name}`;T.firstElementChild.textContent=t,a(`#quick-install-title`).textContent=t;let n={editor:p,agent:v.dataset.agent===`opencode`?[[`OpenCode`,`opencode`],[`T3 Code`,`t3-code`]]:[[`T3 Code`,`t3-code`],[`OpenCode`,`opencode`]],terminal:m}[j];a(`.quick-install-links`).replaceChildren(...n.map(([e,t])=>{let n=document.createElement(`a`);return n.textContent=e,n.href=`#install-${t}`,n}))}function V(t){k=t,k===A&&(A=k===`kami`?`umi`:`kami`),n(o,e[k]),n(s,e[A]);for(let e of y)e.setAttribute(`aria-pressed`,String(e.dataset.variant===k));a(`.compare-left`).textContent=e[k].name,C.replaceChildren(...Object.entries(e).filter(([e])=>e!==k).map(([e,t])=>new Option(t.name,e,!1,e===A))),R(M),B(),r(k)}function H(){let t=location.hash.slice(1);Object.hasOwn(e,t)&&V(t)}function U(e){e!==k&&I(`palette`,()=>V(e)),history.replaceState(null,``,`#${e}`);try{localStorage.setItem(`karazuri-variant`,e)}catch{}}for(let e of y)e.addEventListener(`click`,()=>U(e.dataset.variant));for(let e of b)e.addEventListener(`click`,()=>{e.dataset.view!==j&&I(`pane`,()=>{j=e.dataset.view;let t=d.find(e=>e.dataset.pane===j);c.append(t),l.append(...d.filter(e=>e!==t));for(let t of b)t.setAttribute(`aria-pressed`,String(t===e));L(),z(),B()})});_.querySelector(`select`).addEventListener(`change`,e=>I(`pane`,()=>{let t=e.target.value;_.querySelector(`.editor-file`).textContent=t;for(let e of _.querySelectorAll(`[data-sample]`))e.hidden=e.dataset.sample!==t;z()})),v.querySelector(`select`).addEventListener(`change`,e=>I(`pane`,()=>{v.dataset.agent=e.target.value;for(let e of v.querySelectorAll(`[data-agent-diff]`))e.hidden=e.dataset.agentDiff!==v.dataset.agent;z(),B()})),o.addEventListener(`click`,e=>{let t=e.target.closest(`[data-role]`);t&&R(t)}),x.addEventListener(`click`,()=>{F();let e=x.getAttribute(`aria-pressed`)!==`true`;x.setAttribute(`aria-pressed`,String(e)),u.toggleAttribute(`data-comparing`,e),h(S,e),o.inert=e,w.hidden=!e,L()}),C.addEventListener(`change`,()=>I(`comparison`,()=>{A=C.value,n(s,e[A])})),w.addEventListener(`pointerdown`,F),w.addEventListener(`input`,()=>{u.style.setProperty(`--split`,`${w.value}%`),w.setAttribute(`aria-valuetext`,`${w.value}% left variant`)}),T.addEventListener(`click`,()=>{let e=E.inert;h(E,e),T.setAttribute(`aria-expanded`,String(e))}),D.addEventListener(`change`,()=>{D.matches||F()}),window.addEventListener(`hashchange`,H),z();let W=document.documentElement.dataset.theme;V(Object.hasOwn(e,W)?W:k);for(let e of o.querySelectorAll(`[data-role]`))e.disabled=!1;return i.classList.add(`is-live`),U}var v=JSON.parse(document.getElementById(`theme-data`).textContent),y=Object.keys(v),b=document.documentElement,x=document.querySelector(`meta[name="theme-color"]`),S=r(v),C=d(document.querySelector(`.sea`),v),w=document.getElementById(`tool-query`),T=[...document.querySelectorAll(`.tool-group`)].map(e=>[e,[...e.querySelectorAll(`.tool`)]]),E=[...document.querySelectorAll(`.download-links a[download]`)];function D(e){b.dataset.theme=e,x.content=v[e].colors.bg0,S(e),C?.setVariant(e);for(let t of E)t.toggleAttribute(`data-matches-variant`,t.textContent.split(` + `).includes(v[e].name))}function O(){let e=w.value.trim().toLowerCase(),t=!1;for(let[n,r]of T){for(let t of r)t.hidden=!t.querySelector(`.tool-name`).textContent.toLowerCase().includes(e);n.hidden=r.every(e=>e.hidden),t||=!n.hidden}document.getElementById(`no-tools`).hidden=t}function k(e,t=!1){if(!e.startsWith(`install-`))return;let n=document.getElementById(e);if(!n)return;n.hidden&&(w.value=``,O());let r=n.querySelector(`details`);r&&(r.open=!0),t&&n.querySelector(`summary, a`)?.focus({preventScroll:!0})}document.getElementById(`tool-search`).hidden=!1,w.addEventListener(`input`,O),document.getElementById(`quick-install`).addEventListener(`click`,e=>{let t=e.target.closest(`a`);t&&k(t.hash.slice(1),!0)}),window.addEventListener(`hashchange`,()=>k(location.hash.slice(1))),k(location.hash.slice(1));var A=_(v,D);window.addEventListener(`keydown`,e=>{if(e.defaultPrevented||e.repeat||e.metaKey||e.ctrlKey||e.altKey||e.target.closest?.(`input, select, textarea, [contenteditable]`))return;let t=Number(e.key)-1;y[t]?A(y[t]):e.key.toLowerCase()===`t`&&A(y[(y.indexOf(b.dataset.theme)+1)%y.length])}),b.classList.add(`theme-live`);