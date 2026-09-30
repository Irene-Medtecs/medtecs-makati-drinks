/**
 * Medtecs Makati AI Workshop — Drink Ordering Backend
 * Google Apps Script Web API & Google Sheet Database Integration
 * 
 * Target Spreadsheet ID: 1l42PZv0x3kDcH4AO0hyjcY974C1yuyLA32xLjL3DP0g
 */

const SPREADSHEET_ID = '1l42PZv0x3kDcH4AO0hyjcY974C1yuyLA32xLjL3DP0g';

// Default Topping Price Map (authoritative backend reference)
const TOPPING_PRICES = {
  'Pearl': 20,
  'Tiny Sago': 20,
  'Sago': 20,
  'Egg Pudding': 25,
  'Pudding': 25,
  'Grass Jelly': 25,
  'Coconut Jelly': 20,
  'Nata de Coco': 20
};

/**
 * Helper to get the target spreadsheet (works container-bound or standalone)
 */
function getSpreadsheet() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && active.getId() === SPREADSHEET_ID) return active;
  } catch (e) {
    // Ignore and fallback to openById
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Formula Injection Protection
 * Prepend a single quote if string starts with dangerous spreadsheet formula triggers: =, +, -, @
 */
function sanitize(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return "'" + str;
  }
  return str;
}

/**
 * Standard JSON Response Builder (CORS Friendly)
 */
