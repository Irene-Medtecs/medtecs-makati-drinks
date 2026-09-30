// Medtecs Makati Drink Ordering System Frontend — CoCo Fresh Tea & Juice

let state = {
  activeTab: 'colleague',
  menu: null,
  config: null,
  orders: [],
  summary: null,
  activeCategory: 'all',
  searchQuery: '',
  selectedDrink: null,
  customization: {
    size: 'large',
    sugar: '70',
    ice: 'less',
    toppings: [],
    specialNotes: ''
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    fetchConfig(),
    fetchMenu(),
    fetchOrders()
  ]);
});

// ==========================================
// API CALLS
// ==========================================

async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    state.config = await res.json();
    renderConfigUI();
  } catch (err) {
    console.error('Failed to load config', err);
  }
}

async function fetchMenu() {
  try {
    const res = await fetch('/api/menu');
    state.menu = await res.json();
    renderDrinks();
  } catch (err) {
    console.error('Failed to load menu', err);
  }
}

async function fetchOrders() {
  try {
    const [ordersRes, summaryRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/summary')
    ]);
    state.orders = await ordersRes.json();
    state.summary = await summaryRes.json();
    updateOrderBadges();
    if (state.activeTab === 'organizer') {
      renderOrganizerDashboard();
    }
  } catch (err) {
    console.error('Failed to load orders', err);
  }
}

// ==========================================
// NAVIGATION & TABS
// ==========================================

function switchTab(tab) {
  state.activeTab = tab;
  
  const tabs = ['colleague', 'organizer', 'database'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const view = document.getElementById(`${t}View`);
    
    if (t === tab) {
      btn.className = 'nav-tab active-tab px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 relative';
      view.classList.remove('hidden');
    } else {
      btn.className = 'nav-tab inactive-tab px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 relative';
      view.classList.add('hidden');
    }
  });

  if (tab === 'organizer') {
    renderOrganizerDashboard();
  } else if (tab === 'database') {
    loadDatabaseExplorer();
  }
}

function updateOrderBadges() {
  const badge = document.getElementById('orderCountBadge');
  if (badge) {
    badge.textContent = state.orders ? state.orders.length : 0;
  }
}

function renderConfigUI() {
  if (!state.config) return;
  const cutoff = document.getElementById('cutoffDisplay');
  const cutoffReminder = document.getElementById('cutoffReminder');
  const gcash = document.getElementById('gcashHostDisplay');
  const host = document.getElementById('hostNameDisplay');
  const receiptGcash = document.getElementById('receiptGcashNumber');
  
  const cutStr = state.config.cutOffTime || '2:30 PM';
  if (cutoff) cutoff.textContent = cutStr;
  if (cutoffReminder) cutoffReminder.textContent = cutStr;
  if (gcash) gcash.textContent = state.config.gcashNumber || '0917-888-MEDTECS';
  if (host) host.textContent = state.config.organizerName || 'Host';
  if (receiptGcash) receiptGcash.textContent = state.config.gcashNumber || '0917-888-MEDTECS';
}

// ==========================================
// COLLEAGUE DRINKS MENU RENDERING
// ==========================================

function setCategoryFilter(category) {
  state.activeCategory = category;
  
  const container = document.getElementById('categoryFilterContainer');
  const buttons = container.querySelectorAll('.category-btn');
  buttons.forEach(btn => {
    btn.className = 'category-btn inactive px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all';
  });
  
  event.target.className = 'category-btn active px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm';
  renderDrinks();
}

function filterDrinks() {
  const query = document.getElementById('menuSearch').value.toLowerCase().trim();
  state.searchQuery = query;
  renderDrinks();
}

