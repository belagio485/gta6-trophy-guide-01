// views.js — rendering for the Leonida Platinum tracker.
// Pure render functions: given the trophy list and the saved state, they
// return HTML strings. main.js wires the events.

import { slugOf } from "./store.js";

export const KIND_LABELS = {
  story: "Story",
  side: "Side strand",
  collectible: "Collectible",
  activity: "Activity",
  crime: "Crime",
  progress: "Progress",
};

const KIND_ORDER = ["story", "side", "collectible", "activity", "crime", "progress"];

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A story trophy is a spoiler until earned: its name and description stay
// hidden while the spoiler setting is on.
export function isSpoiled(trophy, state) {
  return Boolean(state.spoilers) && trophy.kind === "story" && !state.earned[slugOf(trophy.name)];
}

export function gradeClass(grade) {
  return `medal medal-${grade.toLowerCase()}`;
}

export function filterTrophies(trophies, state, filters) {
  const query = (filters.query || "").trim().toLowerCase();
  return trophies.filter((trophy) => {
    const slug = slugOf(trophy.name);
    if (filters.kind === "missable") {
      if (!trophy.missable && trophy.risk !== "before-finale") return false;
    } else if (filters.kind !== "all" && trophy.kind !== filters.kind) {
      return false;
    }
    if (filters.grade !== "all" && trophy.grade !== filters.grade) return false;
    if (filters.status === "earned" && !state.earned[slug]) return false;
    if (filters.status === "remaining" && state.earned[slug]) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export function trophyRowHtml(trophy, state, selectedSlug) {
  const slug = slugOf(trophy.name);
  const earned = Boolean(state.earned[slug]);
  const spoiled = isSpoiled(trophy, state);
  const name = spoiled ? "??? — hidden story trophy" : escapeHtml(trophy.name);
  const desc = spoiled
    ? "Hidden until earned. Turn the spoiler setting off to reveal it, or earn it in the game."
    : escapeHtml(trophy.description);
  const target = trophy.target && trophy.targetLabel
    ? `<p class="trophy-target">Target: ${escapeHtml(String(trophy.target))} ${escapeHtml(trophy.targetLabel)}</p>`
    : "";
  const missable = trophy.missable
    ? `<span class="tag tag-missable">Missable</span>`
    : trophy.risk === "before-finale"
      ? `<span class="tag tag-risk">Before finale</span>`
      : "";
  const hidden = trophy.hidden ? `<span class="tag tag-hidden">Hidden on PSN</span>` : "";
  const classes = ["trophy-row"];
  if (earned) classes.push("earned");
  if (selectedSlug === slug) classes.push("selected");
  return `<li class="${classes.join(" ")}" data-slug="${slug}" tabindex="0" role="button" aria-pressed="${earned}">
    <input class="trophy-check" type="checkbox" data-slug="${slug}" ${earned ? "checked" : ""} aria-label="Mark ${escapeHtml(trophy.name)} earned">
    <div class="trophy-main">
      <div class="trophy-top">
        <span class="trophy-name${spoiled ? " spoiled" : ""}">${name}</span>
        <span class="${gradeClass(trophy.grade)}">${escapeHtml(trophy.grade)}</span>
        <span class="tag">${escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind)}</span>
        ${missable}${hidden}
      </div>
      <p class="trophy-desc${spoiled ? " spoiled" : ""}">${desc}</p>
      ${target}
    </div>
  </li>`;
}

export function detailHtml(trophy, state) {
  if (!trophy) {
    return `<h2>Pick a trophy</h2>
      <p>Select any trophy in the checklist to read its guide here: what to do, where, when it can be missed, and where each fact comes from.</p>
      <p class="detail-hint">Guides are written in our own words from the official descriptions. Anything not yet confirmed in the game says so plainly.</p>`;
  }
  const slug = slugOf(trophy.name);
  const earned = Boolean(state.earned[slug]);
  const spoiled = isSpoiled(trophy, state);
  const name = spoiled ? "??? — hidden story trophy" : escapeHtml(trophy.name);
  const desc = spoiled ? "Hidden until earned." : escapeHtml(trophy.description);
  const sources = (trophy.sources || [])
    .map((source) => `<li>${escapeHtml(source)}</li>`)
    .join("");
  const target = trophy.target && trophy.targetLabel
    ? `<p><strong>Target:</strong> ${escapeHtml(String(trophy.target))} ${escapeHtml(trophy.targetLabel)}</p>`
    : "";
  const note = trophy.missable
    ? `<p class="detail-note missable"><strong>Missable.</strong> One meditation spot is reported missable — finish every meditation before the final mission.</p>`
    : trophy.risk === "before-finale"
      ? `<p class="detail-note"><strong>Finish before the finale.</strong> Whether this strand stays open after the final mission is not yet confirmed — do it before the finale to be safe.</p>`
      : "";
  return `<h2>${name}</h2>
    <p class="detail-grade"><span class="${gradeClass(trophy.grade)}">${escapeHtml(trophy.grade)}</span>
    <span class="tag">${escapeHtml(KIND_LABELS[trophy.kind] || trophy.kind)}</span>
    ${trophy.hidden ? `<span class="tag tag-hidden">Hidden on PSN</span>` : ""}</p>
    <p class="detail-desc">${desc}</p>
    ${target}
    <h3>Guide</h3>
    <p class="detail-guide">${escapeHtml(trophy.guide)}</p>
    ${note}
    <h3>Sources</h3>
    <ul class="detail-sources">${sources}</ul>
    <div class="detail-actions">
      <button class="btn" id="detailToggleBtn" type="button" data-slug="${slug}">
        ${earned ? "Mark as not earned" : "Mark as earned"}
      </button>
    </div>`;
}

export const ROADMAP_STAGES = [
  {
    title: "Stage 1 — Play the story (Chapters 1–4 and the finale)",
    text: "Just play the campaign. Twelve trophies unlock automatically as the story moves: the opening mission, all four chapters, the final mission, and the named missions Breakfast Run, The Cartel Heist, Child's Play, Headliners, VCIA Takedown and Operation Savage Glory.",
    kinds: ["story"],
  },
  {
    title: "Stage 2 — Side strands, before the finale",
    text: "Finish the stranger strands before the final mission: Andy, Kenton, Billy, Randy, Tyrone and Bret, plus eight strands for Strangers & Freaks. Whether strands stay open after the finale is not yet confirmed, so do not leave them for post-game.",
    kinds: ["side"],
  },
  {
    title: "Stage 3 — Meditations and the missable",
    text: "Do all 18 meditations before the finale. Positive Mental Attitude is the one reported missable trophy — one spot may not come back — so clear every spot while the story is still open.",
    kinds: ["collectible"],
  },
  {
    title: "Stage 4 — Activities and collections",
    text: "Shooting Range gold medals (42), 250 stunts, 14 drone races, 20 different races, fishing, arcade, cards (3 sets), WAiNK scans (100), vehicles (100) and 50 challenges. Most of these count toward 100% completion, so they are progress, not a detour.",
    kinds: ["activity", "collectible"],
  },
  {
    title: "Stage 5 — Crime, money and cleanup",
    text: "Bank vaults, armored trucks, shops, jewelry heists, gang operations, laundering $250,000, spending $100,000, 8 garages and 10 Scooter Bros registrations. Then finish the 100% checklist for A Long Road — and the platinum, Vice Got a Price!, unlocks.",
    kinds: ["crime", "progress"],
  },
];

export function roadmapHtml(trophies, state) {
  return ROADMAP_STAGES.map((stage, index) => {
    const items = trophies
      .filter((trophy) => stage.kinds.includes(trophy.kind))
      .map((trophy) => {
        const slug = slugOf(trophy.name);
        const earned = Boolean(state.earned[slug]);
        return `<li class="${earned ? "earned" : ""}">${earned ? "✓ " : ""}${escapeHtml(trophy.name)} <span class="tag">${escapeHtml(trophy.grade)}</span></li>`;
      })
      .join("");
    const earnedHere = trophies.filter(
      (trophy) => stage.kinds.includes(trophy.kind) && state.earned[slugOf(trophy.name)],
    ).length;
    const totalHere = trophies.filter((trophy) => stage.kinds.includes(trophy.kind)).length;
    return `<div class="stage">
      <h3>Stage ${index + 1} — ${escapeHtml(stage.title.replace(/^Stage \d+ — /, ""))}</h3>
      <p>${escapeHtml(stage.text)}</p>
      <p><strong>${earnedHere} of ${totalHere} earned in this stage.</strong></p>
      <ul>${items}</ul>
    </div>`;
  }).join("");
}

export function missablesHtml(trophies) {
  const confirmed = trophies.filter((trophy) => trophy.missable);
  const atRisk = trophies.filter((trophy) => trophy.risk === "before-finale");
  const confirmedHtml = confirmed.map((trophy) => `<div class="missable-card">
      <h3>${escapeHtml(trophy.name)} — ${escapeHtml(trophy.grade)}</h3>
      <p>${escapeHtml(trophy.description)}</p>
      <p>${escapeHtml(trophy.guide)}</p>
    </div>`).join("");
  const riskItems = atRisk.map((trophy) => `<li><strong>${escapeHtml(trophy.name)}</strong> — ${escapeHtml(trophy.description)} Finish it before the final mission; post-finale availability is not yet confirmed.</li>`).join("");
  return `<h3>Confirmed missable</h3>
    ${confirmedHtml || "<p>None confirmed yet.</p>"}
    <h3>Finish before the finale (unconfirmed)</h3>
    <p>These strands are not confirmed missable, but they may lock after the final mission. Do them first and you lose nothing.</p>
    <ul class="source-list">${riskItems}</ul>
    <p class="page-intro">Sources: the missable report comes from Gamemapa's trophy list; the before-finale advice is our own, drawn from the official descriptions, and says plainly where it is unconfirmed.</p>`;
}

export { KIND_ORDER };
