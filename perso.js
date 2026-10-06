/* Cockpit — onglet Perso (hors scolaire). Données en localStorage, export/import JSON. */
(function(){
  var KEY='cockpit-perso-v1', racine=document.getElementById('perso-racine');
  if(!racine) return;
  var S;
  function defaut(){return {
    dates:[],
    recurrents:[
      {id:'r1',t:'💰 Salaire',j:25},{id:'r2',t:'🚗 Crédit voiture — 58 000 XPF',j:27},{id:'r3',t:'📞 OPT — payer facture maison',j:28},
      {id:'a1',t:'🎂 Ambre',j:9,m:10},{id:'a2',t:'🎂 Alex',j:14,m:11},{id:'a3',t:'🎂 Maxime',j:5,m:12},{id:'a4',t:'🎂 Mon anniversaire',j:8,m:12},
      {id:'a5',t:'🎂 Erika',j:28,m:12},{id:'a6',t:'🎂 Fanny',j:31,m:1},{id:'a7',t:'🎂 Axel',j:14,m:2},{id:'a8',t:'🎂 Levy',j:17,m:2},{id:'a9',t:'🎂 Papa',j:25,m:5}
    ],
    courses:{liste:[],derniere:null},
    habitudes:{liste:['🏃 Course','💧 Eau','📚 Lecture'],faits:{}},
    sport:{objectif:3,seances:[]},
    budget:{salaire:430000,fixes:[{n:'Loyer',m:75000},{n:'Crédit voiture',m:58000}],depenses:[]},
    medias:[]
  };}
  function charge(){try{var r=localStorage.getItem(KEY);if(r){var o=JSON.parse(r),d=defaut();for(var k in d)if(!o[k])o[k]=d[k];return o;}}catch(e){}return defaut();}
  function sauve(){S._maj=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}if(window.PersoSync)PersoSync.push(S);}
  window.PersoRemplace=function(o){var d=defaut();for(var k in d)if(!o[k])o[k]=d[k];S=o;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}rend();};
  window.PersoEtat=function(){return S;};
  S=charge();
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
  function iso(d){var z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,10);}
  function auj(){return iso(new Date());}
  function xpf(n){return Math.round(n).toLocaleString('fr-FR')+' XPF';}
  function lundi(d){var x=new Date(d);var j=(x.getDay()+6)%7;x.setDate(x.getDate()-j);x.setHours(0,0,0,0);return x;}
  function fr(s){var p=s.split('-');return p[2]+'/'+p[1]+'/'+p[0];}
  var CATS={consommable:'Consommables',utile:'Utile',plaisir:'Plaisir'};
  var TYPES=['jeu vidéo','manga','anime','manhwa','livre','série/film','doc/histoire'];
  var STAT={afaire:'À faire',encours:'En cours',fini:'Fini'};
  var filtre={type:'',stat:''}, voirFaits=false, horizon=60;
  function occurrences(){ // prochaines occurrences des récurrents (mensuels: j ; annuels: j+m) dans l'horizon
    var out=[], t=new Date(), t0=new Date(t.getFullYear(),t.getMonth(),t.getDate());
    S.recurrents.forEach(function(r){
      for(var k=-1;k<14;k++){
        var d=r.m?new Date(t0.getFullYear()+k,r.m-1,r.j):new Date(t0.getFullYear(),t0.getMonth()+k,r.j);
        var diff=(d-t0)/86400000; if(diff<0||diff>horizon)continue;
        var key=iso(d); if(S.dates.some(function(x){return x.src===r.id&&x.d===key;}))continue;
        out.push({id:'occ-'+r.id+'-'+key,t:r.t,d:key,rec:r.id,fait:false});
      }
    });
    return out;
  }
  function importIcs(txt){
    var n=0, lignes=txt.replace(/\r?\n[ \t]/g,'').split(/\r?\n/), ev=null, t0=auj();
    lignes.forEach(function(l){
      if(l==='BEGIN:VEVENT')ev={};
      else if(l==='END:VEVENT'&&ev){ if(ev.d&&ev.t&&ev.d>=t0&&!S.dates.some(function(x){return x.t===ev.t&&x.d===ev.d;})){S.dates.push({id:uid(),t:ev.t,d:ev.d,fait:false,ics:1});n++;} ev=null; }
      else if(ev){ var m=l.match(/^SUMMARY(?:;[^:]*)?:(.*)$/); if(m)ev.t=m[1].replace(/\\,/g,',').trim();
        m=l.match(/^DTSTART(?:;[^:]*)?:(\d{4})(\d{2})(\d{2})/); if(m)ev.d=m[1]+'-'+m[2]+'-'+m[3]; }
    });
    return n;
  }

  /* ── Dates & admin ── */
  function rDates(){
    var t=auj(), L=S.dates.filter(function(x){return voirFaits||!x.fait;}).concat(occurrences()).sort(function(a,b){return a.d<b.d?-1:1;});
    var h='<div class="p-form"><input id="pd-t" placeholder="Échéance / date à retenir"><input id="pd-d" type="date"><button data-a="date+">Ajouter</button></div>';
    if(!L.length)h+='<div class="vide">Rien de noté. Ajoute une échéance (impôts, facture, rdv, anniversaire…).</div>';
    else h+='<ul class="liste">'+L.map(function(x){
      var j=Math.round((new Date(x.d)-new Date(t))/86400000), tag;
      if(x.fait)tag='<span class="badge vert">fait</span>';
      else if(j<0)tag='<span class="badge or">en retard '+(-j)+' j</span>';
      else if(j===0)tag='<span class="badge or">aujourd\'hui</span>';
      else tag='<span class="badge'+(j<=7?' or':'')+'">J-'+j+'</span>';
      var bt=x.rec?'<button class="mini" data-a="occ✓" data-i="'+x.rec+'" data-d="'+x.d+'" title="marquer fait">✓</button>':' <button class="mini" data-a="date~" data-i="'+x.id+'">'+(x.fait?'↺':'✓')+'</button><button class="mini" data-a="date-" data-i="'+x.id+'">✕</button>';
      return '<li><span class="quand">'+fr(x.d)+'</span> '+tag+' '+(x.fait?'<s>':'')+esc(x.t)+(x.fait?'</s>':'')+(x.rec?' <span class="chemin">↻</span>':'')+' '+bt+'</li>';
    }).join('')+'</ul>';
    h+='<p class="note" style="padding-left:2px;margin-top:8px"><label><input type="checkbox" id="pd-faits"'+(voirFaits?' checked':'')+'> voir les faits</label> · horizon <select id="pd-h">'+[30,60,120,365].map(function(v){return '<option'+(v===horizon?' selected':'')+'>'+v+'</option>';}).join('')+'</select> j · <button class="mini" data-a="ics">📥 Importer .ics</button><input type="file" id="pd-ics" accept=".ics" style="display:none"></p>';
    h+='<details><summary class="note" style="cursor:pointer">↻ Récurrents ('+S.recurrents.length+')</summary><ul class="liste">'+S.recurrents.map(function(r){return '<li>'+esc(r.t)+' — '+(r.m?'le '+r.j+'/'+String(r.m).padStart(2,'0')+' chaque année':'le '+r.j+' de chaque mois')+' <button class="mini" data-a="rec-" data-i="'+r.id+'">✕</button></li>';}).join('')+'</ul><div class="p-form"><input id="pr-t" placeholder="Libellé" style="flex:1 1 140px"><input id="pr-j" type="number" min="1" max="31" placeholder="jour" style="width:70px"><input id="pr-m" type="number" min="1" max="12" placeholder="mois (vide = mensuel)" style="width:170px"><button data-a="rec+">Ajouter</button></div></details>';
    return h;
  }

  /* ── Courses ── */
  function rCourses(){
    var C=S.courses, L=C.liste;
    var h='<div class="p-form"><input id="pc-t" placeholder="À acheter…"><button data-a="cour+">+</button></div>';
    if(!L.length)h+='<div class="vide">Liste vide. Courses : samedi 9h-10h30.</div>';
    else h+='<ul class="liste">'+L.map(function(x){return '<li><label><input type="checkbox" data-a="cour~" data-i="'+x.id+'"'+(x.ok?' checked':'')+'> '+(x.ok?'<s>':'')+esc(x.t)+(x.ok?'</s>':'')+'</label> <button class="mini" data-a="cour-" data-i="'+x.id+'">✕</button></li>';}).join('')+'</ul>';
    h+='<p class="note" style="padding-left:2px;margin-top:8px">'+(C.derniere?'Dernières courses : '+fr(C.derniere)+' · ':'')+'<button class="mini" data-a="cour✓">Courses faites (vide les cochés)</button></p>';
    return h;
  }
  /* ── Habitudes ── */
  function rHabitudes(){
    var H=S.habitudes, jours=[], d=new Date(); for(var i=6;i>=0;i--){var x=new Date(d);x.setDate(d.getDate()-i);jours.push(iso(x));}
    var h='<div class="defile"><table><tr><th></th>'+jours.map(function(j){return '<th>'+['L','M','M','J','V','S','D'][(new Date(j).getDay()+6)%7]+'<br><span class="chemin">'+j.slice(8)+'</span></th>';}).join('')+'<th></th></tr>';
    h+=H.liste.map(function(n,ix){return '<tr><td>'+esc(n)+'</td>'+jours.map(function(j){var on=(H.faits[j]||[]).indexOf(n)>=0;return '<td style="text-align:center"><button class="mini hab'+(on?' on':'')+'" data-a="hab~" data-i="'+ix+'" data-d="'+j+'">'+(on?'●':'○')+'</button></td>';}).join('')+'<td><button class="mini" data-a="hab-" data-i="'+ix+'">✕</button></td></tr>';}).join('');
    h+='</table></div><div class="p-form"><input id="ph-t" placeholder="Nouvelle habitude"><button data-a="hab+">Ajouter</button></div>';
    return h;
  }
  /* ── Aujourd'hui ── */
  function rJour(){
    var t=auj(), L=S.dates.filter(function(x){return !x.fait;}).concat(occurrences()).filter(function(x){var j=Math.round((new Date(x.d)-new Date(t))/86400000);return j<=7;}).sort(function(a,b){return a.d<b.d?-1:1;});
    var sem=S.sport.seances.filter(function(s){return new Date(s.d)>=lundi(new Date());}).length;
    var h='<div class="p-kpis"><div><b>'+L.length+'</b><span>échéances ≤ 7 j</span></div><div><b>'+sem+'/'+S.sport.objectif+'</b><span>séances sport</span></div><div><b>'+S.courses.liste.filter(function(x){return !x.ok;}).length+'</b><span>courses à faire</span></div><div><b>'+S.medias.filter(function(x){return x.statut==='encours';}).length+'</b><span>en cours (jeux/lectures)</span></div></div>';
    if(L.length)h+='<ul class="liste">'+L.map(function(x){var j=Math.round((new Date(x.d)-new Date(t))/86400000);return '<li><span class="quand">'+(j<0?'retard':j===0?'aujourd\'hui':'J-'+j)+'</span> '+esc(x.t)+'</li>';}).join('')+'</ul>';
    return h;
  }
  /* ── Sport ── */
  function semaines(){var m={};S.sport.seances.forEach(function(s){var k=iso(lundi(new Date(s.d)));m[k]=(m[k]||0)+1;});return m;}
  function rSport(){
    var sem=semaines(), k0=lundi(new Date()), cur=sem[iso(k0)]||0, obj=S.sport.objectif;
    var serie=0,d=new Date(k0); if(cur>=obj)serie=1; d.setDate(d.getDate()-7);
    while((sem[iso(d)]||0)>=obj){serie++;d.setDate(d.getDate()-7);}
    var km=S.sport.seances.reduce(function(a,s){return a+(+s.km||0);},0), min=S.sport.seances.reduce(function(a,s){return a+(+s.min||0);},0);
    var pions='';for(var i=0;i<Math.max(obj,cur);i++)pions+='<span class="pion-s'+(i<cur?' on':'')+'"></span>';
    var h='<div class="p-kpis"><div><b>'+cur+'/'+obj+'</b><span>cette semaine</span></div><div><b>'+serie+'</b><span>sem. de suite à l\'objectif</span></div><div><b>'+km.toFixed(1)+'</b><span>km cumulés</span></div><div><b>'+Math.round(min/60*10)/10+' h</b><span>cumulées</span></div></div>';
    h+='<div style="margin:8px 0">'+pions+'</div>';
    h+='<div class="p-form"><input id="ps-d" type="date" value="'+auj()+'"><input id="ps-m" type="number" min="0" placeholder="min"><input id="ps-k" type="number" min="0" step="0.1" placeholder="km"><button data-a="sport+">Séance faite</button></div>';
    var L=S.sport.seances.slice().sort(function(a,b){return a.d<b.d?1:-1;}).slice(0,6);
    if(L.length)h+='<ul class="liste">'+L.map(function(s){return '<li><span class="quand">'+fr(s.d)+'</span> '+(s.min?s.min+' min ':'')+(s.km?'· '+s.km+' km':'')+' <button class="mini" data-a="sport-" data-i="'+s.id+'">✕</button></li>';}).join('')+'</ul>';
    h+='<p class="note" style="padding-left:2px;margin-top:8px">Objectif/semaine : <input id="ps-o" type="number" min="1" max="7" value="'+obj+'" style="width:60px"> (plan : lun/mer/ven 7h, objectif 10 km)</p>';
    return h;
  }

  /* ── Budget ── */
  function rBudget(){
    var mois=auj().slice(0,7), B=S.budget;
    var dep=B.depenses.filter(function(x){return x.d.slice(0,7)===mois;});
    var fixes=B.fixes.reduce(function(a,f){return a+(+f.m||0);},0);
    var tot=dep.reduce(function(a,x){return a+(+x.m||0);},0);
    var par={consommable:0,utile:0,plaisir:0};dep.forEach(function(x){par[x.cat]+=+x.m;});
    var reste=B.salaire-fixes-tot;
    var h='<div class="p-kpis"><div><b>'+xpf(B.salaire-fixes)+'</b><span>après charges fixes</span></div><div><b>'+xpf(tot)+'</b><span>dépensé ce mois</span></div><div class="'+(reste<0?'neg':'')+'"><b>'+xpf(reste)+'</b><span>reste</span></div></div>';
    var max=Math.max(1,par.consommable,par.utile,par.plaisir);
    h+=Object.keys(CATS).map(function(c){return '<div class="p-barre"><span>'+CATS[c]+'</span><i style="width:'+Math.round(par[c]/max*100)+'%"></i><b>'+xpf(par[c])+'</b></div>';}).join('');
    h+='<div class="p-form" style="margin-top:10px"><input id="pb-n" placeholder="Achat"><input id="pb-m" type="number" min="0" placeholder="XPF"><select id="pb-c">'+Object.keys(CATS).map(function(c){return '<option value="'+c+'">'+CATS[c]+'</option>';}).join('')+'</select><button data-a="dep+">Ajouter</button></div>';
    var L=dep.slice().sort(function(a,b){return a.d<b.d?1:-1;}).slice(0,8);
    if(L.length)h+='<ul class="liste">'+L.map(function(x){return '<li><span class="quand">'+fr(x.d)+'</span> '+esc(x.n)+' — '+xpf(x.m)+' <span class="badge">'+CATS[x.cat]+'</span> <button class="mini" data-a="dep-" data-i="'+x.id+'">✕</button></li>';}).join('')+'</ul>';
    h+='<details style="margin-top:8px"><summary class="note" style="cursor:pointer">Salaire &amp; charges fixes</summary><div class="p-form"><label>Salaire <input id="pb-s" type="number" value="'+B.salaire+'"></label></div><ul class="liste">'+B.fixes.map(function(f,i){return '<li>'+esc(f.n)+' — '+xpf(f.m)+' <button class="mini" data-a="fix-" data-i="'+i+'">✕</button></li>';}).join('')+'</ul><div class="p-form"><input id="pf-n" placeholder="Charge fixe"><input id="pf-m" type="number" placeholder="XPF"><button data-a="fix+">Ajouter</button></div></details>';
    return h;
  }

  /* ── Médias ── */
  function rMedias(){
    var L=S.medias.filter(function(x){return (!filtre.type||x.type===filtre.type)&&(!filtre.stat||x.statut===filtre.stat);});
    var n={afaire:0,encours:0,fini:0};S.medias.forEach(function(x){n[x.statut]++;});
    var h='<div class="p-form"><input id="pm-t" placeholder="Titre (jeu, manga, manhwa, livre…)"><select id="pm-y">'+TYPES.map(function(t){return '<option>'+t+'</option>';}).join('')+'</select><button data-a="med+">Ajouter</button></div>';
    h+='<div class="p-filtres"><select id="pm-fy"><option value="">Tous types</option>'+TYPES.map(function(t){return '<option'+(filtre.type===t?' selected':'')+'>'+t+'</option>';}).join('')+'</select><select id="pm-fs"><option value="">Tous statuts</option>'+Object.keys(STAT).map(function(s){return '<option value="'+s+'"'+(filtre.stat===s?' selected':'')+'>'+STAT[s]+' ('+n[s]+')</option>';}).join('')+'</select></div>';
    if(!L.length)return h+'<div class="vide">Aucun élément. Ajoute ton backlog.</div>';
    h+='<div class="defile"><table><tr><th>Titre</th><th>Type</th><th>Statut</th><th>Note</th><th></th></tr>'+L.map(function(x){
      return '<tr><td>'+esc(x.t)+'</td><td>'+esc(x.type)+'</td><td><select data-a="med~" data-i="'+x.id+'">'+Object.keys(STAT).map(function(s){return '<option value="'+s+'"'+(x.statut===s?' selected':'')+'>'+STAT[s]+'</option>';}).join('')+'</select></td><td><input data-a="med#" data-i="'+x.id+'" value="'+esc(x.note||'')+'" placeholder="ch. 12, 70 %…"></td><td><button class="mini" data-a="med-" data-i="'+x.id+'">✕</button></td></tr>';}).join('')+'</table></div>';
    return h;
  }

  function rend(){
    racine.innerHTML=
     '<section class="bloc"><h2>☀️ Aujourd\'hui — '+fr(auj())+'</h2>'+rJour()+'</section>'+
     '<div class="grille2"><section class="bloc"><h2>📅 Dates &amp; admin perso</h2><div id="pz-dates">'+rDates()+'</div></section>'+
     '<section class="bloc"><h2>🏃 Sport — objectif 10 km</h2><div id="pz-sport">'+rSport()+'</div></section></div>'+
     '<div class="grille2"><section class="bloc"><h2>💰 Budget du mois</h2><div id="pz-budget">'+rBudget()+'</div></section>'+
     '<section class="bloc"><h2>🎮 Jeux · mangas · lectures</h2><div id="pz-medias">'+rMedias()+'</div></section></div>'+
     '<div class="grille2"><section class="bloc"><h2>🛒 Liste de courses</h2>'+rCourses()+'</section>'+
     '<section class="bloc"><h2>✅ Habitudes — 7 derniers jours</h2>'+rHabitudes()+'</section></div>'+
     '<section class="bloc"><h2>💾 Sauvegarde</h2><p class="note">Les données restent dans ce navigateur. Exporte de temps en temps (le fichier peut aller dans le vault).</p><div class="p-form"><button data-a="exp">Exporter JSON</button><button data-a="imp">Importer JSON</button><input type="file" id="p-file" accept=".json" style="display:none"></div></section>';
  }

  racine.addEventListener('click',function(e){
    var b=e.target.closest('button[data-a]');if(!b)return;
    var a=b.dataset.a,i=b.dataset.i,v=function(id){var el=document.getElementById(id);return el?el.value:'';};
    if(a==='date+'){if(!v('pd-t').trim()||!v('pd-d'))return;S.dates.push({id:uid(),t:v('pd-t').trim(),d:v('pd-d'),fait:false});}
    else if(a==='date~'){S.dates.forEach(function(x){if(x.id===i)x.fait=!x.fait;});}
    else if(a==='date-'){S.dates=S.dates.filter(function(x){return x.id!==i;});}
    else if(a==='occ✓'){var r=S.recurrents.filter(function(x){return x.id===i;})[0];if(r)S.dates.push({id:uid(),t:r.t,d:b.dataset.d,fait:true,src:r.id});}
    else if(a==='rec+'){if(!v('pr-t').trim()||!(+v('pr-j')>0))return;S.recurrents.push({id:uid(),t:v('pr-t').trim(),j:+v('pr-j'),m:+v('pr-m')||undefined});}
    else if(a==='rec-'){S.recurrents=S.recurrents.filter(function(x){return x.id!==i;});}
    else if(a==='ics'){document.getElementById('pd-ics').click();return;}
    else if(a==='cour+'){if(!v('pc-t').trim())return;S.courses.liste.push({id:uid(),t:v('pc-t').trim(),ok:false});}
    else if(a==='cour-'){S.courses.liste=S.courses.liste.filter(function(x){return x.id!==i;});}
    else if(a==='cour✓'){S.courses.liste=S.courses.liste.filter(function(x){return !x.ok;});S.courses.derniere=auj();}
    else if(a==='hab+'){if(!v('ph-t').trim())return;S.habitudes.liste.push(v('ph-t').trim());}
    else if(a==='hab-'){S.habitudes.liste.splice(+i,1);}
    else if(a==='hab~'){var n=S.habitudes.liste[+i],d=b.dataset.d,f=S.habitudes.faits[d]||(S.habitudes.faits[d]=[]),k=f.indexOf(n);if(k>=0)f.splice(k,1);else f.push(n);}
    else if(a==='sport+'){if(!v('ps-d'))return;S.sport.seances.push({id:uid(),d:v('ps-d'),min:+v('ps-m')||0,km:+v('ps-k')||0});}
    else if(a==='sport-'){S.sport.seances=S.sport.seances.filter(function(x){return x.id!==i;});}
    else if(a==='dep+'){if(!v('pb-n').trim()||!(+v('pb-m')>0))return;S.budget.depenses.push({id:uid(),d:auj(),n:v('pb-n').trim(),m:+v('pb-m'),cat:v('pb-c')});}
    else if(a==='dep-'){S.budget.depenses=S.budget.depenses.filter(function(x){return x.id!==i;});}
    else if(a==='fix+'){if(!v('pf-n').trim()||!(+v('pf-m')>0))return;S.budget.fixes.push({n:v('pf-n').trim(),m:+v('pf-m')});}
    else if(a==='fix-'){S.budget.fixes.splice(+i,1);}
    else if(a==='med+'){if(!v('pm-t').trim())return;S.medias.push({id:uid(),t:v('pm-t').trim(),type:v('pm-y'),statut:'afaire',note:''});}
    else if(a==='med-'){S.medias=S.medias.filter(function(x){return x.id!==i;});}
    else if(a==='exp'){var l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));l.download='cockpit-perso-'+auj()+'.json';l.click();return;}
    else if(a==='imp'){document.getElementById('p-file').click();return;}
    sauve();rend();
  });
  racine.addEventListener('change',function(e){
    var t=e.target,a=t.dataset.a;
    if(t.id==='pd-faits'){voirFaits=t.checked;}
    else if(t.id==='pd-h'){horizon=+t.value;}
    else if(a==='cour~'){S.courses.liste.forEach(function(x){if(x.id===t.dataset.i)x.ok=t.checked;});}
    else if(t.id==='pd-ics'){var f=t.files[0];if(!f)return;var r=new FileReader();r.onload=function(){var n=importIcs(r.result);sauve();rend();alert(n+' date(s) importée(s)');};r.readAsText(f);return;}
    else if(t.id==='ps-o'){S.sport.objectif=Math.max(1,Math.min(7,+t.value||3));}
    else if(t.id==='pb-s'){S.budget.salaire=+t.value||0;}
    else if(t.id==='pm-fy'){filtre.type=t.value;}
    else if(t.id==='pm-fs'){filtre.stat=t.value;}
    else if(a==='med~'){S.medias.forEach(function(x){if(x.id===t.dataset.i)x.statut=t.value;});}
    else if(a==='med#'){S.medias.forEach(function(x){if(x.id===t.dataset.i)x.note=t.value;});sauve();return;}
    else if(t.id==='p-file'){var f=t.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var o=JSON.parse(r.result),d=defaut();for(var k in d)if(!o[k])o[k]=d[k];S=o;sauve();rend();}catch(x){alert('Fichier invalide');}};r.readAsText(f);return;}
    else return;
    sauve();rend();
  });
  rend();
})();
