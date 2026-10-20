/* Shoal onboarding prototype — vanilla JS, one state object, full re-render per change. */

const A = (f) => `assets/${f}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Content ---------- */

const CONDITIONS = [
  { id: "hospice", t: "Hospice or end of life", d: "Comfort care at home" },
  { id: "dementia", t: "Dementia or memory loss", d: "Alzheimer's, confusion, wandering" },
  { id: "cancer", t: "Cancer treatment", d: "Chemo, radiation, recovery" },
  { id: "aging", t: "Getting older", d: "Needs more help day to day" },
  { id: "other", t: "Something else", d: "Surgery recovery, stroke, other" },
];

// w = weight (1 light, 2 medium, 3 heavy). k = skill tag. p = Pebble pre-picks it. r = repeats by default.
const PRESETS = {
  hospice: {
    Medical: [
      { n: "Refill prescriptions", w: 1, k: "meds", p: 1 },
      { n: "Be there for hospice visits", w: 2, k: "there", p: 1, r: "Thu" },
      { n: "Track symptoms for the nurse", w: 1, k: "meds", r: "Daily" },
      { n: "Comfort meds schedule", w: 2, k: "meds" },
    ],
    Home: [
      { n: "Groceries", w: 1, k: "drive", p: 1, r: "Sat" },
      { n: "Meals", w: 2, k: "cook", r: "Daily" },
      { n: "Rides to appointments", w: 2, k: "drive" },
      { n: "Overnight stays", w: 3, k: "there", r: "Fri" },
    ],
    "Money & paperwork": [
      { n: "Insurance calls", w: 2, k: "phone", p: 1 },
      { n: "Pay bills", w: 1, k: "paper", r: "Mon" },
      { n: "His wishes and advance directive", w: 3, k: "paper", wishes: 1 },
    ],
    Company: [
      { n: "Visits and calls", w: 1, k: "phone", r: "Wed" },
      { n: "Music, reading, old photos", w: 1, k: "there", r: "Sun" },
    ],
  },
  dementia: {
    Medical: [
      { n: "Neurologist appointments", w: 2, k: "drive", p: 1 },
      { n: "Daily meds and pill box", w: 2, k: "meds", p: 1, r: "Sun" },
      { n: "Track changes for the doctor", w: 1, k: "meds" },
    ],
    Home: [
      { n: "Groceries", w: 1, k: "drive", p: 1, r: "Sat" },
      { n: "Home safety check", w: 2, k: "there" },
      { n: "Day program pickups", w: 2, k: "drive", r: "Tue" },
      { n: "Give Mom a night off", w: 3, k: "there", p: 1, r: "Fri" },
    ],
    "Money & paperwork": [
      { n: "Power of attorney", w: 3, k: "paper", wishes: 1 },
      { n: "Pay bills", w: 1, k: "paper", r: "Mon" },
      { n: "Insurance calls", w: 2, k: "phone" },
    ],
    Company: [
      { n: "Daily check-in call", w: 1, k: "phone", r: "Daily" },
      { n: "Memory activities", w: 1, k: "there", r: "Wed" },
    ],
  },
  cancer: {
    Medical: [
      { n: "Rides to chemo", w: 2, k: "drive", p: 1, r: "Tue" },
      { n: "Pick up prescriptions", w: 1, k: "meds", p: 1 },
      { n: "Track side effects", w: 1, k: "meds", r: "Daily" },
      { n: "Sit in on appointments", w: 2, k: "there" },
    ],
    Home: [
      { n: "Easy-on-the-stomach meals", w: 2, k: "cook", p: 1, r: "Daily" },
      { n: "Groceries", w: 1, k: "drive", r: "Sat" },
      { n: "Cleaning and laundry", w: 2, k: "there", r: "Thu" },
    ],
    "Money & paperwork": [
      { n: "Insurance claims", w: 2, k: "phone", p: 1 },
      { n: "Medical leave paperwork", w: 2, k: "paper" },
      { n: "Pay bills", w: 1, k: "paper", r: "Mon" },
    ],
    Company: [
      { n: "Chemo day company", w: 2, k: "there", r: "Tue" },
      { n: "Check-in texts", w: 1, k: "phone", r: "Daily" },
    ],
  },
  aging: {
    Medical: [
      { n: "Doctor appointments", w: 2, k: "drive", p: 1 },
      { n: "Refill prescriptions", w: 1, k: "meds", p: 1 },
      { n: "Fill the weekly pill box", w: 1, k: "meds", r: "Sun" },
    ],
    Home: [
      { n: "Groceries", w: 1, k: "drive", p: 1, r: "Sat" },
      { n: "Yard and repairs", w: 2, k: "there" },
      { n: "Cleaning", w: 2, k: "there", r: "Thu" },
    ],
    "Money & paperwork": [
      { n: "Pay bills", w: 1, k: "paper", p: 1, r: "Mon" },
      { n: "Medicare and insurance", w: 2, k: "phone" },
      { n: "Will and wishes", w: 3, k: "paper", wishes: 1 },
    ],
    Company: [
      { n: "Weekly visit", w: 1, k: "there", r: "Sun" },
      { n: "Daily call", w: 1, k: "phone", r: "Daily" },
    ],
  },
  other: {
    Medical: [
      { n: "Appointments", w: 2, k: "drive", p: 1 },
      { n: "Refill prescriptions", w: 1, k: "meds", p: 1 },
    ],
    Home: [
      { n: "Groceries", w: 1, k: "drive", p: 1, r: "Sat" },
      { n: "Meals", w: 2, k: "cook", r: "Daily" },
      { n: "Cleaning", w: 2, k: "there" },
    ],
    "Money & paperwork": [
      { n: "Pay bills", w: 1, k: "paper", r: "Mon" },
      { n: "Insurance calls", w: 2, k: "phone" },
    ],
    Company: [{ n: "Visits and calls", w: 1, k: "phone", r: "Wed" }],
  },
};

const MATTERS_THEM = [
  { id: "comfort", t: "Comfort at home", d: "Pain managed, in his own bed" },
  { id: "family", t: "Time with family", d: "Visits, calls, meals together" },
  { id: "wishes", t: "His wishes in order", d: "Paperwork, plans, money" },
  { id: "himself", t: "Staying himself", d: "Routines, faith, food he loves" },
];
const MATTERS_YOU = [
  { id: "alone", t: "Not carrying it all alone", d: "Sharing the load fairly" },
  { id: "next", t: "Knowing what’s next", d: "Fewer surprises" },
  { id: "inperson", t: "Being there in person", d: "More time at the house" },
  { id: "far", t: "Helping from far away", d: "Calls, orders, paperwork" },
];
const STRENGTHS = [
  { id: "drive", t: "Driving" }, { id: "phone", t: "Phone calls" }, { id: "paper", t: "Paperwork & bills" },
  { id: "meds", t: "Meds & pharmacy" }, { id: "cook", t: "Cooking" }, { id: "there", t: "Being there" },
];
const PLATE = ["Kids", "Work", "Long commute", "My own health"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
const WEIGHT_LABEL = { 1: "Light", 2: "Medium", 3: "Heavy" };
const WEIGHT_HOURS = { 1: 1, 2: 3, 3: 6 }; // rough weekly hours, used for the fair split

// Today is Tue Oct 20 in the prototype.
const DATE_OPTS = ["Wed, Oct 21", "Thu, Oct 22", "Fri, Oct 23", "Sat, Oct 24", "Mon, Oct 26", "Thu, Oct 29"];

/* ---------- State ---------- */

const initialState = () => ({
  path: null, // "pebble" | "manual"
  screen: "welcome",
  history: [],
  lovedOne: "Dad",
  condition: "hospice",
  them: ["comfort"],
  themOwn: "Being home for his granddaughter’s birthday.",
  you: ["alone", "inperson"],
  tasks: [], // {id, n, w, k, cat, on, pebble, kind:"once"|"repeat", date, repeat, who}
  openCats: {},
  people: [
    { id: "you", name: "You", img: "avatar-you.png", tier: "main", note: "Main caregiver · your jar", cap: null },
    { id: "mom", name: "Mom", img: "avatar-mom.png", tier: "main", note: "Lives with Dad, handles day to day", cap: 18, joined: true },
    { id: "bill", name: "Bill", img: "avatar-bill.png", tier: "main", note: "Invite sent by text", cap: 6, invited: true },
    { id: "sam", name: "Sam", img: "avatar-sam.png", tier: "main", note: "Invite sent by text", cap: 4, invited: true },
    { id: "nora", name: "Nora", img: "avatar-nora.png", tier: "trusted", note: "Neighbor · trusted circle", cap: 3, invited: true },
  ],
  avail: DAYS.map((d, i) => (i < 5 ? { h: 2, when: ["eve"] } : { h: i === 5 ? 5 : 3, when: ["am", "pm"] })),
  strengths: ["phone", "paper"],
  plate: ["Work"],
  splitTouched: false,
  sent: false,
});
let S = initialState();
let lastDir = "fwd";

/* ---------- Flow ---------- */

const FLOWS = {
  pebble: ["about", "them", "you", "tasks", "dates", "people", "avail", "split", "review"],
  manual: ["about", "tasks", "dates", "people", "avail", "split", "review"],
};
const flow = () => FLOWS[S.path || "manual"];
const stepIndex = () => flow().indexOf(S.screen);

function go(screen, dir = "fwd") {
  if (screen === S.screen) return;
  if (dir === "fwd") S.history.push(S.screen);
  lastDir = dir;
  closeSheet();
  onEnter(screen);
  S.screen = screen;
  render();
}
function next() {
  const f = flow();
  const i = f.indexOf(S.screen);
  if (i < f.length - 1) go(f[i + 1]);
}
function back() {
  const prev = S.history.pop();
  if (prev) { lastDir = "back"; closeSheet(); S.screen = prev; render(); }
}

function onEnter(screen) {
  if (screen === "tasks" && !S.tasks.length) seedTasks();
  // Pebble proposes a split; manual starts unassigned so you can pick, or ask Pebble.
  if (screen === "split" && S.path === "pebble" && !S.splitTouched) suggestSplit();
}

function seedTasks() {
  const preset = PRESETS[S.condition];
  let id = 0;
  S.tasks = [];
  S.splitTouched = false;
  S.openCats = {};
  Object.entries(preset).forEach(([cat, items], ci) => {
    S.openCats[cat] = ci < 2;
    items.forEach((t) => {
      const pick = S.path === "pebble"
        ? !!t.p || (t.wishes && S.them.includes("wishes")) || (t.k === "phone" && S.you.includes("far"))
        : false;
      S.tasks.push({
        id: `t${id++}`, n: t.n, w: t.w, k: t.k, cat, on: pick, pebble: pick,
        kind: t.r ? "repeat" : "once",
        repeat: t.r || "Sat",
        date: DATE_OPTS[(id + 1) % DATE_OPTS.length],
        who: null,
      });
    });
    if (S.path === "pebble" && items.some((t) => t.p)) S.openCats[cat] = true;
  });
}
const picked = () => S.tasks.filter((t) => t.on);
const person = (id) => S.people.find((p) => p.id === id);
const yourCap = () => S.avail.reduce((a, d) => a + d.h, 0);
const capOf = (p) => (p.id === "you" ? yourCap() : p.cap);

function loads() {
  const out = {};
  S.people.forEach((p) => (out[p.id] = 0));
  picked().forEach((t) => { if (t.who) out[t.who] += hoursOf(t); });
  return out;
}
function hoursOf(t) {
  const base = WEIGHT_HOURS[t.w];
  if (t.kind === "once") return base * 0.5;
  return t.repeat === "Daily" ? base * 2.5 : base;
}

// Greedy fair split: heaviest first, to whoever has the most room left. Strengths nudge "You".
function suggestSplit() {
  const load = {};
  S.people.forEach((p) => (load[p.id] = 0));
  const tasks = picked().slice().sort((a, b) => hoursOf(b) - hoursOf(a));
  tasks.forEach((t) => {
    let best = null, bestScore = Infinity;
    S.people.forEach((p) => {
      if (p.tier === "trusted" && t.w > 1) return; // trusted circle only gets light, offloaded tasks
      const cap = capOf(p) || 0.1;
      let score = (load[p.id] + hoursOf(t)) / cap;
      if (p.id === "you" && S.strengths.includes(t.k)) score -= 0.25;
      if (score < bestScore) { bestScore = score; best = p; }
    });
    if (best && bestScore <= 1.05) { t.who = best.id; load[best.id] += hoursOf(t); }
    else t.who = null;
  });
  S.splitTouched = true;
}

/* ---------- Shared pieces ---------- */

const check = (on) => on
  ? `<span class="check on"><img src="${A("check.svg")}" alt=""></span>`
  : `<span class="check off"><img src="${A("radio-empty.svg")}" alt=""></span>`;
const weightPill = (w) => `<span class="weight" title="${WEIGHT_LABEL[w]} task">${[1, 2, 3].map((i) => `<i class="${i <= w ? "f" : ""}"></i>`).join("")}&nbsp;${WEIGHT_LABEL[w]}</span>`;
const avatar = (p, cls = "") => p.img
  ? `<span class="avatar ${cls}"><img src="${A(p.img)}" alt=""></span>`
  : `<span class="avatar ${cls}">${esc(p.name[0])}</span>`;
const stone = (assigned) => `<img class="stone" src="${A(assigned ? "stone-progress.svg" : "stone-unassigned.svg")}" alt="">`;

function topbar({ skip = true } = {}) {
  const f = flow();
  const i = stepIndex();
  const total = f.length - 1; // review isn't a counted step
  return `<div class="topbar">
    <button class="back" data-act="back" aria-label="Back"><img src="${A("back.svg")}" alt=""></button>
    <div class="progress">${Array.from({ length: total }, (_, k) => `<span class="${k <= i ? "on" : ""}"></span>`).join("")}</div>
    ${skip ? `<button class="skip" data-act="next">Skip</button>` : ""}
  </div>`;
}
const eyebrow = (section) => `<p class="eyebrow">${section} · Step ${stepIndex() + 1} of ${flow().length - 1}</p>`;
function footer(label = "Next", { disabled = false, act = "next", backBtn = true } = {}) {
  return `<div class="footer">
    <button class="btn-primary" data-act="${act}" ${disabled ? "disabled" : ""}>${label}</button>
    ${backBtn ? `<button class="btn-text" data-act="back">Back</button>` : `<span style="height:44px"></span>`}
  </div>`;
}

/* ---------- Screens ---------- */

const SCREENS = {};

SCREENS.welcome = () => {
  // Jar illustration from the Figma frame. Positions are the design's own.
  const rocks = [
    { f: "rocks-1.svg", x: 6.35, y: 48.15, w: 69.83, h: 55.08, i: [5.87, 2.12, 4.7, 5.16] },
    { f: "rocks-2.svg", x: 3.23, y: 29.49, w: 73.21, h: 55.51, i: [3.49, 7.53, 4.67, 0] },
    { f: "rocks-3.svg", x: 6.46, y: 60.02, w: 69.74, h: 34.69, i: [17.27, 2.12, 7.47, 2.12] },
    { f: "rocks-4.svg", x: 6.46, y: 78.06, w: 69.74, h: 16.65, i: [2.22, 2.12, 15.56, 2.12] },
  ];
  const plates = [[105.66], [105.66, 95.76, 85.7], [105.66, 95.76], [105.66]];
  const jars = rocks.map((r, j) => {
    const [t, rt, b, l] = r.i;
    const img = `left:${-l / 100 * r.w}px;top:${-t / 100 * r.h}px;width:${r.w * (1 + (l + rt) / 100)}px;height:${r.h * (1 + (t + b) / 100)}px`;
    return `<div class="jar" style="left:${j * 85.93}px">
      <img class="glass" src="${A("jar.png")}" alt="">
      ${plates[j].map((y) => `<div class="plate" style="top:${y}px"></div>`).join("")}
      <div class="rocks" style="left:${r.x}px;top:${r.y}px;width:${r.w}px;height:${r.h}px"><img src="${A(r.f)}" alt="" style="${img}"></div>
    </div>`;
  }).join("");
  return `<div class="content no-top">
    <h1 class="title xl">Let's set up your family's plan</h1>
    <p class="sub" style="margin-top:10px">Pick how you'd like to start. You can switch anytime.</p>
    <div class="card hero">
      <div class="jars-illus" aria-label="Four jars with glowing stones">${jars}</div>
      <p class="small cap">Where you're headed: one jar for each main caregiver, one stone per task.</p>
    </div>
    <div style="position:relative">
      <span class="badge caps path-badge">Recommended</span>
      <button class="path rec" data-act="start" data-path="pebble">
        <img src="${A("pebble-icon.svg")}" width="44" height="44" alt="">
        <span><span class="t">Get help from Pebble</span><span class="d">Answer a few short questions. Pebble suggests tasks and a fair split.</span></span>
        <img class="chev" src="${A("chevron.svg")}" alt="">
      </button>
    </div>
    <button class="path" data-act="start" data-path="manual">
      <span class="ico"><img src="${A("checklist.svg")}" width="20" height="18" alt=""></span>
      <span><span class="t">Set it up myself</span><span class="d">List what needs doing first, then choose who takes each one.</span></span>
      <img class="chev" src="${A("chevron.svg")}" alt="">
    </button>
    <p class="small foot-note">Pebble is an AI helper. You review every suggestion,<br>and nothing is shared until everyone says yes.</p>
  </div>`;
};

SCREENS.about = () => `${topbar({ skip: false })}
  <div class="content">
    ${eyebrow("About them")}
    <h1 class="title">Who are you caring for?</h1>
    <p class="sub">This picks the starter tasks. You can change any of them.</p>
    <label class="card cond-name"><span>Name</span><input data-input="lovedOne" value="${esc(S.lovedOne)}" maxlength="20" aria-label="Their name"></label>
    <p class="label">What are they facing?</p>
    ${CONDITIONS.map((c) => `<button class="option ${S.condition === c.id ? "on" : ""}" data-act="condition" data-id="${c.id}">
      <span class="txt"><span class="t">${c.t}</span><span class="d">${c.d}</span></span>${check(S.condition === c.id)}
    </button>`).join("")}
  </div>
  ${footer("Next", { disabled: !S.lovedOne.trim() })}`;

SCREENS.them = () => `${topbar()}
  <div class="content">
    ${eyebrow("Pebble")}
    <h1 class="title">What matters most to ${esc(S.lovedOne)} right now?</h1>
    <p class="sub">Pick up to two, or write your own.</p>
    ${MATTERS_THEM.map((m) => `<button class="option ${S.them.includes(m.id) ? "on" : ""}" data-act="toggleThem" data-id="${m.id}">
      <span class="txt"><span class="t">${m.t}</span><span class="d">${m.d}</span></span>${check(S.them.includes(m.id))}
    </button>`).join("")}
    ${ownWords("themOwn", "Something only your family would know")}
  </div>
  ${footer()}`;

function ownWords(key, placeholder) {
  const v = S[key];
  if (v && !S._editing) {
    return `<div class="option on" style="display:block;min-height:92px">
      <p class="eyebrow" style="margin:0 0 6px">Your words</p>
      <p style="margin:0;font-weight:500;font-size:15px;line-height:21px;padding-right:44px">“${esc(v)}”</p>
      <span style="position:absolute;right:16px;top:14px">${check(true)}</span>
      <button data-act="editOwn" style="position:absolute;right:16px;bottom:12px;font-weight:600;font-size:13px;color:var(--blue)">Edit</button>
    </div>`;
  }
  return `<form class="write-own editing" data-form="own" data-key="${key}">
    <img src="${A("plus.svg")}" alt=""><input name="v" placeholder="${placeholder}" value="${esc(v || "")}" autofocus>
    <button class="go">Save</button></form>`;
}

SCREENS.you = () => `${topbar()}
  <div class="content">
    ${eyebrow("Pebble")}
    <h1 class="title">What matters most to you?</h1>
    <p class="sub lock"><img src="${A("lock.svg")}" width="14" height="14" alt="">Only you see this answer.</p>
    ${MATTERS_YOU.map((m) => `<button class="option ${S.you.includes(m.id) ? "on" : ""}" data-act="toggleYou" data-id="${m.id}">
      <span class="txt"><span class="t">${m.t}</span><span class="d">${m.d}</span></span>${check(S.you.includes(m.id))}
    </button>`).join("")}
  </div>
  ${footer("See Pebble's task ideas")}`;

SCREENS.tasks = () => {
  const cats = Object.keys(PRESETS[S.condition]);
  const extra = [...new Set(S.tasks.map((t) => t.cat))].filter((c) => !cats.includes(c));
  const condName = CONDITIONS.find((c) => c.id === S.condition).t.toLowerCase();
  const pebbleCount = S.tasks.filter((t) => t.pebble).length;
  return `${topbar({ skip: false })}
  <div class="content">
    ${eyebrow("Tasks")}
    <h1 class="title">What needs doing?</h1>
    <p class="sub">Common tasks for ${esc(condName)}. Tap to pick, tap the weight to change how big it is.</p>
    ${S.path === "pebble" ? `<div class="card r20 pebble-note"><img src="${A("pebble-icon.svg")}" alt=""><span class="small" style="color:var(--ink)">Pebble picked <b>${pebbleCount}</b> from your answers. Uncheck anything that doesn't fit.</span></div>` : ""}
    ${[...cats, ...extra].map((cat) => {
      const items = S.tasks.filter((t) => t.cat === cat);
      const n = items.filter((t) => t.on).length;
      const open = S.openCats[cat];
      return `<div class="group-head"><p class="eyebrow grey">${esc(cat)}</p><span class="count">${n} of ${items.length} picked</span></div>
      <div class="card r20">${open
        ? `<div class="list">${items.map((t) => `<div class="row ${t.on ? "on" : ""}">
              <button data-act="toggleTask" data-id="${t.id}" style="display:flex;align-items:center;gap:12px;flex:1;text-align:left">${check(t.on)}<span class="name">${esc(t.n)}${t.pebble ? `<span class="tag">Suggested by Pebble</span>` : ""}</span></button>
              <button data-act="weight" data-id="${t.id}" aria-label="Change size">${weightPill(t.w)}</button>
            </div>`).join("")}</div>`
        : `<button class="collapsed" data-act="openCat" data-cat="${esc(cat)}"><span>${esc(items.slice(0, 2).map((t) => t.n).join(", "))}${items.length > 2 ? `, and ${items.length - 2} more` : ""}</span><img src="${A("chevron.svg")}" alt=""></button>`}
      </div>`;
    }).join("")}
    <form class="write-own" data-form="task"><img src="${A("plus.svg")}" alt=""><input name="v" placeholder="Add your own task"><button class="go">Add</button></form>
  </div>
  ${footer(picked().length ? `Next · ${picked().length} task${picked().length > 1 ? "s" : ""}` : "Pick at least one task", { disabled: !picked().length })}`;
};

SCREENS.dates = () => {
  const once = picked().filter((t) => t.kind === "once");
  const rep = picked().filter((t) => t.kind === "repeat");
  const row = (t) => `<button class="date-row" data-act="editDate" data-id="${t.id}">
      <span class="main"><span class="n">${esc(t.n)}</span><span class="m">${weightPill(t.w)} ${t.kind === "once" ? "Happens once" : "Repeats"}</span></span>
      <span class="badge">${t.kind === "once" ? t.date : t.repeat === "Daily" ? "Every day" : `Every ${t.repeat}`}</span>
      <img class="chev" src="${A("chevron.svg")}" alt="">
    </button>`;
  return `${topbar({ skip: false })}
  <div class="content">
    ${eyebrow("Tasks")}
    <h1 class="title">When is each due?</h1>
    <p class="sub">One-time tasks happen once; ongoing ones repeat. Pebble uses this to match tasks to free time.</p>
    ${once.length ? `<p class="eyebrow grey" style="margin:4px 0 10px">One-time</p><div class="card r20" style="margin-bottom:20px">${once.map(row).join("")}</div>` : ""}
    ${rep.length ? `<p class="eyebrow grey" style="margin:4px 0 10px">Ongoing</p><div class="card r20">${rep.map(row).join("")}</div>` : ""}
  </div>
  ${footer("Next: who's helping")}`;
};

SCREENS.people = () => {
  const main = S.people.filter((p) => p.tier === "main");
  const trusted = S.people.filter((p) => p.tier === "trusted");
  const line = (p) => `<div class="person">${avatar(p)}
      <span class="main"><span class="n">${esc(p.name)}</span><span class="m">${esc(p.note)}</span></span>
      ${p.id === "you" || p.joined ? stone(true) : `<span class="badge">Invited</span>`}
    </div>`;
  return `${topbar({ skip: false })}
  <div class="content">
    ${eyebrow("People")}
    <h1 class="title">Who's helping?</h1>
    <p class="sub">Main caregivers each get the Shoal app, a jar, and stones. We'll text them a link to download it.</p>
    <p class="eyebrow grey" style="margin:4px 0 10px">Main circle · gets a jar</p>
    <div class="card">${main.map(line).join("")}</div>
    <p class="eyebrow grey" style="margin:22px 0 10px">Trusted circle · helps with light tasks</p>
    <div class="card">${trusted.map(line).join("") || `<div class="person"><span class="small">No one yet</span></div>`}</div>
    ${S._adding ? `<form class="write-own editing" data-form="person" style="height:auto;padding:10px 12px 10px 17px;flex-wrap:wrap;gap:10px">
        <input name="v" placeholder="Name or phone number" autofocus style="min-width:150px">
        <span class="seg"><button type="button" class="${S._addTier !== "trusted" ? "on" : ""}" data-act="addTier" data-tier="main">Main</button><button type="button" class="${S._addTier === "trusted" ? "on" : ""}" data-act="addTier" data-tier="trusted">Trusted</button></span>
        <button class="go">Invite</button></form>`
      : `<button class="write-own" data-act="addPerson"><img src="${A("plus.svg")}" alt="">Add a person</button>`}
    <p class="small" style="margin-top:16px">Anyone else can help through a public link later: wishlists, meal trains, donations.</p>
  </div>
  ${footer()}`;
};

SCREENS.avail = () => {
  const total = yourCap();
  return `${topbar({ skip: false })}
  <div class="content">
    ${eyebrow("Your week")}
    <h1 class="title">When are you free?</h1>
    <p class="sub lock"><img src="${A("lock.svg")}" width="14" height="14" alt="">Private. Everyone sets their own when they join.</p>
    <div class="card">
      ${S.avail.map((d, i) => `<div class="day ${i > 4 ? "weekend" : ""}">
        <span class="dn">${DAYS[i]}</span>
        <input type="range" min="0" max="8" step="1" value="${d.h}" data-range="${i}" style="--p:${d.h / 8 * 100}%" aria-label="${DAYS[i]} hours free">
        <span class="hrs ${d.h ? "" : "zero"}">${d.h ? `${d.h}${d.h === 8 ? "+" : ""}h` : "—"}</span>
        ${d.h ? `<span class="when">${[["am", "Morning"], ["pm", "Afternoon"], ["eve", "Evening"]].map(([k, l]) => `<button class="${d.when.includes(k) ? "on" : ""}" data-act="when" data-day="${i}" data-k="${k}">${l}</button>`).join("")}</span>` : ""}
      </div>`).join("")}
      <div class="week-total"><button class="linkish" data-act="copyMon">Copy Monday to all weekdays</button><b>${total}h / week</b></div>
    </div>
    <p class="label">What you’re good at</p>
    <div class="chips">${STRENGTHS.map((s) => chip(s.t, S.strengths.includes(s.id), "strength", s.id)).join("")}</div>
    <p class="label">Anything else on your plate? <span class="private"><img src="${A("lock.svg")}" alt="">Private</span></p>
    <div class="chips">${PLATE.map((p) => chip(p, S.plate.includes(p), "plate", p)).join("")}</div>
    <p class="small" style="margin-top:18px">Pebble uses this to keep the split fair. Others only see the plan, not your reasons.</p>
  </div>
  ${footer(S.path === "pebble" ? "See Pebble's split" : "Next: split it up")}`;
};
const chip = (label, on, act, id) => `<button class="chip ${on ? "on" : ""}" data-act="${act}" data-id="${esc(id)}">${on ? `<img src="${A("chip-check.svg")}" alt="">` : ""}${esc(label)}</button>`;

SCREENS.split = () => {
  const L = loads();
  const helpers = S.people;
  const unassigned = picked().filter((t) => !t.who);
  return `${topbar({ skip: false })}
  <div class="content">
    ${eyebrow("Split")}
    <h1 class="title">Who takes each one?</h1>
    <p class="sub">${S.path === "pebble" && S.splitTouched ? "Pebble's suggestion, weighted by task size and free time. Change anything." : "Leave any unassigned. They glow white."}</p>
    <div class="card loads">
      ${S.people.filter((p) => p.tier === "main" || L[p.id]).map((p) => {
        const cap = capOf(p), pct = Math.min(100, (L[p.id] / cap) * 100);
        return `<div class="load ${L[p.id] > cap ? "over" : ""}">${avatar(p, "s20")}<span class="who">${esc(p.name)}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="v">${fmtH(L[p.id])} of ~${cap}h</span></div>`;
      }).join("")}
      <p class="small" style="margin:8px 0 0">Heavier tasks count for more. Others' free time is a guess until they join.</p>
    </div>
    ${S.path !== "pebble" ? `<div style="display:flex;justify-content:center;margin:0 0 14px"><button class="btn-soft" data-act="suggest"><img src="${A("pebble-icon.svg")}" alt="">Ask Pebble for a fair split</button></div>` : ""}
    ${unassigned.length ? `<div class="card helpcard">
        <b style="font-size:15px">${unassigned.length} stone${unassigned.length > 1 ? "s" : ""} still glow white</b>
        <p class="small" style="margin:4px 0 0">No one has room for ${unassigned.length > 1 ? "these" : "this"} yet. You can still share ${unassigned.length > 1 ? "them" : "it"}:</p>
        <div class="chips"><button class="chip" data-act="toast" data-msg="Shared with the trusted circle">Ask trusted circle</button><button class="chip" data-act="toast" data-msg="Pebble will suggest local paid help">Find paid help</button></div>
      </div>` : ""}
    ${picked().map((t) => `<div class="card task-card">
      <div class="head">${stone(!!t.who)}<span class="n">${esc(t.n)}</span>${weightPill(t.w)}</div>
      <p class="meta">${t.kind === "once" ? `Once · ${t.date}` : t.repeat === "Daily" ? "Every day" : `Every ${t.repeat}`} · ${t.who ? esc(person(t.who).name) : "Unassigned"}</p>
      <div class="pickers">
        ${helpers.map((p) => {
          const blocked = p.tier === "trusted" && t.w > 1;
          return `<button class="pick ${t.who === p.id ? "on" : ""}" data-act="assign" data-id="${t.id}" data-who="${p.id}" ${blocked ? `disabled style="opacity:.35" title="Trusted circle gets light tasks only"` : ""}>
            <span class="ringwrap">${avatar(p, "s36")}<img class="ring" src="${A("selected-ring.svg")}" alt=""></span>${esc(p.name)}</button>`;
        }).join("")}
        <button class="pick ${!t.who ? "on" : ""}" data-act="assign" data-id="${t.id}" data-who="">
          <span class="ringwrap"><img class="none" src="${A("none.svg")}" alt=""><img class="ring" src="${A("selected-ring.svg")}" alt=""></span>None</button>
      </div>
    </div>`).join("")}
  </div>
  ${footer("Review the plan")}`;
};
const fmtH = (h) => `${Math.round(h * 10) / 10}h`;

SCREENS.review = () => {
  const main = S.people.filter((p) => p.tier === "main");
  const slots = (n) => {
    // stack stones bottom-up inside the jar, 3 per row, odd rows nudged so they nest
    const out = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / 3), col = i % 3;
      out.push({ x: 1 + col * 23 + (row % 2 ? 4 : 0), y: 81 - row * 14 });
    }
    return out;
  };
  const trustedTasks = picked().filter((t) => t.who && person(t.who).tier === "trusted");
  const loose = picked().filter((t) => !t.who);
  let delay = 0;
  const peb = (t, pos) => `<button class="pebble-btn" data-act="stone" data-id="${t.id}" style="${pos ? `left:${pos.x}px;top:${pos.y}px;` : ""}animation-delay:${(delay += 0.07)}s" aria-label="${esc(t.n)}"><img src="${A(t.who ? "stone-progress.svg" : "stone-unassigned.svg")}" alt=""></button>`;
  const invitees = S.people.filter((p) => p.invited);
  return `<div class="topbar"><button class="back" data-act="back" aria-label="Back"><img src="${A("back.svg")}" alt=""></button></div>
  <div class="content">
    <p class="eyebrow">${S.sent ? "All set" : "Last look"}</p>
    <h1 class="title">${S.sent ? "Invites are on their way" : `${esc(S.lovedOne)}'s plan is ready`}</h1>
    <p class="sub">${S.sent ? "Your stones light up as soon as each person says yes." : "Tap any stone to hear it, or to make the real one glow so you can find it."}</p>
    <div class="card shelf">
      <div class="shelf-jars">${main.map((p) => {
        const mine = picked().filter((t) => t.who === p.id);
        const pos = slots(mine.length);
        return `<div class="rjar"><div class="glassbox"><img class="glass" src="${A("jar.png")}" alt=""><div class="plate"></div>${mine.map((t, i) => peb(t, pos[i])).join("")}</div>
          <span class="who">${esc(p.name)}</span><span class="cnt">${mine.length} task${mine.length === 1 ? "" : "s"}</span></div>`;
      }).join("")}</div>
      ${trustedTasks.length ? `<div class="loose">Trusted circle ${trustedTasks.map((t) => peb(t)).join("")}</div>` : ""}
      ${loose.length ? `<div class="loose">Unassigned ${loose.map((t) => peb(t)).join("")}</div>` : ""}
      <div class="legend"><span><img src="${A("stone-progress.svg")}" alt="">Assigned</span><span><img src="${A("stone-unassigned.svg")}" alt="">Needs someone</span></div>
    </div>
    <div class="card info"><img src="${A("lock.svg")}" alt=""><span class="small">Each pebble can read its own task aloud, so the jar works even when your phone isn't nearby. You'll get a reminder before anything is due.</span></div>
  </div>
  ${S.sent
    ? footer("Go to my jar", { act: "restart", backBtn: false })
    : footer(invitees.length ? `Send plan to ${listNames(invitees)}` : "Finish", { act: "send" })}`;
};
const listNames = (ps) => {
  const n = ps.map((p) => p.name);
  return n.length <= 2 ? n.join(" and ") : `${n.slice(0, -1).join(", ")}, and ${n.at(-1)}`;
};

/* ---------- Sheets ---------- */

let sheetFrame;
function openSheet(html) {
  const el = document.getElementById("sheet");
  el.innerHTML = `<div class="scrim" data-act="closeSheet"></div><div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  if (!el.classList.contains("open")) sheetFrame = requestAnimationFrame(() => el.classList.add("open"));
}
function closeSheet() {
  const el = document.getElementById("sheet");
  cancelAnimationFrame(sheetFrame);
  el.classList.remove("open");
  setTimeout(() => { if (!el.classList.contains("open")) el.innerHTML = ""; }, 300);
}

