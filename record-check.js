(function(){
'use strict';
var U=window.TeacherTools,T=U.T;
function el(id){return U.byId(id)}
function val(id){return U.value(id)}
function esc(s){return U.escapeHtml(s)}
function containsAny(text,words){var n=String(text||'').toLowerCase();return words.some(function(w){return n.indexOf(String(w).toLowerCase())>-1})}
function testAny(text,patterns){return (patterns||[]).some(function(pattern){var re=new RegExp(pattern.source,pattern.flags);return re.test(text)})}
function scanPii(){var text=(val('r_original')+' '+val('r_facts')).trim();var hits=[];(T.piiPatterns||[]).forEach(function(p){var re=new RegExp(p.regex.source,p.regex.flags);var found=text.match(re)||[];Array.from(new Set(found)).slice(0,5).forEach(function(x){hits.push({label:p.label,value:x})})});return hits}
function renderPii(){var hits=scanPii(),box=el('piiWarning');if(!hits.length){box.classList.add('hidden');box.innerHTML='';return hits}box.classList.remove('hidden');box.innerHTML='<b>개인정보로 추정되는 표현이 있어 AI용 프롬프트 생성을 차단합니다.</b><br>'+hits.map(function(h){return '· '+esc(h.label)+': <mark>'+esc(h.value)+'</mark>'}).join('<br>')+'<br><br>해당 표현을 삭제하거나 익명 기호(예: 학생 A)로 바꾼 뒤 다시 생성하세요.';return hits}
function evidenceStatus(text,e){if(!containsAny(text,e.keywords))return 'missing';return testAny(text,e.strong)?'strong':'mention'}
function diagnose(){var original=val('r_original');var facts=val('r_facts');var all=(original+' '+facts).trim();if(!all){U.toast('교사 초안 또는 관찰 메모를 입력하세요.');return []}renderPii();var result=T.recordEvidence.map(function(e){var status=evidenceStatus(all,e);return {key:e.key,label:e.label,status:status,hit:status==='strong'}});var labels={strong:'구체적인 관찰 근거 후보가 확인됨',mention:'관련 단어만 확인됨 · 실제 관찰 근거인지 확인 필요',missing:'관련 근거를 찾지 못함'};el('diagnosis').innerHTML=result.map(function(r){var cls=r.status==='strong'?'ok':r.status==='mention'?'mention':'miss';return '<div class="status '+cls+'"><b>'+esc(r.label)+'</b><span>'+labels[r.status]+'</span></div>'}).join('');var weak=result.filter(function(r){return r.status==='mention'}).map(function(r){return r.label});var missing=result.filter(function(r){return r.status==='missing'}).map(function(r){return r.label});var note='';if(missing.length)note+='<b>확인되지 않은 항목을 AI가 임의로 채우게 하지 마세요.</b><br>'+missing.map(function(x){return '· '+esc(x)}).join('<br>');if(weak.length)note+=(note?'<br><br>':'')+'<b>관련 단어는 있으나 구체적인 관찰 장면인지 교사가 확인해야 합니다.</b><br>'+weak.map(function(x){return '· '+esc(x)}).join('<br>');if(!missing.length&&!weak.length)note='<b>구체적인 근거 후보가 비교적 고르게 확인됩니다.</b> 그래도 문장 속 모든 판단이 실제 관찰 사실과 일치하는지 다시 확인하세요.';el('diagnosisNote').className='callout '+(missing.length?'warn':weak.length?'':'good');el('diagnosisNote').innerHTML=note;el('diagnosisWrap').classList.remove('hidden');return result}
function makePrompt(){var original=val('r_original'),facts=val('r_facts');if(!original&&!facts){U.toast('교사 초안 또는 관찰 메모를 입력하세요.');return ''}var pii=renderPii();if(pii.length){el('recordPrompt').textContent='개인정보로 추정되는 표현을 삭제하거나 익명화한 뒤 다시 생성하세요.';U.toast('개인정보 추정 표현을 먼저 제거하세요.');return ''}var d=diagnose();var missing=d.filter(function(x){return x.status!=='strong'}).map(function(x){return x.label+(x.status==='mention'?'(관련 단어만 확인)':'')});var min=Number(val('r_min')||1300),max=Number(val('r_max')||1500);return `# 역할
너는 고등학교 ${val('r_subject')||'해당 과목'} 교사이며, 학생부 기록에서 실제 관찰 근거와 교과 학습 과정을 우선한다.

# 작업
아래 교사 초안과 사실 자료를 검토한 뒤, 사실을 유지한 ${val('r_type')||'교과 세특'} 문장으로 리라이팅하라.

# 교사 초안 또는 관찰 메모
${original||'별도 초안 없음'}

# 반드시 유지해야 할 사실
${facts||'별도 입력 없음'}

# 현재 근거 진단에서 추가 확인이 필요한 항목
${missing.length?missing.map(function(x){return '- '+x}).join('\n'):'- 핵심 항목이 대체로 확인됨'}

# 작성 원칙
1. 원문과 사실 자료에 없는 활동·수치·역할·감정·성과를 새로 만들지 말 것.
2. 누락된 항목은 그럴듯하게 보충하지 말고, 실제 근거가 없으면 최종 문장에서 제외할 것.
3. 질문 또는 계기 → 사용한 자료·방법 → 오류·피드백·수정 → 배움과 확장의 흐름을 우선하되, 자료에 존재하는 장면만 사용할 것.
4. 단순 활동 나열보다 학생이 직접 한 행동과 사고의 변화를 구체적으로 연결할 것.
5. '열정적임, 매우 우수함, 탁월함' 같은 근거 없는 미화 표현을 피할 것.
6. 교사가 관찰하기 어려운 내면·감정을 추정하지 말 것.
7. 관찰자 어조와 '~함/~임' 종결을 사용하고 '학생은'을 반복하지 말 것.
8. 목표 분량은 UTF-8 기준 ${min}~${max}바이트이나, 정확한 바이트 계산은 외부 HTML 검수기로 확인할 것이므로 임의의 정확한 바이트 수를 단정하지 말 것.

# 출력 순서
1. 원문의 강점과 실제 근거
2. 근거가 약하거나 추정 위험이 있는 표현
3. 누락 항목 중 실제 관찰 없이는 추가하면 안 되는 내용
4. 최종 리라이팅 1안
5. 더 간결한 대안 1안
6. 원문에 없던 사실을 추가하지 않았는지 자체 점검

# 금지
- 빈칸을 일반적인 모범 학생 서사로 채우기
- 대학 평가를 빌미로 과장하기
- 활동 수준을 0~4 점수처럼 서열화하기
- 정확히 계산하지 않은 바이트 수를 확정적으로 말하기`}
function updateBytes(){var n=U.byteLength(val('r_result')),min=Number(val('r_min')||1300),max=Number(val('r_max')||1500);el('byteNumber').textContent=n;var pct=Math.min(100,n/(max||1)*100);el('byteFill').style.width=pct+'%';var label='입력 대기',color='var(--teal)';if(n){if(n<min){label='최소 기준보다 '+(min-n)+'바이트 부족';color='var(--orange)'}else if(n>max){label='최대 기준보다 '+(n-max)+'바이트 초과';color='var(--red)'}else{label='목표 범위 안';color='var(--green)'}}el('byteLabel').textContent=label;el('byteFill').style.background=color}
function review(){var result=val('r_result');if(!result){U.toast('AI 결과를 붙여넣으세요.');return}updateBytes();var issues=[];T.forbiddenPatterns.forEach(function(p){var re=new RegExp(p.regex.source,p.regex.flags);var m=result.match(re);if(m)issues.push({label:p.label,detail:p.message+' 발견: '+Array.from(new Set(m)).slice(0,4).join(', ')})});T.inferenceWords.forEach(function(w){if(result.indexOf(w)>-1)issues.push({label:'추정 가능 표현',detail:'"'+w+'"가 실제 관찰 근거인지 확인하세요.'})});var original=(val('r_original')+' '+val('r_facts')).trim();var added=U.addedTokens(original,result).filter(function(t){return t.length>=2}).slice(0,60);var numbers=(result.match(/\d+(?:\.\d+)?%?|\d{4}년|\d+회|\d+명/g)||[]).filter(function(x){return original.indexOf(x)<0});el('issues').innerHTML=issues.length?'<ul class="issue-list">'+issues.map(function(i){return '<li><b>'+esc(i.label)+':</b> '+esc(i.detail)+'</li>'}).join('')+'</ul>':'<div class="callout good">정규식으로 탐지되는 주요 금지·추정 표현이 없습니다. 사실성까지 보증하는 것은 아니므로 원자료와 대조하세요.</div>';var addHtml='';if(numbers.length)addHtml+='<div class="callout danger"><b>원문에 없던 수치 후보</b><br>'+numbers.map(esc).join(', ')+'</div>';addHtml+='<p class="small">아래 단어는 원문·유지 사실에 없고 결과에 새로 등장한 후보입니다. 조사·활용어까지 포함될 수 있으므로 사람이 판단하세요.</p><div class="chips">'+(added.length?added.map(function(x){return '<span class="chip">'+esc(x)+'</span>'}).join(''):'<span class="small">뚜렷한 추가 단어 후보 없음</span>')+'</div>';el('added').innerHTML=addHtml;el('reviewWrap').classList.remove('hidden')}
function ngrams(text,n){var words=U.normalize(text).split(' ').filter(function(x){return x.length>0});var out=[];for(var i=0;i<=words.length-n;i++)out.push(words.slice(i,i+n).join(' '));return out}
function duplicates(){var docs=val('r_batch').split(/\n\s*\n/).map(U.normalize).filter(Boolean);if(docs.length<2){U.toast('두 명 이상의 문장을 빈 줄로 구분해 입력하세요.');return}var map=new Map();docs.forEach(function(doc,idx){Array.from(new Set(ngrams(doc,4))).forEach(function(g){if(g.length<12)return;var arr=map.get(g)||[];arr.push(idx+1);map.set(g,arr)})});var found=Array.from(map.entries()).filter(function(x){return x[1].length>=2}).sort(function(a,b){return b[1].length-a[1].length||b[0].length-a[0].length}).slice(0,40);el('duplicates').classList.remove('hidden');el('duplicates').innerHTML=found.length?'<b>반복 표현 후보 '+found.length+'개</b><br>'+found.map(function(x){return '· '+esc(x[0])+' <span class="small">('+x[1].join(', ')+'번)</span>'}).join('<br>'):'<b>4어절 이상 반복되는 표현을 찾지 못했습니다.</b>'}
function clearAll(){['r_original','r_facts','r_result','r_batch'].forEach(function(id){el(id).value=''});el('recordPrompt').textContent='먼저 교사 초안이나 관찰 메모를 입력하세요.';['diagnosisWrap','reviewWrap','duplicates','piiWarning'].forEach(function(id){el(id).classList.add('hidden')});el('piiWarning').innerHTML='';updateBytes();U.toast('현재 화면의 입력을 지웠습니다.')}
['r_original','r_facts'].forEach(function(id){el(id).addEventListener('input',renderPii)});el('diagnoseBtn').addEventListener('click',diagnose);el('promptBtn').addEventListener('click',function(){var p=makePrompt();if(p)el('recordPrompt').textContent=p});el('copyPromptBtn').addEventListener('click',function(){U.copyText(el('recordPrompt').textContent).then(function(){U.toast('프롬프트를 복사했습니다.')})});el('r_result').addEventListener('input',updateBytes);el('r_min').addEventListener('input',updateBytes);el('r_max').addEventListener('input',updateBytes);el('reviewBtn').addEventListener('click',review);el('copyResultBtn').addEventListener('click',function(){U.copyText(val('r_result')).then(function(){U.toast('검수 결과 문장을 복사했습니다.')})});el('clearBtn').addEventListener('click',clearAll);el('duplicateBtn').addEventListener('click',duplicates);updateBytes();
})();
