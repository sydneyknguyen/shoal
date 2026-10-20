/* Shoal main app: setup & first stone, the four tabs, task flows, stones, and celebrations.
   Shares state (S), helpers, sheets, and the render loop with app.js. */

const SETUP = ["ready", "jars", "pick", "hold", "paired", "find", "glow", "charge", "pairRest"];
const TABS = [["home", "Home"], ["myjar", "My jar"], ["peopleTab", "People"], ["settings", "Settings"]];
const APP_SCREENS = new Set([
  ...SETUP, ...TABS.map((t) => t[0]),
  "task", "handoff", "newTask", "newStone", "person", "kit", "stones", "stoneDetail",
  "done", "thanks", "clear", "recap", "notifications", "recapSettings",
]);
const KIT = 14;
const BATTERY = [82, 64, 91, 18, 77, 55, 100, 12, 69, 88, 73, 95, 60, 47];
const L = () => S.lovedOne || "Dad";

/* ---------- Demo family (used when onboarding was skipped or left empty) ---------- */

const DEMO_PEOPLE = [
  { id: "mom", name: "Mom", img: "avatar-mom.png", tier: "main", cap: 9, about: "Lives with " },
  { id: "bill", name: "Bill", img: "avatar-bill.png", tier: "main", cap: 6, about: "Free evenings · 10 min away" },
  { id: "sam", name: "Sam", img: "avatar-sam.png", tier: "main", cap: 3, remote: true, about: "Helps from Portland" },
  { id: "nora", name: "Nora", img: "avatar-nora.png", tier: "trusted", cap: 2, about: "Neighbor" },
];

function demoTasks() {
  const l = L();
  let n = 0;
  // when: a number = one-time, due that many days from today; an array = ongoing on those days
  const mk = (name, who, w, k, when, extra = {}) => ({
    id: `d${n++}`, n: name, w, k, y: false, cat: "", on: true, pebble: false,
    kind: Array.isArray(when) ? "repeat" : "once",
    days: Array.isArray(when) ? when : ["Sat"],
    date: Array.isArray(when) ? addDays(3) : addDays(when),
    time: "", who, done: false, steps: [], notes: "", remote: false, ...extra,
  });
  return [
    mk(`Refill ${l}'s prescription`, "you", 1, "meds", 1, {
      notes: "Ask for the 90-day supply. The old bottle is in the kitchen drawer.",
      steps: [
        { n: "Call the pharmacy", who: "you", done: true, when: "Mon" },
        { n: "Check insurance covers it", who: "bill", done: false },
        { n: "Pick up or get it delivered", who: null, done: false },
      ],
    }),
    mk("Ask hospice about a bed", "you", 1, "phone", 4),
    mk(`Sort ${l}'s mail`, "you", 1, "paper", ["Mon"]),
    mk("Fill the weekly pill box", "you", 1, "meds", ["Sun"]),
    mk("Book the eye exam", "you", 1, "phone", -2, { done: true }),
    mk("Call about the hospital bill", "you", 2, "phone", -4, { done: true }),
    mk("Return the walker", "you", 1, "drive", -5, { done: true }),
    mk("Cook dinners", "mom", 2, "cook", ["Mon", "Wed", "Fri"]),
    mk("Morning meds", "mom", 1, "meds", [...DAYS]),
    mk(`Keep ${l} company`, "mom", 2, "there", [...DAYS]),
    mk("Laundry and sheets", "mom", 2, "there", -1, { done: true }),
    mk(`Drive ${l} to Thursday's visit`, "bill", 2, "drive", 2, { why: "10 minutes away" }),
    mk("Pick up groceries", "bill", 2, "drive", ["Sat"], { why: "Free evenings" }),
    mk("Fix the stair rail", "bill", 2, "there", 5, { why: "Said he's handy" }),
    mk("Weekend visits", "bill", 2, "there", ["Sun"], { why: "Wants to be there" }),
    mk("Take out recycling", "bill", 1, "there", ["Tue"], { why: "Lives closest" }),
    mk(`Drive ${l} to his checkup`, "bill", 2, "drive", 0, { done: true, doneAt: "Today, 2:00 PM" }),
    mk("Order groceries online", "sam", 1, "phone", ["Fri"], { remote: true, why: "Can do it from anywhere" }),
    mk(`Video call with ${l}`, "sam", 1, "there", ["Wed", "Sun"], { remote: true, why: "Wants to be there" }),
    mk("Pay the utility bills", "sam", 1, "paper", -3, { done: true, remote: true }),
    mk("Bring in the mail", "nora", 1, "there", ["Mon", "Thu"]),
    mk("Be there for the nurse visit", null, 2, "there", 2),
    mk("Mow the lawn", null, 2, "there", ["Sat"]),
  ];
}

// Sets up everything the main app needs, from onboarding answers if there are any.
function ensureAppData() {
  if (S.app) return;
  const demo = !S.tasks.some((t) => t.on);
  if (demo) {
    if (!S.lovedOne) S.lovedOne = "Dad";
    DEMO_PEOPLE.forEach((p) => {
      if (!S.people.some((x) => x.name === p.name)) S.people.push({ ...p, note: "", invited: true, about: p.about === "Lives with " ? `Lives with ${L()}` : p.about });
    });
    S.tasks = demoTasks();
  }
  S.tasks.forEach((t) => {
    Object.assign(t, { done: t.done || false, steps: t.steps || [], notes: t.notes || "", remote: t.remote || false });
  });
  // Jars and the base are powered, so a stone charges anywhere but "out" (on a table, in a bag).
  S.stones = Array.from({ length: KIT }, (_, i) => ({ id: i + 1, task: null, battery: BATTERY[i], out: i === 3 }));
  // In the demo, the rest of the family has already paired a few of their own stones.
  if (demo) ["mom", "mom", "bill", "bill", "bill", "sam"].forEach((who) => {
    const t = S.tasks.find((x) => x.on && !x.done && x.who === who && !stoneOf(x));
    if (t) pairStone(t.id);
  });
  const helper = S.people.find((p) => p.tier === "main" && p.id !== "you");
  S.app = {
    day: iso(TODAY), jarTab: "all", stoneFilter: "all", showDone: false, morePair: false,
    first: null, heard: false, blink: null, task: null, person: null, stone: null, draft: null, stoneFor: null,
    handTo: undefined, note: "", thankFor: null, thankPick: 0, thanksNote: "", shareThanks: true, thanked: {}, dismissed: {}, seenNotes: false,
    requests: helper ? [{ id: "r1", from: helper.id, n: "Call the pharmacy", note: "They'll only talk to the main contact." }] : [],
    prefs: { little: true, weekly: true, names: true, quiet: false, quietFor: "week", publicCode: false, night: true, nightFrom: "22:00", nightTo: "07:00", glow: "on" },
    demo,
  };
}

/* ---------- Model helpers ---------- */

const active = () => S.tasks.filter((t) => t.on && !t.done);
const mine = (who = "you") => S.tasks.filter((t) => t.on && t.who === who);
const stoneOf = (t) => S.stones?.find((s) => s.task === t.id);
const taskOf = (s) => s.task && S.tasks.find((t) => t.id === s.task);
const isUrgent = (t) => t.kind === "once" && !t.done && t.date <= addDays(2);
function stateOf(t) {
  if (t.done) return "done";
  if (!t.who) return "open";
  return isUrgent(t) ? "urgent" : "progress";
}
const STATE = {
  urgent: ["Urgent", "glowing honey", "Due soon"],
  progress: ["In progress", "ice blue", "Someone is on it"],
  open: ["Unassigned", "white", "No one has it yet"],
  done: ["Done", "light off", "Light is off"],
};
const nameOf = (id) => (id ? person(id)?.name || "Someone" : "Unassigned");
const possessive = (p) => (p.id === "you" ? "your" : `${p.name}'s`);
function dueLabel(t) {
  if (t.kind === "repeat") return repeatLabel(t.days);
  const d = Math.round((fromIso(t.date) - TODAY) / 864e5);
  if (d === 0) return "due today";
  if (d === 1) return "due tomorrow";
  if (d < 0) return fmtDate(t.date);
  return `due ${fmtDate(t.date)}`;
}
function pairStone(taskId) {
  const s = S.stones.find((x) => !x.task);
  if (s) s.task = taskId;
  return s;
}
// Only stones away from a jar or the base can run down.
const notCharging = () => S.stones.filter((s) => s.out);
const lowBattery = () => notCharging().filter((s) => s.battery < 30);
const inJar = (s) => { const t = taskOf(s); return t && t.who && person(t.who).tier === "main"; };
const outLabel = (s) => (s.task ? "out of its jar" : "off the base");
const placeOf = (s) => (s.out ? `${outLabel(s)[0].toUpperCase()}${outLabel(s).slice(1)} · not charging` : inJar(s) ? `In ${possessive(person(taskOf(s).who))} jar · charging` : "On the base · charging");
const battLabel = (s) => (s.out ? `${s.battery}%` : `⚡ ${s.battery}%`);
const WHY = { drive: "Lives nearby", phone: "Good on the phone", cook: "Likes to cook", meds: "Knows the meds", paper: "Good with paperwork", there: "Wants to be there" };
const whyOf = (t, p) => t.why || (p.remote || t.remote ? "Can do it from anywhere" : WHY[t.k] || "Had free time then");

/* ---------- Pieces ---------- */

const gem = (state, { dark = false, size = "", cls = "", style = "" } = {}) =>
  `<span class="gem ${state} ${dark ? "dark" : ""} ${size} ${cls}" ${style ? `style="${style}"` : ""} aria-hidden="true"></span>`;
const gemOf = (t, opts = {}) => gem(stateOf(t), { dark: t.kind === "repeat", ...opts });
const toggle = (on, act, id = "", label = "") => `<button class="switch ${on ? "on" : ""}" role="switch" aria-checked="${on}" ${label ? `aria-label="${label}"` : ""} data-act="${act}" data-id="${id}"><i></i></button>`;
const chev = `<img class="chev" src="${A("chevron.svg")}" alt="">`;

