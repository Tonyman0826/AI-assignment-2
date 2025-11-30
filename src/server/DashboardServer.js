const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs-extra');

class DashboardServer {
  constructor(dbManager, port = 3000) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server);
    this.db = dbManager;
    this.port = port;
    
    this.setupRoutes();
    this.setupSocket();
  }
  
  setupRoutes() {
    // 靜態文件服務
    this.app.use(express.static(path.join(__dirname, '../../public')));
    this.app.use('/data', express.static(path.join(__dirname, '../../data')));
    
    // API 路由
    this.app.get('/api/stats', (req, res) => {
      const stats = this.getStats();
      res.json(stats);
    });
    
    this.app.get('/api/images', (req, res) => {
      const { type = 'all', limit = 50 } = req.query;
      const images = this.getImages(type, parseInt(limit));
      res.json(images);
    });
    
    // 主頁面
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/index.html'));
    });
  }
  
  setupSocket() {
    this.io.on('connection', (socket) => {
      console.log('📊 客戶端連接成功');
      
      // 發送初始數據
      socket.emit('stats', this.getStats());
      socket.emit('images', this.getImages('all', 20));
    });
  }
  
  getStats() {
    const dbData = this.db.getAllData();
    const images = dbData.images || [];
    
    return {
      total: images.length,
      cleaned: images.filter(img => img.is_cleaned && img.category === 'sports').length,
      duplicates: images.filter(img => img.category === 'duplicate').length,
      nonSports: images.filter(img => img.category === 'non-sports').length,
      errors: images.filter(img => img.category === 'invalid' || img.category === 'error').length,
      uniqueDomains: new Set(images.map(img => img.domain)).size
    };
  }
  
  getImages(type, limit) {
    const dbData = this.db.getAllData();
    let images = dbData.images || [];
    
    switch (type) {
      case 'cleaned':
        images = images.filter(img => img.is_cleaned && img.category === 'sports');
        break;
      case 'removed':
        images = images.filter(img => img.is_cleaned && img.category !== 'sports');
        break;
      case 'raw':
        images = images.filter(img => !img.is_cleaned);
        break;
    }
    
    return images.slice(0, limit).map(img => ({
      ...img,
      thumbnail: `/data/cleaned/${path.basename(img.file_path)}` // 簡化路徑
    }));
  }
  
  start() {
    this.server.listen(this.port, () => {
      console.log(`📊 後台儀表板運行在: http://localhost:${this.port}`);
      console.log(`📊 API 統計: http://localhost:${this.port}/api/stats`);
    });
  }
}

module.exports = DashboardServer;