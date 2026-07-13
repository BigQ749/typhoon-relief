const NEED_OPTIONS = [
  { code: 'food_water', label: '食品饮水' },
  { code: 'medical', label: '医疗急救' },
  { code: 'trapped', label: '人员被困' },
  { code: 'evacuate', label: '撤离协助' },
  { code: 'supplies', label: '物资短缺' }
];

const NEED_LABELS = NEED_OPTIONS.reduce((acc, item) => {
  acc[item.code] = item.label;
  return acc;
}, {});

const LEGACY_NEED_MAP = {
  食品饮水: 'food_water',
  食品: 'food_water',
  food: 'food_water',
  food_water: 'food_water',
  医疗急救: 'medical',
  医疗: 'medical',
  medical: 'medical',
  人员被困: 'trapped',
  被困: 'trapped',
  trapped: 'trapped',
  撤离协助: 'evacuate',
  撤离: 'evacuate',
  evacuate: 'evacuate',
  物资短缺: 'supplies',
  物资: 'supplies',
  supplies: 'supplies'
};

const STATUS_LABELS = {
  pending: '待救援',
  rescuing: '救援中',
  resolved: '已解决'
};

function normalizeNeed(value) {
  if (!value) return '';
  return LEGACY_NEED_MAP[value] || value;
}

function normalizeNeeds(needs) {
  if (!Array.isArray(needs)) return [];
  const codes = needs.map(normalizeNeed).filter(Boolean);
  return Array.from(new Set(codes));
}

function needLabel(codeOrLabel) {
  const code = normalizeNeed(codeOrLabel);
  return NEED_LABELS[code] || codeOrLabel || '其他需求';
}

function statusLabel(status) {
  return STATUS_LABELS[status] || '未知状态';
}

function formatDistance(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`;
}

function formatRelativeTime(input) {
  if (!input) return '刚刚';
  const date = input instanceof Date ? input : new Date(input);
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff) || diff < 0) return '刚刚';
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  return `${Math.floor(hours / 24)}天前`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = deg => deg * Math.PI / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = {
  NEED_OPTIONS,
  NEED_LABELS,
  STATUS_LABELS,
  normalizeNeed,
  normalizeNeeds,
  needLabel,
  statusLabel,
  formatDistance,
  formatRelativeTime,
  haversineKm
};
