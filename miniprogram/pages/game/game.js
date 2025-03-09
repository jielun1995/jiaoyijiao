const app = getApp()
const recorderManager = wx.getRecorderManager()

// 游戏配置
const CONFIG = {
  BIRD_INIT_Y: 400,        // 小鸟初始高度
  BIRD_SIZE: 40,          // 小鸟大小
  GRAVITY: 1.2,           // 增加重力
  FLAP_FORCE: 8,          // 飞行力度
  GAME_HEIGHT: 600,       // 游戏区域高度
  VOLUME_THRESHOLD: 0.01, // 进一步降低声音阈值
  VOLUME_MULTIPLIER: 50,  // 声音倍增器
  SMOOTH_FACTOR: 0.25     // 增加平滑因子使下落更快
}

Page({
  data: {
    isGameStarted: false,
    birdX: 150,
    birdY: CONFIG.BIRD_INIT_Y,
    targetBirdY: CONFIG.BIRD_INIT_Y, // 新增：目标高度
    score: 0,
    currentVolume: 0,
    voiceMeter: 0,
    obstacles: [],
    gameOver: false,
    animationTimer: null,
    gameSpeed: 5,
    gravity: CONFIG.GRAVITY,
    flyForce: 0,
    lastVolumeTime: 0,
    isRecording: false
  },

  onLoad: function () {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        console.log('麦克风授权成功')
        this.initRecorder()
        this.startRecording()
      },
      fail: () => {
        wx.showModal({
          title: '提示',
          content: '需要使用麦克风权限来控制游戏，请授权',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      }
    })
  },

  onUnload: function() {
    this.stopGame()
    this.stopRecording()
  },

  startGame() {
    if (this.data.isGameStarted) return
    
    this.setData({
      isGameStarted: true,
      birdX: 150,
      birdY: CONFIG.BIRD_INIT_Y,
      targetBirdY: CONFIG.BIRD_INIT_Y,
      score: 0,
      gameOver: false,
      obstacles: [],
      gameSpeed: 5,
      flyForce: 0,
      lastVolumeTime: Date.now()
    })

    this.generateObstacles()
    this.gameLoop()
    
    if (!this.data.isRecording) {
      this.startRecording()
    }
  },

  stopGame() {
    if (this.data.animationTimer) {
      clearTimeout(this.data.animationTimer)
    }
    this.setData({
      isGameStarted: false,
      animationTimer: null
    })
  },

  generateObstacles() {
    const obstacles = [
      { x: 800, y: 300, width: 60, height: 200 },
      { x: 1200, y: 200, width: 60, height: 200 },
      { x: 1600, y: 400, width: 60, height: 200 }
    ]
    this.setData({ obstacles })
  },

  gameLoop() {
    if (!this.data.gameOver && this.data.isGameStarted) {
      this.updateGameState()
      this.data.animationTimer = setTimeout(() => {
        this.gameLoop()
      }, 1000 / 60)
    }
  },

  updateGameState() {
    let { birdY, targetBirdY, obstacles, score, gameSpeed, currentVolume, lastVolumeTime } = this.data
    
    // 更新分数
    score += 1
    if (score % 500 === 0) {
      gameSpeed = Math.min(gameSpeed + 0.5, 12)
    }

    // 检查是否长时间没有收到音量数据
    const now = Date.now()
    if (now - lastVolumeTime > 100) {
      currentVolume = 0
    }

    // 计算目标高度
    const upForce = currentVolume * CONFIG.VOLUME_MULTIPLIER
    const movement = upForce - CONFIG.GRAVITY
    targetBirdY = Math.max(0, Math.min(targetBirdY - movement, CONFIG.GAME_HEIGHT - CONFIG.BIRD_SIZE))

    // 平滑移动到目标高度
    const diff = targetBirdY - birdY
    birdY += diff * CONFIG.SMOOTH_FACTOR

    // 更新障碍物位置
    obstacles = obstacles.map(obs => ({...obs, x: obs.x - gameSpeed}))
    obstacles = obstacles.filter(obs => obs.x > -100)

    // 生成新的障碍物
    if (obstacles.length < 3) {
      const lastObstacle = obstacles[obstacles.length - 1] || { x: 800 }
      const height = 150 + Math.random() * 250
      const maxY = CONFIG.GAME_HEIGHT - height - 50
      obstacles.push({
        x: lastObstacle.x + 400,
        y: Math.random() * maxY,
        width: 60,
        height: height
      })
    }

    // 检查碰撞
    if (this.checkCollisions(birdY, obstacles)) {
      console.log('发生碰撞，游戏结束')
      this.gameOver()
      return
    }

    this.setData({
      birdY,
      targetBirdY,
      obstacles,
      score,
      gameSpeed,
      currentVolume,
      lastVolumeTime: now
    })
  },

  checkCollisions(birdY, obstacles) {
    // 检查是否撞到地面或天花板
    if (birdY <= 0 || birdY >= CONFIG.GAME_HEIGHT - CONFIG.BIRD_SIZE) {
      return true
    }

    // 检查是否撞到障碍物
    const birdRect = {
      left: this.data.birdX,
      right: this.data.birdX + CONFIG.BIRD_SIZE,
      top: birdY,
      bottom: birdY + CONFIG.BIRD_SIZE
    }

    return obstacles.some(obs => {
      const obsRect = {
        left: obs.x,
        right: obs.x + obs.width,
        top: obs.y,
        bottom: obs.y + obs.height
      }

      return !(birdRect.right < obsRect.left || 
               birdRect.left > obsRect.right || 
               birdRect.bottom < obsRect.top || 
               birdRect.top > obsRect.bottom)
    })
  },

  initRecorder() {
    recorderManager.onStart(() => {
      console.log('开始录音')
      this.setData({ isRecording: true })
    })

    recorderManager.onStop(() => {
      console.log('录音停止')
      this.setData({ isRecording: false })
      if (!this.data.gameOver) {
        this.startRecording()
      }
    })

    recorderManager.onFrameRecorded((res) => {
      const { frameBuffer } = res
      if (frameBuffer) {
        this.analyzeVoice(frameBuffer)
      }
    })

    recorderManager.onError((res) => {
      console.error('录音错误：', res)
      this.setData({ isRecording: false })
      wx.showToast({
        title: '录音出错，请重试',
        icon: 'none'
      })
    })
  },

  analyzeVoice(frameBuffer) {
    const buffer = new Float32Array(frameBuffer)
    let sum = 0
    
    // 计算音量
    for(let i = 0; i < buffer.length; i++) {
      sum += Math.abs(buffer[i])
    }
    
    // 使用指数计算使音量更敏感
    const rawVolume = sum / buffer.length
    const volume = Math.min(Math.pow(rawVolume * 30, 1.5), 1)
    const normalizedVolume = volume > CONFIG.VOLUME_THRESHOLD ? volume : 0
    
    this.setData({
      currentVolume: normalizedVolume,
      voiceMeter: normalizedVolume * 100,
      lastVolumeTime: Date.now()
    })
  },

  startRecording() {
    if (!this.data.isRecording) {
      recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'wav',
        frameSize: 1
      })
    }
  },

  stopRecording() {
    if (this.data.isRecording) {
      recorderManager.stop()
    }
  },

  gameOver() {
    console.log('游戏结束')
    this.stopGame()
    
    this.setData({ gameOver: true })

    wx.showModal({
      title: '游戏结束',
      content: '得分: ' + this.data.score,
      showCancel: false,
      success: () => {
        this.setData({
          isGameStarted: false,
          score: 0
        })
      }
    })
  }
})
