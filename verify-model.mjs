import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
// Fixed recorded observations; both versions use identical cases and never execute these plans.
const casesPath=process.argv[2]||'evidence/optimization-1/cases.json',out=process.argv[3]||'evidence/optimization-1/model-comparison.json';
const cases=JSON.parse(readFileSync(casesPath,'utf8')),base='http://127.0.0.1:5321';
const sr=await fetch(base+'/api/status'),status=await sr.json();if(!status.configured)throw Error('Selected provider is not configured');
const cookie=sr.headers.get('set-cookie')?.split(';')[0],results=[];mkdirSync(dirname(out),{recursive:true});
const report={date:new Date().toISOString(),provider:status.provider,model:status.model,cases,method:'Two fixed observations from real play. Three repeats each: actual history; empty history; empty history with neighbors hidden. Candidate actions stay identical. Order rotates. Plans are not executed or remembered. Cached replay timings are not live latency.',results};
for(let round=0;round<3;round++)for(const item of cases){
  const conditions=['actual','empty-memory','unobserved-neighbors'];conditions.push(...conditions.splice(0,round));
  for(const condition of conditions){
    const request=structuredClone(item.request);request.memory=request.memory.map(m=>({...m,residentId:request.residentId}));if(condition!=='actual')request.memory=[];if(condition==='unobserved-neighbors')request.neighbors=[];
    let result;
    for(let attempt=0;attempt<50;attempt++){
      const r=await fetch(base+'/api/decide',{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(request)}),data=await r.json();
      if(r.status===429){await new Promise(resolve=>setTimeout(resolve,Math.min(60000,data.retryAfterMs||1500)));continue;}
      if(!r.ok)throw Error(data.error);result={case:item.name,round,condition,actions:data.actions,source:data.source,model:data.servedModel,durationMs:data.durationMs,usage:data.usage};break;
    }
    if(!result)throw Error('Rate limit persisted; pause other play sessions before rerunning');results.push(result);writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(result));
  }
}
console.log(`Completed ${results.length} calls; saved ${out}`);
