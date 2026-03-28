(() => {
  const STORAGE_KEY = "habit-engine-v1";
  const THEME_KEY = "habit-engine-theme-v1";
  const XP_PER_HABIT_SAVE = 10;

  const DEFAULT_DATA = {
    categories: [
      {
        id: "cat_health",
        title: "Health",
        note: "Body, energy, recovery, and baseline maintenance.",
        badge: "Health",
        habitIds: [
          "habit_move_body",
          "habit_water",
          "habit_sleep_reset"
        ]
      },
      {
        id: "cat_work",
        title: "Work",
        note: "Execution, consistency, and professional discipline.",
        badge: "Work",
        habitIds: [
          "habit_plan_day",
          "habit_deep_work",
          "habit_review_progress"
        ]
      },
      {
        id: "cat_learning",
        title: "Learning",
        note: "Skill-building and long-term development habits.",
        badge: "Learning",
        habitIds: [
          "habit_study",
          "habit_read",
          "habit_practice_skill"
        ]
      },
      {
        id: "cat_personal",
        title: "Personal",
        note: "Daily maintenance, environment, and self-management.",
        badge: "Personal",
        habitIds: [
          "habit_reset_space",
          "habit_reflect",
          "habit_prepare_tomorrow"
        ]
      }
    ],
    habitLibrary: {
      habit_move_body: {
        id: "habit_move_body",
        label: "Move body for at least 20 minutes"
      },
      habit_water: {
        id: "habit_water",
        label: "Hit daily water target"
      },
      habit_sleep_reset: {
        id: "habit_sleep_reset",
        label: "Protect evening wind-down / sleep routine"
      },

      habit_plan_day: {
        id: "habit_plan_day",
        label: "Review priorities for the day"
      },
      habit_deep_work: {
        id: "habit_deep_work",
        label: "Complete one focused work block"
      },
      habit_review_progress: {
        id: "habit_review_progress",
        label: "Review work progress before close"
      },

      habit_study: {
        id: "habit_study",
        label: "Study for at least 15 minutes"
      },
      habit_read: {
        id: "habit_read",
        label: "Read for at least 10 minutes"
      },
      habit_practice_skill: {
        id: "habit_practice_skill",
        label: "Practice one core skill"
      },

      habit_reset_space: {
        id: "habit_reset_space",
        label: "Reset physical space"
      },
      habit_reflect: {
        id: "habit_reflect",
        label: "Complete a short daily reflection"
      },
      habit_prepare_tomorrow: {
        id: "habit_prepare_tomorrow",
        label: "Prepare tomorrow before ending the day"
      }
    },
    habits: {},
    xp: {
      total: 0,
      lastXPUpdate: null,
      habitsSavedToday: 0
    },
    review: {}
  };

  const dom = {
    habitSections: document.getElementById("habit-sections"),
    managerSections: document.getElementById("manager-sections"),
    todayDateLabel: document.getElementById("today-date-label"),
    todayCompletion: document.getElementById("today-completion"),
    heroCompletionCount: document.getElementById("hero-completion-count"),
    heroCompletionPercent: document.getElementById("hero-completion-percent"),
    activeStreakCount: document.getElementById("active-streak-count"),
    heroXpTotal: document.getElementById("hero-xp-total"),
    heroLevelLabel: document.getElementById("hero-level-label"),
    summaryCompletionMain: document.getElementById("summary-completion-main"),
    summaryCompletionDetail: document.getElementById("summary-completion-detail"),
    bestStreakValue: document.getElementById("best-streak-value"),
    bestStreakName: document.getElementById("best-streak-name"),
    saveTodayBtn: document.getElementById("save-today-btn"),
    saveStatusText: document.getElementById("save-status-text"),
    resetDataBtn: document.getElementById("reset-data-btn"),
    xpHabitsToday: document.getElementById("xp-habits-today"),
    xpLevelLabel: document.getElementById("xp-level-label"),
    xpTotalLabel: document.getElementById("xp-total-label"),
    xpFill: document.getElementById("xp-fill"),
    xpCurrentSegment: document.getElementById("xp-current-segment"),
    xpTodayNote: document.getElementById("xp-today-note"),
    reviewWorked: document.getElementById("review-worked"),
    reviewDidnt: document.getElementById("review-didnt"),
    reviewFocus: document.getElementById("review-focus"),
    saveReviewBtn: document.getElementById("save-review-btn"),
    reviewStatusText: document.getElementById("review-status-text"),
    themeToggleCheckbox: document.getElementById("theme-toggle-checkbox"),
    newCategoryTitle: document.getElementById("new-category-title"),
    newCategoryNote: document.getElementById("new-category-note"),
    newCategoryBadge: document.getElementById("new-category-badge"),
    addCategoryBtn: document.getElementById("add-category-btn"),
    manageStatusText: document.getElementById("manage-status-text")
  };

  const state = loadData();
  const today = new Date();
  const todayStr = toDateKey(today);

  normalizeState();
  applyTheme(loadTheme());
  renderAll();
  bindEvents();
  registerServiceWorker();

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatReadableDate(date) {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function getYesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return toDateKey(d);
  }

  function formatLastDone(dateStr) {
    if (!dateStr) return "Last: —";
    if (dateStr === todayStr) return "Last: today";
    if (dateStr === getYesterdayStr()) return "Last: yesterday";
    return `Last: ${dateStr}`;
  }

  function makeId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return clone(DEFAULT_DATA);
      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to load habit data", error);
      return clone(DEFAULT_DATA);
    }
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save habit data", error);
    }
  }

  function loadTheme() {
    try {
      return localStorage.getItem(THEME_KEY) || "dark";
    } catch (error) {
      return "dark";
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error("Failed to save theme", error);
    }
  }

  function applyTheme(theme) {
    const isLight = theme === "light";
    document.body.classList.toggle("theme-light", isLight);
    document.body.classList.toggle("theme-dark", !isLight);
    if (dom.themeToggleCheckbox) {
      dom.themeToggleCheckbox.checked = isLight;
    }
  }

  function normalizeState() {
    if (!Array.isArray(state.categories) || !state.categories.length) {
      state.categories = clone(DEFAULT_DATA.categories);
    }

    if (!state.habitLibrary || typeof state.habitLibrary !== "object") {
      state.habitLibrary = clone(DEFAULT_DATA.habitLibrary);
    }

    if (!state.habits || typeof state.habits !== "object") {
      state.habits = {};
    }

    if (!state.xp || typeof state.xp !== "object") {
      state.xp = {
        total: 0,
        lastXPUpdate: null,
        habitsSavedToday: 0
      };
    }

    if (!state.review || typeof state.review !== "object") {
      state.review = {};
    }

    state.categories = state.categories.map(category => ({
      id: category.id || makeId("cat"),
      title: category.title || "Untitled Category",
      note: category.note || "",
      badge: category.badge || category.title || "Category",
      habitIds: Array.isArray(category.habitIds) ? category.habitIds.filter(Boolean) : []
    }));

    Object.keys(state.habitLibrary).forEach(habitId => {
      const habit = state.habitLibrary[habitId];
      if (!habit || !habit.label) {
        delete state.habitLibrary[habitId];
      }
    });

    state.categories.forEach(category => {
      category.habitIds = category.habitIds.filter(habitId => !!state.habitLibrary[habitId]);
    });

    const allHabitIds = getAllHabitIds();

    allHabitIds.forEach(habitId => {
      if (!state.habits[habitId]) {
        state.habits[habitId] = {
          streak: 0,
          lastCompleted: null
        };
      } else {
        state.habits[habitId].streak = Number(state.habits[habitId].streak || 0);
        state.habits[habitId].lastCompleted = state.habits[habitId].lastCompleted || null;
      }
    });

    Object.keys(state.habits).forEach(habitId => {
      if (!allHabitIds.includes(habitId)) {
        delete state.habits[habitId];
      }
    });

    saveData();
  }

  function getAllHabitIds() {
    return state.categories.flatMap(category => category.habitIds).filter(Boolean);
  }

  function getTotalHabitCount() {
    return getAllHabitIds().length;
  }

  function renderAll() {
    renderHabitSections();
    renderManagerSections();
    loadWeeklyReview();
    if (dom.todayDateLabel) {
      dom.todayDateLabel.textContent = `Today • ${formatReadableDate(today)}`;
    }
    updateAllDisplays();
  }

  function renderHabitSections() {
    if (!dom.habitSections) return;

    if (!state.categories.length) {
      dom.habitSections.innerHTML = `
        <div class="category-card">
          <div class="category-title">No categories yet</div>
          <div class="category-note">Add one below to start building the habit system.</div>
        </div>
      `;
      return;
    }

    dom.habitSections.innerHTML = state.categories.map(category => {
      const habitRows = category.habitIds.map(habitId => {
        const habit = state.habitLibrary[habitId];
        const record = state.habits[habitId] || { streak: 0, lastCompleted: null };
        const checked = record.lastCompleted === todayStr ? "checked" : "";

        return `
          <div class="habit-item" data-habit-id="${escapeHtml(habitId)}">
            <div class="habit-check">
              <input type="checkbox" aria-label="${escapeHtml(habit.label)}" ${checked} />
            </div>
            <div class="habit-main">
              <div class="habit-name">${escapeHtml(habit.label)}</div>
            </div>
            <div class="habit-meta">
              <div class="streak-pill" data-streak>${record.streak || 0}d</div>
              <div class="last-done" data-last-done>${escapeHtml(formatLastDone(record.lastCompleted))}</div>
            </div>
          </div>
        `;
      }).join("");

      return `
        <section class="category-card" data-category-id="${escapeHtml(category.id)}">
          <div class="category-head">
            <div class="category-title-wrap">
              <div class="category-title">${escapeHtml(category.title)}</div>
              <div class="category-note">${escapeHtml(category.note || "")}</div>
            </div>
            <div class="category-badge">${escapeHtml(category.badge || category.title)}</div>
          </div>
          <div class="habit-list">
            ${habitRows || `<div class="category-note">No habits in this category yet.</div>`}
          </div>
        </section>
      `;
    }).join("");
  }

  function renderManagerSections() {
    if (!dom.managerSections) return;

    if (!state.categories.length) {
      dom.managerSections.innerHTML = "";
      return;
    }

    const categoryOptions = state.categories.map(category => {
      return `<option value="${escapeHtml(category.id)}">${escapeHtml(category.title)}</option>`;
    }).join("");

    dom.managerSections.innerHTML = state.categories.map(category => {
      const habitEditors = category.habitIds.map(habitId => {
        const habit = state.habitLibrary[habitId];

        return `
          <div class="habit-editor-item" data-habit-editor-id="${escapeHtml(habitId)}">
            <input
              type="text"
              class="compact habit-rename-input"
              data-habit-id="${escapeHtml(habitId)}"
              value="${escapeHtmlAttr(habit.label)}"
              aria-label="Habit label"
            />
            <select class="compact habit-move-select" data-habit-id="${escapeHtml(habitId)}">
              ${state.categories.map(optionCategory => `
                <option value="${escapeHtml(optionCategory.id)}" ${optionCategory.id === category.id ? "selected" : ""}>
                  ${escapeHtml(optionCategory.title)}
                </option>
              `).join("")}
            </select>
            <div class="inline-actions">
              <button class="btn btn-secondary save-habit-btn" data-habit-id="${escapeHtml(habitId)}">Save</button>
              <button class="btn btn-danger delete-habit-btn" data-habit-id="${escapeHtml(habitId)}">Delete</button>
            </div>
          </div>
        `;
      }).join("");

      return `
        <section class="manager-card" data-manager-category-id="${escapeHtml(category.id)}">
          <div class="manager-card-head">
            <div>
              <div class="manager-card-title">${escapeHtml(category.title)}</div>
              <div class="manager-card-note">Rename the bucket, edit its copy, add habits, or remove it.</div>
            </div>
            <button class="btn btn-danger delete-category-btn" data-category-id="${escapeHtml(category.id)}">Delete category</button>
          </div>

          <div class="manager-row manager-row-3">
            <input
              type="text"
              class="compact category-title-input"
              data-category-id="${escapeHtml(category.id)}"
              value="${escapeHtmlAttr(category.title)}"
              placeholder="Category title"
            />
            <input
              type="text"
              class="compact category-note-input"
              data-category-id="${escapeHtml(category.id)}"
              value="${escapeHtmlAttr(category.note || "")}"
              placeholder="Category note"
            />
            <input
              type="text"
              class="compact category-badge-input"
              data-category-id="${escapeHtml(category.id)}"
              value="${escapeHtmlAttr(category.badge || category.title)}"
              placeholder="Badge"
            />
          </div>

          <div class="manager-actions" style="margin-top:10px;">
            <button class="btn btn-secondary save-category-btn" data-category-id="${escapeHtml(category.id)}">Save category</button>
          </div>

          <div class="habit-editor-list">
            ${habitEditors || `<div class="category-note">No habits in this category yet.</div>`}
          </div>

          <div class="manager-row manager-row-3" style="margin-top:12px;">
            <input
              type="text"
              class="compact add-habit-input"
              data-category-id="${escapeHtml(category.id)}"
              placeholder="New habit label"
            />
            <select class="compact add-habit-target" data-category-id="${escapeHtml(category.id)}">
              ${categoryOptions}
            </select>
            <button class="btn btn-primary add-habit-btn" data-category-id="${escapeHtml(category.id)}">Add habit</button>
          </div>
        </section>
      `;
    }).join("");
  }

  function bindEvents() {
    if (dom.themeToggleCheckbox) {
      dom.themeToggleCheckbox.addEventListener("change", () => {
        const nextTheme = dom.themeToggleCheckbox.checked ? "light" : "dark";
        applyTheme(nextTheme);
        saveTheme(nextTheme);
      });
    }

    if (dom.saveTodayBtn) {
      dom.saveTodayBtn.addEventListener("click", saveTodayProgress);
    }

    if (dom.resetDataBtn) {
      dom.resetDataBtn.addEventListener("click", resetAllData);
    }

    if (dom.saveReviewBtn) {
      dom.saveReviewBtn.addEventListener("click", saveWeeklyReview);
    }

    if (dom.addCategoryBtn) {
      dom.addCategoryBtn.addEventListener("click", addCategory);
    }

    document.addEventListener("change", event => {
      if (event.target.matches(".habit-item input[type='checkbox']")) {
        updateCompletionDisplays();
      }
    });

    document.addEventListener("click", event => {
      const target = event.target;

      if (target.matches(".save-category-btn")) {
        saveCategoryEdits(target.getAttribute("data-category-id"));
      }

      if (target.matches(".delete-category-btn")) {
        deleteCategory(target.getAttribute("data-category-id"));
      }

      if (target.matches(".add-habit-btn")) {
        addHabit(target.getAttribute("data-category-id"));
      }

      if (target.matches(".save-habit-btn")) {
        saveHabitEdits(target.getAttribute("data-habit-id"));
      }

      if (target.matches(".delete-habit-btn")) {
        deleteHabit(target.getAttribute("data-habit-id"));
      }
    });
  }

  function getCheckedHabitCount() {
    return [...document.querySelectorAll(".habit-item input[type='checkbox']")]
      .filter(input => input.checked).length;
  }

  function updateCompletionDisplays() {
    const total = getTotalHabitCount();
    const completed = getCheckedHabitCount();
    const percent = total ? Math.round((completed / total) * 100) : 0;

    if (dom.todayCompletion) dom.todayCompletion.textContent = `${completed} / ${total} complete`;
    if (dom.heroCompletionCount) dom.heroCompletionCount.textContent = `${completed} / ${total}`;
    if (dom.heroCompletionPercent) dom.heroCompletionPercent.textContent = `${percent}% complete`;
    if (dom.summaryCompletionMain) dom.summaryCompletionMain.textContent = `${completed} / ${total}`;
    if (dom.summaryCompletionDetail) dom.summaryCompletionDetail.textContent = `${percent}% of habits complete today`;
  }

  function updateStreakSummary() {
    const items = getAllHabitIds().map(habitId => {
      const habit = state.habitLibrary[habitId];
      const record = state.habits[habitId] || { streak: 0, lastCompleted: null };
      return {
        id: habitId,
        label: habit ? habit.label : "Unknown Habit",
        streak: record.streak || 0
      };
    });

    const activeStreaks = items.filter(item => item.streak > 0);
    if (dom.activeStreakCount) dom.activeStreakCount.textContent = String(activeStreaks.length);

    const best = [...items].sort((a, b) => b.streak - a.streak)[0];
    if (best && best.streak > 0) {
      if (dom.bestStreakValue) dom.bestStreakValue.textContent = `${best.streak}d`;
      if (dom.bestStreakName) dom.bestStreakName.textContent = best.label;
    } else {
      if (dom.bestStreakValue) dom.bestStreakValue.textContent = "0d";
      if (dom.bestStreakName) dom.bestStreakName.textContent = "No streak yet";
    }
  }

  function updateXpDisplay() {
    const totalXP = Number(state.xp.total || 0);
    const level = Math.floor(totalXP / 100) + 1;
    const withinLevelXP = totalXP % 100;
    const habitsSavedToday = Number(state.xp.habitsSavedToday || 0);

    if (dom.xpLevelLabel) dom.xpLevelLabel.textContent = `Level ${level}`;
    if (dom.heroLevelLabel) dom.heroLevelLabel.textContent = `Level ${level}`;
    if (dom.heroXpTotal) dom.heroXpTotal.textContent = `${totalXP}`;
    if (dom.xpTotalLabel) dom.xpTotalLabel.textContent = `${totalXP} XP total`;
    if (dom.xpCurrentSegment) dom.xpCurrentSegment.textContent = `${withinLevelXP} / 100 to next level`;
    if (dom.xpFill) dom.xpFill.style.width = `${withinLevelXP}%`;
    if (dom.xpHabitsToday) dom.xpHabitsToday.textContent = String(habitsSavedToday);

    if (dom.xpTodayNote) {
      dom.xpTodayNote.textContent = habitsSavedToday > 0
        ? "Nice. Progress was counted on your last save."
        : "Complete habits and save to earn XP.";
    }
  }

  function updateAllDisplays() {
    updateCompletionDisplays();
    updateStreakSummary();
    updateXpDisplay();
  }

  function saveTodayProgress() {
    const yesterdayStr = getYesterdayStr();
    let xpGained = 0;
    let habitsSavedToday = 0;

    document.querySelectorAll(".habit-item").forEach(item => {
      const habitId = item.getAttribute("data-habit-id");
      const checkbox = item.querySelector("input[type='checkbox']");
      const completed = checkbox.checked;
      const record = state.habits[habitId] || { streak: 0, lastCompleted: null };

      if (completed) {
        habitsSavedToday += 1;

        if (record.lastCompleted !== todayStr) {
          if (record.lastCompleted === yesterdayStr) {
            record.streak = (record.streak || 0) + 1;
          } else {
            record.streak = 1;
          }
          record.lastCompleted = todayStr;
          xpGained += XP_PER_HABIT_SAVE;
        }
      }

      state.habits[habitId] = record;
    });

    state.xp.total = Number(state.xp.total || 0) + xpGained;
    state.xp.lastXPUpdate = todayStr;
    state.xp.habitsSavedToday = habitsSavedToday;

    saveData();
    renderHabitSections();
    updateAllDisplays();

    if (dom.saveStatusText) {
      dom.saveStatusText.textContent = xpGained > 0
        ? `Saved. +${xpGained} XP gained.`
        : "Saved. Today's streaks were already counted.";
    }

    if (dom.xpTodayNote) {
      dom.xpTodayNote.textContent = xpGained > 0
        ? `XP gained: +${xpGained}. Streaks updated.`
        : "Already counted for today. Keep the chain intact.";
    }
  }

  function addCategory() {
    const title = dom.newCategoryTitle ? dom.newCategoryTitle.value.trim() : "";
    const note = dom.newCategoryNote ? dom.newCategoryNote.value.trim() : "";
    const badge = dom.newCategoryBadge ? dom.newCategoryBadge.value.trim() : "";

    if (!title) {
      setManageStatus("Category title is required.");
      return;
    }

    state.categories.push({
      id: makeId("cat"),
      title,
      note,
      badge: badge || title,
      habitIds: []
    });

    saveData();

    if (dom.newCategoryTitle) dom.newCategoryTitle.value = "";
    if (dom.newCategoryNote) dom.newCategoryNote.value = "";
    if (dom.newCategoryBadge) dom.newCategoryBadge.value = "";

    renderAll();
    setManageStatus(`Category added: ${title}`);
  }

  function saveCategoryEdits(categoryId) {
    const category = state.categories.find(item => item.id === categoryId);
    if (!category) return;

    const titleInput = document.querySelector(`.category-title-input[data-category-id="${cssEscape(categoryId)}"]`);
    const noteInput = document.querySelector(`.category-note-input[data-category-id="${cssEscape(categoryId)}"]`);
    const badgeInput = document.querySelector(`.category-badge-input[data-category-id="${cssEscape(categoryId)}"]`);

    const title = titleInput ? titleInput.value.trim() : category.title;
    const note = noteInput ? noteInput.value.trim() : category.note;
    const badge = badgeInput ? badgeInput.value.trim() : category.badge;

    if (!title) {
      setManageStatus("Category title cannot be blank.");
      return;
    }

    category.title = title;
    category.note = note;
    category.badge = badge || title;

    saveData();
    renderAll();
    setManageStatus(`Category saved: ${title}`);
  }

  function deleteCategory(categoryId) {
    const category = state.categories.find(item => item.id === categoryId);
    if (!category) return;

    const confirmText = category.habitIds.length
      ? `Delete category "${category.title}" and all habits inside it?`
      : `Delete category "${category.title}"?`;

    if (!window.confirm(confirmText)) return;

    category.habitIds.forEach(habitId => {
      delete state.habitLibrary[habitId];
      delete state.habits[habitId];
    });

    state.categories = state.categories.filter(item => item.id !== categoryId);

    saveData();
    renderAll();
    setManageStatus(`Category deleted: ${category.title}`);
  }

  function addHabit(sourceCategoryId) {
    const labelInput = document.querySelector(`.add-habit-input[data-category-id="${cssEscape(sourceCategoryId)}"]`);
    const targetSelect = document.querySelector(`.add-habit-target[data-category-id="${cssEscape(sourceCategoryId)}"]`);

    const label = labelInput ? labelInput.value.trim() : "";
    const targetCategoryId = targetSelect ? targetSelect.value : sourceCategoryId;

    if (!label) {
      setManageStatus("Habit label is required.");
      return;
    }

    const targetCategory = state.categories.find(item => item.id === targetCategoryId);
    if (!targetCategory) {
      setManageStatus("Target category not found.");
      return;
    }

    const habitId = makeId("habit");
    state.habitLibrary[habitId] = {
      id: habitId,
      label
    };
    state.habits[habitId] = {
      streak: 0,
      lastCompleted: null
    };
    targetCategory.habitIds.push(habitId);

    saveData();
    renderAll();
    setManageStatus(`Habit added: ${label}`);
  }

  function saveHabitEdits(habitId) {
    const habit = state.habitLibrary[habitId];
    if (!habit) return;

    const renameInput = document.querySelector(`.habit-rename-input[data-habit-id="${cssEscape(habitId)}"]`);
    const moveSelect = document.querySelector(`.habit-move-select[data-habit-id="${cssEscape(habitId)}"]`);

    const newLabel = renameInput ? renameInput.value.trim() : habit.label;
    const newCategoryId = moveSelect ? moveSelect.value : findCategoryForHabit(habitId)?.id;

    if (!newLabel) {
      setManageStatus("Habit label cannot be blank.");
      return;
    }

    habit.label = newLabel;

    const currentCategory = findCategoryForHabit(habitId);
    if (!currentCategory) {
      setManageStatus("Current category not found.");
      return;
    }

    if (newCategoryId && newCategoryId !== currentCategory.id) {
      currentCategory.habitIds = currentCategory.habitIds.filter(id => id !== habitId);
      const newCategory = state.categories.find(item => item.id === newCategoryId);
      if (newCategory) {
        newCategory.habitIds.push(habitId);
      }
    }

    saveData();
    renderAll();
    setManageStatus(`Habit saved: ${newLabel}`);
  }

  function deleteHabit(habitId) {
    const habit = state.habitLibrary[habitId];
    if (!habit) return;

    if (!window.confirm(`Delete habit "${habit.label}"?`)) return;

    const category = findCategoryForHabit(habitId);
    if (category) {
      category.habitIds = category.habitIds.filter(id => id !== habitId);
    }

    delete state.habitLibrary[habitId];
    delete state.habits[habitId];

    saveData();
    renderAll();
    setManageStatus(`Habit deleted: ${habit.label}`);
  }

  function findCategoryForHabit(habitId) {
    return state.categories.find(category => category.habitIds.includes(habitId)) || null;
  }

  function resetAllData() {
    const confirmed = window.confirm("Reset all categories, habits, streaks, XP, and weekly review?");
    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);

    const fresh = clone(DEFAULT_DATA);
    state.categories = fresh.categories;
    state.habitLibrary = fresh.habitLibrary;
    state.habits = fresh.habits;
    state.xp = fresh.xp;
    state.review = fresh.review;

    normalizeState();

    if (dom.reviewWorked) dom.reviewWorked.value = "";
    if (dom.reviewDidnt) dom.reviewDidnt.value = "";
    if (dom.reviewFocus) dom.reviewFocus.value = "";
    if (dom.reviewStatusText) {
      dom.reviewStatusText.textContent = "Not saved yet.";
      dom.reviewStatusText.classList.remove("is-positive");
    }
    if (dom.saveStatusText) {
      dom.saveStatusText.textContent = "Data reset. Starter template restored.";
    }

    renderAll();
    setManageStatus("All data reset.");
  }

  function loadWeeklyReview() {
    const review = state.review || {};

    if (dom.reviewWorked) dom.reviewWorked.value = review.worked || "";
    if (dom.reviewDidnt) dom.reviewDidnt.value = review.didnt || "";
    if (dom.reviewFocus) dom.reviewFocus.value = review.focus || "";

    if (!dom.reviewStatusText) return;

    if (review.lastSaved) {
      dom.reviewStatusText.textContent = `Saved: ${review.lastSaved}`;
      dom.reviewStatusText.classList.add("is-positive");
    } else {
      dom.reviewStatusText.textContent = "Not saved yet.";
      dom.reviewStatusText.classList.remove("is-positive");
    }
  }

  function saveWeeklyReview() {
    const now = new Date();
    const stamp = now.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    state.review = {
      worked: dom.reviewWorked ? dom.reviewWorked.value || "" : "",
      didnt: dom.reviewDidnt ? dom.reviewDidnt.value || "" : "",
      focus: dom.reviewFocus ? dom.reviewFocus.value || "" : "",
      lastSaved: stamp
    };

    saveData();

    if (dom.reviewStatusText) {
      dom.reviewStatusText.textContent = `Saved: ${stamp}`;
      dom.reviewStatusText.classList.add("is-positive");
    }
  }

  function setManageStatus(message) {
    if (dom.manageStatusText) {
      dom.manageStatusText.textContent = message;
    }
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") {
      return window.CSS.escape(value);
    }
    return String(value).replace(/"/g, '\\"');
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeHtmlAttr(value) {
    return escapeHtml(value);
  }

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js").catch(error => {
          console.error("Service worker registration failed", error);
        });
      });
    }
  }
})();