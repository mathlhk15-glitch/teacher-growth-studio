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

# 학교 기본형 기준(진짜 탐구 수행평가 v3.0)
- 과제 문장틀: "[교과 개념·기능]을 사용해 [문제 해결·분석·표현 활동]을 수행하고, [근거]를 바탕으로 결과를 설명·판단하시오. [새 조건·반례·피드백]을 검토해 판단을 유지·일부 수정·변경·보류한 이유를 밝히시오." 이 틀을 성취기준에 맞게 변형해 과제 문구를 작성할 것.
- 운영 흐름: 설계(질문·방법·선택 이유) → 수행·분석·점검(직접 수행, 개념 적용, 새 자료·조건·피드백 검토) → 판단·성찰(판단 이유·한계·다음 질문). 핵심 증거는 A 계획 카드·B 수행·분석 기록·C 최종 판단의 3묶음이며 종이 세 장을 강제하지 않음.
- 배점 원칙: 참고 예시는 문제 이해·접근 설계 10, 근거 선택·활용 20, 교과 개념 분석·수행 35, 판단의 타당성·점검 25, 개인 설명·성찰 10. 교과에 맞게 조정하되 분석+판단 합계는 55~65점을 권장. 분량·디자인·사진 수·자료 개수·수정 횟수는 핵심 배점으로 삼지 말 것(표현 자체가 성취기준이면 예외).
- 판단: 유지(처음 판단 그대로)·일부 수정(결론은 같고 조건·범위를 고침)·변경(결론 자체를 바꿈)·보류(정보 부족으로 결론을 미루고 무엇이 더 필요한지 밝힘) 모두 근거가 타당하면 높은 수준으로 인정. 보류는 부족한 정보와 이유를 밝혀야 함. 생각이 바뀌어야 높은 점수를 받는 구조로 만들지 말 것.
- 공통 의무가 아닌 것: 모든 과목 비교 실험, 직접 측정한 숫자만 근거로 인정, 결론 변경이나 추가 실험 필수, 전 교과 동일 배점, 모든 수행평가의 탐구형 전환.
- AI 신호등 판단 기준: 초록(허용)=AI가 도와도 평가하려는 능력은 학생이 직접 보여 주는 준비·탐색 도움(질문 아이디어·개념 설명·자료·출처 탐색·자료 정리 방법 안내) / 노랑(과제별 결정)=그 과제가 평가하려는 능력을 AI가 대신할 수 있으면 금지, 아니면 허용(결과 해석·초안 수정·코드·표·그래프 작성; 예: 그래프 작성은 수학에서 금지, 사회에서 허용) / 빨강(금지)=하지 않은 일을 한 것처럼 보이게 하거나 남이 대신한 것(하지 않은 실험 데이터·없는 출처·사전에 금지한 대필·대리 수행). AI 판별기만으로 확정하지 말고 수업 중 관찰·중간 기록·개인 설명으로 확인하며, AI 미사용 학생에게 동등한 자료·질문 카드를 제공할 것.
- 점검 자료: 다른 자료·반례·조건 바꾸기·피드백 카드 중 하나를 교사가 준비. 개인 설명(구술)은 전원 1문항 또는 서면·관찰 불일치 시 실시하고, 말하기가 평가목표가 아니면 유창함으로 판단하지 않음. 모둠은 역할을 사전 기록하고 해석·판단은 개인별 작성, 동료평가는 참고만.
- 채점: 같은 오류를 여러 요소에서 반복 감점하지 않음. 향상 폭만으로 점수를 주지 않음. 빠진 부분은 그 평가요소에서만 낮은 수준으로 채점, 증거 부족은 확인된 성취만 인정, 결시·미제출·허위·표절은 학교 규정에 따름.

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
8. 성취기준 기반 루브릭 3~5개 요소와 배점: 추상적인 '우수·보통·미흡' 대신 관찰 가능한 행동으로 기술하고, 분석과 판단 요소의 역할이 겹치지 않게 구분(분석=자료 해석과 개념 적용의 정확성, 판단=근거에서 결론이 나오는지와 점검 뒤 정당화)
9. 성장과정 보조척도 활용 방법: 점수화하지 말고 자기점검·피드백 문장으로 제시
10. AI 사용 기준과 AI 미사용 학생 대안
11. 교사 관찰 포인트와 세특 기록에 활용 가능한 실제 장면
12. 과제 과대·가정환경 격차·발표 편향·채점 신뢰도 위험과 수정안

# 제한
- 성취기준에 없는 내용을 평가의 중심으로 만들지 말 것.
- 가정 과제와 사교육 도움에 따라 성과가 갈리는 설계를 피할 것.
- 화려한 결과물보다 수업 중 학습 과정과 수정 증거를 우선할 것.
- 모든 학생에게 4단계 확장을 요구하지 말 것.
- 실제 학교 평가계획과 성적 처리 규정을 대신한다고 표현하지 말 것.
- 수업 밖 가정 과제형 수행평가로 설계하지 말 것.
- 학생 자기평가서를 세특 문장으로 그대로 옮기도록 안내하지 말 것.`}
function bind(){el('a_method').addEventListener('change',updateMethod);document.querySelectorAll('[name="taskCheck"]').forEach(function(x){x.addEventListener('change',updateRisk)});el('generateBtn').addEventListener('click',function(){var p=makePrompt();if(p)el('promptOutput').textContent=p});el('copyBtn').addEventListener('click',function(){U.copyText(el('promptOutput').textContent).then(function(){U.toast('프롬프트를 복사했습니다.');})});el('saveBtn').addEventListener('click',function(){U.downloadJson('수행평가_설계_'+(val('a_subject')||'과목')+'.json',{tool:'assessment',version:T.version,savedAt:new Date().toISOString(),data:collect()})});el('loadFile').addEventListener('change',function(e){var f=e.target.files[0];if(!f)return;U.readJsonFile(f).then(function(j){restore(j.data||j);U.toast('설계 내용을 불러왔습니다.');}).catch(function(){U.toast('JSON 파일을 읽지 못했습니다.');});e.target.value='';})}
render();updateMethod();updateRisk();bind();
})();
