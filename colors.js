/* Shoal: stone colors each family picks for themselves. Done always means the light is off;
   urgent, in progress, and unassigned can each be any color, as long as no two match. */

const PALETTE = {
  honey: { name: "honey", hi: "#fff5d6", mid: "#f6d27c", lo: "#d9a23a", glow: "rgba(246, 196, 92, 0.6)", dark: ["#f6e6b8", "#b39a62", "#615a4c"] },
  orange: { name: "orange", hi: "#ffe9d6", mid: "#f9ad6b", lo: "#e07a2c", glow: "rgba(247, 150, 70, 0.55)", dark: ["#f7dcc4", "#b98458", "#66503f"] },
  red: { name: "red", hi: "#ffe1dc", mid: "#f28a7b", lo: "#cf4a37", glow: "rgba(236, 100, 84, 0.5)", dark: ["#f5d0ca", "#b4766d", "#694643"] },
  pink: { name: "pink", hi: "#ffe6f1", mid: "#f4a6c8", lo: "#d9669a", glow: "rgba(240, 140, 190, 0.5)", dark: ["#f4d6e3", "#b88aa0", "#664957"] },
  purple: { name: "purple", hi: "#efe8ff", mid: "#bba5f2", lo: "#8a6ad8", glow: "rgba(170, 140, 240, 0.5)", dark: ["#e2daf6", "#9a8ab8", "#57496e"] },
  ice: { name: "ice blue", hi: "#ffffff", mid: "#d3e9fc", lo: "#98c4ec", glow: "rgba(140, 196, 246, 0.55)", dark: ["#e4eef8", "#8fa5bb", "#56616e"] },
  green: { name: "green", hi: "#e9fbe6", mid: "#a6dd9a", lo: "#5fae55", glow: "rgba(120, 210, 110, 0.5)", dark: ["#d8eed3", "#8aa985", "#4c6249"] },
  white: { name: "white", hi: "#ffffff", mid: "#eef1f5", lo: "#cfd5dd", glow: "rgba(255, 255, 255, 0.95)", dark: ["#d4d8dd", "#959ba3", "#5f656e"] },
};
const COLOR_STATES = ["urgent", "progress", "open"];
const DEFAULT_COLORS = { urgent: "honey", progress: "ice", open: "white" };
const stoneColors = () => (S.colors ||= { ...DEFAULT_COLORS });

// One style block holds the family's colors, so every stone in the app, the kit and onboarding follows it.
let appliedColors = "";
function applyColors() {
  const c = stoneColors(), key = JSON.stringify(c);
  STATE.urgent[1] = `glowing ${PALETTE[c.urgent].name}`;
  STATE.progress[1] = PALETTE[c.progress].name;
  STATE.open[1] = PALETTE[c.open].name;
  if (key === appliedColors) return;
  appliedColors = key;
  let el = document.getElementById("stone-colors");
  if (!el) { el = document.createElement("style"); el.id = "stone-colors"; document.head.appendChild(el); }
  el.textContent = COLOR_STATES.map((s) => {
    const p = PALETTE[c[s]];
    return `.gem.${s} { --hi: ${p.hi}; --mid: ${p.mid}; --lo: ${p.lo}; --glow: ${p.glow}; }
.gem.dark.${s} { --hi: ${p.dark[0]}; --mid: ${p.dark[1]}; --lo: ${p.dark[2]}; }`;
  }).join("\n") + (() => {
    // The urgent card and urgent notifications carry the urgent stone's tint.
    const u = PALETTE[c.urgent];
    return `\n.attention, .notif.needs.urgent { border-color: ${u.glow}; background: color-mix(in srgb, ${u.hi} 45%, white); }`;
  })();
}
const baseRender = render;
render = function () { applyColors(); baseRender(); };
const colorSummary = () => COLOR_STATES.map((s) => `${STATE[s][0]} ${PALETTE[stoneColors()[s]].name}`).join(" · ");
const urgentHex = () => PALETTE[stoneColors().urgent].lo;

/* ---------- Picker ---------- */

function colorRows() {
  const c = stoneColors();
  return `${COLOR_STATES.map((s) => `<div class="cp-row">
      <div class="cp-head">${gem(s, { size: "s" })}<span><b>${STATE[s][0]}</b><small>${STATE[s][2]}</small></span></div>
      <div class="swatches" role="radiogroup" aria-label="${STATE[s][0]} color">${Object.entries(PALETTE).map(([k, p]) => `<button class="swatch ${c[s] === k ? "on" : ""}" role="radio" aria-checked="${c[s] === k}" aria-label="${p.name}" data-act="pickColor" data-id="${s}" data-color="${k}" style="--sw:${p.mid};--swlo:${p.lo}"></button>`).join("")}</div>
    </div>`).join("")}
    <div class="cp-row"><div class="cp-head">${gem("done", { size: "s" })}<span><b>Done</b><small>Always off, so it's clear the task is finished</small></span></div></div>`;
}
const colorsChanged = () => COLOR_STATES.some((s) => stoneColors()[s] !== DEFAULT_COLORS[s]);

function colorSheet() {
  const changed = colorsChanged();
  openSheet(`<h3>Stone colors</h3><p class="small">Pick colors that make sense to you and are easy to tell apart. Every stone and jar in the family switches together.</p>
    ${colorRows()}
    <div class="actions">${changed ? `<button class="btn-soft" data-act="resetColors">Reset colors</button>` : ""}<button class="btn-soft" data-act="closeSheet">Done</button></div>`);
}

// Last onboarding step: the glow is explained once, in the family's own colors.
SCREENS.colors = () => `${topbar()}
  <div class="content">
    ${eyebrow("Stones")}
    <h1 class="title">Pick your stone colors</h1>
    <p class="sub">Each stone glows to show where a task stands. Choose colors that mean something to your family.</p>
    <div class="card r20 cp-card">${colorRows()}</div>
    <p class="small" style="margin-top:12px">${colorsChanged() ? `<button class="linkish" data-act="resetColors">Reset colors</button> · ` : ""}You can change these anytime in Settings.</p>
  </div>
  ${footer("Go to Home")}`;

const sheetOpen = () => document.getElementById("sheet").classList.contains("open");

Object.assign(ACTIONS, {
  colorSheet,
  pickColor: (d) => {
    const c = stoneColors();
    // Two states can't share a color, so the one already using it takes the old color instead.
    const other = COLOR_STATES.find((s) => s !== d.id && c[s] === d.color);
    if (other) c[other] = c[d.id];
    c[d.id] = d.color;
    render(); if (sheetOpen()) colorSheet();
  },
  resetColors: () => { S.colors = { ...DEFAULT_COLORS }; render(); if (sheetOpen()) colorSheet(); },
});
