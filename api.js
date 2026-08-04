const EGP_API = (() => {
  const DEMO_STUDENTS = [
    {id:"EGP-001",firstName:"Aarush",lastName:"Vaibhav"},
    {id:"EGP-002",firstName:"Ananya",lastName:"Rao"},
    {id:"EGP-003",firstName:"Arjun",lastName:"Mehta"},
    {id:"EGP-004",firstName:"Diya",lastName:"Shah"},
    {id:"EGP-005",firstName:"Ishaan",lastName:"Patel"}
  ];

  const configured = () => CONFIG.API_URL && CONFIG.API_URL.includes("script.google.com");

  async function request(params) {
    const url = new URL(CONFIG.API_URL);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v)));
    url.searchParams.set("_t", Date.now());
    const response = await fetch(url.toString(), {cache:"no-store", redirect:"follow"});
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || data.message || "Server error");
    return data;
  }

  function demoAttendanceKey(date){ return `egp-attendance-${date}`; }
  function demoScoresKey(){ return "egp-demo-scores"; }

  async function getAttendanceDashboard(date) {
    if (!configured()) return {ok:true,demo:true,students:DEMO_STUDENTS,attendance:JSON.parse(localStorage.getItem(demoAttendanceKey(date))||"{}")};
    return request({action:"dashboard",date});
  }

  async function saveAttendance(date, records) {
    if (!configured()) {
      const map={}; records.forEach(r=>map[r.id]=r.status);
      localStorage.setItem(demoAttendanceKey(date),JSON.stringify(map));
      return {ok:true,demo:true,saved:records.length};
    }
    return request({action:"save",date,records});
  }

  async function getLeaderboard(date) {
    if (!configured()) {
      const scores=JSON.parse(localStorage.getItem(demoScoresKey())||"[]");
      return buildDemoLeaderboard(scores,date);
    }
    return request({action:"leaderboard",date});
  }

  async function saveScore(date, record) {
    if (!configured()) {
      let scores=JSON.parse(localStorage.getItem(demoScoresKey())||"[]");
      const i=scores.findIndex(x=>x.date===date&&x.id===record.id);
      const row={...record,date,updatedAt:new Date().toISOString()};
      if(i>=0)scores[i]=row; else scores.push(row);
      localStorage.setItem(demoScoresKey(),JSON.stringify(scores));
      return {ok:true,demo:true};
    }
    return request({action:"saveScore",date,record});
  }

  async function deleteScore(date, id) {
    if (!configured()) {
      let scores=JSON.parse(localStorage.getItem(demoScoresKey())||"[]");
      scores=scores.filter(x=>!(x.date===date&&x.id===id));
      localStorage.setItem(demoScoresKey(),JSON.stringify(scores));
      return {ok:true,demo:true};
    }
    return request({action:"deleteScore",date,id});
  }

  function buildDemoLeaderboard(scores,date){
    const totals={}; const daily={};
    DEMO_STUDENTS.forEach(s=>totals[s.id]={...s,total:0,sessions:0});
    scores.forEach(s=>{
      if(!totals[s.id]) totals[s.id]={id:s.id,firstName:s.firstName,lastName:s.lastName,total:0,sessions:0};
      totals[s.id].total+=Number(s.digits)||0; totals[s.id].sessions++;
      if(s.date===date) daily[s.id]=Number(s.digits)||0;
    });
    return {ok:true,demo:true,students:DEMO_STUDENTS,daily,leaderboard:Object.values(totals).sort((a,b)=>b.total-a.total||a.firstName.localeCompare(b.firstName)),updatedAt:new Date().toISOString()};
  }

  return {configured,getAttendanceDashboard,saveAttendance,getLeaderboard,saveScore,deleteScore};
})();
