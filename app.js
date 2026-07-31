const STORAGE_KEY = "strickhelfer_v1_1";

function createCounter(name = "Mein Reihenzähler", target = 0, note = "") {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    count: 0,
    note,
    target,
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

const initialCounter = createCounter();
const defaultState = {
  counters: [initialCounter],
  activeCounterId: initialCounter.id,
  projects: []
};

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);
    const parsed = JSON.parse(saved);
    const projects = Array.isArray(parsed.projects) ? parsed.projects : [];

    // Automatische Übernahme des bisherigen einzelnen Reihenzählers.
    if (!Array.isArray(parsed.counters)) {
      const old = parsed.counter || {};
      const migrated = createCounter(old.name || "Mein Reihenzähler", Number(old.target) || 0, old.note || "");
      migrated.count = Math.max(0, Number(old.count) || 0);
      migrated.history = Array.isArray(old.history) ? old.history.slice(0, 50) : [];
      return { counters: [migrated], activeCounterId: migrated.id, projects };
    }

    const counters = parsed.counters.length ? parsed.counters.map(counter => ({
      ...createCounter(),
      ...counter,
      count: Math.max(0, Number(counter.count) || 0),
      target: Math.max(0, Number(counter.target) || 0),
      history: Array.isArray(counter.history) ? counter.history.slice(0, 50) : []
    })) : [createCounter()];

    const activeCounterId = counters.some(c => c.id === parsed.activeCounterId)
      ? parsed.activeCounterId
      : counters[0].id;

    return { counters, activeCounterId, projects };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveCounter() {
  let counter = state.counters.find(item => item.id === state.activeCounterId);
  if (!counter) {
    counter = state.counters[0] || createCounter();
    if (!state.counters.length) state.counters.push(counter);
    state.activeCounterId = counter.id;
  }
  return counter;
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById(viewId).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

document.querySelectorAll(".back-button").forEach(button => {
  button.addEventListener("click", () => showView("homeView"));
});

const counterName = document.getElementById("counterName");
const counterNote = document.getElementById("counterNote");
const counterTarget = document.getElementById("counterTarget");
const rowCount = document.getElementById("rowCount");
const counterProgress = document.getElementById("counterProgress");
const counterProgressBar = document.getElementById("counterProgressBar");
const counterProgressRows = document.getElementById("counterProgressRows");
const counterProgressPercent = document.getElementById("counterProgressPercent");
const counterHistory = document.getElementById("counterHistory");
const counterList = document.getElementById("counterList");

function renderCounter() {
  const counter = getActiveCounter();
  counterName.value = counter.name || "";
  counterNote.value = counter.note || "";
  counterTarget.value = counter.target || "";
  rowCount.textContent = counter.count || 0;
  document.getElementById("activeCounterHeading").textContent = counter.name || "Unbenannter Zähler";
  renderCounterProgress();
  renderCounterHistory();
  renderCounterList();
}

function renderCounterList() {
  counterList.innerHTML = state.counters.map(counter => {
    const active = counter.id === state.activeCounterId;
    const percent = counter.target > 0 ? Math.min(100, Math.round(counter.count / counter.target * 100)) : null;
    return `<button class="counter-switch ${active ? "active" : ""}" data-counter-id="${escapeHtml(counter.id)}">
      <span class="counter-switch-main">
        <strong>${escapeHtml(counter.name || "Unbenannter Zähler")}</strong>
        <small>${counter.count}${counter.target ? ` von ${counter.target} Reihen · ${percent} %` : " Reihen"}</small>
      </span>
      <span class="counter-switch-status">${active ? "Aktiv" : "Öffnen"}</span>
    </button>`;
  }).join("");

  counterList.querySelectorAll("[data-counter-id]").forEach(button => {
    button.addEventListener("click", () => {
      state.activeCounterId = button.dataset.counterId;
      saveState();
      renderCounter();
    });
  });
}

function renderCounterProgress() {
  const counter = getActiveCounter();
  const count = Number(counter.count) || 0;
  const target = Number(counter.target) || 0;
  if (target <= 0) {
    counterProgress.classList.add("hidden");
    return;
  }
  const percent = Math.min(100, Math.round(count / target * 100));
  counterProgress.classList.remove("hidden");
  counterProgressBar.style.width = `${percent}%`;
  counterProgressRows.textContent = `${count} von ${target} Reihen`;
  counterProgressPercent.textContent = `${percent} %`;
}

function addCounterHistory(type, count, detail = "") {
  const counter = getActiveCounter();
  if (!Array.isArray(counter.history)) counter.history = [];
  counter.history.unshift({
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    type,
    count,
    detail
  });
  counter.history = counter.history.slice(0, 50);
  counter.updatedAt = new Date().toISOString();
}

function renderCounterHistory() {
  const history = getActiveCounter().history || [];
  if (!history.length) {
    counterHistory.innerHTML = `<div class="history-empty">Noch keine Änderungen aufgezeichnet.</div>`;
    return;
  }
  counterHistory.innerHTML = history.map(entry => {
    const date = new Date(entry.timestamp);
    const stamp = date.toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    const labels = {
      increment: `➕ Reihe ${entry.count}`,
      decrement: `➖ Reihe ${entry.count}`,
      reset: `↺ Zähler auf 0 zurückgesetzt`,
      target: entry.count > 0 ? `🎯 Ziel auf ${entry.count} Reihen geändert` : `🎯 Reihenziel entfernt`
    };
    return `<div class="history-entry"><span class="history-time">${stamp}</span><span class="history-action">${labels[entry.type] || escapeHtml(entry.detail || "Änderung")}</span></div>`;
  }).join("");
}

document.getElementById("incrementButton").addEventListener("click", () => {
  const counter = getActiveCounter();
  counter.count += 1;
  addCounterHistory("increment", counter.count);
  saveState();
  renderCounter();
  if (navigator.vibrate) navigator.vibrate(20);
});

document.getElementById("decrementButton").addEventListener("click", () => {
  const counter = getActiveCounter();
  const previous = counter.count;
  counter.count = Math.max(0, counter.count - 1);
  if (counter.count !== previous) addCounterHistory("decrement", counter.count);
  saveState();
  renderCounter();
});

document.getElementById("resetCounterButton").addEventListener("click", () => {
  const counter = getActiveCounter();
  if (confirm(`Reihenzähler "${counter.name || "Unbenannt"}" wirklich auf 0 setzen?`)) {
    counter.count = 0;
    addCounterHistory("reset", 0);
    saveState();
    renderCounter();
  }
});

counterName.addEventListener("input", e => {
  const counter = getActiveCounter();
  counter.name = e.target.value;
  counter.updatedAt = new Date().toISOString();
  saveState();
  renderCounterList();
  document.getElementById("activeCounterHeading").textContent = counter.name || "Unbenannter Zähler";
});

counterNote.addEventListener("input", e => {
  const counter = getActiveCounter();
  counter.note = e.target.value;
  counter.updatedAt = new Date().toISOString();
  saveState();
});

counterTarget.addEventListener("change", e => {
  const counter = getActiveCounter();
  const target = Math.max(0, Math.floor(Number(e.target.value) || 0));
  counter.target = target;
  addCounterHistory("target", target);
  saveState();
  renderCounter();
});

document.getElementById("clearCounterHistory").addEventListener("click", () => {
  const counter = getActiveCounter();
  if (!counter.history?.length) return;
  if (confirm(`Verlauf von "${counter.name || "Unbenannt"}" wirklich löschen?`)) {
    counter.history = [];
    saveState();
    renderCounterHistory();
  }
});

document.getElementById("deleteCounterButton").addEventListener("click", () => {
  const counter = getActiveCounter();
  if (state.counters.length <= 1) {
    alert("Mindestens ein Reihenzähler muss erhalten bleiben.");
    return;
  }
  if (confirm(`Reihenzähler "${counter.name || "Unbenannt"}" samt Verlauf löschen?`)) {
    state.counters = state.counters.filter(item => item.id !== counter.id);
    state.activeCounterId = state.counters[0].id;
    saveState();
    renderCounter();
  }
});

const counterDialog = document.getElementById("counterDialog");
document.getElementById("newCounterButton").addEventListener("click", () => counterDialog.showModal());
document.getElementById("closeCounterDialog").addEventListener("click", () => counterDialog.close());

document.getElementById("counterForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("newCounterName").value.trim();
  if (!name) return;
  const counter = createCounter(
    name,
    Math.max(0, Math.floor(Number(document.getElementById("newCounterTarget").value) || 0)),
    document.getElementById("newCounterNote").value.trim()
  );
  state.counters.unshift(counter);
  state.activeCounterId = counter.id;
  saveState();
  event.target.reset();
  counterDialog.close();
  renderCounter();
});

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".calculator-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