const ICONS = {
  home: `<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>`,
  myjar: `<path d="M8.5 3h7M7.5 6h9M7.5 6C6.3 7 5.5 8.3 5.5 10v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9c0-1.7-.8-3-2-4"/><path d="M8.5 15.5h7"/>`,
  peopleTab: `<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.6-3 2.8-5 5.5-5s4.9 2 5.5 5"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.8 14.3c2.5-.1 4.3 1.7 4.8 4.4"/>`,
  settings: `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  bell: `<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>`,
  kit: `<rect x="3" y="17.5" width="18" height="3.5" rx="1.75"/><path d="M5.5 17.5V10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7.5M12.5 17.5V10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v7.5M7 5.5h3M14 5.5h3"/>`,
  glow: `<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2h5c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>`,
};
const icon = (k) => `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;

function tabbar() {
  const tab = S.screen === "person" || S.screen === "stones" ? "" : S.screen;
  return `<nav class="tabbar">${TABS.map(([id, l]) => `<button class="${tab === id ? "on" : ""}" ${tab === id ? 'aria-current="page"' : ""} data-act="tab" data-to="${id}">${icon(id)}<span>${l}</span></button>`).join("")}</nav>`;
}
function navtop(label, right = "") {
  return `<div class="navtop"><button class="navback" data-act="back"><img src="${A("back.svg")}" alt="">${esc(label)}</button>${right}</div>`;
}
function setupTop(n) {
  return `<div class="topbar">
    <button class="back" data-act="back" aria-label="Back"><img src="${A("back.svg")}" alt=""></button>
    <div class="progress">${Array.from({ length: 8 }, (_, k) => `<span class="${k < n ? "on" : ""}"></span>`).join("")}</div>
    <button class="skip" data-act="tab" data-to="home">Skip</button>
  </div>`;
}
const solo = (label, act, sec, attrs = "") => `<div class="footer">
  <button class="btn-primary" data-act="${act}" ${attrs}>${label}</button>
  ${sec ? `<button class="btn-text" data-act="${sec[1]}" ${sec[2] || ""}>${sec[0]}</button>` : `<span style="height:20px"></span>`}
</div>`;
const duo = (left, right) => `<div class="footer duo">
  <button class="btn-ghost" data-act="${left[1]}" ${left[2] || ""}>${left[0]}</button>
  <button class="btn-primary" data-act="${right[1]}" ${right[2] || ""}>${right[0]}</button>
</div>`;

const jarSlots = (n) => Array.from({ length: n }, (_, i) => {
  const row = Math.floor(i / 3), col = i % 3;
  return { x: 6 + col * 23 + (row % 2 ? 4 : 0), y: 86 - row * 13 };
});
// Jars on a shelf. Done stones sit at the bottom, glowing ones on top.
// Each stone drops in once; later re-renders (like picking a day) leave it still.
const dropped = new Set();
function familyJars({ empty = false, only = null, act = true } = {}) {
  const ppl = S.people.filter((p) => p.tier === "main" && (!only || p.id === only));
  const glow = S.app?.prefs?.glow || "on";
  const html = `<div class="shelf-jars glow-${glow}">${ppl.map((p) => {
    const ts = empty ? [] : mine(p.id).sort((a, b) => b.done - a.done).slice(0, 18);
    const pos = jarSlots(ts.length);
    const tag = act ? "button" : "div";
    return `<${tag} class="rjar" ${act ? `data-act="openPerson" data-id="${p.id}"` : ""}>
      <div class="glassbox"><img class="glass" src="${A("jar.png")}" alt=""><div class="plate"></div>
        ${ts.map((t, i) => gemOf(t, { size: "s", cls: `${S.app?.blink === t.id ? "blink" : ""} ${dropped.has(`${p.id}:${t.id}`) ? "still" : ""}`, style: `left:${pos[i].x}px;top:${pos[i].y}px` })).join("")}
      </div><span class="who">${esc(p.name)}</span></${tag}>`;
  }).join("")}</div>`;
  ppl.forEach((p) => { if (!empty) mine(p.id).forEach((t) => dropped.add(`${p.id}:${t.id}`)); });
  return html;
}
const GLOW = { on: "Glow on", dim: "Dimmed", off: "Glow off" };
const unread = () => !S.app.seenNotes && notifications().length > 0;
const legend = () => `<div class="legend">${Object.keys(STATE).map((s) => `<span>${gem(s, { size: "xs" })}${STATE[s][0]}</span>`).join("")}</div>`;

// One task line: gem, name, meta, optional trailing bit.
function taskLine(t, { meta, trail = "", act = "openTask", showWho = true } = {}) {
  const p = t.who && person(t.who);
  const m = meta ?? `${showWho && p ? `${avatar(p, "s20")} ${esc(p.name)} · ` : showWho && !p ? "Unassigned · " : ""}${dueLabel(t)}${t.time ? ` · ${fmtTime(t.time)}` : ""}${t.remote ? " · remote" : ""}`;
  return `<div class="tline ${t.done ? "is-done" : ""}">
    <button class="tl-main" data-act="${act}" data-id="${t.id}">${gemOf(t)}<span class="sr-only">${STATE[stateOf(t)][0]}:</span>
      <span class="tl-txt"><span class="n">${esc(t.n)}</span><span class="m">${m}</span></span></button>${trail}
  </div>`;
}

/* ---------- Setup & first stone ---------- */

function firstTask() {
  if (!S.app.first) {
    const yours = active().filter((t) => t.who === "you");
    const pick = yours.find(isUrgent) || yours[0] || active()[0];
    S.app.first = pick?.id || null;
  }
  return S.tasks.find((t) => t.id === S.app.first);
}

SCREENS.ready = () => {
  const helpers = S.people.filter((p) => p.tier === "main").length;
  const steps = [["Set up the jars", "One per person, about a minute"], ["Pair your first stone", "Tap it to one of your tasks"], ["Try it out", "Find a stone and see the glow"]];
  return `${setupTop(0)}
  <div class="content">
    <p class="eyebrow">Setup · about 5 minutes</p>
    <h1 class="title">Your plan is ready</h1>
    <p class="sub">${active().length} tasks, shared by ${helpers} of you. Next, set up the jars and pair your first stone.</p>
    <div class="card shelf">${familyJars({ act: false })}</div>
    <div class="card steps-list">${steps.map(([t, d], i) => `<div class="step"><span class="num">${i + 1}</span><span><b>${t}</b><small>${d}</small></span></div>`).join("")}</div>
  </div>
  ${solo("Start setup", "setupNext", ["Do it later", "tab", 'data-to="home"'])}`;
};

SCREENS.jars = () => {
  const main = S.people.filter((p) => p.tier === "main");
  const others = S.people.filter((p) => p.tier !== "main");
  const steps = [["Plug in the base", "It powers the jars and charges spare stones"], ["Snap on one jar per person", "Use only as many as you need"], ["Write a name on each lid", listNames(main)]];
  return `${setupTop(1)}
  <div class="content">
    <p class="eyebrow">Step 1 of 8</p>
    <h1 class="title">Set up the jars</h1>
    <p class="sub">One jar for each person who takes on tasks.${others.length ? ` ${esc(listNames(others))} can follow along without one.` : ""}</p>
    <div class="card shelf">${familyJars({ empty: true, act: false })}</div>
    <div class="card steps-list">${steps.map(([t, d], i) => `<div class="step"><span class="num">${i + 1}</span><span><b>${t}</b><small>${esc(d)}</small></span></div>`).join("")}</div>
  </div>
  ${solo("The jars are on", "setupNext")}`;
};

SCREENS.pick = () => `${setupTop(2)}
  <div class="content">
    <p class="eyebrow">Step 2 of 8 · First stone</p>
    <h1 class="title">Pick up a stone</h1>
    <p class="sub">Lift any stone from the round end of the base. It glows white when it's ready to pair.</p>
    <div class="card stage-card tall">${gem("open", { size: "xl", cls: "breathe" })}<p class="cap">White glow · ready to pair</p></div>
  </div>
  ${solo("I've got one", "setupNext")}`;

SCREENS.hold = () => {
  const t = firstTask();
  return `${setupTop(3)}
  <div class="content">
    <p class="eyebrow">Step 3 of 8 · First stone</p>
    <h1 class="title">Hold it to your phone</h1>
    <p class="sub">Touch the stone to the back of your phone. This is the only screen that listens for stones, so nothing pairs by accident.</p>
    <div class="card stage-card">
      ${gem(S.app.heard ? stateOf(t) : "open", { size: "l", dark: S.app.heard && t.kind === "repeat", cls: S.app.heard ? "" : "breathe" })}
      <span class="status-pill">${S.app.heard ? `✓ Stone ${String((stoneOf(t) || S.stones.find((x) => !x.task))?.id || 1).padStart(2, "0")} found` : "<i></i> Listening for a stone…"}</span>
    </div>
    ${t ? `<div class="card pair-to"><p class="eyebrow grey">Pairing it to</p>${taskLine(t, { act: "noop" })}</div>` : ""}
  </div>
  ${solo("It's paired", "setupNext", ["Stone not lighting up?", "toast", 'data-msg="Set it in a jar or on the base for 10 minutes, then try again"'], S.app.heard ? "" : "disabled")}`;
};

SCREENS.paired = () => {
  const t = firstTask();
  const st = stateOf(t);
  return `${setupTop(4)}
  <div class="content">
    <p class="eyebrow">Step 4 of 8 · First stone</p>
    <h1 class="title">Paired. Now drop it in your jar.</h1>
    <p class="sub">Your stone now glows ${STATE[st][1]} because ${st === "urgent" ? "the task is urgent. Once it's underway, it turns ice blue." : st === "progress" ? "someone is on it. It turns honey when it's due soon." : "no one has it yet."}</p>
    <div class="card stage-card tall"><span class="okdot"><img src="${A("check.svg")}" alt=""></span>${gemOf(t, { size: "xl", cls: "breathe" })}
      <span class="badge ${st === "urgent" ? "amber" : ""}">${STATE[st][0]} · ${STATE[st][1]}</span>
      <p class="cap">${esc(t.n)} · ${esc(nameOf(t.who))}</p>
    </div>
  </div>
  ${solo("It's in my jar", "setupNext")}`;
};

SCREENS.find = () => {
  const t = firstTask();
  const blinking = S.app.blink === t.id;
  return `${setupTop(5)}
  <div class="content">
    <p class="eyebrow">Step 5 of 8 · Try it</p>
    <h1 class="title">Find a stone</h1>
    <p class="sub">Tap Find stone on any task. Its stone blinks so you can spot it in the jar.</p>
    <div class="card stage-card">${familyJars({ only: "you", act: false })}<span class="badge amber ${blinking ? "" : "ghost"}">Blinking</span></div>
    <div class="card pair-to">${taskLine(t, { act: "noop" })}<button class="btn-wide" data-act="findStone" data-id="${t.id}">Find stone</button></div>
    ${blinking ? `<p class="label">Did it blink?</p>` : ""}
  </div>
  ${blinking ? duo(["Not yet", "toast", 'data-msg="Lift the lid and look again. It blinks for 30 seconds."'], ["Yes, I see it", "setupNext"]) : solo("Find stone", "findStone", null, `data-id="${t.id}"`)}`;
};

SCREENS.glow = () => `${setupTop(6)}
  <div class="content">
    <p class="eyebrow">Step 6 of 8 · Try it</p>
    <h1 class="title">What the glow means</h1>
    <p class="sub">Every stone tells you where its task stands, right from the jar.</p>
    <div class="glow-grid">${Object.entries(STATE).map(([s, [n, , d]]) => `<div class="card glow-tile">${gem(s, { size: "m" })}<b class="st-${s}">${n}</b><small>${d}</small></div>`).join("")}</div>
    <div class="card kinds">
      <div>${gem("open", { size: "s" })}<span><b>Light stone</b><small>One-time task</small></span></div>
      <div>${gem("open", { size: "s", dark: true })}<span><b>Dark stone</b><small>Ongoing task</small></span></div>
      <p class="small">Both kinds glow the same colors.</p>
    </div>
  </div>
  ${solo("Next", "setupNext")}`;

SCREENS.charge = () => `${setupTop(7)}
  <div class="content">
    <p class="eyebrow">Step 7 of 8 · Try it</p>
    <h1 class="title">Stones charge in the jar</h1>
    <p class="sub">The jars sit on the base, so every stone charges while it's in a jar. Spare stones charge on the round end. You never have to move a stone just to charge it.</p>
    <div class="card stage-card">
      <div class="base"><i></i><i></i><i></i><b>${gem("open", { size: "s" })}</b></div>
      <div class="base-caps"><small class="blue">Jars charge here</small><small class="blue">Spares charge here</small></div>
      <div class="fade-row"><span>${gem("done", { size: "m", cls: "faded" })}<small>Left out, it fades</small></span><span class="arrow">→</span><span>${gem("open", { size: "m" })}<small>Back in a jar</small></span></div>
    </div>
    <p class="small center">If a stone stays out, like on a table, we'll let you know before it runs low.</p>
  </div>
  ${solo("Got it", "setupNext")}`;

SCREENS.pairRest = () => {
  const paired = S.stones.filter((s) => s.task).length;
  const list = active().filter((t) => t.who).sort((a, b) => (a.who === "you" ? -1 : 0) - (b.who === "you" ? -1 : 0));
  const shown = S.app.morePair ? list : list.slice(0, 5);
  return `${setupTop(8)}
  <div class="content">
    <p class="eyebrow">Step 8 of 8 · Almost done</p>
    <h1 class="title">Pair the rest</h1>
    <p class="sub">Pair them now, or anyone can pair their own stones later.</p>
    <div class="card meter"><div class="meter-top"><b>${paired} of ${KIT} paired</b><span class="small">${KIT - paired} to go</span></div><div class="bar"><i style="width:${(paired / KIT) * 100}%"></i></div></div>
    <div class="card tlist">${shown.map((t) => taskLine(t, {
      act: "noop",
      trail: stoneOf(t) ? `<span class="paired-tag">✓ Paired</span>` : `<button class="pill-btn" data-act="pairTask" data-id="${t.id}">Pair</button>`,
    })).join("")}
    ${list.length > 5 ? `<button class="more" data-act="morePair">${S.app.morePair ? "Show fewer" : `+ ${list.length - 5} more tasks`}${chev}</button>` : ""}</div>
  </div>
  ${solo("Go to Home", "tab", ["Do this later", "tab", 'data-to="home"'], 'data-to="home"')}`;
};

/* ---------- Home ---------- */

// How much the family has on each day this week. Tap a bar to see that day's tasks.
function loadChart(week) {
  const days = DAYS.map((d, i) => {
    const date = fromIso(shift(week, i)), id = iso(date);
    const list = active().filter((t) => occurs(t, date));
    return { d, date, id, n: list.length, urgent: list.some((t) => isUrgent(t) && t.date === id) };
  });
  const max = Math.max(1, ...days.map((x) => x.n));
  const heavy = days.reduce((a, b) => (b.n > a.n ? b : a));
  return `<div class="load-chart">${days.map((x) => `<button class="lc-day ${x.id === S.app.day ? "on" : ""} ${x.id === iso(TODAY) ? "today" : ""} ${heavy.n && x.n === heavy.n ? "heavy" : ""}" data-act="homeDay" data-id="${x.id}"
      aria-pressed="${x.id === S.app.day}" aria-label="${DAY_FULL[dayKey(x.date)]} ${x.date.getDate()}, ${x.n} task${x.n === 1 ? "" : "s"}${x.urgent ? ", one is urgent" : ""}">
      <span class="lc-col">${x.urgent ? gem("urgent", { size: "xs" }) : ""}<span class="lc-bar" style="height:${Math.max(8, Math.round((x.n / max) * 84))}px"></span></span>
      <small>${x.d[0]}</small><b>${x.date.getDate()}</b></button>`).join("")}</div>
    <p class="lc-cap">${heavy.n ? `${DAY_FULL[dayKey(heavy.date)]} is the heavy day · ${heavy.n} tasks` : "A light week"}</p>`;
}

SCREENS.home = () => {
  const urgent = active().filter(isUrgent).sort((a, b) => a.date.localeCompare(b.date));
  const finished = S.tasks.find((t) => t.done && t.doneAt && t.who !== "you" && !S.app.thanked[t.id] && !S.app.dismissed[t.id]);
  const week = mondayOf(iso(TODAY));
  const day = fromIso(S.app.day);
  const today = active().filter((t) => occurs(t, day)).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  return `<div class="content app">
    <div class="apphead">${shoalMark(30)}<span class="head-btns">
      <button class="bell" data-act="go" data-to="kit" aria-label="Home kit">${icon("kit")}${notCharging().length ? `<i class="dot warn"></i>` : ""}</button>
      <button class="bell" data-act="go" data-to="notifications" aria-label="Notifications">${icon("bell")}${unread() ? `<i class="dot"></i>` : ""}</button></span></div>
    <p class="eyebrow grey">${TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
    <h1 class="title">Good morning</h1>
    ${urgent.length ? `<button class="card attention" data-act="openTask" data-id="${urgent[0].id}">${gemOf(urgent[0], { size: "m" })}
        <span class="tl-txt"><span class="n">${esc(urgent[0].n)}</span><span class="m"><b class="st-urgent">Urgent</b> · ${dueLabel(urgent[0])} · ${esc(nameOf(urgent[0].who))}</span></span>
        ${urgent.length > 1 ? `<span class="count">+${urgent.length - 1}</span>` : chev}
      </button>` : ""}
    ${finished ? `<div class="finished">${avatar(person(finished.who), "s20")}<span class="fin-txt"><b>${esc(person(finished.who).name)}</b> finished “${esc(finished.n)}”</span>
      <button class="linkish" data-act="sayThanks" data-id="${finished.id}">Thank</button><button class="x-btn" data-act="dismissThanks" data-id="${finished.id}" aria-label="Dismiss"><span aria-hidden="true">×</span></button></div>` : ""}
    <div class="card shelf">${familyJars()}</div>
    <div class="card week">
      ${loadChart(week)}
      <div class="tlist flat">${today.length ? today.map((t) => taskLine(t)).join("") : `<p class="small empty">Nothing on ${DAY_FULL[dayKey(day)]}.</p>`}</div>
    </div>
  </div>
  ${tabbar()}`;
};

/* ---------- My jar ---------- */

// Completion ring: done (blue), urgent (honey), still to do (grey), one gap between each.
function ring(segs, { size = 220, stroke = 12 } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, total = segs.reduce((n, x) => n + x.v, 0) || 1;
  const gap = segs.filter((x) => x.v).length > 1 ? 6 : 0;
  let at = 0;
  return `<svg class="ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(110,115,124,0.13)" stroke-width="${stroke}"/>
    ${segs.filter((x) => x.v).map((x) => {
      const len = Math.max(0, (x.v / total) * c - gap);
      const el = `<circle class="ring-seg" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${x.color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${len} ${c}" stroke-dashoffset="${-at}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`;
      at += (x.v / total) * c;
      return el;
    }).join("")}
  </svg>`;
}

const jarOrder = (t) => (isUrgent(t) ? 0 : t.kind === "once" ? 1 : 2);
function jarMeta(t) {
  if (isUrgent(t)) return `<span class="st-urgent">${dueLabel(t)[0].toUpperCase()}${dueLabel(t).slice(1)}</span>`;
  return t.kind === "once" ? fmtDate(t.date) : repeatLabel(t.days);
}

SCREENS.myjar = () => {
  const all = mine("you");
  const live = all.filter((t) => !t.done);
  const done = all.filter((t) => t.done);
  const urgent = live.filter(isUrgent);
  // "Today" counts what happens today plus anything urgent that needs attention now.
  const today = live.filter((t) => occurs(t, TODAY) || isUrgent(t)).length;
  const fam = S.tasks.filter((t) => t.on && t.who);
  const famDone = fam.filter((t) => t.done).length;
  const tab = S.app.jarTab;
  const shown = live.filter((t) => tab === "all" || t.kind === tab).sort((a, b) => jarOrder(a) - jarOrder(b) || (a.date || "").localeCompare(b.date || ""));
  const count = (k) => live.filter((t) => k === "all" || t.kind === k).length;
  return `<div class="content app">
    <div class="apphead"><h1 class="title">Your jar</h1><button class="round-btn" data-act="newTask" aria-label="Add a task"><img src="${A("plus.svg")}" alt=""></button></div>
    <div class="ring-hero" role="img" aria-label="${done.length} of ${all.length} of your tasks done, ${urgent.length} urgent, ${today} for today">
      ${ring([{ v: done.length, color: "#418ef3" }, { v: urgent.length, color: "#e2ad47" }, { v: live.length - urgent.length, color: "transparent" }])}
      <div class="ring-mid">${today ? `<b>${today}</b><span>${today === 1 ? "thing" : "things"} for you today</span>` : `<b class="none">✓</b><span>Nothing for you today</span>`}</div>
    </div>
    <p class="ring-cap">${done.length} of ${all.length} yours done · ${famDone} of ${fam.length} together</p>
    <div class="ring-key"><span><i style="background:#418ef3"></i>Done</span><span><i style="background:#e2ad47"></i>Urgent</span><span><i></i>To do</span></div>
    <div class="card jar-list">
      <div class="utabs" role="tablist">${[["all", "All"], ["once", "One-time"], ["repeat", "Ongoing"]].map(([id, l]) => `<button role="tab" class="${tab === id ? "on" : ""}" aria-selected="${tab === id}" data-act="jarTab" data-id="${id}">${l}<small>${count(id)}</small></button>`).join("")}</div>
      ${tab !== "repeat" ? S.app.requests.map((r) => `<div class="jl-req"><span class="tl-txt"><span class="eyebrow">Request from ${esc(nameOf(r.from))}</span><span class="n">${esc(r.n)}</span></span><button class="linkish" data-act="review" data-id="${r.id}">Review</button></div>`).join("") : ""}
      ${shown.map((t) => taskLine(t, { meta: jarMeta(t), trail: `<button class="tick" data-act="markDone" data-id="${t.id}" aria-label="Mark ${esc(t.n)} done">${check(false)}</button>` })).join("")}
      ${!shown.length ? `<p class="small empty">Nothing here. Tap + to add a task.</p>` : ""}
    </div>
    ${done.length ? `<button class="collapsed" data-act="showDone" aria-expanded="${!!S.app.showDone}">Done · ${done.length}<img src="${A("chevron.svg")}" alt="" style="transform:rotate(${S.app.showDone ? 90 : 0}deg)"></button>
      ${S.app.showDone ? `<div class="card tlist">${done.map((t) => taskLine(t, { showWho: false, meta: "Done" })).join("")}</div>` : ""}` : ""}
  </div>
  ${tabbar()}`;
};

/* ---------- Task detail ---------- */

const curTask = () => S.tasks.find((t) => t.id === S.app.task);

SCREENS.task = () => {
  const t = curTask();
  const p = t.who && person(t.who);
  const s = stoneOf(t);
  const st = stateOf(t);
  const stepsDone = t.steps.filter((x) => x.done).length;
  return `${navtop("Back", `<button class="more-btn" data-act="taskMenu" aria-label="More">•••</button>`)}
  <div class="content">
    <div class="badges"><span class="badge plain">${t.kind === "once" ? "One-time" : "Ongoing"}</span>
      <button class="badge ${st === "urgent" ? "amber" : ""}" data-act="editTaskDate">${st === "urgent" ? gem("urgent", { size: "xs" }) : ""}${t.kind === "once" ? `Due ${fmtDate(t.date)}` : repeatLabel(t.days)}${t.time ? ` · ${fmtTime(t.time)}` : ""}</button>
      ${t.remote ? `<span class="badge plain">Remote OK</span>` : ""}</div>
    <h1 class="title">${esc(t.n)}</h1>
    <div class="card owner">${p ? avatar(p) : `<img class="none" src="${A("none.svg")}" alt="">`}
      <span class="tl-txt"><span class="n">${p ? esc(p.name) : "Unassigned"}</span><span class="m">${t.done ? "Done · stone resting" : `Stone glows ${STATE[st][1]}`}</span></span>
      ${gemOf(t, { size: "s" })}
      ${s && !t.done ? `<button class="pill-btn" data-act="findStone" data-id="${t.id}">Find</button>` : ""}
    </div>
    ${t.steps.length ? `<div class="card stepsc">
      <div class="meter-top"><b>Steps</b><span class="small">${stepsDone} of ${t.steps.length}</span></div>
      <div class="bar"><i style="width:${(stepsDone / t.steps.length) * 100}%"></i></div>
      ${t.steps.map((x, i) => `<div class="stp">
        <button data-act="toggleStep" data-id="${i}" aria-label="Toggle step">${check(x.done)}</button>
        <span class="tl-txt"><span class="n">${esc(x.n)}</span><span class="m">${x.who ? `${esc(nameOf(x.who))}${x.done ? ` · ${x.when || "Today"}` : " is on it"}` : "Open"}</span></span>
        ${x.who && x.who !== "you" ? avatar(person(x.who) || { name: "?" }, "s20") : !x.who ? `<button class="linkish" data-act="takeStep" data-id="${i}">Take step</button>` : ""}
      </div>`).join("")}
    </div>` : ""}
    ${t.notes ? `<div class="card notes-card"><p class="eyebrow grey">Notes</p><p>${esc(t.notes)}</p><span class="small">Added by you</span></div>` : ""}
  </div>
  ${t.done ? solo("Mark not done", "undoDone", null, `data-id="${t.id}"`) : duo(["Hand off", "handoff"], ["Mark done", "markDone", `data-id="${t.id}"`])}`;
};

SCREENS.handoff = () => {
  const t = curTask();
  const options = S.people.filter((p) => p.id !== t.who);
  const to = S.app.handTo;
  const target = to ? person(to) : null;
  return `${navtop("Back")}
  <div class="content">
    <h1 class="title">Hand it off</h1>
    <p class="sub">Whoever you pick gets a request, and the task moves to their jar.</p>
    <div class="card pair-to">${taskLine(t, { act: "noop" })}</div>
    <div class="card tlist pick-list">
      ${options.map((p) => {
        const ok = canTake(p, t);
        const n = mine(p.id).filter((x) => !x.done).length;
        return `<button class="radio-row" data-act="handTo" data-id="${p.id}" ${ok ? "" : "disabled"}>${avatar(p, "s36")}
          <span class="tl-txt"><span class="n">${esc(p.name)}</span><span class="m">${ok ? `${n} task${n === 1 ? "" : "s"}${p.remote ? " · remote" : ""}${p.tier === "trusted" ? " · gets a text" : ""}` : p.tier === "kid" ? "Kid-friendly tasks only" : "Light tasks only"}</span></span>
          ${check(to === p.id)}</button>`;
      }).join("")}
      ${t.who ? `<button class="radio-row" data-act="handTo" data-id="">${gem("open", { size: "s" })}<span class="tl-txt"><span class="n">Unassigned</span><span class="m">Glows white for whoever is free</span></span>${check(to === null)}</button>` : ""}
    </div>
    <p class="label">Note <span class="small">optional</span></p>
    <textarea class="note-input" data-input="handoffNote" placeholder="Anything they should know?">${esc(S.app.note)}</textarea>
    ${target ? `<p class="small" style="text-align:center">We'll ${target.tier === "main" ? "send it to the app" : "text"} ${esc(target.name)}.</p>` : ""}
  </div>
  ${solo(to === undefined ? "Pick someone" : target ? `Send request to ${esc(target.name)}` : "Leave it unassigned", "sendHandoff", null, to === undefined ? "disabled" : "")}`;
};

/* ---------- Add a task ---------- */

const draft = () => S.tasks.find((t) => t.id === S.app.draft);

SCREENS.newTask = () => {
  const t = draft();
  const helpers = S.people;
  return `${navtop("Cancel")}
  <div class="content">
    <h1 class="title">New task</h1>
    <label class="card field"><span class="eyebrow grey">What needs doing</span><input data-input="draftName" value="${esc(t.n)}" placeholder="Pick up shower chair" ${t.n ? "" : "autofocus"}></label>
    <div class="seg big">${[["once", "One-time"], ["repeat", "Ongoing"]].map(([k, l]) => `<button class="${t.kind === k ? "on" : ""}" aria-pressed="${t.kind === k}" data-act="draftKind" data-id="${k}">${l}</button>`).join("")}</div>
    <button class="card field-row" data-act="editDraftDate"><span>${t.kind === "once" ? "Due date" : "Repeats"} <em>Required</em></span><b>${t.kind === "once" ? fmtDate(t.date) : repeatLabel(t.days)}${t.time ? ` · ${fmtTime(t.time)}` : ""}</b>${chev}</button>
    <p class="section-h">Who takes it</p>
    <div class="card who-card"><div class="pickers wrap">
      ${helpers.map((p) => `<button class="pick ${t.who === p.id ? "on" : ""}" data-act="draftWho" data-who="${p.id}" ${canTake(p, t) ? "" : "disabled style=\"opacity:.35\""}>
        <span class="ringwrap">${avatar(p, "s36")}<img class="ring" src="${A("selected-ring.svg")}" alt=""></span>${esc(p.name)}</button>`).join("")}
      <button class="pick ${!t.who ? "on" : ""}" data-act="draftWho" data-who=""><span class="ringwrap"><img class="none" src="${A("none.svg")}" alt=""><img class="ring" src="${A("selected-ring.svg")}" alt=""></span>Open</button>
    </div></div>
    <div class="card toggle-row"><span class="tl-txt"><span class="n">Remote OK</span><span class="m">Can be done from anywhere</span></span>${toggle(t.remote, "draftRemote", "", "Remote OK")}</div>
    <p class="section-h">Notes</p>
    <textarea class="note-input" data-input="draftNote" placeholder="Add a note (optional)">${esc(t.notes)}</textarea>
  </div>
  ${solo("Save task", "saveTask", null, t.n.trim() ? "" : "disabled")}`;
};

SCREENS.newStone = () => {
  const t = S.tasks.find((x) => x.id === S.app.stoneFor);
  return `${navtop("Back")}
  <div class="content">
    <h1 class="title">Link a real stone</h1>
    <p class="sub">Optional. The task already has a stone in the app. Link a real one and it lights up in the jar at home too.</p>
    <div class="card stage-card tall">
      ${gem(S.app.heard ? stateOf(t) : "open", { size: "l", dark: t.kind === "repeat", cls: S.app.heard ? "" : "breathe" })}
      <p class="n" style="margin:4px 0 0">${S.app.heard ? `Stone ${String(S.stones.find((s) => !s.task)?.id || 0).padStart(2, "0")} found` : "Hold a charged stone to your phone"}</p>
      <span class="small">${S.app.heard ? `It will glow ${STATE[stateOf(t)][1]}` : "Looking for a stone…"}</span>
    </div>
    <div class="card pair-to">${taskLine(t, { act: "noop" })}</div>
  </div>
  ${duo(["Not now", "back"], ["Link it", "saveStone", S.app.heard ? "" : "disabled"])}`;
};

/* ---------- People ---------- */

SCREENS.peopleTab = () => {
  const main = S.people.filter((p) => p.tier === "main");
  const circle = S.people.filter((p) => p.tier !== "main");
  const all = S.tasks.filter((t) => t.on);
  const done = all.filter((t) => t.done).length;
  const open = active().filter((t) => !t.who).length;
  return `<div class="content app">
    <div class="apphead"><h1 class="title">People</h1><button class="btn-ghost sm" data-act="toast" data-msg="Invite link copied">+ Invite</button></div>
    <button class="sub linkline" data-act="go" data-to="recap">October · ${done} of ${all.length} tasks done together ›</button>
    <div class="card shelf">
      <div class="shelf-top"><span class="eyebrow grey">Family jars</span>${open ? `<span class="small">${open} unassigned</span>` : ""}</div>
      ${familyJars()}
    </div>
    <div class="card tlist">${main.map((p) => {
      const ts = mine(p.id), d = ts.filter((t) => t.done).length;
      return `<button class="prow" data-act="openPerson" data-id="${p.id}">${avatar(p, "s36")}
        <span class="tl-txt"><span class="n">${esc(p.name)}</span><span class="m">${p.remote ? "Remote · " : ""}${d} of ${ts.length} done</span></span>
        <span class="mini-bar"><i style="width:${ts.length ? (d / ts.length) * 100 : 0}%"></i></span>${chev}</button>`;
    }).join("")}</div>
    <p class="section-h">Extended circle</p>
    <div class="card tlist">
      <button class="prow" data-act="toast" data-msg="Trusted circle gets light tasks and a text when one opens up">
        <span class="circle-ico">${icon("peopleTab")}</span>
        <span class="tl-txt"><span class="n">Trusted circle</span><span class="m"><span class="stack">${circle.slice(0, 4).map((p) => avatar(p, "s20")).join("")}</span>${circle.length ? `${esc(circle[0].name)}${circle.length > 1 ? ` + ${circle.length - 1} other${circle.length > 2 ? "s" : ""}` : ""} · ` : "No one yet · "}${((n) => `${n} task${n === 1 ? "" : "s"}`)(circle.reduce((n, p) => n + mine(p.id).length, 0))}</span></span>
        <span class="badge">On</span>${chev}</button>
      ${S.conditions.includes("hospice") || S.app.demo ? `<button class="prow" data-act="toast" data-msg="The hospice nurse sees care tasks only"><span class="avatar s36">A</span><span class="tl-txt"><span class="n">Hospice nurse</span><span class="m">Ana · sees care tasks only</span></span>${chev}</button>` : ""}
      <div class="prow"><span class="circle-ico"><img src="${A("lock.svg")}" alt=""></span><span class="tl-txt"><span class="n">Public code</span><span class="m">Remote tasks for volunteers</span></span>${toggle(S.app.prefs.publicCode, "pref", "publicCode", "Public code")}</div>
    </div>
  </div>
  ${tabbar()}`;
};

SCREENS.person = () => {
  const p = person(S.app.person);
  const ts = mine(p.id).filter((t) => !t.done);
  return `${navtop("People")}
  <div class="content">
    <div class="phead">${avatar(p, "lg")}<h1 class="title">${esc(p.name)}</h1></div>
    <p class="sub">${ts.length} task${ts.length === 1 ? "" : "s"}${p.about ? ` · ${esc(p.about)}` : p.tier === "trusted" ? " · Trusted circle, light tasks" : p.tier === "kid" ? " · Kid-friendly tasks" : ""}</p>
    <p class="section-h">Their tasks, and why</p>
    <div class="card tlist">${ts.length ? ts.map((t) => taskLine(t, {
      meta: `${avatar(p, "s20")} ${esc(p.name)} · ${dueLabel(t)}</span><span class="why">Why: ${esc(whyOf(t, p))}`,
    })).join("") : `<p class="small empty">Nothing on ${esc(p.name)}'s plate right now.</p>`}</div>
    <div class="card info"><img src="${A("lock.svg")}" alt=""><span><b class="small-b">What Pebble used</b><span class="small">Everyone's answers and ${esc(L())}'s goals. Not notes or medical records.</span></span></div>
  </div>
  ${ts.length ? `<div class="footer"><button class="btn-ghost wide" data-act="moveTask">Move a task</button><span style="height:20px"></span></div>` : ""}`;
};

/* ---------- Settings & stones ---------- */

SCREENS.settings = () => {
  const paired = S.stones.filter((s) => s.task).length;
  const row = (t, d, act, extra = "", attrs = "") => `<button class="srow" data-act="${act}" ${attrs}><span class="tl-txt"><span class="n">${t}</span><span class="m">${d}</span></span>${extra}${chev}</button>`;
  return `<div class="content app">
    <div class="apphead"><h1 class="title">Settings</h1></div>
    <p class="section-h">Family</p>
    <div class="card tlist">${row("Family setup", "Redo with Pebble or by hand", "redoSetup")}</div>
    <p class="section-h">Together</p>
    <div class="card tlist">${row("Thank-yous &amp; recaps", "Weekly recap on Sundays", "go", "", 'data-to="recapSettings"')}${row("Notifications", "Urgent, requests, and thank-yous", "go", "", 'data-to="notifications"')}</div>
    <p class="section-h">Pebble</p>
    <div class="card tlist">${row("What Pebble can see", "Answers and goals. Never notes.", "pebbleSees")}</div>
    <button class="btn-text center" data-act="restart">Restart prototype</button>
  </div>
  ${tabbar()}`;
};

// The physical side: jars, base, stones and glow, one tap from Home.
SCREENS.kit = () => {
  const P = S.app.prefs, g = P.glow || "on";
  const main = S.people.filter((p) => p.tier === "main");
  const out = notCharging();
  const spares = S.stones.filter((s) => !s.out && !inJar(s));
  const jarRow = (p) => {
    const st = mine(p.id);
    return `<div class="srow kit-row">${avatar(p, "s36")}<span class="tl-txt"><span class="n">${p.id === "you" ? "Your jar" : `${esc(p.name)}'s jar`}</span><span class="m">${st.length} stone${st.length === 1 ? "" : "s"}</span></span><span class="charge">⚡ Charging</span></div>`;
  };
  return `${navtop("Home")}
  <div class="content">
    <h1 class="title">Home kit</h1>
    <div class="card kit-hero">${familyJars({ act: false })}
      <div class="base-line"></div>
      <span class="badge ${out.length ? "amber" : ""}">${out.length ? `${out.length} stone off power` : "Base connected · everything charging"}</span>
    </div>
    ${out.map((st) => `<button class="card kit-alert" data-act="openStone" data-id="${st.id}">${gem(taskOf(st) ? stateOf(taskOf(st)) : "open", { size: "s", cls: "faded" })}
      <span class="tl-txt"><span class="n">Stone ${String(st.id).padStart(2, "0")} is ${outLabel(st)}</span><span class="m">${st.battery}% and not charging. Put it back in a jar or on the base.</span></span><span class="pill-btn">Find</span></button>`).join("")}
    <p class="section-h">Glow</p>
    <div class="card kit-glow">
      <div class="seg big">${[["on", "On"], ["dim", "Dim"], ["off", "Off"]].map(([k, l]) => `<button class="${g === k ? "on" : ""}" aria-pressed="${g === k}" data-act="setGlow" data-id="${k}">${l}</button>`).join("")}</div>
      <div class="srow"><span class="tl-txt"><span class="n">Night hours</span><span class="m">${P.night ? `Off ${fmtTime(P.nightFrom)} – ${fmtTime(P.nightTo)}` : "Glows all night"}</span></span>${toggle(P.night, "pref", "night", "Night hours")}</div>
      ${P.night ? `<button class="srow" data-act="nightSheet"><span class="tl-txt"><span class="n">Change hours</span></span>${chev}</button>` : ""}
      ${legend()}
    </div>
    <p class="section-h">Jars and base</p>
    <div class="card tlist">${main.map(jarRow).join("")}
      <div class="srow kit-row"><span class="kit-ic">${icon("kit")}</span><span class="tl-txt"><span class="n">Base</span><span class="m">Connected · ${spares.length} spare stone${spares.length === 1 ? "" : "s"}</span></span><span class="charge">⚡ Charging</span></div>
    </div>
    <p class="section-h">Stones</p>
    <div class="card tlist">
      <button class="srow" data-act="go" data-to="stones"><span class="tl-txt"><span class="n">All stones</span><span class="m">${KIT} stones · ${S.stones.filter((s) => s.task).length} paired · battery and location</span></span>${chev}</button>
      <button class="srow" data-act="pairSheet"><span class="tl-txt"><span class="n">Pair a stone</span><span class="m">Link a spare stone to a task</span></span>${chev}</button>
      <button class="srow" data-act="tab" data-to="ready"><span class="tl-txt"><span class="n">Setup guide</span><span class="m">Jars, pairing and charging, step by step</span></span>${chev}</button>
    </div>
  </div>`;
};

SCREENS.stones = () => {
  const f = S.app.stoneFilter;
  const paired = S.stones.filter((s) => s.task);
  const keep = (s) => (f === "unpaired" ? !s.task : f === "out" ? s.out : true);
  const groups = [];
  const out = S.stones.filter((s) => s.out && keep(s));
  if (out.length) groups.push(["Not charging", out]);
  S.people.filter((p) => p.tier === "main").forEach((p) => {
    const list = S.stones.filter((s) => !s.out && inJar(s) && taskOf(s).who === p.id && keep(s));
    if (list.length) groups.push([p.id === "you" ? "In your jar" : `In ${p.name}'s jar`, list]);
  });
  const base = S.stones.filter((s) => !s.out && !inJar(s) && keep(s));
  if (base.length) groups.push(["On the base", base]);
  const card = (s) => {
    const t = taskOf(s);
    return `<button class="card stone-card" data-act="openStone" data-id="${s.id}">${t ? gemOf(t, { size: "m" }) : gem("open", { size: "m", cls: "dim" })}
      <b>Stone ${String(s.id).padStart(2, "0")}</b><small>${t ? esc(t.n) : "Not paired"}</small><span class="batt ${s.out ? "low" : ""}">${battLabel(s)}</span></button>`;
  };
  return `${navtop("Home kit", `<button class="btn-soft sm" data-act="pairSheet">Pair a stone</button>`)}
  <div class="content">
    <h1 class="title">Stones</h1>
    <p class="sub">${KIT} stones · ${paired.length} paired. Stones charge in the jars and on the base.</p>
    <div class="chips">${[["all", "All"], ["unpaired", `Unpaired ${KIT - paired.length}`], ["out", `Not charging ${notCharging().length}`]].map(([id, l]) => chip(l, f === id, "stoneFilter", id)).join("")}</div>
    ${groups.map(([h, list]) => `<p class="section-h">${h}</p><div class="stone-grid">${list.map(card).join("")}</div>`).join("") || `<p class="small empty">No stones here.</p>`}
  </div>`;
};

