const app = getApp();
const { updateSOS } = require('../../services/sos');
const { needLabel, statusLabel, formatRelativeTime } = require('../../utils/formatter');

function isDevtools() {
  try {
    return wx.getSystemInfoSync().platform === 'devtools';
  } catch (err) {
    return false;
  }
}

function isCloudFile(path) {
  return typeof path === 'string' && path.indexOf('cloud://') === 0;
}

Page({
  data: {
    signal: null,
    markers: [],
    previewPhotos: []
  },

  onLoad() {
    const signal = app.globalData.currentSignal;
    if (!signal) {
      wx.showToast({ title: '未找到求救信息，请从列表重新进入', icon: 'none' });
      return;
    }

    this.setSignal(signal);
  },

  setSignal(signal) {
    const location = signal.location || { lat: 31.2304, lng: 121.4737 };
    const needs = Array.isArray(signal.needs) ? signal.needs : [];
    const phone = signal.contact_phone || signal.phone || signal.contact || '';
    const photos = Array.isArray(signal.photos) ? signal.photos : [];
    const normalized = {
      ...signal,
      photos,
      contact_phone: phone,
      displayNeeds: signal.displayNeeds || needs.map(needLabel),
      statusText: statusLabel(signal.status),
      timeText: signal.timeText || formatRelativeTime(signal.created_at),
      contactText: phone || '发布者未填写联系电话',
      publisherText: signal.publisher_openid ? `${signal.publisher_openid.slice(0, 8)}...` : '微信云开发用户'
    };

    this.setData({
      signal: normalized,
      previewPhotos: photos,
      markers: [{
        id: 1,
        latitude: location.lat,
        longitude: location.lng,
        iconPath: '/images/rescue-active.png',
        width: 24,
        height: 30
      }]
    });

    this.resolvePhotoUrls(photos);
  },

  resolvePhotoUrls(photos) {
    const cloudFiles = photos.filter(isCloudFile);
    if (!cloudFiles.length) return;

    wx.cloud.getTempFileURL({
      fileList: cloudFiles,
      success: res => {
        const urlMap = {};
        (res.fileList || []).forEach(item => {
          if (item.status === 0 && item.tempFileURL) {
            urlMap[item.fileID] = item.tempFileURL;
          }
        });
        this.setData({
          previewPhotos: photos.map(path => urlMap[path] || path)
        });
      },
      fail: err => {
        console.warn('Get temp photo URL failed', err);
      }
    });
  },

  previewPhoto(e) {
    const index = Number(e.currentTarget.dataset.index || 0);
    const urls = this.data.previewPhotos.length ? this.data.previewPhotos : this.data.signal.photos;
    if (!urls || !urls.length) {
      wx.showToast({ title: '暂无现场照片', icon: 'none' });
      return;
    }

    wx.previewImage({
      current: urls[index] || urls[0],
      urls
    });
  },

  saveCurrentPhoto(e) {
    const index = Number(e.currentTarget.dataset.index || 0);
    const urls = this.data.previewPhotos.length ? this.data.previewPhotos : this.data.signal.photos;
    const url = urls && urls[index];
    if (!url) {
      wx.showToast({ title: '暂无可保存图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中' });
    wx.downloadFile({
      url,
      success: res => {
        if (res.statusCode !== 200) {
          wx.showToast({ title: '图片下载失败', icon: 'none' });
          return;
        }
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => wx.showToast({ title: '保存失败，请检查相册权限', icon: 'none' })
        });
      },
      fail: () => wx.showToast({ title: '图片下载失败', icon: 'none' }),
      complete: () => wx.hideLoading()
    });
  },

  navigateTo() {
    const signal = this.data.signal;
    if (!signal || !signal.location) {
      wx.showToast({ title: '缺少位置信息', icon: 'none' });
      return;
    }

    const latitude = Number(signal.location.lat);
    const longitude = Number(signal.location.lng);
    const address = signal.address || '求救位置';

    if (isDevtools()) {
      wx.showModal({
        title: '开发者工具无法打开地图',
        content: `开发者工具不支持 qqmap:// 导航协议。\n\n地址：${address}\n坐标：${latitude}, ${longitude}\n\n请在真机预览中测试导航。`,
        confirmText: '复制坐标',
        success: res => {
          if (res.confirm) {
            wx.setClipboardData({ data: `${latitude},${longitude}` });
          }
        }
      });
      return;
    }

    wx.openLocation({
      latitude,
      longitude,
      name: address,
      address,
      scale: 15,
      fail: () => {
        wx.showToast({ title: '无法打开地图，请在真机微信中重试', icon: 'none' });
      }
    });
  },

  callContact() {
    const phone = this.data.signal && this.data.signal.contact_phone;
    if (!phone) {
      wx.showToast({ title: '发布者未填写联系电话', icon: 'none' });
      return;
    }

    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({ title: '未能拨打电话，请在真机微信中重试', icon: 'none' });
      }
    });
  },

  takeRescue() {
    const signal = this.data.signal;
    if (!signal || !signal._id) return;

    wx.showModal({
      title: '确认救援',
      content: '确认前往救援该求助者吗？',
      success: res => {
        if (!res.confirm) return;
        updateSOS(signal._id, 'take')
          .then(() => {
            this.setSignal({ ...signal, status: 'rescuing' });
            wx.showToast({ title: '已接单，请尽快前往', icon: 'success' });
          })
          .catch(err => {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          });
      }
    });
  },

  resolveRescue() {
    const signal = this.data.signal;
    if (!signal || !signal._id) return;

    wx.showModal({
      title: '确认解决',
      content: '确认该求救信号已经解决吗？',
      success: res => {
        if (!res.confirm) return;
        updateSOS(signal._id, 'resolve')
          .then(() => {
            this.setSignal({ ...signal, status: 'resolved' });
            wx.showToast({ title: '已标记解决', icon: 'success' });
          })
          .catch(err => {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          });
      }
    });
  }
});
