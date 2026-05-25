// app/merchant/products/page.tsx — Full variant support
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMerchant } from "../layout";
import { useStoreProducts, useCatalog, addToStore, removeFromStore, toggleVisibility } from "@/lib/hooks";
import toast from "react-hot-toast";

const C={blue:"#1a56db",green:"#16a34a",amber:"#d97706",red:"#dc2626",violet:"#7c3aed"};
const CATS=["All","Electronics & Accessories","Women's Shoes","Men's Shoes","Women's Clothing","Men's Clothing","Women's Bags","Men's Bags","Fitness & Sports","Kitchen & Home","Kids & Baby","Beauty & Skincare","General & Lifestyle"];

// ── Product Modal ─────────────────────────────────────────────
function ProductModal({p,inStore,storeProduct,onAdd,onRemove,onClose,acting}:{p:any;inStore:boolean;storeProduct:any;onAdd:()=>void;onRemove:()=>void;onClose:()=>void;acting:boolean}){
  const [selVarId,setSelVarId]=useState(p.variants?.[0]?.id??"");
  const selVar=p.variants?.find((v:any)=>v.id===selVarId)??p.variants?.[0];
  const img1=p.images?.[0]?.startsWith("http")?p.images[0]:null;
  const img2=p.images?.[1]?.startsWith("http")?p.images[1]:null;
  const [showImg2,setShowImg2]=useState(false);
  const displayImg=showImg2&&img2?img2:img1;

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,maxHeight:"94vh",overflowY:"auto",boxShadow:"0 -8px 40px rgba(0,0,0,.2)"}}>
        {/* Image */}
        <div style={{position:"relative",height:240,background:"#f3f4f6",overflow:"hidden",borderRadius:"20px 20px 0 0",flexShrink:0}}>
          {displayImg
            ?<img src={displayImg} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"opacity .3s"}}/>
            :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:80,background:"linear-gradient(135deg,#eff6ff,#f5f0ff)"}}>📦</div>
          }
          <button onClick={onClose} style={{position:"absolute",top:12,right:12,width:32,height:32,borderRadius:"50%",border:"none",background:"rgba(0,0,0,.4)",color:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          <div style={{position:"absolute",bottom:12,left:12,background:"rgba(0,0,0,.5)",borderRadius:99,padding:"3px 10px",fontSize:10,fontWeight:700,color:"#fff"}}>{p.category}</div>
          {img2&&<div style={{position:"absolute",bottom:10,right:12,display:"flex",gap:5}}>
            <div onClick={()=>setShowImg2(false)} style={{width:32,height:32,borderRadius:6,overflow:"hidden",border:`2px solid ${!showImg2?C.blue:"transparent"}`,cursor:"pointer"}}>
              {img1&&<img src={img1} alt="front" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
            </div>
            <div onClick={()=>setShowImg2(true)} style={{width:32,height:32,borderRadius:6,overflow:"hidden",border:`2px solid ${showImg2?C.blue:"transparent"}`,cursor:"pointer"}}>
              <img src={img2} alt="back" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            </div>
          </div>}
        </div>

        <div style={{padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,fontSize:20,color:"#111827",marginBottom:3,letterSpacing:"-.3px"}}>{p.name}</div>
              <div style={{fontSize:13,color:"#6b7280"}}>{p.vendorName}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontWeight:900,fontSize:24,color:C.green}}>${(selVar?.retailPrice??p.suggestedRetail??0).toFixed(2)}</div>
              <div style={{fontSize:11,color:"#9ca3af"}}>Base ${(selVar?.basePrice??p.basePrice??0).toFixed(2)}</div>
            </div>
          </div>

          {/* Variant selector */}
          {p.variants?.length>0&&<div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:8,textTransform:"uppercase" as const,letterSpacing:".5px"}}>Size & Color</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
              {p.variants.map((v:any)=>(
                <button key={v.id} onClick={()=>setSelVarId(v.id)} disabled={v.stock===0}
                  style={{padding:"6px 12px",borderRadius:8,cursor:v.stock===0?"not-allowed":"pointer",fontSize:12,fontWeight:600,
                    border:`1.5px solid ${selVarId===v.id?C.blue:"#e5e7eb"}`,
                    background:selVarId===v.id?`${C.blue}10`:"#fff",
                    color:selVarId===v.id?C.blue:v.stock===0?"#d1d5db":"#374151",
                    opacity:v.stock===0?.5:1,textDecoration:v.stock===0?"line-through":"none"}}>
                  {v.size} / {v.color}
                </button>
              ))}
            </div>
            {selVar&&<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[
                {l:"Your Cost",   v:`$${selVar.basePrice.toFixed(2)}`,  c:"#374151"},
                {l:"Retail Price",v:`$${selVar.retailPrice.toFixed(2)}`,c:C.green},
                {l:"Stock",       v:selVar.stock,                        c:selVar.stock>10?C.green:selVar.stock>0?C.amber:C.red},
              ].map(s=>(
                <div key={s.l} style={{background:"#f9fafb",borderRadius:9,padding:"10px 12px",textAlign:"center",border:"1px solid #e5e7eb"}}>
                  <div style={{fontFamily:"monospace",fontWeight:800,fontSize:15,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{s.l}</div>
                </div>
              ))}
            </div>}
          </div>}

          {/* Description */}
          {p.description&&<div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:5,textTransform:"uppercase" as const,letterSpacing:".5px"}}>About</div>
            <div style={{fontSize:13,color:"#374151",lineHeight:1.7,background:"#f9fafb",borderRadius:10,padding:"12px 14px",border:"1px solid #e5e7eb"}}>{p.description}</div>
          </div>}

          {/* Profit info */}
          <div style={{background:"#eff6ff",borderRadius:12,padding:"12px 14px",marginBottom:16,border:`1px solid ${C.blue}30`}}>
            <div style={{fontSize:12,color:"#6b7280",lineHeight:1.6}}>
              You earn <strong style={{color:C.green}}>20% profit</strong> on each sale after a platform fee.
              {selVar&&<span> For this variant at ${selVar.retailPrice.toFixed(2)}, you earn ~<strong style={{color:C.green}}>${(selVar.retailPrice*0.17).toFixed(2)}</strong> per unit.</span>}
            </div>
          </div>

          {/* Tags */}
          {p.tags?.length>0&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
            {p.tags.map((t:string)=><span key={t} style={{background:`${C.blue}10`,color:C.blue,borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:600}}>#{t}</span>)}
          </div>}

          <button onClick={inStore?onRemove:onAdd} disabled={acting}
            style={{width:"100%",padding:"13px",borderRadius:12,fontWeight:700,fontSize:16,
              cursor:acting?"not-allowed":"pointer",
              background:inStore?"rgba(220,38,38,.08)":`linear-gradient(135deg,${C.blue},${C.violet})`,
              color:inStore?C.red:"#fff",
              border:inStore?"1.5px solid rgba(220,38,38,.3)":"none",
              opacity:acting?.7:1,marginBottom:8}}>
            {acting?"Processing…":inStore?"✕ Remove from My Store":"+ Add to My Store"}
          </button>
          {inStore&&<button onClick={()=>toggleVisibility(storeProduct.id,storeProduct.isVisible).then(()=>toast.success(storeProduct.isVisible?"Hidden.":"Now visible."))}
            style={{width:"100%",padding:"10px",borderRadius:12,border:"1.5px solid #e5e7eb",background:"transparent",color:"#6b7280",fontWeight:600,fontSize:13,cursor:"pointer"}}>
            {storeProduct.isVisible?"Hide from Store":"Show in Store"}
          </button>}
        </div>
      </div>
    </div>
  );
}

