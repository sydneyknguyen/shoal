/* Shoal: a cleaner Home kit. One look per kind of thing: alerts are notifications, information sits
   flat on the background, settings are white rows with a switch or an arrow. The old screen stays one
   tap away (the "Old look" pill) so the two can be compared. Uses helpers from main-app.js and colors.js. */

const kitOld = SCREENS.kit;

// Three looks, one job each: an alert is a notification you act on, information sits flat on the
// background with nothing to tap, and every setting is a white row with a control or an arrow.
function kitNew() {
  const P = S.app.prefs, g = P.glow || "on";
  const out = notCharging(), spares = S.stones.filter((s) => !s.out && !inJar(s));
  const charging = S.stones.length - out.length, paired = S.stones.filter((s) => s.task).length;
  const avg = Math.round(S.stones.reduce((n, s) => n + s.battery, 0) / S.stones.length);
  const c = stoneColors();
  const row = (inner, act = "", attrs = "") => act
    ? `<button class="k-set" data-act="${act}" ${attrs}>${inner}${chev}</button>`
    : `<div class="k-set">${inner}</div>`;
  const txt = (n, m) => `<span class="tl-txt"><span class="n">${n}</span>${m ? `<span class="m">${m}</span>` : ""}</span>`;
  return `<div class="kit2">
  ${navtop("Home", `<button class="k-look" data-act="kitLook">Old look</button>`)}
  <div class="content">
    <h1 class="title">Home kit</h1>
    <p class="k-status"><i></i>Base connected · ${spares.length} spares charging</p>

    ${out.map((st) => `<button class="k-alert" data-act="openStone" data-id="${st.id}">
      <span class="k-alert-ic" aria-hidden="true">!</span>
      ${txt(`Stone ${String(st.id).padStart(2, "0")} is ${outLabel(st)}`, `${st.battery}% · not charging`)}
      <span class="k-pill dark">Find</span></button>`).join("")}

    <div class="k-glow">
      <span class="k-glow-lab">Glow</span>
      <div class="k-seg" role="radiogroup" aria-label="Glow">${[["on", "On"], ["dim", "Dim"], ["off", "Off"]].map(([k, l]) => `<button role="radio" class="${g === k ? "on" : ""}" aria-checked="${g === k}" data-act="setGlow" data-id="${k}">${l}</button>`).join("")}</div>
    </div>

    <section class="k-info" aria-label="Your jars">
      ${familyJars({ act: false })}
      <div class="k-stats">
        <span><b>${S.stones.length}</b>stones</span>
        <span><b>${charging}</b>charging</span>
        <span><b>${avg}%</b>avg battery</span>
      </div>
    </section>

    <div class="k-group">
      ${row(`${txt("Night hours", P.night ? `${fmtTime(P.nightFrom)} – ${fmtTime(P.nightTo)}` : "Glows all night")}${toggle(P.night, "pref", "night", "Night hours")}`)}
      ${P.night ? row(txt("Change night hours"), "nightSheet") : ""}
      ${row(`${txt("Stone colors", COLOR_STATES.map((s) => cap(PALETTE[c[s]].name)).join(" · "))}<span class="k-stones">${COLOR_STATES.map((s) => gem(s, { size: "xs" })).join("")}</span>`, "colorSheet")}
    </div>
    <div class="k-group">
      ${row(txt("All stones", `${paired} paired · ${KIT - paired} spare`), "go", 'data-to="stones"')}
      ${row(txt("Pair a stone"), "pairSheet")}
      ${row(txt("Setup guide"), "go", 'data-to="ready"')}
    </div>
    <button class="btn-text center" data-act="kitOff">Stop using the kit</button>
  </div></div>`;
}

SCREENS.kit = () => (S.app.kitLook === "old" ? kitOld().replace(navtop("Home"), navtop("Home", `<button class="k-look" data-act="kitLook">New look</button>`)) : kitNew());

Object.assign(ACTIONS, {
  kitLook: () => { S.app.kitLook = S.app.kitLook === "old" ? "new" : "old"; render(); },
});

NOTES.kit = ["Home kit", ["A test of a cleaner look. Each kind of thing has one look: the off-power alert is a notification, the jars and numbers sit flat on the background (nothing to tap), and every setting is a white row with a switch or an arrow.",
  "Glow is first, right above the jars, so you see it change.",
  "The pill at the top right switches to the old look to compare.", "Everything physical lives here: glow, night hours, colors, the base, jars and every stone's battery."]];