SCREENS.stoneDetail = () => {
  const s = S.stones.find((x) => x.id === S.app.stone);
  const t = taskOf(s);
  const st = t ? stateOf(t) : "open";
  const where = placeOf(s);
  return `${navtop("Stones", `<button class="btn-soft sm" data-act="toast" data-msg="Renaming is coming soon">Rename</button>`)}
  <div class="content">
    <div class="card stage-card tall ${S.app.blink === `s${s.id}` ? "blinking" : ""}">${t ? gemOf(t, { size: "xl", cls: "breathe" }) : gem("open", { size: "xl", cls: "dim" })}</div>
    <h1 class="title center">Stone ${String(s.id).padStart(2, "0")}</h1>
    <p class="small center">${where} · last seen 2 min ago</p>
    <div class="badges center">${t ? `<span class="badge ${st === "urgent" ? "amber" : ""}">${st === "done" ? "Resting" : `Glowing · ${STATE[st][0].toLowerCase()}`}</span>` : `<span class="badge plain">Spare</span>`}
      <span class="badge plain ${s.out ? "low" : ""}">${s.out ? `▮ ${s.battery}% · about ${Math.max(1, Math.round(s.battery / 25))} day${s.battery < 38 ? "" : "s"} left` : `⚡ ${s.battery}% · charging`}</span></div>
    ${s.out ? `<div class="card info">${gem("done", { size: "xs" })}<span class="small">Put it back in a jar or on the base and it charges on its own.</span></div>` : ""}
    <button class="btn-ghost wide" data-act="blinkStone" data-id="${s.id}">Make it blink to find it</button>
    <p class="section-h">Paired to</p>
    ${t ? `<div class="card pair-to">${taskLine(t, { trail: chev })}</div>` : `<button class="card give-stone" data-act="pairSheet"><span class="plus-box"><img src="${A("plus.svg")}" alt=""></span><span class="tl-txt"><span class="n">Pair it to a task</span><span class="m">It glows as soon as it's paired</span></span>${chev}</button>`}
    <p class="section-h">About</p>
    <div class="card about">
      <div><span>Model</span><b>Shoal Stone</b></div>
      <div><span>Generation</span><b>Gen 1 · 2026</b></div>
      <div><span>Colorway</span><b>${(t ? t.kind === "once" : s.id % 3) ? "Light · for one-time tasks" : "Dark · for ongoing tasks"}</b></div>
    </div>
    ${t ? `<button class="btn-text danger center" data-act="unpair" data-id="${s.id}">Unpair this stone</button>` : ""}
  </div>`;
};

/* ---------- Celebrations ---------- */

SCREENS.done = () => {
  const t = curTask();
  const helper = t.steps.find((x) => x.done && x.who && x.who !== "you") || t.steps.find((x) => x.who && x.who !== "you");
  return `<div class="topbar"></div>
  <div class="content center-col">
    <div class="hero-gem"><span class="okdot"><img src="${A("check.svg")}" alt=""></span>${gemOf(t, { size: "xl" })}</div>
    <p class="eyebrow">${stoneOf(t) ? "Your stone rests now" : "Off your plate"}</p>
    <h1 class="title">Done. Thank you.</h1>
    <p class="sub">${esc(t.n)} is taken care of.${stoneOf(t) ? " Your stone has dimmed and can rest in your jar." : ""}</p>
    ${helper ? `<p class="eyebrow grey">Also on this task</p>
      <div class="card finished">${avatar(person(helper.who), "s36")}<span class="tl-txt"><span class="n">${esc(nameOf(helper.who))}: ${esc(helper.n.toLowerCase())}</span><span class="m">A step on this task</span></span><button class="pill-btn" data-act="sayThanksStep" data-id="${helper.who}" data-n="${esc(helper.n)}">Say thanks</button></div>` : ""}
  </div>
  <p class="small center">Quiet celebrations for now</p>
  ${solo("Back to your jar", "afterDone")}`;
};

SCREENS.thanks = () => {
  const { who, n, when } = S.app.thankFor;
  const p = person(who);
  const opts = ["Thank you!", `${L()} was so happy`, "Couldn't do it without you"];
  return `${navtop("")}
  <div class="content center-col">
    ${avatar(p, "lg")}
    <p class="eyebrow grey">${esc(p.name)} finished something</p>
    <h1 class="title">${esc(n)}</h1>
    <p class="small">${esc(when)} · their stone is off</p>
    <p class="section-h left">Say thanks</p>
    <div class="card tlist left">${opts.map((o, i) => `<button class="radio-row" data-act="thankPick" data-id="${i}"><span class="tl-txt"><span class="n">${esc(o)}</span></span>${check(S.app.thankPick === i)}</button>`).join("")}</div>
    <div class="card tlist left">
      <label class="srow"><img src="${A("plus.svg")}" alt=""><input class="bare" data-input="thanksNote" value="${esc(S.app.thanksNote)}" placeholder="Add a short note (optional)"></label>
      <div class="srow"><span class="tl-txt"><span class="n">Share with the family</span></span>${toggle(S.app.shareThanks, "shareThanks", "", "Share with the family")}</div>
    </div>
  </div>
  <p class="small center">${esc(p.name)}'s jar gives a soft glow. No reply needed.</p>
  ${solo("Send thanks", "sendThanks")}`;
};

SCREENS.clear = () => `${navtop("")}
  <div class="content center-col">
    <div class="clear-jar">${familyJars({ only: "you", act: false })}</div>
    <p class="eyebrow grey">Every stone is resting</p>
    <h1 class="title">Your jar is clear</h1>
    <p class="sub">Everything you took on this week is done. Nothing is waiting on you right now. Take a breath.</p>
    <div class="card info left">${gem("done", { size: "s" })}<span class="small">At home, your jar glows once, slowly, then rests until something new comes in.</span></div>
  </div>
  ${duo(["Offer a hand", "offerHand"], ["Back home", "tab", 'data-to="home"'])}`;

SCREENS.recap = () => {
  const done = S.tasks.filter((t) => t.on && t.done).length + 12;
  const open = active().length;
  const helpers = S.people.filter((p) => p.id !== "you" && (p.remote || p.tier !== "main"));
  const wins = [
    ["urgent", "Every urgent task got covered", "before it was late"],
    ["progress", "Tasks moved easily", "when someone got busy, others stepped in"],
    ["open", helpers.length ? `${listNames(helpers.slice(0, 2))} helped from afar` : "Small things added up", helpers.length ? "5 times this week" : "a few minutes at a time"],
  ];
  return `${navtop("")}
  <div class="content">
    <p class="eyebrow">Oct 12–18 · Sunday recap</p>
    <h1 class="title">Your week together</h1>
    <div class="card shelf">${familyJars({ act: false })}
      <div class="recap-meter"><b>${done} things done together</b><div class="bar"><i style="width:${(done / (done + open)) * 100}%"></i></div><span class="small">${open} still open, and ${active().filter((t) => !t.who).length ? "a few need someone" : "all have someone"}</span></div>
    </div>
    <p class="section-h">What went well</p>
    <div class="card tlist">${wins.map(([s, a, b]) => `<div class="tline">${gem(s, { size: "s" })}<span class="tl-txt"><span class="n">${esc(a)}</span><span class="m">${esc(b)}</span></span></div>`).join("")}</div>
    <p class="small center">However this week felt, you all showed up for ${esc(L())}.</p>
  </div>
  ${solo("Send thanks to everyone", "thankAll")}`;
};

// Each kind of notification gets its own badge, so a glance tells you what it is.
const NOTIF = {
  urgent: ["Urgent", `<path d="M12 7v6M12 16.5v.5"/>`],
  request: ["Handoff request", `<path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5"/>`],
  done: ["Finished", `<path d="m6 12.5 4 4 8-9"/>`],
  thanks: ["Thank-you", `<path d="M12 19s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 2.3C19 14.7 12 19 12 19z"/>`],
};
const nfBadge = (k) => `<span class="nf-badge nb-${k}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${NOTIF[k][1]}</svg></span>`;

