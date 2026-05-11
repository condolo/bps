import { useState, useEffect, useReducer, useCallback } from "react";
import { api, setSchoolId, getSchoolId } from "./api.js";
import { reducer } from "./reducer.js";
import { HOUSES, DEFAULT_BRAND } from "./constants.js";
import Login from "./components/Login.jsx";
import StaffApp from "./components/StaffApp.jsx";
import StudentApp from "./components/StudentApp.jsx";
import ParentApp from "./components/ParentApp.jsx";
import SuperAdminApp from "./components/SuperAdminApp.jsx";

const INIT = {
  students: [], staff: [], logs: [], notifications: [], appeals: [],
  houses: HOUSES.map(h => ({ ...h, customName: h.name+" ("+h.colorLabel+")" })),
  brand: DEFAULT_BRAND,
};

function LoadingScreen() {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#4a1a7add,#6b21a8)"}}>
      <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:16}}>📋</div>
      <div style={{color:"white",fontWeight:700,fontSize:18,marginBottom:8}}>Loading BPS…</div>
      <div style={{color:"rgba(255,255,255,0.6)",fontSize:13}}>Connecting to server</div>
    </div>
  );
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#fef2f2",padding:24}}>
      <div style={{fontSize:40,marginBottom:16}}>⚠️</div>
      <div style={{fontWeight:700,fontSize:18,color:"#dc2626",marginBottom:8}}>Cannot reach server</div>
      <div style={{color:"#64748b",fontSize:13,marginBottom:20,textAlign:"center",maxWidth:340}}>{error}</div>
      <button onClick={onRetry} style={{padding:"10px 24px",background:"#dc2626",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>Retry</button>
    </div>
  );
}

export default function App() {

  const [state, dispatch] = useReducer(reducer, INIT);
  const [user, setUser]   = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("bps_user"));
      // If stored user's school matches current URL school context, restore session
      if (stored && stored.schoolId === getSchoolId()) return stored;
      return null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  function loadData() {
    setLoading(true);
    setError(null);
    api.loadAll()
      .then(data => { dispatch({ type: "LOAD", state: data }); setLoading(false); })
      .catch(err  => { setError(err.message); setLoading(false); });
  }

  useEffect(() => { loadData(); }, []);

  const handleLogin = useCallback(async (email, pin) => {
    const u = await api.login(email, pin);
    setSchoolId(u.schoolId || getSchoolId());
    localStorage.setItem("bps_user", JSON.stringify(u));
    setUser(u);
    // Reload data scoped to the logged-in school
    loadData();
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("bps_user");
    setUser(null);
  }, []);

  const serverDispatch = useCallback(async (action) => {
    dispatch(action);
    try {
      switch (action.type) {
        case "ADD_STUDENT":         await api.addStudent(action.s); break;
        case "ADD_STUDENTS_BULK":   await api.addStudentsBulk(action.list); break;
        case "DELETE_STUDENT":      await api.deleteStudent(action.id); break;
        case "ADD_STAFF":           await api.addUser(action.s); break;
        case "DELETE_STAFF":        await api.deleteUser(action.id); break;
        case "ADD_LOG":             await api.addLog(action.log, action.notifs); break;
        case "MARK_READ":           await api.markRead(action.id, action.uid); break;
        case "SUBMIT_APPEAL":       await api.submitAppeal(action.appeal, action.logId); break;
        case "RESOLVE_APPEAL":      await api.resolveAppeal(action.id, { resolution: action.resolution, by: action.by, note: action.note }); break;
        case "UPDATE_PARENT_NOTE":  await api.parentNote(action.id, action.note); break;
        case "UPDATE_BRAND":        await api.updateBrand({ ...state.brand, ...action.brand }); break;
        default: break;
      }
    } catch (err) {
      console.error("API sync error:", action.type, err.message);
    }
  }, [state.brand]);

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen error={error} onRetry={loadData} />;

  const schoolId = getSchoolId();
  const props = { state, dispatch: serverDispatch, user, onLogout: handleLogout, brand: state.brand };

  if (!user)                       return <Login state={state} onLogin={handleLogin} brand={state.brand} schoolId={schoolId} />;
  if (user.role === "superadmin")  return <SuperAdminApp user={user} onLogout={handleLogout} />;
  if (user.role === "student")     return <StudentApp {...props} />;
  if (user.role === "parent")      return <ParentApp  {...props} />;
  return <StaffApp {...props} />;
}
