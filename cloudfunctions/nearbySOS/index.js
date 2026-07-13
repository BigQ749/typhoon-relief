const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

const LEGACY_NEED_MAP = {
  食品饮水: 'food_water',
  食品: 'food_water',
  food: 'food_water',
  food_water: 'food_water',
  医疗急救: 'medical',
  医疗: 'medical',
  medical: 'medical',
  人员被困: 'trapped',
  被困: 'trapped',
  trapped: 'trapped',
  撤离协助: 'evacuate',
  撤离: 'evacuate',
  evacuate: 'evacuate',
  物资短缺: 'supplies',
  物资: 'supplies',
  supplies: 'supplies'
};

function normalizeNeeds(needs) {
  if (!Array.isArray(needs)) return [];
  return Array.from(new Set(needs.map(item => LEGACY_NEED_MAP[item] || item).filter(Boolean)));
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

function calcDistance(lat1, lng1, lat2, lng2) {
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isCollectionMissing(err) {
  const message = err && err.message ? err.message : '';
  const code = err && err.code ? String(err.code) : '';
  return message.includes('not exist') || message.includes('Db or Table not exist') || code.includes('COLLECTION_NOT_EXIST');
}

exports.main = async event => {
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);
  const radiusKm = Number(event.radius_km || 50);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { code: 400, msg: '请提供有效位置坐标', data: { signals: [] } };
  }

  try {
    const latDiff = radiusKm / 111.12;
    const lngDiff = radiusKm / (111.12 * Math.cos(toRad(latitude)));

    const signals = await db.collection('sos_signals')
      .where({
        status: _.neq('resolved'),
        expires_at: _.gte(new Date()),
        'location_detail.lat': _.gte(latitude - latDiff).lte(latitude + latDiff),
        'location_detail.lng': _.gte(longitude - lngDiff).lte(longitude + lngDiff)
      })
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const result = signals.data
      .filter(item => item.location_detail)
      .map(item => {
        const phone = item.contact_phone || item.phone || item.contact || '';
        return {
          _id: item._id,
          photos: item.photos || [],
          needs: normalizeNeeds(item.needs || []),
          needs_desc: item.needs_desc || '',
          address: item.location_detail.address || '',
          location: {
            lat: item.location_detail.lat,
            lng: item.location_detail.lng
          },
          status: item.status || 'pending',
          priority: item.priority || 'low',
          distance: calcDistance(latitude, longitude, item.location_detail.lat, item.location_detail.lng).toFixed(1),
          created_at: item.created_at,
          updated_at: item.updated_at,
          contact_phone: phone,
          publisher_openid: item.openid || item._openid || '',
          has_phone: Boolean(phone)
        };
      });

    return { code: 0, data: { signals: result } };
  } catch (err) {
    if (isCollectionMissing(err)) {
      try {
        await db.createCollection('sos_signals');
      } catch (createErr) {
        console.warn('create sos_signals skipped', createErr.message);
      }
      return { code: 0, data: { signals: [] }, msg: 'sos_signals 集合已初始化，暂无求救信号' };
    }

    console.error('nearbySOS query failed', err);
    return { code: -1, msg: err.message, data: { signals: [] } };
  }
};
