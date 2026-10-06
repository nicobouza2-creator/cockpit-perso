/* Cockpit — onglet Perso (hors scolaire). Données en localStorage, export/import JSON. */
(function(){
  var KEY='cockpit-perso-v1', racine=document.getElementById('perso-racine');
  if(!racine) return;
  var S;
  function defaut(){return {
    dates:[],
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
  var filtre={type:'',stat:''}, voirFaits=false;

  /* ── Dates & admin ── */
  function rDates(){
    var t=auj(), L=S.dates.filter(function(x){return voirFaits||!x.fait;}).sort(function(a,b){return a.d<b.d?-1:1;});
    var h='<div class="p-form"><input id="pd-t" placeholder="Échéance / date à retenir"><input id="pd-d" type="date"><button data-a="date+">Ajouter</button></div>';
    if(!L.length)h+='<div class="vide">Rien de noté. Ajoute une échéance (impôts, facture, rdv, anniversaire…).</div>';
    else h+='<ul class="liste">'+L.map(function(x){
      var j=Math.round((new Date(x.d)-new Date(t))/86400000), tag;
      if(x.fait)tag='<span class="badge vert">fait</span>';
      else if(j<0)tag='<span class="badge or">en retard '+(-j)+' j</span>';
      else if(j===0)tag='<span class="badge or">aujourd\'hui</span>';
      else tag='<span class="badge'+(j<=7?' or':'')+'">J-'+j+'</span>';
      return '<li><span class="quand">'+fr(x.d)+'</span> '+tag+' '+(x.fait?'<s>':'')+esc(x.t)+(x.fait?'</s>':'')+
       ' <button class="mini" data-a="date~" data-i="'+x.id+'">'+(x.fait?'↺':'✓')+'</button><button class="mini" data-a="date-" data-i="'+x.id+'">✕</button></li>';
    }).join('')+'</ul>';
    h+='<p class="note" style="padding-left:2px;margin-top:8px"><label><input type="checkbox" id="pd-faits"'+(voirFaits?' checked':'')+'> voir les faits</label></p>';
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
     '<div class="grille2"><section class="bloc"><h2>📅 Dates &amp; admin perso</h2><div id="pz-dates">'+rDates()+'</div></section>'+
     '<section class="bloc"><h2>🏃 Sport — objectif 10 km</h2><div id="pz-sport">'+rSport()+'</div></section></div>'+
     '<div class="grille2"><section class="bloc"><h2>💰 Budget du mois</h2><div id="pz-budget">'+rBudget()+'</div></section>'+
     '<section class="bloc"><h2>🎮 Jeux · mangas · lectures</h2><div id="pz-medias">'+rMedias()+'</div></section></div>'+
     '<section class="bloc"><h2>💾 Sauvegarde</h2><p class="note">Les données restent dans ce navigateur. Exporte de temps en temps (le fichier peut aller dans le vault).</p><div class="p-form"><button data-a="exp">Exporter JSON</button><button data-a="imp">Importer JSON</button><input type="file" id="p-file" accept=".json" style="display:none"></div></section>';
  }

  racine.addEventListener('click',function(e){
    var b=e.target.closest('button[data-a]');if(!b)return;
    var a=b.dataset.a,i=b.dataset.i,v=function(id){var el=document.getElementById(id);return el?el.value:'';};
    if(a==='date+'){if(!v('pd-t').trim()||!v('pd-d'))return;S.dates.push({id:uid(),t:v('pd-t').trim(),d:v('pd-d'),fait:false});}
    else if(a==='date~'){S.dates.forEach(function(x){if(x.id===i)x.fait=!x.fait;});}
    else if(a==='date-'){S.dates=S.dates.filter(function(x){return x.id!==i;});}
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