function dateSheet(t) {
  openSheet(`<h3>${esc(t.n)}</h3>
    <p class="small">How often does this happen?</p>
    <div class="row-opts">${chip("Once", t.kind === "once", "setKind", "once")}${chip("Repeats", t.kind === "repeat", "setKind", "repeat")}</div>
    <p class="label" style="margin-top:18px">${t.kind === "once" ? "Due" : "Every"}</p>
    <div class="row-opts">${t.kind === "once"
      ? DATE_OPTS.map((d) => chip(d, t.date === d, "setDate", d)).join("")
      : ["Daily", ...DAYS].map((d) => chip(d === "Daily" ? "Every day" : d, t.repeat === d, "setRepeat", d)).join("")}</div>
    <button class="btn-primary" data-act="closeSheet">Done</button>`);
  S._sheetTask = t.id;
}

function stoneSheet(t) {
  const p = t.who && person(t.who);
  const when = t.kind === "once" ? `due ${t.date}` : t.repeat === "Daily" ? "every day" : `every ${t.repeat}`;
  openSheet(`<div style="display:flex;align-items:center;gap:10px">${stone(!!t.who)}<h3 style="margin:0">${esc(t.n)}</h3></div>
    <p class="small" style="margin:8px 0 0">${WEIGHT_LABEL[t.w]} task · ${when} · ${p ? esc(p.name) : "Unassigned"}</p>
    <div class="actions">
      <button class="btn-soft" data-act="speak" data-id="${t.id}">▶ Play on pebble</button>
      <button class="btn-soft" data-act="locate" data-id="${t.id}">Make it glow</button>
    </div>
    <button class="btn-primary" data-act="closeSheet">Done</button>`);
}

