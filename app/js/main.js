// main.js — boot for the Leonida Platinum tracker.
// Loads app/data/trophies.json, renders the checklist, and wires the filters,
// the spoiler setting, saved progress (export / import / reset) and hash
// routing between Checklist, Roadmap, Missables and Sources.

import {
  DEMO_EARNED,
  downloadText,
  earnedCount,
  exportProgress,
  loadState,
  parseImport,
  saveState,
  setSpoilers,
  slugOf,
  toggleEarned,
} from "./store.js";
import {
  detailHtml,
  filterTrophies,
  missablesHtml,
  roadmapHtml,
  trophyRowHtml,
} from "./views.js";

const TOTAL_TROPHIES = 55;

const elements = {
  earnedCount: document.getElementById("earnedCount"),
  progressBar: document.getElementById("progressBar"),
  progressFill: document.getElementById("progressFill"),
  progressSub: document.getElementById("progressSub"),
  searchInput: document.getElementById("searchInput"),
  kindFilter: document.getElementById("kindFilter"),
  gradeFilter: document.getElementById("gradeFilter"),
  statusFilter: document.getElementById("statusFilter"),
  spoilerToggle: document.getElementById("spoilerToggle"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  resetBtn: document.getElementById("resetBtn"),
  filterCount: document.getElementById("filterCount"),
  trophyList: document.getElementById("trophyList"),
  detailBody: document.getElementById("detailBody"),
  viewChecklist: document.getElementById("viewChecklist"),
  viewDetail: document.getElementById("viewDetail"),
  viewRoadmap: document.getElementById("viewRoadmap"),
  viewMissables: document.getElementById("viewMissables"),
  viewSources: document.getElementById("viewSources"),
  roadmapBody: document.getElementById("roadmapBody"),
  missablesBody: document.getElementById("missablesBody"),
};

let trophies = [];
let state = loadState();
let selectedSlug = null;

function currentFilters() {
  return {
    query: elements.searchInput.value,
    kind: elements.kindFilter.value,
    grade: elements.gradeFilter.value,
    status: elements.statusFilter.value,
  };
}

function renderProgress() {
  const earned = earnedCount(state);
  const percent = Math.round((earned / TOTAL_TROPHIES) * 100);
  elements.earnedCount.textContent = String(earned);
  elements.progressBar.setAttribute("aria-valuenow", String(earned));
  elements.progressFill.style.width = `${percent}%`;
  elements.progressSub.textContent =
    earned === TOTAL_TROPHIES
      ? "Platinum earned — you're a Leonida Legend!"
      : `${percent}% to the platinum — ${TOTAL_TROPHIES - earned} to go`;
}

function renderList() {
  const filtered = filterTrophies(trophies, state, currentFilters());
  elements.trophyList.innerHTML = filtered.length
    ? filtered.map((trophy) => trophyRowHtml(trophy, state, selectedSlug)).join("")
    : `<li class="empty-list">No trophies match these filters. Clear the search or widen the filters.</li>`;
  elements.filterCount.textContent =
    `Showing ${filtered.length} of ${trophies.length} trophies` +
    (earnedCount(state) ? ` · ${earnedCount(state)} earned` : "");
}

function renderDetail() {
  const trophy = selectedSlug
    ? trophies.find((item) => slugOf(item.name) === selectedSlug)
    : null;
  elements.detailBody.innerHTML = detailHtml(trophy || null, state);
  const toggleBtn = document.getElementById("detailToggleBtn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      state = toggleEarned(state, toggleBtn.dataset.slug);
      renderAll();
    });
  }
}

function renderPages() {
  elements.roadmapBody.innerHTML = roadmapHtml(trophies, state);
  elements.missablesBody.innerHTML = missablesHtml(trophies);
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderPages();
}

