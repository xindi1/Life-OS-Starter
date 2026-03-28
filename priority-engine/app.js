const STORAGE_KEY = "priority-engine-v1";
const THEME_KEY = "priority-engine-v1-theme";

const HORIZONS = [
  {
    id: 0,
    name: "Horizon 0 – Today / 48 Hours",
    short: "Today",
    hint: "Immediate priorities that deserve action now or very soon."
  },
  {
    id: 1,
    name: "Horizon 1 – Next 7 Days",
    short: "7 Days",
    hint: "Near-term work that should be actively advancing this week."
  },
  {
    id: 2,
    name: "Horizon 2 – Next 30 Days",
    short: "30 Days",
    hint: "Important monthly priorities that need steady progress."
  },
  {
    id: 3,
    name: "Horizon 3 – Next 90 Days",
    short: "90 Days",
    hint: "Quarter-scale work, structured initiatives, and strategic builds."
  },
  {
    id: 4,
    name: "Horizon 4 – 6–12 Months",
    short: "6–12 Months",
    hint: "Longer-range priorities worth keeping visible and intentional."
  },
  {
    id: 5,
    name: "Horizon 5 – Someday / Parking Lot",
    short: "Someday",
    hint: "Ideas, possibilities, and low-commitment future options."
  }
];

let tasks = [];

const els = {
  themeBtn: document.getElementById("themeBtn"),
  taskForm: document.getElementById("task-form"),
  taskTitle: document.getElementById("task-title"),
  taskCategory: document.getElementById("task-category"),
  taskNotes: document.getElementById("task-notes"),
  impactScore: document.getElementById("impact-score"),
  effortScore: document.getElementById("effort-score"),
  revenueScore: document.getElementById("revenue-score"),
  urgencyScore: document.getElementById("urgency-score"),
  momentumScore: document.getElementById("momentum-score"),
  nbaPanel: document.getElementById("nba-panel"),
  horizonsGrid: document.getElementById("horizons-grid"),
  horizonSummaryGrid: document.getElementById("horizon-summary-grid"),
  exportBtn: document.getElementById("btn-export-csv")
};

function generateId() {
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function computeScore(task) {
  const impact = Number(task.impact) || 0;
  const effort = Number(task.effort) || 0;
  const revenue = Number(task.revenue) || 0;
  const urgency = Number(task.urgency) || 0;
  const momentum = Number(task.momentum) || 0;

  const raw =
    impact * 0.4 +
    revenue * 0.25 +
    urgency * 0.1 +
    momentum * 0.1 -
    effort * 0.15;

  let scaled = Math.round(raw * 25);
  if (scaled < 0) scaled = 0;
  if (scaled > 100) scaled = 100;
  return scaled;
}

function autoAssignHorizon(score, urgency) {
  const u = Number(urgency) || 0;

  if (u >= 5 || (u >= 4 && score >= 70)) {
    return 0;
  } else if (u >= 4 || (u >= 3 && score >= 60)) {
    return 1;
  } else if (u >= 2 && score >= 50) {
    return 2;
  } else if (score >= 45) {
    return 3;
  } else if (score >= 35) {
    return 4;
  }
  return 5;
}

function scoreClass(score) {
  if (score >= 70) return "score-high";
  if (score >= 45) return "score-medium";
  return "score-low";
}

function horizonName(id) {
  const horizon = HORIZONS.find((item) => item.id === id);
  return horizon ? horizon.name : "Unknown";
}

function horizonShort(id) {
  const horizon = HORIZONS.find((item) => item.id === id);
  return horizon ? horizon.short : "Unknown";
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.warn("Unable to save Priority Engine state.", error);
  }
}

