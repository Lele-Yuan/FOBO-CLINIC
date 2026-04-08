App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'dev-5gfdj03w258c6084', // 替换成你的云开发环境ID
        traceUser: true,
      })
    }
  }
})