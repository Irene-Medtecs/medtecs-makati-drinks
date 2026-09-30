# 🧋 Medtecs Makati — Office Boba & Drink Ordering System

A fast, responsive web application and **SQLite Database** built for colleagues at **Medtecs Main Office in Makati City, Philippines** to submit drink orders from **CoCo Fresh Tea & Juice**, and for the office organizer/host to consolidate orders for GrabFood / Foodpanda, track GCash payments, and export order history.

---

## 🗄️ Database Architecture (SQLite3)

The application now runs on an **ACID-compliant relational SQLite3 database**:
- **Database File:** `data/medtecs_boba.db`
- **Zero Configuration:** Automatically created, indexed, and maintained on startup.

### Relational Schema:
1. `orders`:
   - `id` (TEXT, PRIMARY KEY): Unique order reference.
   - `colleague_name` (TEXT, NOT NULL): Colleague who submitted the order.
   - `department` (TEXT): Team / Floor (Finance, Operations, Marketing, Supply Chain, etc.).
   - `contact` (TEXT): Colleague's GCash or contact number.
   - `drink_id` & `drink_name` (TEXT): CoCo drink selection.
   - `size` & `size_label` (TEXT): Regular (500ml) or Large (700ml).
   - `sugar` & `sugar_label` (TEXT): 100%, 70%, 50%, 30%, 0%.
   - `ice` & `ice_label` (TEXT): Regular, Less Ice, No Ice, Warm.
   - `toppings_json` & `toppings_list` (TEXT): Array and serialized list of add-ons.
   - `unit_price`, `quantity`, `total_price` (REAL / INTEGER): Exact Philippine Peso (₱) amounts.
   - `payment_status` (TEXT): `'unpaid'` or `'paid'`.
   - `created_at` (DATETIME): Submission timestamp.
   - `is_archived` (INTEGER): `0` for active batch, `1` for past batches.
   - `batch_id` (TEXT): Reference to archive batch.

2. `batches`:
   - `id` (TEXT, PRIMARY KEY): Batch identifier.
   - `archived_at` (DATETIME): When the batch was closed.
   - `total_drinks` (INTEGER) & `total_amount` (REAL).

3. `app_config`:
   - Key-value configuration for host name, GCash number, and cut-off time.

---

## 🚀 Live Access & Online Links

- **Local URL:** `http://localhost:3000`
- **Online Shareable Public Link (No password needed):**  
  👉 **https://qswrh-59-124-94-106.free.pinggy.net**
- **Alternative Named Link:**  
  👉 **https://medtecs-makati-boba.loca.lt**

---

## ✨ Features

1. **Dedicated CoCo Fresh Tea & Juice Menu:**
   - 16 popular CoCo drinks categorized (Iconic Must-Tries, Classic Milk Tea, Fresh Fruit Teas, Brown Sugar, and Slushies).
   - Full interactive customizer with real-time price calculations in ₱ PHP.
2. **Instant Receipt Confirmation:**
   - Colleagues receive a confirmation card with total price and Host GCash details upon submission.
3. **GrabFood / Foodpanda Kitchen Tally:**
   - Automatic SQL aggregation groups identical drinks (`2x CoCo 3 Buddies Milk Tea, Large, 50% Sugar, Less Ice`) for fast one-handed entry on delivery apps.
4. **Export to CSV / Excel:**
   - One-click `Export CSV` button in the Organizer Dashboard downloads complete order records for finance or expense liquidation.
5. **Payment Tracker:**
   - One-tap toggle per colleague for **Paid / Unpaid**.
