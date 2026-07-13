App({
  globalData: {
    userInfo: null,
    currentTyphoon: null,
    currentSignal: null,
    currentArticle: null,
    systemInfo: null,
    isDebug: false
  },

  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
        traceUser: true
      });
    }

    try {
      this.globalData.systemInfo = wx.getSystemInfoSync();
    } catch (err) {
      console.warn('System info unavailable', err);
    }
  }
});
