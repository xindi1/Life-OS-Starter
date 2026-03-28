const STORAGE_KEY = "life-os-starter-v1";
const THEME_KEY = "life-os-starter-theme-v1";
const CACHE_SAFE_VERSION = "1.0.0";

const MODULE_PATHS = {
  habits: "habit-engine/index.html",
  momentum: "momentum-chain/index.html",
  priority: "priority-engine/index.html"
};

const STORAGE_CANDIDATES = {
  habits: [
    `${STORAGE_KEY}-habit-engine`,
    "habit-engine",
    "habitEngine",
    "habit-engine-v1",
    STORAGE_KEY
  ],
  momentum: [
    `${STORAGE_KEY}-momentum-chain`,
    "momentum-chain",
    "momentumChain",
    "momentum-chain-v1",
    STORAGE_KEY
  ],
  priority: [
    `${STORAGE_KEY}-priority-engine`,
    "priority-engine",
    "priorityEngine",
    "priority-engine-v1",
    STORAGE_KEY
  ]
};

function readJsonStorage(keys) {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { key, data: parsed };
      }
    } catch (error) {
      console.warn("Could not parse storage key:", key, error);
    }
  }
  return { key: null, data: null };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

function computeDailyStreakFromDates(dates) {
  const set = new Set((dates || []).filter(Boolean));
  let streak = 0;
  const d = new Date();

  while (true) {
    const key = ymd(d);
    if (!set.has(key)) break;
    streak += 1;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

function computeWeeklyStreakFromDates(dates) {
  const set = new Set((dates || []).filter(Boolean));
  let streak = 0;
  const current = new Date();
  current.setHours(0, 0, 0, 0);

  while (true) {
    const weekStart = new Date(current);
    const day = weekStart.getDay();
    weekStart.setDate(weekStart.getDate() - day);

    let found = false;
    for (let i = 0; i < 7; i++) {
      const probe = new Date(weekStart);
      probe.setDate(weekStart.getDate() + i);
      if (set.has(ymd(probe))) {
        found = true;
        break;
      }
    }

    if (!found) break;
    streak += 1;
    current.setDate(current.getDate() - 7);
  }

  return streak;
}

function getHabitArray(data) {
  if (!data) return [];
  if (Array.isArray(data.habits)) return data.habits;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function getMomentumArray(data) {
  if (!data) return [];
  if (Array.isArray(data.chains)) return data.chains;
  if (Array.isArray(data.habits)) return data.habits;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function getPriorityArray(data) {
  if (!data) return [];
  if (Array.isArray(data.tasks)) return data.tasks;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function summarizeHabits(data) {
  const habits = getHabitArray(data);
  const today = todayKey();

  if (!habits.length) {
    return {
      value: "No habits",
      meta: "Open Habit Engine to begin the consistency layer.",
      todayMetric: "0 / 0",
      streakMetric: "0 active",
      signal: "Consistency signal: not started",
      state: "Not started",
      completionRate: 0
    };
  }

  const total = habits.length;
  const doneToday = habits.filter((habit) =>
    Array.isArray(habit.completedDates) && habit.completedDates.includes(today)
  ).length;

  const streaks = habits.map((habit) => {
    const frequency = String(habit.frequency || "daily").toLowerCase();
    const dates = Array.isArray(habit.completedDates) ? habit.completedDates : [];
    return frequency === "weekly"
      ? computeWeeklyStreakFromDates(dates)
      : computeDailyStreakFromDates(dates);
  });

  const activeStreaks = streaks.filter((s) => s > 0).length;
  const bestStreak = streaks.reduce((m, s) => Math.max(m, s), 0);
  const completionRate = total ? doneToday / total : 0;

  let state = "Idle";
  if (completionRate >= 0.8) state = "Strong";
  else if (completionRate >= 0.5) state = "In motion";
  else if (completionRate > 0) state = "Started";

  return {
    value: `${doneToday} / ${total}`,
    meta: `${Math.round(completionRate * 100)}% of habits complete today`,
    todayMetric: `${doneToday} / ${total}`,
    streakMetric: `${activeStreaks} active`,
    signal: `Consistency signal: ${state.toLowerCase()}`,
    state,
    completionRate,
    bestStreak
  };
}

function summarizeMomentum(data) {
  const chains = getMomentumArray(data);
  const today = todayKey();

  if (!chains.length) {
    return {
      value: "No chains",
      meta: "Open Momentum Chain to begin visible continuation.",
      todayMetric: "0 today",
      streakMetric: "0 active",
      signal: "Momentum signal: not started",
      state: "Not started",
      liveChains: 0
    };
  }

  const todayWins = chains.filter((chain) =>
    Array.isArray(chain.dates) && chain.dates.includes(today)
  ).length;

  const streaks = chains.map((chain) =>
    computeDailyStreakFromDates(Array.isArray(chain.dates) ? chain.dates : [])
  );

  const liveChains = streaks.filter((s) => s > 0).length;
  const longestActive = streaks.reduce((m, s) => Math.max(m, s), 0);

  let state = "Idle";
  if (todayWins >= 4 || liveChains >= 4) state = "Strong";
  else if (todayWins >= 2 || liveChains >= 2) state = "Building";
  else if (todayWins >= 1) state = "Started";

  return {
    value: `${todayWins} today`,
    meta: `${liveChains} live chains • longest ${longestActive}`,
    todayMetric: `${todayWins} today`,
    streakMetric: `${longestActive}`,
    signal: `Momentum signal: ${state.toLowerCase()}`,
    state,
    liveChains,
    longestActive
  };
}

function summarizePriority(data) {
  const tasks = getPriorityArray(data);

  if (!tasks.length) {
    return {
      value: "No priorities",
      meta: "Open Priority Engine to rank work and assign horizons.",
      nearTermMetric: "0",
      nbaMetric: "No action",
      signal: "Priority signal: not started",
      state: "Not started",
      nearTerm: 0
    };
  }

  const open = tasks.filter((task) => !task.completed);
  const nearTerm = open.filter((task) => Number(task.horizon) <= 1).length;

  const ranked = [...open]
    .filter((task) => Number(task.horizon) !== 5)
    .sort((a, b) => {
      const aScore = Number(a.score || 0);
      const bScore = Number(b.score || 0);
      if (bScore !== aScore) return bScore - aScore;
      const aH = Number(a.horizon || 0);
      const bH = Number(b.horizon || 0);
      if (aH !== bH) return aH - bH;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });

  const nextBest = ranked[0];
  let state = "Calm";
  if (nearTerm >= 5) state = "Heavy";
  else if (nearTerm >= 2) state = "Active";
  else if (nearTerm >= 1) state = "Focused";

  return {
    value: `${nearTerm} near-term`,
    meta: nextBest
      ? `Next best: ${String(nextBest.title || "Untitled").slice(0, 36)}`
      : "No non-Someday active task ranked yet",
    nearTermMetric: String(nearTerm),
    nbaMetric: nextBest ? String(nextBest.title || "Untitled").slice(0, 16) : "None",
    signal: `Priority signal: ${state.toLowerCase()}`,
    state,
    nearTerm
  };
}

function deriveSystemState(habitSummary, momentumSummary, prioritySummary) {
  const habitRate = habitSummary.completionRate || 0;
  const liveChains = momentumSummary.liveChains || 0;
  const nearTerm = prioritySummary.nearTerm || 0;

  if (habitRate >= 0.7 && liveChains >= 2 && nearTerm >= 1) {
    return {
      value: "System engaged",
      meta: "Consistency is active, momentum is visible, and priorities are ranked."
    };
  }

  if ((habitRate > 0 || liveChains > 0) && nearTerm >= 1) {
    return {
      value: "System in motion",
      meta: "The operating layer is alive, but still building full continuity."
    };
  }

  if (habitRate > 0 || liveChains > 0 || nearTerm > 0) {
    return {
      value: "System started",
      meta: "At least one module is active. Use the shell to tighten the loop."
    };
  }

  return {
    value: "System idle",
    meta: "Open a module below to begin the operating cycle."
  };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderDashboard() {
  const habitsSource = readJsonStorage(STORAGE_CANDIDATES.habits).data;
  const momentumSource = readJsonStorage(STORAGE_CANDIDATES.momentum).data;
  const prioritySource = readJsonStorage(STORAGE_CANDIDATES.priority).data;

  const habitSummary = summarizeHabits(habitsSource);
  const momentumSummary = summarizeMomentum(momentumSource);
  const prioritySummary = summarizePriority(prioritySource);
  const systemState = deriveSystemState(habitSummary, momentumSummary, prioritySummary);

  setText("systemState", systemState.value);
  setText("systemStateMeta", systemState.meta);

  setText("consistencyValue", habitSummary.value);
  setText("consistencyMeta", habitSummary.meta);

  setText("momentumValue", momentumSummary.value);
  setText("momentumMeta", momentumSummary.meta);

  setText("priorityValue", prioritySummary.value);
  setText("priorityMeta", prioritySummary.meta);

  setText("signalPillConsistency", habitSummary.signal);
  setText("signalPillMomentum", momentumSummary.signal);
  setText("signalPillPriority", prioritySummary.signal);

  setText("habitTodayMetric", habitSummary.todayMetric);
  setText("habitStreakMetric", habitSummary.streakMetric);

  setText("momentumTodayMetric", momentumSummary.todayMetric);
  setText("momentumStreakMetric", momentumSummary.streakMetric);

  setText("priorityNearTermMetric", prioritySummary.nearTermMetric);
  setText("priorityNbaMetric", prioritySummary.nbaMetric);
}

function initTheme() {
  const themeBtn = document.getElementById("themeBtn");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeBtn.textContent = `Theme: ${theme === "light" ? "Light" : "Dark"}`;
  }

  let savedTheme = "dark";
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark") savedTheme = raw;
  } catch (error) {
    console.warn("Theme load failed:", error);
  }

  applyTheme(savedTheme);

  themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (error) {
      console.warn("Theme save failed:", error);
    }
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./service-worker.js").catch((error) => {
        console.warn("Service worker registration failed:", error);
      });
    });
  }
}

function initRefresh() {
  renderDashboard();

  window.addEventListener("focus", renderDashboard);
  window.addEventListener("storage", renderDashboard);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) renderDashboard();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initRefresh();
  registerServiceWorker();
});