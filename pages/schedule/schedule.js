const scheduleData = require('../../utils/scheduleData')

// ─── 全局锚点 ───
// 2026-04-06（周一）：倒班周期起点 & 备班指针起点
// 从此日期正向模拟，保证任意日期排班结果唯一确定（跨月一致）
const SCHEDULE_ANCHOR = new Date(2026, 3, 6)

const ROTATE_CYCLE = ['主', '夜', '下']

// 半天休渐变色
const AM_REST_GRADIENT = 'linear-gradient(to bottom, #E8EAF0 50%, #CEF3D1 50%)'
const PM_REST_GRADIENT = 'linear-gradient(to bottom, #CEF3D1 50%, #E8EAF0 50%)'

const SHIFT_COLORS = {
  '主': { bg: '#8E97FD', text: '#fff' },
  '夜': { bg: '#3F414E', text: '#fff' },
  '下': { bg: '#E8EAF0', text: '#aaa' },
  '白': { bg: '#CEF3D1', text: '#50A05E' },
  '休': { bg: '#E8EAF0', text: '#aaa' },
  '补': { bg: AM_REST_GRADIENT, text: '#888' }, // 上午休（备班次日补偿 / 手动排班），rest AM work PM
  '上半': { bg: PM_REST_GRADIENT, text: '#888' }, // 上午班半天（work AM, rest PM）
  '下半': { bg: AM_REST_GRADIENT, text: '#888' }, // 下午班半天（rest AM, work PM，手动）
  '休(补)': { bg: '#D8E8F0', text: '#6A8FA0' },   // 补休全天（备班次日补偿，2人白班池专用），计0.5天配额
}

const LEGEND_LIST = [
  { label: '主', desc: '主夜班（倒班）',                    bg: '#8E97FD',        text: '#fff' },
  { label: '夜', desc: '下夜班（倒班）',                    bg: '#3F414E',        text: '#fff' },
  { label: '下', desc: '倒班全天休息',                      bg: '#E8EAF0',        text: '#aaa' },
  { label: '白', desc: '白班',                              bg: '#F3E6CE',        text: '#A07850' },
  { label: '休', desc: '轮休（全天）',                      bg: '#E8EAF0',        text: '#aaa' },
  { label: '补',    desc: '上午休（备班补偿/手动），下午上班',           bg: AM_REST_GRADIENT, text: '#888' },
  { label: '上半',  desc: '上午班半天，下午休息（手动）',                 bg: PM_REST_GRADIENT, text: '#888' },
  { label: '下半',  desc: '下午班半天，上午休息（手动）',                 bg: AM_REST_GRADIENT, text: '#888' },
  { label: '休(补)', desc: '补休全天（计0.5天，仅2人白班池备班次日）',    bg: '#D8E8F0',        text: '#6A8FA0' },
]

const WEEK_LABELS_SHORT = ['日', '一', '二', '三', '四', '五', '六']

// ─── 全局排班缓存 ───
let _globalSchedule = {}
// 缓存当前使用的人员列表（供 buildWeekViewData 使用）
let _currentStaffList = []

// ─── 工具函数 ───

function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isRestRotationDay(date, restRotationDays) {
  return restRotationDays.includes(date.getDay())
}

function daysDiff(date) {
  const t = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const a = new Date(
    SCHEDULE_ANCHOR.getFullYear(),
    SCHEDULE_ANCHOR.getMonth(),
    SCHEDULE_ANCHOR.getDate()
  )
  return Math.round((t - a) / 86400000)
}

function getWeekStart(date) {
  const d = new Date(date)
  const dow = d.getDay()
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
}

