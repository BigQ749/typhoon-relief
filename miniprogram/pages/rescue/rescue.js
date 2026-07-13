const app = getApp();
const { nearbySOS } = require('../../services/sos');
const { NEED_OPTIONS, normalizeNeeds, needLabel, statusLabel, formatRelativeTime } = require('../../utils/formatter');

const DEFAULT_LOCATION = { latitude: 31.2304, longitude: 121.4737 };

Page({
  data: {
    loading: true,
    locating: false,
    centerLat: DEFAULT_LOCATION.latitude,
    centerLng: DEFAULT_LOCATION.longitude,
    mapScale: 14,
    markers: [],
    signals: [],
    filteredSignals: [],
    panelExpanded: true,
    filterType: 'all',
    filters: [{ code: 'all', label: '全部' }].concat(NEED_OPTIONS),
    errorText: '',
    locationText: '正在定位当前位置...'
  },

  onLoad() {
    this.loadNearbySignals();
  },

  onShow() {
    if (!this.data.loading) {
      this.loadNearbySignals();
    }
  },

  loadNearbySignals() {
    this.setData({ loading: true, locating: true, errorText: '' });

    this.getCurrentLocation()
      .then(location => {
        const isFallback = Boolean(location.isFallback);
        this.setData({
          centerLat: location.latitude,
          centerLng: location.longitude,
          locating: false,
          locationText: isFallback ? '定位失败，当前显示上海默认位置' : '已定位到当前位置'
        });
        return nearbySOS(location.latitude, location.longitude, 50);
      })
      .then(signals => this.processSignals(signals))
      .catch(err => {
        console.warn('Load nearby SOS failed', err);
        this.setData({
          locating: false,
          errorText: '附近求救信号加载失败，已显示空列表'
        });
        this.processSignals([]);
      });
  },

  getCurrentLocation() {
    return new Promise(resolve => {
      wx.getLocation({
        type: 'gcj02',
        isHighAccuracy: true,
        highAccuracyExpireTime: 4000,
        success: resolve,
        fail: () => resolve({ ...DEFAULT_LOCATION, isFallback: true })
      });
    });
  },

  processSignals(signals) {
    const normalized = (signals || []).map(signal => {
      const needCodes = normalizeNeeds(signal.needs);
      const displayNeeds = needCodes.map(needLabel);
      return {
        ...signal,
        needs: needCodes,
        displayNeeds,
        needsText: displayNeeds.join('、'),
        primaryNeed: needCodes[0] || '',
        statusText: statusLabel(signal.status),
        timeText: formatRelativeTime(signal.created_at),
        contactText: signal.contact_phone || '未填写联系电话'
      };
    });

    const markers = normalized
      .filter(signal => signal.location)
      .map((signal, index) => ({
        id: index + 1,
        latitude: signal.location.lat,
        longitude: signal.location.lng,
        iconPath: '/images/rescue-active.png',
        width: 28,
        height: 36,
        callout: {
          content: signal.needsText || '求救信号',
          color: '#dc2626',
          fontSize: 12,
          borderRadius: 6,
          bgColor: '#ffffff',
          padding: 8,
          display: 'BYCLICK'
        },
        signalId: signal._id
      }));

    this.setData({
      loading: false,
      signals: normalized,
      filteredSignals: this.applyFilter(normalized, this.data.filterType),
      markers,
      panelExpanded: normalized.length > 0
    });
  },

  applyFilter(signals, type) {
    if (type === 'all') return signals;
    return signals.filter(signal => normalizeNeeds(signal.needs).indexOf(type) > -1);
  },

  setFilter(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      filterType: type,
      filteredSignals: this.applyFilter(this.data.signals, type)
    });
  },

  recenter() {
    this.loadNearbySignals();
  },

  togglePanel() {
    this.setData({ panelExpanded: !this.data.panelExpanded });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    const signal = this.data.signals.find(item => item._id === id);
    if (!signal) {
      wx.showToast({ title: '未找到这条求救信息', icon: 'none' });
      return;
    }
    app.globalData.currentSignal = signal;
    wx.navigateTo({ url: '/pages/sos-detail/sos-detail' });
  },

  goToPublish() {
    wx.navigateTo({ url: '/pages/sos-publish/sos-publish' });
  },

  onMarkerTap(e) {
    const marker = this.data.markers.find(item => item.id === e.markerId);
    const signal = marker && this.data.signals.find(item => item._id === marker.signalId);
    if (signal) {
      app.globalData.currentSignal = signal;
      wx.navigateTo({ url: '/pages/sos-detail/sos-detail' });
    }
  },

  onShareAppMessage() {
    return {
      title: '台风救援 - 附近求救信号',
      path: '/pages/rescue/rescue'
    };
  }
});
