/* Shoal: the loved one's care page. One place for what everyone needs to know: allergies and wishes,
   every medication with a shared dose log, needs, and preferences. Anyone in the family can update it.
   Med tasks (Morning meds, Comfort meds) show their own meds from here. Loaded after main-app.js and home.js. */

APP_SCREENS.add("care");
APP_NAV.splice(APP_NAV.indexOf("resources"), 0, "care");

/* ---------- Data ---------- */

const clock = (ms) => new Date(ms).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
function ago(ms) {
  const m = Math.max(0, Math.round((Date.now() - ms) / 6e4));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60), r = m % 60;
  return `${h} hr${r ? ` ${r} min` : ""} ago`;
}
// Today at a clock time, or yesterday if that hasn't happened yet.
const todayAt = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d > Date.now() ? +d - 864e5 : +d; };

const CARE_SECTIONS = [["key", "Most important"], ["needs", "Needs"], ["prefs", "Preferences"]];

function makeCare() {
  if (!S.app.demo) return { meds: [], doses: [], key: [], needs: [], prefs: [] };
  const l = L();
  return {
    // prn: as needed, at least `every` hours apart. Otherwise a daily med, given `at` a set time.
    meds: [
      { id: "morphine", name: "Morphine", amt: "5 mg", how: "0.25 mL under the tongue", why: "for pain or hard breathing", prn: true, every: 4 },
      { id: "lorazepam", name: "Lorazepam", amt: "0.5 mg", how: "1 tablet, dissolved under the tongue", why: "for anxiety or restlessness", prn: true, every: 6 },
      { id: "metoprolol", name: "Metoprolol", amt: "25 mg", how: "1 tablet with breakfast", why: "for his heart", at: "8 AM", every: 20 },
      { id: "senna", name: "Senna", amt: "2 tablets", how: "with water at bedtime", why: "morphine can cause constipation", at: "9 PM", every: 20 },
    ],
    doses: [
      { med: "morphine", who: "bill", at: Date.now() - 7.2 * 36e5 },
      { med: "lorazepam", who: "mom", at: Date.now() - 6.5 * 36e5 },
      { med: "metoprolol", who: "mom", at: todayAt(8, 10) },
      { med: "morphine", who: "mom", at: Date.now() - 2.4 * 36e5 },
    ],
    key: [
      { k: "Allergies", v: "Penicillin (hives). Codeine makes him sick to his stomach.", by: "mom", when: "Sep 30", alert: true },
      { k: "Wishes", v: `Comfort care only. ${l} doesn't want CPR (DNR). The signed form is on the fridge.`, by: "mom", when: "Sep 30" },
      { k: "Pharmacy", v: "CVS on Saratoga Ave · (408) 555-0110. Hospice delivers the comfort kit.", by: "you", when: "Oct 2" },
    ],
    needs: [
      { k: "Moving", v: "Needs two people to get out of bed. The gait belt is in the hall closet.", by: "mom", when: "Mon" },
      { k: "Eating and drinking", v: "Soft foods, small bites. Thickened water only, small sips.", by: "mom", when: "Tue" },
      { k: "Skin", v: "Turn him every 2 to 3 hours. Lotion on his heels and elbows.", by: "bill", when: "Sun" },
      { k: "Bathroom", v: "Wears briefs. Supplies are under the bathroom sink.", by: "mom", when: "Sep 30" },
    ],
    prefs: [
      { k: "Likes", v: "Jazz on the radio, the window open a crack, cold ginger ale.", by: "sam", when: "Sat" },
      { k: "Doesn't like", v: "Loud TV. Being rushed in the morning.", by: "mom", when: "Mon" },
      { k: "Comfort", v: "A cool cloth on his forehead. Someone holding his hand.", by: "mom", when: "Tue" },
      { k: "Visits", v: "Sam's video call at 7 PM. Pastor Jim on Sundays after church.", by: "you", when: "Oct 4" },
    ],
  };
}
const care = () => (S.app.care ??= makeCare());
const medOf = (id) => care().meds.find((m) => m.id === id);
const lastDose = (id) => care().doses.filter((x) => x.med === id).sort((a, b) => b.at - a.at)[0];
const nextOk = (m) => { const l = lastDose(m.id); return l ? l.at + m.every * 36e5 : 0; };
const whoName = (id) => (id === "you" ? "you" : nameOf(id));

/* ---------- Lock: a PIN or Face ID, primary caregivers only ---------- */

