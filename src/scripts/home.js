const { variants: PALETTE, groups: GROUPS, roles: ROLES } = JSON.parse(document.getElementById("theme-data").textContent);

function lum(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

function paint(node, name) {
  const { appearance, colors, preview } = PALETTE[name];
  for (const [role, color] of Object.entries({ ...colors, ...preview })) node.style.setProperty("--" + role, color);
  node.style.colorScheme = appearance;
}

let toastTimer;
function toast(message) {
  const status = document.getElementById("toast");
  status.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { status.textContent = ""; }, 1800);
}

const swatchGroups = document.getElementById("groups");
function renderSwatches(name) {
  const { colors } = PALETTE[name];
  swatchGroups.replaceChildren(...GROUPS.flatMap(([group, roles]) => [
    el("h3", { textContent: group }),
    el("div", { className: "swatches" }, ...roles.map(role => {
      const hex = colors[role].toUpperCase();
      const ratio = contrast(hex, colors.bg).toFixed(1);
      const chip = el("span", { className: "chip" });
      chip.style.backgroundColor = hex;
      const button = el("button", { type: "button", className: "swatch", title: ROLES[role] },
        chip, el("span", { className: "meta" },
          el("span", { className: "role", textContent: role }),
          el("code", { className: "hex", textContent: hex }),
          el("span", { className: "ratio", textContent: ratio + ":1" })));
      button.setAttribute("aria-label", `Copy ${role} ${hex}, contrast ${ratio} to 1`);
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(hex);
          toast(`Copied ${hex}`);
        } catch {
          toast(`Copy this value: ${hex}`);
        }
      });
      return button;
    })),
  ]));
  paint(swatchGroups, name);
}

const themes = document.querySelectorAll("#themes button");

const palette = document.getElementById("palette");
let activeTheme = themes[0].dataset.theme;

function selectTheme(name) {
  activeTheme = name;
  paint(document.documentElement, name);
  document.documentElement.dataset.variant = name;
  for (const button of themes) button.setAttribute("aria-pressed", String(button.dataset.theme === name));
  if (palette.open) renderSwatches(name);
}

function applyThemeLink() {
  const name = location.hash.slice(1);
  if (Object.hasOwn(PALETTE, name)) selectTheme(name);
}

for (const button of themes) {
  button.addEventListener("click", () => {
    selectTheme(button.dataset.theme);
    history.replaceState(null, "", "#" + button.dataset.theme);
  });
}

palette.addEventListener("toggle", () => {
  if (palette.open) renderSwatches(activeTheme);
});
window.addEventListener("hashchange", applyThemeLink);
selectTheme(activeTheme);
applyThemeLink();

const samples = [...document.querySelectorAll(".sample")];
const languages = document.getElementById("languages");
const comparison = document.getElementById("comparison");
const compareToggle = document.getElementById("compare-toggle");
let activeSample = samples[0];

function renderComparison() {
  comparison.replaceChildren(...Object.entries(PALETTE).map(([name, variant]) => {
    const panel = el("article", { className: "mini" },
      el("div", { className: "pane-bar" },
        el("h3", { textContent: variant.name }),
        el("code", { textContent: variant.colors.bg })),
      activeSample.querySelector("pre").cloneNode(true));
    paint(panel, name);
    return panel;
  }));
}

for (const sample of samples) {
  sample.querySelector("pre").tabIndex = 0;
  const button = el("button", { type: "button", textContent: sample.dataset.language });
  button.setAttribute("aria-controls", sample.id);
  button.setAttribute("aria-pressed", String(sample === activeSample));
  languages.append(button);
  button.addEventListener("click", () => {
    activeSample = sample;
    for (const example of samples) example.hidden = example !== sample;
    for (const item of languages.children) item.setAttribute("aria-pressed", String(item === button));
    if (!comparison.hidden) renderComparison();
  });
}

compareToggle.hidden = false;
compareToggle.addEventListener("click", () => {
  comparison.hidden = !comparison.hidden;
  compareToggle.setAttribute("aria-expanded", String(!comparison.hidden));
  compareToggle.textContent = comparison.hidden ? "Compare variants" : "Hide comparison";
  if (!comparison.hidden) renderComparison();
});

const views = document.getElementById("views");
const viewButtons = [...views.querySelectorAll("button")];
const workflow = document.getElementById("workflow");
function selectView(view) {
  workflow.hidden = view === "editor";
  for (const button of viewButtons) {
    const selected = button.dataset.view === view;
    button.setAttribute("aria-pressed", String(selected));
    document.getElementById(button.getAttribute("aria-controls")).hidden = !selected;
  }
}
for (const button of viewButtons) {
  button.addEventListener("click", () => selectView(button.dataset.view));
}
views.hidden = false;
selectView("editor");

const query = document.getElementById("tool-query");
const toolGroups = document.querySelectorAll(".tool-group");
const noTools = document.getElementById("no-tools");
function filterTools() {
  const term = query.value.trim().toLowerCase();
  let found = false;
  for (const group of toolGroups) {
    const rows = [...group.querySelectorAll(".tool")];
    for (const row of rows) {
      row.hidden = !row.querySelector(".tool-name").textContent.toLowerCase().includes(term);
    }
    group.hidden = rows.every(row => row.hidden);
    found ||= !group.hidden;
  }
  noTools.hidden = found;
}
document.getElementById("tool-search").hidden = false;
query.addEventListener("input", filterTools);

for (const link of document.querySelectorAll(".conversation-bar a")) {
  link.addEventListener("click", () => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    query.value = "";
    filterTools();
    target.querySelector("details").open = true;
    target.querySelector("summary").focus({ preventScroll: true });
  });
}