function renderDrinks() {
  const grid = document.getElementById('drinksGrid');
  if (!state.menu || !state.menu.drinks) return;

  let drinks = state.menu.drinks;

  // Filter category
  if (state.activeCategory !== 'all') {
    drinks = drinks.filter(d => d.category === state.activeCategory);
  }

  // Filter search
  if (state.searchQuery) {
    drinks = drinks.filter(d => 
      d.name.toLowerCase().includes(state.searchQuery) ||
      d.description.toLowerCase().includes(state.searchQuery)
    );
  }

  if (drinks.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i class="fa-solid fa-mug-saucer text-4xl mb-3 text-slate-300"></i>
        <p class="font-medium">No CoCo drinks matched your search</p>
        <button onclick="setCategoryFilter('all')" class="mt-2 text-xs font-bold text-coco-orange hover:underline">View all drinks</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = drinks.map(drink => {
    return `
      <div class="drink-card bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between group">
        <div>
          <!-- Thumbnail & Badges -->
          <div class="relative h-44 rounded-2xl overflow-hidden bg-slate-100 mb-4">
            <img src="${drink.image}" alt="${drink.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            ${drink.badge ? `
              <div class="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-coco-orange text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm border border-orange-100">
                ⭐ ${drink.badge}
              </div>
            ` : ''}
            <div class="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm font-mono">
              ₱${drink.priceRegular} - ₱${drink.priceLarge}
            </div>
          </div>

          <!-- Info -->
          <div>
            <div class="text-[11px] font-bold text-amber-700 uppercase tracking-wider">${drink.category.replace('-', ' ')}</div>
            <h4 class="text-base font-bold font-heading text-slate-900 mt-0.5 leading-snug">${drink.name}</h4>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">${drink.description}</p>
          </div>
        </div>

        <!-- Action Button -->
        <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-400 font-medium">Regular / Large</span>
          <button onclick="openCustomModal('${drink.id}')" class="px-4 py-2 bg-orange-50 hover:bg-coco-orange text-coco-orange hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
            <span>Select & Customize</span>
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// DRINK CUSTOMIZATION MODAL
// ==========================================

function openCustomModal(drinkId) {
  const drink = state.menu.drinks.find(d => d.id === drinkId);
  if (!drink) return;

  state.selectedDrink = drink;
  state.customization = {
    size: 'large',
    sugar: drink.defaultSugar || '70',
    ice: drink.defaultIce || 'less',
    toppings: [],
    specialNotes: ''
  };

  // Populate header info
  document.getElementById('modalDrinkImg').src = drink.image;
  document.getElementById('modalDrinkName').textContent = drink.name;
  document.getElementById('modalDrinkCategory').textContent = drink.category.toUpperCase();
  document.getElementById('modalDrinkDesc').textContent = drink.description;
  document.getElementById('modalSpecialNotes').value = '';

  renderModalOptions();
  calculateModalPrice();

  document.getElementById('customModal').classList.remove('hidden');
}

function closeCustomModal() {
  document.getElementById('customModal').classList.add('hidden');
}

function renderModalOptions() {
  const opts = state.menu.customizationOptions;
  const drink = state.selectedDrink;

  // Size Options
  const sizeContainer = document.getElementById('modalSizeGroup');
  sizeContainer.innerHTML = opts.sizes.map(s => {
    const isSelected = state.customization.size === s.id;
    const price = s.id === 'large' ? drink.priceLarge : drink.priceRegular;
    return `
      <div onclick="selectModalSize('${s.id}')" class="choice-pill flex items-center justify-between ${isSelected ? 'selected' : ''}">
        <div>
          <div class="text-xs font-bold text-slate-800">${s.name}</div>
          <div class="text-[10px] text-slate-400 font-normal">${s.badge}</div>
        </div>
        <span class="text-xs font-black text-coco-orange">₱${price}</span>
      </div>
    `;
  }).join('');

  // Sugar Options
  const sugarContainer = document.getElementById('modalSugarGroup');
  sugarContainer.innerHTML = opts.sugarLevels.map(s => {
    const isSelected = state.customization.sugar === s.id;
    return `
      <div onclick="selectModalSugar('${s.id}')" class="choice-pill text-center ${isSelected ? 'selected' : ''}">
        <div class="text-xs font-bold text-slate-800">${s.id}%</div>
        <div class="text-[10px] text-slate-500">${s.id === '100' ? 'Regular' : s.id === '70' ? 'Less' : s.id === '50' ? 'Half' : s.id === '30' ? 'Slight' : 'None'}</div>
      </div>
    `;
  }).join('');

  // Ice Options
  const iceContainer = document.getElementById('modalIceGroup');
  iceContainer.innerHTML = opts.iceLevels.map(i => {
    const isSelected = state.customization.ice === i.id;
    return `
      <div onclick="selectModalIce('${i.id}')" class="choice-pill text-center ${isSelected ? 'selected' : ''}">
        <div class="text-xs font-bold text-slate-800">${i.id === 'regular' ? 'Regular' : i.id === 'less' ? 'Less Ice' : i.id === 'no-ice' ? 'No Ice' : 'Warm'}</div>
      </div>
    `;
  }).join('');

  // Topping Options
  const toppingsContainer = document.getElementById('modalToppingsGroup');
  toppingsContainer.innerHTML = opts.toppings.map(t => {
    const isChecked = state.customization.toppings.some(item => item.id === t.id);
    return `
      <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-all ${isChecked ? 'bg-orange-50/50 border-orange-300' : ''}">
        <div class="flex items-center gap-2.5">
          <input type="checkbox" onchange="toggleModalTopping('${t.id}')" ${isChecked ? 'checked' : ''} class="w-4 h-4 text-coco-orange rounded focus:ring-coco-orange border-slate-300">
          <span class="text-xs font-medium text-slate-800">${t.name}</span>
        </div>
        <span class="text-xs font-bold text-slate-600">+₱${t.price}</span>
      </label>
    `;
  }).join('');
}

function selectModalSize(sizeId) {
  state.customization.size = sizeId;
  renderModalOptions();
  calculateModalPrice();
}

function selectModalSugar(sugarId) {
  state.customization.sugar = sugarId;
  renderModalOptions();
}

function selectModalIce(iceId) {
  state.customization.ice = iceId;
  renderModalOptions();
}

function toggleModalTopping(toppingId) {
  const topping = state.menu.customizationOptions.toppings.find(t => t.id === toppingId);
  const index = state.customization.toppings.findIndex(t => t.id === toppingId);
  
  if (index > -1) {
    state.customization.toppings.splice(index, 1);
  } else if (topping) {
    state.customization.toppings.push(topping);
  }
  
  renderModalOptions();
  calculateModalPrice();
}

function calculateModalPrice() {
  if (!state.selectedDrink) return 0;
  
  const basePrice = state.customization.size === 'large' 
    ? state.selectedDrink.priceLarge 
    : state.selectedDrink.priceRegular;
    
  const toppingsPrice = state.customization.toppings.reduce((sum, t) => sum + t.price, 0);
  const total = basePrice + toppingsPrice;
  
  document.getElementById('modalTotalPrice').textContent = `₱${total}`;
  return total;
}

// Submit Order from Modal
async function submitDrinkOrder() {
  const colleagueNameInput = document.getElementById('inputColleagueName');
  const colleagueName = colleagueNameInput.value.trim();
  
  if (!colleagueName) {
    colleagueNameInput.focus();
    colleagueNameInput.classList.add('ring-2', 'ring-rose-500');
    showToast('Please enter your name under "Your Details" first!', true);
    return;
  }
  colleagueNameInput.classList.remove('ring-2', 'ring-rose-500');

  const dept = document.getElementById('inputColleagueDept').value.trim();
  const contact = document.getElementById('inputColleagueContact').value.trim();
  const specialNotes = document.getElementById('modalSpecialNotes').value.trim();

  const drink = state.selectedDrink;
  const sizeObj = state.menu.customizationOptions.sizes.find(s => s.id === state.customization.size);
  const sugarObj = state.menu.customizationOptions.sugarLevels.find(s => s.id === state.customization.sugar);
  const iceObj = state.menu.customizationOptions.iceLevels.find(i => i.id === state.customization.ice);
  
  const totalPrice = calculateModalPrice();
  const toppingsListStr = state.customization.toppings.length > 0 
    ? state.customization.toppings.map(t => `+${t.name} (₱${t.price})`).join(', ')
    : 'None';

  const orderPayload = {
    colleagueName,
    department: dept || 'Medtecs Makati',
    contact,
    drinkId: drink.id,
    drinkName: drink.name,
    size: state.customization.size,
    sizeLabel: sizeObj ? sizeObj.name : state.customization.size,
    sugar: state.customization.sugar,
    sugarLabel: sugarObj ? sugarObj.label : `${state.customization.sugar}% Sugar`,
    ice: state.customization.ice,
    iceLabel: iceObj ? iceObj.label : state.customization.ice,
    toppings: state.customization.toppings,
    toppingsList: toppingsListStr,
    specialNotes,
    unitPrice: totalPrice,
    quantity: 1,
    totalPrice: totalPrice
  };

  const btn = document.getElementById('btnConfirmOrder');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (data.success) {
      closeCustomModal();
      showReceiptModal(data.order);
      await fetchOrders();
      showToast(`CoCo order for ${colleagueName} submitted!`);
    } else {
      showToast(data.error || 'Failed to submit order', true);
    }
  } catch (err) {
    console.error('Submit error:', err);
    showToast('Network error while submitting order', true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> Add to Group Order`;
  }
}

// ==========================================
// RECEIPT MODAL
// ==========================================

function showReceiptModal(order) {
  document.getElementById('receiptColleague').textContent = `${order.colleagueName} (${order.department})`;
  document.getElementById('receiptDrink').textContent = `${order.drinkName} (${order.sizeLabel})`;
  document.getElementById('receiptSpecs').textContent = `${order.sugarLabel}, ${order.iceLabel}${order.toppingsList !== 'None' ? `, ${order.toppingsList}` : ''}`;
  document.getElementById('receiptTotal').textContent = `₱${order.totalPrice}`;
  document.getElementById('receiptModal').classList.remove('hidden');
}

function closeReceiptModal() {
  document.getElementById('receiptModal').classList.add('hidden');
}

function viewInDashboard() {
  closeReceiptModal();
  switchTab('organizer');
}

// ==========================================
// ORGANIZER DASHBOARD RENDERING
// ==========================================

function renderOrganizerDashboard() {
  const summary = state.summary || {
    totalOrders: 0,
    totalDrinks: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    paidCount: 0,
    unpaidCount: 0,
    tallies: []
  };

  // Stat metrics
  document.getElementById('statTotalDrinks').textContent = summary.totalDrinks;
  document.getElementById('statTotalOrders').textContent = summary.totalOrders;
  document.getElementById('statTotalAmount').textContent = `₱${summary.totalAmount}`;
  document.getElementById('statPaidAmount').textContent = `₱${summary.paidAmount}`;
  document.getElementById('statPaidCount').textContent = summary.paidCount;
  document.getElementById('statUnpaidAmount').textContent = `₱${summary.unpaidAmount}`;
  document.getElementById('statUnpaidCount').textContent = summary.unpaidCount;

  // Live database stats
  updateDatabaseStats();

  // Render Tally (Grouped kitchen list for GrabFood)
  renderTallyList(summary.tallies || []);

  // Render Orders Table
  renderOrdersTable();
}

function renderTallyList(tallies) {
  const container = document.getElementById('tallyList');
  if (tallies.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center text-slate-400 text-xs">
        No orders submitted yet for this CoCo batch. Share the link with Medtecs colleagues!
      </div>
    `;
    return;
  }

  container.innerHTML = tallies.map((item) => {
    return `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 hover:bg-orange-50/40 rounded-2xl border border-slate-200/80 gap-3 transition-colors">
        <div class="flex items-start sm:items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-coco-orange text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
            ${item.quantity}x
          </div>
          <div>
            <div class="font-bold text-slate-900 text-sm font-heading">${item.drinkName}</div>
            <div class="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span class="bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">${item.size}</span>
              <span class="bg-white px-2 py-0.5 rounded border border-slate-200">${item.sugar}</span>
              <span class="bg-white px-2 py-0.5 rounded border border-slate-200">${item.ice}</span>
              ${item.toppings !== 'None' ? `<span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">${item.toppings}</span>` : ''}
            </div>
            <div class="text-[11px] text-slate-400 mt-1">
              Ordered by: <strong class="text-slate-600">${item.colleagues.join(', ')}</strong>
            </div>
          </div>
        </div>

        <div class="text-right sm:self-center">
          <span class="font-mono font-bold text-slate-900 text-sm">₱${item.totalPrice}</span>
          <div class="text-[10px] text-slate-400">₱${item.unitPrice} ea</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  const searchInput = document.getElementById('orderSearch');
  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let orders = state.orders || [];
  if (q) {
    orders = orders.filter(o => 
      o.colleagueName.toLowerCase().includes(q) ||
      o.department.toLowerCase().includes(q) ||
      o.drinkName.toLowerCase().includes(q)
    );
  }

  const tableHead = document.querySelector('#organizerView table thead');
  const viewMode = state.dashboardViewMode || 'card';

  if (viewMode === 'sheet') {
    // Google Sheets Online View
    if (tableHead) {
      tableHead.innerHTML = `
        <tr class="bg-emerald-50 text-[10px] uppercase font-mono font-bold text-emerald-900 border-b border-emerald-200">
          <th class="px-3 py-2 text-center w-10 border-r border-emerald-200 bg-emerald-100/70">#</th>
          <th class="px-3 py-2 border-r border-emerald-200">A · Colleague</th>
          <th class="px-3 py-2 border-r border-emerald-200">B · Department</th>
          <th class="px-3 py-2 border-r border-emerald-200">C · CoCo Drink</th>
          <th class="px-3 py-2 border-r border-emerald-200">D · Size</th>
          <th class="px-3 py-2 border-r border-emerald-200">E · Sugar</th>
          <th class="px-3 py-2 border-r border-emerald-200">F · Ice</th>
          <th class="px-3 py-2 border-r border-emerald-200">G · Toppings</th>
          <th class="px-3 py-2 border-r border-emerald-200">H · Notes</th>
          <th class="px-3 py-2 border-r border-emerald-200 text-right">I · Price (₱)</th>
          <th class="px-3 py-2 text-center">J · Status</th>
        </tr>
      `;
    }

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" class="py-8 text-center text-slate-400 font-mono text-xs">No orders in sheet.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map((order, idx) => {
      const isPaid = order.paymentStatus === 'paid';
      return `
        <tr class="border-b border-slate-200/80 font-mono text-xs hover:bg-emerald-50/40 transition-colors">
          <td class="px-3 py-2 text-center text-slate-400 bg-slate-50 border-r border-slate-200 select-none">${idx + 2}</td>
          <td class="px-3 py-2 font-bold text-slate-900 border-r border-slate-100">${order.colleagueName}</td>
          <td class="px-3 py-2 text-slate-600 border-r border-slate-100">${order.department}</td>
          <td class="px-3 py-2 font-semibold text-coco-orange border-r border-slate-100">${order.drinkName}</td>
          <td class="px-3 py-2 text-slate-600 border-r border-slate-100">${order.sizeLabel}</td>
          <td class="px-3 py-2 text-slate-600 border-r border-slate-100">${order.sugarLabel}</td>
          <td class="px-3 py-2 text-slate-600 border-r border-slate-100">${order.iceLabel}</td>
          <td class="px-3 py-2 text-slate-600 border-r border-slate-100">${order.toppingsList || '-'}</td>
          <td class="px-3 py-2 text-slate-500 italic border-r border-slate-100">${order.specialNotes || '-'}</td>
          <td class="px-3 py-2 font-bold text-slate-900 text-right border-r border-slate-100">₱${order.totalPrice}</td>
          <td class="px-3 py-1.5 text-center">
            <button onclick="togglePaymentStatus('${order.id}', '${isPaid ? 'unpaid' : 'paid'}')" class="px-2 py-0.5 rounded text-[10px] font-bold ${
              isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }">
              ${isPaid ? 'PAID' : 'UNPAID'}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    return;
  }

  // Standard Card/Table View
  if (tableHead) {
    tableHead.innerHTML = `
      <tr class="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
        <th class="px-5 py-3.5">Colleague & Team</th>
        <th class="px-5 py-3.5">CoCo Drink & Specs</th>
        <th class="px-5 py-3.5">Price</th>
        <th class="px-5 py-3.5 text-center">Payment</th>
        <th class="px-5 py-3.5 text-right">Actions</th>
      </tr>
    `;
  }

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-slate-400 text-xs">
          No orders found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    const isPaid = order.paymentStatus === 'paid';
    return `
      <tr class="hover:bg-slate-50/80 transition-colors">
        <!-- Colleague -->
        <td class="px-5 py-4">
          <div class="font-bold text-slate-900 text-sm">${order.colleagueName}</div>
          <div class="text-xs text-slate-500">${order.department} ${order.contact ? `• ${order.contact}` : ''}</div>
        </td>

        <!-- Drink & Specs -->
        <td class="px-5 py-4">
          <div class="font-bold text-slate-800 text-xs sm:text-sm">${order.drinkName} <span class="text-coco-orange font-semibold">(${order.sizeLabel})</span></div>
          <div class="text-[11px] text-slate-500 mt-0.5">
            ${order.sugarLabel} • ${order.iceLabel}
            ${order.toppingsList && order.toppingsList !== 'None' ? ` • <span class="text-amber-700 font-semibold">${order.toppingsList}</span>` : ''}
          </div>
          ${order.specialNotes ? `
            <div class="text-[10px] text-slate-400 italic mt-0.5">Note: "${order.specialNotes}"</div>
          ` : ''}
        </td>

        <!-- Price -->
        <td class="px-5 py-4 font-mono font-bold text-slate-900 text-sm">
          ₱${order.totalPrice}
        </td>

        <!-- Payment Status Toggle -->
        <td class="px-5 py-4 text-center">
          <button onclick="togglePaymentStatus('${order.id}', '${isPaid ? 'unpaid' : 'paid'}')" class="px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${
            isPaid 
              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
          }">
            <i class="fa-solid ${isPaid ? 'fa-check' : 'fa-clock'} mr-1"></i>
            ${isPaid ? 'Paid' : 'Unpaid'}
          </button>
        </td>

        <!-- Actions -->
        <td class="px-5 py-4 text-right">
          <button onclick="deleteOrder('${order.id}')" title="Delete order" class="w-8 h-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function setDashboardViewMode(mode) {
  state.dashboardViewMode = mode;
  const cardBtn = document.getElementById('viewModeCardBtn');
  const sheetBtn = document.getElementById('viewModeSheetBtn');

  if (mode === 'sheet') {
    sheetBtn.className = 'px-3 py-1.5 rounded-lg transition-all bg-emerald-600 text-white shadow-xs font-bold';
    cardBtn.className = 'px-3 py-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900';
  } else {
    cardBtn.className = 'px-3 py-1.5 rounded-lg transition-all bg-white text-slate-900 shadow-xs font-bold';
    sheetBtn.className = 'px-3 py-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900';
  }

  renderOrdersTable();
}

// 1-Click Copy Tab-Separated Data for Direct Ctrl+V into Google Sheets
function copyTableForGoogleSheets() {
  const orders = state.orders || [];
  if (orders.length === 0) {
    showToast('No orders to copy yet!', true);
    return;
  }

  const headers = ['Order ID', 'Timestamp', 'Colleague Name', 'Department', 'Contact', 'CoCo Drink', 'Size', 'Sweetness', 'Ice Level', 'Toppings', 'Notes', 'Price (PHP)', 'Status', 'Payment Status'];
  
  const rows = [headers.join('\t')];
  orders.forEach(o => {
    rows.push([
      o.id,
      o.timestamp || '',
      o.colleagueName || '',
      o.department || '',
      o.contact || '',
      o.drinkName || '',
      o.sizeLabel || '',
      o.sugarLabel || '',
      o.iceLabel || '',
      o.toppingsList || '',
      o.specialNotes || '',
      o.totalPrice || 0,
      o.status || '',
      o.paymentStatus || ''
    ].join('\t'));
  });

  const tsv = rows.join('\n');
  navigator.clipboard.writeText(tsv).then(() => {
    showToast('📋 Copied for Google Sheets! Just press Ctrl+V into any Google Sheet cell A1.');
  }).catch(() => {
    showToast('Failed to copy to clipboard', true);
  });
}

// Payment Status Toggle
async function togglePaymentStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: newStatus })
    });

    if (res.ok) {
      await fetchOrders();
      showToast(`Updated to ${newStatus.toUpperCase()}`);
    }
  } catch (err) {
    showToast('Failed to update status', true);
  }
}

