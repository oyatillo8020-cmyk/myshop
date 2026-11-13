const $=i=>document.getElementById(i);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const money=n=>Number(n).toLocaleString("ru-RU")+" so‘m";
let S={products:[],orders:[],cfg:{}};

// Firebase'dan ma'lumotlarni o'qib olish (agar mavjud bo'lsa)
try{
  database().ref('shop_v1').once('value').then(snapshot => {
    const r = snapshot.val();
    if(r) S = Object.assign(S, r);
    S.cfg = Object.assign({name:"VELVET",tg:"",phone:"",pass:"1234"}, S.cfg);
    renderShop();
  });
}catch(e){
  S.cfg = Object.assign({name:"VELVET",tg:"",phone:"",pass:"1234"}, S.cfg);
}

// Saqlash funksiyasi localStorage o'rniga Firebase Realtime Database'ga saqlaydi
function save(){
  try{
    database().ref('shop_v1').set(S);
  }catch(e){
    toast("Saqlashda xatolik yuz berdi.");
  }
}

let tt;function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),2600)}
let cart=[],cat="Hammasi",qry="",sortBy="new",authed=false,tab="p",editId=null,imgs=[],cur=null,curSize="",curImg=0;

/* ---------- Do‘kon ---------- */
function renderShop(){
 $("logo").textContent=S.cfg.name;document.title=S.cfg.name;
 $("foot").textContent=S.cfg.name+(S.cfg.phone?" · "+S.cfg.phone:"")+(S.cfg.tg?" · Telegram: @"+S.cfg.tg:"");
 const cats=["Hammasi",...new Set(S.products.map(p=>p.cat).filter(Boolean))];
 if(!cats.includes(cat))cat="Hammasi";
 $("chips").innerHTML=cats.map(c=>`<button class="chip ${c===cat?"on":""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
 let l=S.products.filter(p=>(cat==="Hammasi"||p.cat===cat)&&p.name.toLowerCase().includes(qry));
 if(sortBy==="lo")l.sort((a,b)=>a.price-b.price);else if(sortBy==="hi")l.sort((a,b)=>b.price-a.price);else l.sort((a,b)=>b.id-a.id);
 $("grid").innerHTML=l.length?l.map(p=>`<div class="card" data-id="${p.id}"><div class="im">${p.imgs&&p.imgs[0]?`<img src="${p.imgs[0]}" alt="">`:"Rasm yo‘q"}</div><div class="nm">${esc(p.name)}</div><div class="pr">${money(p.price)}${p.old?`<s>${money(p.old)}</s>`:""}</div></div>`).join(""):`<div class="empty">${S.products.length?"Hech narsa topilmadi.":"Hozircha mahsulot yo‘q.<br>Yuqoridagi <b>Admin</b> tugmasi orqali kiyim qo‘shing (parol: 1234)."}</div>`;
 $("cc").textContent=cart.reduce((a,b)=>a+b.q,0);
}
$("search").oninput=e=>{qry=e.target.value.toLowerCase();renderShop()};
$("sort").onchange=e=>{sortBy=e.target.value;renderShop()};
$("chips").onclick=e=>{const c=e.target.closest("[data-cat]");if(c){cat=c.dataset.cat;renderShop()}};
$("grid").onclick=e=>{const c=e.target.closest("[data-id]");if(c)openP(+c.dataset.id)};

function openP(id){cur=S.products.find(p=>p.id===id);if(!cur)return;curSize=(cur.sizes||[])[0]||"";curImg=0;drawP();$("pmOv").classList.add("on")}
function drawP(){const p=cur,im=p.imgs||[];
 $("pmBody").innerHTML=`<div class="pm"><div><div class="main">${im[curImg]?`<img src="${im[curImg]}" alt="">`:""}</div><div class="th">${im.map((s,i)=>`<img src="${s}" data-th="${i}" class="${i===curImg?"on":""}" alt="">`).join("")}</div></div>
 <div><h2 style="margin:0 0 6px">${esc(p.name)}</h2><div class="pr" style="font-size:20px">${money(p.price)}${p.old?`<s>${money(p.old)}</s>`:""}</div>${p.cat?`<div class="mut" style="margin-top:4px">${esc(p.cat)}</div>`:""}
 ${(p.sizes||[]).length?`<div class="mut" style="margin-top:14px">O‘lcham</div><div class="sz">${p.sizes.map(s=>`<button data-sz="${esc(s)}" class="${s===curSize?"on":""}">${esc(s)}</button>`).join("")}</div>`:""}
 <p style="line-height:1.5;white-space:pre-line">${esc(p.desc)}</p><button class="btn" id="addC">Savatga qo‘shish</button></div></div>`}
$("pmBody").onclick=e=>{
 const t=e.target;
 if(t.dataset.th){curImg=+t.dataset.th;drawP()}
 else if(t.dataset.sz!==undefined){curSize=t.dataset.sz;drawP()}
 else if(t.id==="addC"){const k=cart.find(c=>c.id===cur.id&&c.size===curSize);k?k.q++:cart.push({id:cur.id,size:curSize,q:1});renderShop();toast("Savatga qo‘shildi");$("pmOv").classList.remove("on")}};

/* ---------- Savat ---------- */
function drawCart(msg){
 const L=cart.map(c=>({c,p:S.products.find(p=>p.id===c.id)})).filter(x=>x.p);
 const total=L.reduce((a,x)=>a+x.p.price*x.c.q,0);
 if(msg){$("drBody").innerHTML=`<p style="line-height:1.5">${msg}</p><button class="btn" data-close>Yopish</button>`;return}
 if(!L.length){$("drBody").innerHTML=`<p class="mut">Savat bo‘sh.</p>`;return}
 $("drBody").innerHTML=L.map((x,i)=>`<div class="ln"><img src="${(x.p.imgs||[])[0]||""}" alt=""><div>${esc(x.p.name)}<div class="mut">${x.c.size?esc(x.c.size)+" · ":""}${money(x.p.price)}</div></div><div class="q"><button data-m="${i}">−</button> ${x.c.q} <button data-p="${i}">+</button></div></div>`).join("")+
 `<h3>Jami: ${money(total)}</h3><div class="f"><input id="cn" placeholder="Ismingiz"><input id="cp" placeholder="Telefon raqam" inputmode="tel"><textarea id="ca" rows="2" placeholder="Manzil"></textarea></div><button class="btn" id="order">Buyurtma berish</button>`}
$("drBody").onclick=e=>{
 const t=e.target;
 if(t.dataset.m!==undefined){const c=cart[+t.dataset.m];if(--c.q<=0)cart.splice(+t.dataset.m,1);drawCart();renderShop()}
 else if(t.dataset.p!==undefined){cart[+t.dataset.p].q++;drawCart();renderShop()}
 else if(t.id==="order"){
  const n=$("cn").value.trim(),ph=$("cp").value.trim(),ad=$("ca").value.trim();
  if(!n||!ph){toast("Ism va telefonni kiriting");return}
  const items=cart.map(c=>{const p=S.products.find(x=>x.id===c.id);return p?{name:p.name,size:c.size,q:c.q,price:p.price}:null}).filter(Boolean);
  const total=items.reduce((a,b)=>a+b.price*b.q,0);
  S.orders.unshift({id:Date.now(),date:new Date().toLocaleString("ru-RU"),n,ph,ad,items,total,st:"Yangi"});save();
  const txt="Yangi buyurtma\n"+items.map(i=>`• ${i.name}${i.size?" ("+i.size+")":""} × ${i.q} = ${money(i.price*i.q)}`).join("\n")+`\nJami: ${money(total)}\nIsm: ${n}\nTel: ${ph}\nManzil: ${ad}`;
  cart=[];renderShop();
  drawCart("Buyurtmangiz qabul qilindi ✅ Tez orada siz bilan bog‘lanamiz.");
  if(S.cfg.tg){try{window.open("https://t.me/"+S.cfg.tg+"?text="+encodeURIComponent(txt),"_blank")}catch(x){}}
 }};
$("cartBtn").onclick=()=>{drawCart();$("dr").classList.add("on")};

/* ---------- Admin ---------- */
$("adminBtn").onclick=()=>{drawAdmin();$("adOv").classList.add("on")};
function readImg(f,max,cb){const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{try{const s=Math.min(1,max/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.max(1,im.width*s);cv.height=Math.max(1,im.height*s);const x=cv.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,cv.width,cv.height);x.drawImage(im,0,0,cv.width,cv.height);cb(cv.toDataURL("image/jpeg",.8))}catch(e){toast("Rasmni o‘qib bo‘lmadi")}URL.revokeObjectURL(u)};im.onerror=()=>toast("Rasmni o‘qib bo‘lmadi");im.src=u}
function drawAdmin(){
 const B=$("adBody");
 if(!authed){B.innerHTML=`<h2 style="margin-top:0">Admin kirish</h2><div class="f"><input id="pw" type="password" placeholder="Parol"></div><button class="btn" id="login">Kirish</button><p class="mut">Boshlang‘ich parol: 1234 (Sozlamalardan o‘zgartiring). Bu parol faqat oddiy to‘siq, haqiqiy himoya emas.</p>`;return}
 const tb=[["p","Mahsulotlar"],["o","Buyurtmalar ("+S.orders.length+")"],["s","Sozlamalar"]].map(([k,v])=>`<button class="chip ${tab===k?"on":""}" data-tab="${k}">${v}</button>`).join("");
 let h=`<div class="tabs">${tb}</div>`;
 if(tab==="p"){
  const e=S.products.find(p=>p.id===editId)||{};
  h+=`<h3 style="margin-top:0">${editId?"Tahrirlash":"Yangi kiyim qo‘shish"}</h3><div class="f">
  <input id="fn" placeholder="Nomi" value="${esc(e.name)}"><input id="fpr" type="number" placeholder="Narxi (so‘m)" value="${e.price||""}"><input id="fo" type="number" placeholder="Eski narx (ixtiyoriy, chegirma uchun)" value="${e.old||""}">
  <input id="fc" placeholder="Kategoriya (Futbolka, Hudi, Shim...)" value="${esc(e.cat)}"><input id="fs" placeholder="O‘lchamlar: S, M, L, XL" value="${esc((e.sizes||[]).join(", "))}">
  <textarea id="fd" rows="3" placeholder="Tavsif">${esc(e.desc)}</textarea><input id="ff" type="file" accept="image/*" multiple><div class="mut">Bir nechta rasm tanlash mumkin (eng ko‘pi 5). Birinchisi asosiy.</div>
  <div class="pv" id="pv">${imgs.map((s,i)=>`<span><img src="${s}" alt=""><i data-rm="${i}">×</i></span>`).join("")}</div></div>
  <button class="btn" id="savep">${editId?"Saqlash":"Qo‘shish"}</button>${editId?`<button class="btn s" id="canc">Bekor qilish</button>`:""}
  <h3>Mahsulotlar (${S.products.length})</h3>`+S.products.map(p=>`<div class="row"><img src="${(p.imgs||[])[0]||""}" alt=""><div class="g">${esc(p.name)}<div class="mut">${money(p.price)}</div></div><button class="btn s sm" data-ed="${p.id}">Tahrir</button><button class="btn s sm" data-del="${p.id}">O‘chirish</button></div>`).join("")}
 else if(tab==="o"){
  h+=S.orders.length?S.orders.map(o=>`<div class="row" style="align-items:flex-start"><div class="g"><b>${esc(o.n)}</b> · ${esc(o.ph)}<div class="mut">${esc(o.date)} · ${esc(o.ad)}</div>${o.items.map(i=>`<div>${esc(i.name)}${i.size?" ("+esc(i.size)+")":""} × ${i.q}</div>`).join("")}<b>${money(o.total)}</b></div><div><button class="btn s sm" data-st="${o.id}">${esc(o.st)}</button><br><br><button class="btn s sm" data-od="${o.id}">O‘chirish</button></div></div>`).join(""):`<p class="mut">Buyurtmalar hali yo‘q.</p>`}
 else{
  h+=`<div class="f"><div class="mut">Do‘kon nomi</div><input id="cn1" value="${esc(S.cfg.name)}"><div class="mut">Telegram username (@siz) — buyurtma shu yerga tushadi</div><input id="cn2" placeholder="masalan: mening_dokonim" value="${esc(S.cfg.tg)}"><div class="mut">Telefon</div><input id="cn3" value="${esc(S.cfg.phone)}"><div class="mut">Admin paroli</div><input id="cn4" value="${esc(S.cfg.pass)}"></div><button class="btn" id="savec">Saqlash</button>
  <h3>Zaxira nusxa</h3><div class="mut">Barcha ma‘lumot Firebase bazasida saqlanadi. Zaxira olish uchun "Olish", tiklash uchun matnni qo‘yib "Tiklash" bosing.</div><div class="f"><textarea id="bk" rows="4"></textarea></div><button class="btn s sm" id="bkx">Olish</button> <button class="btn s sm" id="bki">Tiklash</button>`}
 B.innerHTML=h;
}
$("adBody").onclick=e=>{
 const t=e.target,d=t.dataset;
 if(t.id==="login"){if($("pw").value===S.cfg.pass){authed=true;drawAdmin()}else toast("Parol noto‘g‘ri")}
 else if(d.tab){tab=d.tab;drawAdmin()}
 else if(d.rm!==undefined){imgs.splice(+d.rm,1);drawAdmin()}
 else if(t.id==="savep"){
  const name=$("fn").value.trim(),price=+$("fpr").value;
  if(!name||!price){toast("Nom va narxni kiriting");return}
  const o={id:editId||Date.now(),name,price,old:+$("fo").value||0,cat:$("fc").value.trim(),sizes:$("fs").value.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean),desc:$("fd").value.trim(),imgs:imgs.slice()};
  if(editId)S.products=S.products.map(p=>p.id===editId?o:p);else S.products.push(o);
  save();editId=null;imgs=[];renderShop();drawAdmin();toast("Saqlandi ✅")}
 else if(t.id==="canc"){editId=null;imgs=[];drawAdmin()}
 else if(d.ed){editId=+d.ed;imgs=(S.products.find(p=>p.id===editId).imgs||[]).slice();drawAdmin();$("adBody").parentElement.scrollTo(0,0)}
 else if(d.del){S.products=S.products.filter(p=>p.id!==+d.del);save();renderShop();drawAdmin()}
 else if(d.st){const o=S.orders.find(x=>x.id===+d.st),L=["Yangi","Jarayonda","Yetkazildi","Bekor"];o.st=L[(L.indexOf(o.st)+1)%4];save();drawAdmin()}
 else if(d.od){S.orders=S.orders.filter(o=>o.id!==+d.od);save();drawAdmin()}
 else if(t.id==="savec"){S.cfg={name:$("cn1").value.trim()||"Do‘kon",tg:$("cn2").value.trim().replace("@",""),phone:$("cn3").value.trim(),pass:$("cn4").value||"1234"};save();renderShop();toast("Saqlandi ✅")}
 else if(t.id==="bkx"){$("bk").value=JSON.stringify(S)}
 else if(t.id==="bki"){try{const j=JSON.parse($("bk").value);S=Object.assign({products:[],orders:[],cfg:{}},j);S.cfg=Object.assign({name:"VELVET",tg:"",phone:"",pass:"1234"},S.cfg);save();renderShop();drawAdmin();toast("Tiklandi ✅")}catch(x){toast("Matn noto‘g‘ri")}}
};
$("adBody").onchange=e=>{
 if(e.target.id==="ff"){const fs=[...e.target.files].slice(0,5-imgs.length);let n=fs.length;if(!n)return;
  keep();fs.forEach(f=>readImg(f,800,u=>{imgs.push(u);if(--n===0)restore()}))}};
let kept={};
function keep(){kept={fn:$("fn").value,fpr:$("fpr").value,fo:$("fo").value,fc:$("fc").value,fs:$("fs").value,fd:$("fd").value}}
function restore(){drawAdmin();for(const k in kept)$(k).value=kept[k]}

/* ---------- Umumiy ---------- */
document.addEventListener("click",e=>{if(e.target.closest("[data-close]")||e.target.classList.contains("ov")){document.querySelectorAll(".ov.on").forEach(o=>o.classList.remove("on"));$("dr").classList.remove("on")}});
addEventListener("keydown",e=>{if(e.key==="Escape"){document.querySelectorAll(".ov.on").forEach(o=>o.classList.remove("on"));$("dr").classList.remove("on")}});