function jsonResponse(data, status = 200) {
  const payload = JSON.stringify(Object.assign({ status: status }, data));
  return ContentService.createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 1. SETUP FUNCTION — RUN ONCE (Safe to run multiple times without data loss)
// ============================================================================
function setupSpreadsheet() {
  const ss = getSpreadsheet();
  
  // 1. Setup 'Orders' Sheet
  let ordersSheet = ss.getSheetByName('Orders');
  const orderHeaders = [
    'Order ID', 'Timestamp', 'Name', 'Department', 'Drink',
    'Size', 'Sugar', 'Ice', 'Toppings', 'Base Price',
    'Topping Price', 'Total Price', 'Order Status', 'Batch', 'Last Updated'
  ];
  
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet('Orders');
  }
  
  // Verify / Add Header
  if (ordersSheet.getLastRow() === 0) {
    ordersSheet.appendRow(orderHeaders);
  } else {
    // Update header row without touching existing data rows
    ordersSheet.getRange(1, 1, 1, orderHeaders.length).setValues([orderHeaders]);
  }
  
  // Format Header
  ordersSheet.setFrozenRows(1);
  const orderHeaderRange = ordersSheet.getRange(1, 1, 1, orderHeaders.length);
  orderHeaderRange.setBackground('#1e293b') // dark slate
                  .setFontColor('#ffffff')
                  .setFontWeight('bold')
                  .setFontSize(10)
                  .setHorizontalAlignment('center');
  
  // Set column widths for readability
  const orderColWidths = [160, 160, 140, 130, 200, 90, 120, 110, 170, 90, 90, 90, 110, 140, 160];
  orderColWidths.forEach((w, idx) => ordersSheet.setColumnWidth(idx + 1, w));
  
  // 2. Setup 'Menu' Sheet
  let menuSheet = ss.getSheetByName('Menu');
  const menuHeaders = [
    'Drink ID', 'Drink Name', 'Category', 'Description', 'Regular Price',
    'Large Price', 'Image URL', 'Available', 'Sugar Options', 'Ice Options', 'Toppings'
  ];
  
  if (!menuSheet) {
    menuSheet = ss.insertSheet('Menu');
  }
  
  const menuLastRow = menuSheet.getLastRow();
  if (menuLastRow === 0) {
    menuSheet.appendRow(menuHeaders);
  } else {
    menuSheet.getRange(1, 1, 1, menuHeaders.length).setValues([menuHeaders]);
  }
  
  menuSheet.setFrozenRows(1);
  const menuHeaderRange = menuSheet.getRange(1, 1, 1, menuHeaders.length);
  menuHeaderRange.setBackground('#ea580c') // orange
                 .setFontColor('#ffffff')
                 .setFontWeight('bold')
                 .setFontSize(10)
                 .setHorizontalAlignment('center');
  
  const menuColWidths = [130, 210, 150, 260, 100, 100, 220, 90, 180, 180, 220];
  menuColWidths.forEach((w, idx) => menuSheet.setColumnWidth(idx + 1, w));
  
  // Populate default starter menu if Menu has no data rows
  if (menuSheet.getLastRow() <= 1) {
    const defaultSugar = '100% Regular, 70% Less Sugar, 50% Half Sugar, 30% Slight Sugar, 0% No Sugar';
    const defaultIce = 'Regular Ice, Less Ice, No Ice';
    const defaultToppings = 'Pearl, Sago, Pudding, Grass Jelly, Coconut Jelly';
    
    const starterMenu = [
      ['coco-3buddies', 'CoCo 3 Buddies Milk Tea', 'Iconic Must-Tries', 'The ultimate comfort drink: creamy milk tea with silky pudding, herbal grass jelly, and chewy pearls.', 120, 135, 'https://images.unsplash.com/photo-1558857563-b37cfb810903?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-panda', 'Panda Milk Tea', 'Iconic Must-Tries', 'Rich Taiwanese milk tea paired with classic black tapioca pearls and crunchy white agar pearls.', 110, 125, 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-taro-sago', 'Taro Milk Tea with Sago', 'Iconic Must-Tries', 'Velvety purple taro milk paired with bouncy micro-sago pearls. Velvety and deeply satisfying.', 125, 140, 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-passion-burst', 'Passion Fruit Tea Burst', 'Fresh & Fruit Tea', 'Crisp green tea infused with real passion fruit pulp & seeds, loaded with chewy pearls and nata de coco.', 115, 130, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-lemon-dunk', 'Lemon Dunk Green Tea', 'Fresh & Fruit Tea', 'An entire fresh lemon immersed and gently pressed into chilled fragrant jasmine green tea.', 110, 125, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-brown-sugar-milktea', 'Brown Sugar Pearl Milk Tea', 'Brown Sugar Crave', 'Bold black milk tea infused with warm caramelized brown sugar and soft boba.', 125, 140, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-matcha-tea', 'Matcha Milk Tea', 'Milk Tea Series', 'Earthy Japanese Uji matcha infused with smooth fresh milk and creamy richness.', 120, 135, 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-mango-yakult', 'Mango Yakult', 'Fresh & Fruit Tea', 'Tropical sweet mango puree combined with probiotic Yakult over crushed ice.', 125, 140, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-pearl-milktea', 'Classic Pearl Milk Tea', 'Milk Tea Series', 'CoCo original recipe: bold Assam black tea, smooth creamer, and freshly cooked brown sugar pearls.', 100, 115, 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings],
      ['coco-jasmine-milk-tea', 'Jasmine Green Milk Tea', 'Milk Tea Series', 'Delicate fragrant jasmine green tea base blended with smooth milk. Light and floral.', 100, 115, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80', true, defaultSugar, defaultIce, defaultToppings]
    ];
    menuSheet.getRange(2, 1, starterMenu.length, menuHeaders.length).setValues(starterMenu);
  }
  
  // 3. Setup 'App_Config' Sheet
  let configSheet = ss.getSheetByName('App_Config');
  const configHeaders = ['Config Key', 'Config Value', 'Description'];
  
  if (!configSheet) {
    configSheet = ss.insertSheet('App_Config');
  }
  
  const configLastRow = configSheet.getLastRow();
  if (configLastRow === 0) {
    configSheet.appendRow(configHeaders);
  } else {
    configSheet.getRange(1, 1, 1, configHeaders.length).setValues([configHeaders]);
  }
  
  configSheet.setFrozenRows(1);
  const configHeaderRange = configSheet.getRange(1, 1, 1, configHeaders.length);
  configHeaderRange.setBackground('#15803d') // emerald
                   .setFontColor('#ffffff')
                   .setFontWeight('bold')
                   .setFontSize(10)
                   .setHorizontalAlignment('center');
  
  configSheet.setColumnWidth(1, 170);
  configSheet.setColumnWidth(2, 260);
  configSheet.setColumnWidth(3, 300);
  
  if (configSheet.getLastRow() <= 1) {
    const starterConfig = [
      ['Event Name', 'Medtecs Makati AI Workshop', 'Title of the current event/workshop'],
      ['Currency', 'PHP', 'Currency code (PHP, ₱)'],
      ['Organizer', 'Irene', 'Lead organizer name'],
      ['Ordering Open', 'TRUE', 'Set to FALSE to close participant drink submissions'],
      ['Order Cutoff', '2:30 PM', 'Order cut-off time display'],
      ['Current Batch', 'Workshop Drinks', 'Current active order batch identifier']
    ];
    configSheet.getRange(2, 1, starterConfig.length, configHeaders.length).setValues(starterConfig);
  }
  
  Logger.log('Spreadsheet setup completed successfully!');
  return { success: true, message: 'Spreadsheet initialized successfully with Orders, Menu, and App_Config tabs.' };
}

// ============================================================================
// 2. GET API HANDLER
// ============================================================================
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || 'getConfig';
    
    // Fallback actions via GET if client browser has POST CORS restrictions
    if (action === 'createOrder') {
      return handleCreateOrder(params);
    }
    if (action === 'updateOrderStatus') {
      return handleUpdateOrderStatus(params);
    }
    if (action === 'cancelOrder') {
      return handleCancelOrder(params);
    }
    
    // Standard GET actions
    if (action === 'getMenu') {
      return handleGetMenu();
    }
    if (action === 'getOrders') {
      return handleGetOrders();
    }
    if (action === 'getConfig') {
      return handleGetConfig();
    }
    if (action === 'getSummary') {
      return handleGetSummary();
    }
    
    // Default ping
    return jsonResponse({
      success: true,
      service: 'Medtecs Makati Drink Ordering API',
      event: 'Medtecs Makati AI Workshop',
      status: 'Active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() }, 500);
  }
}

// ============================================================================
// 3. POST API HANDLER
// ============================================================================
function doPost(e) {
  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    const action = data.action || (e && e.parameter ? e.parameter.action : 'createOrder');
    
    if (action === 'createOrder') {
      return handleCreateOrder(data);
    }
    if (action === 'updateOrderStatus') {
      return handleUpdateOrderStatus(data);
    }
    if (action === 'cancelOrder') {
      return handleCancelOrder(data);
    }
    if (action === 'setConfig') {
      return handleSetConfig(data);
    }
    
    return jsonResponse({ success: false, error: 'Unknown action: ' + action }, 400);
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() }, 500);
  }
}

