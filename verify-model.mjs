import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
const source=process.argv[2]||(['data/decisions-v2.jsonl','evidence/decisions-v2.jsonl'].find(existsSync));
if(!source)throw Error('Run a real play session first; no recorded perception exists.');
const rows=readFileSync(source,'utf8').trim().split('\n').map(JSON.parse);
const eligible=rows.filter(r=>r.status==='completed'&&r.request?.residentId==='sparrow-b'&&r.request.memory.some(m=>m.otherId));
const score=r=>r.request.memory.reduce((n,m)=>n+(['disturbed','target_moved'].includes(m.type)?4:m.type==='shared_space'?3:1),0)+r.request.neighbors.length;
const sample=eligible.sort((a,b)=>score(b)-score(a))[0];if(!sample)throw Error('No real neighbor-memory sample was recorded.');
const base='http://127.0.0.1:5321',statusResponse=await fetch(base+'/api/status'),status=await statusResponse.json();
if(!status.configured)throw Error('Configure the selected provider first.');
const cookie=statusResponse.headers.get('set-cookie')?.split(';')[0],results=[];
for(let repeat=0;repeat<3;repeat++)for(const condition of repeat%2?['empty','actual']:['actual','empty']){
  const request=structuredClone(sample.request);request.memory=request.memory.map(m=>({...m,residentId:request.residentId}));if(condition==='empty')request.memory=[];
  for(let attempt=0;attempt<40;attempt++){
    const r=await fetch(base+'/api/decide',{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(request)}),data=await r.json();
    if(r.status===429){await new Promise(resolve=>setTimeout(resolve,Math.min(60000,data.retryAfterMs||1500)));continue;}
    if(!r.ok)throw Error(data.error);results.push({repeat,condition,actions:data.actions,source:data.source,model:data.servedModel,durationMs:data.durationMs});console.log(JSON.stringify(results.at(-1)));break;
  }
}
if(results.length!==6)throw Error('Comparison incomplete; retry after other play sessions pause.');
const counts={actual:{},empty:{}};for(const r of results){const k=r.actions.join(' → ');counts[r.condition][k]=(counts[r.condition][k]||0)+1;}
const report={date:new Date().toISOString(),provider:status.provider,model:status.model,sourceDecisionId:sample.id,request:sample.request,method:'The exact same recorded perception and candidates, three repeats with actual memory and three with an empty array, alternating order. Returned plans were not executed and never become resident memories. This small observational comparison is not a statistical proof of a relationship.',results,counts};
mkdirSync('evidence/3d',{recursive:true});writeFileSync('evidence/3d/memory-comparison.json',JSON.stringify(report,null,2));console.log(JSON.stringify(counts));
