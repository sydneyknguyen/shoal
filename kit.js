/* Shoal: a cleaner Home kit. Readings sit flat on the background, alerts are notifications, and
   tiles of different sizes are the things you change. The old screen stays one
   tap away (the "Old look" pill) so the two can be compared. Uses helpers from main-app.js and colors.js. */

const kitOld = SCREENS.kit;

// Three sizes, one rule. Readings sit flat on the background (nothing to tap). Tiles are things you
// change: the big one is the jars with their glow, two smaller ones are night hours and colors, and
// every tile has its control in the top right corner. Rarely used things are plain rows at the bottom.
function kitNew() {
  const P = S.app.prefs, g = P.glow || "on";
  const out = notCharging(), spares = S.stones.filter((s) => !s.out && !inJar(s));
  const charging = S.stones.length - out.length, paired = S.stones.filter((s) => s.task).length;
  const avg = Math.round(S.stones.reduce((n, s) => n + s.battery, 0) / S.stones.length);
  const c = stoneColors();
  const txt = (n, m) => `<span class="tl-txt"><span class="n">${n}</span>${m ? `<span class="m">${m}</span>` : ""}</span>`;
  const row = (inner, act, attrs = "") => `<button class="k-set" data-act="${act}" ${attrs}>${inner}${chev}</button>`;
  const [from, fromAm] = fmtTime(P.nightFrom).split(" "), to = fmtTime(P.nightTo);
  return `<div class="kit2">
  ${navtop("Home", `<button class="k-look" data-act="kitLook">Old look</button>`)}
  <div class="content">
    <h1 class="title">Home kit</h1>
    <p class="k-status"><i></i>Base connected</p>

    <div class="k-read" aria-label="Kit status">
      <span><b>${charging}<small>/${S.stones.length}</small></b>charging</span>
      <span><b>${avg}<small>%</small></b>avg battery</span>
      <span><b>${spares.length}</b>spares</span>
    </div>

    ${out.map((st) => `<button class="k-alert" data-act="openStone" data-id="${st.id}">
      <span class="k-alert-ic" aria-hidden="true">!</span>
      ${txt(`Stone ${String(st.id).padStart(2, "0")} is ${outLabel(st)}`, `${st.battery}% · not charging`)}
      <span class="k-pill dark">Find</span></button>`).join("")}

    <div class="k-tile k-hero">
      <div class="k-tile-top"><span class="k-lab">Glow</span>
        <div class="k-seg" role="radiogroup" aria-label="Glow">${[["on", "On"], ["dim", "Dim"], ["off", "Off"]].map(([k, l]) => `<button role="radio" class="${g === k ? "on" : ""}" aria-checked="${g === k}" data-act="setGlow" data-id="${k}">${l}</button>`).join("")}</div>
      </div>
      ${familyJars({ act: false })}
    </div>

    <div class="k-grid">
      <div class="k-tile">
        <div class="k-tile-top"><span class="k-lab">Night hours</span>${toggle(P.night, "pref", "night", "Night hours")}</div>
        ${P.night
          ? `<p class="k-big">${from}<small>${fromAm}</small></p><p class="k-note">until ${to}</p>
             <button class="k-link" data-act="nightSheet">Change ${chev}</button>`
          : `<p class="k-big">Off</p><p class="k-note">Stones glow all night</p>`}
      </div>
      <button class="k-tile" data-act="colorSheet">
        <div class="k-tile-top"><span class="k-lab">Stone colors</span><span class="k-go" aria-hidden="true">${chev}</span></div>
        <span class="k-stones">${COLOR_STATES.map((s) => gem(s, { size: "s" })).join("")}</span>
        <p class="k-note">${COLOR_STATES.map((s) => cap(PALETTE[c[s]].name)).join(" · ")}</p>
      </button>
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

NOTES.kit = ["Home kit", ["A test of a cleaner look. Readings (charging, battery, spares) sit flat on the background with nothing to tap. The off-power alert is a notification.",
  "White tiles are things you change, in three sizes: the jars with their glow, then night hours and colors, then plain rows for what you rarely need. Every tile has its control in the top right.",
  "The pill at the top right switches to the old look to compare.", "Everything physical lives here: glow, night hours, colors, the base, jars and every stone's battery."]];
