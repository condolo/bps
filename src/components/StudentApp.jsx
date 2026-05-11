import { useState } from "react";
import { BrandLogo } from "./Shared.jsx";
import { lbl, inp, btnS } from "../styles.js";
import { MILESTONES } from "../constants.js";
import {
  getHalfTermStart, meritTotal, demeritTotal, netPoints,
  studentStage, studentMilestone, behavLabel, fmtDate, pointColor as c,
} from "../helpers.js";

export default function StudentApp({ state, dispatch, user, onLogout, brand }) {
  const [tab, setTab] = useState("home");
  const student    = state.students.find(s => s.id===user.studentId);
  const house      = student ? state.houses.find(h=>h.id===student.houseId) : null;
  const allLogs    = state.logs.filter(l=>l.studentId===user.studentId);
  const htLogs     = allLogs.filter(l=>l.timestamp>=getHalfTermStart());
  const allML      = allLogs.filter(l=>l.type==="merit");
  const totM       = meritTotal(allLogs, user.studentId);
  const totD       = demeritTotal(htLogs, user.studentId);
  const net        = netPoints(allLogs, user.studentId);
  const ms         = studentMilestone(allML, user.studentId);
  const stage      = studentStage(htLogs, user.studentId);
  const nextMs     = MILESTONES.find(m=>m.pts>totM);
  const myAppeals  = state.appeals.filter(a=>a.studentId===user.studentId);
  const classmates = state.students.filter(s=>s.grade===student?.grade);
  const rank       = [...classmates].sort((a,b)=>netPoints(state.logs,b.id)-netPoints(state.logs,a.id)).findIndex(s=>s.id===user.studentId)+1;

  if (!student) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
        <div style={{textAlign:"center",padding:32}}>
          <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
          <div style={{fontWeight:700,color:"#dc2626"}}>Student profile not linked.</div>
          <div style={{color:"#64748b",fontSize:13,marginTop:6}}>Contact your admin to link your account.</div>
          <button onClick={onLogout} style={{...btnS("#6b21a8"),marginTop:16}}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif",minHeight:"100vh",background:"#f8fafc"}}>
      <div style={{background:`linear-gradient(135deg,${brand.primaryColor},${brand.secondaryColor})`,color:"white",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <BrandLogo brand={brand} size={40} textSize={13} />
          <div>
            <div style={{fontWeight:700,fontSize:16}}>{student.name}</div>
            <div style={{fontSize:11,opacity:0.85}}>{student.grade} · {house?.customName} · {brand.schoolName}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.2)",color:"white",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Sign Out</button>
      </div>

      <div style={{background:"white",borderBottom:`2px solid ${brand.primaryColor}`,display:"flex",overflowX:"auto"}}>
        {[["home","Dashboard"],["log","My Log"],["appeals","Appeals"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{padding:"12px 16px",border:"none",background:"none",cursor:"pointer",fontWeight:tab===id?700:400,color:tab===id?brand.primaryColor:"#64748b",borderBottom:tab===id?`2px solid ${brand.primaryColor}`:"2px solid transparent",whiteSpace:"nowrap",fontSize:13}}>{label}</button>
        ))}
      </div>

      <div style={{padding:"20px",maxWidth:680,margin:"0 auto"}}>
        {tab==="home" && (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
              <div style={{background:"#f0fdf4",borderRadius:12,padding:16,textAlign:"center",border:"1px solid #86efac"}}>
                <div style={{fontSize:24,fontWeight:800,color:"#16a34a"}}>+{totM}</div>
                <div style={{fontSize:12,color:"#16a34a",marginTop:2}}>Total Merits</div>
              </div>
              <div style={{background:"#fef2f2",borderRadius:12,padding:16,textAlign:"center",border:"1px solid #fca5a5"}}>
                <div style={{fontSize:24,fontWeight:800,color:"#dc2626"}}>-{totD}</div>
                <div style={{fontSize:12,color:"#dc2626",marginTop:2}}>Demerits (HT)</div>
              </div>
              <div style={{background:house?.bg||"#f3e8ff",borderRadius:12,padding:16,textAlign:"center",border:`1px solid ${house?.border||"#c4b5fd"}`}}>
                <div style={{fontSize:24,fontWeight:800,color:c(net)}}>{net>0?"+":""}{net}</div>
                <div style={{fontSize:12,color:house?.color,marginTop:2}}>Net Points</div>
              </div>
            </div>

            <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginBottom:14}}>
              <h3 style={{fontSize:14,margin:"0 0 12px",color:"#4a1a7a"}}>My Milestone</h3>
              {ms ? (
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{fontSize:36}}>{ms.icon}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:ms.color}}>{ms.badge}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>Achieved at {ms.pts} merit points</div>
                    {nextMs && <div style={{fontSize:12,color:"#94a3b8",marginTop:4}}>{nextMs.pts-totM} pts to {nextMs.badge}</div>}
                  </div>
                </div>
              ) : (
                <div style={{fontSize:13,color:"#64748b"}}>{nextMs ? `Earn ${nextMs.pts} merit points to reach ${nextMs.badge}.` : "Keep going!"}</div>
              )}
              {nextMs && (
                <div style={{marginTop:12}}>
                  <div style={{background:"#f1f5f9",borderRadius:4,height:8}}>
                    <div style={{background:house?.color||"#6b21a8",height:8,borderRadius:4,width:Math.min(100,(totM/nextMs.pts)*100)+"%"}} />
                  </div>
                  <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{totM} / {nextMs.pts} pts</div>
                </div>
              )}
            </div>

            {stage && (
              <div style={{background:"#fef2f2",borderRadius:12,padding:16,border:`1px solid ${stage.color}44`,marginBottom:14}}>
                <div style={{fontWeight:700,color:stage.color,marginBottom:4}}>Intervention Stage Active</div>
                <div style={{fontWeight:600,color:stage.color}}>{stage.label}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:4}}>You have {totD} demerit points this half-term. Please speak with {stage.who}.</div>
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,color:"#6b21a8"}}>{"#"+rank}</div>
                <div style={{fontSize:12,color:"#64748b"}}>Rank in {student.grade}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:4}}>{classmates.length} students</div>
              </div>
              <div style={{background:house?.bg,borderRadius:12,padding:16,border:`1px solid ${house?.border}`,textAlign:"center"}}>
                <div style={{fontWeight:700,fontSize:16,color:house?.color}}>{house?.customName}</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:4}}>Your house</div>
              </div>
            </div>

            {allLogs.length>0 && (
              <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginTop:14}}>
                <h3 style={{fontSize:14,margin:"0 0 10px",color:"#4a1a7a"}}>Recent Activity</h3>
                {[...allLogs].sort((a,b)=>b.timestamp-a.timestamp).slice(0,5).map(log => {
                  const stf = state.staff.find(s=>s.id===log.staffId);
                  return (
                    <div key={log.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                      <div>
                        <span style={{marginRight:6}}>{log.type==="merit"?"✅":"❌"}</span>
                        <span>{behavLabel(log.behaviourId)}</span>
                        <div style={{fontSize:11,color:"#94a3b8"}}>By {stf?.name} · {fmtDate(log.timestamp)}</div>
                      </div>
                      <span style={{fontWeight:700,color:c(log.points),flexShrink:0,marginLeft:10}}>{log.points>0?"+":""}{log.points}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab==="log" && (
          <div>
            <h2 style={{fontSize:17,marginBottom:16}}>My Behaviour Log</h2>
            {allLogs.length===0 && <div style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No entries yet.</div>}
            {[...allLogs].sort((a,b)=>b.timestamp-a.timestamp).map(log => {
              const stf    = state.staff.find(s=>s.id===log.staffId);
              const isApp  = log.status==="appealing";
              const isOvt  = log.status==="overturned";
              const canApp = log.type==="demerit" && !isOvt && !isApp && !myAppeals.find(a=>a.logId===log.id&&a.status!=="rejected");
              return (
                <div key={log.id} style={{background:"white",borderRadius:10,padding:"13px 16px",border:`1px solid ${isOvt?"#86efac":isApp?"#fcd34d":"#e2e8f0"}`,marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <span style={{fontSize:16}}>{log.type==="merit"?"✅":"❌"}</span>
                        <span style={{fontWeight:600,fontSize:13}}>{behavLabel(log.behaviourId)}</span>
                        {isOvt && <span style={{background:"#dcfce7",color:"#16a34a",fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700}}>OVERTURNED</span>}
                        {isApp && <span style={{background:"#fef9c3",color:"#92400e",fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700}}>UNDER APPEAL</span>}
                      </div>
                      <div style={{fontSize:11,color:"#64748b"}}>By {stf?.name} · {fmtDate(log.timestamp)}</div>
                      {log.note && <div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic",marginTop:3}}>{log.note}</div>}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,marginLeft:12}}>
                      <div style={{fontWeight:800,fontSize:18,color:c(log.points),textDecoration:isOvt?"line-through":"none"}}>{log.points>0?"+":""}{log.points}</div>
                      {canApp && <button onClick={() => setTab("appeals")} style={{fontSize:10,background:"#fef3c7",border:"1px solid #fcd34d",color:"#92400e",borderRadius:6,padding:"2px 8px",cursor:"pointer",marginTop:4}}>Appeal</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab==="appeals" && (
          <StudentAppeals state={state} dispatch={dispatch} user={user} student={student} myAppeals={myAppeals} />
        )}
      </div>
    </div>
  );
}

function StudentAppeals({ state, dispatch, user, student, myAppeals }) {
  const [form, setForm] = useState({ logId:"", reason:"" });
  const [msg,  setMsg]  = useState("");

  const eligible = state.logs.filter(l =>
    l.studentId===user.studentId &&
    l.type==="demerit" &&
    l.status==="active" &&
    !myAppeals.find(a=>a.logId===l.id&&a.status!=="rejected")
  );

  function submit() {
    if (!form.logId||!form.reason.trim()) { setMsg("Please select a log and write your reason."); return; }
    dispatch({
      type:"SUBMIT_APPEAL",
      logId: form.logId,
      appeal: {
        id:"ap"+Date.now(), logId:form.logId, studentId:user.studentId,
        studentName:student?.name, grade:student?.grade,
        reason:form.reason, submittedAt:Date.now(), status:"pending",
      },
    });
    setForm({ logId:"", reason:"" });
    setMsg("Appeal submitted. Your Class Teacher will review it.");
    setTimeout(() => setMsg(""), 5000);
  }

  return (
    <div>
      <h2 style={{fontSize:17,marginBottom:6}}>Submit an Appeal</h2>
      <p style={{fontSize:13,color:"#64748b",marginBottom:16}}>If a demerit was logged unfairly you can appeal here. Your Class Teacher reviews it first. Points are frozen while pending.</p>
      {msg && <div style={{padding:"10px 14px",borderRadius:8,background:"#f0fdf4",color:"#16a34a",border:"1px solid #86efac",marginBottom:14,fontSize:13}}>{msg}</div>}
      {eligible.length>0 ? (
        <div style={{background:"white",borderRadius:12,padding:18,border:"1px solid #e2e8f0",marginBottom:20}}>
          <div style={{marginBottom:12}}>
            <label style={lbl}>Select the demerit to appeal</label>
            <select value={form.logId} onChange={e=>setForm(f=>({...f,logId:e.target.value}))} style={inp}>
              <option value="">Choose…</option>
              {eligible.map(l => <option key={l.id} value={l.id}>{fmtDate(l.timestamp)} · {behavLabel(l.behaviourId)} ({l.points} pts)</option>)}
            </select>
          </div>
          <div style={{marginBottom:14}}>
            <label style={lbl}>Your reason</label>
            <textarea value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder="Explain clearly why you believe this demerit was unfair…" style={{...inp,height:90,resize:"vertical"}} />
          </div>
          <button onClick={submit} style={{...btnS("#6b21a8"),width:"100%"}}>Submit Appeal</button>
        </div>
      ) : (
        <div style={{background:"#f0fdf4",borderRadius:10,padding:16,color:"#16a34a",fontSize:13,marginBottom:20}}>No eligible demerit entries to appeal at this time.</div>
      )}

      <h3 style={{fontSize:14,marginBottom:10,color:"#475569"}}>My Previous Appeals</h3>
      {myAppeals.length===0 && <div style={{color:"#94a3b8",fontSize:13}}>No appeals submitted yet.</div>}
      {[...myAppeals].sort((a,b)=>b.submittedAt-a.submittedAt).map(a => (
        <div key={a.id} style={{background:"white",borderRadius:10,padding:"13px 16px",border:"1px solid #e2e8f0",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{behavLabel(state.logs.find(l=>l.id===a.logId)?.behaviourId)}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Submitted: {fmtDate(a.submittedAt)}</div>
              {a.resolvedNote && <div style={{fontSize:12,color:"#475569",marginTop:4,fontStyle:"italic"}}>Decision: {a.resolvedNote}</div>}
            </div>
            <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:10,background:a.status==="accepted"?"#dcfce7":a.status==="rejected"?"#fee2e2":a.status==="escalated"?"#fed7aa":"#fef9c3",color:a.status==="accepted"?"#16a34a":a.status==="rejected"?"#dc2626":a.status==="escalated"?"#c2410c":"#92400e"}}>
              {a.status.toUpperCase()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
