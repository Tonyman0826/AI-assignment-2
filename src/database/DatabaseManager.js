const path = require('path');
const fs = require('fs-extra');

// 簡單的內存數據庫，不需要 better-sqlite3-proxy
class DatabaseManager {
  constructor() {
    this.db = {
      images: [],
      crawl_sessions: [],
      cleanup_stats: []
    };
    this.nextId = {
      images: 1,
      crawl_sessions: 1,
      cleanup_stats: 1
    };
  }
  
  initialize() {
    console.log('✅ 數據庫初始化完成（內存模式）');
    return this;
  }
  
  insertImage(imageData) {
    const image = {
      id: this.nextId.images++,
      ...imageData,
      created_at: new Date().toISOString()
    };
    this.db.images.push(image);
    return image;
  }
  
  getRawImages() {
    return this.db.images.filter(img => !img.is_cleaned);
  }
  
  updateImage(id, updates) {
    const image = this.db.images.find(img => img.id === id);
    if (image) {
      Object.assign(image, updates);
    }
    return image;
  }
  
  findImages(query) {
    return this.db.images.filter(img => {
      return Object.keys(query).every(key => img[key] === query[key]);
    });
  }
  
  insertCrawlSession(sessionData) {
    const session = {
      id: this.nextId.crawl_sessions++,
      ...sessionData,
      session_date: new Date().toISOString()
    };
    this.db.crawl_sessions.push(session);
    return session;
  }
  
  insertCleanupStats(statsData) {
    const stats = {
      id: this.nextId.cleanup_stats++,
      ...statsData,
      completion_date: new Date().toISOString()
    };
    this.db.cleanup_stats.push(stats);
    return stats;
  }
  
  getAllData() {
    return this.db;
  }
}

module.exports = DatabaseManager;