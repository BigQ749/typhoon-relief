function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于展示救援互助用户信息',
      success: resolve,
      fail: reject
    });
  });
}

module.exports = {
  getUserProfile
};
