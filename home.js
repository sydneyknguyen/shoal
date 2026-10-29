/* Shoal: Home as an overview, like a phone's home screen. A bright ombre, the family jars sitting
   straight on it, and a few widgets in different sizes that each open the screen with the detail.
   The old Home stays one tap away (the "Old look" pill). Uses helpers from main-app.js and kit.js. */

const homeOld = SCREENS.home;

function homeNew() {
  const urgent = active().filter(isUrgent).sort((a, b) => a.date.localeCompare(b.date));
  const finished = S.tasks.find((t) => t.done && t.doneAt && t.who !== "you" && !S.app.thanked[t.id] && !S.app.dismissed[t.id]);
  const week = mondayOf(iso(TODAY)), day = fromIso(S.app.day);
  const today = active().filter((t) => occurs(t, day)).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const all = mine("you"), left = all.filter((t) => !t.done), myUrgent = left.filter(isUrgent).length;
  const helpers = S.people.filter((p) => p.id !== "you"), invited = helpers.filter((p) => typeof pending === "function" && pending(p)).length;
  const go = `<span class="k-go" aria-hidden="true">${chev}</span>`;
  const head = (lab) => `<div class="k-tile-top"><span class="k-lab">${lab}</span>${go}</div>`;

  const jarW = `<button class="h-w" data-act="tab" data-to="myjar">${head("Your jar")}
    <div class="h-num">${kitRing(all.length ? (all.length - left.length) / all.length : 0, 46, 4)}<b>${left.length}</b></div>
    <p class="k-note">${left.length === 1 ? "task" : "tasks"} to do${myUrgent ? ` · <span class="st-urgent">${myUrgent} urgent</span>` : ""}</p></button>`;

  const out = hasKit() ? notCharging() : [];
  const charging = S.stones.length - out.length;
  const kitW = hasKit()
    ? `<button class="h-w h-kit" data-act="go" data-to="kit">${head("Home kit")}
        <div class="h-num">${kitRing(charging / S.stones.length, 46, 4)}<b>${charging}<small>/${S.stones.length}</small></b></div>
        <p class="k-note">${out.length ? `<span class="h-warn">${out.length} stone${out.length === 1 ? "" : "s"} off power</span>` : `Glow ${S.app.prefs.glow || "on"} · charging`}</p></button>`
    : `<button class="h-w" data-act="tab" data-to="peopleTab">${head("People")}
        <div class="h-avs">${helpers.slice(0, 4).map((p) => avatar(p, "s36")).join("")}</div>
        <p class="k-note">${helpers.length - invited} helping${invited ? ` · ${invited} invited` : ""}</p></button>`;

  return `<div class="home2">
  <div class="content app">
    <div class="apphead">${shoalMark(30)}<span class="head-btns">
      <button class="k-look" data-act="homeLook">Old look</button>
      <button class="bell" data-act="go" data-to="notifications" aria-label="Notifications">${icon("bell")}${unread() ? `<i class="dot"></i>` : ""}</button></span></div>
    <p class="eyebrow grey">${TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
    <h1 class="title">Good morning</h1>
    ${setupCard()}

    ${urgent.length ? `<button class="h-note" data-act="openTask" data-id="${urgent[0].id}" style="--u:${urgentHex()}">${gemOf(urgent[0], { size: "s" })}
        <span class="tl-txt"><span class="n">${esc(urgent[0].n)}</span><span class="m">Urgent · ${dueLabel(urgent[0])} · ${esc(nameOf(urgent[0].who))}${urgent.length > 1 ? ` · ${urgent.length - 1} more` : ""}</span></span>
        <span class="k-pill dark">Open</span></button>` : ""}
    ${finished ? `<div class="h-note done">${avatar(person(finished.who), "s28")}
        <span class="tl-txt"><span class="n">${esc(person(finished.who).name)} finished “${esc(finished.n)}”</span></span>
        <button class="k-pill" data-act="sayThanks" data-id="${finished.id}">Thank</button>
        <button class="x-btn" data-act="dismissThanks" data-id="${finished.id}" aria-label="Dismiss"><span aria-hidden="true">×</span></button></div>` : ""}

    <section class="h-jars" aria-label="Family jars">${familyJars()}</section>

    <div class="k-grid">${jarW}${kitW}</div>

    <section class="h-w wide" aria-label="This week">
      <div class="k-tile-top"><span class="k-lab">This week</span></div>
      ${active().length ? `${loadChart(week)}
        <div class="tlist flat">${today.length ? today.slice(0, S.app.weekAll ? 99 : 3).map((t) => taskLine(t)).join("") : `<p class="small empty">Nothing on ${DAY_FULL[dayKey(day)]}.</p>`}</div>
        ${today.length > 3 ? `<button class="k-link" data-act="weekAll">${S.app.weekAll ? "Show less" : `${today.length - 3} more`}</button>` : ""}`
        : `<p class="small empty">No tasks yet. Once you add some, your family's week shows here.</p>`}
    </section>
  </div>
  ${tabbar()}</div>`;
}

SCREENS.home = () => (S.app.homeLook === "old"
  ? homeOld().replace(`<span class="head-btns">`, `<span class="head-btns"><button class="k-look" data-act="homeLook">New look</button>`)
  : homeNew());

Object.assign(ACTIONS, {
  weekAll: () => { S.app.weekAll = !S.app.weekAll; render(); },
  homeLook: () => { S.app.homeLook = S.app.homeLook === "old" ? "new" : "old"; render(); },
});

NOTES.home = ["Home", ["An overview, like a phone's home screen: a bright ombre, the family jars, and widgets that each open the screen with the detail.",
  "Urgent and thank-you notes are banners at the top. Tap a jar to see that person.", "Widgets: your jar (how many left, ring is how much is done), the home kit (charging, and any stone off power), and this week (tap a day).",
  "The home kit widget is night blue like the kit screen, so you know where it goes. Without a kit, that spot shows who's helping.",
  "The pill at the top right switches to the old look to compare."]];
