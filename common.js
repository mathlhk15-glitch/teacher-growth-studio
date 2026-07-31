(function (global) {
  'use strict';
  var T = global.TEACHER_STANDARDS || {};

  function byId(id){ return document.getElementById(id); }
  function value(id){ var el=byId(id); return el ? String(el.value || '').trim() : ''; }
  function checkedValues(name){ return Array.from(document.querySelectorAll('[name="'+name+'"]:checked')).map(function(el){return el.value;}); }
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function copyText(text){
    if(!text) return Promise.reject(new Error('복사할 내용이 없습니다.'));
    if(navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy'); document.body.removeChild(ta); return Promise.resolve();}catch(e){document.body.removeChild(ta); return Promise.reject(e);}
  }
  function toast(msg){
    var old=byId('app-toast'); if(old) old.remove();
    var el=document.createElement('div'); el.id='app-toast'; el.textContent=msg; el.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#0f1f3d;color:#fff;padding:9px 16px;border-radius:999px;font-size:12px;font-weight:800;z-index:9999;box-shadow:0 8px 24px rgba(0,0,0,.2)';
    document.body.appendChild(el); setTimeout(function(){el.remove();},1800);
  }
  function byteLength(text){ return new TextEncoder().encode(String(text||'')).length; }
  function normalize(text){ return String(text||'').replace(/\s+/g,' ').trim(); }
  function unique(arr){ return Array.from(new Set(arr)); }
  function normalizeToken(token){
    var t=String(token||'').toLowerCase();
    var suffixes=['하였으며','하였고','하였다','했으며','했지만','하면서','하여','해서','하며','하고','으로','에서','에게','까지','부터','처럼','보다','함','임','을','를','이','가','은','는','의','에','로','와','과','도','만'];
    var changed=true;
    while(changed){
      changed=false;
      for(var i=0;i<suffixes.length;i++){
        var suf=suffixes[i];
        if(t.length-suf.length>=2 && t.endsWith(suf)){ t=t.slice(0,-suf.length); changed=true; break; }
      }
    }
    return t;
  }
  function tokenize(text){ return unique((String(text||'').match(/[가-힣A-Za-z0-9]{2,}/g)||[]).map(normalizeToken).filter(function(x){return x.length>=2;})); }
  function addedTokens(original,result){ var base=new Set(tokenize(original)); return tokenize(result).filter(function(t){return !base.has(t);}); }
  function downloadJson(filename,obj){
    var blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
  }
  function readJsonFile(file){ return new Promise(function(resolve,reject){var r=new FileReader();r.onload=function(){try{resolve(JSON.parse(r.result));}catch(e){reject(e);}};r.onerror=reject;r.readAsText(file);}); }
  global.TeacherTools={T:T,byId:byId,value:value,checkedValues:checkedValues,escapeHtml:escapeHtml,copyText:copyText,toast:toast,byteLength:byteLength,normalize:normalize,tokenize:tokenize,addedTokens:addedTokens,downloadJson:downloadJson,readJsonFile:readJsonFile};
})(window);
