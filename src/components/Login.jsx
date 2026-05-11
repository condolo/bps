import { useState } from "react";
import { BrandLogo } from "./Shared.jsx";
import { lbl, inp, btnS } from "../styles.js";

const QUICK_LOGINS = {
  saa: [
    { label:"Admin",      e:"admin@staustin.ac.ke",   p:"0000" },
    { label:"Pastoral",   e:"kamau@staustin.ac.ke",   p:"1111" },
    { label:"KS3 Coord",  e:"otieno@staustin.ac.ke",  p:"2222" },
    { label:"Teacher",    e:"wanjiku@staustin.ac.ke",  p:"3333" },
    { label:"Discipline", e:"disc@staustin.ac.ke",     p:"4444" },
    { label:"Student",    e:"amara@staustin.ac.ke",    p:"5555" },
    { label:"Parent",     e:"parent.osei@gmail.com",   p:"7777" },
  ],
  demo: [
    { label:"Admin",      e:"demo.admin@mascitlab.ac.ke",      p:"0000" },
    { label:"Pastoral",   e:"demo.pastoral@mascitlab.ac.ke",   p:"1111" },
    { label:"KS3 Coord",  e:"demo.ks3@mascitlab.ac.ke",        p:"2222" },
    { label:"Teacher",    e:"demo.teacher@mascitlab.ac.ke",    p:"3333" },
    { label:"Discipline", e:"demo.discipline@mascitlab.ac.ke", p:"4444" },
    { label:"Student",    e:"demo.student@mascitlab.ac.ke",    p:"5555" },
    { label:"Parent",     e:"demo.parent@mascitlab.ac.ke",     p:"6666" },
  ],
};

export default function Login({ onLogin, brand, schoolId }) {
  const [email,   setEmail]   = useState("");
  const [pin,     setPin]     = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const demos = QUICK_LOGINS[schoolId] || QUICK_LOGINS.saa;

  async function doLogin() {
    if (!email || !pin) { setErr("Please enter email and PIN."); return; }
    setLoading(true);
    setErr("");
    try {
      await onLogin(email, pin);
    } catch (e) {
      setErr(e.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) { if (e.key === "Enter") doLogin(); }

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(160deg,${brand.primaryColor}dd,${brand.secondaryColor})`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:20,padding:32,width:"100%",maxWidth:420,boxShadow:`0 24px 64px ${brand.primaryColor}80`}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
            <BrandLogo brand={brand} size={80} textSize={20} />
          </div>
          <div style={{fontWeight:800,fontSize:21,color:brand.primaryColor}}>{brand.schoolName}</div>
          {brand.motto && <div style={{color:brand.secondaryColor,fontSize:12,marginTop:2,fontStyle:"italic"}}>{brand.motto}</div>}
          <div style={{color:brand.secondaryColor,fontSize:11,letterSpacing:"1.5px",marginTop:4,fontWeight:600}}>BEHAVIOUR POINT SYSTEM</div>
          <div style={{width:40,height:3,background:`linear-gradient(90deg,${brand.primaryColor},${brand.accentColor})`,borderRadius:2,margin:"8px auto 0"}} />
        </div>

        <div style={{marginBottom:12}}>
          <label style={lbl}>Email</label>
          <input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={handleKey} style={inp} placeholder="your@school.ac.ke" autoFocus />
        </div>
        <div style={{marginBottom:18}}>
          <label style={lbl}>PIN</label>
          <input type="password" value={pin} onChange={e=>{setPin(e.target.value);setErr("");}} onKeyDown={handleKey} style={inp} placeholder="••••" maxLength={6} />
        </div>

        {err && <div style={{color:"#dc2626",fontSize:13,marginBottom:10}}>{err}</div>}

        <button onClick={doLogin} disabled={loading} style={{...btnS(brand.buttonColor),width:"100%",padding:"12px",fontSize:15,opacity:loading?0.7:1}}>
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <div style={{marginTop:16,background:brand.highlightColor,borderRadius:10,padding:12}}>
          <div style={{fontSize:11,color:brand.primaryColor,fontWeight:700,marginBottom:8}}>QUICK LOGIN</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {demos.map(d => (
              <button key={d.e} onClick={() => { setEmail(d.e); setPin(d.p); setErr(""); }}
                style={{padding:"4px 10px",background:brand.highlightColor,border:`1px solid ${brand.borderColor}`,borderRadius:20,fontSize:11,cursor:"pointer",color:brand.primaryColor,fontWeight:600}}>
                {d.label}
              </button>
            ))}
          </div>
          <div style={{fontSize:10,color:"#94a3b8",marginTop:6}}>Click a role to fill credentials, then Sign In</div>
        </div>
      </div>
    </div>
  );
}