// Delete Order
async function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to remove this drink order?')) return;
  try {
    const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchOrders();
      showToast('Order removed');
    }
  } catch (err) {
    showToast('Failed to delete order', true);
  }
}

// Archive and Clear current batch
async function confirmClearBatch() {
  if (!confirm('Start a new batch? This will archive all current orders.')) return;
  try {
    const res = await fetch('/api/orders/batch/clear', { method: 'POST' });
    if (res.ok) {
      await fetchOrders();
      showToast('Current batch archived. Ready for next order run!');
    }
  } catch (err) {
    showToast('Failed to clear batch', true);
  }
}

// ==========================================
// ONE-CLICK COPY FOR GRABFOOD / TEAMS / CHAT
// ==========================================

function copyGrabFoodTally() {
  if (!state.summary || !state.summary.tallies || state.summary.tallies.length === 0) {
    showToast('No orders to copy yet!', true);
    return;
  }

  const s = state.summary;
  let text = `🧋 MEDTECS MAKATI — BOBA RUN (CoCo Fresh Tea & Juice)\n`;
  text += `📍 Destination: Medtecs Main Office, Makati CBD\n`;
  text += `📅 Total Drinks: ${s.totalDrinks} cups | Total Bill: ₱${s.totalAmount}\n`;
  text += `=========================================\n`;
  text += `📋 CONSOLIDATED ORDER LIST (FOR GRABFOOD):\n`;

  s.tallies.forEach(item => {
    let toppingText = item.toppings !== 'None' ? ` + [${item.toppings}]` : '';
    text += `• ${item.quantity}x ${item.drinkName} (${item.size}, ${item.sugar}, ${item.ice}${toppingText}) — For: ${item.colleagues.join(', ')}\n`;
  });

  text += `=========================================\n`;
  text += `💳 Host GCash: ${state.config ? state.config.gcashNumber : '0917-888-MEDTECS'} (${state.config ? state.config.organizerName : 'Host'})\n`;
  text += `Please send exact amount to clear your cup! Thank you!`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Order summary copied! Paste directly into GrabFood, Viber, or Slack.');
  }).catch(() => {
    showToast('Failed to auto-copy to clipboard', true);
  });
}