/* ---------- Render ---------- */

const NOTES = {
  welcome: ["Welcome", ["Jar art is now framed as “where you're headed”, not a split of tasks that don't exist yet.", "Manual path copy says tasks come first."]],
  about: ["Care situation", ["New step. Starter tasks change by condition: hospice, dementia, cancer, aging.", "Name is used in later copy."]],
  them: ["What matters to them", ["Pebble path only. Unchanged from v2, but answers now pre-pick tasks (e.g. “His wishes” adds the advance-directive task)."]],
  you: ["What matters to you", ["Pebble path only. “Helping from far away” leans Pebble toward phone and paperwork tasks."]],
  tasks: ["Tasks before people", ["Preset tasks by condition with a write-in at the bottom.", "Each task has a size (light, medium, heavy) that feeds the fair split.", "No one is assigned yet."]],
  dates: ["Dates and repeats", ["Moved up, before people. Knowing when tasks happen lets the split match them to free time."]],
  people: ["Who's helping", ["Says plainly that each main caregiver gets the app and a link by text.", "Trusted circle is a separate list, light tasks only."]],
  avail: ["Per-day availability", ["Replaces the “a few hours / evenings / most days” buckets with a slider for each day.", "Weekdays and weekends are set separately, plus morning, afternoon, or evening."]],
  split: ["The split, last", ["Load bars count heavier tasks as more hours.", "Pebble path arrives pre-split. Manual path can ask Pebble.", "If no one has room, it suggests the trusted circle or paid help instead of overloading someone."]],
  review: ["Jars, now earned", ["Jars fill with the tasks you just made.", "Tap a stone: voice playback and “make it glow” (locate) are shown up front, so the jar works without the app."]],
};

