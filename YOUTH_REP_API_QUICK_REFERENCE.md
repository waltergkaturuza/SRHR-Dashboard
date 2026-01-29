# Youth Representative API - Quick Reference

## Base URL
```
http://localhost:5000/api          # Development
https://your-app.onrender.com/api  # Production
```

## Authentication
Add to request headers:
```
Authorization: Bearer <your_token>
```

Get token:
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "your_password"
}
```

## Endpoints

### 1. Get All Districts with Youth Info
```bash
GET /api/districts/youth-info
```

**No auth required**

**Response:**
```json
[
  {
    "id": 1,
    "name": "Glen View",
    "youth_rep_name": "Tinotenda Craig Marimo",
    "youth_rep_title": "YPNHW District Facilitator",
    "health_platforms": ["District Health Committee", "..."],
    "center": [31.0212, -17.8452]
  }
]
```

### 2. Get District by ID
```bash
GET /api/districts/{id}/youth-info
```

**Auth: Editor/Admin required**

### 3. Update District by ID
```bash
PUT /api/districts/{id}/youth-info
Authorization: Bearer <token>
Content-Type: application/json

{
  "youth_rep_name": "John Doe",
  "youth_rep_title": "District Facilitator",
  "health_platforms": ["Platform 1", "Platform 2"]
}
```

**Auth: Editor/Admin required**

### 4. Get District by Name
```bash
GET /api/districts/name/{district_name}/youth-info
```

**Example:**
```bash
curl http://localhost:5000/api/districts/name/Glen%20View/youth-info
```

**No auth required for GET**

### 5. Update District by Name
```bash
PUT /api/districts/name/{district_name}/youth-info
Authorization: Bearer <token>
Content-Type: application/json

{
  "youth_rep_name": "Jane Smith",
  "youth_rep_title": "Youth Coordinator",
  "health_platforms": ["Committee A", "Committee B"]
}
```

**Auth: Editor/Admin required**

### 6. Get Boundaries (includes youth info)
```bash
GET /api/boundaries
```

**No auth required**

**Returns:** Full boundary geometry + youth info

## cURL Examples

### Get All Districts
```bash
curl http://localhost:5000/api/districts/youth-info
```

### Update District
```bash
# 1. Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# 2. Update district
curl -X PUT http://localhost:5000/api/districts/name/Glen%20View/youth-info \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "youth_rep_name": "Tinotenda Craig Marimo",
    "youth_rep_title": "YPNHW District Facilitator",
    "health_platforms": [
      "District Health Committee",
      "District Aids Committee"
    ]
  }'
```

## JavaScript/Fetch Examples

### Get Districts
```javascript
const response = await fetch('http://localhost:5000/api/districts/youth-info');
const districts = await response.json();
console.log(districts);
```

### Update District
```javascript
// Login
const loginRes = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});
const { token } = await loginRes.json();

// Update
const updateRes = await fetch(
  'http://localhost:5000/api/districts/name/Glen View/youth-info',
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      youth_rep_name: 'New Name',
      youth_rep_title: 'New Title',
      health_platforms: ['Platform 1', 'Platform 2']
    })
  }
);
const result = await updateRes.json();
```

## Python Examples

### Get Districts
```python
import requests

response = requests.get('http://localhost:5000/api/districts/youth-info')
districts = response.json()
print(districts)
```

### Update District
```python
import requests

# Login
login_response = requests.post(
    'http://localhost:5000/api/auth/login',
    json={'username': 'admin', 'password': 'admin123'}
)
token = login_response.json()['token']

# Update
update_response = requests.put(
    'http://localhost:5000/api/districts/name/Glen View/youth-info',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'youth_rep_name': 'New Name',
        'youth_rep_title': 'New Title',
        'health_platforms': ['Platform 1', 'Platform 2']
    }
)
print(update_response.json())
```

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid data) |
| 401 | Unauthorized (login required) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (district doesn't exist) |
| 500 | Server Error |

## Common Errors

### "Authentication required"
**Solution:** Add `Authorization: Bearer <token>` header

### "District not found"
**Solution:** Check district name spelling (case-insensitive)

### "Invalid token" or "Expired token"
**Solution:** Login again to get fresh token

### "Insufficient permissions"
**Solution:** Use admin or editor account

## Data Format

### Health Platforms
Must be an array of strings:
```json
{
  "health_platforms": [
    "District Health Committee",
    "District Aids Committee",
    "Child Protection Committee"
  ]
}
```

❌ **Wrong:**
```json
{
  "health_platforms": "District Health Committee, District Aids Committee"
}
```

### Optional Fields
All fields are optional when updating:
```json
{
  "youth_rep_name": "John Doe"
  // other fields not changed
}
```

## Testing Tips

1. **Use Postman/Insomnia** for testing APIs
2. **Check browser DevTools** Network tab for errors
3. **Check backend logs** for detailed error messages
4. **Test with curl** for quick verification

## Quick Setup Commands

```bash
# 1. Add database columns
psql -d srhr_dashboard -f database/add_youth_rep_columns.sql

# 2. Seed data
python add-youth-rep-info.py

# 3. Test API
curl http://localhost:5000/api/districts/youth-info
```

## Need Help?

See `YOUTH_REPRESENTATIVE_GUIDE.md` for detailed documentation.
