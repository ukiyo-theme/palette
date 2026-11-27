import { contrast, paint } from './colors.js';

export function initializePalette(variants) {
  const palette = document.getElementById('palette');
  const groups = palette.querySelector('.swatch-groups');
  const status = palette.querySelector('.swatch-status');
  const anatomy = palette.querySelector('.anatomy');
  const uses = [...anatomy.querySelectorAll('[data-role]'), anatomy];
  const motion = matchMedia('(prefers-reduced-motion: no-preference)');
  const swatches = [...groups.querySelectorAll('.swatches')].flatMap((group, index) =>
    [...group.querySelectorAll('.swatch')].map(button => ({
      button,
      index,
      chip: button.querySelector('.chip'),
      hex: button.querySelector('.hex'),
      ratio: button.querySelector('.ratio'),
      feedback: button.querySelector('.copy-feedback'),
    })),
  );
  let variant;
  let feedbackButton;
  let feedbackTimer;
  let copyRequest = 0;

  function clearFeedback() {
    clearTimeout(feedbackTimer);
    feedbackButton?.removeAttribute('data-feedback');
    feedbackButton = undefined;
    status.textContent = '';
  }

  async function copySwatch(swatch) {
    const request = ++copyRequest;
    const hex = swatch.hex.textContent;
    let copied = false;
    try {
      await navigator.clipboard.writeText(hex);
      copied = true;
    } catch {
      // The value remains visible when clipboard access is unavailable.
    }
    if (request !== copyRequest) return;

    clearFeedback();
    swatch.feedback.textContent = copied ? 'Copied' : 'Use hex';
    feedbackButton = swatch.button;
    feedbackButton.setAttribute('data-feedback', '');
    status.textContent = copied ? `Copied ${hex}` : `Copy this value: ${hex}`;
    feedbackTimer = setTimeout(clearFeedback, 1150);
  }

  function clearWipe(chip) {
    const previous = chip.firstElementChild;
    if (!previous) return;
    previous.getAnimations().forEach(animation => animation.cancel());
    previous.remove();
  }

  function spotlight(role) {
    if (role === anatomy.dataset.spot) return;
    if (role) anatomy.dataset.spot = role;
    else delete anatomy.dataset.spot;
    let surface = false;
    for (const use of uses) {
      const lit = use.dataset.role === role;
      use.classList.toggle('is-lit', lit);
      surface ||= lit && use.classList.contains('b');
    }
    anatomy.toggleAttribute('data-spot-surface', surface);
    for (const { button } of swatches) button.toggleAttribute('data-lit', button.dataset.role === role);
  }

  for (const swatch of swatches) {
    swatch.button.disabled = false;
    swatch.button.addEventListener('click', () => copySwatch(swatch));
    swatch.button.addEventListener('pointerenter', () => spotlight(swatch.button.dataset.role));
    swatch.button.addEventListener('focus', () => spotlight(swatch.button.dataset.role));
  }
  groups.addEventListener('pointerleave', () => spotlight());
  groups.addEventListener('focusout', event => { if (!groups.contains(event.relatedTarget)) spotlight(); });
  anatomy.addEventListener('pointerover', event => spotlight(event.target.closest('.t, .d')?.dataset.role));
  anatomy.addEventListener('pointerleave', () => spotlight());
  motion.addEventListener('change', event => {
    if (!event.matches) swatches.forEach(({ chip }) => clearWipe(chip));
  });

  return name => {
    if (name === variant) return;
    // Direct links should paint their variant immediately on the first render.
    const animate = variant !== undefined && motion.matches;
    variant = name;
    ++copyRequest;
    clearFeedback();
    const selected = variants[name];
    paint(palette, selected);

    for (const swatch of swatches) {
      const role = swatch.button.dataset.role;
      const previousHex = swatch.hex.textContent;
      const hex = selected.colors[role].toUpperCase();
      const ratio = contrast(hex, selected.colors.bg).toFixed(1);
      clearWipe(swatch.chip);
      swatch.chip.style.backgroundColor = hex;
      swatch.hex.textContent = hex;
      swatch.ratio.textContent = `${ratio}:1`;
      swatch.button.setAttribute('aria-label', `Copy ${role} ${hex}, contrast ${ratio} to 1`);

      if (animate && previousHex !== hex && typeof swatch.chip.animate === 'function') {
        const previous = document.createElement('span');
        previous.className = 'chip-outgoing';
        previous.style.backgroundColor = previousHex;
        swatch.chip.append(previous);
        const wipe = previous.animate([{ clipPath: 'inset(0)' }, { clipPath: 'inset(0 0 0 100%)' }], {
          duration: 180,
          delay: swatch.index * 28,
          easing: 'cubic-bezier(.2, .75, .25, 1)',
          fill: 'both',
        });
        wipe.onfinish = () => previous.remove();
      }
    }
  };
}
