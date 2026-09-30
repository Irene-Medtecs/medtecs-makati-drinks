// Medtecs Makati AI Workshop — Organizer Dashboard Logic

let organizerOrders = [];
let organizerConfig = {
  orderingOpen: true,
  orderCutoff: '2:30 PM',
  currentBatch: 'Workshop Drinks',
  organizer: 'Irene'
};

let filterState = {
  search: '',
  dept: 'all',
  drink: 'all',
  status: 'all'
};

let refreshInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved Gas URL
  const savedUrl = localStorage.getItem('medtecs_gas_url') || '';
  if (savedUrl) {
    window.MEDTECS_CONFIG.gasUrl = savedUrl;
  }

  // Populate drink filter from starter drinks or menu
  populateDrinkFilter();

  // Initial fetch
  await fetchOrdersData(false);

  // Auto refresh every 8 seconds
  refreshInterval = setInterval(() => {
    fetchOrdersData(false);
  }, 8000);
});

// ============================================================================
// 1. DATA FETCHING
// ============================================================================

async function fetchOrdersData(isManual = false) {
  const icon = document.getElementById('refreshIcon');
  if (isManual && icon) icon.classList.add('fa-spin');

  const gasUrl = window.MEDTECS_CONFIG && window.MEDTECS_CONFIG.gasUrl;
  
  if (gasUrl) {
    try {
      const [ordersRes, configRes, menuRes] = await Promise.all([
        fetch(`${gasUrl}?action=getOrders`),
        fetch(`${gasUrl}?action=getConfig`),
        fetch(`${gasUrl}?action=getMenu`)
      ]);

      if (ordersRes.ok) {
        const orderData = await ordersRes.json();
        if (orderData.success && Array.isArray(orderData.orders)) {
          organizerOrders = orderData.orders;
        }
      }

      if (configRes.ok) {
        const confData = await configRes.json();
        if (confData.success && confData.config) {
          organizerConfig = Object.assign(organizerConfig, confData.config);
        }
      }

      if (menuRes.ok) {
        const menuData = await menuRes.json();
        if (menuData.success && Array.isArray(menuData.drinks)) {
          updateDrinkFilterOptions(menuData.drinks);
        }
      }
    } catch (e) {
      console.warn('Error fetching orders from Google Apps Script', e);
    }
  }

  renderMetrics();
  renderShopSummary();
  renderOrdersTable();

  if (isManual && icon) {
    setTimeout(() => {
      icon.classList.remove('fa-spin');
      showToast('Orders refreshed from Google Sheet');
    }, 400);
  }
}

// ============================================================================
// 2. METRICS CARDS
// ============================================================================

function renderMetrics() {
  const activeOrders = organizerOrders.filter(o => o.orderStatus !== 'Cancelled');
  const totalOrders = activeOrders.length;
  const totalDrinks = activeOrders.length;
  const estimatedTotal = activeOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  document.getElementById('statTotalOrders').textContent = totalOrders;
  document.getElementById('statTotalDrinks').textContent = totalDrinks;
  document.getElementById('statEstimatedTotal').textContent = `₱${estimatedTotal.toLocaleString()}`;
}

// ============================================================================
// 3. SHOP ORDER SUMMARY (Consolidated Kitchen Tally)
// ============================================================================

function getGroupedSummary() {
  const activeOrders = organizerOrders.filter(o => o.orderStatus !== 'Cancelled');
  const groups = {};

  activeOrders.forEach(o => {
    // Unique key: Drink | Size | Sugar | Ice | Toppings
    const cleanToppings = (o.toppings && o.toppings !== 'None') ? o.toppings : '';
    const key = [
      o.drink,
      o.size,
      o.sugar,
      o.ice,
      cleanToppings
    ].join('||');

    if (!groups[key]) {
      groups[key] = {
        drink: o.drink,
        size: o.size,
        sugar: o.sugar,
        ice: o.ice,
        toppings: cleanToppings,
        unitPrice: Number(o.totalPrice) || 0,
        count: 0
      };
    }
    groups[key].count += 1;
  });

  return Object.values(groups).sort((a, b) => b.count - a.count);
}