function renderNotes() {
  const all = ["welcome", ...flow()];
  const seen = new Set([S.screen, ...S.history]);
  const [title, bullets] = NOTES[S.screen];
  document.getElementById("notes").innerHTML = `
    <p class="eyebrow">Shoal · onboarding v3 · ${S.path ? (S.path === "pebble" ? "Pebble path" : "Manual path") : "pick a path"}</p>
    <h2>${title}</h2>
    <ol>${all.map((s) => `<li><button data-act="jump" data-to="${s}" aria-current="${s === S.screen}" ${seen.has(s) || s === "welcome" ? "" : "disabled"}>${NOTES[s][0]}</button></li>`).join("")}</ol>
    <div class="why"><strong>What changed here</strong><ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul></div>
    <button class="reset" data-act="restart">Restart prototype</button>`;
}

function render() {
  const el = document.getElementById("screen");
  const prevScreen = el.dataset.s;
  const keepScroll = prevScreen === S.screen ? el.querySelector(".content")?.scrollTop : 0;
  el.innerHTML = SCREENS[S.screen]();
  el.dataset.s = S.screen;
  if (prevScreen !== S.screen) {
    el.classList.remove("enter-fwd", "enter-back");
    void el.offsetWidth;
    el.classList.add(lastDir === "back" ? "enter-back" : "enter-fwd");
  }
  const c = el.querySelector(".content");
  if (c && keepScroll) c.scrollTop = keepScroll;
  el.querySelector("[autofocus]")?.focus();
  renderNotes();
}