function numberValue(id) {
  return Number(document.getElementById(id).value);
}

document.getElementById("calculateStitches").addEventListener("click", () => {
  const stitches = numberValue("sampleStitches");
  const sampleWidth = numberValue("sampleWidth");
  const targetWidth = numberValue("targetWidth");
  const result = document.getElementById("stitchResult");

  if (stitches <= 0 || sampleWidth <= 0 || targetWidth <= 0) {
    result.innerHTML = "Bitte alle Werte korrekt eingeben.";
  } else {
    const exact = stitches / sampleWidth * targetWidth;
    result.innerHTML = `<strong>${Math.round(exact)} Maschen</strong><br><span class="muted">Rechnerisch: ${exact.toFixed(1)} Maschen</span>`;
  }
  result.classList.remove("hidden");
});

document.getElementById("calculateRows").addEventListener("click", () => {
  const rows = numberValue("sampleRows");
  const sampleHeight = numberValue("sampleHeight");
  const targetHeight = numberValue("targetHeight");
  const result = document.getElementById("rowResult");

  if (rows <= 0 || sampleHeight <= 0 || targetHeight <= 0) {
    result.innerHTML = "Bitte alle Werte korrekt eingeben.";
  } else {
    const exact = rows / sampleHeight * targetHeight;
    result.innerHTML = `<strong>${Math.round(exact)} Reihen</strong><br><span class="muted">Rechnerisch: ${exact.toFixed(1)} Reihen</span>`;
  }
  result.classList.remove("hidden");
});

