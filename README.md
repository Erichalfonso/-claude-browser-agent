# Claude Browser Agent 🤖

AI-powered browser automation using Claude's vision and reasoning capabilities. Tell it what you want to do on a webpage, and it figures out how to do it.

## Features

- ✅ **Natural language commands** - "Upload my resume to this job application"
- ✅ **Vision + reasoning** - Screenshots page, Claude decides next action
- ✅ **Local file access** - Native messaging lets it read files from your computer
- ✅ **File uploads** - Injects files directly, bypassing file picker dialogs
- ✅ **Undetectable** - Runs inside your real browser, no bot flags
- ✅ **Full automation** - Click, type, scroll, navigate, upload

## Demo Commands

```
"Fill out this form with data from C:\Users\erich\data.txt"
"Find all product prices and save to a file"
"Upload my resume from Downloads folder"
"Click through this checkout process"
"Navigate to Google and search for 'AI agents'"
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd C:\Users\erich\claude-browser-agent
npm install
```

### 2. Build the Extension

```bash
npm run build
```

This creates the `dist/` folder with the built extension.

### 3. Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `C:\Users\erich\claude-browser-agent\dist` folder

### 4. Get Your Extension ID

After loading, you'll see your extension listed with an ID like:
```
abcdefghijklmnopqrstuvwxyz123456
```

Copy this ID!

### 5. Set Up Native Messaging

#### Update the manifest:
Edit `native-host\com.claude.browser_agent.json`:
```json
{
  "name": "com.claude.browser_agent",
  "description": "Native messaging host for Claude Browser Agent",
  "path": "C:\\Users\\erich\\claude-browser-agent\\native-host\\host.py",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID_HERE/"
  ]
}
```

Replace `YOUR_EXTENSION_ID_HERE` with the ID you copied.

#### Register with Windows:

Create a registry file `register.reg`:
```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.claude.browser_agent]
@="C:\\Users\\erich\\claude-browser-agent\\native-host\\com.claude.browser_agent.json"
```

Double-click `register.reg` to add to registry.

### 6. Add Your Claude API Key

1. Click the extension icon in Chrome
2. Click the ⚙️ settings button
3. Enter your Claude API key (get one at https://console.anthropic.com/)
4. Click "Save"

---

## Usage

1. **Navigate to any webpage**
2. **Click the extension icon**
3. **Tell it what to do:**

```
"Fill in the contact form with:
Name: John Doe
Email: john@example.com
Message: Hello!"
```

```
"Upload the file C:\Users\erich\Documents\resume.pdf to the file input on this page"
```

```
"Scroll down and click the 'Load More' button until you see products under $50"
```

4. **Watch it work!**

The agent will:
- Take a screenshot
- Ask Claude what to do next
- Execute the action
- Repeat until done

---

## Project Structure

```
claude-browser-agent/
├── manifest.json              # Chrome extension config
├── package.json               # NPM dependencies
├── webpack.config.js          # Build configuration
├── tsconfig.json              # TypeScript config
│
├── popup/                     # Extension UI
│   ├── popup.html
│   ├── popup.tsx             # React component
│   └── styles.css
│
├── background/                # Agent brain
│   └── service-worker.ts     # Agent loop + Claude API
│
├── content/                   # Page interaction
│   ├── content.ts            # Message handler
│   ├── actions.ts            # Click, type, scroll, upload
│   └── screenshot.ts         # Screenshot capture
│
├── native-host/               # File system access
│   ├── host.py               # Python messaging host
│   ├── com.claude.browser_agent.json
│   └── native-host.log       # Logs
│
└── dist/                      # Built extension (after npm run build)
```

---

## How It Works

### Agent Loop

```javascript
while (not done) {
  1. Take screenshot of current page
  2. Send screenshot + goal to Claude
  3. Claude responds with next action (JSON)
  4. Execute action on page
  5. Wait 1.5 seconds
  6. Repeat
}
```

### Claude Prompt

```
"You are a browser automation agent. Goal: [user's request]

Current page: [URL]
Screenshot: [image]

What's the next action? Respond with JSON:
{
  "action": "click" | "type" | "scroll" | "navigate" | "upload",
  "selector": "CSS selector",
  "text": "text to type",
  "filepath": "C:\\path\\to\\file.pdf",
  "reasoning": "why this action",
  "done": false | true
}
"
```

### File Upload Flow

```
1. User says: "Upload resume from Downloads"
2. Agent identifies file input: <input type="file">
3. Calls native host: getFile("C:\\Users\\erich\\Downloads\\resume.pdf")
4. Native host returns base64 encoded file
5. Content script creates File object from base64
6. Injects into input.files using DataTransfer API
7. Triggers change event
8. ✅ File uploaded without opening file picker dialog!
```

---

## Development

### Watch Mode

```bash
npm run dev
```

Webpack will watch for changes and rebuild automatically.

### Reload Extension

After rebuilding:
1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Background**: `chrome://extensions/` → "Inspect views: service worker"
- **Content script**: F12 on any page, check Console
- **Native host**: Check `native-host/native-host.log`

---

## Configuration

### Change Claude Model

Edit `background/service-worker.ts`:
```typescript
const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514', // or 'claude-opus-4-5-20251101'
  max_tokens: 1024,
  messages
});
```

### Adjust Iteration Limit

Edit `background/service-worker.ts`:
```typescript
const MAX_ITERATIONS = 20; // Change this
```

### Change Wait Time

Edit `background/service-worker.ts`:
```typescript
await wait(1500); // Milliseconds between actions
```

---

## Troubleshooting

### "No such native messaging host"

- Check registry entry points to correct path
- Ensure `allowed_origins` has your extension ID
- Make sure Python is installed and in PATH
- Check `native-host.log` for errors

### "Failed to capture screenshot"

- Extension needs `activeTab` permission (should be in manifest)
- Make sure you're on a real webpage (not chrome:// pages)

### "Element not found"

- Claude might have generated an incorrect selector
- Page might have changed between screenshot and action
- Try increasing wait time between actions

### Agent Keeps Repeating

- Claude might be stuck in a loop
- Try being more specific in your request
- May need to manually stop and restart

---

## Limitations

- Maximum 20 iterations per run (to prevent infinite loops)
- Only works on `http://` and `https://` pages
- Cannot interact with Chrome internal pages (`chrome://`)
- Screenshot is visible viewport only (not full page)
- Native messaging requires manual registry setup

---

## Future Improvements

- [ ] Workflow recording/replay (run workflows without API calls)
- [ ] Better selector generation (currently uses simple CSS)
- [ ] Full page screenshots with html2canvas
- [ ] User accounts + cloud storage for workflows
- [ ] Team collaboration features
- [ ] Automatic retry on failure
- [ ] Better error messages
- [ ] Visual feedback on page (highlight elements before clicking)

---

## Tech Stack

**Extension:**
- TypeScript
- React 18
- Chrome Manifest V3
- Webpack 5

**Backend:**
- Claude API (Anthropic)
- Python native messaging

**APIs:**
- Chrome Extensions API
- Chrome Tabs API
- Claude Messages API

---

## License

MIT

---

## Support

For issues, check:
1. `native-host/native-host.log` (file access errors)
2. Chrome console (F12) on the page
3. Extension service worker console (`chrome://extensions/`)
4. Popup console (right-click icon → Inspect)

---

## Credits

Built with ❤️ using Claude Sonnet 4.5

Inspired by the need to automate boring web tasks!