let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Events ---------- */

const ACTIONS = {
  next, back,
  start: (d) => { S.path = d.path; S.tasks = []; go("about"); },
  condition: (d) => { if (S.condition !== d.id) S.tasks = []; S.condition = d.id; render(); },
  toggleThem: (d) => {
    const i = S.them.indexOf(d.id);
    if (i >= 0) S.them.splice(i, 1);
    else if (S.them.length < 2) S.them.push(d.id);
    else toast("Pick up to two");
    S.tasks = [];
    render();
  },
  toggleYou: (d) => { const i = S.you.indexOf(d.id); i >= 0 ? S.you.splice(i, 1) : S.you.push(d.id); S.tasks = []; render(); },
  editOwn: () => { S._editing = true; render(); },
  toggleTask: (d) => { const t = S.tasks.find((x) => x.id === d.id); t.on = !t.on; if (!t.on) t.who = null; render(); },
  weight: (d) => { const t = S.tasks.find((x) => x.id === d.id); t.w = (t.w % 3) + 1; render(); },
  openCat: (d) => { S.openCats[d.cat] = true; render(); },
  editDate: (d) => dateSheet(S.tasks.find((x) => x.id === d.id)),
  setKind: (d) => { const t = S.tasks.find((x) => x.id === S._sheetTask); t.kind = d.id; render(); dateSheet(t); },
  setDate: (d) => { const t = S.tasks.find((x) => x.id === S._sheetTask); t.date = d.id; render(); dateSheet(t); },
  setRepeat: (d) => { const t = S.tasks.find((x) => x.id === S._sheetTask); t.repeat = d.id; render(); dateSheet(t); },
  closeSheet,
  addPerson: () => { S._adding = true; S._addTier = "main"; render(); },
  addTier: (d) => {
    const v = document.querySelector('[data-form="person"] input')?.value || "";
    S._addTier = d.tier; render();
    const inp = document.querySelector('[data-form="person"] input'); if (inp) { inp.value = v; inp.focus(); }
  },
  when: (d) => { const day = S.avail[+d.day]; const i = day.when.indexOf(d.k); i >= 0 ? day.when.splice(i, 1) : day.when.push(d.k); render(); },
  copyMon: () => { for (let i = 1; i < 5; i++) S.avail[i] = { h: S.avail[0].h, when: [...S.avail[0].when] }; render(); toast("Copied Monday to Tue–Fri"); },
  strength: (d) => { const i = S.strengths.indexOf(d.id); i >= 0 ? S.strengths.splice(i, 1) : S.strengths.push(d.id); render(); },
  plate: (d) => { const i = S.plate.indexOf(d.id); i >= 0 ? S.plate.splice(i, 1) : S.plate.push(d.id); render(); },
  assign: (d) => { const t = S.tasks.find((x) => x.id === d.id); t.who = d.who || null; S.splitTouched = true; render(); },
  suggest: () => { suggestSplit(); render(); toast("Pebble balanced it by size and free time"); },
  stone: (d) => stoneSheet(S.tasks.find((x) => x.id === d.id)),
  speak: (d) => {
    const t = S.tasks.find((x) => x.id === d.id);
    const p = t.who && person(t.who);
    const when = t.kind === "once" ? `due ${t.date}` : t.repeat === "Daily" ? "every day" : `every ${DAY_FULL[t.repeat]}`;
    const line = `${t.n}. ${when}. ${p ? (p.id === "you" ? "This one is yours." : `${p.name} has this one.`) : "No one has this yet."}`;
    if ("speechSynthesis" in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(line)); }
    toast(`🔊 “${line}”`);
  },
  locate: (d) => {
    closeSheet();
    const b = document.querySelector(`.pebble-btn[data-id="${d.id}"]`);
    if (b) { b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); }
    toast("Your pebble is glowing");
  },
  send: () => { S.sent = true; render(); toast("Plan sent"); },
  restart: () => { S = initialState(); lastDir = "back"; render(); },
  jump: (d) => {
    if (d.to === S.screen) return;
    if (d.to === "welcome") { ACTIONS.restart(); return; }
    const i = S.history.indexOf(d.to);
    if (i >= 0) { S.history = S.history.slice(0, i); lastDir = "back"; S.screen = d.to; render(); }
    else go(d.to);
  },
  toast: (d) => toast(d.msg),
};

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  e.preventDefault();
  ACTIONS[b.dataset.act]?.(b.dataset);
});

