import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
// ponytail: one Node process owns this file. Use a transactional database before adding replicas.
export function openBudget(path,limit=100){
  if(!Number.isFinite(limit)||limit<=0||limit>100)throw Error('invalid_budget');
  let ledger;try{ledger=JSON.parse(readFileSync(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error('budget_unreadable');ledger={version:1,spent:0,held:{}};}
  if(ledger.version!==1||!Number.isFinite(ledger.spent)||ledger.spent<0||!ledger.held||Object.values(ledger.held).some(v=>!Number.isFinite(v)||v<0))throw Error('budget_unreadable');
  const total=()=>ledger.spent+Object.values(ledger.held).reduce((a,b)=>a+b,0);
  function save(){mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path+'.tmp',JSON.stringify(ledger),{mode:0o600});renameSync(path+'.tmp',path);}
  return {
    summary:()=>({limitCny:limit,settledCny:ledger.spent,reservedCny:total()-ledger.spent,remainingCny:Math.max(0,limit-total())}),
    reserve(id,cost){if(!Number.isFinite(cost)||cost<=0||id in ledger.held)throw Error('invalid_reservation');if(total()+cost>limit)throw Error('budget_exhausted');ledger.held[id]=cost;save();},
    settle(id,cost){if(!(id in ledger.held)||!Number.isFinite(cost)||cost<0)throw Error('invalid_settlement');ledger.spent+=cost;delete ledger.held[id];save();}
    // Unknown provider outcomes deliberately keep their reservation across restarts.
  };
}
export const costCny=(input,output,price)=>(input*price.input+output*price.output)/1e6*10;
// 10 CNY/USD is a conservative accounting envelope, not a claimed exchange rate.
