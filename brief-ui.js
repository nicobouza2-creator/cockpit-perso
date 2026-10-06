/* Affichage du brief de l'assistant (brief.json). window.BriefUI.render(brief) */
(function(){
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function gras(s){return esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');}
  function fr(s){return s?s.slice(8,10)+'/'+s.slice(5,7):'';}
  function jj(j){return j===0?'<span class="badge or">aujourd’hui</span>':j<0?'<span class="badge or">retard '+(-j)+' j</span>':'<span class="badge'+(j<=7?' or':'')+'">J-'+j+'</span>';}
  function render(B){
    var el=document.getElementById('brief-racine'); if(!el)return;
    if(!B){el.innerHTML='<div class="vide">Pas encore de brief. Il arrive chaque matin quand la tâche planifiée « Assistant Cockpit » tourne (PC allumé).</div>';return;}
    var h='<p class="note" style="margin:0 0 10px">Brief du '+fr(B.date)+' généré à '+esc((B.genere||'').slice(11,16))+' · règles dans <code>Regles-assistant.md</code></p>';
    if(B.conseil)h+='<div class="carte-veille"><div class="dom">💬 Conseil</div>'+gras(B.conseil).replace(/\n/g,'<br>')+'</div>';
    h+='<div class="grille2">';
    h+='<div><h3 class="bh">✅ À faire <span class="chemin">'+B.todos.length+' retenues · '+B.perimees+' périmées à trier</span></h3>';
    h+=B.todos.length?'<ul class="liste">'+B.todos.map(function(x){return '<li>'+(x.d?'<span class="quand">'+fr(x.d)+'</span> '+jj(x.j)+' ':'')+gras(x.t)+'</li>';}).join('')+'</ul>':'<div class="vide">Rien d’urgent.</div>';
    h+='</div><div><h3 class="bh">🎒 À préparer pour la classe <span class="chemin">préavis '+B.regles['preavis-ecole']+' j</span></h3>';
    h+=B.ecole.length?'<ul class="liste">'+B.ecole.map(function(x){return '<li><span class="quand">'+fr(x.d)+'</span> '+jj(x.j)+' <strong>'+esc(x.t)+'</strong><br><span class="chemin">'+esc(x.idee)+'</span></li>';}).join('')+'</ul>':'<div class="vide">Rien dans la fenêtre.</div>';
    var ag=(B.agenda||[]).concat(B.perso||[]).sort(function(a,b){return a.j-b.j;});
    h+='<h3 class="bh">📅 Agenda</h3>'+(ag.length?'<ul class="liste">'+ag.map(function(x){return '<li><span class="quand">'+fr(x.d)+'</span> '+jj(x.j)+' '+esc(x.t)+'</li>';}).join('')+'</ul>':'<div class="vide">Agenda vide.</div>');
    h+='</div></div>';
    if(B.journal&&B.journal.length)h+='<p class="note" style="margin-top:10px">🕐 '+B.journal.map(function(x){return esc(x.d.slice(5))+' '+esc(x.t);}).join(' · ')+'</p>';
    el.innerHTML=h;
  }
  window.BriefUI={render:render};
  if(window.COCKPIT_BRIEF)render(window.COCKPIT_BRIEF);
})();
