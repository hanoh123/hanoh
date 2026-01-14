# NextAuth Security Configuration Proof

## Cookie Security (Automatic by NextAuth)

NextAuth.js automatically sets secure cookie attributes:

```javascript
// NextAuth default cookie configuration
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,      // ✅ Prevents XSS attacks
      sameSite: 'lax',     // ✅ CSRF protection
      path: '/',
      secure: process.env.NODE_ENV === 'production' // ✅ HTTPS only in prod
    }
  },
  csrfToken: {
    name: `next-auth.csrf-token`,
    options: {
      httpOnly: true,      // ✅ Prevents XSS attacks
      sameSite: 'lax',     // ✅ CSRF protection
      path: '/',
      secure: process.env.NODE_ENV === 'production' // ✅ HTTPS only in prod
    }
  }
}
```

## Session Expiration (JWT Strategy)

Our configuration in `lib/auth.ts`:
```typescript
session: {
  strategy: 'jwt',
  // Default maxAge: 30 days
  // Default updateAge: 24 hours (session refresh)
}
```

## Password Security Verification

1. **Hashing Algorithm**: bcrypt with 12 rounds
2. **Salt**: Automatically generated per password
3. **Timing Attack Protection**: bcrypt.compare() is constant-time
4. **No plaintext storage**: Only hashed passwords in database

## Verification Commands

```bash
# 1. Check password hash in database
npx prisma studio
# Navigate to User table, verify passwordHash field is bcrypt hash

# 2. Test session security
curl -c cookies.txt -X POST http://localhost:3000/api/auth/signin/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pennystocks.com","password":"admin123"}'

# 3. Check cookie attributes
cat cookies.txt
# Should show httpOnly, secure, sameSite attributes

# 4. Test session expiration
# Wait for session to expire or manually clear cookies
curl -b cookies.txt http://localhost:3000/api/watchlist
# Should return 401 Unauthorized
```