document.getElementById("calculateYarn").addEventListener("click", () => {
  const required = numberValue("requiredLength");
  const perBall = numberValue("lengthPerBall");
  const weight = numberValue("weightPerBall");
  const reserve = Math.max(0, numberValue("reservePercent"));
  const result = document.getElementById("yarnResult");

  if (required <= 0 || perBall <= 0 || weight <= 0) {
    result.innerHTML = "Bitte alle Werte korrekt eingeben.";
  } else {
    const minimumBalls = Math.ceil(required / perBall);
    const reserveLength = required * (1 + reserve / 100);
    const recommendedBalls = Math.ceil(reserveLength / perBall);
    const totalLength = recommendedBalls * perBall;
    const totalWeight = recommendedBalls * weight;
    result.innerHTML = `
      <strong>${recommendedBalls} Knäuel empfohlen</strong>
      <p>Mindestmenge: ${minimumBalls} Knäuel</p>
      <p>Mit ${reserve}% Reserve: ${Math.round(reserveLength)} m</p>
      <p>Einkaufsmenge: ${totalLength} m / ${totalWeight} g</p>
    `;
  }
  result.classList.remove("hidden");
});

const projectDialog = document.getElementById("projectDialog");
document.getElementById("newProjectButton").addEventListener("click", () => projectDialog.showModal());

document.getElementById("projectForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("projectName").value.trim();
  if (!name) return;

  state.projects.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    type: document.getElementById("projectType").value,
    needleSize: document.getElementById("needleSize").value,
    targetRows: Number(document.getElementById("targetRowsProject").value) || 0,
    currentRows: 0,
    yarn: document.getElementById("projectYarn").value.trim(),
    notes: document.getElementById("projectNotes").value.trim(),
    createdAt: new Date().toISOString()
  });

  saveState();
  renderProjects();
  renderCurrentProject();
  event.target.reset();
  projectDialog.close();
});