// Things that need you first, then updates.
function notifications() {
  const others = S.people.filter((p) => p.id !== "you");
  const list = [];
  S.app.requests.forEach((r) => list.push({ kind: "request", needs: true, cta: "Review", when: "Today", who: person(r.from), n: `${nameOf(r.from)} asked you to take “${r.n}”`, m: r.note, act: "review", id: r.id }));
  active().filter(isUrgent).slice(0, 2).forEach((t) => list.push({ kind: "urgent", needs: t.who === "you" || !t.who, cta: "Open", when: "Now", gem: gemOf(t, { size: "s" }), n: `${t.n} is ${dueLabel(t)}`, m: t.who ? `${t.who === "you" ? "You have" : `${nameOf(t.who)} has`} it` : "No one has it yet", act: "openTask", id: t.id }));
  S.tasks.filter((t) => t.done && t.doneAt && t.who !== "you").forEach((t) => list.push({ kind: "done", when: t.doneAt.split(",")[0], who: person(t.who), n: `${nameOf(t.who)} finished “${t.n}”`, m: S.app.thanked[t.id] ? "You said thanks" : "Tap to say thanks", act: S.app.thanked[t.id] ? "openTask" : "sayThanks", id: t.id }));
  if (others[1] || others[0]) list.push({ kind: "thanks", when: "Today", who: others[1] || others[0], n: `${(others[1] || others[0]).name} thanked you`, m: "“Thanks for covering the pharmacy call. I owe you one.”" });
  if (others[0]) list.push({ kind: "thanks", when: "Yesterday", who: others[0], n: `${others[0].name} sent you a heart`, m: "For picking up groceries" });
  return list;
}