function renderShopSummary() {
  const container = document.getElementById('shopSummaryList');
  const footer = document.getElementById('shopSummaryFooter');
  const grouped = getGroupedSummary();

  if (grouped.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">No orders yet.</p>`;
    if (footer) footer.classList.add('hidden');
    return;
  }

  let totalDrinksCount = 0;
  let totalCost = 0;

  container.innerHTML = grouped.map(item => {
    const itemSubtotal = item.unitPrice * item.count;
    totalDrinksCount += item.count;
    totalCost += itemSubtotal;

    const specs = [
      item.size,
      item.sugar,
      item.ice,
      item.toppings ? `+ ${item.toppings}` : null
    ].filter(Boolean).join(' • ');

    return `
      <div class="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-orange-50/50 rounded-2xl border border-slate-200/80 transition-colors">
        <div class="flex-1 pr-4">
          <div class="font-bold font-heading text-slate-900 text-sm sm:text-base">
            ${item.drink}
          </div>
          <div class="text-xs text-slate-500 mt-0.5">
            ${specs}
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs font-semibold text-slate-500 hidden sm:inline">
            ₱${item.unitPrice} ea
          </span>
          <span class="px-3 py-1 bg-coco-orange text-white font-black text-sm rounded-xl shadow-xs">
            × ${item.count}
          </span>
        </div>
      </div>
    `;
  }).join('');

  if (footer) {
    footer.classList.remove('hidden');
    document.getElementById('summaryFooterDrinks').textContent = totalDrinksCount;
    document.getElementById('summaryFooterTotal').textContent = `₱${totalCost.toLocaleString()}`;
  }
}

function copyOrderSummary() {
  const grouped = getGroupedSummary();
  if (grouped.length === 0) {
    showToast('No orders to copy yet.');
    return;
  }

  let totalCount = 0;
  let totalCost = 0;

  let text = `MEDTECS MAKATI AI WORKSHOP — DRINK BREAK\n`;
  text += `CONSOLIDATED COCO ORDER SUMMARY\n`;
  text += `=========================================\n\n`;

  grouped.forEach(item => {
    totalCount += item.count;
    totalCost += (item.unitPrice * item.count);

    text += `${item.drink}\n`;
    text += `${item.size}\n`;
    text += `${item.sugar}\n`;
    text += `${item.ice}\n`;
    if (item.toppings) {
      text += `+ ${item.toppings}\n`;
    }
    text += `× ${item.count}\n\n`;
  });

  text += `-----------------------------------------\n`;
  text += `TOTAL DRINKS: ${totalCount}\n`;
  text += `ESTIMATED TOTAL: ₱${totalCost.toLocaleString()}\n`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('Clean order summary copied to clipboard!');
  }).catch(() => {
    showToast('Copied text!');
  });
}

// ============================================================================
// 4. ORDERS TABLE & FILTERS
// ============================================================================

function populateDrinkFilter() {
  const starter = (window.MEDTECS_CONFIG && window.MEDTECS_CONFIG.starterDrinks) || [];
  updateDrinkFilterOptions(starter);
}

function updateDrinkFilterOptions(drinks) {
  const select = document.getElementById('drinkFilter');
  if (!select) return;
  const currentVal = select.value;

  select.innerHTML = '<option value="all">All Drinks</option>' +
    drinks.map(d => `<option value="${d.name}">${d.name}</option>`).join('');

  if (currentVal) select.value = currentVal;
}

