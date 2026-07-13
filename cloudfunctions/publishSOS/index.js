const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const VALID_NEEDS = ['food_water', 'medical', 'trapped', 'evacuate', 'supplies'];

function calcPriority(needs) {
  if (needs.includes('trapped') || needs.includes('medical')) return 'high';
  if (needs.includes('evacuate')) return 'medium';
  return 'low';
}

async function ensureCollection(name) {
  try {
    await db.collection(name).limit(1).get();
  } catch (err) {
    const message = err && err.message ? err.message : '';
    const code = err && err.code ? String(err.code) : '';
    if (message.includes('not exist') || message.includes('Db or Table not exist') || code.includes('COLLECTION_NOT_EXIST')) {
      await db.createCollection(name);
      return;
    }
    throw err;
  }
}

exports.main = async event => {
  try {
    await ensureCollection('sos_signals');

    const { photos, location, address, needs, needs_desc, contact_phone } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID || 'dev-openid';
    const phone = String(contact_phone || '').trim();

    if (!photos || !Array.isArray(photos) || photos.length < 1) {
      return { code: 400, msg: '至少上传 1 张现场照片' };
    }

    if (!location || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) {
      return { code: 400, msg: '请提供有效位置信息' };
    }

    if (!phone) {
      return { code: 400, msg: '请填写联系电话，方便救援人员联系' };
    }

    const normalizedNeeds = Array.isArray(needs)
      ? needs.filter(item => VALID_NEEDS.includes(item))
      : [];

    if (normalizedNeeds.length < 1) {
      return { code: 400, msg: '请选择需要的帮助类型' };
    }

    const now = db.serverDate();
    const result = await db.collection('sos_signals').add({
      data: {
        _openid: openid,
        openid,
        location_geo: db.Geo.Point(Number(location.longitude), Number(location.latitude)),
        location_detail: {
          lat: Number(location.latitude),
          lng: Number(location.longitude),
          address: address || '当前位置'
        },
        photos,
        needs: normalizedNeeds,
        needs_desc: needs_desc || '',
        contact_phone: phone,
        phone,
        status: 'pending',
        priority: calcPriority(normalizedNeeds),
        rescuer_openid: '',
        view_count: 0,
        created_at: now,
        updated_at: now,
        last_update: now,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000)
      }
    });

    return {
      code: 0,
      data: { sos_id: result._id },
      msg: '求救信号已发布'
    };
  } catch (err) {
    console.error('publishSOS failed', err);
    return {
      code: -1,
      msg: `发布失败：${err.message || '云函数执行异常'}。请确认已运行 setupDB，并重新部署 publishSOS。`
    };
  }
};
