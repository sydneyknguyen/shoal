/* Shoal: thank-you cards. Like a gift card: pick a theme, write your own short note right on the
   card, and send it in Shoal or text them a link to it. Texting opens an iOS Messages sheet with the
   card's link preview, so it's clear what they'll get. No call option: a call can't carry the card.
   Loaded after cheer.js; replaces the thanks screen and sendThanks from main-app.js. */

const CARD_THEMES = [["stones", "Stones"], ["sunrise", "Sunrise"], ["bloom", "Bloom"], ["tea", "Tea"], ["stars", "Stars"]];
const STAR = "M12 0c1 7.6 4.4 11 12 12-7.6 1-11 4.4-12 12-1-7.6-4.4-11-12-12C7.6 11 11 7.6 12 0z";

// Each theme is a small illustration in Shoal's palette. Drawn in SVG so it scales from swatch to card.
function themeArt(k) {
  const svg = (inner) => `<svg viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
  const star = (x, y, s, fill) => `<path d="${STAR}" fill="${fill}" transform="translate(${x} ${y}) scale(${s / 24})"/>`;
  const stone = (x, y, w, grad, glow) => `<ellipse cx="${x}" cy="${y + w * 0.32}" rx="${w * 0.95}" ry="${w * 0.5}" fill="${glow}" opacity=".5" filter="url(#bl)"/>
    <path d="M${x - w / 2} ${y + w * 0.36}c0-${w * 0.44} ${w * 0.22}-${w * 0.7} ${w / 2}-${w * 0.7}s${w / 2} ${w * 0.26} ${w / 2} ${w * 0.7}z" fill="url(#${grad})"/>`;
  const defs = (g) => `<defs><filter id="bl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>${g}</defs>`;
  return {
    stones: svg(`${defs(`<linearGradient id="sb" x2="0" y2="1"><stop offset="0" stop-color="#244a80"/><stop offset="1" stop-color="#0f2142"/></linearGradient>
        <radialGradient id="g1" cx=".4" cy=".3"><stop offset="0" stop-color="#fff4cf"/><stop offset="1" stop-color="#e0a93c"/></radialGradient>
        <radialGradient id="g2" cx=".4" cy=".3"><stop offset="0" stop-color="#f1f7ff"/><stop offset="1" stop-color="#6fa3d6"/></radialGradient>
        <radialGradient id="g3" cx=".4" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#cfd6e0"/></radialGradient>`)}
      <rect width="300" height="130" fill="url(#sb)"/>
      ${stone(112, 70, 54, "g2", "#6fa3d6")}${stone(170, 62, 66, "g1", "#f3c56a")}${stone(222, 80, 40, "g3", "#ffffff")}
      ${star(60, 26, 14, "#f3c56a")}${star(250, 20, 10, "#b9d3fb")}`),
    sunrise: svg(`${defs(`<linearGradient id="sr" x2="0" y2="1"><stop offset="0" stop-color="#ffd9a6"/><stop offset=".7" stop-color="#fde9bd"/><stop offset="1" stop-color="#fff6e6"/></linearGradient>`)}
      <rect width="300" height="130" fill="url(#sr)"/>
      ${[...Array(9)].map((_, i) => { const a = Math.PI * (i + 1) / 10; return `<line x1="${150 - Math.cos(a) * 52}" y1="${96 - Math.sin(a) * 52}" x2="${150 - Math.cos(a) * 74}" y2="${96 - Math.sin(a) * 74}" stroke="#f0b84a" stroke-width="4" stroke-linecap="round"/>`; }).join("")}
      <circle cx="150" cy="96" r="40" fill="#f3b54a"/>
      <path d="M0 100c60-26 110-10 160 4s100 6 140-10v36H0z" fill="#e6a35a" opacity=".55"/><path d="M0 112c70-18 140 0 190 6s80-2 110-10v22H0z" fill="#d98c4e" opacity=".7"/>`),
    bloom: svg(`${defs("")}<rect width="300" height="130" fill="#fbe3e6"/>
      ${[[70, 70, 26, "#f4a3b4"], [150, 58, 34, "#f6c2a0"], [228, 74, 24, "#c7b6ef"]].map(([x, y, r, c]) => `<path d="M${x} ${y + r * 0.6}q-4 30 2 56" stroke="#7fae8c" stroke-width="4" fill="none"/>
        ${[0, 72, 144, 216, 288].map((d) => `<ellipse cx="${x}" cy="${y - r * 0.55}" rx="${r * 0.42}" ry="${r * 0.6}" fill="${c}" transform="rotate(${d} ${x} ${y})"/>`).join("")}<circle cx="${x}" cy="${y}" r="${r * 0.32}" fill="#f3c56a"/>`).join("")}
      ${star(30, 18, 10, "#fff")}${star(268, 22, 12, "#fff")}`),
    tea: svg(`${defs("")}<rect width="300" height="130" fill="#f3ece1"/>
      <circle cx="150" cy="78" r="64" fill="#e9dcc7"/>
      <path d="M118 62h64v30a24 24 0 0 1-24 24h-16a24 24 0 0 1-24-24z" fill="#2070d9"/><path d="M182 70h8a12 12 0 0 1 0 24h-8" stroke="#2070d9" stroke-width="7" fill="none"/>
      <path d="M150 96s-12-7-12-15a6.5 6.5 0 0 1 12-3 6.5 6.5 0 0 1 12 3c0 8-12 15-12 15z" fill="#fff"/>
      ${[134, 150, 166].map((x, i) => `<path d="M${x} 52c-7-8 7-12 0-22" stroke="#b9a68a" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="${0.5 + i * 0.15}"/>`).join("")}`),
    stars: svg(`${defs(`<linearGradient id="st" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#3a3f9e"/><stop offset="1" stop-color="#1b2a5e"/></linearGradient>`)}
      <rect width="300" height="130" fill="url(#st)"/>
      ${star(138, 34, 46, "#f3c56a")}${star(98, 22, 18, "#fff")}${star(200, 70, 24, "#b9d3fb")}${star(52, 74, 12, "#f3c56a")}${star(246, 26, 14, "#fff")}
      ${[[30, 30], [80, 104], [180, 18], [262, 96], [222, 112], [120, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fff" opacity=".7"/>`).join("")}`),
  }[k];
}

const cardTheme = () => S.app.thankTheme || "stones";
const firstName = (p) => p.name.split(" ")[0];

SCREENS.thanks = () => {
  const f = S.app.thankFor, p = person(f.who), first = firstName(p), th = cardTheme();
  const via = S.app.thankVia === "text" ? "text" : "app";
  return `${navtop("")}
  <div class="content thanks2">
    <p class="eyebrow grey">${esc(first)} finished something</p>
    <h1 class="title">Make ${esc(first)} a card</h1>
    <p class="small">For “${esc(f.n)}” · ${esc(f.when)}</p>

    <div class="ty-card" data-theme="${th}">
      <div class="ty-art">${themeArt(th)}</div>
      <div class="ty-paper">
        <span class="ty-to">${esc(first)},</span>
        <textarea class="ty-note" data-input="thanksNote" maxlength="160" rows="3" aria-label="Your note" placeholder="Write a short note in your own words…">${esc(S.app.thanksNote)}</textarea>
        <span class="ty-from">From ${esc(inviter())}</span>
      </div>
    </div>

    <p class="section-h left">Theme</p>
    <div class="ty-themes" role="radiogroup" aria-label="Card theme">${CARD_THEMES.map(([k, l]) => `<button role="radio" aria-checked="${k === th}" class="${k === th ? "on" : ""}" data-act="thankTheme" data-id="${k}"><span class="ty-sw">${themeArt(k)}</span><em>${l}</em></button>`).join("")}</div>

    <div class="card tlist left"><div class="srow"><span class="tl-txt"><span class="n">Share with the family</span><span class="m">They see that you said thanks, not your note</span></span>${toggle(S.app.shareThanks, "shareThanks", "", "Share with the family")}</div></div>

    <p class="section-h left">Send it</p>
    <div class="seg big thank-via">${[["app", "In Shoal"], ["text", "Text a link"]].map(([k, l]) => `<button class="${via === k ? "on" : ""}" aria-pressed="${via === k}" data-act="thankVia" data-id="${k}">${l}</button>`).join("")}</div>
    <p class="small ty-how">${via === "app" ? `${esc(first)} opens the card in Shoal, and their jar glows softly. No reply needed.` : `Opens Messages with a link to the card and your note. ${esc(first)} can open it without the app.`}</p>
  </div>
  ${solo(via === "app" ? "Send card" : `Text ${esc(first)} the card`, "sendThanks")}`;
};

/* ---------- Texting the card: an iOS Messages sheet ---------- */

function messagesSheet(f) {
  const p = person(f.who), first = firstName(p), note = S.app.thanksNote.trim();
  const code = (f.code ||= Math.random().toString(36).slice(2, 6).toUpperCase());
  document.querySelector(".imsg")?.remove();
  const el = document.createElement("div");
  el.className = "imsg";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "New message");
  el.innerHTML = `<div class="im-sheet">
    <div class="im-grab"></div>
    <div class="im-top"><button class="im-cancel" data-act="imCancel">Cancel</button><b>New Message</b><span></span></div>
    <div class="im-to"><span>To:</span><span class="im-chip">${esc(p.name)}</span></div>
    <div class="im-thread">
      <p class="im-meta">iMessage</p>
      <div class="im-out">
        <div class="im-link"><span class="im-art">${themeArt(cardTheme())}</span><span class="im-cap"><b>A thank-you card from ${esc(inviter())}</b><small>shoal.app/t/${code}</small></span></div>
        ${note ? `<p class="im-bub">${esc(note)}</p>` : ""}
        <p class="im-meta right im-deliv">Delivered</p>
      </div>
    </div>
    <div class="im-bar"><span class="im-plus" aria-hidden="true">+</span>
      <div class="im-field"><div class="im-link sm"><span class="im-art">${themeArt(cardTheme())}</span><span class="im-cap"><b>A thank-you card from ${esc(inviter())}</b><small>shoal.app/t/${code}</small></span></div>
        <span class="im-text">${note ? esc(note) : `<span class="im-ph">iMessage</span>`}</span></div>
      <button class="im-send" data-act="imSend" aria-label="Send"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    </div>
  </div>`;
  document.getElementById("phone").appendChild(el);
  requestAnimationFrame(() => el.classList.add("open"));
}

const closeMessages = () => {
  const el = document.querySelector(".imsg");
  if (!el) return;
  el.classList.remove("open");
  setTimeout(() => el.remove(), 380);
};

Object.assign(ACTIONS, {
  sendThanks: () => (S.app.thankVia === "text" ? messagesSheet(S.app.thankFor) : celebrateThanks(S.app.thankFor, "app")),
  thankVia: (d) => { S.app.thankVia = d.id; render(); },
  // The new theme fades in over the old one, in place, so a note being typed keeps its focus.
  thankTheme: (d) => {
    S.app.thankTheme = d.id;
    const card = document.querySelector(".ty-card");
    if (!card) return render();
    card.dataset.theme = d.id;
    const art = card.querySelector(".ty-art"), next = document.createElement("div");
    next.className = "ty-art in";
    next.innerHTML = themeArt(d.id);
    art.after(next);
    setTimeout(() => { art.remove(); next.classList.remove("in"); }, 420);
    document.querySelectorAll(".ty-themes button").forEach((b) => { const on = b.dataset.id === d.id; b.classList.toggle("on", on); b.setAttribute("aria-checked", on); });
  },
  imCancel: closeMessages,
  // The message lifts out of the field into the thread, shows Delivered, then the sheet goes and the card lands.
  imSend: () => {
    const el = document.querySelector(".imsg");
    if (!el || el.classList.contains("sent")) return;
    el.classList.add("sent");
    setTimeout(() => { closeMessages(); celebrateThanks(S.app.thankFor, "text"); }, 1300);
  },
});

NOTES.thanks = ["Thank-you card", ["Like a gift card: pick a theme (stones, sunrise, bloom, tea, stars) and write your own note right on the card.",
  "Send it in Shoal and their jar glows softly. Or text them a link: Messages opens with the card's preview, so you can see exactly what they get.",
  "No call option, since a call can't carry the card. Sending ends on a card of everything they got done this week, with the count ticking up.",
  "Finishing your own task shows your count too, so you can see how much you've carried."]];
