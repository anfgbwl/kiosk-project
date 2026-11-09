/* 검수용 합성 데이터 공급자. 실제 API 응답이 아니며 화면에도 예시임을 표시합니다. */
window.makeKioskDemo = function (now, config, solar) {
  const day=window.KioskCore.dayKey(now), sunrise=solar.sunrise.getTime(), sunset=solar.sunset.getTime();
  const measured=new Date(+now-15000), end=Math.min(+measured,sunset), trend=[];
  function output(t) {const ratio=(t-sunrise)/(sunset-sunrise);return ratio<=0||ratio>=1?0:62*Math.pow(Math.sin(Math.PI*ratio),1.5);}
  if(end>sunrise){for(let t=sunrise;t<end;t+=15*60000)trend.push({at:new Date(t).toISOString(),kw:+output(t).toFixed(3)});trend.push({at:new Date(end).toISOString(),kw:+output(end).toFixed(3)});}
  let energy=0;for(let i=1;i<trend.length;i++)energy+=(trend[i-1].kw+trend[i].kw)/2*(new Date(trend[i].at)-new Date(trend[i-1].at))/3600000;
  return {schoolName:config.schoolName,currentPowerKw:+output(+measured).toFixed(1),todayEnergyKwh:+energy.toFixed(1),totalEnergyKwh:+(215351.6+energy).toFixed(1),capacityKw:config.capacityKw,irradianceWm2:+(output(+measured)*13.6).toFixed(0),temperatureC:24.6,carbonReductionTons:98.1,energyDate:day,trend,measuredAt:measured.toISOString(),connected:true,lastCheckedAt:measured.toISOString()};
};
