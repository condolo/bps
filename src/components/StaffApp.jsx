import { useState } from "react";
import { BrandLogo, StatCard, Row } from "./Shared.jsx";
import { lbl, inp, btnS } from "../styles.js";
import {
  ROLES, SENIOR, STAFF_ROLES, CLASSES, YEARS, MATRIX, MILESTONES, STAGES, KS_CLASSES,
} from "../constants.js";
import {
  filterByPeriod, getHalfTermStart, getWeekStart, getMonthStart, getTermStart,
  meritTotal, demeritTotal, netPoints,
  studentStage, studentMilestone, behavLabel, fmtDate, pointColor as c,
} from "../helpers.js";

// ─── ROOT STAFF SHELL ─────────────────────────────────────────────────────────
export default function StaffApp({ state, dispatch, user, onLogout, brand }) {
  const [tab,    setTab]    = useState("dashboard");
  const [period, setPeriod] = useState("Weekly");

  const isSenior  = SENIOR.includes(user.role);
  const isDisc    = user.role === "discipline";
  const isKS      = ["ks3","ks4","ks5"].includes(user.role);
  const isTeacher = user.role === "teacher";

  const ksClasses      = isKS ? (KS_CLASSES[user.role] || []) : [];
  const myClasses      = isKS ? ksClasses : isTeacher ? [user.year] : null;
  const scopedStudents = myClasses ? state.students.filter(s => myClasses.includes(s.grade)) : state.students;

  const myNotifs = state.notifications.filter(n => {
    if (isSenior || isDisc) return true;
    if (isKS)      return ksClasses.includes(n.grade);
    if (isTeacher) return n.grade === user.year;
    return false;
  });
  const unread = myNotifs.filter(n => !n.readBy.includes(user.id)).length;

  const myAppeals = state.appeals.filter(a => {
    if (isSenior || isDisc) return true;
    if (isKS)      return ksClasses.includes(a.grade) && (a.status==="pending"||a.status==="escalated");
    if (isTeacher) return a.grade===user.year && a.status==="pending";
    return false;
  });
  const pendingAppeals = myAppeals.filter(a => a.status==="pending"||a.status==="escalated").length;

  const filtLogs = filterByPeriod(state.logs, period);
  const htLogs   = state.logs.filter(l => l.timestamp >= getHalfTermStart());
  const allML    = state.logs.filter(l => l.type==="merit");

  const sPts  = sid => netPoints(filtLogs, sid);
  const hPts  = hid => filtLogs.filter(l => {
    const st = state.students.find(s => s.id===l.studentId);
    return st && st.houseId===hid;
  }).reduce((s,l) => s+l.points, 0);

  const sortedStudents = [...state.students].sort((a,b) => sPts(b.id)-sPts(a.id));
  const sortedHouses   = [...state.houses].sort((a,b)   => hPts(b.id)-hPts(a.id));

  const tabs = [
    ["dashboard","Dashboard"],
    ["award","Award Points"],
    ["students","Students"],
    ["leaderboard","Leaderboard"],
    ["notifs", unread>0 ? `Alerts (${unread})` : "Alerts"],
    ...(pendingAppeals>0||isSenior||isDisc ? [["appeals","Appeals"+(pendingAppeals>0?` (${pendingAppeals})` : "")]] : []),
    ...(user.role==="admin" ? [["admin","Admin"],["reports","Reports"]] : []),
  ];

  const sharedProps = { state, dispatch, user, brand, filtLogs, htLogs, allML, sPts, hPts, sortedStudents, sortedHouses, period, scopedStudents, myClasses };

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif",minHeight:"100vh",background:"#f8fafc"}}>
      {/* Header */}
      <div style={{background:`linear-gradient(135deg,${brand.primaryColor},${brand.secondaryColor})`,color:"white",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <BrandLogo brand={brand} size={42} textSize={14} />
          <div>
            <div style={{fontWeight:800,fontSize:16}}>{brand.schoolName} — BPS</div>
            <div style={{fontSize:11,opacity:0.8}}>{ROLES.find(r=>r.id===user.role)?.label} · {user.name}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={period} onChange={e=>setPeriod(e.target.value)} style={{background:"rgba(255,255,255,0.15)",color:"white",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"5px 10px",fontSize:12}}>
            {["Weekly","Monthly","Termly","All Time"].map(p => <option key={p} style={{color:"#1e293b"}}>{p}</option>)}
          </select>
          <button onClick={onLogout} style={{background:"rgba(255,255,255,0.15)",color:"white",border:"1px solid rgba(255,255,255,0.3)",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Sign Out</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:"white",borderBottom:`2px solid ${brand.primaryColor}`,display:"flex",overflowX:"auto"}}>
        {tabs.map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{padding:"12px 16px",border:"none",background:"none",cursor:"pointer",fontWeight:tab===id?700:400,color:tab===id?brand.primaryColor:"#64748b",borderBottom:tab===id?`2px solid ${brand.primaryColor}`:"2px solid transparent",whiteSpace:"nowrap",fontSize:13}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{padding:"20px",maxWidth:980,margin:"0 auto"}}>
        {tab==="dashboard"   && <RoleDash   {...sharedProps} />}
        {tab==="award"       && <Award      state={state} dispatch={dispatch} user={user} htLogs={htLogs} allML={allML} brand={brand} />}
        {tab==="students"    && <Students   state={state} dispatch={dispatch} sPts={sPts} user={user} htLogs={htLogs} allML={allML} brand={brand} />}
        {tab==="leaderboard" && <Leaderboard sortedStudents={sortedStudents} sortedHouses={sortedHouses} sPts={sPts} hPts={hPts} state={state} period={period} brand={brand} />}
        {tab==="notifs"      && <Notifications notifs={myNotifs} user={user} dispatch={dispatch} state={state} brand={brand} />}
        {tab==="appeals"     && <AppealsPanel state={state} dispatch={dispatch} user={user} myAppeals={myAppeals} brand={brand} />}
        {tab==="admin"       && user.role==="admin" && <AdminPanel state={state} dispatch={dispatch} brand={brand} />}
        {tab==="reports"     && user.role==="admin" && <Reports state={state} user={user} period={period} brand={brand} />}
      </div>
    </div>
  );
}

// ─── ROLE DASHBOARD ───────────────────────────────────────────────────────────
function RoleDash({ state, user, filtLogs, htLogs, allML, sortedStudents, sortedHouses, sPts, hPts, period, scopedStudents, myClasses }) {
  const isSenior  = SENIOR.includes(user.role);
  const isDisc    = user.role==="discipline";
  const isKS      = ["ks3","ks4","ks5"].includes(user.role);
  const isTeacher = user.role==="teacher";

  const scopedLogs   = myClasses ? filtLogs.filter(l => scopedStudents.find(s=>s.id===l.studentId)) : filtLogs;
  const scopedHtLogs = myClasses ? htLogs.filter(l => scopedStudents.find(s=>s.id===l.studentId))   : htLogs;

  const meritsTotal   = scopedLogs.filter(l=>l.type==="merit").reduce((s,l)=>s+l.points,0);
  const demeritsTotal = Math.abs(scopedLogs.filter(l=>l.type==="demerit").reduce((s,l)=>s+l.points,0));

  const stageAlerts = scopedStudents
    .map(s => ({ s, stage:studentStage(scopedHtLogs,s.id) }))
    .filter(x=>x.stage)
    .sort((a,b)=>b.stage.stage-a.stage.stage);

  const seriousLogs = filtLogs.filter(l=>l.type==="demerit"&&l.points<=-8);
  const staffAct    = [...new Set(filtLogs.map(l=>l.staffId))].map(sid => {
    const st = state.staff.find(s=>s.id===sid);
    return { ...st, count:filtLogs.filter(l=>l.staffId===sid).length };
  }).filter(x=>x.id).sort((a,b)=>b.count-a.count);

  const scopedSorted = [...scopedStudents].sort((a,b)=>netPoints(filtLogs,b.id)-netPoints(filtLogs,a.id));
  const myLogs = isTeacher ? filtLogs.filter(l=>l.staffId===user.id) : [];

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h2 style={{fontSize:17,margin:0}}>
          {isTeacher?"My Class Dashboard":isKS?(ROLES.find(r=>r.id===user.role)?.label+" Dashboard"):"School Overview"}
        </h2>
        <div style={{fontSize:12,color:"#64748b",marginTop:2}}>
          {period} · {isTeacher?"Class "+user.year:isKS?"KS — "+myClasses?.length+" classes":"All Key Stages"}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        <StatCard icon="👥" label={isTeacher?"My Students":"Students"} value={scopedStudents.length} col="#6b21a8"/>
        <StatCard icon="✅" label="Merit Points"   value={"+"+meritsTotal}   col="#16a34a"/>
        <StatCard icon="❌" label="Demerit Points" value={"-"+demeritsTotal} col="#dc2626"/>
        {isTeacher                 && <StatCard icon="📝" label="My Logs"          value={myLogs.length}      col="#3b82f6"/>}
        {(isSenior||isDisc)        && <StatCard icon="⚠️" label="On Intervention"  value={stageAlerts.length} col="#f59e0b"/>}
        {(isSenior||isDisc)        && <StatCard icon="🚨" label="Serious Incidents" value={seriousLogs.length} col="#dc2626"/>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isTeacher?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
        {!isTeacher && (
          <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0"}}>
            <h3 style={{margin:"0 0 12px",fontSize:14,color:"#4a1a7a"}}>House Standings</h3>
            {sortedHouses.map((h,i) => {
              const pts = hPts(h.id);
              const mx  = Math.max(...sortedHouses.map(x=>Math.abs(hPts(x.id))),1);
              return (
                <div key={h.id} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:600}}>{["🥇","🥈","🥉",""][i]||""} {h.customName}</span>
                    <span style={{fontSize:12,fontWeight:700,color:c(pts)}}>{pts>0?"+":""}{pts}</span>
                  </div>
                  <div style={{background:"#f1f5f9",borderRadius:4,height:7}}>
                    <div style={{background:pts>=0?h.color:"#ef4444",height:7,borderRadius:4,width:(Math.abs(pts)/mx*100)+"%"}} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0"}}>
          <h3 style={{margin:"0 0 12px",fontSize:14,color:"#4a1a7a"}}>
            {isTeacher?"My Class — Points":isKS?"Top Students in My KS":"Top Students"}
          </h3>
          {scopedSorted.slice(0,isTeacher?20:6).map((s,i) => {
            const pts   = netPoints(filtLogs, s.id);
            const house = state.houses.find(h=>h.id===s.houseId);
            const ms    = studentMilestone(allML, s.id);
            const stage = studentStage(scopedHtLogs, s.id);
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,color:"#94a3b8",width:16}}>{i+1}.</span>
                  <div style={{width:7,height:7,borderRadius:"50%",background:house?.color}} />
                  <span style={{fontSize:13}}>{s.name}</span>
                  {ms && <span>{ms.icon}</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {stage && <span style={{fontSize:10,background:stage.color,color:"white",padding:"1px 6px",borderRadius:10,fontWeight:700}}>S{stage.stage}</span>}
                  <span style={{fontWeight:700,fontSize:13,color:c(pts)}}>{pts>0?"+":""}{pts}</span>
                </div>
              </div>
            );
          })}
          {scopedStudents.length===0 && <p style={{color:"#94a3b8",fontSize:13}}>No students in scope.</p>}
        </div>
      </div>

      {isTeacher && myLogs.length>0 && (
        <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginBottom:16}}>
          <h3 style={{margin:"0 0 12px",fontSize:14,color:"#4a1a7a"}}>My Recent Logs</h3>
          {[...myLogs].sort((a,b)=>b.timestamp-a.timestamp).slice(0,5).map(log => {
            const s = state.students.find(x=>x.id===log.studentId);
            return (
              <div key={log.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                <span>{s?.name||"—"} · <span style={{color:"#64748b"}}>{behavLabel(log.behaviourId)}</span></span>
                <span style={{fontWeight:700,color:c(log.points)}}>{log.points>0?"+":""}{log.points}</span>
              </div>
            );
          })}
        </div>
      )}

      {stageAlerts.length>0 && (
        <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #fca5a5",marginBottom:16}}>
          <h3 style={{margin:"0 0 12px",fontSize:14,color:"#dc2626"}}>Intervention Alerts — Current Half-Term</h3>
          {stageAlerts.map(({s,stage}) => {
            const house = state.houses.find(h=>h.id===s.houseId);
            const d     = demeritTotal(scopedStudents.includes(s)?scopedHtLogs:htLogs, s.id);
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",borderRadius:8,marginBottom:6,border:`1px solid ${stage.color}44`}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:house?.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12}}>{s.name[0]}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{s.name}</div>
                    <div style={{fontSize:11,color:"#64748b"}}>{s.grade} · <span style={{color:house?.color}}>{house?.customName}</span></div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,fontSize:12,color:stage.color}}>{stage.label}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{d} demerit pts · {stage.who}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isSenior||isDisc) && seriousLogs.length>0 && (
        <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #fca5a5",marginBottom:16}}>
          <h3 style={{margin:"0 0 12px",fontSize:14,color:"#dc2626"}}>Serious Incidents ({period})</h3>
          {seriousLogs.map(log => {
            const s   = state.students.find(x=>x.id===log.studentId);
            const stf = state.staff.find(x=>x.id===log.staffId);
            return (
              <div key={log.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                <div>
                  <span style={{fontWeight:600}}>{s?.name||"—"}</span>
                  <span style={{color:"#64748b"}}> · {behavLabel(log.behaviourId)}</span>
                  {log.note && <div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>{log.note}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:800,color:"#dc2626"}}>{log.points}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{stf?.name} · {fmtDate(log.timestamp)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isSenior||isDisc) && (
        <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0"}}>
          <h3 style={{margin:"0 0 12px",fontSize:14,color:"#4a1a7a"}}>Staff Activity ({period})</h3>
          {staffAct.length===0 && <p style={{color:"#94a3b8",fontSize:13}}>No activity this period.</p>}
          {staffAct.map(s => {
            const role = ROLES.find(r=>r.id===s.role);
            return (
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                <span><span style={{fontWeight:600}}>{s.name}</span> <span style={{color:"#64748b"}}>· {role?.label}</span></span>
                <span style={{fontWeight:700,color:"#6b21a8"}}>{s.count} log{s.count!==1?"s":""}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AWARD POINTS ─────────────────────────────────────────────────────────────
function Award({ state, dispatch, user, htLogs, allML }) {
  const [step,    setStep]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newSt,   setNewSt]   = useState({ name:"", houseId:"yellow", grade:"Y7/1" });
  const [sid,     setSid]     = useState("");
  const [catIdx,  setCatIdx]  = useState(0);
  const [behav,   setBehav]   = useState(null);
  const [type,    setType]    = useState("merit");
  const [note,    setNote]    = useState("");
  const [msg,     setMsg]     = useState(null);

  const filtered = state.students.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q);
  });

  function highlight(name) {
    const q = search.trim();
    if (!q) return name;
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx===-1) return name;
    return <>{name.slice(0,idx)}<mark style={{background:"#fef08a",borderRadius:2,padding:"0 1px"}}>{name.slice(idx,idx+q.length)}</mark>{name.slice(idx+q.length)}</>;
  }

  const student    = state.students.find(s=>s.id===sid);
  const cat        = MATRIX[catIdx];
  const catItems   = cat.items.filter(i => type==="merit" ? i.merit!==null : i.demerit!==null);
  const pts        = behav ? (type==="merit" ? behav.merit : behav.demerit) : null;
  const isSerious  = pts!==null && pts<=-5;
  const canSubmit  = student && behav && pts!==null && (!isSerious || note.trim().length>0);

  function reset() { setStep(1); setSid(""); setBehav(null); setType("merit"); setNote(""); setCatIdx(0); setSearch(""); }

  function submit() {
    if (!canSubmit) return;
    const log = { id:"log"+Date.now(), studentId:sid, staffId:user.id, behaviourId:behav.id, type, points:pts, note, timestamp:Date.now(), status:"active" };
    const notifs = [{ id:"n"+Date.now()+"_l", type, studentId:sid, studentName:student.name, grade:student.grade, staffName:user.name, behaviour:behav.label, points:pts, note, timestamp:Date.now(), readBy:[], notifType:"log" }];
    const prevM = meritTotal(allML, sid);
    const newM  = type==="merit" ? prevM+pts : prevM;
    const prevMs= MILESTONES.filter(m=>prevM>=m.pts).pop();
    const newMs = MILESTONES.filter(m=>newM>=m.pts).pop();
    if (newMs && newMs!==prevMs) notifs.push({ id:"n"+Date.now()+"_ms", type:"milestone", studentId:sid, studentName:student.name, grade:student.grade, staffName:user.name, behaviour:"Milestone: "+newMs.badge, points:newMs.pts, note:"", timestamp:Date.now()+1, readBy:[], notifType:"milestone", milestone:newMs });
    const prevD = demeritTotal(htLogs, sid);
    const newD  = type==="demerit" ? prevD+Math.abs(pts) : prevD;
    const prevSt= STAGES.filter(s=>prevD>=s.pts).pop();
    const newSt2= STAGES.filter(s=>newD>=s.pts).pop();
    if (newSt2 && newSt2!==prevSt) notifs.push({ id:"n"+Date.now()+"_st", type:"demerit", studentId:sid, studentName:student.name, grade:student.grade, staffName:user.name, behaviour:"Stage "+newSt2.stage+" triggered", points:0, note:"Action: "+newSt2.who, timestamp:Date.now()+2, readBy:[], notifType:"stage", stage:newSt2 });
    dispatch({ type:"ADD_LOG", log, notifs });
    setMsg({ ok:true, text:(pts>0?"+":"")+pts+" pts logged for "+student.name+(newMs?" · "+newMs.icon+" "+newMs.badge:"") });
    reset();
    setTimeout(() => setMsg(null), 5000);
  }

  function addQuick() {
    if (!newSt.name.trim()) return;
    const s = { id:"s"+Date.now(), name:newSt.name.trim(), houseId:newSt.houseId, grade:newSt.grade, createdAt:Date.now() };
    dispatch({ type:"ADD_STUDENT", s });
    setSid(s.id); setShowAdd(false); setNewSt({ name:"", houseId:"yellow", grade:"Y7/1" }); setSearch(""); setStep(2);
  }

  const stepLabels = ["Select Student","Sanction Type","Select Behaviour","Confirm"];

  return (
    <div>
      <h2 style={{fontSize:17,marginBottom:16}}>Award Behaviour Points</h2>
      {msg && <div style={{padding:"12px 16px",borderRadius:8,marginBottom:16,background:msg.ok?"#f0fdf4":"#fef2f2",color:msg.ok?"#16a34a":"#dc2626",border:`1px solid ${msg.ok?"#86efac":"#fca5a5"}`,fontWeight:600}}>{msg.text}</div>}

      <div style={{display:"flex",gap:3,marginBottom:18}}>
        {stepLabels.map((s,i) => (
          <div key={i} onClick={() => step>i+1 && setStep(i+1)} style={{flex:1,textAlign:"center",padding:"7px 2px",borderRadius:7,background:step===i+1?"#6b21a8":step>i+1?"#dcfce7":"#f1f5f9",color:step===i+1?"white":step>i+1?"#16a34a":"#94a3b8",fontSize:10,fontWeight:600,cursor:step>i+1?"pointer":"default"}}>
            {step>i+1?"✓ ":""}{s}
          </div>
        ))}
      </div>

      {step===1 && (
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #e2e8f0"}}>
          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#94a3b8",pointerEvents:"none"}}>🔍</span>
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name…" style={{...inp,paddingLeft:34}} />
            {search && <button onClick={()=>setSearch("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>✕</button>}
          </div>
          <div style={{display:"grid",gap:7,maxHeight:300,overflowY:"auto"}}>
            {filtered.map(s => {
              const house = state.houses.find(h=>h.id===s.houseId);
              const ms    = studentMilestone(allML, s.id);
              const stage = studentStage(htLogs, s.id);
              return (
                <div key={s.id} onClick={() => { setSid(s.id); setStep(2); }} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:9,border:`2px solid ${sid===s.id?house?.color:"#e2e8f0"}`,cursor:"pointer",background:sid===s.id?house?.bg:"white"}}>
                  <div style={{width:34,height:34,borderRadius:"50%",background:house?.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>{s.name[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{highlight(s.name)} {ms && <span>{ms.icon}</span>}</div>
                    <div style={{fontSize:11,color:house?.color}}>{house?.customName} · {s.grade}</div>
                  </div>
                  {stage && <span style={{fontSize:10,background:stage.color,color:"white",padding:"2px 7px",borderRadius:10,fontWeight:700}}>S{stage.stage}</span>}
                </div>
              );
            })}
            {filtered.length===0 && (
              <div style={{textAlign:"center",padding:"14px 10px"}}>
                <div style={{color:"#94a3b8",fontSize:13,marginBottom:10}}>{search?`No student matching "${search}"`:"No students yet."}</div>
                <button onClick={() => { setShowAdd(o=>!o); if(search) setNewSt(n=>({...n,name:search})); }} style={btnS("#6b21a8")}>+ Add New Student</button>
              </div>
            )}
          </div>
          {showAdd && (
            <div style={{marginTop:12,background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:14}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"#16a34a"}}>Add Student</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8}}>
                <div><label style={lbl}>Name</label><input value={newSt.name} onChange={e=>setNewSt(n=>({...n,name:e.target.value}))} style={inp} /></div>
                <div><label style={lbl}>House</label><select value={newSt.houseId} onChange={e=>setNewSt(n=>({...n,houseId:e.target.value}))} style={inp}>{state.houses.map(h=><option key={h.id} value={h.id}>{h.customName}</option>)}</select></div>
                <div><label style={lbl}>Class</label><select value={newSt.grade} onChange={e=>setNewSt(n=>({...n,grade:e.target.value}))} style={inp}>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button onClick={() => setShowAdd(false)} style={{...btnS("#94a3b8"),flex:1}}>Cancel</button>
                <button onClick={addQuick} disabled={!newSt.name.trim()} style={{...btnS("#22c55e"),flex:2,opacity:newSt.name.trim()?1:0.5}}>Add & Select</button>
              </div>
            </div>
          )}
          {filtered.length>0 && !showAdd && (
            <button onClick={() => { setShowAdd(true); setNewSt(n=>({...n,name:""})); }} style={{...btnS("#f8fafc"),marginTop:10,width:"100%",color:"#64748b",border:"1px solid #e2e8f0",fontSize:12}}>+ Add a new student</button>
          )}
        </div>
      )}

      {step===2 && student && (
        <div style={{background:"white",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
          <div style={{marginBottom:12,fontSize:13,color:"#64748b"}}>Recording for: <strong>{student.name}</strong> · {student.grade}</div>
          <div style={{display:"flex",gap:12}}>
            {[["merit","Merit","#22c55e","#f0fdf4"],["demerit","Demerit","#ef4444","#fef2f2"]].map(([v,label,col,bg]) => (
              <button key={v} onClick={() => { setType(v); setBehav(null); setStep(3); }} style={{flex:1,padding:"18px",borderRadius:10,border:`2px solid ${col}`,background:bg,cursor:"pointer",fontWeight:700,fontSize:16,color:col}}>
                {v==="merit"?"✅ ":"❌ "}{label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step===3 && (
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #e2e8f0"}}>
          <div style={{marginBottom:12}}>
            <label style={lbl}>Category</label>
            <select value={catIdx} onChange={e => { setCatIdx(+e.target.value); setBehav(null); }} style={inp}>
              {MATRIX.map((cat,i) => {
                const has = cat.items.some(it => type==="merit" ? it.merit!==null : it.demerit!==null);
                return has ? <option key={i} value={i}>{cat.category}</option> : null;
              })}
            </select>
          </div>
          <div style={{display:"grid",gap:6,maxHeight:320,overflowY:"auto"}}>
            {catItems.map(item => {
              const p = type==="merit" ? item.merit : item.demerit;
              return (
                <div key={item.id} onClick={() => { setBehav(item); setStep(4); }} style={{padding:"10px 14px",borderRadius:8,border:`2px solid ${behav?.id===item.id?"#6b21a8":"#e2e8f0"}`,cursor:"pointer",background:behav?.id===item.id?"#f3e8ff":"white",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,flex:1}}>{item.label}</span>
                  <span style={{fontWeight:800,fontSize:14,color:p>=0?"#16a34a":"#dc2626",flexShrink:0}}>{p>0?"+":""}{p}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {step===4 && student && behav && (
        <div style={{background:"white",borderRadius:12,padding:22,border:`2px solid ${type==="merit"?"#86efac":"#fca5a5"}`}}>
          <h3 style={{margin:"0 0 14px",color:type==="merit"?"#16a34a":"#dc2626"}}>{type==="merit"?"Confirm Merit":"Confirm Demerit"}</h3>
          <Row label="Student"   value={student.name} />
          <Row label="Class"     value={student.grade} />
          <Row label="Category"  value={cat.category} />
          <Row label="Behaviour" value={behav.label} />
          <Row label="Points"    value={<span style={{fontWeight:800,fontSize:18,color:type==="merit"?"#16a34a":"#dc2626"}}>{pts>0?"+":""}{pts} pts</span>} />
          {isSerious && (
            <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:12,margin:"12px 0"}}>
              <div style={{fontWeight:700,color:"#dc2626",fontSize:13,marginBottom:6}}>Serious Infraction — Note Required</div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Describe the incident in detail…" style={{...inp,height:80,resize:"vertical"}} />
            </div>
          )}
          {!isSerious && (
            <div style={{marginTop:12,marginBottom:4}}>
              <label style={lbl}>Note (optional)</label>
              <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Context, repeated offence…" style={inp} />
            </div>
          )}
          <div style={{marginTop:10,padding:"8px 12px",background:"#faf5ff",borderRadius:8,fontSize:11,color:"#6b21a8"}}>Notifications sent to relevant staff. Milestones and stages auto-checked.</div>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <button onClick={() => setStep(3)} style={{...btnS("#94a3b8"),flex:1}}>Back</button>
            <button onClick={submit} disabled={!canSubmit} style={{...btnS(type==="merit"?"#22c55e":"#ef4444"),flex:2,opacity:canSubmit?1:0.5}}>Confirm & Submit</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
function Students({ state, dispatch, sPts, user, htLogs, allML }) {
  const [form,    setForm]    = useState({ name:"", houseId:"yellow", grade:"Y7/1" });
  const [adding,  setAdding]  = useState(false);
  const [showBulk,setShowBulk]= useState(false);
  const [filterH, setFilterH] = useState("");
  const [filterY, setFilterY] = useState("");
  const [search,  setSearch]  = useState("");

  function add() {
    if (!form.name.trim()) return;
    dispatch({ type:"ADD_STUDENT", s:{ id:"s"+Date.now(), name:form.name.trim(), houseId:form.houseId, grade:form.grade, createdAt:Date.now() } });
    setForm({ name:"", houseId:"yellow", grade:"Y7/1" });
    setAdding(false);
  }

  const vis = state.students.filter(s => {
    if (filterH && s.houseId!==filterH) return false;
    if (filterY && !s.grade.startsWith(filterY)) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {showBulk && <BulkUpload state={state} dispatch={dispatch} onClose={() => setShowBulk(false)} />}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:17,margin:0}}>Students ({state.students.length})</h2>
        <div style={{display:"flex",gap:8}}>
          <button onClick={() => setShowBulk(true)} style={btnS("#8b5cf6")}>Bulk Upload</button>
          <button onClick={() => setAdding(a=>!a)}  style={btnS("#6b21a8")}>{adding?"Cancel":"+ Add"}</button>
        </div>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={{...inp,flex:2,fontSize:12}} />
        <select value={filterH} onChange={e=>setFilterH(e.target.value)} style={{...inp,width:"auto",flex:1,fontSize:12}}>
          <option value="">All Houses</option>
          {state.houses.map(h => <option key={h.id} value={h.id}>{h.customName}</option>)}
        </select>
        <select value={filterY} onChange={e=>setFilterY(e.target.value)} style={{...inp,width:"auto",flex:1,fontSize:12}}>
          <option value="">All Years</option>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>
      {adding && (
        <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #c4b5fd",marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
            <div><label style={lbl}>Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={inp} /></div>
            <div><label style={lbl}>House</label>
              <select value={form.houseId} onChange={e=>setForm(f=>({...f,houseId:e.target.value}))} style={inp}>
                {state.houses.map(h => <option key={h.id} value={h.id}>{h.customName}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Class</label>
              <select value={form.grade} onChange={e=>setForm(f=>({...f,grade:e.target.value}))} style={inp}>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button onClick={add} style={{...btnS("#22c55e"),marginTop:10}}>Add Student</button>
        </div>
      )}
      <div style={{display:"grid",gap:8}}>
        {vis.length===0 && <div style={{textAlign:"center",padding:28,color:"#94a3b8"}}>No students match.</div>}
        {vis.map(s => {
          const house = state.houses.find(h=>h.id===s.houseId);
          const pts   = sPts(s.id);
          const ms    = studentMilestone(allML, s.id);
          const stage = studentStage(htLogs, s.id);
          return (
            <div key={s.id} style={{background:"white",borderRadius:10,padding:"11px 15px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:house?.bg,border:`2px solid ${house?.border||"#e2e8f0"}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:house?.color,fontSize:14}}>{s.name[0]}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:14}}>{s.name} {ms && <span>{ms.icon}</span>}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}><span style={{color:house?.color}}>{house?.customName}</span> · {s.grade}</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                {stage && <span style={{fontSize:10,background:stage.color,color:"white",padding:"2px 8px",borderRadius:10,fontWeight:700}}>{stage.label.split("—")[0].trim()}</span>}
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,fontSize:16,color:c(pts)}}>{pts>0?"+":""}{pts}</div>
                  <div style={{fontSize:10,color:"#94a3b8"}}>pts</div>
                </div>
                {user.role==="admin" && (
                  <button onClick={() => { if (window.confirm("Remove "+s.name+"?")) dispatch({ type:"DELETE_STUDENT", id:s.id }); }} style={{background:"#fef2f2",border:"1px solid #fca5a5",color:"#ef4444",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Remove</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── BULK UPLOAD ──────────────────────────────────────────────────────────────
function BulkUpload({ state, dispatch, onClose }) {
  const [raw,     setRaw]     = useState("");
  const [preview, setPreview] = useState([]);
  const [errors,  setErrors]  = useState([]);
  const [done,    setDone]    = useState(false);

  function houseMatch(name) {
    const n = name.trim().toLowerCase();
    return state.houses.find(h => h.customName.toLowerCase().startsWith(n) || h.name.toLowerCase()===n || h.id===n);
  }

  function parseRows(rows) {
    const errs = [], res = [];
    const start = rows[0]?.[0]?.toString().toLowerCase().includes("name") ? 1 : 0;
    rows.slice(start).forEach((cols, i) => {
      const [name, house, grade] = cols.map(c => (c||"").toString().trim());
      if (!name) { errs.push("Row "+(i+1+start)+": Missing name"); return; }
      const h = houseMatch(house||"");
      if (!h) { errs.push(`Row ${i+1+start}: Unknown house "${house}"`); return; }
      const cls = CLASSES.find(c => c.toLowerCase()===(grade||"").toLowerCase());
      res.push({ id:"b"+Date.now()+"_"+i, name, houseId:h.id, grade:cls||grade||"", createdAt:Date.now() });
    });
    setPreview(res); setErrors(errs);
  }

  function handleFile(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const t = ev.target.result; setRaw(t);
      parseRows(t.trim().split("\n").map(l => l.split(/[,\t]/).map(c=>c.trim())));
    };
    r.readAsText(file);
  }

  function dlTemplate() {
    const content = "Full Name,House,Class\nJohn Kamau,Impala (Yellow),Y8/1";
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8,"+encodeURIComponent(content);
    a.download = "SAA_Students_Template.csv"; a.click();
  }

  function doImport() {
    const ex = new Set(state.students.map(s=>s.name.toLowerCase()));
    const newOnes = preview.filter(s=>!ex.has(s.name.toLowerCase()));
    dispatch({ type:"ADD_STUDENTS_BULK", list:newOnes });
    setDone(true); setTimeout(() => onClose(), 1800);
  }

  const ex2      = new Set(state.students.map(s=>s.name.toLowerCase()));
  const newCount = preview.filter(s=>!ex2.has(s.name.toLowerCase())).length;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:16,padding:24,width:"100%",maxWidth:580,maxHeight:"88vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h2 style={{margin:0,fontSize:17}}>Bulk Upload Students</h2>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
        </div>
        {done ? (
          <div style={{textAlign:"center",padding:24}}><div style={{fontSize:36}}>✅</div><div style={{fontWeight:700,marginTop:8}}>{newCount} students imported!</div></div>
        ) : (
          <>
            <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:10,padding:12,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#15803d"}}>Download CSV Template</div>
              <button onClick={dlTemplate} style={btnS("#16a34a")}>Download .csv</button>
            </div>
            <div style={{border:"2px dashed #cbd5e1",borderRadius:10,padding:16,textAlign:"center",marginBottom:10,cursor:"pointer"}} onClick={() => document.getElementById("bps-fi").click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}>
              <div style={{fontSize:24,marginBottom:4}}>📂</div>
              <div style={{fontSize:13,fontWeight:600,color:"#475569"}}>Click or drag and drop</div>
              <div style={{fontSize:11,color:"#94a3b8"}}>.csv or .txt (Name, House, Class)</div>
              <input id="bps-fi" type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])} />
            </div>
            <textarea value={raw} onChange={e=>{setRaw(e.target.value);parseRows(e.target.value.trim().split("\n").map(l=>l.split(/[,\t]/).map(c=>c.trim())));}} placeholder="John Kamau, Impala (Yellow), Y8/1" style={{...inp,height:70,fontFamily:"monospace",fontSize:12}} />
            {errors.length>0 && <div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:8,padding:10,marginTop:8}}>{errors.map((e,i) => <div key={i} style={{fontSize:12,color:"#dc2626"}}>{"• "+e}</div>)}</div>}
            {preview.length>0 && (
              <div style={{marginTop:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}>
                  <span style={{fontWeight:600}}>{preview.length} parsed</span>
                  <span style={{color:"#16a34a",fontWeight:700}}>+{newCount} new</span>
                </div>
                <button onClick={doImport} disabled={!newCount} style={{...btnS("#22c55e"),width:"100%",padding:"10px",opacity:newCount?1:0.4}}>Import {newCount} students</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
function Leaderboard({ sortedStudents, sortedHouses, sPts, hPts, state, period }) {
  const [view, setView] = useState("students");
  const allML  = state.logs.filter(l=>l.type==="merit");
  const htLogs = state.logs.filter(l=>l.timestamp>=getHalfTermStart());
  const medal  = i => i===0?"🥇":i===1?"🥈":i===2?"🥉":"#"+(i+1);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{fontSize:17}}>Leaderboard — {period}</h2>
        <div style={{display:"flex",gap:4}}>
          {["students","houses"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",background:view===v?"#6b21a8":"#f1f5f9",color:view===v?"white":"#64748b",fontWeight:view===v?700:400,fontSize:12}}>
              {v==="students"?"Students":"Houses"}
            </button>
          ))}
        </div>
      </div>
      {view==="students" && (
        <div style={{display:"grid",gap:8}}>
          {sortedStudents.map((s,i) => {
            const pts   = sPts(s.id);
            const house = state.houses.find(h=>h.id===s.houseId);
            const ms    = studentMilestone(allML, s.id);
            const stage = studentStage(htLogs, s.id);
            return (
              <div key={s.id} style={{background:i<3?house?.bg:"white",borderRadius:10,padding:"13px 18px",border:`1px solid ${i<3?house?.border:"#e2e8f0"}`,display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:i<3?22:14,width:30,textAlign:"center",color:i>=3?"#94a3b8":undefined}}>{medal(i)}</span>
                <div style={{width:34,height:34,borderRadius:"50%",background:house?.color,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700}}>{s.name[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:13}}>{s.name} {ms && ms.icon}</div>
                  <div style={{fontSize:11,color:house?.color}}>{house?.customName} · {s.grade}</div>
                </div>
                {stage && <span style={{fontSize:10,background:stage.color,color:"white",padding:"2px 7px",borderRadius:10,fontWeight:700}}>S{stage.stage}</span>}
                <div style={{fontWeight:800,fontSize:20,color:c(pts)}}>{pts>0?"+":""}{pts}</div>
              </div>
            );
          })}
        </div>
      )}
      {view==="houses" && (
        <div style={{display:"grid",gap:14}}>
          {sortedHouses.map((h,i) => {
            const pts     = hPts(h.id);
            const members = state.students.filter(s=>s.houseId===h.id);
            return (
              <div key={h.id} style={{background:h.bg,borderRadius:12,padding:18,border:`2px solid ${h.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:26}}>{medal(i)}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:17,color:h.color}}>{h.customName}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>{members.length} students</div>
                  </div>
                </div>
                <div style={{fontWeight:800,fontSize:28,color:c(pts)}}>{pts>0?"+":""}{pts}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
function Notifications({ notifs, user, dispatch, state }) {
  const sorted = [...notifs].sort((a,b) => b.timestamp-a.timestamp);
  return (
    <div>
      <h2 style={{fontSize:17,marginBottom:16}}>Alerts</h2>
      {sorted.length===0 && <div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>No notifications yet.</div>}
      <div style={{display:"grid",gap:8}}>
        {sorted.map(n => {
          const read    = n.readBy.includes(user.id);
          const student = state.students.find(s=>s.id===n.studentId);
          const house   = student ? state.houses.find(h=>h.id===student.houseId) : null;
          const isMS    = n.notifType==="milestone";
          const isSt    = n.notifType==="stage";
          return (
            <div key={n.id} onClick={() => !read && dispatch({ type:"MARK_READ", id:n.id, uid:user.id })} style={{background:read?"white":isMS?"#f3e8ff":isSt?"#fff1f2":"#fffbeb",borderRadius:10,padding:"13px 15px",border:`1px solid ${isMS?"#c4b5fd":isSt?"#fca5a5":n.type==="merit"?"#86efac":"#fca5a5"}`,cursor:read?"default":"pointer"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
                <div style={{display:"flex",gap:10,flex:1}}>
                  <div style={{width:36,height:36,borderRadius:8,background:isMS?"#f3e8ff":isSt?"#fee2e2":n.type==="merit"?"#f0fdf4":"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                    {isMS?n.milestone?.icon:isSt?"⚠️":n.type==="merit"?"✅":"❌"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>
                      {n.studentName} <span style={{fontWeight:400,color:"#94a3b8"}}>({n.grade})</span>
                      {!read && <span style={{background:"#fbbf24",color:"white",fontSize:10,padding:"1px 6px",borderRadius:10,marginLeft:6}}>NEW</span>}
                      {isMS  && <span style={{background:"#7c3aed",color:"white",fontSize:10,padding:"1px 6px",borderRadius:10,marginLeft:6}}>MILESTONE</span>}
                      {isSt  && <span style={{background:n.stage?.color||"#dc2626",color:"white",fontSize:10,padding:"1px 6px",borderRadius:10,marginLeft:6}}>STAGE</span>}
                    </div>
                    <div style={{fontSize:12,color:"#475569",marginTop:2}}>{n.behaviour}</div>
                    {n.note && <div style={{fontSize:11,color:"#64748b",marginTop:2,fontStyle:"italic"}}>{n.note}</div>}
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:3}}>By {n.staffName} · {fmtDate(n.timestamp)}</div>
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  {!isMS && !isSt && <div style={{fontWeight:800,fontSize:18,color:c(n.points)}}>{n.points>0?"+":""}{n.points}</div>}
                  {isMS  && <div style={{fontWeight:800,fontSize:18,color:"#7c3aed"}}>{n.milestone?.icon}</div>}
                  {house && <div style={{fontSize:11,color:house.color,fontWeight:600}}>{house.customName}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APPEALS PANEL ────────────────────────────────────────────────────────────
function AppealsPanel({ state, dispatch, user, myAppeals }) {
  const [notes,    setNotes]    = useState({});
  const pending  = myAppeals.filter(a => a.status==="pending"||a.status==="escalated");
  const resolved = myAppeals.filter(a => a.status==="accepted"||a.status==="rejected");

  function resolve(appealId, resolution) {
    dispatch({ type:"RESOLVE_APPEAL", id:appealId, resolution, by:user.name, note:notes[appealId]||"" });
  }

  return (
    <div>
      <h2 style={{fontSize:17,marginBottom:16}}>Student Appeals</h2>
      {pending.length===0 && <div style={{background:"#f0fdf4",borderRadius:10,padding:16,color:"#16a34a",fontSize:13,marginBottom:16}}>No pending appeals.</div>}
      {pending.map(a => {
        const log     = state.logs.find(l=>l.id===a.logId);
        const student = state.students.find(s=>s.id===a.studentId);
        const house   = student ? state.houses.find(h=>h.id===student.houseId) : null;
        return (
          <div key={a.id} style={{background:"white",borderRadius:12,padding:18,border:"2px solid #fbbf24",marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontWeight:700,fontSize:15}}>{student?.name} <span style={{fontSize:12,color:"#64748b"}}>· {student?.grade}</span> {a.status==="escalated"&&<span style={{background:"#f97316",color:"white",fontSize:10,padding:"2px 7px",borderRadius:10,marginLeft:6}}>ESCALATED</span>}</div>
                <div style={{fontSize:12,color:house?.color,fontWeight:600}}>{house?.customName}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontWeight:800,fontSize:18,color:"#dc2626"}}>{log?.points}</div>
                <div style={{fontSize:11,color:"#94a3b8"}}>{fmtDate(a.submittedAt)}</div>
              </div>
            </div>
            <div style={{background:"#fef3c7",borderRadius:8,padding:12,marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:4}}>Behaviour logged:</div>
              <div style={{fontSize:13}}>{behavLabel(log?.behaviourId)}</div>
              {log?.note && <div style={{fontSize:12,color:"#64748b",marginTop:4,fontStyle:"italic"}}>Note: {log.note}</div>}
            </div>
            <div style={{background:"#eff6ff",borderRadius:8,padding:12,marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:700,color:"#1e40af",marginBottom:4}}>Student's reason:</div>
              <div style={{fontSize:13}}>{a.reason}</div>
            </div>
            {a.parentNote && (
              <div style={{background:"#f3e8ff",borderRadius:8,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:700,color:"#6b21a8",marginBottom:4}}>Parent follow-up:</div>
                <div style={{fontSize:13}}>{a.parentNote}</div>
              </div>
            )}
            <div style={{marginBottom:10}}>
              <label style={lbl}>Your decision note</label>
              <input value={notes[a.id]||""} onChange={e=>setNotes(n=>({...n,[a.id]:e.target.value}))} placeholder="Explain your decision…" style={inp} />
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={() => resolve(a.id,"accepted")} style={{...btnS("#16a34a"),flex:1}}>Accept — Remove Points</button>
              <button onClick={() => resolve(a.id,"rejected")} style={{...btnS("#dc2626"),flex:1}}>Reject — Keep Points</button>
            </div>
          </div>
        );
      })}
      {resolved.length>0 && (
        <div>
          <h3 style={{fontSize:14,color:"#64748b",marginBottom:10}}>Resolved</h3>
          {resolved.map(a => {
            const student = state.students.find(s=>s.id===a.studentId);
            return (
              <div key={a.id} style={{background:"white",borderRadius:10,padding:"12px 16px",border:"1px solid #e2e8f0",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:600,fontSize:13}}>{student?.name}</span>
                  <span style={{color:"#64748b",fontSize:12}}> · {behavLabel(state.logs.find(l=>l.id===a.logId)?.behaviourId)}</span>
                </div>
                <span style={{fontSize:12,background:a.status==="accepted"?"#dcfce7":"#fee2e2",color:a.status==="accepted"?"#16a34a":"#dc2626",padding:"2px 8px",borderRadius:10,fontWeight:700}}>{a.status}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function AdminPanel({ state, dispatch }) {
  const [open, setOpen] = useState(false);
  const [f,    setF]    = useState({ name:"", email:"", role:"teacher", year:"", pin:"", pin2:"", studentId:"", childIds:[] });
  const [err,  setErr]  = useState("");
  const [ok,   setOk]   = useState(false);

  function addUser() {
    if (!f.name||!f.email||!f.pin) { setErr("Fill all required fields."); return; }
    if (f.pin!==f.pin2)            { setErr("PINs do not match."); return; }
    if (f.pin.length<4)            { setErr("PIN must be 4+ digits."); return; }
    if (state.staff.find(s=>s.email.toLowerCase()===f.email.toLowerCase())) { setErr("Email already registered."); return; }
    dispatch({ type:"ADD_STAFF", s:{ id:"st"+Date.now(), name:f.name, email:f.email, role:f.role, year:f.year, pin:f.pin, studentId:f.studentId, childIds:f.childIds } });
    setOk(true); setF({ name:"", email:"", role:"teacher", year:"", pin:"", pin2:"", studentId:"", childIds:[] }); setErr("");
    setTimeout(() => setOk(false), 3000);
  }

  return (
    <div>
      <h2 style={{fontSize:17,marginBottom:16}}>Admin Panel</h2>
      <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{margin:0,fontSize:14}}>All Users ({state.staff.length})</h3>
          <button onClick={() => setOpen(o=>!o)} style={btnS("#6b21a8")}>{open?"Cancel":"+ Add User"}</button>
        </div>
        {open && (
          <div style={{background:"#f8fafc",borderRadius:10,padding:14,marginBottom:14}}>
            {ok  && <div style={{color:"#16a34a",fontWeight:600,marginBottom:6}}>User enrolled!</div>}
            {err && <div style={{color:"#dc2626",fontSize:12,marginBottom:6}}>{err}</div>}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10}}>
              <div><label style={lbl}>Name *</label><input value={f.name} onChange={e=>setF(x=>({...x,name:e.target.value}))} style={inp} /></div>
              <div><label style={lbl}>Email *</label><input value={f.email} onChange={e=>setF(x=>({...x,email:e.target.value}))} style={inp} /></div>
              <div><label style={lbl}>Role *</label>
                <select value={f.role} onChange={e=>setF(x=>({...x,role:e.target.value}))} style={inp}>
                  {ROLES.filter(r=>r.id!=="admin").map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </div>
              {f.role==="teacher" && <div><label style={lbl}>Class</label><select value={f.year} onChange={e=>setF(x=>({...x,year:e.target.value}))} style={inp}><option value="">—</option>{CLASSES.map(c=><option key={c}>{c}</option>)}</select></div>}
              {f.role==="student" && <div><label style={lbl}>Linked Student</label><select value={f.studentId||""} onChange={e=>setF(x=>({...x,studentId:e.target.value,year:state.students.find(s=>s.id===e.target.value)?.grade||""}))} style={inp}><option value="">Select…</option>{state.students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>}
              {f.role==="parent" && <div><label style={lbl}>Children (hold Ctrl)</label><select multiple style={{...inp,height:80}} onChange={e=>setF(x=>({...x,childIds:[...e.target.selectedOptions].map(o=>o.value)}))}>{state.students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}</select></div>}
              <div><label style={lbl}>PIN *</label><input type="password" value={f.pin} onChange={e=>setF(x=>({...x,pin:e.target.value}))} style={inp} maxLength={6} /></div>
              <div><label style={lbl}>Confirm PIN *</label><input type="password" value={f.pin2} onChange={e=>setF(x=>({...x,pin2:e.target.value}))} style={inp} maxLength={6} /></div>
            </div>
            <button onClick={addUser} style={{...btnS("#22c55e"),marginTop:10}}>Enrol User</button>
          </div>
        )}
        <div style={{display:"grid",gap:7}}>
          {state.staff.map(s => {
            const role = ROLES.find(r=>r.id===s.role);
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 13px",borderRadius:8,border:"1px solid #f1f5f9"}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13}}>
                    {s.name}
                    {s.role==="admin"   && <span style={{fontSize:10,background:"#fbbf24",color:"white",padding:"1px 6px",borderRadius:10,marginLeft:5}}>ADMIN</span>}
                    {s.role==="student" && <span style={{fontSize:10,background:"#dbeafe",color:"#1e40af",padding:"1px 6px",borderRadius:10,marginLeft:5}}>STUDENT</span>}
                    {s.role==="parent"  && <span style={{fontSize:10,background:"#f3e8ff",color:"#6b21a8",padding:"1px 6px",borderRadius:10,marginLeft:5}}>PARENT</span>}
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{s.email} · {role?.label}{s.year?" · "+s.year:""}</div>
                </div>
                {s.role!=="admin" && (
                  <button onClick={() => { if (window.confirm("Remove "+s.name+"?")) dispatch({ type:"DELETE_STAFF", id:s.id }); }} style={{background:"#fef2f2",border:"1px solid #fca5a5",color:"#ef4444",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:11}}>Remove</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports({ state, user, period }) {
  const [rp, setRp] = useState(period);

  function getLogs() {
    if (rp==="All Time") return state.logs;
    const cut = rp==="Weekly"?getWeekStart():rp==="Monthly"?getMonthStart():getTermStart();
    return state.logs.filter(l=>l.timestamp>=cut);
  }

  const logs   = getLogs();
  const htLogs = state.logs.filter(l=>l.timestamp>=getHalfTermStart());
  const allML  = state.logs.filter(l=>l.type==="merit");
  const mLogs  = logs.filter(l=>l.type==="merit");
  const dLogs  = logs.filter(l=>l.type==="demerit");
  const mPts   = mLogs.reduce((s,l)=>s+l.points,0);
  const dPts   = Math.abs(dLogs.reduce((s,l)=>s+l.points,0));

  const staffU = state.staff.filter(s=>STAFF_ROLES.includes(s.role)).map(s=>{const u=logs.filter(l=>l.staffId===s.id);return{...s,count:u.length,merits:u.filter(l=>l.type==="merit").length,demerits:u.filter(l=>l.type==="demerit").length};}).filter(s=>s.count>0).sort((a,b)=>b.count-a.count);
  const stuSum = state.students.map(s=>{const sl=logs.filter(l=>l.studentId===s.id);const pts=sl.reduce((a,l)=>a+l.points,0);const house=state.houses.find(h=>h.id===s.houseId);const ms=studentMilestone(allML,s.id);const stage=studentStage(htLogs,s.id);return{...s,logs:sl,pts,house,merits:sl.filter(l=>l.type==="merit").reduce((a,l)=>a+l.points,0),demerits:Math.abs(sl.filter(l=>l.type==="demerit").reduce((a,l)=>a+l.points,0)),ms,stage};}).filter(s=>s.logs.length>0).sort((a,b)=>b.pts-a.pts);
  const stageR = state.students.map(s=>({s,stage:studentStage(htLogs,s.id)})).filter(x=>x.stage);
  const pendAp = state.appeals.filter(a=>a.status==="pending"||a.status==="escalated");
  const houseS = [...state.houses].map(h=>{const hl=logs.filter(l=>{const st=state.students.find(s=>s.id===l.studentId);return st&&st.houseId===h.id;});return{...h,pts:hl.reduce((a,l)=>a+l.points,0),count:hl.length};}).sort((a,b)=>b.pts-a.pts);

  function generatePDF() {
    const now = new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
    const css = "*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1e293b;font-size:11px;padding:16px}.hdr{background:#4a1a7a;color:white;padding:18px 22px;display:flex;align-items:center;gap:14px;margin-bottom:14px;border-radius:8px}.logo{width:44px;height:44px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#4a1a7a;font-family:serif;flex-shrink:0}.hdr h1{font-size:17px;font-weight:800}.hdr p{font-size:10px;opacity:.8;letter-spacing:1px;margin-top:2px}.stats{display:flex;gap:8px;margin-bottom:12px}.st{flex:1;background:#f3e8ff;border-radius:6px;padding:9px;text-align:center}.st .v{font-size:19px;font-weight:900}.st .l{font-size:9px;color:#7c3aed;font-weight:700;text-transform:uppercase;margin-top:1px}h2{font-size:11px;font-weight:800;color:#4a1a7a;margin:12px 0 5px;padding-bottom:4px;border-bottom:2px solid #e9d5ff;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-bottom:4px}th{background:#f3e8ff;color:#4a1a7a;font-weight:800;padding:5px 7px;text-align:left;font-size:9px;text-transform:uppercase}td{padding:5px 7px;border-bottom:1px solid #f1f5f9;font-size:10px}tr:nth-child(even) td{background:#faf5ff}.m{color:#16a34a;font-weight:700}.d{color:#dc2626;font-weight:700}.empty{text-align:center;color:#94a3b8;padding:8px;font-style:italic}.footer{margin-top:16px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8;display:flex;justify-content:space-between}";
    const html = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>BPS Report</title><style>${css}</style></head><body>
      <div class='hdr'><div class='logo'>SAA</div><div><h1>St. Austin's Academy</h1><p>BEHAVIOUR POINT SYSTEM — ${rp.toUpperCase()} REPORT</p></div></div>
      <div class='stats'>
        <div class='st'><div class='v m'>+${mPts}</div><div class='l'>Merit Points</div></div>
        <div class='st'><div class='v d'>-${dPts}</div><div class='l'>Demerit Points</div></div>
        <div class='st'><div class='v'>${mLogs.length}</div><div class='l'>Merit Events</div></div>
        <div class='st'><div class='v'>${dLogs.length}</div><div class='l'>Demerit Events</div></div>
      </div>
      <h2>House Standings</h2>
      <table><thead><tr><th>Rank</th><th>House</th><th>Points</th><th>Events</th></tr></thead><tbody>
        ${houseS.map((h,i)=>`<tr><td>${["🥇","🥈","🥉"][i]||"#"+(i+1)}</td><td><strong>${h.customName}</strong></td><td class='${h.pts>=0?"m":"d"}'>${h.pts>0?"+":""}${h.pts}</td><td>${h.count}</td></tr>`).join("")}
      </tbody></table>
      <h2>Student Summary</h2>
      <table><thead><tr><th>#</th><th>Student</th><th>Class</th><th>House</th><th>Merit</th><th>Demerit</th><th>Net</th><th>Milestone</th></tr></thead><tbody>
        ${stuSum.length?stuSum.map((s,i)=>`<tr><td>${i+1}</td><td><strong>${s.name}</strong></td><td>${s.grade}</td><td>${s.house?.customName||""}</td><td class='m'>+${s.merits}</td><td class='d'>-${s.demerits}</td><td class='${s.pts>=0?"m":"d"}'>${s.pts>0?"+":""}${s.pts}</td><td>${s.ms?s.ms.icon+" "+s.ms.badge:"-"}</td></tr>`).join(""):"<tr><td colspan='8' class='empty'>No events.</td></tr>"}
      </tbody></table>
      <h2>Staff Usage</h2>
      <table><thead><tr><th>Name</th><th>Role</th><th>Total</th><th>Merits</th><th>Demerits</th></tr></thead><tbody>
        ${staffU.length?staffU.map(s=>`<tr><td><strong>${s.name}</strong></td><td>${ROLES.find(r=>r.id===s.role)?.label||s.role}</td><td><strong>${s.count}</strong></td><td class='m'>${s.merits}</td><td class='d'>${s.demerits}</td></tr>`).join(""):"<tr><td colspan='5' class='empty'>No activity.</td></tr>"}
      </tbody></table>
      <div class='footer'><span>St. Austin's Academy — BPS 2025-2026</span><span>Generated: ${now} · ${user.name}</span></div>
    </body></html>`;
    let iframe = document.getElementById("bps-pf");
    if (!iframe) { iframe=document.createElement("iframe"); iframe.id="bps-pf"; iframe.style.cssText="position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;"; document.body.appendChild(iframe); }
    iframe.srcdoc = html;
    iframe.onload = () => { iframe.contentWindow.focus(); iframe.contentWindow.print(); };
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <h2 style={{fontSize:17,margin:0}}>Reports</h2>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <select value={rp} onChange={e=>setRp(e.target.value)} style={{...inp,width:"auto"}}>
            {["Weekly","Monthly","Termly","All Time"].map(p=><option key={p}>{p}</option>)}
          </select>
          <button onClick={generatePDF} style={{...btnS("#6b21a8"),boxShadow:"0 4px 12px rgba(107,33,168,0.3)"}}>Print / PDF</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
        <StatCard icon="✅" label="Merit Points"     value={"+"+mPts}        col="#16a34a"/>
        <StatCard icon="❌" label="Demerit Points"   value={"-"+dPts}        col="#dc2626"/>
        <StatCard icon="📋" label="Events"           value={logs.length}     col="#6b21a8"/>
        <StatCard icon="⚠️" label="On Intervention"  value={stageR.length}   col="#f59e0b"/>
        <StatCard icon="⚖️" label="Pending Appeals"  value={pendAp.length}   col="#f97316"/>
      </div>
      <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginBottom:14}}>
        <h3 style={{fontSize:14,margin:"0 0 12px",color:"#4a1a7a"}}>House Standings</h3>
        {houseS.map((h,i) => (
          <div key={h.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f1f5f9",fontSize:13,alignItems:"center"}}>
            <span>{["🥇","🥈","🥉"][i]||"#"+(i+1)} <strong>{h.customName}</strong></span>
            <span style={{fontWeight:700,color:c(h.pts)}}>{h.pts>0?"+":""}{h.pts} pts · {h.count} events</span>
          </div>
        ))}
      </div>
      <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginBottom:14}}>
        <h3 style={{fontSize:14,margin:"0 0 12px",color:"#4a1a7a"}}>Staff Activity</h3>
        {staffU.length===0 && <p style={{color:"#94a3b8",fontSize:13}}>No activity this period.</p>}
        {staffU.map(s => (
          <div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
            <span><strong>{s.name}</strong> · {ROLES.find(r=>r.id===s.role)?.label}</span>
            <span><span style={{color:"#16a34a",fontWeight:700}}>+{s.merits}m</span> <span style={{color:"#dc2626",fontWeight:700}}>-{s.demerits}d</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
