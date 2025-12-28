# Link Rotator Chrome Extension with Cloudflare Workers

## Overview
This project implements a Chrome extension called "Link Rotator" that automatically rotates between a list of URLs with ad waiting functionality and tracks statistics via Cloudflare Workers.

## Features
- Automatic rotation between a predefined list of URLs
- Ad detection and waiting functionality
- Statistics tracking (uptime, ads watched, cycles completed)
- Cloudflare Worker backend with D1 database storage
- Dashboard panel to view statistics from all active extensions

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

## Cloudflare Worker Components

### 1. Worker Script
- `worker.js`: Handles API requests and manages D1 database interactions

### 2. Configuration
- `wrangler.toml`: Configuration for deploying the Cloudflare Worker

## Functionality

### Chrome Extension
1. **URL Rotation**: Cycles through a predefined list of 15 URLs
2. **Hidden Window**: Opens URLs in a minimized, hidden browser window
3. **Ad Detection**: Checks for ad elements in the DOM (iframes with ad-related URLs, elements with ad-related IDs/classes)
4. **Ad Waiting**: Pauses rotation when ads are detected, waits 10 seconds after ad removal
5. **Statistics**: Tracks uptime, ads watched, and cycles completed
6. **Badge Indicator**: Shows remaining time with color coding (green for normal, red for ad waiting)
7. **API Communication**: Sends statistics to Cloudflare Worker periodically

### Cloudflare Worker
1. **API Endpoints**:
   - POST `/api/stats`: Receive statistics from extensions
   - GET `/api/stats`: Retrieve all statistics
   - GET `/panel`: Serve dashboard UI
2. **Database**: Stores statistics in D1 database
3. **Dashboard**: Web interface to view statistics from all active extensions

## Installation and Setup

### Chrome Extension
1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extension directory
4. Configure the Cloudflare Worker endpoint URL in `background.js`

### Cloudflare Worker
1. Install Wrangler CLI: `npm install -g wrangler`
2. Update `wrangler.toml` with your account information
3. Create D1 database: `wrangler d1 create link-rotator-db`
4. Update `wrangler.toml` with the generated database ID
5. Deploy the worker: `wrangler deploy`

## Configuration
- Update the `WORKER_ENDPOINT` in `background.js` with your deployed worker URL
- Adjust the countdown time in the popup interface
- Modify the URL list in `background.js` if needed

## Security Considerations
- The extension requires permissions for tabs, windows, and storage
- Statistics are sent to the Cloudflare Worker for aggregation
- IP addresses are collected for statistical purposes only

## Technologies Used
- JavaScript/HTML/CSS for the Chrome extension
- Cloudflare Workers for serverless backend
- Cloudflare D1 for database storage
- Manifest V3 for Chrome extension compatibility