// ============================================================================
// 4. ACTION IMPLEMENTATIONS
// ============================================================================

/**
 * Read App_Config tab
 */
function handleGetConfig() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('App_Config');
  const config = {
    eventName: 'Medtecs Makati AI Workshop',
    currency: 'PHP',
    organizer: 'Irene',
    orderingOpen: true,
    orderCutoff: '2:30 PM',
    currentBatch: 'Workshop Drinks'
  };
  
  if (sheet && sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    rows.forEach(row => {
      const key = String(row[0]).trim();
      const val = row[1];
      if (key === 'Event Name') config.eventName = String(val);
      if (key === 'Currency') config.currency = String(val);
      if (key === 'Organizer') config.organizer = String(val);
      if (key === 'Ordering Open') config.orderingOpen = (String(val).toUpperCase() === 'TRUE');
      if (key === 'Order Cutoff') config.orderCutoff = String(val);
      if (key === 'Current Batch') config.currentBatch = String(val);
    });
  }
  
  return jsonResponse({ success: true, config: config });
}

/**
 * Read Menu tab
 */
function handleGetMenu() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Menu');
  const drinks = [];
  
  if (sheet && sheet.getLastRow() > 1) {
    const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
    rows.forEach(r => {
      const drinkId = String(r[0]).trim();
      const drinkName = String(r[1]).trim();
      if (!drinkId || !drinkName) return;
      
      const available = (r[7] === true || String(r[7]).toUpperCase() === 'TRUE');
      
      drinks.push({
        id: drinkId,
        name: drinkName,
        category: String(r[2] || 'Must-Tries').trim(),
        description: String(r[3] || '').trim(),
        priceRegular: Number(r[4]) || 110,
        priceLarge: Number(r[5]) || (Number(r[4]) + 15),
        image: String(r[6] || '').trim(),
        available: available,
        sugarOptions: String(r[8] || '').split(',').map(s => s.trim()).filter(Boolean),
        iceOptions: String(r[9] || '').split(',').map(s => s.trim()).filter(Boolean),
        toppings: String(r[10] || '').split(',').map(s => s.trim()).filter(Boolean)
      });
    });
  }
  
  return jsonResponse({ success: true, count: drinks.length, drinks: drinks });
}

