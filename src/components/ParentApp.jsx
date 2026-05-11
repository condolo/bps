import { useState } from "react";
import { BrandLogo } from "./Shared.jsx";
import { inp, btnS } from "../styles.js";
import {
  getHalfTermStart, meritTotal, demeritTotal, netPoints,
  studentStage, studentMilestone, behavLabel, fmtDate, pointColor as c,
} from "../helpers.js";

export default function ParentApp({ state, dispatch, user, onLogout, brand }) {
  const children  = state.students.filter(s => (user.childIds||[]).includes(s.id));
  const [selId, setSelId] = useState(children[0]?.id||"");
  const [tab,   setTab]   = useState("home");

  const child      = state.students.find(s=>s.id===selId);
  const house      = child ? state.houses.find(h=>h.id===child.houseId) : null;
  const cLogs      = state.logs.filter(l=>l.studentId===selId);
  const htLogs     = cLogs.filter(l=>l.timestamp>=getHalfTermStart());
  const allML      = cLogs.filter(l=>l.type==="merit");
  const totM       = meritTotal(cLogs, selId);
  const totD       = demeritTotal(htLogs, selId);
  const net        = netPoints(cLogs, selId);
  const ms         = studentMilestone(allML, selId);
  const stage      = studentStage(htLogs, selId);
  const classmates = state.students.filter(s=>s.grade===child?.grade);
  const rank       = [...classmates].sort((a,b)=>netPoints(state.logs,b.id)-netPoints(state.logs,a.id)).findIndex(s=>s.id===selId)+1;
  const cAppeals   = state.appeals.filter(a=>a.studentId===selId);

  if (children.length===0) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#f8fafc"}}>
        <div style={{textAlign:"center",padding:32}}>
          <div style={{fontSize:40,marginBottom:12}}>👨‍👩‍👧</div>
          <div style={{fontWeight:700,color:"#6b21a8"}}>No children linked to this account.</div>
          <div style={{color:"#64748b",fontSize:13,marginTop:6}}>Please contact the Admin to link your children.</div>
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
            <div style={{fontWeight:700,fontSize:16}}>{brand.schoolName} — Parent Portal</div>
            <div style={{fontSize:11,opacity:0.7}}>Welcome, {user.name}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{background:"rgba(255,255,255,0.15)",color:"white",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12}}>Sign Out</button>
      </div>

      {children.length>1 && (
        <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"10px 20px",display:"flex",alignItems:"center",gap:12}}>
          <label style={{fontSize:13,color:"#64748b",fontWeight:600}}>Viewing:</label>
          <select value={selId} onChange={e=>{setSelId(e.target.value);setTab("home");}} style={{...inp,width:"auto",fontSize:13}}>
            {children.map(ch => <option key={ch.id} value={ch.id}>{ch.name} — {ch.grade}</option>)}
          </select>
        </div>
      )}

      {child && (
        <>
          <div style={{background:house?.bg,borderBottom:`1px solid ${house?.border}`,padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:house?.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16}}>{child.name[0]}</div>
            <div>
              <div style={{fontWeight:700,fontSize:15}}>{child.name}</div>
              <div style={{fontSize:12,color:house?.color}}>{child.grade} · {house?.customName}</div>
            </div>
          </div>

          <div style={{background:"white",borderBottom:`2px solid ${brand.primaryColor}`,display:"flex",overflowX:"auto"}}>
            {[["home","Overview"],["log","Full Log"],["appeals","Appeals"]].map(([id,label]) => (
              <button key={id} onClick={() => setTab(id)} style={{padding:"12px 16px",border:"none",background:"none",cursor:"pointer",fontWeight:tab===id?700:400,color:tab===id?brand.primaryColor:"#64748b",borderBottom:tab===id?`2px solid ${brand.primaryColor}`:"2px solid transparent",whiteSpace:"nowrap",fontSize:13}}>{label}</button>
            ))}
          </div>

          <div style={{padding:"20px",maxWidth:720,margin:"0 auto"}}>
            {tab==="home" && (
              <div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                  <div style={{background:"#f0fdf4",borderRadius:12,padding:16,textAlign:"center",border:"1px solid #86efac"}}>
                    <div style={{fontSize:24,fontWeight:800,color:"#16a34a"}}>+{totM}</div>
                    <div style={{fontSize:12,color:"#16a34a"}}>Total Merits</div>
                  </div>
                  <div style={{background:"#fef2f2",borderRadius:12,padding:16,textAlign:"center",border:"1px solid #fca5a5"}}>
                    <div style={{fontSize:24,fontWeight:800,color:"#dc2626"}}>-{totD}</div>
                    <div style={{fontSize:12,color:"#dc2626"}}>Demerits (HT)</div>
                  </div>
                  <div style={{background:house?.bg,borderRadius:12,padding:16,textAlign:"center",border:`1px solid ${house?.border}`}}>
                    <div style={{fontSize:24,fontWeight:800,color:c(net)}}>{net>0?"+":""}{net}</div>
                    <div style={{fontSize:12,color:house?.color}}>Net Points</div>
                  </div>
                </div>

                {ms && (
                  <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",marginBottom:14,display:"flex",alignItems:"center",gap:14}}>
                    <div style={{fontSize:36}}>{ms.icon}</div>
                    <div>
                      <div style={{fontWeight:700,fontSize:15,color:ms.color}}>{ms.badge}</div>
                      <div style={{fontSize:13,color:"#64748b"}}>{child.name} has earned {totM} merit points</div>
                    </div>
                  </div>
                )}

                {stage && (
                  <div style={{background:"#fef2f2",borderRadius:12,padding:16,border:`1px solid ${stage.color}44`,marginBottom:14}}>
                    <div style={{fontWeight:700,color:stage.color,marginBottom:4}}>{stage.label}</div>
                    <div style={{fontSize:13,color:"#64748b"}}>{child.name} has {totD} demerit points this half-term. Action required by: {stage.who}.</div>
                  </div>
                )}

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                  <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0",textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:800,color:"#6b21a8"}}>{"#"+rank}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>Rank in {child.grade}</div>
                  </div>
                  <div style={{background:house?.bg,borderRadius:12,padding:16,border:`1px solid ${house?.border}`,textAlign:"center"}}>
                    <div style={{fontWeight:700,fontSize:16,color:house?.color}}>{house?.customName}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>House</div>
                  </div>
                </div>

                <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0"}}>
                  <h3 style={{fontSize:14,margin:"0 0 10px",color:"#4a1a7a"}}>Recent Activity</h3>
                  {cLogs.length===0 && <p style={{color:"#94a3b8",fontSize:13}}>No entries yet.</p>}
                  {[...cLogs].sort((a,b)=>b.timestamp-a.timestamp).slice(0,5).map(log => {
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
              </div>
            )}

            {tab==="log" && (
              <div>
                <h2 style={{fontSize:17,marginBottom:16}}>{child.name}'s Full Log</h2>
                {cLogs.length===0 && <div style={{textAlign:"center",padding:32,color:"#94a3b8"}}>No entries yet.</div>}
                {[...cLogs].sort((a,b)=>b.timestamp-a.timestamp).map(log => {
                  const stf = state.staff.find(s=>s.id===log.staffId);
                  return (
                    <div key={log.id} style={{background:"white",borderRadius:10,padding:"12px 16px",border:"1px solid #e2e8f0",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                            <span>{log.type==="merit"?"✅":"❌"}</span>
                            <span style={{fontWeight:600,fontSize:13}}>{behavLabel(log.behaviourId)}</span>
                            {log.status==="overturned" && <span style={{background:"#dcfce7",color:"#16a34a",fontSize:10,padding:"1px 6px",borderRadius:10,fontWeight:700}}>OVERTURNED</span>}
                          </div>
                          <div style={{fontSize:11,color:"#64748b"}}>By {stf?.name} · {fmtDate(log.timestamp)}</div>
                          {log.note && <div style={{fontSize:12,color:"#94a3b8",fontStyle:"italic",marginTop:3}}>{log.note}</div>}
                        </div>
                        <span style={{fontWeight:800,fontSize:18,color:c(log.points),textDecoration:log.status==="overturned"?"line-through":"none",marginLeft:12}}>{log.points>0?"+":""}{log.points}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab==="appeals" && (
              <div>
                <h2 style={{fontSize:17,marginBottom:6}}>{child.name}'s Appeals</h2>
                <p style={{fontSize:13,color:"#64748b",marginBottom:16}}>Appeals are submitted by the student. You may add a follow-up note to a pending appeal below.</p>
                {cAppeals.length===0 && <div style={{color:"#94a3b8",fontSize:13}}>No appeals on record.</div>}
                {cAppeals.map(a => (
                  <ParentAppealItem key={a.id} a={a} state={state} dispatch={dispatch} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ParentAppealItem({ a, state, dispatch }) {
  const [note,  setNote]  = useState(a.parentNote||"");
  const [saved, setSaved] = useState(!!a.parentNote);

  function saveNote() {
    if (!note.trim()) return;
    dispatch({ type:"UPDATE_PARENT_NOTE", id:a.id, note });
    setSaved(true);
  }

  return (
    <div style={{background:"white",borderRadius:10,padding:"13px 16px",border:"1px solid #e2e8f0",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontWeight:600,fontSize:13}}>{behavLabel(state.logs.find(l=>l.id===a.logId)?.behaviourId)}</div>
        <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:10,background:a.status==="accepted"?"#dcfce7":a.status==="rejected"?"#fee2e2":a.status==="escalated"?"#fed7aa":"#fef9c3",color:a.status==="accepted"?"#16a34a":a.status==="rejected"?"#dc2626":a.status==="escalated"?"#c2410c":"#92400e"}}>
          {a.status.toUpperCase()}
        </span>
      </div>
      <div style={{fontSize:12,color:"#475569",marginBottom:6}}>Student reason: {a.reason}</div>
      {(a.status==="pending"||a.status==="escalated") && !saved && (
        <div>
          <label style={{display:"block",marginBottom:4,fontSize:12,fontWeight:600,color:"#475569"}}>Add parent follow-up note (optional)</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add context or supporting information…" style={{width:"100%",padding:"8px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,boxSizing:"border-box",height:70,resize:"vertical"}} />
          <button onClick={saveNote} style={{...btnS("#6b21a8"),marginTop:6,fontSize:12}}>Save Note</button>
        </div>
      )}
      {saved && note && <div style={{fontSize:12,color:"#6b21a8",fontStyle:"italic"}}>Your note: {note}</div>}
      {a.resolvedNote && <div style={{fontSize:12,color:"#475569",marginTop:4}}>Decision: {a.resolvedNote}</div>}
    </div>
  );
}