// ── Catalog Card ──────────────────────────────────────────────
function CatalogCard({p,inStore,storeProduct,onView,onAdd,onRemove,acting}:{p:any;inStore:boolean;storeProduct:any;onView:()=>void;onAdd:()=>void;onRemove:()=>void;acting:boolean}){
  const [hover,setHover]=useState(false);
  const [showImg2,setShowImg2]=useState(false);
  const imgs=p.images?.filter((i:string)=>i?.startsWith("http"))||[];
  const img=showImg2&&imgs[1]?imgs[1]:imgs[0];
  const minPrice=p.variants?.length>0?Math.min(...p.variants.map((v:any)=>v.retailPrice)):p.suggestedRetail??0;
  const maxPrice=p.variants?.length>0?Math.max(...p.variants.map((v:any)=>v.retailPrice)):p.suggestedRetail??0;
  const totalStock=p.variants?.reduce((a:number,v:any)=>a+v.stock,0)??p.stock??0;

  return(
    <div onMouseEnter={()=>{setHover(true);if(imgs[1])setShowImg2(true);}} onMouseLeave={()=>{setHover(false);setShowImg2(false);}}
      style={{background:"#fff",border:inStore?`2px solid ${C.blue}`:"1px solid #e5e9f5",borderRadius:16,overflow:"hidden",transition:"all .2s",transform:hover?"translateY(-2px)":"none",boxShadow:hover?"0 8px 24px rgba(0,0,0,.1)":inStore?`0 2px 12px ${C.blue}15`:"none"}}>
      <div onClick={onView} style={{position:"relative",height:180,background:"#f3f4f6",overflow:"hidden"}}>
        {img
          ?<img src={img} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"opacity .3s"}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:56,background:"linear-gradient(135deg,#eff6ff,#f5f0ff)"}}>📦</div>
        }
        {imgs[1]&&!hover&&<div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.5)",borderRadius:6,padding:"2px 7px",fontSize:9,color:"rgba(255,255,255,.9)",fontWeight:600}}>+1 photo</div>}
        <div style={{position:"absolute",top:10,left:10,background:"rgba(0,0,0,.5)",borderRadius:99,padding:"3px 9px",fontSize:9,fontWeight:700,color:"#fff"}}>{p.category}</div>
        {inStore&&<div style={{position:"absolute",top:10,right:10,background:C.blue,borderRadius:99,padding:"3px 9px",fontSize:9,fontWeight:700,color:"#fff"}}>✓ In Store</div>}
        {!inStore&&totalStock===0&&<div style={{position:"absolute",top:10,right:10,background:"rgba(220,38,38,.8)",borderRadius:99,padding:"3px 9px",fontSize:9,fontWeight:700,color:"#fff"}}>Out of Stock</div>}
        {p.variants?.length>0&&<div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,.5)",borderRadius:99,padding:"3px 9px",fontSize:9,fontWeight:700,color:"#fff"}}>{p.variants.length} variants</div>}
      </div>
      <div style={{padding:"12px 14px 8px"}} onClick={onView}>
        <div style={{fontWeight:700,fontSize:14,color:"#111827",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
        <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>{p.vendorName}</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
          <div>
            <div style={{fontFamily:"monospace",fontWeight:900,fontSize:17,color:C.green}}>
              {minPrice===maxPrice?`$${minPrice.toFixed(2)}`:`$${minPrice.toFixed(2)}–$${maxPrice.toFixed(2)}`}
            </div>
            <div style={{fontSize:10,color:"#9ca3af"}}>from ${p.variants?.length>0?Math.min(...p.variants.map((v:any)=>v.basePrice)).toFixed(2):p.basePrice?.toFixed(2)} cost</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,color:C.amber,fontWeight:700}}>~20% profit</div>
          </div>
        </div>
      </div>
      <div style={{padding:"0 14px 14px"}}>
        <button onClick={e=>{e.stopPropagation();inStore?onRemove():onAdd();}} disabled={acting||(!inStore&&totalStock===0)}
          style={{width:"100%",padding:"9px",borderRadius:10,fontWeight:700,fontSize:13,cursor:acting?"not-allowed":"pointer",transition:"all .15s",
            border:`1.5px solid ${inStore?"rgba(220,38,38,.3)":C.blue}`,
            background:inStore?"rgba(220,38,38,.06)":`${C.blue}10`,
            color:inStore?C.red:C.blue,opacity:(acting||(!inStore&&totalStock===0))?.5:1}}>
          {acting?"…":inStore?"✕ Remove":totalStock===0?"Out of Stock":"+ Add to Store"}
        </button>
      </div>
    </div>
  );
}

