const dayjs = require('dayjs')
const cloudDB = require('../../utils/cloudDB.js')

Page({
  data: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    days: [],
    selectedDate: '',
    events: [],
    showDrawer: false,
    newEvent: {},
    eventTypes: ['纪念', '工作', '生活'],
    eventTypeIndex: 2,
    typeMap: {
      0: 'memorial',
      1: 'work',
      2: 'life'
    },
    dateTimeArray: [],
    dateTimeIndex: [0, 0, 0, 0, 0],
  },
  
  onShow() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#8E97FD'
    })
  },

  onHide() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    })
  },

  onLoad() {
    this.generateCalendar()
    this.loadEvents()
  },

  initDateTimePicker: function() {
    // 获取完整的年月日时分，显示未来5年
    const date = new Date();
    const years = [];
    const months = [];
    const days = [];
    const hours = [];
    const minutes = [];
  
    for (let i = date.getFullYear(); i <= date.getFullYear() + 4; i++) {
      years.push(i);
    }
    for (let i = 1; i <= 12; i++) {
      months.push(i);
    }
    for (let i = 1; i <= 31; i++) {
      days.push(i);
    }
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    for (let i = 0; i < 60; i++) {
      minutes.push(i);
    }
  
    this.setData({
      dateTimeArray: [years, months, days, hours, minutes],
      dateTimeIndex: [0, date.getMonth(), date.getDate() - 1, date.getHours(), date.getMinutes()]
    });
  },

  onDateTimeChange: function(e) {
    const dateTimeIndex = e.detail.value;
    const dateTimeArray = this.data.dateTimeArray;
    // 格式化显示的日期时间字符串
    const selectedDateTime = `${dateTimeArray[0][dateTimeIndex[0]]}-${dateTimeArray[1][dateTimeIndex[1]]}-${dateTimeArray[2][dateTimeIndex[2]]} ${dateTimeArray[3][dateTimeIndex[3]]}:${String(dateTimeArray[4][dateTimeIndex[4]]).padStart(2, '0')}`;
  
    this.setData({
      dateTimeIndex: dateTimeIndex,
      'newEvent.date': selectedDateTime
    });
  },

  onColumnChange: function(e) {
    const column = e.detail.column;
    const value = e.detail.value;
    const dateTimeArray = this.data.dateTimeArray;
    const dateTimeIndex = this.data.dateTimeIndex;
  
    dateTimeIndex[column] = value;
  
    if (column === 0 || column === 1) {
      const year = dateTimeArray[0][dateTimeIndex[0]];
      const month = dateTimeArray[1][dateTimeIndex[1]];
      const days = [];
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      
      dateTimeArray[2] = days;
      
      if (dateTimeIndex[2] >= days.length) {
        dateTimeIndex[2] = days.length - 1;
      }
    }
  
    this.setData({
      dateTimeArray: dateTimeArray,
      dateTimeIndex: dateTimeIndex
    });
  },

  generateCalendar() {
    const days = []
    const date = new Date(this.data.year, this.data.month - 1, 1)
    const lastDay = new Date(this.data.year, this.data.month, 0).getDate()
    const firstDayWeek = date.getDay()

    // 上个月的最后几天
    const prevMonthLastDay = new Date(this.data.year, this.data.month - 1, 0).getDate()
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        current: false,
        date: `${this.data.year}-${this.data.month - 1}-${prevMonthLastDay - i}`
      })
    }

    // 当前月的天数
    for (let i = 1; i <= lastDay; i++) {
      days.push({
        day: i,
        current: true,
        date: `${this.data.year}-${this.data.month}-${i}`
      })
    }

    // 下个月的开始几天
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        current: false,
        date: `${this.data.year}-${this.data.month + 1}-${i}`
      })
    }

    this.setData({ days })
  },

  onTypeChange(e) {
    const index = e.detail.value
    this.setData({
      eventTypeIndex: index,
      'newEvent.type': this.data.typeMap[index]
    })
  },

  async loadEvents() {
    try {
      const events = await cloudDB.events.getList()
      // 更新日历上的事件标记，按类型分组
      const days = this.data.days.map(day => {
        const dayEvents = events.filter(event => {
          return dayjs(event.date).format('YYYY-MM-DD') === dayjs(day.date).format('YYYY-MM-DD')
        })
        return {
          ...day,
          events: dayEvents
        }
      })
      this.setData({ days })
    } catch (err) {
      console.error('加载事件失败：', err)
    }
  },

  prevMonth() {
    let { year, month } = this.data
    if (month === 1) {
      year--
      month = 12
    } else {
      month--
    }
    this.setData({ year, month })
    this.generateCalendar()
  },

  nextMonth() {
    let { year, month } = this.data
    if (month === 12) {
      year++
      month = 1
    } else {
      month++
    }
    this.setData({ year, month })
    this.generateCalendar()
  },

  selectDate(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ 
      selectedDate: date,
      'newEvent.date': date
    })
    this.loadDateEvents(date)
  },

  async loadDateEvents(date) {
    try {
      const events = await cloudDB.events.getEventsByDate(date)
      const selectEvents = events.map(event => ({
        ...event,
        time: dayjs(event.date).format('HH:mm')
      }))
      console.log('selectEvents: ', selectEvents);
      this.setData({ events: selectEvents })
    } catch (err) {
      console.error('加载日期事件失败：', err)
      wx.showToast({
        title: '加载事件失败',
        icon: 'none'
      })
    }
  },

  showAddEvent() {
    const now = new Date()
    const currentDateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    // const currentDateTime = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDay()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    this.setData({
      showDrawer: true,
      eventTypeIndex: 2,
      newEvent: {
        date: currentDateTime,
        type: 'life'
      },
    })
    this.initDateTimePicker()
  },

  onDateChange(e) {
    this.setData({
      'newEvent.date': e.detail.value
    })
  },

  async saveEvent() {
    const { newEvent } = this.data
    if (!newEvent.title || !newEvent.date) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })
    try {
      // 将日期字符串转换为 Date 对象
      const eventData = {
        ...newEvent,
        date: new Date(newEvent.date)
      }
      await cloudDB.events.add(eventData)
      this.hideDrawer()
      await this.loadEvents()
      // 获取选中日期的零点时间用于查询
      const selectedDate = newEvent.date.split(' ')[0]
      await this.loadDateEvents(selectedDate)
      wx.showToast({ title: '保存成功' })
    } catch (err) {
      console.error('保存事件失败：', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
    wx.hideLoading()
  },

  // 删除 onStartTimeChange 和 onEndTimeChange 方法
  hideDrawer() {
    this.setData({ showDrawer: false })
  },

  onTitleInput(e) {
    this.setData({
      'newEvent.title': e.detail.value
    })
  },

  onDescriptionInput(e) {
    this.setData({
      'newEvent.description': e.detail.value
    })
  },

  async saveEvent() {
    const { newEvent } = this.data
    if (!newEvent.title || !newEvent.date) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })
    try {
      await cloudDB.events.add(newEvent)
      this.hideDrawer()
      await this.loadEvents()
      await this.loadDateEvents(newEvent.date)
      wx.showToast({ title: '保存成功' })
    } catch (err) {
      console.error('保存事件失败：', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
    wx.hideLoading()
  }
})