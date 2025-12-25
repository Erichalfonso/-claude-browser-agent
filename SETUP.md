# Quick Setup Guide

## Step-by-Step Instructions

### 1. Install Node Dependencies (2 minutes)

```bash
cd C:\Users\erich\claude-browser-agent
npm install
```

### 2. Build the Extension (1 minute)

```bash
npm run build
```

You should see a `dist/` folder created.

### 3. Load Extension in Chrome (2 minutes)

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Toggle "Developer mode" ON (top right)
4. Click "Load unpacked"
5. Navigate to: `C:\Users\erich\claude-browser-agent\dist`
6. Click "Select Folder"

✅ Extension should now be loaded!

### 4. Get Extension ID (30 seconds)

Look at the extension card in `chrome://extensions/`. You'll see an ID like:

```
ID: abcdefghijklmnopqrstuvwxyz123456
```

**Copy this ID!** You'll need it next.

### 5. Configure Native Messaging (3 minutes)

#### A. Update the manifest file

Open: `native-host\com.claude.browser_agent.json`

Replace `EXTENSION_ID_GOES_HERE` with your actual extension ID:

```json
{
  "name": "com.claude.browser_agent",
  "description": "Native messaging host for Claude Browser Agent",
  "path": "C:\\Users\\erich\\claude-browser-agent\\native-host\\host.py",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://abcdefghijklmnopqrstuvwxyz123456/"
  ]
}
```

#### B. Register with Windows Registry

Create a new file called `register-native-host.reg` with this content:

```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.claude.browser_agent]
@="C:\\Users\\erich\\claude-browser-agent\\native-host\\com.claude.browser_agent.json"
```

**Double-click** `register-native-host.reg` to add it to the registry.

Click "Yes" when Windows asks for permission.

#### C. Make Python Script Executable

Open Command Prompt and run:

```bash
cd C:\Users\erich\claude-browser-agent\native-host
python host.py
```

If you see an error, make sure Python 3 is installed:
```bash
python --version
```

Should show: `Python 3.x.x`

Press `Ctrl+C` to stop the test.

### 6. Add Claude API Key (1 minute)

1. Get API key from: https://console.anthropic.com/
2. Click the extension icon in Chrome
3. Click the ⚙️ (settings) button
4. Paste your API key: `sk-ant-...`
5. Click "Save"

---

## Test It!

1. Go to any website (e.g., google.com)
2. Click the extension icon
3. Type: "Scroll down 500 pixels"
4. Click "Send"

You should see:
- Status bar showing "Thinking..."
- Page scrolls down
- Status updates to "Done"

---

## Troubleshooting

### "Module not found" when building

```bash
rm -rf node_modules
npm install
npm run build
```

### Extension doesn't load

- Make sure you selected the `dist/` folder, not the root folder
- Try clicking "Reload" on the extension card

### "Native messaging host not found"

- Double-check the registry entry exists:
  - Open `regedit`
  - Navigate to: `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\`
  - Should see `com.claude.browser_agent` key
- Check file path is correct (no typos)
- Make sure `allowed_origins` has YOUR extension ID

### Python script doesn't run

- Make sure Python 3 is installed: `python --version`
- On some systems, use `python3` instead of `python`
- If using `python3`, update the manifest to use full path:
  ```json
  "path": "C:\\Python39\\python.exe C:\\Users\\erich\\claude-browser-agent\\native-host\\host.py"
  ```

---

## You're Done! 🎉

The extension is ready to use. Try some commands:

- "Fill in the search box with 'AI automation'"
- "Click the first search result"
- "Scroll to the bottom of the page"
- "Upload the file C:\\Users\\erich\\Downloads\\test.pdf to the file input"

---

## Next Steps

- Read `README.md` for full documentation
- Try automating a real task
- Check `native-host/native-host.log` if file operations fail
- Use `npm run dev` for development with auto-rebuild
