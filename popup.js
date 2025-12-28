document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const countdownTimeInput = document.getElementById('countdownTime');
  const statusDiv = document.getElementById('status');
  const uptimeSpan = document.getElementById('uptime');
  const adsWatchedSpan = document.getElementById('adsWatched');
  const cyclesCompletedSpan = document.getElementById('cyclesCompleted');
  
  let statsInterval = null;
  
  // Load saved countdown time
  chrome.storage.sync.get(['countdownTime'], function(result) {
    if (result.countdownTime) {
      countdownTimeInput.value = result.countdownTime;
    }
  });
  
  // Start button event
  startBtn.addEventListener('click', function() {
    const countdownTime = parseInt(countdownTimeInput.value);
    if (isNaN(countdownTime) || countdownTime < 5) {
      alert('Please enter a valid countdown time (minimum 5 seconds)');
      return;
    }
    
    // Update countdown time in background script
    chrome.runtime.sendMessage({
      action: 'updateCountdownTime',
      time: countdownTime
    }, function(response) {
      if (response && response.success) {
        // Start rotation
        chrome.runtime.sendMessage({ action: 'startRotation' }, function(response) {
          if (response && response.success) {
            updateUI(true);
            startStatsUpdate();
          }
        });
      }
    });
  });
  
  // Stop button event
  stopBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'stopRotation' }, function(response) {
      if (response && response.success) {
        updateUI(false);
        if (statsInterval) {
          clearInterval(statsInterval);
          statsInterval = null;
        }
      }
    });
  });
  
  // Update UI based on rotation status
  function updateUI(isActive) {
    if (isActive) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
      statusDiv.textContent = 'Status: Active';
      statusDiv.className = 'status active';
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      statusDiv.textContent = 'Status: Stopped';
      statusDiv.className = 'status inactive';
    }
  }
  
  // Start updating stats
  function startStatsUpdate() {
    // Update immediately
    updateStats();
    
    // Then update every second
    if (statsInterval) {
      clearInterval(statsInterval);
    }
    
    statsInterval = setInterval(updateStats, 1000);
  }
  
  // Update stats from background script
  function updateStats() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
      if (response) {
        // Update UI elements
        uptimeSpan.textContent = formatTime(response.uptime || 0);
        adsWatchedSpan.textContent = response.adsWatched || 0;
        cyclesCompletedSpan.textContent = response.cyclesCompleted || 0;
        
        // Update status if needed
        updateUI(response.isRotating);
        
        // Update countdown time input if it changed elsewhere
        if (countdownTimeInput.value != response.countdownTime) {
          countdownTimeInput.value = response.countdownTime;
        }
      }
    });
  }
  
  // Format time in seconds to human-readable format
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
  
  // Initial UI update
  chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
    if (response) {
      updateUI(response.isRotating);
      uptimeSpan.textContent = formatTime(response.uptime || 0);
      adsWatchedSpan.textContent = response.adsWatched || 0;
      cyclesCompletedSpan.textContent = response.cyclesCompleted || 0;
      
      // Start stats update if currently rotating
      if (response.isRotating) {
        startStatsUpdate();
      }
    }
  });
});