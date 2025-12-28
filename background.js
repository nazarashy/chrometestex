// List of URLs to rotate
const URL_LIST = [
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243047&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243043&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243040&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243039&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243035&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243031&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243029&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243022&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243019&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243017&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456243003&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456242997&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456242992&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456242974&autoplay=1',
  'https://vkvideo.ru/video_ext.php?oid=-198207698&id=456242908&autoplay=1'
];

// Global variables for rotation state
let isRotating = false;
let currentUrlIndex = 0;
let countdownInterval = null;
let adCheckInterval = null;
let hiddenWindow = null;
let hiddenTab = null;
let countdownTime = 30; // Default countdown time in seconds
let startTime = null;
let adsWatched = 0;
let cyclesCompleted = 0;
let remainingTime = 0;
let waitingForAd = false;



// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    countdownTime: 30,
    isRotating: false,
    startTime: null,
    adsWatched: 0,
    cyclesCompleted: 0
  });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startRotation') {
    startRotation();
    sendResponse({ success: true });
  } else if (request.action === 'stopRotation') {
    stopRotation();
    sendResponse({ success: true });
  } else if (request.action === 'updateCountdownTime') {
    countdownTime = request.time;
    chrome.storage.sync.set({ countdownTime: request.time });
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({
      isRotating,
      countdownTime,
      uptime: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
      adsWatched,
      cyclesCompleted
    });
  }
  return true; // Keep message channel open for async response
});

// Start the rotation process
async function startRotation() {
  if (isRotating) return;
  
  isRotating = true;
  currentUrlIndex = 0;
  startTime = Date.now();
  adsWatched = 0;
  cyclesCompleted = 0;
  remainingTime = countdownTime;
  
  // Create hidden window (always minimized)
  try {
    hiddenWindow = await chrome.windows.create({
      url: URL_LIST[currentUrlIndex],
      type: 'popup',
      state: 'minimized'
    });
    
    // Get the tab from the hidden window
    hiddenTab = hiddenWindow.tabs[0];
    
    // Update badge
    updateBadge();
    
    // Start countdown
    startCountdown();
    
    // Send initial stats
    sendStats();
  } catch (error) {
    console.error('Error creating hidden window:', error);
    isRotating = false;
  }
}

// Stop the rotation process
function stopRotation() {
  isRotating = false;
  
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  
  if (adCheckInterval) {
    clearInterval(adCheckInterval);
    adCheckInterval = null;
  }
  
  // Close the hidden window if it exists
  if (hiddenWindow && hiddenWindow.id) {
    chrome.windows.remove(hiddenWindow.id);
  }
  
  // Clear badge
  chrome.action.setBadgeText({ text: '' });
  
  // Reset variables
  hiddenWindow = null;
  hiddenTab = null;
  startTime = null;
  remainingTime = 0;
  waitingForAd = false;
}

// Start the countdown timer
function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(async () => {
    if (!isRotating) return;
    
    remainingTime--;
    
    if (remainingTime <= 0) {
      // Check for ads before moving to next URL
      const hasAds = await checkForAds();
      if (hasAds) {
        waitingForAd = true;
        // Pause countdown and start ad checking
        clearInterval(countdownInterval);
        startAdCheck();
      } else {
        // Move to next URL
        moveToNextUrl();
      }
    }
    
    updateBadge();
  }, 1000);
}

// Check for ads on the current page
async function checkForAds() {
  try {
    // Execute content script to check for ads
    const result = await chrome.scripting.executeScript({
      target: { tabId: hiddenTab.id },
      func: checkAdsInDOM
    });
    
    return result && result[0] && result[0].result ? true : false;
  } catch (error) {
    console.error('Error checking for ads:', error);
    return false; // If we can't check, assume no ads to avoid getting stuck
  }
}

// Function to check for ads in the DOM (this will be executed in the content script context)
function checkAdsInDOM() {
  // Look for ad-related iframes
  const adIframes = document.querySelectorAll('iframe[src*="doubleclick"], iframe[src*="googlesyndication"], iframe[src*="googleads"], iframe[src*="youtube.com/embed"][src*="ad"]');
  
  // Look for ad-related elements
  const adElements = document.querySelectorAll('div[id*="ad"], div[class*="ad"], ins[id*="ad"], ins[class*="ad"], [data-google-query-id]');
  
  // Check if any ad elements exist and are visible
  for (const iframe of adIframes) {
    if (iframe.offsetParent !== null) { // Element is visible
      return true;
    }
  }
  
  for (const element of adElements) {
    if (element.offsetParent !== null) { // Element is visible
      return true;
    }
  }
  
  return false;
}

// Start checking for ads periodically
function startAdCheck() {
  if (adCheckInterval) {
    clearInterval(adCheckInterval);
  }
  
  adCheckInterval = setInterval(async () => {
    if (!isRotating) {
      clearInterval(adCheckInterval);
      return;
    }
    
    const hasAds = await checkForAds();
    
    if (!hasAds) {
      // No more ads, clear the interval
      clearInterval(adCheckInterval);
      
      // Increment ads watched counter
      adsWatched++;
      
      // Wait 10 more seconds after ad removal
      setTimeout(() => {
        if (isRotating) {
          // Reset waiting state
          waitingForAd = false;
          
          // Move to next URL
          moveToNextUrl();
        }
      }, 10000); // Wait 10 seconds after ad removal
    }
  }, 1000); // Check every second
}

// Move to the next URL in the list
async function moveToNextUrl() {
  if (!isRotating) return;
  
  currentUrlIndex = (currentUrlIndex + 1) % URL_LIST.length;
  
  // Check if we completed a full cycle
  if (currentUrlIndex === 0) {
    cyclesCompleted++;
  }
  
  try {
    // Navigate to the next URL
    await chrome.tabs.update(hiddenTab.id, { url: URL_LIST[currentUrlIndex] });
    
    // Reset countdown timer
    remainingTime = countdownTime;
    
    // Update badge
    updateBadge();
    
    // Restart countdown
    startCountdown();
    
    // Send updated stats
    sendStats();
  } catch (error) {
    console.error('Error navigating to next URL:', error);
  }
}

// Update the badge with remaining time
function updateBadge() {
  if (isRotating) {
    chrome.action.setBadgeText({ text: `${remainingTime}` });
    
    // Set badge color based on state
    if (waitingForAd) {
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' }); // Red for ad waiting
    } else {
      chrome.action.setBadgeBackgroundColor({ color: '#00FF00' }); // Green for normal countdown
    }
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Store stats locally (no Cloudflare Worker)
function sendStats() {
  // Only update local storage with current stats
  const stats = {
    uptime: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
    adsWatched,
    cyclesCompleted,
    timestamp: new Date().toISOString()
  };
  
  chrome.storage.sync.set({ stats });
}



