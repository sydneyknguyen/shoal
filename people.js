/* Shoal: inviting people. One sheet for every invite: who they are, how they know the person you care
   for, what they can do, and how the invite gets to them (text, email, or a link with a code).
   Until they accept, they're "Pending": you can plan with them, but they haven't joined yet. */

const RELS = ["Son or daughter", "Sibling", "Spouse or partner", "Grandchild", "Friend", "Neighbor", "Other"];
const VIA = [["text", "Text"], ["email", "Email"], ["link", "Share a link"]];
const ROLE_LINE = {
  main: "Gets the app, a jar, and the whole plan. Can take and hand off tasks.",
  trusted: "Gets a text when a light task opens up. No medical details.",
  kid: "Their own small jobs in plain words. Never urgent.",
};
const pending = (p) => p.id !== "you" && p.invited && !p.joined;
const inviteCode = (p) => (p.code ||= Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, "7"));
const viaShort = (p) => (p.via === "email" ? "Email sent" : p.via === "link" ? "Link to share" : "Text sent");
const viaLine = (p) => (p.via === "email" ? `by email to ${p.contact}` : p.via === "link" ? "with a link" : p.contact ? `by text to ${p.contact}` : "by text");

// Name is required; text needs a phone number, email needs an address. A link needs nothing.
function inviteReady() {
  const d = S.draftInv;
  if (!d.name.trim()) return false;
  if (d.via === "text") return d.contact.replace(/\D/g, "").length >= 7;
  if (d.via === "email") return /.+@.+\..+/.test(d.contact);
  return true;
}
const syncInviteBtn = () => { const b = document.querySelector('.sheet [data-act="sendInvite"]'); if (b) b.disabled = !inviteReady(); };

function inviteSheet() {
  const d = S.draftInv, code = d.code;
  openSheet(`<h3>Invite someone</h3>
    <p class="small">They'll get a link to join ${esc(possessive({ name: L() }))} plan.</p>
    <div class="inv-form">
      <label class="card field"><span class="eyebrow">Name</span><input data-input="invName" value="${esc(d.name)}" placeholder="First name" autocomplete="off" aria-label="Their name"></label>
      <p class="label">How do they know ${esc(L())}? <span class="small">Optional</span></p>
      <div class="chips">${RELS.map((r) => chip(r, d.rel === r, "invRel", r)).join("")}</div>
      <p class="label">What can they do?</p>
      <div class="seg wide">${PEOPLE_GROUPS.map((g) => `<button class="${d.tier === g.tier ? "on" : ""}" aria-pressed="${d.tier === g.tier}" data-act="invTier" data-id="${g.tier}">${g.t.replace("Main caregivers", "Main caregiver")}</button>`).join("")}</div>
      <p class="small inv-role">${ROLE_LINE[d.tier]}</p>
      <p class="label">Send it by</p>
      <div class="seg wide">${VIA.map(([k, l]) => `<button class="${d.via === k ? "on" : ""}" aria-pressed="${d.via === k}" data-act="invVia" data-id="${k}">${l}</button>`).join("")}</div>
      ${d.via === "link"
        ? `<div class="card inv-code"><span class="tl-txt"><span class="m">Invite code</span><span class="code">${code}</span><span class="m">shoal.app/j/${code}</span></span><button class="pill-btn" data-act="toast" data-msg="Invite link copied">Copy link</button></div>
           <p class="small">Paste it in a group chat or anywhere. Anyone with the code can ask to join, and you approve them.</p>`
        : `<label class="card field"><span class="eyebrow">${d.via === "email" ? "Email" : "Phone number"}</span><input data-input="invContact" value="${esc(d.contact)}" type="${d.via === "email" ? "email" : "tel"}" inputmode="${d.via === "email" ? "email" : "tel"}" placeholder="${d.via === "email" ? "name@email.com" : "(555) 555-0123"}" autocomplete="off" aria-label="${d.via === "email" ? "Their email" : "Their phone number"}"></label>`}
    </div>
    <button class="btn-primary" data-act="sendInvite" ${inviteReady() ? "" : "disabled"}>${d.via === "link" ? "Add as pending" : "Send invite"}</button>
    <p class="small center">They show as pending until they accept.</p>`);
}