// ==========================================
// CONFIG SETTINGS MODAL
// ==========================================

function openConfigModal() {
  if (state.config) {
    document.getElementById('cfgOrganizerName').value = state.config.organizerName || '';
    document.getElementById('cfgGcash').value = state.config.gcashNumber || '';
    document.getElementById('cfgCutoff').value = state.config.cutOffTime || '';
  }
  document.getElementById('configModal').classList.remove('hidden');
}

function closeConfigModal() {
  document.getElementById('configModal').classList.add('hidden');
}

// ==========================================
// GOOGLE SHEETS LIVE SYNC MODAL
// ==========================================

function openGoogleSheetsModal() {
  const formulaInput = document.getElementById('sheetsImportFormula');
  if (formulaInput) {
    const origin = window.location.origin;
    formulaInput.value = `=IMPORTDATA("${origin}/api/database/export")`;
  }
  document.getElementById('googleSheetsModal').classList.remove('hidden');
}

function closeGoogleSheetsModal() {
  document.getElementById('googleSheetsModal').classList.add('hidden');
}

function copySheetsFormula() {
  const formulaInput = document.getElementById('sheetsImportFormula');
  if (formulaInput) {
    formulaInput.select();
    navigator.clipboard.writeText(formulaInput.value).then(() => {
      showToast('📋 Google Sheets formula copied to clipboard!');
    }).catch(() => {
      showToast('Formula ready to copy');
    });
  }
}