// Only the main caregivers can open the care page; the trusted circle, kids and volunteers never see it.
// It stays open for 5 minutes after unlocking, then locks again. The demo family's PIN is 1234.
const LOCK_MS = 5 * 6e4;
const carePin = () => S.app.carePin ?? (S.app.demo ? "1234" : null);
const careUnlocked = () => S.app.careAt && Date.now() - S.app.careAt < LOCK_MS;
const primaries = () => namesList(S.people.filter((p) => p.tier === "main" && p.id !== "you").map((p) => p.id).concat("you")).replace(/\bYou\b/, "you");

function pinPad() {
  const setting = !carePin() || S.app.pinMode === "set";
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "face", "0", "del"];
  return `<div class="pin">
    <p class="pin-msg" aria-live="polite">${setting ? "Choose a 4-digit PIN" : "Enter your PIN"}</p>
    <div class="pin-dots" aria-hidden="true">${[0, 1, 2, 3].map(() => "<i></i>").join("")}</div>
    <div class="pin-keys">${keys.map((k) => k === "face"
      ? (setting ? "<span></span>" : `<button class="pin-face" data-act="faceId" aria-label="Use Face ID"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 9.5v1M15 9.5v1M12 9.5V13h-1M9.5 15.5a3.5 3.5 0 0 0 5 0"/></svg></button>`)
      : k === "del" ? `<button class="pin-del" data-act="pinKey" data-id="del" aria-label="Delete">⌫</button>`
      : `<button data-act="pinKey" data-id="${k}">${k}</button>`).join("")}</div>
  </div>`;
}
function unlockCare(how) {
  S.app.careAt = Date.now();
  S.app.pinIn = "";
  closeSheet();
  render();
  toast(how === "face" ? "Unlocked with Face ID" : "Unlocked for 5 minutes");
}

/* ---------- Medications ---------- */

// Each med shows its dose big and bold, when it was last given and by whom, and when the next is okay.
function medRow(m) {
  const l = lastDose(m.id), next = nextOk(m), early = next > Date.now();
  const status = m.prn
    ? (l ? `Last given <b>${clock(l.at)}</b> by ${esc(whoName(l.who))} · ${ago(l.at)}<br>${early ? `Next dose okay after <b>${clock(next)}</b>` : "Okay to give now if needed"}` : "Not given yet")
    : (early ? `Given today at <b>${clock(l.at)}</b> by ${esc(whoName(l.who))}` : `Due at <b>${m.at}</b>`);
  return `<div class="med">
    <p class="med-dose">${esc(m.amt)} <span>${esc(m.name)}</span></p>
    <p class="med-how">${esc(m.how)} · ${esc(m.why)} · ${m.prn ? `as needed, at least ${m.every} hours apart` : `every day at ${m.at}`}</p>
    <p class="med-last ${early && m.prn ? "wait" : ""} ${early && !m.prn ? "given" : ""}">${status}</p>
    <button class="btn-soft med-btn" data-act="logDose" data-id="${m.id}">I gave ${esc(m.amt)} of ${esc(m.name.toLowerCase())}</button>
  </div>`;
}

// On a med task, just that task's meds, with a way to the full care page.
function medCard(t) {
  const meds = (t.medIds || []).map(medOf).filter(Boolean);
  if (!meds.length) return "";
  if (!careUnlocked()) return `<div class="card med-card med-locked">
    <span class="lock-ico" aria-hidden="true">${LOCK_SVG}</span>
    <span class="tl-txt"><span class="n">Doses are locked</span></span>
    <button class="pill-btn" data-act="unlockSheet">Unlock</button></div>`;
  return `<div class="card med-card">
    <div class="meter-top"><b>Doses</b><button class="linkish" data-act="doseLog">Full log</button></div>
    ${meds.map(medRow).join("")}
    <button class="srow care-link" data-act="go" data-to="care"><span class="tl-txt"><span class="n">All of ${esc(possessive({ name: L() }))} care</span><span class="m">Every med, allergies, needs and preferences</span></span>${chev}</button>
  </div>`;
}

function saveDose(id) {
  const m = medOf(id);
  care().doses.push({ med: id, who: "you", at: Date.now() });
  closeSheet();
  render();
  const others = S.people.filter((p) => p.id !== "you" && p.tier === "main").map((p) => p.id);
  toast(`Logged ${m.amt} ${m.name.toLowerCase()} at ${clock(Date.now())}.${others.length ? ` ${namesList(others)} ${others.length === 1 ? "was" : "were"} told.` : ""}`);
}

/* ---------- The care page ---------- */

const careRow = (sec, x, i) => `<button class="srow care-row ${x.alert ? "alert" : ""}" data-act="careEdit" data-id="${sec}:${i}">
  <span class="tl-txt"><span class="care-k">${x.alert ? `<i class="care-flag" aria-hidden="true">!</i>` : ""}${esc(x.k)}</span><span class="care-v">${esc(x.v)}</span><span class="m">${esc(cap(whoName(x.by)))} · ${esc(x.when)}</span></span>${chev}</button>`;
const careAdd = (sec, label) => `<button class="srow care-add" data-act="careEdit" data-id="${sec}:new"><span class="care-plus" aria-hidden="true">+</span><span class="tl-txt"><span class="n">${label}</span></span></button>`;

const LOCK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>`;

