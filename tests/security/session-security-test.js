// Session Security Test - Run in browser console after login

// 1. Check cookie security attributes
console.log('=== Cookie Security Test ===');
const cookies = document.cookie.split(';');
const authCookies = cookies.filter(c => c.includes('next-auth'));
console.log('Auth cookies:', authCookies);

// Check for security attributes (these should be set by NextAuth)
// - httpOnly: Cannot be accessed via JavaScript (good for security)
// - secure: Only sent over HTTPS in production
// - sameSite: CSRF protection

// 2. Test session expiration
console.log('=== Session Expiration Test ===');
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('Current session:', session);
    if (session.expires) {
      const expiryDate = new Date(session.expires);
      const now = new Date();
      const timeLeft = expiryDate - now;
      console.log('Session expires in:', Math.round(timeLeft / 1000 / 60), 'minutes');
    }
  });

// 3. Test unauthorized access after logout
console.log('=== Unauthorized Access Test ===');
// This should be run after signing out
fetch('/api/watchlist')
  .then(r => r.json())
  .then(data => {
    if (data.error === 'Unauthorized') {
      console.log('✅ Unauthorized access properly blocked');
    } else {
      console.log('❌ Security issue: unauthorized access allowed');
    }
  });

/* Expected Results:
 * ✅ Cookies have httpOnly flag (not accessible via document.cookie)
 * ✅ Cookies have secure flag in production
 * ✅ Cookies have sameSite=lax for CSRF protection
 * ✅ Session has reasonable expiration time
 * ✅ API calls fail with 401 after logout
 */