// Medtecs Makati Boba Ordering Database (SQLite3)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'medtecs_boba.db');
const db = new sqlite3.Database(DB_PATH);

// Helper to run query with Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Helper to get one row
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper to get all rows
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize tables
async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      colleague_name TEXT NOT NULL,
      department TEXT DEFAULT 'General',
      contact TEXT DEFAULT '',
      drink_id TEXT NOT NULL,
      drink_name TEXT NOT NULL,
      size TEXT NOT NULL,
      size_label TEXT NOT NULL,
      sugar TEXT NOT NULL,
      sugar_label TEXT NOT NULL,
      ice TEXT NOT NULL,
      ice_label TEXT NOT NULL,
      toppings_json TEXT DEFAULT '[]',
      toppings_list TEXT DEFAULT 'None',
      special_notes TEXT DEFAULT '',
      unit_price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_status TEXT DEFAULT 'unpaid',
      payment_method TEXT DEFAULT 'GCash',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_archived INTEGER DEFAULT 0,
      batch_id TEXT DEFAULT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_drinks INTEGER,
      total_amount REAL,
      notes TEXT DEFAULT ''
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS app_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Default configuration
  const defaultConfigs = {
    officeName: "Medtecs Main Office (Makati CBD)",
    deliveryAddress: "Makati City, Metro Manila, Philippines",
    organizerName: "Office Drink Host",
    gcashNumber: "0917-888-MEDTECS",
    mayaNumber: "0917-888-MEDTECS",
    cutOffTime: "2:30 PM",
    activeShop: "CoCo Fresh Tea & Juice"
  };

  for (const [k, v] of Object.entries(defaultConfigs)) {
    await run(`INSERT OR IGNORE INTO app_config (key, value) VALUES (?, ?)`, [k, v]);
  }

  // Seed initial sample records if orders table is completely empty
  const countRow = await get(`SELECT COUNT(*) as count FROM orders`);
  if (countRow.count === 0) {
    console.log('Seeding initial orders into SQLite database...');
    const seedOrders = [
      {
        id: "ord-101",
        colleague_name: "Carlos M.",
        department: "Finance",
        contact: "0917-555-0192",
        drink_id: "coco-3buddies",
        drink_name: "CoCo 3 Buddies Milk Tea",
        size: "large",
        size_label: "Large (700ml)",
        sugar: "50",
        sugar_label: "50% (Half Sugar)",
        ice: "less",
        ice_label: "Less Ice",
        toppings_json: "[]",
        toppings_list: "Standard (Pearls, Pudding, Grass Jelly)",
        special_notes: "Extra straw please",
        unit_price: 135,
        quantity: 1,
        total_price: 135,
        status: "pending",
        payment_status: "paid",
        payment_method: "GCash"
      },
      {
        id: "ord-102",
        colleague_name: "Bea Tan",
        department: "Marketing",
        contact: "0928-555-8831",
        drink_id: "coco-passion-burst",
        drink_name: "Passion Fruit Tea Burst",
        size: "large",
        size_label: "Large (700ml)",
        sugar: "70",
        sugar_label: "70% (Less Sugar)",
        ice: "regular",
        ice_label: "Regular Ice",
        toppings_json: JSON.stringify([{ id: "coconut-jelly", name: "Nata de Coco", price: 20 }]),
        toppings_list: "+ Nata de Coco (+₱20)",
        special_notes: "",
        unit_price: 150,
        quantity: 1,
        total_price: 150,
        status: "pending",
        payment_status: "unpaid",
        payment_method: "Cash"
      },
      {
        id: "ord-103",
        colleague_name: "Miguel R.",
        department: "Supply Chain",
        contact: "0919-555-4209",
        drink_id: "coco-3buddies",
        drink_name: "CoCo 3 Buddies Milk Tea",
        size: "large",
        size_label: "Large (700ml)",
        sugar: "50",
        sugar_label: "50% (Half Sugar)",
        ice: "less",
        ice_label: "Less Ice",
        toppings_json: "[]",
        toppings_list: "Standard (Pearls, Pudding, Grass Jelly)",
        special_notes: "",
        unit_price: 135,
        quantity: 1,
        total_price: 135,
        status: "pending",
        payment_status: "unpaid",
        payment_method: "GCash"
      },
      {
        id: "ord-104",
        colleague_name: "Samantha Lee",
        department: "Executive Office",
        contact: "0917-555-9102",
        drink_id: "coco-taro-sago",
        drink_name: "Taro Milk Tea with Sago",
        size: "regular",
        size_label: "Regular (500ml)",
        sugar: "30",
        sugar_label: "30% (Slight Sugar)",
        ice: "less",
        ice_label: "Less Ice",
        toppings_json: JSON.stringify([{ id: "pudding", name: "Egg Pudding", price: 25 }]),
        toppings_list: "+ Egg Pudding (+₱25)",
        special_notes: "Not too sweet please",
        unit_price: 150,
        quantity: 1,
        total_price: 150,
        status: "pending",
        payment_status: "paid",
        payment_method: "GCash"
      }
    ];

    for (const o of seedOrders) {
      await run(`
        INSERT INTO orders (
          id, colleague_name, department, contact, drink_id, drink_name,
          size, size_label, sugar, sugar_label, ice, ice_label,
          toppings_json, toppings_list, special_notes, unit_price,
          quantity, total_price, status, payment_status, payment_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        o.id, o.colleague_name, o.department, o.contact, o.drink_id, o.drink_name,
        o.size, o.size_label, o.sugar, o.sugar_label, o.ice, o.ice_label,
        o.toppings_json, o.toppings_list, o.special_notes, o.unit_price,
        o.quantity, o.total_price, o.status, o.payment_status, o.payment_method
      ]);
    }
  }

  console.log(`📦 SQLite database ready at: ${DB_PATH}`);
}

// Convert row format to frontend camelCase
function formatOrderRow(r) {
  let toppings = [];
  try {
    toppings = JSON.parse(r.toppings_json || '[]');
  } catch (e) {
    toppings = [];
  }
  return {
    id: r.id,
    timestamp: r.created_at,
    colleagueName: r.colleague_name,
    department: r.department,
    contact: r.contact,
    drinkId: r.drink_id,
    drinkName: r.drink_name,
    size: r.size,
    sizeLabel: r.size_label,
    sugar: r.sugar,
    sugarLabel: r.sugar_label,
    ice: r.ice,
    iceLabel: r.ice_label,
    toppings,
    toppingsList: r.toppings_list,
    specialNotes: r.special_notes,
    unitPrice: r.unit_price,
    quantity: r.quantity,
    totalPrice: r.total_price,
    status: r.status,
    paymentStatus: r.payment_status,
    paymentMethod: r.payment_method,
    isArchived: r.is_archived,
    batchId: r.batch_id
  };
}

// Get active orders
async function getActiveOrders() {
  const rows = await all(`SELECT * FROM orders WHERE is_archived = 0 ORDER BY created_at DESC`);
  return rows.map(formatOrderRow);
}

// Get all orders (including archived history)
async function getAllOrders() {
  const rows = await all(`SELECT * FROM orders ORDER BY created_at DESC`);
  return rows.map(formatOrderRow);
}

// Insert new order
async function createOrder(data) {
  const id = 'ord-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const toppingsJson = JSON.stringify(data.toppings || []);

  await run(`
    INSERT INTO orders (
      id, colleague_name, department, contact, drink_id, drink_name,
      size, size_label, sugar, sugar_label, ice, ice_label,
      toppings_json, toppings_list, special_notes, unit_price,
      quantity, total_price, status, payment_status, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id,
    data.colleagueName.trim(),
    (data.department || 'General').trim(),
    (data.contact || '').trim(),
    data.drinkId,
    data.drinkName,
    data.size,
    data.sizeLabel,
    data.sugar,
    data.sugarLabel,
    data.ice,
    data.iceLabel,
    toppingsJson,
    data.toppingsList || 'None',
    (data.specialNotes || '').trim(),
    Number(data.unitPrice),
    Number(data.quantity) || 1,
    Number(data.totalPrice) || Number(data.unitPrice),
    'pending',
    'unpaid',
    'GCash'
  ]);

  const row = await get(`SELECT * FROM orders WHERE id = ?`, [id]);
  return formatOrderRow(row);
}

// Update order status or payment
async function updateOrder(id, updates) {
  const fields = [];
  const params = [];

  if (updates.paymentStatus !== undefined) {
    fields.push(`payment_status = ?`);
    params.push(updates.paymentStatus);
  }
  if (updates.status !== undefined) {
    fields.push(`status = ?`);
    params.push(updates.status);
  }
  if (updates.paymentMethod !== undefined) {
    fields.push(`payment_method = ?`);
    params.push(updates.paymentMethod);
  }

  if (fields.length === 0) return null;

  params.push(id);
  await run(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`, params);
  const row = await get(`SELECT * FROM orders WHERE id = ?`, [id]);
  return row ? formatOrderRow(row) : null;
}

// Delete order
async function deleteOrder(id) {
  const result = await run(`DELETE FROM orders WHERE id = ?`, [id]);
  return result.changes > 0;
}

// Archive current batch
async function archiveCurrentBatch() {
  const activeOrders = await all(`SELECT * FROM orders WHERE is_archived = 0`);
  if (activeOrders.length === 0) {
    return { success: true, count: 0 };
  }

  const batchId = 'batch-' + Date.now();
  const totalDrinks = activeOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const totalAmount = activeOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

  await run(`
    INSERT INTO batches (id, total_drinks, total_amount)
    VALUES (?, ?, ?)
  `, [batchId, totalDrinks, totalAmount]);

  await run(`
    UPDATE orders SET is_archived = 1, batch_id = ? WHERE is_archived = 0
  `, [batchId]);

  return { success: true, batchId, totalDrinks, totalAmount };
}

// Get aggregate summary via SQL
async function getSummary() {
  const stats = await get(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(quantity), 0) as total_drinks,
      COALESCE(SUM(total_price), 0) as total_amount,
      COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END), 0) as paid_amount,
      COALESCE(SUM(CASE WHEN payment_status != 'paid' THEN total_price ELSE 0 END), 0) as unpaid_amount,
      COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count,
      COUNT(CASE WHEN payment_status != 'paid' THEN 1 END) as unpaid_count
    FROM orders
    WHERE is_archived = 0
  `);

  // GrabFood Tally Grouping via SQL
  const tallyRows = await all(`
    SELECT
      drink_name,
      size_label as size,
      sugar_label as sugar,
      ice_label as ice,
      toppings_list as toppings,
      unit_price,
      SUM(quantity) as quantity,
      SUM(total_price) as total_price,
      GROUP_CONCAT(colleague_name, ', ') as colleagues_concat
    FROM orders
    WHERE is_archived = 0
    GROUP BY drink_name, size_label, sugar_label, ice_label, toppings_list
    ORDER BY quantity DESC, drink_name ASC
  `);

  const tallies = tallyRows.map(t => ({
    drinkName: t.drink_name,
    size: t.size,
    sugar: t.sugar,
    ice: t.ice,
    toppings: t.toppings,
    unitPrice: t.unit_price,
    quantity: t.quantity,
    totalPrice: t.total_price,
    colleagues: t.colleagues_concat ? t.colleagues_concat.split(', ') : []
  }));

  return {
    totalOrders: stats.total_orders,
    totalDrinks: stats.total_drinks,
    totalAmount: stats.total_amount,
    paidAmount: stats.paid_amount,
    unpaidAmount: stats.unpaid_amount,
    paidCount: stats.paid_count,
    unpaidCount: stats.unpaid_count,
    tallies
  };
}

// Config functions
async function getConfig() {
  const rows = await all(`SELECT key, value FROM app_config`);
  const config = {};
  rows.forEach(r => { config[r.key] = r.value; });
  return config;
}

async function setConfig(updates) {
  for (const [k, v] of Object.entries(updates)) {
    await run(`INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)`, [k, String(v)]);
  }
  return getConfig();
}

// Get batch history
async function getBatches() {
  return await all(`SELECT * FROM batches ORDER BY archived_at DESC`);
}

// Database Explorer: Get all tables with metadata and row counts
async function getTablesWithMeta() {
  const tables = await all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
  const meta = [];

  for (const t of tables) {
    const columns = await all(`PRAGMA table_info(${t.name})`);
    const countRow = await get(`SELECT COUNT(*) as count FROM ${t.name}`);
    meta.push({
      name: t.name,
      rowCount: countRow ? countRow.count : 0,
      columns: columns.map(c => ({
        name: c.name,
        type: c.type,
        notnull: c.notnull === 1,
        pk: c.pk === 1
      }))
    });
  }

  return meta;
}

// Database Explorer: Get table rows
async function getTableData(tableName, limit = 100) {
  // Sanitize table name against known tables
  const validTables = ['orders', 'batches', 'app_config'];
  if (!validTables.includes(tableName)) {
    throw new Error('Invalid table name');
  }
  return await all(`SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT ?`, [limit]);
}

// Database Explorer: Execute custom SQL
async function executeSql(sql) {
  const trimmed = sql.trim();
  if (trimmed.toUpperCase().startsWith('SELECT') || trimmed.toUpperCase().startsWith('PRAGMA')) {
    const rows = await all(trimmed);
    return { type: 'select', rows, count: rows.length };
  } else {
    const result = await run(trimmed);
    return { type: 'mutation', changes: result.changes, lastID: result.lastID };
  }
}

module.exports = {
  db,
  initDb,
  getActiveOrders,
  getAllOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  archiveCurrentBatch,
  getSummary,
  getConfig,
  setConfig,
  getBatches,
  getTablesWithMeta,
  getTableData,
  executeSql,
  DB_PATH
};

