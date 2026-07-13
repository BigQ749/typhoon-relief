function nearbySOS(latitude, longitude, radiusKm = 50) {
  return wx.cloud.callFunction({
    name: 'nearbySOS',
    data: {
      latitude,
      longitude,
      radius_km: radiusKm
    }
  }).then(res => {
    const result = res.result || {};
    if (result.code === 0) return (result.data && result.data.signals) || [];
    throw new Error(result.msg || '附近求救信号加载失败');
  });
}

function publishSOS(payload) {
  return wx.cloud.callFunction({
    name: 'publishSOS',
    data: payload
  }).then(res => {
    const result = res.result || {};
    if (result.code === 0) return result.data;
    throw new Error(result.msg || res.errMsg || '发布失败，请检查 publishSOS 云函数');
  }).catch(err => {
    throw new Error(err.message || err.errMsg || '发布失败，请检查 publishSOS 云函数是否已部署');
  });
}

function updateSOS(sosId, action) {
  return wx.cloud.callFunction({
    name: 'updateSOS',
    data: {
      sos_id: sosId,
      action
    }
  }).then(res => {
    const result = res.result || {};
    if (result.code === 0) return result.data;
    throw new Error(result.msg || '操作失败');
  });
}

module.exports = {
  nearbySOS,
  publishSOS,
  updateSOS
};
