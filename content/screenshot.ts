// Screenshot functionality using chrome.tabs.captureVisibleTab

export async function takeScreenshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'capture_screenshot' },
      (response) => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Failed to capture screenshot'));
        }
      }
    );
  });
}

// Alternative: Use html2canvas for full page screenshots (requires adding library)
// This captures the entire DOM, not just visible viewport
export async function takeFullPageScreenshot(): Promise<string> {
  // For MVP, we'll just use the visible tab screenshot
  // In future, can integrate html2canvas for full page
  return takeScreenshot();
}