async function saveConfigSettings() {
  const updated = {
    organizerName: document.getElementById('cfgOrganizerName').value.trim(),
    gcashNumber: document.getElementById('cfgGcash').value.trim(),
    cutOffTime: document.getElementById('cfgCutoff').value.trim()
  };

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      state.config = { ...state.config, ...updated };
      renderConfigUI();
      closeConfigModal();
      showToast('Settings saved successfully!');
    }
  } catch (err) {
    showToast('Failed to save settings', true);
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const icon = toast.querySelector('i');

  toastMsg.textContent = message;
  if (isError) {
    icon.className = 'fa-solid fa-triangle-exclamation text-rose-400 text-base';
  } else {
    icon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
  }

  toast.classList.remove('translate-y-24', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 3500);
}

// ==========================================
// DATABASE STATS VIEWER
// ==========================================

async function updateDatabaseStats() {
  const container = document.getElementById('dbLiveStats');
  if (!container) return;

  try {
    const res = await fetch('/api/database/stats');
    if (!res.ok) return;
    const stats = await res.json();
    container.innerHTML = `
      <span>Active Orders: <strong class="text-slate-800">${stats.activeOrdersCount}</strong></span>
      <span class="text-slate-300">•</span>
      <span>Total SQL Rows: <strong class="text-slate-800">${stats.historicalOrdersCount}</strong></span>
      <span class="text-slate-300">•</span>
      <span>DB Size: <strong class="text-slate-800">${stats.fileSizeKb} KB</strong></span>
    `;
  } catch (err) {
    console.error('Failed to update db stats', err);
  }
}

