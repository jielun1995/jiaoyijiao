Page({
  data: {
    rankList: [
      // 添加一些测试数据
      {
        avatarUrl: '/images/default-avatar.png',
        nickName: '测试用户1',
        score: 100
      },
      {
        avatarUrl: '/images/default-avatar.png',
        nickName: '测试用户2',
        score: 80
      },
      {
        avatarUrl: '/images/default-avatar.png',
        nickName: '测试用户3',
        score: 60
      }
    ]
  },

  onLoad: function () {
    // 暂时注释掉获取排行榜数据的云函数调用
    // this.getRankList()
  },

  getRankList() {
    // wx.cloud.callFunction({
    //   name: 'getRankList',
    //   success: res => {
    //     this.setData({
    //       rankList: res.result.data
    //     })
    //   }
    // })
  }
})
