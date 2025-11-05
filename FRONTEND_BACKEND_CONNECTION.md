# 🔗 Connecting Frontend to Backend

## Quick Setup Guide

Your frontend needs to know where your backend API is deployed.

---

## 🎯 **Step 1: Get Your Backend URL**

From Render dashboard, find your backend service URL:

```
Example: https://srhr-dashboard-api-abcd.onrender.com
```

---

## 🔧 **Step 2: Update src/config.js**

Open `src/config.js` and replace `'https://your-backend-name.onrender.com'` with your actual backend URL:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     (import.meta.env.MODE === 'production' 
                       ? 'https://srhr-dashboard-api-abcd.onrender.com'  // ← YOUR URL HERE!
                       : 'http://localhost:5000');
```

---

## 📝 **Step 3: Push Changes**

```bash
git add .
git commit -m "Configure frontend to connect to backend API"
git push origin main
```

Render will automatically redeploy your frontend!

---

## ✅ **Step 4: Update Backend CORS**

In your backend service on Render:

1. Go to **Environment** tab
2. Update `CORS_ORIGINS`:
   ```
   https://srhr-africa-trust.onrender.com
   ```
3. Save (service will restart)

---

## 🧪 **Testing the Connection**

After both services deploy:

### **Test Backend Directly:**
```bash
curl https://your-backend-url.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "SRHR Dashboard API is running",
  "database": "connected"
}
```

### **Test Frontend:**
1. Open: https://srhr-africa-trust.onrender.com
2. Open browser console (F12)
3. Should see data loading (no 404 errors)
4. Map should display markers
5. Statistics should show numbers

---

## 🔍 **Troubleshooting**

### **Still Getting 404s?**

**Check 1:** Verify `src/config.js` has correct backend URL

**Check 2:** Ensure backend is deployed and live:
```bash
curl https://your-backend-url.onrender.com/api/health
```

**Check 3:** Check browser console for CORS errors

**Check 4:** Verify `CORS_ORIGINS` in backend includes frontend URL

---

### **CORS Errors?**

Update backend environment variable:
```
CORS_ORIGINS=https://srhr-africa-trust.onrender.com
```

---

### **Backend Not Responding?**

**Check 1:** Verify backend service is "Live" in Render

**Check 2:** Check backend logs for errors

**Check 3:** Ensure DATABASE_URL is set correctly

**Check 4:** Test health endpoint

---

## 📋 **Complete Configuration Checklist**

### **Frontend:**
- [ ] `src/config.js` has correct backend URL
- [ ] Code pushed to GitHub
- [ ] Render redeployed frontend
- [ ] No console errors in browser

### **Backend:**
- [ ] Service is "Live" on Render
- [ ] `DATABASE_URL` environment variable set
- [ ] `CORS_ORIGINS` includes frontend URL
- [ ] Health endpoint returns 200 OK

---

## 🎯 **URLs Summary**

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://srhr-africa-trust.onrender.com | User interface |
| **Backend API** | https://your-backend.onrender.com | Data & API |
| **Database** | Internal only | PostgreSQL with PostGIS |

---

## 🚀 **After Configuration**

Your dashboard will:
- ✅ Load years from database
- ✅ Display map with markers
- ✅ Show statistics cards
- ✅ Render trend charts
- ✅ Allow data uploads
- ✅ Switch themes (dark/light)

---

**Last Updated**: November 2025  
**Status**: Configuration Required

