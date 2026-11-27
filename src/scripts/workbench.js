import { contrast, paint } from './colors.js';

const roleNames = {
  func: 'Function', keyword: 'Keyword', comment: 'Comment', string: 'String',
  number: 'Number', type: 'Type', field: 'Field', constant: 'Constant',
};
const editorTools = [['Neovim', 'nvim'], ['VS Code', 'vs-code'], ['Zed', 'zed']];
const terminalTools = [['Ghostty', 'ghostty'], ['kitty', 'kitty'], ['WezTerm', 'wezterm']];

function setDisclosure(panel, open) {
  panel.toggleAttribute('data-open', open);
  panel.inert = !open;
}

function clonePreview(source) {
  const clone = source.cloneNode(true);
  const selections = source.querySelectorAll('select');
  clone.querySelectorAll('select').forEach((select, i) => { select.value = selections[i].value; });
  return clone;
}

export function initializeWorkbench(variants, onVariant) {
  const root = document.getElementById('preview');
  const find = selector => root.querySelector(selector);
  const base = find('.preview-base');
  const overlay = find('.preview-overlay');
  const primary = find('.preview-primary');
  const shelf = find('.preview-shelf');
  const stage = find('.workbench-stage');
  const panes = [...base.querySelectorAll('[data-pane]')];
  const editor = find('.editor-pane');
  const agent = find('.agent-pane');
  const themeButtons = [...root.querySelectorAll('[data-variant]')];
  const viewButtons = [...root.querySelectorAll('[data-view]')];
  const compare = find('.compare-button');
  const comparePanel = find('#compare-options');
  const compareSelect = comparePanel.querySelector('select');
  const slider = find('.compare-range');
  const install = find('.quick-install-button');
  const installPanel = find('#quick-install');
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const easing = getComputedStyle(stage).getPropertyValue('--ease-out').trim();

  let variant = 'umi';
  let compareVariant = 'kami';
  let view = 'editor';
  let inspected = null;
  let snapshot = null;
  let animations = [];

  function stopMotion() {
    for (const animation of animations) animation.cancel();
    animations = [];
    snapshot?.remove();
    snapshot = null;
  }

  function transition(kind, update) {
    const fromHeight = stage.getBoundingClientRect().height;
    stopMotion();
    if (!motion.matches || typeof stage.animate !== 'function') {
      update();
      return;
    }

    // Reveal the new palette without blending its text into the old background.
    const previous = document.createElement('div');
    previous.className = 'stage-snapshot';
    previous.inert = true;
    previous.setAttribute('aria-hidden', 'true');
    previous.style.height = `${fromHeight}px`;
    previous.append(clonePreview(base));
    const comparing = stage.hasAttribute('data-comparing');
    if (comparing) {
      const comparison = clonePreview(overlay);
      comparison.style.opacity = getComputedStyle(overlay).opacity;
      previous.append(comparison);
    }

    update();
    const toHeight = stage.getBoundingClientRect().height;
    snapshot = previous;
    stage.append(previous);

    const options = { duration: kind === 'pane' ? 230 : 270, easing };
    const exitFrames = kind === 'pane'
      ? [{ opacity: 1 }, { opacity: 0 }]
      : [{ clipPath: 'inset(0)' }, { clipPath: kind === 'comparison' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' }];
    const exit = previous.animate(exitFrames, options);
    animations.push(exit);
    if (kind === 'pane') {
      for (const surface of comparing ? [base, overlay] : [base]) {
        for (const region of surface.children) {
          animations.push(region.animate([{ transform: 'translateY(4px)' }, { transform: 'translateY(0)' }], options));
        }
      }
    }
    if (Math.abs(toHeight - fromHeight) > 1) {
      animations.push(stage.animate([{ height: `${fromHeight}px` }, { height: `${toHeight}px` }], options));
    }
    exit.onfinish = () => { if (snapshot === previous) stopMotion(); };
  }

  function refreshComparison() {
    if (stage.hasAttribute('data-comparing')) overlay.replaceChildren(...clonePreview(base).children);
  }

  function updateInspector(button) {
    inspected = button;
    const { role, roleName, foreground } = button.dataset;
    const colors = { ...variants[variant].colors, ...variants[variant].preview };
    const bgRole = button.closest('.cursor-line') ? 'bg_p1' : 'bg';
    const hex = colors[role].toUpperCase();
    const ratio = foreground ? contrast(colors[foreground], hex) : contrast(hex, colors[bgRole]);
    find('.inspector-role').textContent = roleName ?? roleNames[role];
    find('.inspector-hex').textContent = hex;
    find('.inspector-chip').style.backgroundColor = hex;
    find('.inspector-ratio').textContent = `${ratio.toFixed(1)}:1`;
  }

  function inspectPrimary() {
    const sample = primary.querySelector('[data-sample]:not([hidden]), [data-agent-diff]:not([hidden])') ?? primary;
    updateInspector(sample.querySelector('[data-inspect-default], [data-role="func"]') ?? sample.querySelector('[data-role]'));
  }

  function updateInstall() {
    const text = `Install ${variants[variant].name}`;
    install.firstElementChild.textContent = text;
    find('#quick-install-title').textContent = text;
    const agentTools = agent.dataset.agent === 'opencode'
      ? [['OpenCode', 'opencode'], ['T3 Code', 't3-code']]
      : [['T3 Code', 't3-code'], ['OpenCode', 'opencode']];
    const tools = { editor: editorTools, agent: agentTools, terminal: terminalTools }[view];
    find('.quick-install-links').replaceChildren(...tools.map(([name, id]) => {
      const link = document.createElement('a');
      link.textContent = name;
      link.href = `#install-${id}`;
      return link;
    }));
  }

  function applyVariant(name) {
    variant = name;
    if (variant === compareVariant) compareVariant = variant === 'kami' ? 'umi' : 'kami';
    paint(base, variants[variant]);
    paint(overlay, variants[compareVariant]);
    for (const button of themeButtons) button.setAttribute('aria-pressed', String(button.dataset.variant === variant));
    find('.compare-left').textContent = variants[variant].name;
    compareSelect.replaceChildren(...Object.entries(variants)
      .filter(([key]) => key !== variant)
      .map(([key, option]) => new Option(option.name, key, false, key === compareVariant)));
    updateInspector(inspected);
    updateInstall();
    onVariant(variant);
  }

  function applyVariantHash() {
    const name = location.hash.slice(1);
    if (Object.hasOwn(variants, name)) applyVariant(name);
  }

  function selectVariant(name) {
    if (name !== variant) transition('palette', () => applyVariant(name));
    history.replaceState(null, '', `#${name}`);
  }

  for (const button of themeButtons) button.addEventListener('click', () => selectVariant(button.dataset.variant));

  for (const button of viewButtons) button.addEventListener('click', () => {
    if (button.dataset.view === view) return;
    transition('pane', () => {
      view = button.dataset.view;
      const selected = panes.find(pane => pane.dataset.pane === view);
      primary.append(selected);
      shelf.append(...panes.filter(pane => pane !== selected));
      for (const choice of viewButtons) choice.setAttribute('aria-pressed', String(choice === button));
      refreshComparison();
      inspectPrimary();
      updateInstall();
    });
  });

  editor.querySelector('select').addEventListener('change', event => transition('pane', () => {
    const file = event.target.value;
    editor.querySelector('.editor-file').textContent = file;
    for (const sample of editor.querySelectorAll('[data-sample]')) sample.hidden = sample.dataset.sample !== file;
    inspectPrimary();
  }));
  agent.querySelector('select').addEventListener('change', event => transition('pane', () => {
    agent.dataset.agent = event.target.value;
    for (const diff of agent.querySelectorAll('[data-agent-diff]')) diff.hidden = diff.dataset.agentDiff !== agent.dataset.agent;
    inspectPrimary();
    updateInstall();
  }));

  base.addEventListener('click', event => {
    const button = event.target.closest('[data-role]');
    if (button) updateInspector(button);
  });
  compare.addEventListener('click', () => {
    stopMotion();
    const open = compare.getAttribute('aria-pressed') !== 'true';
    compare.setAttribute('aria-pressed', String(open));
    stage.toggleAttribute('data-comparing', open);
    setDisclosure(comparePanel, open);
    base.inert = open;
    slider.hidden = !open;
    refreshComparison();
  });
  compareSelect.addEventListener('change', () => transition('comparison', () => {
    compareVariant = compareSelect.value;
    paint(overlay, variants[compareVariant]);
  }));
  slider.addEventListener('pointerdown', stopMotion);
  slider.addEventListener('input', () => {
    stage.style.setProperty('--split', `${slider.value}%`);
    slider.setAttribute('aria-valuetext', `${slider.value}% left variant`);
  });

  install.addEventListener('click', () => {
    const open = installPanel.inert;
    setDisclosure(installPanel, open);
    install.setAttribute('aria-expanded', String(open));
  });
  motion.addEventListener('change', () => { if (!motion.matches) stopMotion(); });
  window.addEventListener('hashchange', applyVariantHash);

  inspectPrimary();
  const initial = location.hash.slice(1);
  applyVariant(Object.hasOwn(variants, initial) ? initial : variant);
  for (const button of base.querySelectorAll('[data-role]')) button.disabled = false;
  root.classList.add('is-live');
  return selectVariant;
}
