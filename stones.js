/* Shoal: stones lit from inside. Every stone is a soft white shell and its colour is a light inside it,
   the way the real stone's LED shines through. Core puts the light in the middle; Dawn lets it rise
   from the bottom. Classic is the old glossy pebble, kept to compare. The look lives on #phone so it
   reaches every screen and overlay. Also holds the demo frame's "Hide panel" button.
   Loaded last; wraps renderNotes from app.js. */

const STONE_LOOKS = [["classic", "Classic"], ["core", "Core"], ["dawn", "Dawn"]];
let stoneLook = "core";
document.getElementById("phone").dataset.stone = stoneLook;

// A small switch under the screen notes, so the looks can be compared on any screen.
const renderNotesStones = renderNotes;
renderNotes = function () {
  renderNotesStones();
  document.getElementById("notes").insertAdjacentHTML("beforeend", `<div class="stone-look"><strong>Stones</strong>
    <div class="seg" role="radiogroup" aria-label="Stone look">${STONE_LOOKS.map(([k, l]) => `<button role="radio" class="${stoneLook === k ? "on" : ""}" aria-checked="${stoneLook === k}" data-act="stoneLook" data-id="${k}">${l}</button>`).join("")}</div></div>`);
};

Object.assign(ACTIONS, {
  stoneLook: (d) => { stoneLook = d.id; document.getElementById("phone").dataset.stone = d.id; renderNotes(); },
});

/* ---------- Demo frame ---------- */

// "Hide panel" leaves just the phone, for presenting. It's remembered on this computer.
const panelBtn = document.createElement("button");
panelBtn.className = "panel-toggle";
const setPresent = (on) => {
  document.body.classList.toggle("present", on);
  panelBtn.textContent = on ? "Show panel" : "Hide panel";
  panelBtn.setAttribute("aria-pressed", on);
  try { localStorage.setItem("shoal-present", on ? "1" : ""); } catch {}
};
panelBtn.addEventListener("click", () => setPresent(!document.body.classList.contains("present")));
document.body.appendChild(panelBtn);
let presentSaved = false;
try { presentSaved = localStorage.getItem("shoal-present") === "1"; } catch {}
setPresent(presentSaved || new URLSearchParams(location.search).has("present"));
