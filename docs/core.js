(function (root) {
  'use strict';
  const parts = date => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' }).formatToParts(new Date(date)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
  function dayKey(date) { const p=parts(date);return `${p.year}-${p.month}-${p.day}`; }
  function format(date, short=false) {if(!validDate(date))return '—';const p=parts(date);return short?`${p.hour}:${p.minute}`:`${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;}
  const validDate = v => v!=null && v!=='' && Number.isFinite(new Date(v).getTime());
  const number = (v,max=Infinity) => typeof v==='number' && Number.isFinite(v) && v>=0 && v<=max ? v : null;
  function solarFor(date,config,sunCalc) {
    const key=dayKey(date), supplied=config.solarTimes[key];
    if(supplied && validDate(supplied.sunrise)&&validDate(supplied.sunset) && dayKey(supplied.sunrise)===key && dayKey(supplied.sunset)===key && new Date(supplied.sunset)>new Date(supplied.sunrise))return {sunrise:new Date(supplied.sunrise),sunset:new Date(supplied.sunset)};
    return sunCalc.getTimes(new Date(`${key}T12:00:00+09:00`),config.location.latitude,config.location.longitude);
  }
  function getSolar(now,config,sunCalc) {const today=solarFor(now,config,sunCalc);const next=new Date(now)<today.sunrise?today.sunrise:solarFor(new Date(+new Date(now)+86400000),config,sunCalc).sunrise;return {...today,nextSunrise:next,isDay:+new Date(now)>=+today.sunrise&&+new Date(now)<+today.sunset};}
  function derive(data,now,config) {
    const today=dayKey(now), stamp=data?.measuredAt;
    const timestampValid=validDate(stamp)&&+new Date(stamp)<=+new Date(now)+30000;
    const sameDay=timestampValid&&dayKey(stamp)===today&&data?.energyDate===today;
    const stale=timestampValid&&+new Date(now)-+new Date(stamp)>config.staleAfterMs;
    const heartbeatValid=validDate(data?.lastCheckedAt)&&+new Date(data.lastCheckedAt)<=+new Date(now)+30000;
    const connected=data?.connected===true&&heartbeatValid&&+new Date(now)-+new Date(data.lastCheckedAt)<=config.heartbeatTimeoutMs;
    const capacity=number(data?.capacityKw)||config.capacityKw;
    const live=sameDay&&!stale&&connected;
    const series=sameDay&&Array.isArray(data?.trend)?data.trend.filter(p=>validDate(p.at)&&dayKey(p.at)===today&&new Date(p.at)<=new Date(stamp)&&number(p.kw,capacity)!==null).sort((a,b)=>new Date(a.at)-new Date(b.at)):[];
    const todayEnergy=sameDay?number(data?.todayEnergyKwh):null;
    const currentPower=live?number(data?.currentPowerKw,capacity):null;
    let status='데이터 없음', description='계측 데이터 수신을<br>기다리고 있어요.';
    if(timestampValid&&(!connected||stale)){status=!connected?'연결 끊김':'갱신 지연';description='새로운 계측 정보를<br>기다리고 있어요.';}
    else if(currentPower!==null){status=currentPower>0?'좋음':'대기 중';description=currentPower>0?'햇빛이 좋아<br>발전이 활발해요.':'다음 발전을<br>기다리고 있어요.';}
    return {timestampValid,sameDay,stale,connected,live,status,description,capacity,series,todayEnergy,currentPower,totalEnergy:timestampValid?number(data?.totalEnergyKwh):null,carbonReduction:timestampValid?number(data?.carbonReductionTons):null,irradiance:live?number(data?.irradianceWm2):null,temperature:live&&typeof data?.temperatureC==='number'&&Number.isFinite(data.temperatureC)&&data.temperatureC>=-60&&data.temperatureC<=100?data.temperatureC:null};
  }
  const api={parts,dayKey,format,validDate,number,getSolar,derive}; root.KioskCore=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
