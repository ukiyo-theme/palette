import { initializePalette } from './palette.js';
import { initializeSea } from './sea.js';
import { initializeWorkbench } from './workbench.js';

const variants = JSON.parse(document.getElementById('theme-data').textContent);
const names = Object.keys(variants);
const root = document.documentElement;
const themeColor = document.querySelector('meta[name="theme-color"]');
const updatePalette = initializePalette(variants);
const sea = initializeSea(document.querySelector('.sea'), variants);
const query = document.getElementById('tool-query');
const toolGroups = [...document.querySelectorAll('.tool-group')].map(group => [group, [...group.querySelectorAll('.tool')]]);
const downloadLinks = [...document.querySelectorAll('.download-links a[download]')];

function setVariant(name) {
  root.dataset.theme = name;
  themeColor.content = variants[name].colors.bg0;
  updatePalette(name);
  sea?.setVariant(name);
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

window.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest?.('input, select, textarea, [contenteditable]')) return;
  const index = Number(event.key) - 1;
  if (names[index]) selectVariant(names[index]);
  else if (event.key.toLowerCase() === 't') selectVariant(names[(names.indexOf(root.dataset.theme) + 1) % names.length]);
});
root.classList.add('theme-live');
