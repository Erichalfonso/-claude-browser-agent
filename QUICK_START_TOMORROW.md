# 🚀 Quick Start Guide for Tomorrow

## ⚡ Start Here (5 Minutes)

### 1. Add Your Anthropic API Key
```bash
# Get key from: https://console.anthropic.com/
# Edit this file:
notepad C:\Users\erich\claude-browser-agent\backend\.env

# Find line:
ANTHROPIC_API_KEY="sk-ant-add-your-key-here"

# Replace with your actual key:
ANTHROPIC_API_KEY="sk-ant-api03-YOUR-ACTUAL-KEY"

# Save and close
```

### 2. Start Backend
```bash
cd C:\Users\erich\claude-browser-agent\backend
npm run dev

# Should see:
# 🚀 VLS Automation Backend running on port 8000
# 📊 Environment: development
# 🔗 Health check: http://localhost:8000/health
```

### 3. Load Extension in Chrome
1. Open Chrome
2. Go to: `chrome://extensions/`
3. Enable "Developer mode" (toggle top-right)
4. Click "Load unpacked"
5. Navigate to: `C:\Users\erich\claude-browser-agent\dist`
6. Click "Select Folder"
7. Extension should appear with name "Claude Browser Agent"

---

## 🧪 Testing (15-30 Minutes)

### Test 1: Signup
1. Click extension icon (opens side panel)
2. Should see signup form
3. Enter:
   - Full Name: Your Name
   - Email: yourname@example.com
   - Password: testpass123
4. Click "Sign Up"
5. ✅ Should see: "Account created! Welcome, Your Name!"

### Test 2: Login
1. Click ⚙️ → Logout
2. Should see login form
3. Enter:
   - Email: test@example.com
   - Password: testpass123
4. Click "Sign In"
5. ✅ Should see: "Welcome back, Test User!"

### Test 3: Token Persistence
1. While logged in, close side panel
2. Click extension icon again
3. ✅ Should be auto-logged in (no form)

### Test 4: AI Learning
1. Navigate to: https://example.com
2. Open extension
3. Type: "Click the More information link"
4. Click Send
5. ✅ Watch it work!

---

## 🔍 Verify It Worked

### Check Database
```bash
cd C:\Users\erich\claude-browser-agent\backend
npm run db:studio

# Opens: http://localhost:5555
# Look at:
# - User table (should have your new user)
# - Workflow table (should have workflow with status='learning')
# - Workflow recordedActions (should have JSON array of actions)
```

### Check Backend Logs
Look for in terminal:
```
POST /api/auth/signup 201
POST /api/auth/login 200
POST /api/workflows 201
POST /api/extension/ai-decision 200
POST /api/extension/record-action 200
```

---

## 🐛 If Something Breaks

### Backend won't start
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process if needed
taskkill /PID [PID_NUMBER] /F

# Try again
cd backend
npm run dev
```

### Extension won't load
1. Check `dist` folder exists
2. Run build again:
   ```bash
   npm run build
   ```
3. Try loading unpacked again

### Authentication fails
1. Check backend is running: `curl http://localhost:8000/health`
2. Check browser console for errors (F12)
3. Check backend terminal for errors

### AI Learning fails
1. Verify Anthropic API key is set in `.env`
2. Restart backend after adding key
3. Check backend logs for API errors
4. Verify you have API credits: https://console.anthropic.com/

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `backend/.env` | ⚠️ ADD API KEY HERE |
| `dist/` | Built extension (load in Chrome) |
| `SESSION_SUMMARY.md` | Full context from today |
| `BACKEND_SUMMARY.md` | Backend documentation |
| `INTEGRATION_GUIDE.md` | How everything connects |

---

## 🎯 Goal for Tomorrow

**Success = Working AI Learning Mode**
- User can signup/login
- Extension creates workflow
- AI analyzes page and clicks elements
- Actions recorded to database

**Time:** ~30-60 minutes

---

## 💡 Remember

- Backend URL: http://localhost:8000
- Test user: test@example.com / testpass123
- Extension is in: `C:\Users\erich\claude-browser-agent\dist`
- GitHub: https://github.com/Erichalfonso/-claude-browser-agent

**Everything is committed to GitHub ✅**

Have fun testing! 🚀
