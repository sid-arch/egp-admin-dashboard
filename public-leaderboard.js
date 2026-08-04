(() => {
  const $ = id => document.getElementById(id);
  function shortName(s){return `${s.firstName||""} ${(s.lastName||"").slice(0,1)}.`.trim()}
  async function load(){
    try{
      const data=await EGP_API.getLeaderboard(new Date().toISOString().slice(0,10));
      const list=$("publicLeaderboardList");list.innerHTML="";
      (data.leaderboard||[]).forEach((s,i)=>{
        const row=document.createElement("article");
        row.className=`rank-row ${i<3?`top-${i+1}`:""}`;
        row.innerHTML=`<div class="rank-badge">${i+1}</div><div><div class="rank-name">${shortName(s)}</div><div class="rank-sub">${s.sessions||0} session${s.sessions===1?"":"s"} scored</div></div><div class="rank-score"><strong>${Number(s.total||0).toLocaleString()}</strong><span>total digits</span></div>`;
        list.appendChild(row);
      });
      $("publicState").classList.toggle("hidden",(data.leaderboard||[]).length>0);
      $("publicState").textContent=(data.leaderboard||[]).length?"":"No scores have been recorded yet.";
      list.classList.toggle("hidden",(data.leaderboard||[]).length===0);
      $("publicUpdated").textContent=`Last refreshed: ${new Date().toLocaleString()}`;
    }catch(e){$("publicState").textContent=e.message;$("publicUpdated").textContent="Could not load results."}
  }
  load();
  setInterval(load,60000);
})();