function pendingSheet(p) {
  const g = PEOPLE_GROUPS.find((x) => x.tier === p.tier);
  openSheet(`<div class="pend-head">${avatar(p, "s36 pending")}<span class="tl-txt"><span class="n">${esc(p.name)} hasn't joined yet</span><span class="m">Invited as ${g.t.replace("Main caregivers", "main caregiver").toLowerCase()} ${viaLine(p)}${p.rel ? ` · ${esc(p.rel)}` : ""}</span></span></div>
    <p class="small">You can still give ${esc(p.name)} tasks. They'll say yes or no to each one when they join.</p>
    <div class="card inv-code"><span class="tl-txt"><span class="m">Invite code</span><span class="code">${inviteCode(p)}</span></span><button class="pill-btn" data-act="toast" data-msg="Invite link copied">Copy link</button></div>
    <div class="actions col">
      <button class="btn-soft" data-act="resendInvite" data-id="${p.id}">Resend invite</button>
      ${S.app && p.tier === "main" ? `<button class="btn-soft" data-act="invitePreview" data-id="${p.id}">See what ${esc(p.name)} sees</button>` : ""}
      <button class="btn-text danger" data-act="cancelInvite" data-id="${p.id}">Cancel invite</button>
    </div>`);
}

// Who's helping? (onboarding). Joined people and pending invites sit in the group they'll belong to.
SCREENS.people = () => {
  const line = (p) => p.id === "you" || !pending(p)
    ? `<div class="person">${avatar(p, "s36")}
      <span class="main"><span class="n">${esc(p.name)}</span><span class="m">${p.id === "you" ? "That's you" : esc(p.rel || p.about || "Joined")}</span></span></div>`
    : `<button class="person pend" data-act="pendingSheet" data-id="${p.id}">${avatar(p, "s36 pending")}
      <span class="main"><span class="n">${esc(p.name)}</span><span class="m">${viaShort(p)} · waiting to join</span></span><span class="badge plain">Pending</span></button>`;
  return `${topbar({ skip: false })}
  <div class="content">
    ${eyebrow("People")}
    <h1 class="title">Who's helping?</h1>
    <p class="sub">Invite the people who'll share the work. They join from a text, an email, or a link.</p>
    ${PEOPLE_GROUPS.map((g) => `<div class="pgroup">
      <div class="pg-head"><b>${g.t}</b><span>${g.hint}</span></div>
      <div class="card pg-card">${S.people.filter((p) => p.tier === g.tier).map(line).join("")}
        <button class="pg-add" data-act="addPerson" data-tier="${g.tier}"><span class="pg-plus" aria-hidden="true">+</span>${g.add}</button>
      </div>
    </div>`).join("")}
  </div>
  ${footer()}`;
};

Object.assign(ACTIONS, {
  addPerson: (d) => {
    S.draftInv = { name: "", rel: "", tier: d.tier || "main", via: "text", contact: "", code: Math.random().toString(36).slice(2, 6).toUpperCase().replace(/[O0I1]/g, "7") };
    inviteSheet();
  },
  inviteSheet: () => ACTIONS.addPerson({ tier: "main" }),
  invRel: (d) => { S.draftInv.rel = S.draftInv.rel === d.id ? "" : d.id; inviteSheet(); },
  invTier: (d) => { S.draftInv.tier = d.id; inviteSheet(); },
  invVia: (d) => { S.draftInv.via = d.id; S.draftInv.contact = ""; inviteSheet(); },
  sendInvite: () => {
    if (!inviteReady()) return;
    const d = S.draftInv, name = d.name.trim();
    S.people.push({ id: `p${Date.now()}`, name, rel: d.rel, about: d.rel, tier: d.tier, via: d.via, contact: d.via === "text" ? fmtPhone(d.contact.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "")) : d.contact.trim(), code: d.code,
      note: TIER_NOTE[d.tier], cap: d.tier === "main" ? 5 : 2, invited: true, joined: false });
    closeSheet(); render();
    toast(d.via === "link" ? `${name} is pending. Send them the link.` : `Invite sent to ${name}`);
  },
  pendingSheet: (d) => pendingSheet(person(d.id)),
  resendInvite: (d) => { closeSheet(); toast(`Sent ${person(d.id).name} a reminder`); },
  cancelInvite: (d) => {
    const p = person(d.id);
    S.tasks.forEach((t) => { if (t.who === p.id) t.who = null; });
    S.people = S.people.filter((x) => x.id !== p.id);
    closeSheet(); render();
    toast(`Invite canceled. ${possessive(p)} tasks are open again.`);
  },
});

Object.assign(APP_INPUT, {
  invName: (v) => { S.draftInv.name = v; syncInviteBtn(); },
  invContact: (v) => { S.draftInv.contact = v; syncInviteBtn(); },
});

NOTES.people = ["Who's helping", ["Each Add opens one invite sheet: name, how they know the person you care for, what they can do, and how to send it (text, email, or a link with a code).",
  "Invited people show as Pending in the group they'll join. You can plan with them now; they say yes or no to their tasks when they accept.", "Tap a pending invite to resend, copy the link, or cancel it."]];
