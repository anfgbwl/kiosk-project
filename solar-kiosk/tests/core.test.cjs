const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const C=require('../dist/core.js'),SunCalc=require('../dist/assets/suncalc.js');
global.window={KioskCore:C};vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../dist/config.js'),'utf8'));vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../dist/demo-data.js'),'utf8'));
const config=window.KIOSK_CONFIG,now=new Date('2026-11-09T13:24:00+09:00'),solar=C.getSolar(now,config,SunCalc),sample=window.makeKioskDemo(now,config,solar);
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('한국시간 표기',()=>assert.equal(C.format('2026-11-09T04:24:00Z'),'2026.11.09 13:24'));
test('일출/일몰 경계 자동 전환',()=>{assert.equal(C.getSolar(new Date(+solar.sunrise-1),config,SunCalc).isDay,false);assert.equal(C.getSolar(solar.sunrise,config,SunCalc).isDay,true);assert.equal(C.getSolar(new Date(+solar.sunset-1),config,SunCalc).isDay,true);assert.equal(C.getSolar(solar.sunset,config,SunCalc).isDay,false);});
test('새벽에는 당일 일출, 저녁에는 다음날 일출',()=>{assert.equal(C.dayKey(C.getSolar(new Date('2026-11-09T01:00:00+09:00'),config,SunCalc).nextSunrise),'2026-11-09');assert.equal(C.dayKey(C.getSolar(new Date('2026-11-09T23:00:00+09:00'),config,SunCalc).nextSunrise),'2026-11-10');});
test('정상 계측',()=>{const s=C.derive(sample,now,config);assert.equal(s.live,true);assert.equal(s.status,'좋음');assert(s.currentPower>0);});
test('데이터 미수신 시 0으로 오표시하지 않음',()=>{const s=C.derive(null,now,config);assert.equal(s.currentPower,null);assert.equal(s.todayEnergy,null);assert.equal(s.connected,false);});
test('갱신 지연 시 현재 출력과 환경정보 숨김',()=>{const s=C.derive({...sample,measuredAt:'2026-11-09T13:00:00+09:00'},now,config);assert.equal(s.stale,true);assert.equal(s.currentPower,null);assert.equal(s.irradiance,null);assert.equal(s.status,'갱신 지연');assert.equal(s.todayEnergy,sample.todayEnergyKwh);});
test('연결 끊김과 심박 만료',()=>{assert.equal(C.derive({...sample,connected:false},now,config).status,'연결 끊김');assert.equal(C.derive({...sample,lastCheckedAt:'2026-11-09T12:00:00+09:00'},now,config).connected,false);});
test('자정 이후 전날 발전량과 그래프 숨김',()=>{const s=C.derive(sample,new Date('2026-11-10T00:00:01+09:00'),config);assert.equal(s.todayEnergy,null);assert.equal(s.series.length,0);assert.equal(s.currentPower,null);});
test('미래/유효하지 않은 계측 시각 거절',()=>{for(const measuredAt of ['bad','2026-11-10T13:00:00+09:00',null]){const s=C.derive({...sample,measuredAt},now,config);assert.equal(s.todayEnergy,null);assert.equal(s.timestampValid,false);}});
test('음수/용량 초과/잘못된 수치 거절',()=>{const s=C.derive({...sample,currentPowerKw:200,todayEnergyKwh:-4,irradianceWm2:'500',temperatureC:500},now,config);assert.equal(s.currentPower,null);assert.equal(s.todayEnergy,null);assert.equal(s.irradiance,null);assert.equal(s.temperature,null);});
test('예시 그래프 적분값과 오늘 발전량 일치',()=>{let integral=0;for(let i=1;i<sample.trend.length;i++)integral+=(sample.trend[i-1].kw+sample.trend[i].kw)/2*(new Date(sample.trend[i].at)-new Date(sample.trend[i-1].at))/3600000;assert(Math.abs(integral-sample.todayEnergyKwh)<.051);assert(sample.trend.every(p=>new Date(p.at)<=new Date(sample.measuredAt)));});
test('시스템 공급 일출/일몰 우선 적용',()=>{const cfg={...config,solarTimes:{'2026-11-09':{sunrise:'2026-11-09T07:00:00+09:00',sunset:'2026-11-09T17:00:00+09:00'}}};assert.equal(C.format(C.getSolar(now,cfg,SunCalc).sunrise,true),'07:00');});
console.log(`${count} tests passed`);
