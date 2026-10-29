/* Shoal: the demo frame's "Hide panel" button. Loaded last. */

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
