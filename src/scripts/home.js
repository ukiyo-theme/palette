import { initializePalette } from './palette.js';
import { initializeWorkbench } from './workbench.js';

const variants = JSON.parse(document.getElementById('theme-data').textContent);
const updatePalette = initializePalette(variants);
const query = document.getElementById('tool-query');
const toolGroups = [...document.querySelectorAll('.tool-group')].map(group => [group, [...group.querySelectorAll('.tool')]]);
const downloadLinks = [...document.querySelectorAll('.download-links a[download]')];

function setVariant(name) {
  updatePalette(name);
  for (const link of downloadLinks) {
    link.toggleAttribute('data-matches-variant', link.textContent.split(' + ').includes(variants[name].name));
  }
}

function filterTools() {
  const term = query.value.trim().toLowerCase();
  let found = false;
  for (const [group, rows] of toolGroups) {
    for (const row of rows) row.hidden = !row.querySelector('.tool-name').textContent.toLowerCase().includes(term);
    group.hidden = rows.every(row => row.hidden);
    found ||= !group.hidden;
  }
  document.getElementById('no-tools').hidden = found;
}

function openInstall(id, focus = false) {
  if (!id.startsWith('install-')) return;
  const entry = document.getElementById(id);
  if (!entry) return;
  if (entry.hidden) {
    query.value = '';
    filterTools();
  }
  const details = entry.querySelector('details');
  if (details) details.open = true;
  if (focus) entry.querySelector('summary, a')?.focus({ preventScroll: true });
}

document.getElementById('tool-search').hidden = false;
query.addEventListener('input', filterTools);
document.getElementById('quick-install').addEventListener('click', event => {
  const link = event.target.closest('a');
  if (link) openInstall(link.hash.slice(1), true);
});
window.addEventListener('hashchange', () => openInstall(location.hash.slice(1)));
openInstall(location.hash.slice(1));

const selectVariant = initializeWorkbench(variants, setVariant);
const palettePicker = document.querySelector('.palette-variant-picker');
palettePicker.addEventListener('click', event => {
  const button = event.target.closest('[data-palette-variant]');
  if (button) selectVariant(button.dataset.paletteVariant);
});
palettePicker.hidden = false;