SCREENS.notifications = () => {
  const list = notifications();
  const row = (x) => `<button class="notif ${x.kind} ${x.needs ? "needs" : ""}" ${x.act ? `data-act="${x.act}" data-id="${x.id || ""}"` : "disabled"}>
      <span class="nf-icon">${x.who ? avatar(x.who, "s36") : `<span class="nf-tile">${x.gem}</span>`}${nfBadge(x.kind)}</span>
      <span class="tl-txt"><span class="nf-kind">${NOTIF[x.kind][0]} · ${x.when}</span><span class="n">${esc(x.n)}</span><span class="m">${esc(x.m)}</span></span>
      ${x.needs && x.cta ? `<span class="pill-btn">${x.cta}</span>` : ""}</button>`;
  const needs = list.filter((x) => x.needs), rest = list.filter((x) => !x.needs);
  return `${navtop("Home")}
  <div class="content">
    <h1 class="title">Notifications</h1>
    ${needs.length ? `<p class="section-h">Needs you</p><div class="notif-needs">${needs.map(row).join("")}</div>` : ""}
    ${rest.length ? `<p class="section-h">Updates</p><div class="card tlist notif-list">${rest.map(row).join("")}</div>` : ""}
    ${!list.length ? `<div class="card empty-card"><p class="small">Nothing new.</p></div>` : ""}
    <p class="small center">Choose what you get in Settings.</p>
  </div>`;
};

