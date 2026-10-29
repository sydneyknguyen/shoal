/* Shoal: small celebrations. Sending thanks in Shoal is an event, not a toast: the screen softens,
   a glow rises from the button while it sends, then it blooms into a card of what that person got
   done, with the count ticking up. Finishing your own task gets the same count, for you.
   Loaded after motion.js; thanks.js calls celebrateThanks, and this wraps the done screen from main-app.js. */

const sparkle = (cls) => `<svg class="spark ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c1 7.6 4.4 11 12 12-7.6 1-11 4.4-12 12-1-7.6-4.4-11-12-12C7.6 11 11 7.6 12 0z"/></svg>`;

// Two branches of leaves curving up around a center, like a little award.
function laurel(size = 132) {
  const m = size / 2, r = size / 2 - 10;
  const leaves = [];
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const deg = 238 - i * 22, a = deg * Math.PI / 180;
    const x = m - side * Math.cos(a) * r, y = m - Math.sin(a) * r, rot = side * (deg - 180);
    leaves.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(0)})"><ellipse rx="4.2" ry="9" style="--d:${i * 50}ms"/></g>`);
  }
  return `<svg class="laurel" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${leaves.join("")}</svg>`;
}

const badge = (inner, n) => `<div class="cheer-badge">${laurel()}${sparkle("s1")}${sparkle("s2")}${sparkle("s3")}
  <div class="cheer-core">${inner}</div><b class="cheer-count" data-to="${n}">0</b></div>`;

// Ticks a number up from 0, slowing as it lands.
function countUp(el) {
  const to = +el.dataset.to, t0 = performance.now(), dur = 500 + Math.min(to, 12) * 60;
  el.dataset.to = "";
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Thanks sent ---------- */

function thanksCard(f, via) {
  const p = person(f.who), first = p.name.split(" ")[0];
  const did = S.tasks.filter((t) => t.done && t.who === f.who).map((t) => t.n);
  if (!did.includes(f.n)) did.unshift(f.n);
  const n = did.length;
  return `<div class="cheer-send"><span class="cheer-ring">${avatar(p, "lg")}</span><p>Sending to ${esc(first)}…</p></div>
  <div class="cheer-body">
    ${badge(avatar(p, "lg"), n)}
    <p class="eyebrow">Thanks sent</p>
    <h2 class="cheer-h">${esc(first)} did ${n === 1 ? "1 thing" : `${n} things`} this week</h2>
    <ul class="cheer-list">${did.slice(0, 3).map((x, i) => `<li style="--d:${520 + i * 70}ms">${gem("done", { size: "s" })}<span>${esc(x)}</span></li>`).join("")}</ul>
    ${n > 3 ? `<p class="small">and ${n - 3} more</p>` : ""}
    <p class="small">${via === "text" ? `${esc(first)} can open your card from the text` : `${esc(possessive(p))} jar glows softly`}${S.app.shareThanks ? ", and the family sees your thanks" : ""}.</p>
    <button class="btn-primary" data-act="cheerClose">Done</button>
  </div>`;
}

function showCheer(html) {
  document.querySelector(".cheer")?.remove();
  const el = document.createElement("div");
  el.className = "cheer sending";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Thanks sent");
  el.innerHTML = `<div class="cheer-glow" aria-hidden="true"><i></i><i></i><i></i></div>${html}`;
  document.getElementById("phone").appendChild(el);
  return el;
}

// Sending holds for a beat so it reads as going somewhere, then it lands. A text has already gone, so it skips the wait.
function celebrateThanks(f, via = "app") {
  if (f.task) S.app.thanked[f.task] = true;
  const el = showCheer(thanksCard(f, via));
  const quick = matchMedia("(prefers-reduced-motion: reduce)").matches, hold = quick || via !== "app" ? 0 : 1150;
  setTimeout(() => {
    back();
    el.classList.replace("sending", "sent");
    el.querySelector(".btn-primary").focus({ preventScroll: true });
    setTimeout(() => el.querySelectorAll(".cheer-count[data-to]").forEach(countUp), quick ? 0 : 380);
  }, hold);
}

Object.assign(ACTIONS, {
  cheerClose: () => {
    const el = document.querySelector(".cheer");
    if (!el) return;
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 260);
  },
});

/* ---------- Your own task done ---------- */

// The stone shows in its last color first, then dims to grey as the check lands. Once per task.
const dimmed = new Set();
const doneApp = SCREENS.done;
SCREENS.done = () => {
  const t = curTask(), n = mine("you").filter((x) => x.done).length;
  const was = !dimmed.has(t.id) && !matchMedia("(prefers-reduced-motion: reduce)").matches;
  dimmed.add(t.id);
  return doneApp().replace(`<div class="hero-gem">`, was ? `<div class="hero-gem dimming">${gemOf({ ...t, done: false }, { size: "xl", cls: "was" })}` : `<div class="hero-gem">`)
    .replace(`<p class="small center">Quiet celebrations for now</p>`,
    `<div class="cheer-mine" aria-label="${n} done this week">${sparkle("s1")}${sparkle("s2")}<b class="cheer-count" data-to="${n}">0</b><span>done this week.<br>That's a lot of care.</span></div>`)
    .replace(`<div class="content center-col">`, `<div class="content center-col cheer-done"><div class="cheer-bloom" aria-hidden="true"></div>`);
};

// Pairing: the moment the phone hears the stone, a ring ripples out and the white glow flares into its color.
let wasHeard = false, heardOn = null;
const renderCheer = render;
render = function () {
  renderCheer();
  const listening = S.app && (S.screen === "hold" || S.screen === "newStone");
  if (listening && S.app.heard && !(wasHeard && heardOn === S.screen)) {
    const card = document.querySelector("#screen .stage-card"), g = card?.querySelector(".gem");
    if (g) {
      card.classList.add("just-heard");
      const x = g.offsetLeft + g.offsetWidth / 2, y = g.offsetTop + g.offsetHeight / 2;
      card.insertAdjacentHTML("beforeend", [0, 1, 2].map((i) => `<i class="heard-ring" style="left:${x}px;top:${y}px;--d:${i * 180}ms" aria-hidden="true"></i>`).join(""));
    }
  }
  wasHeard = listening && S.app.heard; heardOn = listening ? S.screen : null;
  document.querySelectorAll("#screen .cheer-count[data-to]").forEach((el) => setTimeout(() => countUp(el), 450));
};