function seedExampleTasks() {
  const now = Date.now();
  const baseTasks = [
    {
      title: "Complete the most important project deliverable",
      category: "Product / Build",
      notes: "Focus on the clearest next action that creates visible progress.",
      impact: 5,
      effort: 3,
      revenue: 4,
      urgency: 4,
      momentum: 5
    },
    {
      title: "Handle an important operational responsibility",
      category: "Operations / Admin",
      notes: "Reduce friction and prevent avoidable delays.",
      impact: 3,
      effort: 2,
      revenue: 2,
      urgency: 4,
      momentum: 3
    },
    {
      title: "Advance a meaningful personal or wellness priority",
      category: "Health / Wellness",
      notes: "Protect consistency in an area that benefits long-term performance.",
      impact: 4,
      effort: 2,
      revenue: 1,
      urgency: 3,
      momentum: 4
    },
    {
      title: "Develop a longer-term growth opportunity",
      category: "Business / Revenue",
      notes: "Build something with future payoff even if it is not urgent today.",
      impact: 5,
      effort: 4,
      revenue: 5,
      urgency: 2,
      momentum: 4
    }
  ];

  return baseTasks.map((task, index) => {
    const score = computeScore(task);
    return {
      id: generateId(),
      title: task.title,
      category: task.category,
      notes: task.notes,
      impact: task.impact,
      effort: task.effort,
      revenue: task.revenue,
      urgency: task.urgency,
      momentum: task.momentum,
      score,
      horizon: autoAssignHorizon(score, task.urgency),
      createdAt: now - index * 1000,
      completed: false
    };
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      tasks = seedExampleTasks();
      return;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      tasks = parsed.map((task) => ({
        ...task,
        score: computeScore(task)
      }));
      return;
    }
  } catch (error) {
    console.warn("Unable to load Priority Engine state.", error);
  }

  tasks = seedExampleTasks();
}

function updateThemeLabel() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  els.themeBtn.textContent = currentTheme === "light" ? "Theme: Light" : "Theme: Dark";
}

function initializeTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light" || savedTheme === "dark") {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  updateThemeLabel();
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nextTheme);
  updateThemeLabel();

  try {
    localStorage.setItem(THEME_KEY, nextTheme);
  } catch (error) {
    console.warn("Unable to save theme.", error);
  }
}

function sortPriorityTasks(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (a.horizon !== b.horizon) return a.horizon - b.horizon;
  return b.createdAt - a.createdAt;
}

function renderNextBestAction() {
  els.nbaPanel.innerHTML = "";

  const activeTasks = tasks
    .filter((task) => !task.completed && task.horizon !== 5)
    .sort(sortPriorityTasks);

  if (!activeTasks.length) {
    const empty = document.createElement("div");
    empty.className = "nba-empty";
    empty.textContent = "No active tasks yet. Add a task below to identify the current Next Best Action.";
    els.nbaPanel.appendChild(empty);
    return;
  }

  const task = activeTasks[0];

  const label = document.createElement("div");
  label.className = "nba-label";
  label.textContent = "Current Next Best Action";

  const title = document.createElement("div");
  title.className = "nba-task";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "nba-meta";
  meta.innerHTML = `
    <span class="meta-chip">Score ${task.score}</span>
    <span class="horizon-chip">${horizonShort(task.horizon)}</span>
    <span class="category-chip">${escapeHtml(task.category)}</span>
  `;

  els.nbaPanel.appendChild(label);
  els.nbaPanel.appendChild(title);
  els.nbaPanel.appendChild(meta);

  if (task.notes && task.notes.trim()) {
    const note = document.createElement("div");
    note.className = "nba-note";
    note.textContent = `Note: ${task.notes}`;
    els.nbaPanel.appendChild(note);
  }
}

