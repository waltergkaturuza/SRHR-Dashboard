# Youth Representative Feature - Implementation Checklist

Use this checklist to ensure proper implementation of the Youth Representative feature.

## ✅ Pre-Implementation

- [ ] Backup your database before making changes
- [ ] Ensure PostgreSQL is running
- [ ] Verify you have admin access to the system
- [ ] Backend API is running and accessible
- [ ] Frontend development server is running (if testing UI)

## 📦 Database Setup

### Step 1: Add New Columns
- [ ] Locate the migration file: `database/add_youth_rep_columns.sql`
- [ ] Run migration on your database:
  ```bash
  psql -d your_database_name -f database/add_youth_rep_columns.sql
  ```
- [ ] Verify columns were added:
  ```sql
  \d district_boundaries
  ```
- [ ] Confirm you see: `youth_rep_name`, `youth_rep_title`, `health_platforms`

### Step 2: Seed Initial Data
Choose ONE method:

#### Option A: SQL Script
- [ ] Review `database/seed_youth_reps.sql`
- [ ] Customize district names if needed
- [ ] Run the script:
  ```bash
  psql -d your_database_name -f database/seed_youth_reps.sql
  ```
- [ ] Verify data was inserted (check the SELECT output)

#### Option B: Python Script
- [ ] Ensure backend is running on http://localhost:5000
- [ ] Review `add-youth-rep-info.py` and customize if needed
- [ ] Run the script:
  ```bash
  python add-youth-rep-info.py
  ```
  Or double-click `add-youth-rep-info.bat`
- [ ] Enter your admin credentials
- [ ] Verify success messages

## 🔌 Backend Verification

### Step 3: Test API Endpoints
- [ ] Test health check:
  ```bash
  curl http://localhost:5000/api/health
  ```
- [ ] Test get all districts:
  ```bash
  curl http://localhost:5000/api/districts/youth-info
  ```
- [ ] Verify response contains youth_rep_name and health_platforms
- [ ] Test get specific district:
  ```bash
  curl http://localhost:5000/api/districts/name/Glen%20View/youth-info
  ```
- [ ] Test authentication (login):
  ```bash
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"your_password"}'
  ```
- [ ] Save the token from response

### Step 4: Test Update Endpoint
- [ ] Get auth token from previous step
- [ ] Test update (replace YOUR_TOKEN):
  ```bash
  curl -X PUT http://localhost:5000/api/districts/name/Glen%20View/youth-info \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"youth_rep_name":"Test Name","youth_rep_title":"Test Title","health_platforms":["Test Platform"]}'
  ```
- [ ] Verify success response
- [ ] Check database to confirm update

## 🎨 Frontend Integration

### Step 5: Add React Component
- [ ] Verify files exist:
  - [ ] `src/components/YouthRepManagement.jsx`
  - [ ] `src/components/YouthRepManagement.css`
- [ ] Review and customize styling if needed
- [ ] Update API_BASE_URL if different from default

### Step 6: Add to Navigation
- [ ] Open your main App.jsx or routing file
- [ ] Import the component:
  ```javascript
  import YouthRepManagement from './components/YouthRepManagement';
  ```
- [ ] Add route (if using React Router):
  ```javascript
  <Route path="/admin/youth-reps" element={<YouthRepManagement />} />
  ```
- [ ] OR add to your admin dashboard component directly
- [ ] Add navigation link in your menu/sidebar

### Step 7: Test Frontend
- [ ] Navigate to the Youth Rep Management page
- [ ] Verify districts table loads
- [ ] Check that youth representative names display correctly
- [ ] Hover over platform counts to see tooltips
- [ ] Click "Edit" on a district
- [ ] Try editing fields
- [ ] Add a health platform
- [ ] Remove a health platform
- [ ] Save changes
- [ ] Verify success message
- [ ] Refresh page and confirm changes persist

## 🔒 Security & Permissions

### Step 8: Verify Access Control
- [ ] Logout of admin account
- [ ] Try to access /api/districts/1/youth-info (should work for GET)
- [ ] Try to PUT update (should fail without auth)
- [ ] Login as editor user
- [ ] Verify editor can update districts
- [ ] Login as viewer user
- [ ] Verify viewer cannot update (should get 403 error)

## 📊 Data Verification

### Step 9: Verify All Districts
- [ ] Get list of all districts:
  ```bash
  curl http://localhost:5000/api/districts/youth-info
  ```
