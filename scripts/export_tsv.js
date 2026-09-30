const db = require('../database');
const fs = require('fs');
const path = require('path');

async function run() {
  await db.initDb();
  const orders = await db.getAllOrders();

  const headers = [
    'Order ID', 'Timestamp', 'Colleague Name', 'Department', 'Contact',
    'CoCo Drink', 'Size', 'Sweetness', 'Ice Level', 'Toppings',
    'Special Notes', 'Unit Price (PHP)', 'Quantity', 'Total Price (PHP)',
    'Status', 'Payment Status', 'Payment Method', 'Archived', 'Batch ID'
  ];

  const rows = [headers.join('\t')];
  orders.forEach(o => {
    rows.push([
      o.id,
      o.timestamp,
      o.colleagueName,
      o.department,
      o.contact,
      o.drinkName,
      o.sizeLabel,
      o.sugarLabel,
      o.iceLabel,
      o.toppingsList,
      o.specialNotes,
      o.unitPrice,
      o.quantity,
      o.totalPrice,
      o.status,
      o.paymentStatus,
      o.paymentMethod,
      o.isArchived ? 'Yes' : 'No',
      o.batchId || 'Active'
    ].join('\t'));
  });

  const tsv = rows.join('\r\n');
  const tsvPath = path.join(__dirname, '..', 'data', 'orders.tsv');
  fs.writeFileSync(tsvPath, tsv, 'utf8');
  console.log(`TSV generated at ${tsvPath} with ${orders.length} orders.`);
}

run().catch(console.error);
