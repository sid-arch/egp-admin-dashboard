(() => {
  const $ = id => document.getElementById(id);

  function shortName(s) {
    return `${s.firstName || ""} ${(s.lastName || "").slice(0, 1)}.`.trim();
  }

  async function load() {
    try {
      const data = await EGP_API.getLeaderboard(new Date().toISOString().slice(0, 10));
      const list = $("publicLeaderboardList");
      list.innerHTML = "";

      // Public leaderboard rules:
      // 1) Hide participants whose cumulative score is 0.
      // 2) Sort highest score first.
      // 3) Equal scores share the same rank (competition ranking: 1, 2, 2, 4).
      const leaderboard = (data.leaderboard || [])
        .filter(s => Number(s.total || 0) > 0)
        .sort((a, b) => Number(b.total || 0) - Number(a.total || 0));

      let previousScore = null;
      let currentRank = 0;

      leaderboard.forEach((s, i) => {
        const score = Number(s.total || 0);

        if (previousScore === null || score !== previousScore) {
          currentRank = i + 1;
        }
        previousScore = score;

        const row = document.createElement("article");
        row.className = `rank-row ${currentRank <= 3 ? `top-${currentRank}` : ""}`;
        row.innerHTML = `
          <div class="rank-badge">${currentRank}</div>
          <div>
            <div class="rank-name">${shortName(s)}</div>
            <div class="rank-sub">${s.sessions || 0} session${s.sessions === 1 ? "" : "s"} scored</div>
          </div>
          <div class="rank-score">
            <strong>${score.toLocaleString()}</strong>
            <span>total digits</span>
          </div>`;
        list.appendChild(row);
      });

      const hasScores = leaderboard.length > 0;
      $("publicState").classList.toggle("hidden", hasScores);
      $("publicState").textContent = hasScores ? "" : "No scores have been recorded yet.";
      list.classList.toggle("hidden", !hasScores);
      $("publicUpdated").textContent = `Last refreshed: ${new Date().toLocaleString()}`;
    } catch (e) {
      $("publicState").textContent = e.message;
      $("publicUpdated").textContent = "Could not load results.";
    }
  }

  load();
  setInterval(load, 60000);
})();