/**
 * Read Orders tab
 */
function handleGetOrders() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Orders');
  const orders = [];
  
  if (sheet && sheet.getLastRow() > 1) {
    const numRows = sheet.getLastRow() - 1;
    const rows = sheet.getRange(2, 1, numRows, 15).getValues();
    
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const orderId = String(r[0]).trim();
      if (!orderId) continue;
      
      orders.push({
        rowNumber: i + 2,
        orderId: orderId,
        timestamp: r[1] instanceof Date ? Utilities.formatDate(r[1], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(r[1]),
        name: String(r[2]),
        department: String(r[3]),
        drink: String(r[4]),
        size: String(r[5]),
        sugar: String(r[6]),
        ice: String(r[7]),
        toppings: String(r[8]),
        basePrice: Number(r[9]) || 0,
        toppingPrice: Number(r[10]) || 0,
        totalPrice: Number(r[11]) || 0,
        orderStatus: String(r[12] || 'Submitted'),
        batch: String(r[13] || ''),
        lastUpdated: r[14] instanceof Date ? Utilities.formatDate(r[14], Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss') : String(r[14] || '')
      });
    }
  }
  
  // Return newest orders first
  orders.reverse();
  return jsonResponse({ success: true, count: orders.length, orders: orders });
}

/**
 * Create Order with Full Validation, Pricing Verification, and Injection Sanitization
 */
