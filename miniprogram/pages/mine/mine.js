const { getUserProfile } = require('../../services/user');

Page({
  data: {
    loggedIn: false,
    avatarUrl: '',
    nickName: '',
    mySOSCount: 0,
    myRescueCount: 0,
    offlineMode: false
  },

  login() {
    if (this.data.loggedIn) return;

    getUserProfile()
      .then(res => {
        this.setData({
          loggedIn: true,
          avatarUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName
        });
      })
      .catch(() => {
        wx.showToast({ title: '登录已取消', icon: 'none' });
      });
  },

  toggleOffline(e) {
    this.setData({ offlineMode: e.detail.value });
    wx.showToast({
      title: e.detail.value ? '已开启离线信息包' : '已关闭离线信息包',
      icon: 'none'
    });
  },

  showComingSoon() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
