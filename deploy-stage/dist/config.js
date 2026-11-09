/* 현장 설정. preview/demo는 실제 계측 연결이 아닙니다. */
window.KIOSK_CONFIG = {
  schoolName: '한빛중학교',
  location: { latitude: 35.1796, longitude: 129.0756 }, // 부산 대표 좌표. 설치 학교 좌표로 교체
  timezone: 'Asia/Seoul',
  capacityKw: 100,
  staleAfterMs: 5 * 60 * 1000,
  heartbeatTimeoutMs: 2 * 60 * 1000,
  dataMode: 'demo', // 'live': 수신 대기 / 'demo': 검수용 시뮬레이션
  solarTimes: {} // 예: '2026-11-09': { sunrise: '2026-11-09T06:51:00+09:00', sunset: '2026-11-09T17:23:00+09:00' }
};