function handleCreateOrder(params) {
  // 1. Check Ordering Open state
  const configRes = JSON.parse(handleGetConfig().getContent());
  if (configRes && configRes.config && configRes.config.orderingOpen === false) {
    return jsonResponse({ success: false, error: 'Ordering is currently closed by the organizer.' }, 403);
  }
  
  const rawName = params.name || params.colleagueName;
  const rawDept = params.department || params.colleagueDept;
  const rawDrink = params.drink || params.drinkName;
  const rawSize = params.size || 'Regular';
  const rawSugar = params.sugar || '70% Less Sugar';
  const rawIce = params.ice || 'Less Ice';
  const rawToppings = params.toppings || '';
  
  if (!rawName || String(rawName).trim() === '') {
    return jsonResponse({ success: false, error: 'Name is required.' }, 400);
  }
  if (!rawDept || String(rawDept).trim() === '') {
    return jsonResponse({ success: false, error: 'Department is required.' }, 400);
  }
  if (!rawDrink || String(rawDrink).trim() === '') {
    return jsonResponse({ success: false, error: 'Drink selection is required.' }, 400);
  }
  
  // 2. Lookup Drink in Menu sheet to calculate authoritative base price
  const menuRes = JSON.parse(handleGetMenu().getContent());
  const drinkList = menuRes.drinks || [];
  
  const matchedDrink = drinkList.find(d => 
    d.id.toLowerCase() === String(params.drinkId || '').toLowerCase() ||
    d.name.toLowerCase() === String(rawDrink).trim().toLowerCase()
  );
  
  const isLarge = String(rawSize).toLowerCase().includes('large') || String(rawSize).toLowerCase() === 'l';
  let basePrice = 110; // sensible fallback
  let officialDrinkName = rawDrink;
  
  if (matchedDrink) {
    officialDrinkName = matchedDrink.name;
    basePrice = isLarge ? matchedDrink.priceLarge : matchedDrink.priceRegular;
  } else {
    // If not in menu, check if prices were passed
    basePrice = Number(params.basePrice) || (isLarge ? 135 : 120);
  }
  
  // 3. Calculate Authoritative Topping Price
  let toppingList = [];
  if (Array.isArray(rawToppings)) {
    toppingList = rawToppings;
  } else if (typeof rawToppings === 'string' && rawToppings.trim() !== '') {
    toppingList = rawToppings.split(',').map(t => t.trim()).filter(Boolean);
  }
  
  let toppingPrice = 0;
  toppingList.forEach(toppingName => {
    let matchedPrice = 20; // default topping price
    for (const [key, p] of Object.entries(TOPPING_PRICES)) {
      if (toppingName.toLowerCase().includes(key.toLowerCase())) {
        matchedPrice = p;
        break;
      }
    }
    toppingPrice += matchedPrice;
  });
  
  const totalPrice = basePrice + toppingPrice;
  
  // 4. Generate Unique Order ID: ORD-YYYYMMDD-XXX
  const now = new Date();
  const timeZone = Session.getScriptTimeZone();
  const dateStr = Utilities.formatDate(now, timeZone, 'yyyyMMdd');
  const timeStr = Utilities.formatDate(now, timeZone, 'yyyy-MM-dd HH:mm:ss');
  
  const ss = getSpreadsheet();
  let ordersSheet = ss.getSheetByName('Orders');
  if (!ordersSheet) {
    setupSpreadsheet();
    ordersSheet = ss.getSheetByName('Orders');
  }
  
  const nextOrderNumber = Math.max(1, ordersSheet.getLastRow()); // Row index based counter
  const orderId = 'ORD-' + dateStr + '-' + String(nextOrderNumber).padStart(3, '0');
  
  const currentBatch = (configRes && configRes.config && configRes.config.currentBatch) ? configRes.config.currentBatch : 'Workshop Drinks';
  
  // 5. Sanitize values to prevent formula injection
  const rowData = [
    sanitize(orderId),
    timeStr,
    sanitize(rawName),
    sanitize(rawDept),
    sanitize(officialDrinkName),
    sanitize(isLarge ? 'Large' : 'Regular'),
    sanitize(rawSugar),
    sanitize(rawIce),
    sanitize(toppingList.join(', ')),
    basePrice,
    toppingPrice,
    totalPrice,
    'Submitted',
    sanitize(currentBatch),
    timeStr
  ];
  
  // Append row
  ordersSheet.appendRow(rowData);
  
  return jsonResponse({
    success: true,
    message: 'Order received and saved to Google Sheets!',
    order: {
      orderId: orderId,
      timestamp: timeStr,
      name: rawName,
      department: rawDept,
      drink: officialDrinkName,
      size: isLarge ? 'Large' : 'Regular',
      sugar: rawSugar,
      ice: rawIce,
      toppings: toppingList.join(', '),
      basePrice: basePrice,
      toppingPrice: toppingPrice,
      totalPrice: totalPrice,
      orderStatus: 'Submitted',
      batch: currentBatch
    }
  });
}

/**
 * Update Order Status (Submitted, Ordered, Ready, Collected, Cancelled)
 */
