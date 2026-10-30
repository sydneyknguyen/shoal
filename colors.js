/* Shoal: stone colors each family picks for themselves. Done always means the light is off;
   urgent, in progress, and unassigned can each be any color, as long as no two match. */

// dark: the ongoing-task colorway. A deeper rim, but the core keeps the state's color so it still reads as lit.
const PALETTE = {
  honey: { name: "yellow", hi: "#fff5d6", mid: "#f6d27c", lo: "#d9a23a", glow: "rgba(246, 196, 92, 0.6)", dark: ["#ffe9a8", "#d9a23a", "#7a5a1c"] },
  orange: { name: "orange", hi: "#ffe9d6", mid: "#f9ad6b", lo: "#e07a2c", glow: "rgba(247, 150, 70, 0.55)", dark: ["#ffd0a6", "#e07a2c", "#7d3f12"] },
  red: { name: "red", hi: "#ffe1dc", mid: "#f28a7b", lo: "#cf4a37", glow: "rgba(236, 100, 84, 0.5)", dark: ["#ffc2b8", "#cf4a37", "#74251b"] },
  pink: { name: "pink", hi: "#ffe6f1", mid: "#f4a6c8", lo: "#d9669a", glow: "rgba(240, 140, 190, 0.5)", dark: ["#ffd0e4", "#d9669a", "#7a2f52"] },
  purple: { name: "purple", hi: "#efe8ff", mid: "#bba5f2", lo: "#8a6ad8", glow: "rgba(170, 140, 240, 0.5)", dark: ["#ddd0ff", "#8a6ad8", "#46317e"] },
  ice: { name: "ice blue", hi: "#ffffff", mid: "#d3e9fc", lo: "#98c4ec", glow: "rgba(140, 196, 246, 0.55)", dark: ["#e6f2ff", "#6fa3d6", "#33597f"] },
  green: { name: "green", hi: "#e9fbe6", mid: "#a6dd9a", lo: "#5fae55", glow: "rgba(120, 210, 110, 0.5)", dark: ["#d6f5cf", "#5fae55", "#2f5e2a"] },
  white: { name: "white", hi: "#ffffff", mid: "#eef1f5", lo: "#cfd5dd", glow: "rgba(255, 255, 255, 0.95)", dark: ["#ffffff", "#a9bdd6", "#41546e"] },
};
const COLOR_STATES = ["urgent", "progress", "open"];
const DEFAULT_COLORS = { urgent: "honey", progress: "ice", open: "white" };
const stoneColors = () => (S.colors ||= { ...DEFAULT_COLORS });

