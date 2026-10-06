/* Synchro via Gist GitHub privé. Réglages (token + id du gist) dans localStorage de chaque appareil. */
(function(){
  var CFG='cockpit-perso-sync', FICHIER='cockpit-perso.json', cfg={}, timer=null, etat=document.getElementById('sync-etat');
  try{cfg=JSON.parse(localStorage.getItem(CFG)||'{}');}catch(e){}
  function dit(t,c){if(etat){etat.textContent=t;etat.className='sync '+(c||'');}}
  function api(m,url,body){return fetch('https://api.github.com'+url,{method:m,headers:{'Authorization':'Bearer '+cfg.token,'Accept':'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();});}
  function pret(){return cfg.token&&cfg.gist;}
  function pull(){
    if(!pret()){dit('⚙ non configuré','off');return;}
    dit('⟳ lecture…');
    api('GET','/gists/'+cfg.gist).then(function(g){
      var f=g.files[FICHIER]; if(!f){dit('✓ gist vide, 1re écriture');return push(window.PersoEtat(),true);}
      var dist=JSON.parse(f.content), loc=window.PersoEtat();
      if(!loc._maj||(dist._maj&&dist._maj>loc._maj)){window.PersoRemplace(dist);dit('✓ à jour ('+(dist._maj||'').slice(0,16).replace('T',' ')+')','ok');}
      else if(loc._maj>(dist._maj||'')){push(loc,true);}
      else dit('✓ à jour','ok');
    }).catch(function(e){dit('✗ lecture : '+e.message,'ko');});
  }
  function push(S,now){
    if(!pret())return;
    clearTimeout(timer); dit('… à envoyer');
    timer=setTimeout(function(){
      var b={files:{}};b.files[FICHIER]={content:JSON.stringify(S,null,1)};
      api('PATCH','/gists/'+cfg.gist,b).then(function(){dit('✓ enregistré','ok');}).catch(function(e){dit('✗ envoi : '+e.message+' (données gardées en local)','ko');});
    },now?0:1500);
  }
  function creer(){
    dit('⟳ création du gist…');
    var b={description:'Cockpit perso — données',public:false,files:{}};b.files[FICHIER]={content:JSON.stringify(window.PersoEtat(),null,1)};
    return api('POST','/gists',b).then(function(g){cfg.gist=g.id;localStorage.setItem(CFG,JSON.stringify(cfg));document.getElementById('sy-g').value=g.id;dit('✓ gist créé','ok');});
  }
  window.PersoSync={push:push,pull:pull};
  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-sync]');if(!b)return;
    var a=b.dataset.sync;
    if(a==='save'){cfg.token=document.getElementById('sy-t').value.trim();cfg.gist=document.getElementById('sy-g').value.trim();localStorage.setItem(CFG,JSON.stringify(cfg));if(cfg.token&&!cfg.gist)creer().then(pull).catch(function(x){dit('✗ '+x.message,'ko');});else pull();}
    else if(a==='pull')pull();
    else if(a==='oubli'){localStorage.removeItem(CFG);cfg={};document.getElementById('sy-t').value='';document.getElementById('sy-g').value='';dit('⚙ non configuré','off');}
  });
  var t=document.getElementById('sy-t'),g=document.getElementById('sy-g');if(t)t.value=cfg.token||'';if(g)g.value=cfg.gist||'';
  pull();
  window.addEventListener('focus',function(){if(pret())pull();});
})();
