(function(){
'use strict';
var U=window.TeacherTools,T=U.T;
function el(id){return U.byId(id)}
function val(id){return U.value(id)}
function esc(s){return U.escapeHtml(s)}
function selectedPurposes(){return U.checkedValues('purpose')}
function collect(){return {subject:val('a_subject'),grade:val('a_grade'),unit:val('a_unit'),periods:val('a_periods'),standard:val('a_standard'),format:val('a_format'),group:val('a_group'),constraints:val('a_constraints'),purposes:selectedPurposes(),method:val('a_method'),topic:val('a_topic'),choice:val('a_choice'),fixed:val('a_fixed'),feedback:val('a_feedback'),revision:val('a_revision'),aiPolicy:val('a_ai_policy'),aiAlt:val('a_ai_alt'),studentOwned:val('a_student_owned'),checks:Array.from(document.querySelectorAll('[name="taskCheck"]')).map(function(x){return {key:x.value,checked:x.checked};})}}
function restore(d){var ids={aiPolicy:'a_ai_policy',aiAlt:'a_ai_alt',studentOwned:'a_student_owned'};Object.keys(d||{}).forEach(function(k){var x=el(ids[k]||('a_'+k));if(x&&typeof d[k]!=='object')x.value=d[k]||''});document.querySelectorAll('[name="purpose"]').forEach(function(x){x.checked=(d.purposes||[]).includes(x.value)});document.querySelectorAll('[name="taskCheck"]').forEach(function(x){var f=(d.checks||[]).find(function(c){return c.key===x.value});x.checked=!!(f&&f.checked)});updateMethod();updateRisk()}
function render(){
 el('purposeChecks').innerHTML=(T.purposes||[]).map(function(p){return '<label class="checkitem"><input type="checkbox" name="purpose" value="'+esc(p)+'"><span>'+esc(p)+'</span></label>'}).join('');
 el('a_method').innerHTML=(T.methods||[]).map(function(m){return '<option value="'+esc(m.key)+'">'+esc(m.label)+'</option>'}).join('');
 el('taskChecks').innerHTML=(T.taskChecks||[]).map(function(c){return '<label class="checkitem"><input type="checkbox" name="taskCheck" value="'+esc(c.key)+'"><span>'+esc(c.label)+'</span></label>'}).join('');
 el('growthTable').innerHTML='<table><thead><tr><th>단계</th><th>과정 증거</th><th>활용</th></tr></thead><tbody>'+T.growthLevels.map(function(g){return '<tr><td><b>'+g.level+' · '+esc(g.label)+'</b></td><td>'+esc(g.evidence)+'</td><td>학생 자기점검·교사 피드백용</td></tr>'}).join('')+'</tbody></table>';
}
function updateMethod(){var m=T.methods.find(function(x){return x.key===val('a_method')})||T.methods[0];el('methodHint').innerHTML='<b>추천 방법:</b> '+esc(m.method)+'<br><b>확인 기준:</b> '+esc(m.check)+'<br><b>주의할 한계:</b> '+esc(m.limit)}
function updateRisk(){var all=Array.from(document.querySelectorAll('[name="taskCheck"]'));var miss=all.filter(function(x){return !x.checked});el('riskSummary').className='callout '+(miss.length?'warn':'good');el('riskSummary').innerHTML=miss.length?'<b>아직 확인하지 않은 항목 '+miss.length+'개</b><br>'+miss.map(function(x){return '· '+esc(x.parentElement.textContent.trim())}).join('<br>'):'<b>핵심 운영 위험을 모두 점검했습니다.</b> 체크가 실제 운영 가능성을 보증하는 것은 아니므로 최종 평가계획에서 다시 확인하세요.'}
function makePrompt(){var d=collect();if(!d.subject||!d.unit||!d.periods||!d.standard){U.toast('과목·단원·차시·성취기준을 입력하세요.');return ''}var m=T.methods.find(function(x){return x.key===d.method})||T.methods[0];var unchecked=T.taskChecks.filter(function(c){var f=d.checks.find(function(x){return x.key===c.key});return !(f&&f.checked)}).map(function(c){return c.label});return `# 역할
너는 고등학교 ${d.subject} 교사이자 교육과정-수업-평가-기록의 일체화를 설계하는 평가 전문가다.

# 목적
아래 성취기준과 수업 조건을 바탕으로, 학생이 단순 결과물을 제출하는 데 그치지 않고 질문을 구체화하고 적절한 방법을 사용하며 피드백을 반영해 수정하는 수행평가안을 설계하라.

# 기본 조건
- 과목: ${d.subject}
- 학년: ${d.grade||'미지정'}
- 단원·주제: ${d.unit}
- 성취기준: ${d.standard}
- 운영 차시: ${d.periods}차시
- 평가 방식: ${d.format}
- 운영 형태: ${d.group}
- 수업 환경·제약: ${d.constraints||'별도 입력 없음'}
- 평가 목적: ${(d.purposes||[]).join(', ')||'성취기준에 맞게 제안'}
- 대주제·문제 상황: ${d.topic||'성취기준에 맞게 제안'}

# 탐구 방법 조건
- 유형: ${m.label}
- 권장 방법: ${m.method}
- 확인 기준: ${m.check}
- 주의할 한계: ${m.limit}

# 학생 선택과 교사 조건
- 학생이 선택할 부분: ${d.choice||'대상·자료·역할 중 최소 1개를 선택하도록 설계'}
- 교사가 공통으로 제공할 조건: ${d.fixed||'핵심 개념·시간·윤리·안전 기준을 제안'}
- 중간 피드백 장면: ${d.feedback||'수행 중 최소 1회의 피드백 장면을 설계'}
- 수정 후 남길 증거: ${d.revision||'수정 전후 질문·방법·주장 중 하나를 비교 기록'}

# AI 활용 조건
- 사용 정책: ${d.aiPolicy}
- AI 미사용 학생 대안: ${d.aiAlt||'동등한 학습 기회를 보장하는 대안을 제안'}
- 학생이 직접 해야 할 일: ${d.studentOwned||'원자료 확인, 핵심 수행, 결과 해석, 수정 이유 설명'}

# 성장과정 언어
다음 단계는 교과 성취도 점수 자체가 아니라 과정 관찰과 피드백을 위한 보조척도로만 사용하라.
${T.growthLevels.map(function(g){return '- '+g.level+' '+g.label+': '+g.evidence}).join('\n')}

# 현재 추가 검토가 필요한 운영 위험
${unchecked.length?unchecked.map(function(x){return '- '+x}).join('\n'):'- 핵심 위험 항목을 사전 점검함. 그래도 실제 학교 평가계획과 공정성을 재확인할 것.'}

# 반드시 포함할 산출물
1. 수행평가명과 설계 의도
2. 성취기준-평가요소-학생 행동의 연결표
3. 학생 안내문
4. ${d.periods}차시 운영안: 차시별 학생 활동, 교사 지원, 관찰 증거
5. 학생 선택권과 공통 조건
6. 중간 피드백 및 수정 절차
7. 최종 제출물과 과정 증거
8. 성취기준 기반 루브릭 3~4개 요소: 추상적인 '우수·보통·미흡' 대신 관찰 가능한 행동으로 기술
9. 성장과정 보조척도 활용 방법: 점수화하지 말고 자기점검·피드백 문장으로 제시
10. AI 사용 기준과 AI 미사용 학생 대안
11. 교사 관찰 포인트와 세특 기록에 활용 가능한 실제 장면
12. 과제 과대·가정환경 격차·발표 편향·채점 신뢰도 위험과 수정안

# 제한
- 성취기준에 없는 내용을 평가의 중심으로 만들지 말 것.
- 가정 과제와 사교육 도움에 따라 성과가 갈리는 설계를 피할 것.
- 화려한 결과물보다 수업 중 학습 과정과 수정 증거를 우선할 것.
- 모든 학생에게 4단계 확장을 요구하지 말 것.
- 실제 학교 평가계획과 성적 처리 규정을 대신한다고 표현하지 말 것.`}
function bind(){el('a_method').addEventListener('change',updateMethod);document.querySelectorAll('[name="taskCheck"]').forEach(function(x){x.addEventListener('change',updateRisk)});el('generateBtn').addEventListener('click',function(){var p=makePrompt();if(p)el('promptOutput').textContent=p});el('copyBtn').addEventListener('click',function(){U.copyText(el('promptOutput').textContent).then(function(){U.toast('프롬프트를 복사했습니다.');})});el('saveBtn').addEventListener('click',function(){U.downloadJson('수행평가_설계_'+(val('a_subject')||'과목')+'.json',{tool:'assessment',version:T.version,savedAt:new Date().toISOString(),data:collect()})});el('loadFile').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;U.readJsonFile(f).then(function(j){restore(j.data||j);U.toast('설계 내용을 불러왔습니다.');}).catch(function(){U.toast('JSON 파일을 읽지 못했습니다.');});e.target.value='';})}
render();updateMethod();updateRisk();bind();
})();
