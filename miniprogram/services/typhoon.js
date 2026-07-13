function syncTyphoon() {
  return wx.cloud.callFunction({
    name: 'syncTyphoon',
    data: {}
  }).then(res => {
    const result = res.result || {};
    if (result.code === 0 && result.data) return result.data;
    throw new Error(result.msg || '台风数据加载失败');
  });
}

module.exports = {
  syncTyphoon
};
