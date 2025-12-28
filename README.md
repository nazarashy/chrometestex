# Link Rotator Chrome Extension

## Overview
This project implements a Chrome extension called "Link Rotator" that automatically rotates between a list of URLs with ad waiting functionality. All statistics are stored locally in the browser with no external services required.

## Features
- Automatic rotation between a predefined list of URLs
- Ad detection and waiting functionality
- Statistics tracking (uptime, ads watched, cycles completed)
- Local storage of statistics (no external services)
- Minimized browser window for rotation
- Badge indicator showing remaining time

## Chrome Extension Components

### 1. Manifest
- `manifest.json`: Configuration file for the Chrome extension (Manifest V3)

### 2. Background Script
- `background.js`: Core logic for URL rotation, ad detection, and statistics tracking

### 3. Popup Interface
- `popup.html`: User interface for controlling the extension
- `popup.js`: JavaScript for popup functionality

### 4. Icons
- `icon16.png`, `icon48.png`, `icon128.png`: Extension icons

## Functionality

### Chrome Extension
1. **URL Rotation**: Cycles through a predefined list of 15 URLs
2. **Minimized Window**: Opens URLs in a minimized browser window (always kept minimized)
3. **Ad Detection**: Checks for ad elements in the DOM (iframes with ad-related URLs, elements with ad-related IDs/classes)
4. **Ad Waiting**: Pauses rotation when ads are detected, waits 10 seconds after ad removal
5. **Statistics**: Tracks uptime, ads watched, and cycles completed (stored locally)
6. **Badge Indicator**: Shows remaining time with color coding (green for normal, red for ad waiting)

## Installation and Setup

### Chrome Extension
1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extension directory
4. The extension is ready to use with no external configuration needed

## Configuration
- Adjust the countdown time in the popup interface
- Modify the URL list in `background.js` if needed

## Security Considerations
- The extension requires permissions for tabs, windows, and storage
- All data is stored locally in the browser - no external data transmission

## Technologies Used
- JavaScript/HTML/CSS for the Chrome extension
- Manifest V3 for Chrome extension compatibility