SCREENS.recapSettings = () => {
  const P = S.app.prefs;
  const row = (k, t, d) => `<div class="srow"><span class="tl-txt"><span class="n">${t}</span><span class="m">${d}</span></span>${toggle(P[k], "pref", k, t)}</div>`;
  return `${navtop("Settings")}
  <div class="content">
    <h1 class="title">Thank-yous and recaps</h1>
    <div class="card tlist" style="margin-top:18px">${row("little", "Little thank-yous", "When you or family finish a task")}${row("weekly", "Weekly recap", "Sunday evening")}${row("names", "Name who helped", "Highlights can mention people")}</div>
    <div class="card tlist">${row("quiet", "Quiet for now", "Pause all of these for a while")}
      ${P.quiet ? `<div class="chips quiet">${[["day", "A day"], ["week", "A week"], ["on", "Until I turn it on"]].map(([id, l]) => chip(l, P.quietFor === id, "quietFor", id)).join("")}</div>` : ""}</div>
    <div class="card info">${gem("done", { size: "xs" })}<span class="small">No streaks, no rankings. Recaps only show what went well together.</span></div>
  </div>`;
};

/* ---------- Notes panel ---------- */

Object.assign(NOTES, {
  ready: ["Setup: plan is ready", ["Bridges onboarding to the physical kit: jars, base, stones.", "If onboarding was skipped, a demo family fills in so every screen has something to show."]],
  jars: ["Set up the jars", ["One jar per main caregiver. Trusted circle and kids follow along in the app, no jar."]],
  pick: ["Pick up a stone", ["White glow = ready to pair."]],
  hold: ["Hold it to your phone", ["Only this screen listens for stones, so nothing pairs by accident. Pairing is simulated after ~2 seconds."]],
  paired: ["Paired", ["Pairs to your most urgent task, so the first glow means something."]],
  find: ["Find a stone", ["Tap Find stone and its stone blinks in the jar."]],
  glow: ["What the glow means", ["Honey = urgent, ice blue = in progress, white = unassigned, off = done.", "Light stones are one-time, dark stones are ongoing."]],
  charge: ["Charging", ["The base powers the jars, so stones charge in a jar or on the base. No moving stones around to charge.", "Only a stone left out (on a table, in a bag) runs down, and the app warns you."]],
  pairRest: ["Pair the rest", ["Optional. Anyone can pair their own stones later."]],
  home: ["Home", ["Urgent first, then the family jars and this week. No section labels, so it reads at a glance.", "The week is a bar chart of how much the family has each day. Tap a bar to see that day's tasks.", "Top right: the jar icon opens the home kit (glow, batteries, jars), the bell opens notifications."]],
  myjar: ["My jar", ["The ring shows how much of yours is done (blue) and urgent (honey). The middle is what's on for today.", "One list with All, One-time and Ongoing tabs. Urgent tasks sit on top. Tick to mark done."]],
  task: ["A task", ["Shows who has it, its stone, steps, and notes. Hand off or mark done from here.", "Every task has a stone. Linking a real stone at home is optional."]],
  handoff: ["Hand off", ["Sends a request. Trusted circle and kids are limited to the tasks they can take."]],
  newTask: ["Add a task", ["Name, one-time or ongoing, due date, who, remote OK, notes. Saving adds its stone to that person's jar."]],
  newStone: ["Link a real stone", ["Every task already has a stone in the app jar. Linking a real one is optional, from the task's ••• menu."]],
  peopleTab: ["People", ["Everyone's jars and progress, plus the extended circle."]],
  person: ["A person's tasks, and why", ["Each task says why Pebble suggested that person."]],
  settings: ["Settings", ["Family setup, recaps, notifications, and what Pebble can see. Jars, stones and glow live in the home kit."]],
  kit: ["Home kit", ["Everything physical in one place, opened from the jar icon on Home: glow, night hours, jars, the base, and every stone's battery.", "A dot on the icon means a stone is off power."]],
  stones: ["Stones", ["All 14 stones by where they are: in a jar, on the base, or out and not charging."]],
  stoneDetail: ["Stone detail", ["Make it blink, see what it's paired to, or unpair it."]],
  done: ["Marked done", ["A quiet celebration, with a prompt to thank whoever helped."]],
  thanks: ["Say thanks", ["One tap, optional note. Their jar gives a soft glow."]],
  clear: ["Jar is clear", ["When everything of yours is done."]],
  recap: ["Weekly recap", ["Sunday recap. No streaks or rankings, only what went well."]],
  notifications: ["Notifications", ["Needs you: handoff requests and your urgent tasks. Each has a button. Stone alerts live in the home kit.", "Updates: things others finished and thank-yous. A badge on each picture shows the kind."]],
  recapSettings: ["Thank-yous and recaps", ["Turn each one off, or go quiet for a while."]],
});

