(() => {
  const $ = id => document.getElementById(id);
  const state = {
    students: [], attendance:{}, originalAttendance:{}, attendanceFilter:"",
    leaderboard:[], daily:{}, activeTab:"attendance"
  };

  function todayISO(){const d=new Date();const local=new Date(d-Date.parse("1970-01-01T00:00:00Z")+d.getTimezoneOffset()*0);return new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10)}
  function initialDate(){return todayISO()<CONFIG.STUDY_START_DATE?CONFIG.STUDY_START_DATE:todayISO()}
  function fullName(s){return `${s.firstName||""} ${s.lastName||""}`.trim()}
  function initials(s){return `${(s.firstName||"?")[0]}${(s.lastName||"")[0]||""}`.toUpperCase()}
  function shortName(s){return `${s.firstName||""} ${(s.lastName||"").slice(0,1)}.`.trim()}
  function same(a,b){const ak=Object.keys(a).filter(k=>a[k]),bk=Object.keys(b).filter(k=>b[k]);return ak.length===bk.length&&ak.every(k=>a[k]===b[k])}
  function toast(msg){const e=$("toast");e.textContent=msg;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2400)}
  function setConnection(mode){const b=$("connectionBadge");b.className=`connection-badge ${mode}`;$("connectionText").textContent=mode==="online"?"Google Sheet connected":mode==="demo"?"Demo mode":"Connection error"}

  function setupTabs(){
    document.querySelectorAll(".main-tab").forEach(btn=>btn.addEventListener("click",()=>{
      state.activeTab=btn.dataset.tab;
      document.querySelectorAll(".main-tab").forEach(x=>x.classList.toggle("active",x===btn));
      $("attendanceTab").classList.toggle("active",state.activeTab==="attendance");
      $("leaderboardTab").classList.toggle("active",state.activeTab==="leaderboard");
      if(state.activeTab==="leaderboard") loadLeaderboard();
    }));
  }

  async function loadAttendance(){
    $("attendanceState").classList.remove("hidden");$("attendanceList").classList.add("hidden");
    try{
      const data=await EGP_API.getAttendanceDashboard($("attendanceDate").value);
      state.students=(data.students||[]).sort((a,b)=>fullName(a).localeCompare(fullName(b)));
      state.attendance={...(data.attendance||{})};state.originalAttendance={...state.attendance};
      setConnection(data.demo?"demo":"online");
      populateParticipantSelect();
      renderAttendance();
    }catch(e){$("attendanceState").textContent=e.message;setConnection("offline")}
  }

  function renderAttendance(){
    const list=$("attendanceList"),q=state.attendanceFilter.toLowerCase().trim();
    const filtered=state.students.filter(s=>fullName(s).toLowerCase().includes(q)||s.id.toLowerCase().includes(q));
    list.innerHTML="";
    filtered.forEach(s=>{
      const card=$("participantTemplate").content.firstElementChild.cloneNode(true);
      card.querySelector(".avatar").textContent=initials(s);
      card.querySelector(".participant-name").textContent=fullName(s);
      card.querySelector(".participant-id").textContent=s.id;
      card.querySelectorAll(".status-button").forEach(btn=>{
        btn.classList.toggle("active",state.attendance[s.id]===btn.dataset.status);
        btn.onclick=()=>{state.attendance[s.id]=btn.dataset.status;renderAttendance()};
      });
      list.appendChild(card);
    });
    $("attendanceState").classList.toggle("hidden",filtered.length>0);
    $("attendanceState").textContent=filtered.length?"":"No matching participants.";
    list.classList.toggle("hidden",filtered.length===0);
    $("attendanceMeta").textContent=`${filtered.length} of ${state.students.length} shown`;
    updateAttendanceCounts();
  }

  function updateAttendanceCounts(){
    const vals=Object.values(state.attendance),p=vals.filter(x=>x==="Present").length,l=vals.filter(x=>x==="Late").length,a=vals.filter(x=>x==="Absent").length,m=p+l+a;
    $("registeredCount").textContent=state.students.length;$("presentCount").textContent=p;$("lateCount").textContent=l;$("absentCount").textContent=a;$("unmarkedCount").textContent=Math.max(0,state.students.length-m);
    $("attendanceSaveSummary").textContent=`${m} of ${state.students.length} marked`;
    const dirty=!same(state.attendance,state.originalAttendance);
    $("attendanceUnsaved").textContent=dirty?"Unsaved changes":"No unsaved changes";
    $("saveAttendanceBtn").disabled=!dirty;
  }

  async function saveAttendance(){
    const records=state.students.filter(s=>state.attendance[s.id]).map(s=>({...s,status:state.attendance[s.id]}));
    const unmarked=state.students.length-records.length;
    if(unmarked&& !confirm(`${unmarked} participant(s) are unmarked. Save anyway?`))return;
    $("saveAttendanceBtn").disabled=true;$("saveAttendanceBtn").textContent="Saving…";
    try{await EGP_API.saveAttendance($("attendanceDate").value,records);state.originalAttendance={...state.attendance};toast("Attendance saved.");updateAttendanceCounts()}
    catch(e){alert(e.message)}
    finally{$("saveAttendanceBtn").textContent="Save Attendance"}
  }

  function populateParticipantSelect(){
    const select=$("participantSelect"),current=select.value;
    select.innerHTML='<option value="">Choose a participant</option>';
    state.students.forEach(s=>{const o=document.createElement("option");o.value=s.id;o.textContent=`${fullName(s)} (${s.id})`;select.appendChild(o)});
    if([...select.options].some(o=>o.value===current))select.value=current;
  }

  async function loadLeaderboard(){
    $("leaderboardState").classList.remove("hidden");$("leaderboardList").classList.add("hidden");
    try{
      const data=await EGP_API.getLeaderboard($("scoreDate").value);
      if((data.students||[]).length){state.students=data.students;populateParticipantSelect()}
      state.leaderboard=data.leaderboard||[];state.daily=data.daily||{};
      setConnection(data.demo?"demo":"online");
      renderLeaderboard();
      updateExistingScoreNote();
    }catch(e){$("leaderboardState").textContent=e.message;setConnection("offline")}
  }

  function renderLeaderboard(){
    const list=$("leaderboardList");list.innerHTML="";
    state.leaderboard.forEach((s,i)=>{
      const row=document.createElement("article");
      row.className=`rank-row ${i<3?`top-${i+1}`:""}`;
      row.innerHTML=`<div class="rank-badge">${i+1}</div><div><div class="rank-name">${fullName(s)}</div><div class="rank-sub">${s.sessions||0} session${s.sessions===1?"":"s"} scored</div></div><div class="rank-score"><strong>${Number(s.total||0).toLocaleString()}</strong><span>total digits</span></div>`;
      list.appendChild(row);
    });
    $("leaderboardState").classList.toggle("hidden",state.leaderboard.length>0);
    $("leaderboardState").textContent=state.leaderboard.length?"":"No scores have been recorded yet.";
    list.classList.toggle("hidden",state.leaderboard.length===0);
    renderDailyScores();
  }

  function renderDailyScores(){
    const holder=$("dailyScoresList");holder.innerHTML="";
    const rows=state.students.filter(s=>state.daily[s.id]!==undefined).sort((a,b)=>state.daily[b.id]-state.daily[a.id]);
    $("dailyMeta").textContent=rows.length?`${rows.length} score(s) recorded`:"No scores yet";
    rows.forEach(s=>{
      const row=document.createElement("div");row.className="daily-row";
      row.innerHTML=`<span>${fullName(s)}</span><strong>${state.daily[s.id]} digits</strong><button class="ghost-button">Delete</button>`;
      row.querySelector("button").onclick=async()=>{if(!confirm(`Delete ${fullName(s)}'s score for this date?`))return;await EGP_API.deleteScore($("scoreDate").value,s.id);toast("Score deleted.");loadLeaderboard()};
      holder.appendChild(row);
    });
  }

  function updateExistingScoreNote(){
    const id=$("participantSelect").value, note=$("existingScoreNote");
    if(id&&state.daily[id]!==undefined){note.textContent=`Existing score for this date: ${state.daily[id]} digits. Saving will update it.`;note.classList.remove("hidden");$("digitsInput").value=state.daily[id]}
    else{note.classList.add("hidden");if(id)$("digitsInput").value=""}
    validateScoreForm();
  }

  function validateScoreForm(){
    const valid=$("participantSelect").value&&$("scoreDate").value&&$("digitsInput").value!==""&&Number($("digitsInput").value)>=0;
    $("saveScoreBtn").disabled=!valid;
  }

  async function saveScore(){
    const s=state.students.find(x=>x.id===$("participantSelect").value),digits=Number($("digitsInput").value);
    if(!s||!Number.isInteger(digits)||digits<0)return;
    $("saveScoreBtn").disabled=true;$("saveScoreBtn").textContent="Saving…";
    try{await EGP_API.saveScore($("scoreDate").value,{...s,digits});toast("Score saved.");await loadLeaderboard()}
    catch(e){alert(e.message)}
    finally{$("saveScoreBtn").textContent="Save Score";validateScoreForm()}
  }

  function setupPublicLink(){
    const url=new URL(CONFIG.PUBLIC_PAGE,window.location.href).href;
    $("publicLink").value=url;
    $("copyPublicLinkBtn").onclick=async()=>{try{await navigator.clipboard.writeText(url);toast("Public leaderboard link copied.")}catch{prompt("Copy this link:",url)}};
  }

  $("attendanceDate").value=initialDate();$("scoreDate").value=initialDate();
  setupTabs();setupPublicLink();
  $("attendanceDate").onchange=loadAttendance;
  $("attendanceSearch").oninput=e=>{state.attendanceFilter=e.target.value;renderAttendance()};
  $("markAllPresentBtn").onclick=()=>{state.students.forEach(s=>state.attendance[s.id]="Present");renderAttendance()};
  $("clearAttendanceBtn").onclick=()=>{if(confirm("Clear all attendance selections?")){state.attendance={};renderAttendance()}};
  $("saveAttendanceBtn").onclick=saveAttendance;
  $("scoreDate").onchange=loadLeaderboard;
  $("participantSelect").onchange=updateExistingScoreNote;
  $("digitsInput").oninput=validateScoreForm;
  $("saveScoreBtn").onclick=saveScore;
  $("refreshLeaderboardBtn").onclick=loadLeaderboard;
  $("refreshBtn").onclick=()=>state.activeTab==="attendance"?loadAttendance():loadLeaderboard();

  loadAttendance();
})();
