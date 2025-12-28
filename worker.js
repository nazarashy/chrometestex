// Stats table class for D1 database operations
export class StatsTable {
  constructor(db) {
    this.db = db;
  }

  async createTable() {
    // Create the stats table if it doesn't exist
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        uptime INTEGER,
        adsWatched INTEGER,
        cyclesCompleted INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async insertStats(stats) {
    const statement = this.db.prepare(
      'INSERT INTO stats (ip, uptime, adsWatched, cyclesCompleted) VALUES (?, ?, ?, ?)'
    );
    return await statement.bind(
      stats.ip,
      stats.uptime,
      stats.adsWatched,
      stats.cyclesCompleted
    ).run();
  }

  async getAllStats() {
    return await this.db.prepare('SELECT * FROM stats ORDER BY timestamp DESC').all();
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Initialize the stats table
    const statsTable = new StatsTable(env.DB);
    await statsTable.createTable();
    
    try {
      if (request.method === 'POST' && path === '/api/stats') {
        return await handlePostStats(request, statsTable);
      } else if (request.method === 'GET' && path === '/api/stats') {
        return await handleGetStats(statsTable);
      } else if (request.method === 'GET' && path === '/panel') {
        return handlePanelPage();
      } else {
        return new Response('Not Found', { status: 404 });
      }
    } catch (e) {
      return new Response('Internal Server Error: ' + e.message, { status: 500 });
    }
  },
};

async function handlePostStats(request, statsTable) {
  if (request.headers.get('Content-Type') !== 'application/json') {
    return new Response('Content-Type must be application/json', { status: 400 });
  }
  
  const stats = await request.json();
  
  // Validate required fields
  if (!stats.ip || typeof stats.uptime !== 'number' || 
      typeof stats.adsWatched !== 'number' || typeof stats.cyclesCompleted !== 'number') {
    return new Response('Invalid stats data', { status: 400 });
  }
  
  try {
    await statsTable.insertStats({
      ip: stats.ip,
      uptime: stats.uptime,
      adsWatched: stats.adsWatched,
      cyclesCompleted: stats.cyclesCompleted
    });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response('Error saving stats: ' + e.message, { status: 500 });
  }
}

async function handleGetStats(statsTable) {
  try {
    const result = await statsTable.getAllStats();
    
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response('Error retrieving stats: ' + e.message, { status: 500 });
  }
}

function handlePanelPage() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Link Rotator Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    th {
      background-color: #4CAF50;
      color: white;
    }
    
    tr:hover {
      background-color: #f5f5f5;
    }
    
    .refresh-btn {
      display: block;
      margin: 20px auto;
      padding: 10px 20px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .refresh-btn:hover {
      background-color: #45a049;
    }
    
    .loading {
      text-align: center;
      padding: 20px;
      color: #666;
    }
    
    .stats-summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    
    .stat-box {
      background-color: #e9f7ef;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      min-width: 200px;
      margin: 10px;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #2e7d32;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Link Rotator Dashboard</h1>
    
    <div class="stats-summary">
      <div class="stat-box">
        <div class="stat-value" id="totalSessions">0</div>
        <div class="stat-label">Total Sessions</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" id="totalUptime">0s</div>
        <div class="stat-label">Total Uptime</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" id="totalAds">0</div>
        <div class="stat-label">Total Ads Watched</div>
      </div>
      <div class="stat-box">
        <div class="stat-value" id="totalCycles">0</div>
        <div class="stat-label">Total Cycles</div>
      </div>
    </div>
    
    <button class="refresh-btn" onclick="refreshData()">Refresh Data</button>
    
    <div id="loading" class="loading">Loading data...</div>
    <table id="statsTable" style="display: none;">
      <thead>
        <tr>
          <th>ID</th>
          <th>IP Address</th>
          <th>Uptime (s)</th>
          <th>Ads Watched</th>
          <th>Cycles Completed</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody id="statsTableBody">
      </tbody>
    </table>
  </div>

  <script>
    // Load data on page load
    document.addEventListener('DOMContentLoaded', function() {
      loadData();
      
      // Refresh data every 15 seconds
      setInterval(loadData, 15000);
    });
    
    async function loadData() {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Update summary stats
        document.getElementById('totalSessions').textContent = data.length;
        
        // Calculate total uptime, ads, and cycles
        let totalUptime = 0;
        let totalAds = 0;
        let totalCycles = 0;
        
        data.forEach(item => {
          totalUptime += item.uptime || 0;
          totalAds += item.adsWatched || 0;
          totalCycles += item.cyclesCompleted || 0;
        });
        
        document.getElementById('totalUptime').textContent = formatTime(totalUptime);
        document.getElementById('totalAds').textContent = totalAds;
        document.getElementById('totalCycles').textContent = totalCycles;
        
        // Update table
        const tableBody = document.getElementById('statsTableBody');
        tableBody.innerHTML = '';
        
        data.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = \`
            <td>\${item.id}</td>
            <td>\${item.ip}</td>
            <td>\${item.uptime}</td>
            <td>\${item.adsWatched}</td>
            <td>\${item.cyclesCompleted}</td>
            <td>\${new Date(item.timestamp).toLocaleString()}</td>
          \`;
          tableBody.appendChild(row);
        });
        
        // Show table and hide loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('statsTable').style.display = 'table';
      } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loading').textContent = 'Error loading data: ' + error.message;
      }
    }
    
    function refreshData() {
      loadData();
    }
    
    function formatTime(seconds) {
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      let result = '';
      if (days > 0) result += days + 'd ';
      if (hours > 0) result += hours + 'h ';
      if (minutes > 0) result += minutes + 'm ';
      result += secs + 's';
      
      return result.trim();
    }
  </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}