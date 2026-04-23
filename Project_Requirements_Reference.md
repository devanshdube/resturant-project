# Restaurant Management System (RMS) - Project Reference

Is document mein project ki core requirements aur hamari discussion ke basis par feature flow mention kiya gaya hai.

---

## 1. Core Project Goal
Ek multi-tenant system banana jahan:
- **SuperAdmin:** Restaurants ko onboard aur manage kar sake.
- **Restaurant Owners/Staff:** Menu, Tables, aur Orders manage kar sakein.
- **Customers (Guests):** QR scan karke bina login ke menu dekh sakein aur order kar sakein.

---

## 2. Special Requirement: Guest QR Ordering (Multi-Session)
Ye feature sabse important hai. Iska logic niche diye gaye steps par based hoga:

### A. URL Structure for QR
Har table ka QR code ek unique URL hold karega:
`https://app-domain.com/menu/:restaurantSlug/:tableId`

### B. Table Session Concept
- **Multiple Scans:** Ek hi table par baithe multiple log (Friends/Family) agar alag-alag scan karte hain, to unka **Individual Session** banna chahiye.
- **Session Tracking:** 
    - Frontend `localStorage` check karega. Agar session nahi hai, to backend se ek naya `session_id` mangwayega.
    - Example: Table 02 par 3 log hain -> Unke IDs honge: `T2-S1`, `T2-S2`, `T2-S3`.
- **Order Attribution:** Har order item ke saath `session_id` backend par jayega taaki staff ko pata chale kisne kya mangwaya hai.

---

## 3. Backend Implementation Checklist

### Database Updates
- [ ] **`tables` table:** Table details aur QR status store karne ke liye.
- [ ] **`table_sessions` table:** Active guest sessions track karne ke liye (`id`, `table_id`, `session_id`, `status`).
- [ ] **`orders` table:** `session_id` column add karna hoga.

### API Endpoints
- [ ] **Public Menu API:** `GET /api/public/menu/:restaurantId` (Bina Auth ke).
- [ ] **Session API:** `POST /api/public/sessions/start` (Naya Session ID generate karne ke liye).
- [ ] **Public Order API:** `POST /api/public/orders/place` (Bina login ke order lene ke liye).

---

## 4. Frontend Implementation Checklist

### Customer Flow (Menu & Order)
- [ ] **URL Parsing:** URL se `restaurantSlug` aur `tableId` extract karna.
- [ ] **Guest Session Management:** `localStorage` mein `guestSessionId` save aur persist karna.
- [ ] **Cart Logic:** Order place karte waqt `restaurantId`, `tableId`, aur `guestSessionId` bhejna.
- [ ] **Live Order Tracking:** Guest ko uska apna order status (Pending/Served) dikhana.

### Staff/Admin Dashboard
- [ ] **Live Table View:** Table par active sessions aur unke alag-alag orders dikhana.
- [ ] **Billing Logic:** 
    - Separate Bills (Session-wise).
    - Merge Bill (Poore table ka ek saath).

---

## 5. Technical Note (Safety)
- Guest APIs par **Rate Limiting** lagana zaroori hai taaki koi spam orders na kar sake.
- `session_id` ko backend par validate karna hoga ki wo usi `tableId` se linked hai ya nahi.

---

**Last Updated:** 2026-04-23
**Status:** Planning & Initial Frontend Setup