// ── Store Card ────────────────────────────────────────────────
function StoreCard({sp,onView,onRemove,acting}:{sp:any;onView:()=>void;onRemove:()=>void;acting:boolean}){
  const [hover,setHover]=useState(false);
  const img=sp.productImage?.startsWith("http")?sp.productImage:null;
  const varCount=sp.variants?.length??0;
  return(
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{background:"#fff",border:"1px solid #e5e9f5",borderRadius:16,overflow:"hidden",transition:"all .2s",transform:hover?"translateY(-2px)":"none",boxShadow:hover?"0 8px 24px rgba(0,0,0,.1)":"none"}}>
      <div onClick={onView} style={{position:"relative",height:160,background:"#f3f4f6",overflow:"hidden"}}>
        {img?<img src={img} alt={sp.productName} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .3s",transform:hover?"scale(1.05)":"scale(1)"}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,background:"linear-gradient(135deg,#eff6ff,#f5f0ff)"}}>📦</div>}
        <div style={{position:"absolute",top:10,left:10,background:sp.isVisible?C.green:"rgba(107,114,128,.8)",borderRadius:99,padding:"3px 9px",fontSize:9,fontWeight:700,color:"#fff"}}>
          {sp.isVisible?"● Visible":"● Hidden"}
        </div>
        {varCount>0&&<div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,.5)",borderRadius:99,padding:"3px 9px",fontSize:9,color:"#fff",fontWeight:600}}>{varCount} variants</div>}
      </div>
      <div style={{padding:"12px 14px 8px"}} onClick={onView}>
        <div style={{fontWeight:700,fontSize:13,color:"#111827",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sp.productName}</div>
        <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>{sp.vendorName}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div>
            <div style={{fontFamily:"monospace",fontWeight:800,fontSize:16,color:C.blue}}>${sp.retailPrice?.toFixed(2)}</div>
            <div style={{fontSize:10,color:"#9ca3af"}}>Cost ${sp.basePrice?.toFixed(2)}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,fontWeight:700,color:C.green}}>+${sp.merchantProfit?.toFixed(2)}</div>
            <div style={{fontSize:9,color:"#9ca3af"}}>est. profit</div>
          </div>
        </div>
      </div>
      <div style={{padding:"0 14px 14px"}}>
        <button onClick={e=>{e.stopPropagation();onRemove();}} disabled={acting}
          style={{width:"100%",padding:"8px",borderRadius:9,fontWeight:600,fontSize:12,cursor:"pointer",border:"1px solid rgba(220,38,38,.2)",background:"rgba(220,38,38,.05)",color:C.red,opacity:acting?.5:1}}>
          {acting?"…":"Remove"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProductsPage(){
  const ctx=useMerchant();
  const params=useSearchParams();
  const [tab,setTab]=useState(params.get("tab")==="catalog"?"catalog":"mine");
  const [cat,setCat]=useState("All");
  const [search,setSearch]=useState("");
  const [viewing,setViewing]=useState<any>(null);
  const [acting,setActing]=useState<string|null>(null);

  const {items,loading:myLoad}=useStoreProducts(ctx.storeId);
  const {data:catalog,loading:catLoad}=useCatalog(cat==="All"?undefined:cat);

  const hasIt=(pid:string)=>items.some((i:any)=>i.productId===pid);
  const getItem=(pid:string)=>items.find((i:any)=>i.productId===pid);
  const filteredCatalog=catalog.filter(p=>!search||p.name?.toLowerCase().includes(search.toLowerCase())||p.vendorName?.toLowerCase().includes(search.toLowerCase()));

  async function handleAdd(p:any){
    setActing(p.id);
    try{await addToStore(p,ctx.storeId,ctx.uid);toast.success(`"${p.name}" added!`);}
    catch(e:any){toast.error(e.message==="Already in store"?"Already in your store.":"Failed.");}
    setActing(null);
  }
  async function handleRemove(sp:any){
    if(!confirm(`Remove "${sp.productName||sp.name}"?`))return;
    setActing(sp.id||sp.productId);
    try{await removeFromStore(sp.id);toast.success("Removed.");}
    catch{toast.error("Failed.");}
    setActing(null);
  }

  const viewingStoreProduct=viewing?getItem(viewing.id||viewing.productId):null;
  const viewingInStore=viewing?hasIt(viewing.id||viewing.productId):false;

  return(<div>
    {viewing&&<ProductModal p={viewing} inStore={viewingInStore} storeProduct={viewingStoreProduct}
      onAdd={()=>{handleAdd(viewing);setViewing(null);}}
      onRemove={()=>{handleRemove(viewingStoreProduct||viewing);setViewing(null);}}
      onClose={()=>setViewing(null)} acting={!!acting}/>}

    <div className="fu" style={{marginBottom:18}}>
      <h1 style={{fontWeight:800,fontSize:22,letterSpacing:"-.5px",marginBottom:12}}>Products</h1>
      <div style={{display:"flex",background:"#f3f4f6",borderRadius:11,padding:4,marginBottom:14}}>
        {[{id:"mine",l:`My Store (${items.length})`},{id:"catalog",l:`Catalog (${catalog.length})`}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"9px 10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,background:tab===t.id?"#fff":"transparent",color:tab===t.id?"#111827":"#9ca3af",boxShadow:tab===t.id?"0 1px 3px rgba(0,0,0,.08)":"none"}}>{t.l}</button>
        ))}
      </div>
    </div>

    {/* MY STORE */}
    {tab==="mine"&&(myLoad?<div style={{textAlign:"center",padding:"60px 0",color:"#9ca3af"}}>Loading…</div>:
      items.length===0?<div style={{background:"#fff",border:"1px solid #e5e9f5",borderRadius:16,padding:56,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:14}}>🏪</div>
        <div style={{fontWeight:800,fontSize:18,marginBottom:6}}>Your store is empty</div>
        <div style={{fontSize:14,color:"#6b7280",marginBottom:20}}>Browse the catalog and add products to start selling.</div>
        <button onClick={()=>setTab("catalog")} style={{background:`linear-gradient(135deg,${C.blue},${C.violet})`,color:"#fff",border:"none",borderRadius:11,padding:"12px 28px",fontWeight:700,fontSize:15,cursor:"pointer"}}>Browse Catalog →</button>
      </div>:(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
            {[{l:"Products",v:items.length,c:C.blue},{l:"Visible",v:items.filter((i:any)=>i.isVisible).length,c:C.green},{l:"Total Variants",v:items.reduce((a:number,i:any)=>a+(i.variants?.length??0),0),c:C.violet}].map(s=>(
              <div key={s.l} style={{background:"#fff",border:"1px solid #e5e9f5",borderRadius:10,padding:"12px",textAlign:"center"}}>
                <div style={{fontWeight:800,fontSize:20,color:s.c}}>{s.v}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:1}}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
            {items.map((sp:any)=>(
              <StoreCard key={sp.id} sp={sp}
                onView={()=>{const ci=catalog.find((c:any)=>c.id===sp.productId);setViewing(ci||{id:sp.productId,name:sp.productName,images:[sp.productImage],basePrice:sp.basePrice,suggestedRetail:sp.retailPrice,vendorName:sp.vendorName,category:sp.category,description:"",tags:[],variants:sp.variants||[]});}}
                onRemove={()=>handleRemove(sp)} acting={acting===sp.id}/>
            ))}
          </div>
        </div>
      )
    )}

    {/* CATALOG */}
    {tab==="catalog"&&<div>
      <div style={{marginBottom:14}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products, vendors…"
          style={{width:"100%",padding:"10px 13px",border:"1.5px solid #e5e9f5",borderRadius:11,fontSize:14,outline:"none",background:"#fff",marginBottom:10,boxSizing:"border-box" as const}}
          onFocus={e=>(e.target.style.borderColor=C.blue)} onBlur={e=>(e.target.style.borderColor="#e5e9f5")}/>
        <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{padding:"5px 12px",borderRadius:99,flexShrink:0,border:`1.5px solid ${cat===c?C.blue:"#e5e9f5"}`,background:cat===c?`${C.blue}10`:"#fff",color:cat===c?C.blue:"#6b7280",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{c}</button>
          ))}
        </div>
      </div>
      {catLoad?<div style={{textAlign:"center",padding:"60px 0",color:"#9ca3af"}}>Loading catalog…</div>:
      filteredCatalog.length===0?<div style={{background:"#fff",border:"1px solid #e5e9f5",borderRadius:14,padding:48,textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:10}}>🔍</div>
        <div style={{fontWeight:700,fontSize:15,color:"#6b7280"}}>{search?"No matches":"No products in this category"}</div>
      </div>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
          {filteredCatalog.map((p:any)=>{
            const added=hasIt(p.id);const sp=getItem(p.id);
            return<CatalogCard key={p.id} p={p} inStore={added} storeProduct={sp}
              onView={()=>setViewing(p)} onAdd={()=>handleAdd(p)} onRemove={()=>handleRemove(sp!)}
              acting={acting===p.id||acting===sp?.id}/>;
          })}
        </div>
      )}
    </div>}
  </div>);
}