function showTab(tab) {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((link) => link.classList.toggle("active", link.dataset.tab === tab));
  elements.viewChecklist.hidden = tab !== "checklist";
  elements.viewDetail.hidden = tab !== "checklist";
  elements.viewRoadmap.hidden = tab !== "roadmap";
  elements.viewMissables.hidden = tab !== "missables";
  elements.viewSources.hidden = tab !== "sources";
  if (tab === "checklist") {
    elements.viewChecklist.hidden = false;
    elements.viewDetail.hidden = false;
  }
}

function routeFromHash() {
  const hash = window.location.hash || "#/checklist";
  const parts = hash.replace(/^#\/?/, "").split("/");
  if (parts[0] === "trophy" && parts[1]) {
    selectedSlug = parts[1];
    showTab("checklist");
    renderAll();
    return;
  }
  if (["roadmap", "missables", "sources"].includes(parts[0])) {
    selectedSlug = null;
    showTab(parts[0]);
    renderAll();
    return;
  }
  selectedSlug = null;
  showTab("checklist");
  renderAll();
}

function wireEvents() {
  for (const input of [elements.searchInput, elements.kindFilter, elements.gradeFilter, elements.statusFilter]) {
    input.addEventListener("input", renderList);
    input.addEventListener("change", renderList);
  }

  elements.spoilerToggle.addEventListener("change", () => {
    state = setSpoilers(state, elements.spoilerToggle.checked);
    renderAll();
  });

  elements.trophyList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-slug]");
    if (!row) return;
    const slug = row.dataset.slug;
    if (event.target.classList.contains("trophy-check")) {
      state = toggleEarned(state, slug);
      renderAll();
      return;
    }
    selectedSlug = slug;
    window.location.hash = `#/trophy/${slug}`;
    renderAll();
  });

  elements.trophyList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const row = event.target.closest("[data-slug]");
    if (!row) return;
    event.preventDefault();
    selectedSlug = row.dataset.slug;
    window.location.hash = `#/trophy/${selectedSlug}`;
    renderAll();
  });

  elements.exportBtn.addEventListener("click", () => {
    downloadText("leonida-platinum-progress.json", exportProgress(state));
  });

  elements.importBtn.addEventListener("click", () => elements.importFile.click());

  elements.importFile.addEventListener("change", async () => {
    const file = elements.importFile.files && elements.importFile.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      state = parseImport(text);
      saveState(state);
      elements.spoilerToggle.checked = state.spoilers;
      renderAll();
    } catch (_error) {
      window.alert("That file could not be imported. It must be a progress file exported from this guide.");
    }
    elements.importFile.value = "";
  });

  elements.resetBtn.addEventListener("click", () => {
    if (!window.confirm("Clear all earned trophies and notes?")) return;
    state = { earned: {}, notes: {}, spoilers: elements.spoilerToggle.checked };
    saveState(state);
    selectedSlug = null;
    renderAll();
  });

  window.addEventListener("hashchange", routeFromHash);
}

async function boot() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("spoilers") === "off") {
    state = setSpoilers(state, false);
  }
  // ?demo=1 seeds a sample of 13 earned trophies so screenshots can show the
  // tracker at work. It only runs on a fresh browser with no saved progress.
  if (params.get("demo") === "1" && earnedCount(state) === 0) {
    const seeded = { earned: {}, notes: {}, spoilers: state.spoilers };
    for (const slug of DEMO_EARNED) seeded.earned[slug] = true;
    state = seeded;
    saveState(state);
  }
  elements.spoilerToggle.checked = state.spoilers;

  try {
    const response = await fetch("./data/trophies.json");
    if (!response.ok) throw new Error(`trophies.json: HTTP ${response.status}`);
    const data = await response.json();
    trophies = Array.isArray(data) ? data : data.trophies;
    if (!Array.isArray(trophies) || trophies.length !== TOTAL_TROPHIES) {
      throw new Error(`expected ${TOTAL_TROPHIES} trophies, got ${trophies.length}`);
    }
  } catch (error) {
    elements.trophyList.innerHTML =
      `<li class="empty-list">The trophy list could not be loaded (${error.message}). Serve this folder with a static file server and reload.</li>`;
    return;
  }

  wireEvents();
  routeFromHash();
}

boot();
