const app = getApp();

Page({
  data: {
    article: null
  },

  onLoad() {
    const article = app.globalData.currentArticle;
    if (article) {
      this.setData({ article });
    }
  }
});
