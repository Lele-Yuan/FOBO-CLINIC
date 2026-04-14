Page({
  data: {
    cardList: [{
        title: '今天吃什么？',
        // isLarge: true,
        iconPath: '/assets/images/icon-food.png',
        pagePath: 'meal/meal',
        bgColor: '#FEB18F'
    }, {
      title: '值班怎么排？',
      iconPath: '/assets/images/icon-date.png',
      pagePath: 'schedule/schedule',
      bgColor: '#F3E6CE'
    }, {
        title: '记忆外挂',
        iconPath: '/assets/images/icon-note.png',
        pagePath: '',
        bgColor: '#A8B0FF'
    }, {
        title: 'color 选哪个？',
        iconPath: '/assets/images/icon-color.png',
        pagePath: '',
        bgColor: '#F16B59'
    }, {
        title: '记事本',
        iconPath: '/assets/images/icon-think.png',
        pagePath: 'notes/notes',
        bgColor: '#C8D6B2'
    // }, {
    //     title: '排班配置',
    //     iconPath: '/assets/images/icon-note.png',
    //     pagePath: 'schedule-config/schedule-config',
    //     bgColor: '#C8D6B2'
  }]
  },

  onShow() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#FAF8F5'
    })
  },

  onHide() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    })
  },

  navigateTo(e) {
    const page = e.currentTarget.dataset.page;
    wx.navigateTo({
      url: `/pages/${page}`
    });
  }
})