- [ ] Confirm expected districts are present:
  - [ ] Glen View (Tinotenda Craig Marimo)
  - [ ] Chitungwiza (Leroy Ndambi)
  - [ ] Mbare (Nokutenda Mukorera)
  - [ ] Dzivarasekwa (Munashe Kawanje)
  - [ ] Mufakose
  - [ ] Budiriro
  - [ ] Glaudina
  - [ ] Belvedere

### Step 10: Check Health Platforms
- [ ] Verify Glen View has 4 platforms
- [ ] Verify Chitungwiza has 3 platforms
- [ ] Verify Mbare has 3 platforms
- [ ] Verify Dzivarasekwa has 3 platforms
- [ ] Check that platforms display correctly in UI

## 🧪 Integration Testing

### Step 11: End-to-End Test
- [ ] Open your application in browser
- [ ] Navigate to Youth Rep Management
- [ ] Select a district without a representative
- [ ] Click "Edit"
- [ ] Add representative name and title
- [ ] Add 2-3 health platforms
- [ ] Save changes
- [ ] Refresh the page
- [ ] Verify changes are still there
- [ ] Check database directly:
  ```sql
  SELECT name, youth_rep_name, youth_rep_title, health_platforms 
  FROM district_boundaries 
  WHERE name = 'YOUR_DISTRICT_NAME';
  ```

## 📱 Responsive Design Testing

### Step 12: Test on Different Devices
- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Check table scrolls horizontally on mobile
- [ ] Verify edit form works on mobile
- [ ] Check platform tooltips work on touch devices

## 🔍 Error Handling

### Step 13: Test Error Scenarios
- [ ] Try to update with expired token (should fail)
- [ ] Try to update non-existent district (should get 404)
- [ ] Try to update with invalid data type (should get 400)
- [ ] Verify error messages are user-friendly
- [ ] Check console logs for detailed errors

## 📚 Documentation

### Step 14: Review Documentation
- [ ] Read `YOUTH_REPRESENTATIVE_GUIDE.md`
- [ ] Review `YOUTH_REP_FEATURE_SUMMARY.md`
- [ ] Bookmark `YOUTH_REP_API_QUICK_REFERENCE.md` for quick lookups
- [ ] Share documentation with team members

## 🚀 Production Deployment

### Step 15: Prepare for Production
- [ ] Run migration on production database
- [ ] Update API_BASE_URL in frontend to production URL
- [ ] Test all endpoints on production
- [ ] Seed production data
- [ ] Verify CORS settings allow production domain
- [ ] Test authentication flow on production
- [ ] Monitor logs for any errors

### Step 16: Post-Deployment Verification
- [ ] Visit production site
- [ ] Test Youth Rep Management page
- [ ] Verify data loads correctly
- [ ] Test edit functionality
- [ ] Check mobile responsiveness
- [ ] Monitor for any errors

## ✨ Optional Enhancements

### Future Improvements (Not Required)
- [ ] Add search/filter functionality
- [ ] Add export to CSV feature
- [ ] Add bulk import feature
- [ ] Add photos for youth representatives
- [ ] Add contact information fields
- [ ] Add history/audit log
- [ ] Add email notifications on updates
- [ ] Add data validation rules
- [ ] Add multi-language support

## 📝 Notes

### Issues Encountered:
```
[Write any issues you encounter here]
```

### Customizations Made:
```
[Document any customizations you made]
```

### Additional Districts Added:
```
[List any additional districts you added]
```

## ✅ Completion

- [ ] All checklist items completed
- [ ] Feature working correctly in development
- [ ] Feature deployed to production (if applicable)
- [ ] Team members trained on using feature
- [ ] Documentation updated with any changes

---

**Date Completed:** _______________

**Completed By:** _______________

**Sign-off:** _______________

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section in `YOUTH_REPRESENTATIVE_GUIDE.md`
2. Review error messages in browser console
3. Check backend logs
4. Verify database migration completed successfully
5. Ensure all files were created correctly

## Quick Reference

**Key Files:**
- Backend: `app_db.py`, `database/models.py`
- Frontend: `src/components/YouthRepManagement.jsx`
- SQL: `database/add_youth_rep_columns.sql`, `database/seed_youth_reps.sql`
- Scripts: `add-youth-rep-info.py`
- Docs: `YOUTH_REPRESENTATIVE_GUIDE.md`

**Key Endpoints:**
- GET `/api/districts/youth-info` - Get all districts
- PUT `/api/districts/name/{name}/youth-info` - Update district

**Test Command:**
```bash
curl http://localhost:5000/api/districts/youth-info | jq
```