function renderHorizonSummaries() {
  els.horizonSummaryGrid.innerHTML = "";

  HORIZONS.forEach((horizon) => {
    const horizonTasks = tasks.filter((task) => task.horizon === horizon.id);
    const activeCount = horizonTasks.filter((task) => !task.completed).length;
    const averageScore = horizonTasks.length
      ? Math.round(
          horizonTasks.reduce((sum, task) => sum + Number(task.score || 0), 0) / horizonTasks.length
        )
      : 0;

    const topTask = horizonTasks
      .filter((task) => !task.completed)
      .sort(sortPriorityTasks)[0];

    const card = document.createElement("article");
    card.className = "summary-card";
    card.innerHTML = `
      <div class="summary-card-top">
        <div class="summary-label">${escapeHtml(horizon.short)}</div>
        <div class="summary-stat">${activeCount} active</div>
      </div>
      <div class="summary-hint">${escapeHtml(horizon.hint)}</div>
      <div class="summary-stats">
        <span class="summary-stat">Avg score ${horizonTasks.length ? averageScore : "-"}</span>
        <span class="summary-stat">Total ${horizonTasks.length}</span>
      </div>
      <div class="summary-hint">
        ${topTask ? `Top item: ${escapeHtml(topTask.title)}` : "Top item: None yet"}
      </div>
    `;
    els.horizonSummaryGrid.appendChild(card);
  });
}

