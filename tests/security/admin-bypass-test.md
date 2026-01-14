# Admin API Bypass Prevention Test

## Test: USER cannot access ADMIN endpoints

### 1. Create a regular USER account
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### 2. Login as USER to get session
```bash
curl -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "password123"
  }'
```

### 3. Try to access /admin page (should redirect to login)
```bash
curl -I http://localhost:3000/admin
# Expected: 307 Redirect to /auth/login
```

### 4. Try to access future admin API endpoints
```bash
curl -X GET http://localhost:3000/api/admin/tickers \
  -H "Cookie: next-auth.session-token=USER_SESSION_TOKEN"
# Expected: 401 Unauthorized or 403 Forbidden
```

## Test Results Expected:
- ✅ USER cannot access /admin routes (middleware blocks)
- ✅ USER cannot call admin API endpoints (session role check)
- ✅ Only ADMIN role can access admin functionality
- ✅ Proper HTTP status codes returned (401/403)

## Security Verification:
1. Middleware checks `token?.role === 'ADMIN'` for /admin routes
2. API routes use `getServerSession()` to verify authentication
3. Role-based access control prevents privilege escalation
4. No client-side role checks that can be bypassed