function handleUpdateOrderStatus(params) {
  const orderId = String(params.orderId || '').trim();
  const newStatus = String(params.orderStatus || params.status || '').trim();
  
  const validStatuses = ['Submitted', 'Ordered', 'Ready', 'Collected', 'Cancelled'];
  if (!orderId) {
    return jsonResponse({ success: false, error: 'Order ID is required.' }, 400);
  }
  if (!validStatuses.includes(newStatus)) {
    return jsonResponse({ success: false, error: 'Invalid order status. Allowed: ' + validStatuses.join(', ') }, 400);
  }
  
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName('Orders');
  if (!sheet || sheet.getLastRow() <= 1) {
    return jsonResponse({ success: false, error: 'No orders found in sheet.' }, 404);
  }
  
  const numRows = sheet.getLastRow() - 1;
  const ids = sheet.getRange(2, 1, numRows, 1).getValues();
  
  let targetRow = -1;
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === orderId) {
      targetRow = i + 2;
      break;
    }
  }
  
  if (targetRow === -1) {
    return jsonResponse({ success: false, error: 'Order ' + orderId + ' not found.' }, 404);
  }
  
  const timeZone = Session.getScriptTimeZone();
  const nowStr = Utilities.formatDate(new Date(), timeZone, 'yyyy-MM-dd HH:mm:ss');
  
  sheet.getRange(targetRow, 13).setValue(sanitize(newStatus)); // Order Status column
  sheet.getRange(targetRow, 15).setValue(nowStr); // Last Updated column
  
  return jsonResponse({
    success: true,
    message: 'Order status updated successfully.',
    orderId: orderId,
    orderStatus: newStatus,
    lastUpdated: nowStr
  });
}

/**
 * Cancel Order
 */
function handleCancelOrder(params) {
  return handleUpdateOrderStatus({
    orderId: params.orderId,
    orderStatus: 'Cancelled'
  });
}

/**
 * Update Config settings
 */
function handleSetConfig(params) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName('App_Config');
  if (!sheet) {
    setupSpreadsheet();
    sheet = ss.getSheetByName('App_Config');
  }
  
  const validKeys = {
    'eventName': 'Event Name',
    'currency': 'Currency',
    'organizer': 'Organizer',
    'orderingOpen': 'Ordering Open',
    'orderCutoff': 'Order Cutoff',
    'currentBatch': 'Current Batch'
  };
  
  const numRows = sheet.getLastRow() - 1;
  if (numRows > 0) {
    const keysRange = sheet.getRange(2, 1, numRows, 2);
    const rows = keysRange.getValues();
    
    for (const [paramKey, sheetKey] of Object.entries(validKeys)) {
      if (params[paramKey] !== undefined) {
        for (let i = 0; i < rows.length; i++) {
          if (String(rows[i][0]).trim() === sheetKey) {
            sheet.getRange(i + 2, 2).setValue(sanitize(params[paramKey]));
            break;
          }
        }
      }
    }
  }
  
  return handleGetConfig();
}

/**
 * Grouped Summary calculation
 */
function handleGetSummary() {
  const ordersRes = JSON.parse(handleGetOrders().getContent());
  const orders = ordersRes.orders || [];
  
  let totalOrders = 0;
  let totalDrinks = 0;
  let estimatedTotal = 0;
  const tallyMap = {};
  
  orders.forEach(o => {
    if (o.orderStatus === 'Cancelled') return;
    
    totalOrders += 1;
    totalDrinks += 1;
    estimatedTotal += (Number(o.totalPrice) || 0);
    
    // Group identical customized drinks
    const key = [
      o.drink,
      o.size,
      o.sugar,
      o.ice,
      o.toppings ? ('+ ' + o.toppings) : ''
    ].filter(Boolean).join(' | ');
    
    if (!tallyMap[key]) {
      tallyMap[key] = {
        drink: o.drink,
        size: o.size,
        sugar: o.sugar,
        ice: o.ice,
        toppings: o.toppings,
        unitPrice: o.totalPrice,
        count: 0,
        subtotal: 0
      };
    }
    tallyMap[key].count += 1;
    tallyMap[key].subtotal += (Number(o.totalPrice) || 0);
  });
  
  const groupedItems = Object.values(tallyMap).sort((a, b) => b.count - a.count);
  
  return jsonResponse({
    success: true,
    totalOrders: totalOrders,
    totalDrinks: totalDrinks,
    estimatedTotal: estimatedTotal,
    groupedItems: groupedItems
  });
}
