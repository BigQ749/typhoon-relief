const { publishSOS } = require('../../services/sos');
const { NEED_OPTIONS } = require('../../utils/formatter');

Page({
  data: {
    latitude: '',
    longitude: '',
    address: '',
    photos: [],
    needs: NEED_OPTIONS.map(item => ({ ...item, active: false })),
    selectedNeeds: [],
    desc: '',
    phone: '',
    submitting: false,
    canSubmit: false
  },

  onLoad() {
    this.tryGetLocation();
  },

  tryGetLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 4000,
      success: res => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          address: '当前位置（自动定位）'
        });
        this.updateCanSubmit();
      },
      fail: () => {
        wx.showToast({ title: '请点击位置卡片选择求救地点', icon: 'none' });
      }
    });
  },

  chooseLocation() {
    wx.chooseLocation({
      success: res => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          address: res.address || res.name || '已选择位置'
        });
        this.updateCanSubmit();
      },
      fail: () => {
        wx.showToast({ title: '需要位置才能发布求救信号', icon: 'none' });
      }
    });
  },

  addPhoto() {
    const remain = 4 - this.data.photos.length;
    if (remain <= 0) return;

    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: res => {
        this.setData({ photos: this.data.photos.concat(res.tempFilePaths) });
        this.updateCanSubmit();
      }
    });
  },

  removePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = this.data.photos.slice();
    photos.splice(index, 1);
    this.setData({ photos });
    this.updateCanSubmit();
  },

  toggleNeed(e) {
    const need = e.currentTarget.dataset.need;
    const selected = this.data.selectedNeeds.slice();
    const index = selected.indexOf(need);
    if (index >= 0) selected.splice(index, 1);
    else selected.push(need);

    this.setData({
      selectedNeeds: selected,
      needs: NEED_OPTIONS.map(item => ({
        ...item,
        active: selected.indexOf(item.code) > -1
      }))
    });
    this.updateCanSubmit();
  },

  onDescInput(e) {
    this.setData({ desc: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value.trim() });
    this.updateCanSubmit();
  },

  updateCanSubmit() {
    this.setData({
      canSubmit: Boolean(
        this.data.photos.length >= 1
        && this.data.selectedNeeds.length >= 1
        && this.data.latitude
        && this.data.longitude
        && this.data.phone
        && !this.data.submitting
      )
    });
  },

  validate() {
    if (!this.data.latitude || !this.data.longitude) return '请选择求救地点';
    if (!this.data.photos.length) return '请至少添加 1 张现场照片';
    if (!this.data.selectedNeeds.length) return '请选择求救类型';
    if (!this.data.phone) return '请填写联系电话';
    return '';
  },

  submitSOS() {
    const error = this.validate();
    if (error || this.data.submitting) {
      wx.showToast({ title: error || '正在发布，请稍候', icon: 'none' });
      return;
    }

    this.setData({ submitting: true, canSubmit: false });

    const timestamp = Date.now();
    const uploadTasks = this.data.photos.map((path, index) => wx.cloud.uploadFile({
      cloudPath: `sos/${timestamp}_${index}_${Math.random().toString(36).slice(2, 8)}.jpg`,
      filePath: path
    }).then(res => res.fileID));

    Promise.all(uploadTasks)
      .catch(err => {
        console.warn('Upload photo failed, use local paths for dev preview', err);
        wx.showToast({ title: '照片云上传失败，先用本地预览继续发布', icon: 'none' });
        return this.data.photos;
      })
      .then(fileIDs => publishSOS({
        photos: fileIDs,
        location: {
          latitude: this.data.latitude,
          longitude: this.data.longitude
        },
        address: this.data.address,
        needs: this.data.selectedNeeds,
        needs_desc: this.data.desc.trim(),
        contact_phone: this.data.phone.trim()
      }))
      .then(() => {
        wx.showToast({ title: '求救信号已发布', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1200);
      })
      .catch(err => {
        console.error('Publish SOS failed', err);
        wx.showModal({
          title: '发布失败',
          content: err.message || '发布失败，请检查云函数 publishSOS 是否已重新部署',
          showCancel: false
        });
        this.setData({ submitting: false });
        this.updateCanSubmit();
      });
  }
});