// ==========================================
// DATABASE EXPLORER & SQL CONSOLE
// ==========================================

let dbExplorerState = {
  tables: [],
  activeTable: 'orders'
};

async function loadDatabaseExplorer() {
  try {
    const res = await fetch('/api/database/tables');
    if (!res.ok) return;
    dbExplorerState.tables = await res.json();

    renderTableSelectorPills();
    if (dbExplorerState.tables.length > 0) {
      const targetTable = dbExplorerState.tables.find(t => t.name === dbExplorerState.activeTable) 
        ? dbExplorerState.activeTable 
        : dbExplorerState.tables[0].name;
      loadTableData(targetTable);
    }
  } catch (err) {
    console.error('Failed to load database explorer', err);
  }
}

function renderTableSelectorPills() {
  const container = document.getElementById('dbTableSelectorPills');
  if (!container) return;

  container.innerHTML = dbExplorerState.tables.map(t => {
    const isActive = t.name === dbExplorerState.activeTable;
    return `
      <button onclick="setDbActiveTable('${t.name}')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
        isActive 
          ? 'bg-slate-900 text-white shadow-sm' 
          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
      }">
        <i class="fa-solid fa-table"></i>
        <span>${t.name}</span>
        <span class="px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-coco-orange text-white' : 'bg-slate-200 text-slate-600'}">${t.rowCount}</span>
      </button>
    `;
  }).join('');
}