function renderHorizons() {
  els.horizonsGrid.innerHTML = "";

  HORIZONS.forEach((horizon) => {
    const horizonTasks = tasks
      .filter((task) => task.horizon === horizon.id)
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return sortPriorityTasks(a, b);
      });

    const activeCount = horizonTasks.filter((task) => !task.completed).length;
    const averageScore = horizonTasks.length
      ? Math.round(
          horizonTasks.reduce((sum, task) => sum + Number(task.score || 0), 0) / horizonTasks.length
        )
      : 0;

    const card = document.createElement("section");
    card.className = "horizon-card";

    const head = document.createElement("div");
    head.className = "horizon-head";
    head.innerHTML = `
      <div class="horizon-title-wrap">
        <div class="horizon-title">${escapeHtml(horizon.name)}</div>
        <div class="horizon-hint">${escapeHtml(horizon.hint)}</div>
      </div>
      <div class="horizon-meta">
        <span class="meta-chip">${activeCount} active</span>
        <span class="meta-chip">Avg ${horizonTasks.length ? averageScore : "-"}</span>
      </div>
    `;

    const body = document.createElement("div");
    body.className = "horizon-body";

    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Task</th>
          <th>Cat</th>
          <th>Score</th>
          <th>I</th>
          <th>E</th>
          <th>R</th>
          <th>U</th>
          <th>M</th>
          <th>Controls</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector("tbody");

    if (!horizonTasks.length) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="9" class="task-sub">No tasks in this horizon yet.</td>
      `;
      tbody.appendChild(row);
    } else {
      horizonTasks.forEach((task) => {
        const row = document.createElement("tr");
        if (task.completed) {
          row.classList.add("completed-row");
        }

        const taskCell = document.createElement("td");
        taskCell.className = "task-cell";
        taskCell.innerHTML = `
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-sub">${escapeHtml(task.notes || task.category)}</div>
        `;

        const categoryCell = document.createElement("td");
        categoryCell.textContent = String(task.category || "—")
          .split("/")[0]
          .trim()
          .slice(0, 10);

        const scoreCell = document.createElement("td");
        scoreCell.innerHTML = `<span class="score-chip ${scoreClass(task.score)}">${task.score}</span>`;

        const impactCell = document.createElement("td");
        impactCell.textContent = String(task.impact);

        const effortCell = document.createElement("td");
        effortCell.textContent = String(task.effort);

        const revenueCell = document.createElement("td");
        revenueCell.textContent = String(task.revenue);

        const urgencyCell = document.createElement("td");
        urgencyCell.textContent = String(task.urgency);

        const momentumCell = document.createElement("td");
        momentumCell.textContent = String(task.momentum);

        const controlsCell = document.createElement("td");
        controlsCell.className = "controls-cell";

        const controlsWrap = document.createElement("div");
        controlsWrap.className = "controls-wrap";

        const upButton = createControlButton("⬆", "Bring closer", () =>
          moveTaskHorizons(task.id, -1)
        );
        const downButton = createControlButton("⬇", "Push further out", () =>
          moveTaskHorizons(task.id, 1)
        );
        const toggleButton = createControlButton(
          task.completed ? "↩" : "✔",
          task.completed ? "Mark active" : "Mark complete",
          () => toggleCompleted(task.id)
        );
        const deleteButton = createControlButton(
          "✕",
          "Delete task",
          () => deleteTask(task.id),
          true
        );

        controlsWrap.append(upButton, downButton, toggleButton, deleteButton);
        controlsCell.appendChild(controlsWrap);

        row.append(
          taskCell,
          categoryCell,
          scoreCell,
          impactCell,
          effortCell,
          revenueCell,
          urgencyCell,
          momentumCell,
          controlsCell
        );

        tbody.appendChild(row);
      });
    }

    body.appendChild(table);
    card.append(head, body);
    els.horizonsGrid.appendChild(card);
  });
}

function createControlButton(label, title, onClick, isDanger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `control-btn${isDanger ? " control-btn-danger" : ""}`;
  button.textContent = label;
  button.title = title;
  button.addEventListener("click", onClick);
  return button;
}

function renderAll() {
  tasks = tasks.map((task) => ({
    ...task,
    score: computeScore(task)
  }));

  saveState();
  renderNextBestAction();
  renderHorizonSummaries();
  renderHorizons();
}

function addTaskFromForm(event) {
  event.preventDefault();

  const title = els.taskTitle.value.trim();
  if (!title) return;

  const task = {
    id: generateId(),
    title,
    category: els.taskCategory.value,
    notes: els.taskNotes.value.trim(),
    impact: Number(els.impactScore.value),
    effort: Number(els.effortScore.value),
    revenue: Number(els.revenueScore.value),
    urgency: Number(els.urgencyScore.value),
    momentum: Number(els.momentumScore.value),
    score: 0,
    horizon: 0,
    createdAt: Date.now(),
    completed: false
  };

  task.score = computeScore(task);
  task.horizon = autoAssignHorizon(task.score, task.urgency);

  tasks.push(task);
  renderAll();

  els.taskTitle.value = "";
  els.taskNotes.value = "";
  els.taskTitle.focus();
}

function moveTaskHorizons(taskId, delta) {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return;

  const task = tasks[index];
  const nextHorizon = Math.min(Math.max(task.horizon + delta, 0), HORIZONS.length - 1);

  tasks[index] = {
    ...task,
    horizon: nextHorizon
  };

  renderAll();
}

function toggleCompleted(taskId) {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return;

  tasks[index] = {
    ...tasks[index],
    completed: !tasks[index].completed
  };

  renderAll();
}

function deleteTask(taskId) {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return;

  const confirmed = window.confirm("Delete this task?");
  if (!confirmed) return;

  tasks.splice(index, 1);
  renderAll();
}

function exportTasksToCSV() {
  if (!tasks.length) {
    window.alert("No tasks to export yet.");
    return;
  }

  const headers = [
    "Title",
    "Category",
    "Notes",
    "Impact",
    "Effort",
    "Revenue",
    "Urgency",
    "Momentum",
    "Score",
    "Horizon",
    "Horizon Name",
    "Completed",
    "Created At"
  ];

  const rows = tasks.map((task) => [
    task.title,
    task.category,
    task.notes || "",
    task.impact,
    task.effort,
    task.revenue,
    task.urgency,
    task.momentum,
    task.score,
    task.horizon,
    horizonName(task.horizon),
    task.completed ? "Yes" : "No",
    new Date(task.createdAt).toISOString()
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((value) => {
          const stringValue = String(value ?? "");
          if (
            stringValue.includes(",") ||
            stringValue.includes('"') ||
            stringValue.includes("\n")
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "priority_engine_tasks.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  });
}

function initializeApp() {
  initializeTheme();
  loadState();
  renderAll();

  els.themeBtn.addEventListener("click", toggleTheme);
  els.taskForm.addEventListener("submit", addTaskFromForm);
  els.exportBtn.addEventListener("click", exportTasksToCSV);

  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", initializeApp);