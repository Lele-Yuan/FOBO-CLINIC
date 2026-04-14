// ─── 排班数据持久化工具 ───
// 提供默认人员/配置数据，以及 Storage 读写封装
// Storage Key: schedule_staff_list / schedule_config

const STORAGE_KEY_STAFF  = 'schedule_staff_list'
const STORAGE_KEY_CONFIG = 'schedule_config'

// 预设颜色板（供人员管理页选色使用）
const PRESET_COLORS = [
  '#F16B59', '#FEB18F', '#FFD4B8',
  '#8E97FD', '#7B87F5', '#A8B0FF',
  '#C8D6B2', '#3F414E',
]

// ─── 默认人员列表（与原 STAFF_LIST 等效）───
const DEFAULT_STAFF = [
  { id: 'head',   name: '护士长', type: 'head',     color: '#F16B59', rotateOffset: 0 },
  { id: 'r_a',    name: '倒班A',  type: 'rotate',   color: '#8E97FD', rotateOffset: 0 },
  { id: 'r_b',    name: '倒班B',  type: 'rotate',   color: '#7B87F5', rotateOffset: 2 },
  { id: 'r_c',    name: '倒班C',  type: 'rotate',   color: '#A8B0FF', rotateOffset: 1 },
  { id: 'd_a',    name: '白班A',  type: 'day',      color: '#FEB18F', rotateOffset: 0 },
  { id: 'd_b',    name: '白班B',  type: 'day',      color: '#F9956E', rotateOffset: 0 },
  { id: 'd_c',    name: '白班C',  type: 'day',      color: '#FFD4B8', rotateOffset: 0 },
  { id: 'd_prep', name: '白班D',  type: 'pregnant', color: '#C8D6B2', rotateOffset: 0 },
]

// ─── 默认排班配置 ───
const DEFAULT_CONFIG = {
  R_day:     4,       // 每日白班需求人数
  R_night1:  1,       // 每日主夜需求人数
  R_night2:  1,       // 每日下夜需求人数（0 = 合并为单夜班，不产生次日强制休）
  R_standby: 1,       // 每日备班需求人数
  T_week:         1.5, // 每人每周总休息天数（不含备班后补偿休）
  T_after_night:  1,   // 下夜班后次日强制全天休息天数
  T_after_standby: 0.5, // 备班后次日上午休息（不计入每周配额）
  forcedWorkDays:    [1, 3, 5],    // 强制全员日（0=日 1=一…6=六），禁止常规轮休
  restRotationDays:  [0, 2, 4, 6], // 轮休日，允许安排常规轮休
  minOnDuty: 1,        // 轮休日每天最少上班人数
  allowMainStandby: false, // 倒班人员上主班时是否允许备班
  maxConsecutiveStandby: 1, // 同一人最多连续备班天数，默认 1（昨天备班则今天不再备班）
  headRestDays:  [0, 6], // 护士长可休日，默认周六、周日
  prepRestDays:  [2, 4], // 备孕人员可休日，默认周二、周四
}

// ─── 人员类型中文映射 ───
const TYPE_LABELS = {
  rotate:   '倒班',
  head:     '护士长',
  pregnant: '备孕',
  day:      '白班',
}

// ─── 读取人员列表 ───
// 首次读取若 Storage 为空，写入默认值并返回
function getStaffList() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY_STAFF)
    if (raw && Array.isArray(raw) && raw.length > 0) return raw
  } catch (e) {}
  const list = DEFAULT_STAFF.map(s => Object.assign({}, s))
  saveStaffList(list)
  return list
}

// ─── 保存人员列表 ───
function saveStaffList(list) {
  try {
    wx.setStorageSync(STORAGE_KEY_STAFF, list)
  } catch (e) {
    console.error('saveStaffList error', e)
  }
}

// ─── 读取排班配置 ───
// 首次读取若 Storage 为空，写入默认值并返回
function getScheduleConfig() {
  try {
    const raw = wx.getStorageSync(STORAGE_KEY_CONFIG)
    if (raw && typeof raw === 'object') {
      // 合并默认值，保证新增字段有回退
      return Object.assign({}, DEFAULT_CONFIG, raw)
    }
  } catch (e) {}
  const cfg = Object.assign({}, DEFAULT_CONFIG)
  saveScheduleConfig(cfg)
  return cfg
}

// ─── 保存排班配置 ───
function saveScheduleConfig(cfg) {
  try {
    wx.setStorageSync(STORAGE_KEY_CONFIG, cfg)
  } catch (e) {
    console.error('saveScheduleConfig error', e)
  }
}

module.exports = {
  PRESET_COLORS,
  DEFAULT_STAFF,
  DEFAULT_CONFIG,
  TYPE_LABELS,
  getStaffList,
  saveStaffList,
  getScheduleConfig,
  saveScheduleConfig,
}