function setDbActiveTable(tableName) {
  dbExplorerState.activeTable = tableName;
  renderTableSelectorPills();
  loadTableData(tableName);
}

async function loadTableData(tableName) {
  try {
    const res = await fetch(`/api/database/table/${tableName}`);
    if (!res.ok) return;
    const rows = await res.json();
    
    const tableMeta = dbExplorerState.tables.find(t => t.name === tableName);
    const columns = tableMeta ? tableMeta.columns.map(c => c.name) : (rows.length > 0 ? Object.keys(rows[0]) : []);
    
    renderDbGrid(columns, rows);
    
    const queryStatus = document.getElementById('queryStatusText');
    if (queryStatus) {
      queryStatus.innerHTML = `Showing table <strong class="text-slate-800">${tableName}</strong> (${rows.length} rows loaded)`;
    }
  } catch (err) {
    console.error('Error loading table data', err);
  }
}

function renderDbGrid(columns, rows) {
  const thead = document.getElementById('dbDataTableHead');
  const tbody = document.getElementById('dbDataTableBody');
  if (!thead || !tbody) return;

  if (!columns || columns.length === 0) {
    thead.innerHTML = `<tr><th class="px-4 py-3">No Columns</th></tr>`;
    tbody.innerHTML = `<tr><td class="px-4 py-8 text-center text-slate-400">Empty table.</td></tr>`;
    return;
  }

  // Render headers
  thead.innerHTML = `
    <tr>
      ${columns.map(c => `<th class="px-4 py-3 font-mono font-bold whitespace-nowrap">${c}</th>`).join('')}
    </tr>
  `;

  if (!rows || rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length}" class="px-4 py-8 text-center text-slate-400">No records found.</td></tr>`;
    return;
  }

  // Render rows
  tbody.innerHTML = rows.map((r, idx) => {
    return `
      <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-orange-50/30 transition-colors">
        ${columns.map(col => {
          let val = r[col];
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          return `<td class="px-4 py-2.5 whitespace-nowrap text-slate-700 max-w-xs truncate" title="${val == null ? '' : String(val).replace(/"/g, '&quot;')}">${val == null ? '<span class="text-slate-300 italic">null</span>' : val}</td>`;
        }).join('')}
      </tr>
    `;
  }).join('');
}

function setQueryAndRun(sql) {
  const input = document.getElementById('sqlQueryInput');
  if (input) {
    input.value = sql;
  }
  executeSqlQuery();
}

async function executeSqlQuery() {
  const input = document.getElementById('sqlQueryInput');
  const sql = input ? input.value.trim() : '';
  const statusText = document.getElementById('queryStatusText');

  if (!sql) return;

  statusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-coco-orange mr-1"></i> Running query...`;
  const startTime = performance.now();

  try {
    const res = await fetch('/api/database/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });

    const data = await res.json();
    const duration = (performance.now() - startTime).toFixed(1);

    if (data.success) {
      if (data.type === 'select') {
        const rows = data.rows || [];
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
        renderDbGrid(columns, rows);
        statusText.innerHTML = `✅ Query executed in <strong class="text-slate-800">${duration}ms</strong> — returned <strong class="text-emerald-600">${rows.length} rows</strong>.`;
        showToast(`SQL query returned ${rows.length} rows`);
      } else {
        statusText.innerHTML = `✅ Mutation executed in <strong class="text-slate-800">${duration}ms</strong> — <strong class="text-emerald-600">${data.changes} rows affected</strong>.`;
        showToast(`Query affected ${data.changes} rows`);
        await loadDatabaseExplorer();
      }
    } else {
      statusText.innerHTML = `<span class="text-rose-600">❌ Error: ${data.error}</span>`;
      showToast(data.error || 'SQL execution failed', true);
    }
  } catch (err) {
    statusText.innerHTML = `<span class="text-rose-600">❌ Network error</span>`;
    showToast('Failed to execute query', true);
  }
}


