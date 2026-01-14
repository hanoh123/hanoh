-- Watchlist Data Integrity Test
-- Run these queries in Prisma Studio or database console

-- 1. Check initial state (should be empty for new user)
SELECT * FROM watchlists WHERE "userId" = 'test-user-id';

-- 2. Add ticker to watchlist (via API call)
-- POST /api/watchlist { "tickerId": "ticker-id-1" }

-- 3. Verify insertion
SELECT w.id, w."userId", w."tickerId", w."createdAt", t.symbol, t.name
FROM watchlists w
JOIN tickers t ON w."tickerId" = t.id
WHERE w."userId" = 'test-user-id';

-- 4. Try to add same ticker again (should fail gracefully)
-- POST /api/watchlist { "tickerId": "ticker-id-1" }
-- Expected: 400 Bad Request "Ticker already in watchlist"

-- 5. Verify no duplicate was created
SELECT COUNT(*) as count FROM watchlists 
WHERE "userId" = 'test-user-id' AND "tickerId" = 'ticker-id-1';
-- Expected: count = 1

-- 6. Test unique constraint at database level
-- This should fail with constraint violation:
INSERT INTO watchlists (id, "userId", "tickerId", "createdAt") 
VALUES ('test-id', 'test-user-id', 'ticker-id-1', NOW());
-- Expected: ERROR: duplicate key value violates unique constraint

-- 7. Remove from watchlist (via API call)
-- DELETE /api/watchlist/watchlist-item-id

-- 8. Verify deletion
SELECT * FROM watchlists WHERE "userId" = 'test-user-id';
-- Expected: empty result

-- Test Results Expected:
-- ✅ Unique constraint prevents duplicates at DB level
-- ✅ API gracefully handles duplicate attempts
-- ✅ Proper foreign key relationships maintained
-- ✅ Cascade deletes work correctly
-- ✅ No orphaned records created