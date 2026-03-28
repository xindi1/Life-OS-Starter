const STORAGE_KEY = "momentum-chain-v1";
const THEME_KEY = "momentum-chain-theme-v1";

const DEFAULT_HABITS = [
  "Research / Study",
  "Writing / Narrative",
  "Exercise / Movement",
  "Market Review",
  "Deep Work Block",
  "Mental Health / Reflection"
];

let state = {
  habits: [],
  completions: {}
};

const chainBody = document.getElementById("chainBody");
const emptyState = document.getElementById("emptyState");
const newHabitInput = document.getElementById("newHabitInput");
const addHabitBtn = document.getElementById("addHabitBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleLabel = document.getElementById("themeToggleLabel");

const todayDateLabel = document.getElementById("todayDateLabel");
const todayStatusText = document.getElementById("todayStatusText");
const todayCompletionCount = document.getElementById("todayCompletionCount");
const todayCompletionText = document.getElementById("todayCompletionText");
const longestStreakCount = document.getElementById("longestStreakCount");
const longestStreakText = document.getElementById("longestStreakText");
const habitCountPill = document.getElementById("habitCountPill");
const todayPill = document.getElementById("todayPill");

const dayHeaderEls = [
  document.getElementById("dayHeader0"),
  document.getElementById("dayHeader1"),
  document.getElementById("dayHeader2"),
  document.getElementById("dayHeader3"),
  document.getElementById("dayHeader4"),
  document.getElementById("dayHeader5"),
  document.getElementById("dayHeader6")
];

function uid(prefix = "h") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getLastNDates(n) {
  const dates = [];
  const today = new Date();

  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  return dates;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        habits: Array.isArray(parsed.habits) ? parsed.habits : [],
        completions: parsed.completions && typeof parsed.completions === "object"
          ? parsed.completions
          : {}
      };
      return;
    }
  } catch (error) {
    console.warn("Unable to load state:", error);
  }

  state = {
    habits: DEFAULT_HABITS.map((name) => ({
      id: uid(),
      name,
      createdAt: new Date().toISOString()
    })),
    completions: {}
  };

  saveState();
}

function applyTheme(theme) {
  const nextTheme = theme === "ice" ? "ice" : "deep";
  document.body.setAttribute("data-theme", nextTheme);
  themeToggleLabel.textContent = nextTheme === "deep" ? "Dark" : "Light";

  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    console.warn("Unable to save theme:", error);
  }
}

function initTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    applyTheme(stored === "ice" ? "ice" : "deep");
  } catch (error) {
    applyTheme("deep");
  }
}

function toggleTheme() {
  const current = document.body.getAttribute("data-theme");
  applyTheme(current === "deep" ? "ice" : "deep");
}

function updateDayHeaders() {
  const days = getLastNDates(7);
  const todayKey = formatDateKey(new Date());

  days.forEach((date, index) => {
    const isToday = formatDateKey(date) === todayKey;
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    const dayNum = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: "short" });

    dayHeaderEls[index].innerHTML = `
      <div class="date-label">
        <span class="date-label-main">
          ${weekday} ${dayNum}
          ${isToday ? '<span class="today-pill">Today</span>' : ""}
        </span>
        <span class="date-label-sub">${month}</span>
      </div>
    `;
  });
}

function ensureDateMap(dateKey) {
  if (!state.completions[dateKey]) {
    state.completions[dateKey] = {};
  }
}

function toggleCompletion(dateKey, habitId) {
  ensureDateMap(dateKey);
  state.completions[dateKey][habitId] = !state.completions[dateKey][habitId];
  saveState();
  render();
}

function addHabit() {
  const name = newHabitInput.value.trim();

  if (!name) {
    newHabitInput.focus();
    return;
  }

  state.habits.push({
    id: uid(),
    name,
    createdAt: new Date().toISOString()
  });

  newHabitInput.value = "";
  saveState();
  render();
  newHabitInput.focus();
}

function editHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;

  const nextName = window.prompt("Rename behavior:", habit.name);
  if (nextName === null) return;

  const trimmed = nextName.trim();
  if (!trimmed) return;

  habit.name = trimmed;
  saveState();
  render();
}

function deleteHabit(habitId) {
  const habit = state.habits.find((item) => item.id === habitId);
  if (!habit) return;

  const confirmed = window.confirm(`Remove "${habit.name}" from Momentum Chain?`);
  if (!confirmed) return;

  state.habits = state.habits.filter((item) => item.id !== habitId);
  saveState();
  render();
}