function getDatesInRange(start, end) {
  const dates = []
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const endD = new Date(end)
  endD.setHours(0, 0, 0, 0)
  while (cur <= endD) {
    dates.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

// ─── Pass 1：基础班次 ───
// 倒班人员按周期循环；其余人员默认白班
// 3 人倒班：主→夜→下（周期 3）
// 4 人倒班：主→夜→下→休（周期 4）；人数变化时自动切换，3 人逻辑不受影响
function pass1Base(schedule, dates, staffList) {
  const rotateCount = staffList.filter(p => p.type === 'rotate').length
  const rotateCycle = rotateCount >= 4 ? ['主', '夜', '下', '休'] : ['主', '夜', '下']
  const cycleLen    = rotateCycle.length

  dates.forEach(date => {
    const key = formatDate(date)
    if (!schedule[key]) schedule[key] = {}
    const diff = daysDiff(date)
    staffList.forEach(person => {
      if (schedule[key][person.id]) return
      let type = '白'
      if (person.type === 'rotate') {
        const idx = ((diff + person.rotateOffset) % cycleLen + cycleLen) % cycleLen
        type = rotateCycle[idx]
      }
      schedule[key][person.id] = { type, manual: false }
    })
  })
}

// ─── Pass 3：下夜班次日全天强制休息 ───
// '夜' = 下夜班，次日设为 '下'（全天休）
function pass3NightAfterRest(schedule, dates) {
  dates.forEach(date => {
    const key = formatDate(date)
    if (!schedule[key]) return
    Object.keys(schedule[key]).forEach(staffId => {
      const cell = schedule[key][staffId]
      if (cell.manual) return
      if (cell.type === '夜') {
        const nextKey = formatDate(addDays(date, 1))
        if (schedule[nextKey] && schedule[nextKey][staffId]) {
          const next = schedule[nextKey][staffId]
          // 仅覆盖非手动、非已设为强制休的格子
          if (!next.manual && next.type !== '下') {
            next.type = '下'
          }
        }
      }
    })
  })
}

// ─── Pass 2：每天备班分配（全局时间线，指针连续不重置）───
// 约束：
//   1. 备班是叠加标识（standby:true），不替换原班次类型
//   2. 候选池：白班人员（排除 head/pregnant）+ 倒班人员（仅 allowMainStandby=true 且当天为'主'）
//   3. 白班人员：轮休（'休'）、上午班半天（'上半'）不可备班；
//              '补' 可参与备班，但受 maxConsecutiveStandby 连续上限约束
//   4. 备班次日补偿（'补'）仅对白班人员生效，倒班主班备班不触发
function pass2Standby(schedule, dates, staffList, config) {
  const staffMap = {}
  staffList.forEach(p => { staffMap[p.id] = p })

  const standbyPool = staffList
    .filter(p => p.type !== 'head' && p.type !== 'pregnant')
    .map(p => p.id)

  if (standbyPool.length === 0) return

  // 白班人员池大小：决定备班次日补偿类型（2人→'休(补)'，>=3人→'补'）
  const dayPoolSize = staffList.filter(p => p.type === 'day').length

  const maxConsecutive = config.maxConsecutiveStandby || 1

  let pointer = 0

  dates.forEach(date => {
    if (date < SCHEDULE_ANCHOR) return
    const key = formatDate(date)
    if (!schedule[key]) return

    let assigned = false

    for (let i = 0; i < standbyPool.length; i++) {
      const idx = (pointer + i) % standbyPool.length
      const staffId = standbyPool[idx]
      const cell = schedule[key][staffId]
      if (!cell || cell.manual) continue

      const person = staffMap[staffId]

      if (person.type === 'rotate') {
        if (!config.allowMainStandby) continue
        if (cell.type !== '主') continue
      } else {
        // 整天轮休或上午半天班不可备班
        if (['休', '上半'].includes(cell.type)) continue
        // 检查连续备班天数是否已达上限
        if (_consecutiveStandbyBefore(schedule, date, staffId, maxConsecutive) >= maxConsecutive) continue
      }

      cell.standby = true
      if (person.type !== 'rotate') {
        _setAMRest(schedule, date, staffId, dayPoolSize, config.T_week)
      }
      pointer = (idx + 1) % standbyPool.length
      assigned = true
      break
    }

    if (!assigned) { /* 可接受 */ }
  })
}

// 向前计算连续备班天数（必须连续，遇到非备班天立即停止）
function _consecutiveStandbyBefore(schedule, date, staffId, max) {
  let count = 0
  for (let i = 1; i <= max; i++) {
    const prevKey = formatDate(addDays(date, -i))
    if (schedule[prevKey] && schedule[prevKey][staffId] && schedule[prevKey][staffId].standby) {
      count++
    } else {
      break
    }
  }
  return count
}

// 备班次日设补偿班次：
//   白班池 >= 3 人 → '补'（上午休/下午上班，不计配额，逻辑不变）
//   白班池 == 2 人 → 优先'休(补)'（计0.5天），但若本周配额已满则降级为'补'
//     原因：一周内可能有 3~4 次备班，若全用'休(补)'会超出 T_week
// 注意：若次日已是轮休（'休'/'下'/'上半'/'休(补)'），不覆盖
function _setAMRest(schedule, date, staffId, dayPoolSize, T_week) {
  const nextDate = addDays(date, 1)
  const nextKey  = formatDate(nextDate)
  if (!schedule[nextKey] || !schedule[nextKey][staffId]) return
  const next = schedule[nextKey][staffId]
  if (!next.manual && !['休', '下', '上半', '休(补)'].includes(next.type)) {
    if (dayPoolSize === 2) {
      // 检查次日所在周的当前休息分，避免多个'休(补)'叠加超出配额
      const weekDays     = getWeekDays(getWeekStart(nextDate))
      const currentScore = _calcRestScore(schedule, staffId, weekDays)
      next.type = (currentScore + 0.5 <= T_week) ? '休(补)' : '补'
    } else {
      next.type = '补'
    }
  }
}

// ─── Pass 4：每周常规休息补齐（按 config.T_week）───
// 分散策略：以「锚点起第N周 + 人员序号」为偏移量轮转起始休息日
//   - 同一周：不同人从不同轮休日开始 → 当周休息日不集中
//   - 不同周：同一人每周起始日向后移一位 → 每人都能轮到周六/日
// 备班当天（standby=true）和备班补休（'补'）不参与也不被覆盖
function pass4WeeklyRest(schedule, dates, staffList, config) {
  const { T_week, restRotationDays, minOnDuty } = config

  // 按自然周（周一~周日）分组
  const weekMap = {}
  dates.forEach(date => {
    const ws = formatDate(getWeekStart(date))
    if (!weekMap[ws]) weekMap[ws] = []
    weekMap[ws].push(date)
  })

  // 白班角色列表（固定顺序，用于计算人员偏移）
  const dayPersons = staffList.filter(p => ['head', 'pregnant', 'day'].includes(p.type))

  Object.values(weekMap).forEach(weekDays => {
    // 本周相对锚点的周数（保证跨月/跨年的唯一性）
    const weeksFromAnchor = Math.floor(daysDiff(weekDays[0]) / 7)

    dayPersons.forEach(person => {
      let score = _calcRestScore(schedule, person.id, weekDays)
      if (score >= T_week) return

      // 按角色使用各自可休日配置
      const candidateDays =
        person.type === 'head'      ? (config.headRestDays || [0, 6]) :
        person.type === 'pregnant'  ? (config.prepRestDays || [2, 4]) :
        restRotationDays

      const rotationDays = weekDays.filter(d => candidateDays.includes(d.getDay()))
      if (rotationDays.length === 0) return

      // 双维度偏移：第N周 + 第M人 → 起始位置 = (N+M) % 总轮休日数
      const personIdx   = dayPersons.indexOf(person)
      const startOffset = ((weeksFromAnchor + personIdx) % rotationDays.length + rotationDays.length) % rotationDays.length

      // 从偏移位置开始轮转，尾部补回头部
      const orderedDays = [
        ...rotationDays.slice(startOffset),
        ...rotationDays.slice(0, startOffset),
      ]

      for (const date of orderedDays) {
        if (score >= T_week) break
        const key = formatDate(date)
        if (!schedule[key] || !schedule[key][person.id]) continue
        const cell = schedule[key][person.id]
        // 跳过：手动排班 / 非白班（含'补'/'休'/'上半'）/ 备班当天
        if (cell.manual || cell.type !== '白' || cell.standby) continue

        // 确保当天白班角色中仍有 minOnDuty 人在岗（备班人员 type 仍为'白'，算在岗）
        const onDutyCount = staffList.filter(p =>
          p.id !== person.id &&
          ['head', 'pregnant', 'day'].includes(p.type) &&
          schedule[key][p.id] &&
          schedule[key][p.id].type === '白'
        ).length
        if (onDutyCount < minOnDuty) continue

        const remaining = T_week - score
        if (remaining >= 1) {
          cell.type = '休'
          score += 1
        } else {
          cell.type = '上半'
          score += 0.5
        }
      }

      // ─── 兜底补齐：T_week 硬约束 ───
      // 当备班次日补休（'补'）或备班当天（standby）占满了所有轮休日时，
      // 在本周剩余的普通白班天（非轮休日）中补安排 '上半'，确保必达 T_week。
      // 顺序：优先非强制全员日，确实不够时再使用强制全员日（仅 上半，不全休）。
      if (score < T_week) {
        const forcedDays = config.forcedWorkDays || []
        // 先尝试非强制全员日中的非轮休日
        const fallbackOrder = [
          ...weekDays.filter(d => !candidateDays.includes(d.getDay()) && !forcedDays.includes(d.getDay())),
          ...weekDays.filter(d => !candidateDays.includes(d.getDay()) &&  forcedDays.includes(d.getDay())),
        ]
        for (const date of fallbackOrder) {
          if (score >= T_week) break
          const key = formatDate(date)
          if (!schedule[key] || !schedule[key][person.id]) continue
          const cell = schedule[key][person.id]
          if (cell.manual || cell.type !== '白' || cell.standby) continue
          // 兜底只安排 上半（半天休，尽量减少对出勤的影响）
          cell.type = '上半'
          score += 0.5
        }
      }
    })
  })
}

// 计算某人本周已休息天数
// '休'=1天，'下'=1天，'上半'/'下半'=各0.5天；'补'（备班补偿）不计入
function _calcRestScore(schedule, staffId, days) {
  let score = 0
  days.forEach(date => {
    const key = formatDate(date)
    if (!schedule[key] || !schedule[key][staffId]) return
    const t = schedule[key][staffId].type
    if (t === '休' || t === '下') score += 1
    if (t === '上半' || t === '下半') score += 0.5 // 半天休息计0.5天
    if (t === '休(补)') score += 0.5               // 补休全天，计0.5天（2人白班池备班次日）
    // '补' 不计入配额（备班补偿休）
  })
  return score
}

// ─── 全局时间线构建 ───
// 从 SCHEDULE_ANCHOR 到 今天 +400 天
// 执行顺序：pass1 → pass3 → pass2 → pass4
function buildGlobalSchedule() {
  const staffList = scheduleData.getStaffList()
  const config    = scheduleData.getScheduleConfig()
  _currentStaffList = staffList

  const start = addDays(SCHEDULE_ANCHOR, -1)
  const end   = addDays(new Date(), 400)
  const dates = getDatesInRange(start, end)

  _globalSchedule = {}
  pass1Base(_globalSchedule, dates, staffList)
  pass3NightAfterRest(_globalSchedule, dates)
  pass2Standby(_globalSchedule, dates, staffList, config)    // 先备班：确保补休写入
  pass4WeeklyRest(_globalSchedule, dates, staffList, config) // 再轮休：跳过已有补休/备班的格子
}

// ─── 计算格子显示背景 ───
function getCellDisplayBg(type, personType) {
  if (type === '补' || type === '下半') return AM_REST_GRADIENT  // 上午休，下午上班
  if (type === '上半') return PM_REST_GRADIENT                   // 上午上班，下午休
  return (SHIFT_COLORS[type] || SHIFT_COLORS['白']).bg
}

// ─── 组装当前周视图数据 ───
function buildWeekViewData(weekStart) {
  const todayStr = formatDate(new Date())
  const days = getWeekDays(weekStart)
  const config = scheduleData.getScheduleConfig()
  const staffList = _currentStaffList

  const scheduleSlice = {}
  days.forEach(date => {
    const dateStr = formatDate(date)
    const dayRaw = _globalSchedule[dateStr] || {}
    scheduleSlice[dateStr] = {}
    staffList.forEach(person => {
      const cell = dayRaw[person.id]
        ? { ...dayRaw[person.id] }
        : { type: '白', manual: false, standby: false }
      cell.displayBg   = getCellDisplayBg(cell.type, person.type)
      cell.displayText = (SHIFT_COLORS[cell.type] || SHIFT_COLORS['白']).text
      cell.standby     = !!cell.standby
      scheduleSlice[dateStr][person.id] = cell
    })
  })

  const y  = weekStart.getFullYear()
  const fd = days[0]
  const ld = days[6]
  const weekLabel = `${y}年  ${fd.getMonth() + 1}/${fd.getDate()} – ${ld.getMonth() + 1}/${ld.getDate()}`

  const currentWeekDays = days.map(date => {
    const dateStr = formatDate(date)
    return {
      date:      dateStr,
      weekLabel: WEEK_LABELS_SHORT[date.getDay()],
      dayNum:    date.getDate(),
      monthNum:  date.getMonth() + 1,
      isToday:   dateStr === todayStr,
      isWeekend: isRestRotationDay(date, config.restRotationDays),
      isPast:    dateStr < todayStr,
    }
  })

  return { scheduleSlice, weekLabel, currentWeekDays }
}

// ─────────────────────────────────────────
Page({
  data: {
    weekLabel: '',
    currentWeekDays: [],
    staffList: [],
    schedule: {},
    legendList: LEGEND_LIST,
    showRules: false,
    showShiftPicker: false,
    pickerContext: '',
    pickerStaffId: '',
    pickerDate: '',
    shiftOptions: Object.keys(SHIFT_COLORS).map(k => ({
      type: k,
      label: k,
      bg:   SHIFT_COLORS[k].bg,
      text: SHIFT_COLORS[k].text,
    })),
    // 动态规则文字
    ruleTexts: [],
    // 当前 picker 中的备班标识状态
    pickerStandby: false,
  },

  onLoad() {
    buildGlobalSchedule()
    this._weekStart = getWeekStart(new Date())
    this._refresh()
  },

  onShow() {
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#FAF8F5' })
    // 从人员/配置页返回时重建排班
    buildGlobalSchedule()
    this.setData({ staffList: _currentStaffList })
    this._refresh()
  },

  _refresh() {
    const { scheduleSlice, weekLabel, currentWeekDays } = buildWeekViewData(this._weekStart)
    const ruleTexts = this._buildRuleTexts()
    this.setData({
      weekLabel,
      currentWeekDays,
      schedule: scheduleSlice,
      staffList: _currentStaffList,
      ruleTexts,
    })
  },

  _buildRuleTexts() {
    const config = scheduleData.getScheduleConfig()
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    const forcedStr = (config.forcedWorkDays || []).sort().map(d => `周${dayNames[d]}`).join('、')
    const restStr   = (config.restRotationDays || []).sort().map(d => `周${dayNames[d]}`).join('、')
    return [
      forcedStr   ? `${forcedStr}：强制全员日，不安排常规轮休` : '',
      restStr     ? `${restStr}：轮休日，至少 ${config.minOnDuty} 人在岗` : '',
      `每人每周常规休息 ${config.T_week} 天（不含备班后补偿）`,
      `备班为叠加角标标识，不替换班次；白班人员及倒班主班（可配置）可参与备班`,
      `白班备班次日自动补休：白班池≥3人排"补"（上午休下午上班，不计配额）；白班池=2人排"休(补)"（补休全天，计0.5天）`,
      `下夜班次日全天休息 ${config.T_after_night} 天`,
      `护士长休息固定安排在周六、周日`,
      `过去日期不可手动修改排班`,
    ].filter(Boolean)
  },

  prevWeek() {
    this._weekStart = addDays(this._weekStart, -7)
    this._refresh()
  },

  nextWeek() {
    this._weekStart = addDays(this._weekStart, 7)
    this._refresh()
  },

  toggleRules() {
    this.setData({ showRules: !this.data.showRules })
  },

  goStaff() {
    wx.navigateTo({ url: '/pages/staff/staff' })
  },

  goConfig() {
    wx.navigateTo({ url: '/pages/schedule-config/schedule-config' })
  },

  onShiftTap(e) {
    const { staffId, date } = e.currentTarget.dataset
    if (date < formatDate(new Date())) {
      wx.showToast({ title: '历史排班不可修改', icon: 'none', duration: 1500 })
      return
    }
    const person = _currentStaffList.find(p => p.id === staffId)
    if (!person) return
    const cell = this.data.schedule[date][staffId]
    this.setData({
      showShiftPicker: true,
      pickerStaffId: staffId,
      pickerDate: date,
      pickerStandby: !!cell.standby,
      pickerContext: `${person.name} · ${date} · 当前：${cell.type}`,
    })
  },

  toggleStandby() {
    const { pickerStaffId, pickerDate, pickerStandby } = this.data
    const newStandby = !pickerStandby

    if (_globalSchedule[pickerDate] && _globalSchedule[pickerDate][pickerStaffId]) {
      _globalSchedule[pickerDate][pickerStaffId].standby = newStandby
    }
    this.setData({
      pickerStandby: newStandby,
      [`schedule.${pickerDate}.${pickerStaffId}.standby`]: newStandby,
    })
  },

  closeShiftPicker() {
    this.setData({ showShiftPicker: false })
  },

  selectShift(e) {
    const { type } = e.currentTarget.dataset
    const { pickerStaffId, pickerDate } = this.data
    const person = _currentStaffList.find(p => p.id === pickerStaffId)
    if (!person) return

    const newCell = {
      type,
      manual: true,
      displayBg:   getCellDisplayBg(type, person.type),
      displayText: (SHIFT_COLORS[type] || SHIFT_COLORS['白']).text,
    }

    if (_globalSchedule[pickerDate]) {
      _globalSchedule[pickerDate][pickerStaffId] = { type, manual: true }
    }

    this.setData({
      [`schedule.${pickerDate}.${pickerStaffId}`]: newCell,
      showShiftPicker: false,
    })
  },
})