// One style block holds the family's colors, so every stone in the app, the kit and onboarding follows it.
let appliedColors = "";
function applyColors() {
  const c = stoneColors(), key = JSON.stringify(c);
  STATE.urgent[1] = PALETTE[c.urgent].name;
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
// Presets. Distances were checked by simulating each type of color blindness on these exact colors.
const PRESETS = [
  { id: "shoal", t: "Shoal", d: "The original colors", c: { urgent: "honey", progress: "ice", open: "white" } },
  { id: "clear", t: "Easy to tell apart", d: "Works for any color vision", rec: true, c: { urgent: "honey", progress: "purple", open: "white" } },
  { id: "rg", t: "Red-green safe", d: "Protanopia and deuteranopia", c: { urgent: "orange", progress: "purple", open: "white" } },
  { id: "by", t: "Blue-yellow safe", d: "Tritanopia", c: { urgent: "red", progress: "honey", open: "white" } },
];
// Pairs that can look alike. "all" means even with typical color vision.
const LOOK_ALIKE = [
  ["ice", "white", "all"], ["honey", "orange", "red-green"], ["red", "green", "red-green"],
  ["orange", "green", "red-green"], ["orange", "pink", "blue-yellow"], ["ice", "green", "blue-yellow"],
];
const cap = (n) => n[0].toUpperCase() + n.slice(1);
const presetOn = () => PRESETS.find((p) => COLOR_STATES.every((s) => p.c[s] === stoneColors()[s]));
function lookAlike() {
  const c = COLOR_STATES.map((s) => stoneColors()[s]);
  return LOOK_ALIKE.filter(([a, b]) => c.includes(a) && c.includes(b));
}
const colorSummary = () => COLOR_STATES.map((s) => `${STATE[s][0]} ${PALETTE[stoneColors()[s]].name}`).join(" · ");
const urgentHex = () => PALETTE[stoneColors().urgent].lo;

/* ---------- Picker ---------- */

// A small jar of stones. With a preset's colors, each stone carries them inline; without, it follows the family's.
// State and size of each stone, big ones at the bottom.
const SAMPLE_JAR = [["done", 3], ["done", 2], ["progress", 3], ["urgent", 2], ["open", 2], ["progress", 1], ["open", 1], ["urgent", 1], ["progress", 2]];
function sampleJar(c) {
  const pos = jarSlots(SAMPLE_JAR.map(([, w]) => ({ w })));
  const vars = (s) => { if (!c || s === "done") return ""; const p = PALETTE[c[s]]; return `;--hi:${p.hi};--mid:${p.mid};--lo:${p.lo};--glow:${p.glow}`; };
  return `<div class="rjar"><div class="glassbox"><img class="glass" src="${A("jar.png")}" alt="">
    ${SAMPLE_JAR.map(([s, w], i) => !pos[i] ? "" : gem(s, { size: "s", cls: `w${w} still ${s === "open" ? "nobody" : ""}`, style: `left:${pos[i].x}px;top:${pos[i].y}px${vars(s)}` })).join("")}</div></div>`;
}
// The family's jar, pinned at the top of the picker. It changes as soon as a color does.
const colorPreview = () => `<div class="cp-preview" aria-label="Preview of a jar in your colors">
    <div class="cp-jar">${sampleJar()}</div><span class="cp-now">${presetOn() ? `${presetOn().t} colors` : "Your own colors"}</span>
  </div>`;
// One stone per state, so each card shows what urgent, in progress and unassigned look like.
const threeStones = (c) => `<span class="pre-stones">${COLOR_STATES.map((s) => {
  const p = c && PALETTE[c[s]];
  return gem(s, { cls: s === "open" ? "nobody" : "", style: p ? `--hi:${p.hi};--mid:${p.mid};--lo:${p.lo};--glow:${p.glow}` : "" });
}).join("")}</span>`;
function presetRows() {
  const on = presetOn(), custom = !on;
  return `<p class="label cp-label">Presets</p>
    <div class="presets" role="radiogroup" aria-label="Color presets">${PRESETS.map((p) => `<button class="card preset ${on === p ? "on" : ""}" role="radio" aria-checked="${on === p}" data-act="pickPreset" data-id="${p.id}">
      ${on === p ? `<span class="pre-check">${check(true)}</span>` : ""}${threeStones(p.c)}
      <span class="t">${p.t}</span>${p.rec ? `<span class="rec">Recommended</span>` : ""}<span class="d">${p.d}</span></button>`).join("")}
      <button class="preset own ${custom ? "on" : ""}" role="radio" aria-checked="${custom}" data-act="customColors">
        ${custom ? `<span class="pre-check">${check(true)}</span>${threeStones()}` : `<span class="pre-plus" aria-hidden="true">+</span>`}
        <span class="txt"><span class="t">${custom ? "Your own colors" : "Make your own"}</span><span class="d">${custom ? "Tap to change them" : "Pick a color for each stone"}</span></span></button>
    </div>`;
}
// Make your own: one row per stone. Replaces the presets until you go back.
const customView = () => `<div class="cp-custom-head"><button class="linkish" data-act="presetView">‹ Presets</button><b>Make your own</b></div>
  <div class="card r20 cp-card">${colorRows()}</div>`;
const pickerBody = () => (S.colorCustom ? customView() : presetRows());
function colorRows() {
  const c = stoneColors(), warn = lookAlike();
  return `${COLOR_STATES.map((s) => `<div class="cp-row">
      <div class="cp-head">${gem(s, { size: "s" })}<span><b>${STATE[s][0]} · ${cap(PALETTE[c[s]].name)}</b><small>${STATE[s][2]}</small></span></div>
      <div class="swatches named" role="radiogroup" aria-label="${STATE[s][0]} color">${Object.entries(PALETTE).map(([k, p]) => `<button class="sw-cell ${c[s] === k ? "on" : ""}" role="radio" aria-checked="${c[s] === k}" aria-label="${p.name}" data-act="pickColor" data-id="${s}" data-color="${k}"><span class="swatch ${c[s] === k ? "on" : ""}" style="--sw:${p.mid};--swlo:${p.lo}"></span><span class="sw-name">${cap(p.name)}</span></button>`).join("")}</div>
    </div>`).join("")}
    <div class="cp-row"><div class="cp-head">${gem("done", { size: "s" })}<span><b>Done · Off</b><small>Always off, so it's clear the task is finished</small></span></div></div>
    ${warn.length ? `<div class="cp-warn" role="status">${warn.map(([a, b, who]) => `<b>${cap(PALETTE[a].name)}</b> and <b>${PALETTE[b].name}</b> can look alike${who === "all" ? ", even with typical color vision" : ` with ${who} color blindness`}.`).join(" ")} Try <button class="linkish" data-act="pickPreset" data-id="clear">Easy to tell apart</button>.</div>` : ""}
    <p class="small cp-marks">Urgent stones also show a !, so color is never the only sign that something needs doing.</p>`;
}
const colorsChanged = () => COLOR_STATES.some((s) => stoneColors()[s] !== DEFAULT_COLORS[s]);

// The jar stays put at the top; only the options under it scroll.
function colorSheet() {
  openSheet(`<h3>Stone colors</h3>
    ${colorPreview()}
    <div class="cp-scroll">${pickerBody()}
      <div class="actions">${colorsChanged() ? `<button class="btn-soft" data-act="resetColors">Reset colors</button>` : ""}<button class="btn-soft" data-act="closeSheet">Done</button></div>
    </div>`);
}

// Last onboarding step: the glow is explained once, in the family's own colors.
SCREENS.colors = () => `${topbar()}
  <div class="cp-top">
    ${eyebrow("Stones")}
    <h1 class="title">Pick your stone colors</h1>
    ${colorPreview()}
  </div>
  <div class="content cp-scroll">
    ${pickerBody()}
    <p class="small cp-later">Each stone glows to show where a task stands. You can change these anytime in Settings.</p>
  </div>
  ${footer("Confirm colors", { act: "confirmColors" })}`;

const sheetOpen = () => document.getElementById("sheet").classList.contains("open");

Object.assign(ACTIONS, {
  colorSheet: () => { S.colorCustom = false; colorSheet(); },
  pickColor: (d) => {
    const c = stoneColors();
    // Two states can't share a color, so the one already using it takes the old color instead.
    const other = COLOR_STATES.find((s) => s !== d.id && c[s] === d.color);
    if (other) c[other] = c[d.id];
    c[d.id] = d.color;
    render(); if (sheetOpen()) colorSheet();
  },
  pickPreset: (d) => { S.colors = { ...PRESETS.find((p) => p.id === d.id).c }; S.colorCustom = false; render(); if (sheetOpen()) colorSheet(); },
  // Says out loud that the choice is saved before onboarding moves on to Home.
  confirmColors: () => { const p = presetOn(); ACTIONS.next(); toast(`Stone colors saved${p ? `: ${p.t}` : ""}`); },
  customColors: () => { S.colorCustom = true; render(); if (sheetOpen()) colorSheet(); },
  presetView: () => { S.colorCustom = false; render(); if (sheetOpen()) colorSheet(); },
  resetColors: () => { S.colors = { ...DEFAULT_COLORS }; S.colorCustom = false; render(); if (sheetOpen()) colorSheet(); },
});
