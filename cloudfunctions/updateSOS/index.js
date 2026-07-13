const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async event => {
  const { sos_id, action } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!sos_id || !action) {
    return { code: 400, msg: '参数不完整' };
  }

  try {
    const doc = await db.collection('sos_signals').doc(sos_id).get();
    if (!doc.data) {
      return { code: 404, msg: '求救信号不存在' };
    }

    const signal = doc.data;

    if (action === 'take') {
      if (signal.status !== 'pending') {
        return { code: 400, msg: '该求救信号已被响应或已解决' };
      }

      await db.collection('sos_signals').doc(sos_id).update({
        data: {
          status: 'rescuing',
          rescuer_openid: openid,
          updated_at: db.serverDate(),
          last_update: db.serverDate()
        }
      });

      return { code: 0, data: { status: 'rescuing' }, msg: '已接单' };
    }

    if (action === 'resolve') {
      if (signal.status === 'resolved') {
        return { code: 400, msg: '该求救信号已解决' };
      }

      if (signal._openid !== openid && signal.rescuer_openid !== openid) {
        return { code: 403, msg: '只有发布者或接单者可以标记解决' };
      }

      await db.collection('sos_signals').doc(sos_id).update({
        data: {
          status: 'resolved',
          updated_at: db.serverDate(),
          last_update: db.serverDate()
        }
      });

      return { code: 0, data: { status: 'resolved' }, msg: '已标记解决' };
    }

    return { code: 400, msg: `未知操作: ${action}` };
  } catch (err) {
    console.error('updateSOS failed', err);
    return { code: -1, msg: err.message };
  }
};
