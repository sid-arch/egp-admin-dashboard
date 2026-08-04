const AttendanceAPI = (() => {
  const DEMO_STUDENTS = [
    { id: "EGP-001", firstName: "Aarush", lastName: "Vaibhav" },
    { id: "EGP-002", firstName: "Ananya", lastName: "Rao" },
    { id: "EGP-003", firstName: "Arjun", lastName: "Mehta" },
    { id: "EGP-004", firstName: "Diya", lastName: "Shah" },
    { id: "EGP-005", firstName: "Ishaan", lastName: "Patel" }
  ];

  const isConfigured = () =>
    typeof CONFIG.API_URL === "string" &&
    CONFIG.API_URL.trim() !== "" &&
    CONFIG.API_URL.includes("script.google.com");

  async function request(params = {}) {
    const url = new URL(CONFIG.API_URL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`Server returned ${response.status}.`);
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Unknown server error.");
    return data;
  }

  async function getDashboard(date) {
    if (!isConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 450));
      const key = `egp-demo-attendance-${date}`;
      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      return {
        ok: true,
        demo: true,
        students: DEMO_STUDENTS,
        attendance: stored
      };
    }
    return request({ action: "dashboard", date, _t: Date.now() });
  }

  async function saveAttendance(date, records) {
    if (!isConfigured()) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const map = {};
      records.forEach(record => { map[record.id] = record.status; });
      localStorage.setItem(`egp-demo-attendance-${date}`, JSON.stringify(map));
      return { ok: true, demo: true, saved: records.length };
    }

    // GET is used deliberately because Apps Script web-app redirects can make
    // cross-origin POST requests annoying on GitHub Pages.
    return request({
      action: "save",
      date,
      records: JSON.stringify(records),
      _t: Date.now()
    });
  }

  return { isConfigured, getDashboard, saveAttendance };
})();
