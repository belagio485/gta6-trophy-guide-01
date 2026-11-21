// store.js — saved progress for the Leonida Platinum tracker.
// Progress lives only in this browser (localStorage). Export and import move
// it as a JSON file the player controls. Nothing is sent anywhere.

export const STORAGE_KEY = "leonida-platinum-progress-v1";

// Thirteen early, plausible trophies, used only to seed screenshots:
// ?demo=1 in the address bar loads this sample progress once.
export const DEMO_EARNED = [
  "just-like-paradise",
  "paradise-lost",
  "trust",
  "master-of-none",
  "baited-my-tackle",
  "stick-fiddler",
  "whip-it-good",
  "gunslinger",
  "treat-yo-self",
  "in-the-beginning",
  "let-s-go-bowling",
  "catch-me-if-you-can",
  "top-fun",
];

export function slugOf(name) {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function blankState() {
  return { earned: {}, notes: {}, spoilers: true };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return blankState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return blankState();
    return {
      earned: parsed.earned && typeof parsed.earned === "object" ? parsed.earned : {},
      notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
      spoilers: parsed.spoilers !== false,
    };
  } catch (_error) {
    return blankState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_error) {
    // Storage full or unavailable (private mode): progress just won't persist.
  }
}

export function toggleEarned(state, slug) {
  const next = {
    earned: { ...state.earned },
    notes: { ...state.notes },
    spoilers: state.spoilers,
  };
  if (next.earned[slug]) delete next.earned[slug];
  else next.earned[slug] = true;
  saveState(next);
  return next;
}

export function setSpoilers(state, on) {
  const next = { earned: { ...state.earned }, notes: { ...state.notes }, spoilers: on };
  saveState(next);
  return next;
}

export function earnedCount(state) {
  return Object.keys(state.earned).length;
}

export function exportProgress(state) {
  const payload = {
    app: "leonida-platinum",
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: Object.keys(state.earned).sort(),
    notes: state.notes,
    spoilers: state.spoilers,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseImport(text) {
  const parsed = JSON.parse(text);
  const earned = {};
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.earned)
      ? parsed.earned
      : [];
  for (const slug of list) {
    if (typeof slug === "string" && slug.length > 0) earned[slug] = true;
  }
  return {
    earned,
    notes: parsed && typeof parsed.notes === "object" ? parsed.notes : {},
    spoilers: parsed ? parsed.spoilers !== false : true,
  };
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
