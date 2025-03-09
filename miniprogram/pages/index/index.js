Page({
  data: {
    userInfo: {},
    hasUserInfo: false
  },

  startGame() {
    wx.navigateTo({
      url: '/pages/game/game'
    })
  },

  goToRank() {
    wx.navigateTo({
      url: '/pages/rank/rank'
    })
  }
})
