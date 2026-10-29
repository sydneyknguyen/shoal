/* Shoal: a cleaner Home kit, styled like a smart-home device screen. Neutral surfaces, solid white
   tiles, status as big numbers, flat stones with no airbrushed glow. The old screen stays one tap
   away (the "Old look" pill) so the two can be compared. Uses helpers from main-app.js and colors.js. */

const kitOld = SCREENS.kit;
const BOLT = `<svg class="bolt" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" fill="currentColor"/></svg>`;
const pct = (n) => `${n}<small>%</small>`;

function kitNew() {
  const P = S.app.prefs, g = P.glow || "on";
  const main = S.people.filter((p) => p.tier === "main");
  const out = notCharging(), spares = S.stones.filter((s) => !s.out && !inJar(s));
  const charging = S.stones.length - out.length, paired = S.stones.filter((s) => s.task).length;
  const avg = Math.round(S.stones.reduce((n, s) => n + s.battery, 0) / S.stones.length);
  const c = stoneColors();
  const tile = (cls, inner, act = "", attrs = "") => act
    ? `<button class="k-tile ${cls}" data-act="${act}" ${attrs}>${inner}</button>`
    : `<div class="k-tile ${cls}">${inner}</div>`;
  return `<div class="kit2">
  ${navtop("Home", `<button class="k-look" data-act="kitLook">Old look</button>`)}
  <div class="content">
    <h1 class="title">Home kit</h1>
    <p class="k-status"><i class="${out.length ? "warn" : ""}"></i>${out.length ? `${out.length} stone off power` : "Everything is charging"}</p>

    <div class="k-tile k-hero">
      ${familyJars({ act: false })}
      <div class="k-stats">
        <span><b>${S.stones.length}</b><small>Stones</small></span>
        <span><b>${charging}</b><small>Charging</small></span>
        <span><b>${pct(avg)}</b><small>Avg battery</small></span>
      </div>
    </div>

    ${out.map((st) => `<button class="k-tile k-alert" data-act="openStone" data-id="${st.id}">
      <span class="k-lab"><i class="warn"></i>Stone ${String(st.id).padStart(2, "0")} · ${outLabel(st)}</span>
      <span class="k-row"><b class="k-big">${pct(st.battery)}</b><span class="k-note">Not charging. Put it back in a jar or on the base.</span><span class="k-pill dark">Find</span></span>
    </button>`).join("")}

    <div class="k-grid">
      ${tile("wide k-glow", `<span class="k-lab">Glow</span>
        <span class="k-row"><b class="k-big">${{ on: "On", dim: "Dim", off: "Off" }[g]}</b>
          <span class="k-seg">${[["on", "On"], ["dim", "Dim"], ["off", "Off"]].map(([k, l]) => `<button class="${g === k ? "on" : ""}" aria-pressed="${g === k}" data-act="setGlow" data-id="${k}">${l}</button>`).join("")}</span></span>`)}
      ${tile("k-night", `<span class="k-lab">Night hours ${toggle(P.night, "pref", "night", "Night hours")}</span>
        <b class="k-mid">${P.night ? `${fmtTime(P.nightFrom)} –<br>${fmtTime(P.nightTo)}` : "All night"}</b>
        <span class="k-note">${P.night ? `<button class="linkish" data-act="nightSheet">Change hours</button>` : "Stones glow until morning"}</span>`)}
      ${tile("k-colors", `<span class="k-lab">Stone colors</span>
        <span class="k-stones">${COLOR_STATES.map((s) => gem(s, { size: "s" })).join("")}</span>
        <span class="k-note">${COLOR_STATES.map((s) => cap(PALETTE[c[s]].name)).join(" · ")}</span>`, "colorSheet")}
      ${tile("k-base", `<span class="k-lab">Base</span><b class="k-mid">Connected</b><span class="k-note">${BOLT} ${spares.length} spare stone${spares.length === 1 ? "" : "s"} charging</span>`)}
      ${tile("k-all", `<span class="k-lab">Stones</span><b class="k-mid">${paired} paired</b><span class="k-note">${KIT - paired} spare · see all</span>`, "go", 'data-to="stones"')}
    </div>

    <p class="k-head">Jars</p>
    <div class="k-tile k-list">${main.map((p) => `<div class="k-li">${avatar(p, "s36")}<span class="tl-txt"><span class="n">${p.id === "you" ? "Your jar" : `${esc(p.name)}'s jar`}</span><span class="m">${mine(p.id).length} stones</span></span><span class="k-chg">${BOLT}Charging</span></div>`).join("")}</div>

    <div class="k-actions">
      <button class="k-pill dark big" data-act="pairSheet">Pair a stone</button>
      <button class="k-pill big" data-act="go" data-to="ready">Setup guide</button>
    </div>
    <button class="btn-text center" data-act="kitOff">Stop using the kit</button>
  </div></div>`;
}

SCREENS.kit = () => (S.app.kitLook === "old" ? kitOld().replace(navtop("Home"), navtop("Home", `<button class="k-look" data-act="kitLook">New look</button>`)) : kitNew());

Object.assign(ACTIONS, {
  kitLook: () => { S.app.kitLook = S.app.kitLook === "old" ? "new" : "old"; render(); },
});

NOTES.kit = ["Home kit", ["A test of a cleaner look, styled like a smart-home device screen: neutral background, solid white tiles, status as big numbers, and flat stones with no glow halo.",
  "The pill at the top right switches to the old look to compare.", "Everything physical lives here: glow, night hours, colors, the base, jars and every stone's battery."]];