SCREENS.care = () => {
  if (!careUnlocked() || S.app.pinMode === "set") return `${navtop("Back")}
  <div class="content care-lock">
    <span class="lock-big" aria-hidden="true">${LOCK_SVG}</span>
    <h1 class="title">${S.app.pinMode === "set" ? "New PIN" : `${esc(possessive({ name: L() }))} care`}</h1>
    <p class="sub">Primary caregivers only</p>
    ${pinPad()}
  </div>`;
  const c = care();
  const sec = (key, title, add) => `<p class="section-h">${title}</p>
    <div class="card tlist">${c[key].map((x, i) => careRow(key, x, i)).join("")}${careAdd(key, add)}</div>`;
  return `${navtop("Back", `<button class="pill-btn lock-btn" data-act="lockCare">${LOCK_SVG}Lock</button>`)}
  <div class="content care-page">
    <h1 class="title">${esc(possessive({ name: L() }))} care</h1>
    <p class="sub">Tap anything to update it.</p>
    ${sec("key", "Most important", "Add something important")}
    <p class="section-h">Medications ${c.doses.length ? `<button class="linkish" data-act="doseLog">Dose log</button>` : ""}</p>
    <div class="card med-card">${c.meds.map(medRow).join("") || `<p class="small empty">No medications yet.</p>`}${careAdd("meds", "Add a medication")}</div>
    ${sec("needs", "Needs", "Add a need")}
    ${sec("prefs", "Preferences", "Add a preference")}
    <p class="small center">Primary caregivers only · locks after 5 minutes</p>
  </div>`;
};

// Home: the next doses at a glance, and allergies, one tap from the full page.
function careWidget() {
  if (!S.app.demo && !care().meds.length && !care().key.length) return `<button class="h-w wide h-care" data-act="go" data-to="care">
    <div class="k-tile-top"><span class="k-lab">${esc(possessive({ name: L() }))} care</span><span class="k-go" aria-hidden="true">${chev}</span></div>
    <p class="k-note">Add meds, allergies, needs and what ${esc(L())} likes, so everyone has them.</p></button>`;
  if (!careUnlocked()) return `<button class="h-w wide h-care" data-act="go" data-to="care">
    <div class="k-tile-top"><span class="k-lab">${esc(possessive({ name: L() }))} care</span><span class="k-go" aria-hidden="true">${chev}</span></div>
    <p class="hc-locked"><span class="lock-ico" aria-hidden="true">${LOCK_SVG}</span>Locked</p></button>`;
  const prn = care().meds.filter((m) => m.prn), allergy = care().key.find((x) => x.alert);
  return `<button class="h-w wide h-care" data-act="go" data-to="care">
    <div class="k-tile-top"><span class="k-lab">${esc(possessive({ name: L() }))} care</span><span class="k-go" aria-hidden="true">${chev}</span></div>
    ${prn.map((m) => { const n = nextOk(m), early = n > Date.now(); return `<div class="hc-med"><b>${esc(m.name)} ${esc(m.amt)}</b><span class="${early ? "wait" : ""}">${early ? `Okay after ${clock(n)}` : "Okay now if needed"}</span></div>`; }).join("")}
    ${allergy ? `<p class="hc-alert"><i class="care-flag" aria-hidden="true">!</i>Allergic: ${esc(allergy.v.split(".")[0])}</p>` : ""}
  </button>`;
}
const homeCare = SCREENS.home;
SCREENS.home = () => {
  const h = homeCare();
  return S.app.homeLook === "old" ? h : h.replace(`<section class="h-w wide" aria-label="This week">`, `${careWidget()}<section class="h-w wide" aria-label="This week">`);
};

/* ---------- Actions ---------- */

