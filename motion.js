/* Shoal: micro-interactions. The tab bar's blob flows from tab to tab, pages slide in the direction
   you moved, switches spring, and a task row swipes right to finish it. Screens redraw on every
   change, so each effect remembers where it came from and plays once on the new drawing.
   Loaded last; wraps tabbar, tabTo and render from main-app.js and app.js. */

const TAB_IDS = TABS.map(([id]) => id);
let lastTab = -1, justDone = null, flipped = null;

// The blob starts where the last tab was and stretches across to the new one, then settles.
const tabbarApp = tabbar;
tabbar = function () {
  const to = TAB_IDS.indexOf(S.screen), from = lastTab >= 0 ? lastTab : to;
  if (to >= 0) lastTab = to;
  const moved = to >= 0 && from !== to;
  return tabbarApp().replace(`<nav class="tabbar">`, `<nav class="tabbar ${moved ? "moved" : ""}">${to >= 0 ? `<i class="tab-blob ${moved ? "move" : ""}" style="--from:${from};--to:${to}" aria-hidden="true"></i>` : ""}`);
};

// Switching tabs slides the page toward the side you tapped, instead of a plain fade.
tabTo = function (screen) {
  ensureAppData();
  if (screen === S.screen) return;
  const a = TAB_IDS.indexOf(S.screen), b = TAB_IDS.indexOf(screen);
  S.history = [];
  S.app.blink = null;
  lastDir = a >= 0 && b >= 0 ? (b > a ? "tabR" : "tabL") : "fade";
  closeSheet();
  appEnter(screen);
  S.screen = screen;
  render();
};

// After each drawing: spring the switch that was just flipped, and pop the stone that was just finished.
const renderApp = render;
render = function () {
  renderApp();
  if (flipped) {
    const sw = document.querySelector(`.switch[data-act="${flipped.act}"][data-id="${flipped.id}"]`);
    sw?.classList.add(sw.classList.contains("on") ? "flip-on" : "flip-off");
    flipped = null;
  }
  if (justDone) {
    document.querySelector(`.tl-main[data-id="${justDone}"]`)?.closest(".tline")?.classList.add("just-done");
    justDone = null;
  }
};
document.addEventListener("click", (e) => {
  const sw = e.target.closest(".switch[data-act]");
  if (sw) flipped = { act: sw.dataset.act, id: sw.dataset.id };
}, true);

/* ---------- Swipe a task right to finish it ---------- */

let swipe = null, swallowClick = false;
document.addEventListener("pointerdown", (e) => {
  const main = e.target.closest('.tline:not(.is-done) > .tl-main[data-act="openTask"]');
  if (!main || e.button) return;
  swipe = { row: main.closest(".tline"), id: main.dataset.id, x: e.clientX, y: e.clientY, dx: 0, on: false };
});
document.addEventListener("pointermove", (e) => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (!swipe.on) {
    if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { swipe = null; return; }
    if (dx < 10) return;
    swipe.on = true;
    startSwipe(swipe);
  }
  // Past the threshold the row gets heavier, so it feels like it clicks into place.
  const w = swipe.row.offsetWidth, need = w * 0.38;
  swipe.dx = Math.max(0, dx < need ? dx : need + (dx - need) * 0.35);
  const p = Math.min(1, swipe.dx / need);
  swipe.row.style.transform = `translateX(${swipe.dx}px)`;
  swipe.under.style.setProperty("--p", p);
  swipe.under.classList.toggle("armed", p >= 1);
});
const endSwipe = () => {
  if (!swipe) return;
  const s = swipe; swipe = null;
  if (!s.on) return;
  swallowClick = true; setTimeout(() => { swallowClick = false; }, 50);
  if (s.under.classList.contains("armed")) finishSwipe(s);
  else {
    s.row.style.transition = "transform 0.5s cubic-bezier(.3, 1.45, .5, 1)";
    s.row.style.transform = "";
    setTimeout(() => { s.under.remove(); s.row.removeAttribute("style"); s.row.classList.remove("swiping"); }, 500);
  }
};
document.addEventListener("pointerup", endSwipe);
document.addEventListener("pointercancel", endSwipe);
window.addEventListener("click", (e) => { if (swallowClick) { e.stopPropagation(); e.preventDefault(); swallowClick = false; } }, true);

function startSwipe(s) {
  const row = s.row, box = row.parentElement;
  if (getComputedStyle(box).position === "static") box.style.position = "relative";
  s.under = document.createElement("div");
  s.under.className = "swipe-under";
  s.under.innerHTML = `<span><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Done</span>`;
  Object.assign(s.under.style, { top: `${row.offsetTop}px`, height: `${row.offsetHeight}px` });
  box.insertBefore(s.under, row);
  row.classList.add("swiping");
}

// The row slides off, the task is marked done in place, and its stone pops as it goes grey.
function finishSwipe(s) {
  const t = S.tasks.find((x) => x.id === s.id);
  s.row.style.transition = "transform 0.26s cubic-bezier(.5, 0, .75, 0)";
  s.row.style.transform = `translateX(${s.row.offsetWidth + 20}px)`;
  s.under.classList.add("go");
  setTimeout(() => {
    t.done = true;
    if (t.who && t.who !== "you") t.doneAt ||= "Today, just now";
    justDone = t.id;
    render();
    toast(`Done: ${t.n}`);
  }, 280);
}

NOTES.motion = ["Motion", ["The tab bar's blob stretches and flows to the tab you tap, and the page slides in from that side.",
  "Swipe any task row to the right to finish it. Past the line it clicks, then the row slides away and its stone goes grey.",
  "Switches spring, and widgets and buttons press down a little when you tap them."]];