function renderProjects() {
  const list = document.getElementById("projectList");
  list.innerHTML = "";

  if (!state.projects.length) {
    list.innerHTML = `<div class="empty-state">Noch keine Projekte vorhanden.</div>`;
    return;
  }

  state.projects.forEach(project => {
    const progress = project.targetRows > 0
      ? Math.min(100, Math.round(project.currentRows / project.targetRows * 100))
      : 0;

    const card = document.createElement("article");
    card.className = "project-card";
    card.innerHTML = `
      <div class="project-card-header">
        <div>
          <h3>${escapeHtml(project.name)}</h3>
          <div class="project-meta">${escapeHtml(project.type)}${project.needleSize ? ` · Nadel ${escapeHtml(project.needleSize)} mm` : ""}</div>
        </div>
        <button class="icon-button delete-project" aria-label="Projekt löschen">×</button>
      </div>
      ${project.yarn ? `<p><strong>Garn:</strong> ${escapeHtml(project.yarn)}</p>` : ""}
      ${project.notes ? `<p class="muted">${escapeHtml(project.notes)}</p>` : ""}
      <p><strong>${project.currentRows}</strong>${project.targetRows ? ` von ${project.targetRows}` : ""} Reihen</p>
      ${project.targetRows ? `<div class="progress"><span style="width:${progress}%"></span></div>` : ""}
      <div class="project-actions">
        <button class="secondary minus-row">− Reihe</button>
        <button class="primary plus-row">+ Reihe</button>
      </div>
    `;

    card.querySelector(".plus-row").addEventListener("click", () => {
      project.currentRows += 1;
      saveState();
      renderProjects();
      renderCurrentProject();
    });

    card.querySelector(".minus-row").addEventListener("click", () => {
      project.currentRows = Math.max(0, project.currentRows - 1);
      saveState();
      renderProjects();
      renderCurrentProject();
    });

    card.querySelector(".delete-project").addEventListener("click", () => {
      if (confirm(`Projekt "${project.name}" löschen?`)) {
        state.projects = state.projects.filter(p => p.id !== project.id);
        saveState();
        renderProjects();
        renderCurrentProject();
      }
    });

    list.appendChild(card);
  });
}

function renderCurrentProject() {
  const container = document.getElementById("currentProjectCard");
  const project = state.projects[0];

  if (!project) {
    container.className = "empty-state";
    container.textContent = "Noch kein Projekt angelegt.";
    return;
  }

  const progress = project.targetRows > 0
    ? Math.min(100, Math.round(project.currentRows / project.targetRows * 100))
    : null;

  container.className = "";
  container.innerHTML = `
    <div class="project-card">
      <h3>${escapeHtml(project.name)}</h3>
      <p class="project-meta">${escapeHtml(project.type)}</p>
      <p><strong>${project.currentRows}</strong>${project.targetRows ? ` von ${project.targetRows}` : ""} Reihen</p>
      ${progress !== null ? `<div class="progress"><span style="width:${progress}%"></span></div><p class="muted">${progress}% abgeschlossen</p>` : ""}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

document.getElementById("infoButton").addEventListener("click", () => {
  document.getElementById("infoDialog").showModal();
});

document.getElementById("closeInfoButton").addEventListener("click", () => {
  document.getElementById("infoDialog").close();
});

document.getElementById("exportButton").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `strickhelfer-sicherung-${new Date().toISOString().slice(0,10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importInput").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.projects)) throw new Error();
    if (!Array.isArray(imported.counters) && !imported.counter) throw new Error();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
    state = loadState();
    saveState();
    renderAll();
    alert("Daten wurden wiederhergestellt.");
  } catch {
    alert("Die Datei ist keine gültige Strickhelfer-Sicherung.");
  }
  event.target.value = "";
});

document.getElementById("deleteAllButton").addEventListener("click", () => {
  if (confirm("Wirklich alle Projekte, Zählerstände und Notizen löschen?")) {
    const fresh = createCounter();
    state = { counters: [fresh], activeCounterId: fresh.id, projects: [] };
    saveState();
    renderAll();
  }
});

function renderAll() {
  renderCounter();
  renderProjects();
  renderCurrentProject();
}

renderAll();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.warn("Service Worker konnte nicht registriert werden:", error);
    });
  });
}