Object.assign(ACTIONS, {
  unlockSheet: () => { S.app.pinIn = ""; openSheet(`<h3>Unlock doses</h3>${pinPad()}`); },
  pinKey: (d) => {
    const pad = document.querySelector("#sheet .pin") || document.querySelector(".pin");
    let v = S.app.pinIn || "";
    v = d.id === "del" ? v.slice(0, -1) : (v + d.id).slice(0, 4);
    S.app.pinIn = v;
    pad.querySelectorAll(".pin-dots i").forEach((dot, i) => dot.classList.toggle("on", i < v.length));
    if (v.length < 4) return;
    if (!carePin() || S.app.pinMode === "set") {
      S.app.carePin = v; S.app.pinMode = null;
      setTimeout(() => { unlockCare(); toast("PIN saved. Share it only with the primary caregivers."); }, 200);
      return;
    }
    if (v === carePin()) { setTimeout(() => unlockCare(), 200); return; }
    S.app.pinIn = "";
    pad.classList.remove("shake"); void pad.offsetWidth; pad.classList.add("shake");
    pad.querySelector(".pin-msg").textContent = "That's not it. Try again.";
    setTimeout(() => pad.querySelectorAll(".pin-dots i").forEach((dot) => dot.classList.remove("on")), 350);
  },
  faceId: () => {
    const pad = document.querySelector("#sheet .pin") || document.querySelector(".pin");
    pad.querySelector(".pin-msg").textContent = "Looking for your face…";
    setTimeout(() => unlockCare("face"), 700);
  },
  lockCare: () => { S.app.careAt = 0; render(); toast("Locked"); },
  careLockSheet: () => openSheet(`<h3>Care page lock</h3>
    <p class="small">Only ${esc(primaries())} can open it. Locks after 5 minutes.</p>
    <div class="actions col"><button class="btn-soft" data-act="changePin">${carePin() ? "Change PIN" : "Set a PIN"}</button><button class="btn-soft" data-act="lockNow">Lock now</button></div>`),
  changePin: () => { S.app.pinMode = "set"; S.app.pinIn = ""; closeSheet(); go("care"); },
  lockNow: () => { S.app.careAt = 0; closeSheet(); toast("Locked"); },
  // Logging a dose checks the last one first, so two people don't both give it.
  logDose: (d) => {
    const m = medOf(d.id), l = lastDose(m.id), next = nextOk(m);
    if (next > Date.now()) {
      openSheet(m.prn
        ? `<p class="eyebrow">Check before giving</p><h3>${esc(m.name)} was given ${ago(l.at)}</h3>
          <p class="small">${esc(cap(whoName(l.who)))} gave it at ${clock(l.at)}. Next dose okay after ${clock(next)}. Call hospice before giving more.</p>
          <div class="actions col"><button class="btn-soft" data-act="closeSheet">Don't log it</button><button class="btn-soft" data-act="go" data-to="resources">Call hospice</button><button class="linkish" data-act="saveDose" data-id="${m.id}">Hospice said okay, log it anyway</button></div>`
        : `<p class="eyebrow">Already given</p><h3>${esc(m.name)} was given today</h3>
          <p class="small">${esc(cap(whoName(l.who)))} gave it at ${clock(l.at)}. Once a day.</p>
          <div class="actions col"><button class="btn-soft" data-act="closeSheet">Okay</button><button class="linkish" data-act="saveDose" data-id="${m.id}">Log another dose anyway</button></div>`);
      return;
    }
    openSheet(`<p class="eyebrow">Log a dose</p><h3>${esc(m.amt)} of ${esc(m.name.toLowerCase())}</h3>
      <p class="small">${esc(cap(m.how))} · ${clock(Date.now())}</p>
      <div class="actions"><button class="btn-soft" data-act="closeSheet">Cancel</button><button class="btn-soft" data-act="saveDose" data-id="${m.id}">I gave it</button></div>`);
  },
  saveDose: (d) => saveDose(d.id),
  doseLog: () => {
    const list = [...care().doses].sort((a, b) => b.at - a.at);
    openSheet(`<h3>Dose log</h3>
      <div class="dose-log">${list.map((x) => { const m = medOf(x.med); return `<div class="dl-row">${avatar(person(x.who) || { name: "?" }, "s28")}<span class="tl-txt"><span class="n">${esc(m.amt)} ${esc(m.name.toLowerCase())}</span><span class="m">${esc(cap(whoName(x.who)))} · ${clock(x.at)} · ${ago(x.at)}</span></span>${x.who === "you" ? `<button class="linkish" data-act="undoDose" data-id="${x.at}">Remove</button>` : ""}</div>`; }).join("") || `<p class="small empty">No doses logged yet.</p>`}</div>
      <div class="actions"><button class="btn-soft" data-act="closeSheet">Done</button></div>`);
  },
  undoDose: (d) => { care().doses = care().doses.filter((x) => String(x.at) !== d.id); ACTIONS.doseLog(); render(); toast("Removed. Everyone sees the change."); },

  // Edit a row, or add one. Meds get their own short form.
  careEdit: (d) => {
    const [sec, i] = d.id.split(":");
    if (sec === "meds") {
      S.app.medKind = "prn";
      openSheet(`<h3>Add a medication</h3>
        <div class="care-form">
          <label>Name<input id="cm-name" placeholder="Morphine"></label>
          <label>Dose<input id="cm-amt" placeholder="5 mg"></label>
          <label>How to give it<input id="cm-how" placeholder="0.25 mL under the tongue"></label>
          <span class="care-kind"><button class="chip on" data-act="medKind" data-id="prn">As needed</button><button class="chip" data-act="medKind" data-id="daily">Every day</button></span>
          <label class="cm-every">Hours apart, at least<input id="cm-every" type="number" inputmode="numeric" value="4" min="1"></label>
        </div>
        <div class="actions"><button class="btn-soft" data-act="closeSheet">Cancel</button><button class="btn-soft" data-act="saveMed">Add</button></div>`);
      return;
    }
    const x = i === "new" ? null : care()[sec][+i];
    openSheet(`<h3>${x ? esc(x.k) : "Add to " + CARE_SECTIONS.find(([k]) => k === sec)[1].toLowerCase()}</h3>
      ${x ? `<p class="small">${esc(cap(whoName(x.by)))} · ${esc(x.when)}</p>` : ""}
      <div class="care-form">${x ? "" : `<label>Title<input id="ce-k" placeholder="${sec === "prefs" ? "Music" : sec === "needs" ? "Sleep" : "Doctor"}"></label>`}
        <label>${x ? "Details" : "What should everyone know?"}<textarea id="ce-v" rows="4">${x ? esc(x.v) : ""}</textarea></label></div>
      <div class="actions">${x && !x.alert ? `<button class="btn-soft" data-act="careRemove" data-id="${d.id}">Remove</button>` : `<button class="btn-soft" data-act="closeSheet">Cancel</button>`}<button class="btn-soft" data-act="careSave" data-id="${d.id}">Save</button></div>`);
  },
  careSave: (d) => {
    const [sec, i] = d.id.split(":");
    const v = document.getElementById("ce-v").value.trim(), k = document.getElementById("ce-k")?.value.trim();
    if (!v || (i === "new" && !k)) { toast(i === "new" && !k ? "Add a title first" : "Write something first"); return; }
    if (i === "new") care()[sec].push({ k, v, by: "you", when: "Just now" });
    else Object.assign(care()[sec][+i], { v, by: "you", when: "Just now" });
    closeSheet(); render(); toast("Saved. Everyone sees the change.");
  },
  careRemove: (d) => {
    const [sec, i] = d.id.split(":");
    care()[sec].splice(+i, 1);
    closeSheet(); render(); toast("Removed");
  },
  medKind: (d) => {
    S.app.medKind = d.id;
    document.querySelectorAll(".care-kind .chip").forEach((b) => b.classList.toggle("on", b.dataset.id === d.id));
    document.querySelector(".cm-every").innerHTML = d.id === "prn"
      ? `Hours apart, at least<input id="cm-every" type="number" inputmode="numeric" value="4" min="1">`
      : `Time of day<input id="cm-at" placeholder="8 AM">`;
  },
  saveMed: () => {
    const val = (id) => document.getElementById(id)?.value.trim() || "";
    const name = val("cm-name"), amt = val("cm-amt");
    if (!name || !amt) { toast("Add the name and dose"); return; }
    const prn = S.app.medKind === "prn";
    care().meds.push({ id: `m${Date.now()}`, name: cap(name), amt, how: val("cm-how") || "as directed", why: "added by you", prn, every: prn ? +val("cm-every") || 4 : 20, at: prn ? "" : val("cm-at") || "8 AM" });
    closeSheet(); render(); toast(`${cap(name)} added. Everyone sees it.`);
  },
});

NOTES.care = [`${"Dad"}'s care`, [
  "One place for what everyone needs to know: allergies and wishes, every medication, needs, and preferences. Opened from Home, People, and any med task.",
  "Each med shows the dose big and bold, who gave the last one and when, and when the next is okay. \"I gave it\" logs the time and tells everyone. Logging too soon asks you to check with hospice first, so no one doubles up on morphine or lorazepam.",
  "Every note says who last changed it and when. Tap one to edit it, or add your own.",
  "Private: only the primary caregivers can open it, with a PIN or Face ID, and it locks again after 5 minutes. Locked, Home and med tasks show that it's there but not what's in it. Demo PIN: 1234.",
  "Pebble never reads this page.",
]];