document.addEventListener("submit", (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  const v = f.elements.v.value.trim();
  const kind = f.dataset.form;
  if (kind === "own") { S[f.dataset.key] = v; S._editing = false; render(); return; }
  if (!v) return;
  if (kind === "task") {
    S.tasks.push({ id: `c${Date.now()}`, n: v, w: 2, k: "", cat: "Your own", on: true, kind: "once", repeat: "Sat", date: DATE_OPTS[1], who: null });
    S.openCats["Your own"] = true;
    render();
    const c = document.querySelector(".content"); c.scrollTop = c.scrollHeight;
    toast("Added. Tap the size if it's bigger or smaller.");
  }
  if (kind === "person") {
    const tier = S._addTier || "main";
    S.people.push({ id: `p${Date.now()}`, name: v, tier, note: "Invite sent by text", cap: tier === "main" ? 5 : 2, invited: true });
    S._adding = false;
    render();
    toast(`Invite sent to ${v}`);
  }
});

document.addEventListener("input", (e) => {
  const r = e.target.closest("[data-range]");
  if (r) {
    const d = S.avail[+r.dataset.range];
    const was = d.h;
    d.h = +r.value;
    if (d.h && !d.when.length) d.when = ["eve"];
    r.style.setProperty("--p", `${d.h / 8 * 100}%`);
    const row = r.closest(".day");
    row.querySelector(".hrs").textContent = d.h ? `${d.h}${d.h === 8 ? "+" : ""}h` : "—";
    row.querySelector(".hrs").classList.toggle("zero", !d.h);
    document.querySelector(".week-total b").textContent = `${yourCap()}h / week`;
    if (!!was !== !!d.h) render(); // show/hide time-of-day row
    return;
  }
  const t = e.target.closest("[data-input]");
  if (t) {
    S[t.dataset.input] = t.value;
    const btn = document.querySelector(".footer .btn-primary");
    if (btn) btn.disabled = !t.value.trim();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeSheet();
});

/* ---------- Fit phone to window on desktop ---------- */

function fit() {
  const wrap = document.getElementById("phoneWrap");
  const phone = document.getElementById("phone");
  if (window.innerWidth <= 500) return;
  const s = Math.min(1, (window.innerHeight - 40) / 874);
  phone.style.transform = `scale(${s})`;
  wrap.style.width = `${402 * s}px`;
  wrap.style.height = `${874 * s}px`;
}
window.addEventListener("resize", fit);
fit();
render();
