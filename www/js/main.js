// Phase 1 smoke test: proves ES modules load and localStorage persists across
// app restarts. Replaced by the real game in phase 3.
const runs = Number(localStorage.getItem("runs") || 0) + 1;
localStorage.setItem("runs", runs);
document.getElementById("app").textContent =
	`Reactor Revived — origin ${location.origin}, launch #${runs}`;