function applyFilters() {
  filterState.search = (document.getElementById('orderSearch').value || '').trim().toLowerCase();
  filterState.dept = document.getElementById('deptFilter').value;
  filterState.drink = document.getElementById('drinkFilter').value;
  filterState.status = document.getElementById('statusFilter').value;

  renderOrdersTable();
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;

  const filtered = organizerOrders.filter(o => {
    // Search by name
    if (filterState.search && !o.name.toLowerCase().includes(filterState.search)) {
      return false;
    }
    // Department
    if (filterState.dept !== 'all' && o.department !== filterState.dept) {
      return false;
    }
    // Drink
    if (filterState.drink !== 'all' && o.drink !== filterState.drink) {
      return false;
    }
    // Status
    if (filterState.status !== 'all' && o.orderStatus !== filterState.status) {
      return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="py-12 text-center text-slate-400">
          <i class="fa-solid fa-inbox text-3xl mb-2 text-slate-300"></i>
          <p class="text-sm">No orders yet.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const statusClasses = {
      'Submitted': 'bg-blue-100 text-blue-800 border-blue-200',
      'Ordered': 'bg-amber-100 text-amber-800 border-amber-200',
      'Ready': 'bg-purple-100 text-purple-800 border-purple-200',
      'Collected': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'Cancelled': 'bg-rose-100 text-rose-800 border-rose-200 line-through'
    };

    const currentClass = statusClasses[order.orderStatus] || 'bg-slate-100 text-slate-800 border-slate-200';

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3 font-bold text-slate-900">${order.name}</td>
        <td class="px-4 py-3 text-slate-600">
          <span class="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-medium text-slate-700">
            ${order.department}
          </span>
        </td>
        <td class="px-4 py-3 font-semibold text-slate-900">${order.drink}</td>
        <td class="px-3 py-3 text-slate-700">${order.size}</td>
        <td class="px-3 py-3 text-slate-700">${order.sugar}</td>
        <td class="px-3 py-3 text-slate-700">${order.ice}</td>
        <td class="px-4 py-3 text-slate-700">${order.toppings || 'None'}</td>
        <td class="px-3 py-3 font-bold text-coco-orange">₱${order.totalPrice}</td>
        <td class="px-4 py-3">
          <select onchange="updateOrderStatus('${order.orderId}', this.value)" class="text-xs font-bold px-2.5 py-1 rounded-lg border ${currentClass} focus:outline-none cursor-pointer">
            <option value="Submitted" ${order.orderStatus === 'Submitted' ? 'selected' : ''}>Submitted</option>
            <option value="Ordered" ${order.orderStatus === 'Ordered' ? 'selected' : ''}>Ordered</option>
            <option value="Ready" ${order.orderStatus === 'Ready' ? 'selected' : ''}>Ready</option>
            <option value="Collected" ${order.orderStatus === 'Collected' ? 'selected' : ''}>Collected</option>
            <option value="Cancelled" ${order.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td class="px-4 py-3 text-right text-[11px] text-slate-400 whitespace-nowrap">
          ${order.timestamp ? order.timestamp.split(' ')[1] || order.timestamp : '-'}
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================================================
// 5. ORDER STATUS UPDATE (Google Sheet Sync)
// ============================================================================

async function updateOrderStatus(orderId, newStatus) {
  // Update locally first for instantaneous UX
  const target = organizerOrders.find(o => o.orderId === orderId);
  if (target) {
    target.orderStatus = newStatus;
    renderMetrics();
    renderShopSummary();
    renderOrdersTable();
  }

  const gasUrl = window.MEDTECS_CONFIG && window.MEDTECS_CONFIG.gasUrl;
  if (!gasUrl) {
    showToast(`Order status set to ${newStatus} (local)`);
    return;
  }

  try {
    const payload = {
      action: 'updateOrderStatus',
      orderId: orderId,
      orderStatus: newStatus
    };

    const res = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast(`Status synced to Google Sheets: ${newStatus}`);
    } else {
      throw new Error(data.error || 'Failed to update');
    }
  } catch (err) {
    console.warn('POST failed, attempting GET fallback', err);
    try {
      await fetch(`${gasUrl}?action=updateOrderStatus&orderId=${orderId}&orderStatus=${encodeURIComponent(newStatus)}`);
      showToast(`Status synced to Google Sheets: ${newStatus}`);
    } catch (e2) {
      showToast('Could not reach Google Sheets. Check connection.');
    }
  }
}

// ============================================================================
// 6. SETTINGS MODAL
// ============================================================================

function openConfigModal() {
  document.getElementById('cfgGasUrl').value = window.MEDTECS_CONFIG.gasUrl || '';
  document.getElementById('cfgCutoff').value = organizerConfig.orderCutoff || '2:30 PM';
  document.getElementById('cfgBatch').value = organizerConfig.currentBatch || 'Workshop Drinks';

  updateOrderingToggleBtn();
  document.getElementById('configModal').classList.remove('hidden');
}

function closeConfigModal() {
  document.getElementById('configModal').classList.add('hidden');
}

function toggleOrderingOpenState() {
  organizerConfig.orderingOpen = !organizerConfig.orderingOpen;
  updateOrderingToggleBtn();
}

function updateOrderingToggleBtn() {
  const btn = document.getElementById('cfgOrderingToggle');
  if (organizerConfig.orderingOpen) {
    btn.textContent = 'OPEN';
    btn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-600 text-white';
  } else {
    btn.textContent = 'CLOSED';
    btn.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-rose-600 text-white';
  }
}

async function saveOrganizerSettings() {
  const newGasUrl = (document.getElementById('cfgGasUrl').value || '').trim();
  const newCutoff = (document.getElementById('cfgCutoff').value || '').trim();
  const newBatch = (document.getElementById('cfgBatch').value || '').trim();

  window.MEDTECS_CONFIG.gasUrl = newGasUrl;
  localStorage.setItem('medtecs_gas_url', newGasUrl);

  organizerConfig.orderCutoff = newCutoff || '2:30 PM';
  organizerConfig.currentBatch = newBatch || 'Workshop Drinks';

  // Send to Apps Script if available
  if (newGasUrl) {
    try {
      await fetch(newGasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'setConfig',
          orderingOpen: organizerConfig.orderingOpen ? 'TRUE' : 'FALSE',
          orderCutoff: organizerConfig.orderCutoff,
          currentBatch: organizerConfig.currentBatch
        })
      });
    } catch (e) {
      console.warn('Could not sync config to Google Sheets', e);
    }
  }

  closeConfigModal();
  showToast('Settings saved successfully!');
  await fetchOrdersData(true);
}

// ============================================================================
// 7. TOAST NOTIFICATION
// ============================================================================

function showToast(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = msg;
  toast.classList.remove('translate-y-24', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 3000);
}
