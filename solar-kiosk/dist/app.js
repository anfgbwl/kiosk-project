(function () {
 'use strict';
 const C=window.KioskCore,config=window.KIOSK_CONFIG,params=new URLSearchParams(location.search),$=id=>document.getElementById(id);
 const demo=params.get('demo')==='1'||config.dataMode==='demo';
 let forcedMode=['day','night'].includes(params.get('mode'))?params.get('mode'):null;
 let data=null, lastDemo=0, lastGraph='';
 const fmt=(v,d=1)=>v===null||v===undefined?'—':new Intl.NumberFormat('ko-KR',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
 function scale(){ $('kiosk').style.setProperty('--scale',Math.min(innerWidth/1080,innerHeight/1920)); }
 addEventListener('resize',scale);scale();
 function bind(key,value){document.querySelectorAll(`[data-bind="${key}"]`).forEach(el=>{el.textContent=value;});}
 function chart(state,solar){
   const signature=JSON.stringify([state.series,state.capacity,C.dayKey(solar.sunrise)]);if(signature===lastGraph)return;lastGraph=signature;
   const width=858,left=64,top=40,bottom=234,height=bottom-top;
   const midnight=new Date(C.dayKey(solar.sunrise)+'T00:00:00+09:00').getTime();
   const startHour=Math.floor((+solar.sunrise-midnight)/3600000),endHour=Math.ceil((+solar.sunset-midnight)/3600000);
   const start=midnight+startHour*3600000,end=midnight+endHour*3600000,max=Math.max(80,Math.ceil(Math.max(0,...state.series.map(p=>p.kw))/20)*20);
   let markup='<defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#6ceca8" stop-opacity=".36"/><stop offset="1" stop-color="#43b37f" stop-opacity=".09"/></linearGradient></defs><text x="0" y="17" fill="#dbe3eb" font-size="18">발전출력 (kW)</text>';
   for(let i=0;i<=4;i++){const y=bottom-i*height/4;markup+=`<line x1="${left}" x2="${left+width}" y1="${y}" y2="${y}" stroke="#72909e" stroke-opacity=".45" stroke-dasharray="2 4"/><text x="42" y="${y+6}" fill="#dbe3eb" text-anchor="end" font-size="18">${max*i/4}</text>`;}
   markup+=`<path d="M${left} ${top}V${bottom}H${left+width}" fill="none" stroke="#8a9eaa" stroke-width="1"/>`;
   for(let h=startHour;h<=endHour;h++){const x=left+width*(h-startHour)/(endHour-startHour);markup+=`<line x1="${x}" x2="${x}" y1="${bottom}" y2="${bottom+8}" stroke="#8a9eaa"/><text x="${x}" y="${bottom+34}" text-anchor="middle" fill="#dbe3eb" font-size="17">${String(h).padStart(2,'0')}:00</text>`;}
   if(state.series.length){const pts=state.series.map(p=>[left+width*(new Date(p.at)-start)/(end-start),bottom-p.kw/max*height]);const path=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');markup+=`<path d="${path} L${pts.at(-1)[0]},${bottom} L${pts[0][0]},${bottom} Z" fill="url(#area)"/><path d="${path}" fill="none" stroke="#8af5ba" stroke-width="3" stroke-linejoin="round"/>`;const last=pts.at(-1);markup+=`<circle cx="${last[0]}" cy="${last[1]}" r="6" fill="#91fbd0"/>`;}
   $('power-chart').innerHTML=markup;$('chart-empty').hidden=state.series.length>0;
 }
 function render(now=new Date()){
   const solar=C.getSolar(now,config,window.SunCalc);
   if(demo&&(+now-lastDemo>=60000||!data)){data=window.makeKioskDemo(now,config,solar);lastDemo=+now;}
   const s=C.derive(data,now,config),mode=forcedMode||(solar.isDay?'day':'night');
   $('day-screen').hidden=mode!=='day';$('night-screen').hidden=mode!=='night';$('kiosk').classList.toggle('is-night',mode==='night');$('kiosk').dataset.mode=mode;
   $('clock').textContent=C.format(now);$('clock').dateTime=now.toISOString();
   bind('schoolName',String(data?.schoolName||config.schoolName));bind('todayEnergy',fmt(s.todayEnergy));bind('currentPower',fmt(s.currentPower));bind('totalEnergy',fmt(s.totalEnergy,0));bind('carbonReduction',fmt(s.carbonReduction));bind('capacity',fmt(s.capacity,0));bind('irradiance',fmt(s.irradiance,0));bind('temperature',fmt(s.temperature));
   const validPower=s.live&&s.currentPower!==null;
   $('generation-label').textContent=s.status;$('generation-description').innerHTML=s.description;document.querySelector('.energy-card').classList.toggle('is-warning',!validPower);
   $('smile-mouth').setAttribute('d',validPower?'M32 62Q50 83 69 62':'M34 66H66');
   $('data-timestamp').textContent=s.timestampValid?`데이터 기준 ${C.format(data.measuredAt)}`:'데이터 기준 없음';
   $('data-warning').textContent=!data?'':!s.timestampValid?'계측 시각 확인 필요':!s.sameDay?'이전 날짜 데이터 · 오늘 데이터 없음':!s.connected?'연결 끊김 · 마지막 수신값':s.stale?'갱신 지연 · 마지막 수신값':'';
   $('connection-label').textContent=`${s.connected?'연결됨':data?'연결 끊김':'연결 확인 중'} · 마지막 확인 ${C.format(data?.lastCheckedAt,true)}`;
   document.querySelector('.connection').classList.toggle('is-warning',!!data&&!s.connected);
   const p=C.parts(solar.nextSunrise);$('next-sunrise').textContent=`${p.month}.${p.day} 일출 ${p.hour}:${p.minute}`;
   $('night-no-data').textContent=s.todayEnergy===null?'오늘 데이터 없음':s.stale||!s.connected?'마지막 수신값':'';
   $('night-no-data').hidden=s.todayEnergy!==null&&!s.stale&&s.connected;
   document.querySelectorAll('.sample-label').forEach(el=>el.hidden=!demo);
   chart(s,solar);fitNumbers();
 }
 function fitNumbers(){
   document.querySelectorAll('.number b,.metric b').forEach(el=>{el.style.fontSize='';const parent=el.parentElement;if(!parent.getClientRects().length)return;let size=parseFloat(getComputedStyle(el).fontSize);while(parent.scrollWidth>parent.clientWidth+1&&size>30){size-=1;el.style.fontSize=size+'px';}});
   document.querySelectorAll('[data-bind="schoolName"]').forEach(el=>{el.style.fontSize='';let size=32;while(el.scrollWidth>420&&size>19){el.style.fontSize=--size+'px';}});
 }
 // 연동부는 화면 모드와 독립적입니다. 수집/저장은 현장 시스템 책임이며 여기서 중지하지 않습니다.
 window.kiosk={
   receive(snapshot){if(!snapshot||typeof snapshot!=='object')throw new TypeError('계측 객체가 필요합니다.');data=JSON.parse(JSON.stringify(snapshot));render();},
   heartbeat(connected,checkedAt){if(!C.validDate(checkedAt))throw new TypeError('실제 확인 시각이 필요합니다.');data={...data,connected:connected===true,lastCheckedAt:checkedAt};render();},
   setSolarTimes(date,times){config.solarTimes[date]=times;render();},
   inspect(){return {demo,mode:$('kiosk').dataset.mode,data:JSON.parse(JSON.stringify(data)),location:{...config.location}};},
   setModeForTest(mode){if(!['day','night',null].includes(mode))throw new Error('day, night 또는 null');forcedMode=mode;render();}
 };
 render();setInterval(()=>render(),1000);document.fonts.ready.then(fitNumbers);
})();
