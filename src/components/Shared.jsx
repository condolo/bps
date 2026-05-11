export function BrandLogo({ brand, size = 80, textSize = 20 }) {
  const bg = `linear-gradient(135deg,${brand.primaryColor},${brand.secondaryColor})`;
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",border:`3px solid ${brand.accentColor}`,overflow:"hidden",flexShrink:0}}>
      {brand.logoUrl
        ? <img src={brand.logoUrl} alt="logo" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"} />
        : <span style={{color:"white",fontWeight:900,fontSize:textSize,fontFamily:"serif"}}>{brand.schoolName.split(" ").map(w=>w[0]).join("").slice(0,3)}</span>
      }
    </div>
  );
}

export function StatCard({ icon, label, value, col }) {
  return (
    <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:24}}>{icon}</div>
      <div style={{fontSize:20,fontWeight:700,color:col,marginTop:6}}>{value}</div>
      <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{label}</div>
    </div>
  );
}

export function Row({ label, value }) {
  return (
    <div style={{display:"flex",padding:"7px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
      <span style={{color:"#64748b",width:110,flexShrink:0}}>{label}</span>
      <span style={{fontWeight:600}}>{value}</span>
    </div>
  );
}