const APP_NAV = ["ready", "home", "myjar", "task", "newTask", "peopleTab", "person", "settings", "kit", "stones", "done", "clear", "recap", "notifications"];

function renderAppNotes() {
  const [title, bullets] = NOTES[S.screen] || ["", []];
  document.getElementById("notes").innerHTML = `
    <p class="eyebrow">Shoal · main app${S.app?.demo ? " · demo family" : ""}</p>
    <h2>${title}</h2>
    <ol>${APP_NAV.map((s) => `<li><button data-act="appJump" data-to="${s}" aria-current="${s === S.screen}">${NOTES[s][0]}</button></li>`).join("")}</ol>
    <div class="why"><strong>About this screen</strong><ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>
    <button class="reset" data-act="restart">Restart prototype</button>`;
}

/* ---------- Entering screens ---------- */

let heardTimer;
function appEnter(screen) {
  ensureAppData();
  clearTimeout(heardTimer);
  if (screen === "hold" || screen === "newStone") {
    S.app.heard = false;
    heardTimer = setTimeout(() => { if (S.screen === screen) { S.app.heard = true; render(); } }, 1800);
  }
  if (screen === "hold") firstTask();
  if (screen === "paired") { const t = firstTask(); if (t && !stoneOf(t)) pairStone(t.id); }
  if (screen === "find") S.app.blink = null;
  if (screen === "notifications") S.app.seenNotes = true;
  if (screen === "handoff") { S.app.handTo = undefined; S.app.note = ""; }
}

function tabTo(screen) {
  ensureAppData();
  if (screen === S.screen) return;
  S.history = [];
  S.app.blink = null;
  lastDir = "fade";
  closeSheet();
  appEnter(screen);
  S.screen = screen;
  render();
}

// Jump from the notes panel, filling in whatever context the screen needs.
function appJump(to) {
  ensureAppData();
  if (to === "task" || to === "done") S.app.task = (mine("you").find((t) => !t.done && t.steps.length) || mine("you").find((t) => !t.done) || active()[0] || S.tasks[0]).id;
  if (to === "done") { const t = curTask(); t.done = true; }
  if (to === "person") S.app.person = (S.people.find((p) => p.tier === "main" && p.id !== "you") || S.people[0]).id;
  if (to === "newTask") { ACTIONS.newTask(); return; }
  if (TABS.some(([id]) => id === to) || to === "ready") { tabTo(to); return; }
  S.history = [TABS.find(([id]) => id === S.screen) ? S.screen : "home"];
  lastDir = "fade";
  closeSheet();
  appEnter(to);
  S.screen = to;
  render();
}

/* ---------- Actions ---------- */

function finishDone(t) {
  t.done = true;
  S.app.task = t.id;
  go("done");
}

