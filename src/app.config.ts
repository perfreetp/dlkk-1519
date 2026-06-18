export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/queue/index',
    'pages/progress/index',
    'pages/reminder/index',
    'pages/record/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165dff',
    navigationBarTitleText: '政务大厅排队',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f2f6ff'
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/queue/index',
        text: '取号'
      },
      {
        pagePath: 'pages/progress/index',
        text: '进度'
      },
      {
        pagePath: 'pages/reminder/index',
        text: '提醒'
      },
      {
        pagePath: 'pages/record/index',
        text: '我的'
      }
    ]
  }
})
