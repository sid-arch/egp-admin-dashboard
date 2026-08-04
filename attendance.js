(() => {
  const $ = id => document.getElementById(id);
  const state = {
    students: [],
    attendance: {},
    originalAttendance: {},
    filter: "",
    loading: false
  };

  const els = {
    date: $("sessionDate"),
    sessionLabel: $("sessionLabel"),
    search: $("searchInput"),
    list: $("participantList"),
    template: $("participantTemplate"),
    loading: $("loadingState"),
    error: $("errorState"),
    errorMessage: $("errorMessage"),
    empty: $("emptyState"),
    retry: $("retryBtn"),
    refresh: $("refreshBtn"),
    markAll: $("markAllPresentBtn"),
    clearAll: $("clearAllBtn"),
    save: $("saveBtn"),
    saveText: $("saveBtnText"),
    saveSpinner: $("saveSpinner"),
    listMeta: $("listMeta"),
    saveSummary: $("saveSummary"),
    unsavedLabel: $("unsavedLabel"),
    badge: $("connectionBadge"),
    connectionText: $("connectionText"),
    toast: $("toast")
  };

  function todayISO() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function initialDate() {
    return todayISO() < CONFIG.STUDY_START_DATE ? CONFIG.STUDY_START_DATE : todayISO();
  }

  function fullName(student) {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
  }

  function initials(student) {
    return `${(student.firstName || "?")[0]}${(student.lastName || "")[0] || ""}`.toUpperCase();
  }

  function attendanceObjectEqual(a, b) {
    const aKeys = Object.keys(a).filter(k => a[k]);
    const bKeys = Object.keys(b).filter(k => b[k]);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(k => a[k] === b[k]);
  }

  function showToast(message, type = "success") {
    els.toast.textContent = message;
    els.toast.className = `toast ${type} show`;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2800);
  }

  function setConnection(mode) {
    els.badge.className = `connection-badge ${mode}`;
    els.connectionText.textContent =
      mode === "online" ? "Google Sheet connected" :
      mode === "demo" ? "Demo mode" :
      mode === "offline" ? "Connection error" : "Connecting…";
  }

  function setLoading(loading) {
    state.loading = loading;
    els.refresh.classList.toggle("spinning", loading);
    els.refresh.disabled = loading;
    els.date.disabled = loading;
  }

  function updateSessionLabel() {
    const start = new Date(`${CONFIG.STUDY_START_DATE}T12:00:00`);
    const chosen = new Date(`${els.date.value}T12:00:00`);
    const dayDifference = Math.floor((chosen - start) / 86400000);
    const session = dayDifference + 1;

    if (session < 1) {
      els.sessionLabel.textContent = "Before the pilot-study start date";
    } else if (session <= CONFIG.TOTAL_SESSIONS) {
      els.sessionLabel.textContent = `Calendar day ${session} from study start`;
    } else {
      els.sessionLabel.textContent = `After the planned ${CONFIG.TOTAL_SESSIONS}-session window`;
    }
  }

  async function loadDashboard() {
    setLoading(true);
    els.loading.classList.remove("hidden");
    els.error.classList.add("hidden");
    els.empty.classList.add("hidden");
    els.list.classList.add("hidden");

    try {
      const data = await AttendanceAPI.getDashboard(els.date.value);
      state.students = (data.students || []).sort((a, b) => fullName(a).localeCompare(fullName(b)));
      state.attendance = { ...(data.attendance || {}) };
      state.originalAttendance = { ...state.attendance };
      setConnection(data.demo ? "demo" : "online");
      render();
    } catch (error) {
      console.error(error);
      setConnection("offline");
      els.loading.classList.add("hidden");
      els.error.classList.remove("hidden");
      els.errorMessage.textContent = error.message || "Check your Apps Script setup.";
    } finally {
      setLoading(false);
    }
  }

  function render() {
    els.loading.classList.add("hidden");
    els.error.classList.add("hidden");
    els.list.innerHTML = "";

    const query = state.filter.trim().toLowerCase();
    const filtered = state.students.filter(student =>
      fullName(student).toLowerCase().includes(query) ||
      String(student.id || "").toLowerCase().includes(query)
    );

    els.listMeta.textContent = `${filtered.length} of ${state.students.length} shown`;

    if (!filtered.length) {
      els.list.classList.add("hidden");
      els.empty.classList.remove("hidden");
    } else {
      els.empty.classList.add("hidden");
      els.list.classList.remove("hidden");

      filtered.forEach(student => {
        const card = els.template.content.firstElementChild.cloneNode(true);
        card.dataset.studentId = student.id;
        card.querySelector(".avatar").textContent = initials(student);
        card.querySelector(".participant-name").textContent = fullName(student);
        card.querySelector(".participant-id").textContent = student.id || "Registered participant";

        const group = card.querySelector(".status-group");
        group.setAttribute("aria-label", `Attendance for ${fullName(student)}`);

        card.querySelectorAll(".status-button").forEach(button => {
          const selected = state.attendance[student.id] === button.dataset.status;
          button.classList.toggle("active", selected);
          button.setAttribute("aria-pressed", String(selected));
          button.addEventListener("click", () => {
            state.attendance[student.id] = button.dataset.status;
            render();
          });
        });

        els.list.appendChild(card);
      });
    }

    updateCounts();
  }

  function updateCounts() {
    const statuses = Object.values(state.attendance);
    const present = statuses.filter(s => s === "Present").length;
    const late = statuses.filter(s => s === "Late").length;
    const absent = statuses.filter(s => s === "Absent").length;
    const marked = present + late + absent;
    const unmarked = Math.max(state.students.length - marked, 0);
    const dirty = !attendanceObjectEqual(state.attendance, state.originalAttendance);

    $("registeredCount").textContent = state.students.length;
    $("presentCount").textContent = present;
    $("lateCount").textContent = late;
    $("absentCount").textContent = absent;
    $("unmarkedCount").textContent = unmarked;
    els.saveSummary.textContent = `${marked} of ${state.students.length} participants marked`;
    els.unsavedLabel.textContent = dirty ? "Unsaved changes" : "No unsaved changes";
    els.save.disabled = !dirty || state.loading || state.students.length === 0;
  }

  function markAllPresent() {
    state.students.forEach(student => { state.attendance[student.id] = "Present"; });
    render();
    showToast("Everyone marked present. Review before saving.");
  }

  function clearAll() {
    if (!Object.keys(state.attendance).length) return;
    if (!confirm("Clear every attendance selection for this date?")) return;
    state.attendance = {};
    render();
  }

  async function save() {
    const records = state.students
      .filter(student => state.attendance[student.id])
      .map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        status: state.attendance[student.id]
      }));

    const unmarked = state.students.length - records.length;
    if (unmarked > 0) {
      const proceed = confirm(`${unmarked} participant${unmarked === 1 ? " is" : "s are"} still unmarked. Save anyway?`);
      if (!proceed) return;
    }

    els.save.disabled = true;
    els.saveText.textContent = "Saving…";
    els.saveSpinner.classList.remove("hidden");

    try {
      const response = await AttendanceAPI.saveAttendance(els.date.value, records);
      state.originalAttendance = { ...state.attendance };
      updateCounts();
      showToast(`${response.saved ?? records.length} attendance records saved.`);
    } catch (error) {
      console.error(error);
      showToast(error.message || "Attendance could not be saved.", "error");
    } finally {
      els.saveText.textContent = "Save Attendance";
      els.saveSpinner.classList.add("hidden");
      updateCounts();
    }
  }

  els.date.min = CONFIG.STUDY_START_DATE;
  els.date.value = initialDate();
  updateSessionLabel();

  els.date.addEventListener("change", () => {
    updateSessionLabel();
    loadDashboard();
  });
  els.search.addEventListener("input", event => {
    state.filter = event.target.value;
    render();
  });
  els.refresh.addEventListener("click", loadDashboard);
  els.retry.addEventListener("click", loadDashboard);
  els.markAll.addEventListener("click", markAllPresent);
  els.clearAll.addEventListener("click", clearAll);
  els.save.addEventListener("click", save);

  document.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      els.search.focus();
    }
  });

  window.addEventListener("beforeunload", event => {
    if (!attendanceObjectEqual(state.attendance, state.originalAttendance)) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  loadDashboard();
})();