function computeHabitStreak(habitId) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (true) {
    const dateKey = formatDateKey(cursor);
    const dayMap = state.completions[dateKey] || {};

    if (dayMap[habitId]) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function computeStats() {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const todayMap = state.completions[todayKey] || {};
  const totalHabits = state.habits.length;
  const completedToday = state.habits.filter((habit) => todayMap[habit.id]).length;

  let longest = 0;
  let longestName = "";

  state.habits.forEach((habit) => {
    const streak = computeHabitStreak(habit.id);
    if (streak > longest) {
      longest = streak;
      longestName = habit.name;
    }
  });

  return {
    totalHabits,
    completedToday,
    longest,
    longestName
  };
}

function renderHero(stats) {
  const today = new Date();
  const todayPretty = today.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  todayDateLabel.textContent = todayPretty;

  if (stats.totalHabits === 0) {
    todayStatusText.textContent = "No behaviors defined yet.";
  } else if (stats.completedToday === stats.totalHabits) {
    todayStatusText.textContent = "All tracked behaviors were completed today.";
  } else if (stats.completedToday === 0) {
    todayStatusText.textContent = "No behaviors marked complete yet today.";
  } else {
    todayStatusText.textContent = `${stats.completedToday} of ${stats.totalHabits} behaviors completed today.`;
  }

  todayCompletionCount.textContent = `${stats.completedToday}/${stats.totalHabits}`;
  todayCompletionText.textContent =
    stats.totalHabits > 0
      ? `${stats.totalHabits - stats.completedToday} remaining to hit full continuity today.`
      : "Start by adding your first behavior.";

  longestStreakCount.textContent = String(stats.longest);
  longestStreakText.textContent =
    stats.longest > 0
      ? `${stats.longestName} is currently leading the chain.`
      : "No active streaks yet.";

  habitCountPill.textContent = `${stats.totalHabits} behavior${stats.totalHabits === 1 ? "" : "s"}`;
  todayPill.textContent = `Today • ${stats.completedToday}/${stats.totalHabits}`;
}

function buildHabitRow(habit, dateKeys) {
  const row = document.createElement("tr");
  const streak = computeHabitStreak(habit.id);

  const th = document.createElement("th");
  th.className = "habit-col";
  th.innerHTML = `
    <div class="habit-cell">
      <div class="habit-name-row">
        <span class="habit-name">${escapeHtml(habit.name)}</span>

        <div class="habit-actions">
          <button class="icon-button edit-button" type="button" title="Rename behavior" aria-label="Rename behavior">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 4h9" />
              <path d="M4 20h16" />
              <path d="M5 13l8-8 4 4-8 8-4 1z" />
            </svg>
          </button>

          <button class="icon-button icon-danger delete-button" type="button" title="Delete behavior" aria-label="Delete behavior">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M6 7l1-3h10l1 3" />
              <path d="M9 20h6" />
            </svg>
          </button>
        </div>
      </div>

      <div class="habit-meta">
        <span class="habit-meta-pill">🔥 Streak: ${streak} day${streak === 1 ? "" : "s"}</span>
      </div>
    </div>
  `;

  const editBtn = th.querySelector(".edit-button");
  const deleteBtn = th.querySelector(".delete-button");

  editBtn.addEventListener("click", () => editHabit(habit.id));
  deleteBtn.addEventListener("click", () => deleteHabit(habit.id));

  row.appendChild(th);

  dateKeys.forEach((dateKey) => {
    const td = document.createElement("td");
    td.style.textAlign = "center";

    const dayMap = state.completions[dateKey] || {};
    const completed = Boolean(dayMap[habit.id]);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `chain-dot${completed ? " completed" : ""}`;
    button.title = `${completed ? "Marked done" : "Tap to mark done"} for ${dateKey}`;
    button.setAttribute("aria-label", `${completed ? "Completed" : "Not completed"} on ${dateKey}`);
    button.textContent = completed ? "✓" : "";

    button.addEventListener("click", () => toggleCompletion(dateKey, habit.id));

    td.appendChild(button);
    row.appendChild(td);
  });

  return row;
}

function renderTable() {
  chainBody.innerHTML = "";

  if (!state.habits.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  const days = getLastNDates(7);
  const dateKeys = days.map(formatDateKey);

  state.habits.forEach((habit) => {
    chainBody.appendChild(buildHabitRow(habit, dateKeys));
  });
}

function render() {
  updateDayHeaders();
  renderTable();
  renderHero(computeStats());
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registration failed:", error);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadState();
  render();
  registerServiceWorker();
});

addHabitBtn.addEventListener("click", addHabit);

newHabitInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addHabit();
  }
});

themeToggleBtn.addEventListener("click", toggleTheme);