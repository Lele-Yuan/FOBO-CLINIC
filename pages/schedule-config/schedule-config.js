const scheduleData = require('../../utils/scheduleData')

// 步进器配置：字段名 → { min, max, step }
const STEPPER_CONFIG = {
  R_day:                 { min: 1, max: 20,  step: 1   },
  R_night1:              { min: 0, max: 10,  step: 1   },
  R_night2:              { min: 0, max: 10,  step: 1   },
  R_standby:             { min: 0, max: 5,   step: 1   },
  maxConsecutiveStandby: { min: 1, max: 7,   step: 1   },
  T_week:                { min: 0, max: 7,   step: 0.5 },
  T_after_night:         { min: 0, max: 3,   step: 0.5 },
  T_after_standby:       { min: 0, max: 2,   step: 0.5 },
  minOnDuty:             { min: 1, max: 10,  step: 1   },
}

const DAY_LIST = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
]

Page({
  data: {
    cfg: {},
    dayList: DAY_LIST,
    staffCount: { rotateCount: 0, dayCount: 0 },
    // 用于渲染的附加状态
    forcedDayMap: {},    // { 1: true, 3: true, 5: true }
    restDayMap: {},      // { 0: true, 2: true, 4: true, 6: true }
    headDayMap: {},      // 护士长可休日 { 0: true, 6: true }
    prepDayMap: {},      // 备孕人员可休日 { 2: true, 4: true }
  },

  onLoad() {
    this._loadConfig()
  },

  onShow() {
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#FAF8F5' })
  },

  _loadConfig() {
    const cfg       = scheduleData.getScheduleConfig()
    const staffList = scheduleData.getStaffList()
    const rotateCount = staffList.filter(s => s.type === 'rotate').length
    const dayCount    = staffList.filter(s => s.type === 'day').length
    const forcedDayMap = {}
    const restDayMap   = {}
    const headDayMap   = {}
    const prepDayMap   = {}
    ;(cfg.forcedWorkDays  || []).forEach(d => { forcedDayMap[d] = true })
    ;(cfg.restRotationDays || []).forEach(d => { restDayMap[d]  = true })
    ;(cfg.headRestDays    || []).forEach(d => { headDayMap[d]  = true })
    ;(cfg.prepRestDays    || []).forEach(d => { prepDayMap[d]  = true })
    this.setData({ cfg, forcedDayMap, restDayMap, headDayMap, prepDayMap,
      staffCount: { rotateCount, dayCount } })
  },

  // ─── 步进器：减 ───
  stepDown(e) {
    const field = e.currentTarget.dataset.field
    const conf = STEPPER_CONFIG[field]
    if (!conf) return
    const cur = this.data.cfg[field]
    const next = Math.max(conf.min, Math.round((cur - conf.step) * 10) / 10)
    this.setData({ [`cfg.${field}`]: next })
  },

  // ─── 步进器：加 ───
  stepUp(e) {
    const field = e.currentTarget.dataset.field
    const conf = STEPPER_CONFIG[field]
    if (!conf) return
    const cur = this.data.cfg[field]
    const next = Math.min(conf.max, Math.round((cur + conf.step) * 10) / 10)
    this.setData({ [`cfg.${field}`]: next })
  },

  // ─── 切换强制全员日 ───
  toggleForcedDay(e) {
    const day = e.currentTarget.dataset.day
    const map = Object.assign({}, this.data.forcedDayMap)
    map[day] ? delete map[day] : (map[day] = true)
    // 强制全员日与轮休日互斥
    const restMap = Object.assign({}, this.data.restDayMap)
    if (map[day]) delete restMap[day]
    this.setData({ forcedDayMap: map, restDayMap: restMap })
  },

  // ─── 切换轮休日 ───
  toggleRestDay(e) {
    const day = e.currentTarget.dataset.day
    const map = Object.assign({}, this.data.restDayMap)
    map[day] ? delete map[day] : (map[day] = true)
    // 互斥
    const forcedMap = Object.assign({}, this.data.forcedDayMap)
    if (map[day]) delete forcedMap[day]
    this.setData({ restDayMap: map, forcedDayMap: forcedMap })
  },

  // ─── 切换倒班主班备班开关 ───
  toggleAllowMainStandby(e) {
    this.setData({ 'cfg.allowMainStandby': e.detail.value })
  },

  // ─── 切换护士长可休日 ───
  toggleHeadDay(e) {
    const day = e.currentTarget.dataset.day
    const map = Object.assign({}, this.data.headDayMap)
    map[day] ? delete map[day] : (map[day] = true)
    this.setData({ headDayMap: map })
  },

  // ─── 切换备孕人员可休日 ───
  togglePrepDay(e) {
    const day = e.currentTarget.dataset.day
    const map = Object.assign({}, this.data.prepDayMap)
    map[day] ? delete map[day] : (map[day] = true)
    this.setData({ prepDayMap: map })
  },

  // ─── 保存 ───
  save() {
    const { cfg, forcedDayMap, restDayMap, headDayMap, prepDayMap } = this.data
    const finalCfg = Object.assign({}, cfg, {
      forcedWorkDays:   Object.keys(forcedDayMap).map(Number),
      restRotationDays: Object.keys(restDayMap).map(Number),
      headRestDays:     Object.keys(headDayMap).map(Number),
      prepRestDays:     Object.keys(prepDayMap).map(Number),
    })
    scheduleData.saveScheduleConfig(finalCfg)
    wx.showToast({ title: '已保存', icon: 'success', duration: 1200 })
    setTimeout(() => wx.navigateBack(), 1200)
  },

  // ─── 恢复默认 ───
  reset() {
    wx.showModal({
      title: '恢复默认',
      content: '将重置所有排班配置为默认值，确认吗？',
      success: (res) => {
        if (!res.confirm) return
        scheduleData.saveScheduleConfig(Object.assign({}, scheduleData.DEFAULT_CONFIG))
        this._loadConfig()
        wx.showToast({ title: '已恢复默认', icon: 'success' })
      }
    })
  },
})
