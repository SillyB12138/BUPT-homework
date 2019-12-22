const devicesId = "577811107" 
const api_key = "ZKCaV2bQ5z5cVmQeGEu7G7kvvAw=" 
const gap = 10000                //刷新间隔，单位毫秒
var util = require('../../utils.js')
Page({
  
  data: {
    time:0,  
    minute:0,
    hour: 0,
    str:"",
    now:"",
    showDialog: false
  },

  onPullDownRefresh: function () {
    wx.showLoading({
      title: "正在获取"
    })
    this.getDatapoints().then(datapoints => {
      this.update(datapoints)
      wx.hideLoading()
    }).catch((error) => {
      wx.hideLoading()
      console.error(error)
    })
  },


  onLoad: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    console.log(`your deviceId: ${devicesId}, apiKey: ${api_key}`)
    }
    var that = this
    wx.cloud.callFunction({
      name: "read",
      success: function (res) {
        var length = res.result.data.length
        var result = res.result.data[length - 1]
        that.setData({
          hour: result.hour,
          minute: result.minute,
          time: result.time,
          now: result.now
        })
      }

    })
    const timer = setInterval(() => {
      this.getDatapoints().then(datapoints => {
        this.update(datapoints)
      })
    }, gap)

    wx.showLoading({
      title: '加载中'
    })

    this.getDatapoints().then((datapoints) => {
      wx.hideLoading()

    }).catch((err) => {
      wx.hideLoading()
      console.error(err)
      clearInterval(timer) //首次渲染发生错误时禁止自动刷新
    })
  },

  getDatapoints: function () {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://api.heclouds.com/devices/${devicesId}/datapoints?datastream_id=Total_Time`,//待更改get参数

        header: {
          'content-type': 'application/json',
          'api-key': api_key
        },
        success: (res) => {
          const status = res.statusCode
          const response = res.data
          if (status !== 200) { 
            reject(res.data)
            return;
          }
          if (response.errno !== 0) { 
            reject(response.error)
            return;
          }

          if (response.data.datastreams.length === 0) {
            reject("error:[01]NoData")
          }

          //程序可以运行到这里说明请求成功, 将Promise置为resolve状态
          resolve({
            chumo: response.data.datastreams[0].datapoints.reverse()
          })
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },
  update: function (datapoints) {
    const checkData = this.convert(datapoints);
    var that = this;
    var temp = 0;
    var checkChange = 0;
    this.setData({
      time: checkData.chumo         //////////////////////////////////////////
    })
    checkChange = this.data.time;


    if (this.data.time > 60) {
      that.data.minute = parseInt(this.data.time / 60);
      this.setData({
        time: parseInt(this.data.time % 60)
      })
      if (this.data.minute > 60) {
        that.setData({
          hour: parseInt(this.data.minute / 60),
          minute: parseInt(this.data.minute % 60)
        })
      }
    }
    var result = "" + parseInt(this.data.time) + "秒";
    if (this.data.minute > 0) {
      result = "" + parseInt(this.data.minute) + "分" + result;
    }
    if (this.data.hour > 0) {
      result = "" + parseInt(this.data.hour) + "小时" + result;
    }
    this.setData({
      str:result
    })
    console.log(result);
    checkChange = 0;
    var now = util.formatTime(new Date());
    this.setData({
      now:now
    })
    var hour = this.data.hour;
    var minute = this.data.minute;
    var time = this.data.time;
    var db = wx.cloud.database()
    db.collection("time").add({
      data: {
        hour: this.data.hour,
        minute: this.data.minute,
        time: this.data.time,
        now:this.data.now
      },
      success: function (res) {
        console.log(res)
      }
    })
   // console.log(this.data.time);
  //  console.log(this.data.hour);
  //  console.log(this.data.minute);
  //  console.log(this.data.second);
  },

  convert: function (datapoints) {
    var chumo = [];
    var length = datapoints.chumo.length
    for (var i = 0; i < length; i++) {
      chumo.push(datapoints.chumo[i].value);
    }
    return {
      chumo: chumo,
    }
  },



  upload: function () {
    var hour = this.data.hour;
    var minute = this.data.minute;
    var time = this.data.time;
    var db = wx.cloud.database()
    db.collection("time").add({
      data: {
        hour: this.data.hour,
        minute: this.data.minute,
        time:this.data.time,
        now:this.data.now
      },
      success: function (res) {
        console.log(res)
      }
    })
  },

  read: function () {
    var that = this
    wx.cloud.callFunction({
      name: "read",
      success: function (res) {
        var length = res.result.data.length
        var result = res.result.data[length - 1]
        that.setData({
          hour:result.hour,
          minute:result.minute,
          time:result.time,
          now:result.now
        })
      }

    })
  },
  openDialog: function () {
    this.setData({
      istrue: true
    })
  },
  closeDialog: function () {
    this.setData({
      istrue: false
    })
  }
})