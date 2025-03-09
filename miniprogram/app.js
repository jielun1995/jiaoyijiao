App({
  globalData: {
    userInfo: null,
    highScore: 0,
    currentScore: 0
  },
  onLaunch: function () {
    // 暂时注释掉云开发初始化
    // wx.cloud.init({
    //   env: '你的云开发环境ID',
    //   traceUser: true
    // })
  }
})