Object.assign(ACTIONS, {
  noop: () => {},
  enterApp: () => { ensureAppData(); go("ready"); },
  skipToApp: () => { ensureAppData(); tabTo("home"); },
  appJump: (d) => appJump(d.to),
  setupNext: () => go(SETUP[SETUP.indexOf(S.screen) + 1]),
  tab: (d) => tabTo(d.to),
  go: (d) => go(d.to),
  findStone: (d) => {
    S.app.blink = d.id;
    render();
    const s = stoneOf(S.tasks.find((t) => t.id === d.id));
    toast(s ? `Stone ${String(s.id).padStart(2, "0")} is blinking` : "Its stone is blinking");
    setTimeout(() => { if (S.app.blink === d.id && S.screen !== "find") { S.app.blink = null; render(); } }, 4000);
  },
  pairTask: (d) => {
    const s = pairStone(d.id);
    render();
    toast(s ? `Stone ${String(s.id).padStart(2, "0")} paired` : `All ${KIT} stones are paired`);
  },
  morePair: () => { S.app.morePair = !S.app.morePair; render(); },
  homeDay: (d) => { S.app.day = d.id; render(); },
  openTask: (d) => { S.app.task = d.id; go("task"); },
  openPerson: (d) => {
    if (d.id === "you") { tabTo("myjar"); return; }
    S.app.person = d.id;
    go("person");
  },
  openStone: (d) => { S.app.stone = +d.id; go("stoneDetail"); },
  jarTab: (d) => { S.app.jarTab = d.id; render(); },
  showDone: () => { S.app.showDone = !S.app.showDone; render(); },
  markDone: (d) => finishDone(S.tasks.find((t) => t.id === d.id)),
  undoDone: (d) => { S.tasks.find((t) => t.id === d.id).done = false; render(); toast("Back on the list"); },
  afterDone: () => tabTo(mine("you").some((t) => !t.done) ? "myjar" : "clear"),
  review: (d) => {
    const r = S.app.requests.find((x) => x.id === d.id);
    S.app.req = r.id;
    openSheet(`<p class="eyebrow">Request from ${esc(nameOf(r.from))}</p><h3>${esc(r.n)}</h3>
      <p class="small">“${esc(r.note)}”</p>
      <div class="actions"><button class="btn-soft" data-act="answerReq" data-id="0">Not this time</button><button class="btn-soft" data-act="answerReq" data-id="1">I'll take it</button></div>
      <button class="btn-primary" data-act="closeSheet">Decide later</button>`);
  },
  answerReq: (d) => {
    const r = S.app.requests.find((x) => x.id === S.app.req);
    S.app.requests = S.app.requests.filter((x) => x !== r);
    if (d.id === "1") S.tasks.push({ id: `r${Date.now()}`, n: r.n, w: 1, k: "phone", y: false, cat: "", on: true, kind: "once", days: ["Sat"], date: addDays(1), time: "", who: "you", done: false, steps: [], notes: r.note, remote: true });
    closeSheet();
    render();
    toast(d.id === "1" ? "Added to your jar" : `${nameOf(r.from)} will see it's back with them`);
  },
  taskMenu: () => {
    const t = curTask();
    openSheet(`<h3>${esc(t.n)}</h3>
      <div class="sheet-list">
        <button data-act="editTaskDate">Change ${t.kind === "once" ? "due date" : "days"}</button>
        ${stoneOf(t) ? `<button data-act="findStone" data-id="${t.id}">Find its stone</button>` : `<button data-act="giveStone" data-id="${t.id}">Link a real stone</button>`}
        <button data-act="handoff">Hand off</button>
      </div>
      <button class="btn-primary" data-act="closeSheet">Done</button>`);
  },
  editTaskDate: () => { S._cal = null; dateSheet(curTask()); },
  toggleStep: (d) => { const x = curTask().steps[+d.id]; x.done = !x.done; if (x.done && !x.who) x.who = "you"; render(); },
  takeStep: (d) => { curTask().steps[+d.id].who = "you"; render(); toast("That step is yours"); },
  giveStone: (d) => { closeSheet(); S.app.stoneFor = d.id; go("newStone"); },
  handoff: () => { closeSheet(); go("handoff"); },
  handTo: (d) => { S.app.handTo = d.id || null; render(); },
  sendHandoff: () => {
    const t = curTask(), to = S.app.handTo;
    t.who = to;
    if (S.app.note) t.notes = S.app.note;
    back();
    toast(to ? `Request sent to ${nameOf(to)}` : "It glows white for whoever is free");
  },
  newTask: () => {
    ensureAppData();
    const id = `n${Date.now()}`;
    S.tasks.push({ id, n: "", w: 1, k: "", y: false, cat: "", on: false, draft: true, kind: "once", days: ["Sat"], date: addDays(4), time: "", who: "you", done: false, steps: [], notes: "", remote: false });
    S.app.draft = id;
    go("newTask");
  },
  draftKind: (d) => { draft().kind = d.id; render(); },
  draftWho: (d) => { draft().who = d.who || null; render(); },
  draftRemote: () => { draft().remote = !draft().remote; render(); },
  editDraftDate: () => { S._cal = null; dateSheet(draft()); },
  saveTask: () => {
    const t = draft();
    t.draft = false;
    t.on = true;
    S.app.draft = null;
    S.app.task = t.id;
    tabTo(t.who === "you" ? "myjar" : "home");
    toast(`Saved. Its stone is in ${t.who ? `${possessive(person(t.who))} jar` : "the open pile"}.`);
  },
  saveStone: () => {
    const s = pairStone(S.app.stoneFor);
    back();
    toast(s ? `Stone ${String(s.id).padStart(2, "0")} linked` : `All ${KIT} stones are in use`);
  },
  dismissThanks: (d) => { S.app.dismissed[d.id] = true; render(); },
  nightSheet: () => {
    const P = S.app.prefs;
    openSheet(`<h3>Night hours</h3><p class="small">Stones stop glowing overnight, then come back on.</p>
      <p class="label">Turn off at</p><div class="chips">${["21:00", "22:00", "23:00"].map((t) => chip(fmtTime(t), P.nightFrom === t, "nightTime", `from-${t}`)).join("")}</div>
      <p class="label">Back on at</p><div class="chips">${["06:00", "07:00", "08:00"].map((t) => chip(fmtTime(t), P.nightTo === t, "nightTime", `to-${t}`)).join("")}</div>
      <button class="btn-primary" data-act="closeSheet">Done</button>`);
  },
  nightTime: (d) => {
    const [k, t] = d.id.split("-");
    S.app.prefs[k === "from" ? "nightFrom" : "nightTo"] = t;
    ACTIONS.nightSheet();
    render();
  },
  setGlow: (d) => {
    S.app.prefs.glow = d.id;
    render();
    toast(d.id === "on" ? "Stones glow" : d.id === "dim" ? "Stones dimmed" : "Glow off. Colors still show in the app.");
  },
  moveTask: () => {
    const p = person(S.app.person);
    openSheet(`<h3>Move which task?</h3><div class="sheet-list">${mine(p.id).filter((t) => !t.done).map((t) => `<button data-act="moveThis" data-id="${t.id}">${esc(t.n)}</button>`).join("")}</div>
      <button class="btn-primary" data-act="closeSheet">Cancel</button>`);
  },
  moveThis: (d) => { S.app.task = d.id; closeSheet(); go("handoff"); },
  redoSetup: () => openSheet(`<h3>Redo family setup?</h3><p class="small">You'll go back through onboarding. This prototype starts fresh.</p>
    <div class="actions"><button class="btn-soft" data-act="closeSheet">Keep it</button><button class="btn-soft" data-act="restart">Start over</button></div>`),
  pebbleSees: () => openSheet(`<h3>What Pebble can see</h3>
    <p class="small">Pebble uses everyone's answers from setup and ${esc(L())}'s goals to suggest a fair split. It never reads task notes, messages, medical records, or calendar event details. Only busy and free.</p>
    <button class="btn-primary" data-act="closeSheet">Got it</button>`),
  pref: (d) => { S.app.prefs[d.id] = !S.app.prefs[d.id]; render(); },
  quietFor: (d) => { S.app.prefs.quietFor = d.id; render(); },
  stoneFilter: (d) => { S.app.stoneFilter = d.id; render(); },
  pairSheet: () => {
    const list = active().filter((t) => !stoneOf(t));
    openSheet(`<h3>Pair a stone</h3><p class="small">Pick a task. Then hold the stone to your phone.</p>
      <div class="sheet-list">${list.slice(0, 8).map((t) => `<button data-act="pairFromSheet" data-id="${t.id}">${esc(t.n)}<small>${esc(nameOf(t.who))}</small></button>`).join("") || `<p class="small">Every task has a stone.</p>`}</div>
      <button class="btn-primary" data-act="closeSheet">Cancel</button>`);
  },
  pairFromSheet: (d) => {
    closeSheet();
    const s = pairStone(d.id);
    if (S.screen === "stoneDetail" && s) S.app.stone = s.id;
    render();
    toast(s ? `Stone ${String(s.id).padStart(2, "0")} paired` : `All ${KIT} stones are paired`);
  },
  blinkStone: (d) => {
    S.app.blink = `s${d.id}`;
    render();
    toast(`Stone ${String(d.id).padStart(2, "0")} is blinking`);
    setTimeout(() => { if (S.app.blink === `s${d.id}`) { S.app.blink = null; render(); } }, 3000);
  },
  unpair: (d) => { S.stones.find((s) => s.id === +d.id).task = null; back(); toast("Stone unpaired. Keep it on the base as a spare."); },
  sayThanks: (d) => {
    const t = S.tasks.find((x) => x.id === d.id);
    S.app.thankFor = { who: t.who, n: t.n, when: t.doneAt || "Today", task: t.id };
    S.app.thankPick = 0; S.app.thanksNote = "";
    go("thanks");
  },
  sayThanksStep: (d) => {
    S.app.thankFor = { who: d.id, n: d.n, when: "This week" };
    S.app.thankPick = 0; S.app.thanksNote = "";
    go("thanks");
  },
  thankPick: (d) => { S.app.thankPick = +d.id; render(); },
  shareThanks: () => { S.app.shareThanks = !S.app.shareThanks; render(); },
  sendThanks: () => {
    const f = S.app.thankFor;
    if (f.task) S.app.thanked[f.task] = true;
    back();
    toast(`Thanks sent to ${nameOf(f.who)}`);
  },
  thankAll: () => { back(); toast("Thanks sent to everyone"); },
  offerHand: () => { tabTo("peopleTab"); toast("We'll let the family know you have room"); },
});

const APP_INPUT = {
  draftName: (v) => {
    draft().n = v;
    const btn = document.querySelector(".footer .btn-primary");
    if (btn) btn.disabled = !v.trim();
  },
  draftNote: (v) => { draft().notes = v; },
  handoffNote: (v) => { S.app.note = v; },
  thanksNote: (v) => { S.app.thanksNote = v; },
};

