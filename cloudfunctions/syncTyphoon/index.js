const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function getMockData() {
  const now = Date.now();
  return {
    _id: 'demo-2026-bavi',
    name: '巴威',
    name_en: 'Bavi',
    status: 'active',
    current: {
      lat: 29.85,
      lng: 124.5,
      wind_speed: 38,
      pressure: 965,
      level: '台风级',
      timestamp: now
    },
    path: [
      { lat: 22.1, lng: 131.5, wind_speed: 28, pressure: 985, level: '热带风暴', timestamp: now - 48 * 3600000 },
      { lat: 24.3, lng: 130.2, wind_speed: 32, pressure: 980, level: '强热带风暴', timestamp: now - 36 * 3600000 },
      { lat: 26.5, lng: 128.8, wind_speed: 35, pressure: 972, level: '台风级', timestamp: now - 24 * 3600000 },
      { lat: 28.6, lng: 126.0, wind_speed: 40, pressure: 960, level: '强台风级', timestamp: now - 12 * 3600000 },
      { lat: 29.85, lng: 124.5, wind_speed: 38, pressure: 965, level: '台风级', timestamp: now, isCurrent: true }
    ],
    forecasts: [
      {
        name: 'CMA',
        color: '#ef4444',
        pts: [
          { lat: 29.85, lng: 124.5 },
          { lat: 30.4, lng: 123.6 },
          { lat: 31.2, lng: 122.5 },
          { lat: 32.1, lng: 121.3 }
        ]
      },
      {
        name: 'JMA',
        color: '#3b82f6',
        pts: [
          { lat: 29.85, lng: 124.5 },
          { lat: 30.2, lng: 123.4 },
          { lat: 30.9, lng: 122.3 },
          { lat: 31.8, lng: 121.5 }
        ]
      },
      {
        name: 'JTWC',
        color: '#10b981',
        pts: [
          { lat: 29.85, lng: 124.5 },
          { lat: 30.5, lng: 123.8 },
          { lat: 31.4, lng: 122.8 },
          { lat: 32.4, lng: 121.8 }
        ]
      }
    ],
    wind_circles: {
      level_7: 280,
      level_10: 120,
      level_12: 50
    },
    updated_time: new Date(now).toISOString()
  };
}

async function fetchExternal() {
  return null;
}

exports.main = async () => {
  try {
    const raw = await fetchExternal();
    const data = raw || getMockData();
    const id = data._id;
    const record = {
      ...data,
      _id: id,
      updated_at: db.serverDate()
    };
    const { _id, ...storeData } = record;

    await db.collection('typhoons').doc(id).set({ data: storeData });
    return { code: 0, data: record, msg: 'success' };
  } catch (err) {
    console.error('syncTyphoon error', err);
    return { code: -1, msg: err.message, data: getMockData() };
  }
};
