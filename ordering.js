// Medtecs Makati AI Workshop — Participant Drink Ordering Logic

let currentMenu = [];
let currentCategory = 'all';
let searchQuery = '';
let selectedDrink = null;
let appConfig = {
  orderingOpen: true,
  orderCutoff: '2:30 PM',
  organizer: 'Irene',
  currency: '₱'
};

// Current customization state
let currentCustomization = {
  size: 'Regular',
  sugar: '70% Less Sugar',
  ice: 'Less Ice',
  toppings: [] // array of topping names
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadMenu();
});

// ============================================================================
// 1. DATA LOADING (Google Apps Script Web App + Local Fallback)
// ============================================================================

async function loadConfig() {
  const gasUrl = window.MEDTECS_CONFIG && window.MEDTECS_CONFIG.gasUrl;
  if (gasUrl) {
    try {
      const res = await fetch(`${gasUrl}?action=getConfig`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.config) {
          appConfig = Object.assign(appConfig, json.config);
        }
      }
    } catch (e) {
      console.warn('Using local config fallback', e);
    }
  }

  // Update UI with config
  const cutoffEl = document.getElementById('headerCutoff');
  if (cutoffEl && appConfig.orderCutoff) cutoffEl.textContent = appConfig.orderCutoff;

  const orgEl = document.getElementById('headerOrganizer');
  if (orgEl && appConfig.organizer) orgEl.textContent = appConfig.organizer;

  const closedBanner = document.getElementById('orderingClosedBanner');
  const activeContainer = document.getElementById('orderingActiveContainer');
  if (appConfig.orderingOpen === false) {
    if (closedBanner) closedBanner.classList.remove('hidden');
    if (activeContainer) activeContainer.classList.add('opacity-40', 'pointer-events-none');
  } else {
    if (closedBanner) closedBanner.classList.add('hidden');
    if (activeContainer) activeContainer.classList.remove('opacity-40', 'pointer-events-none');
  }
}

async function loadMenu() {
  let loadedFromGas = false;
  const gasUrl = window.MEDTECS_CONFIG && window.MEDTECS_CONFIG.gasUrl;
  
  if (gasUrl) {
    try {
      const res = await fetch(`${gasUrl}?action=getMenu`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.drinks) && json.drinks.length > 0) {
          // Filter available drinks
          currentMenu = json.drinks.filter(d => d.available !== false);
          loadedFromGas = true;
        }
      }
    } catch (e) {
      console.warn('Could not fetch menu from Apps Script, using built-in menu', e);
    }
  }

  if (!loadedFromGas) {
    // Use starter drinks from config.js
    currentMenu = window.MEDTECS_CONFIG.starterDrinks || [];
  }

  renderDrinks();
}

// ============================================================================
// 2. RENDERING DRINKS
// ============================================================================

function setCategoryFilter(category) {
  currentCategory = category;
  const buttons = document.querySelectorAll('#categoryFilterContainer button');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick').includes(`'${category}'`)) {
      btn.className = 'category-btn active px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-xs';
    } else {
      btn.className = 'category-btn inactive px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all';
    }
  });
  renderDrinks();
}

function filterDrinks() {
  searchQuery = (document.getElementById('menuSearch').value || '').trim().toLowerCase();
  renderDrinks();
}

function renderDrinks() {
  const grid = document.getElementById('drinksGrid');
  if (!grid) return;

  const filtered = currentMenu.filter(d => {
    const matchesCat = (currentCategory === 'all') || (d.category.toLowerCase() === currentCategory.toLowerCase());
    const matchesQuery = !searchQuery || 
      d.name.toLowerCase().includes(searchQuery) || 
      (d.description && d.description.toLowerCase().includes(searchQuery)) ||
      d.category.toLowerCase().includes(searchQuery);
    return matchesCat && matchesQuery;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i class="fa-solid fa-mug-saucer text-4xl mb-2 text-slate-300"></i>
        <p class="text-sm">No drinks match your search.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(drink => {
    const regPrice = drink.priceRegular || 120;
    const lrgPrice = drink.priceLarge || (regPrice + 15);
    
    return `
      <div onclick="openCustomModal('${drink.id}')" class="drink-card bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden cursor-pointer flex flex-col group">
        <div class="relative h-44 bg-slate-100 overflow-hidden">
          <img src="${drink.image}" alt="${drink.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
          <div class="absolute top-3 left-3">
            <span class="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              ${drink.category}
            </span>
          </div>
          <div class="absolute bottom-3 right-3">
            <span class="bg-coco-orange text-white font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-md">
              From ₱${regPrice}
            </span>
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="font-bold font-heading text-slate-900 text-base leading-snug group-hover:text-coco-orange transition-colors">
              ${drink.name}
            </h4>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              ${drink.description || 'Delicious refreshing beverage.'}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-slate-400">Sizes: Regular / Large</span>
            <span class="text-coco-orange font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Customize <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 3. DEPARTMENT SELECTION
// ============================================================================

function handleDeptChange() {
  const deptSelect = document.getElementById('participantDept');
  const otherWrapper = document.getElementById('otherDeptWrapper');
  const otherInput = document.getElementById('participantDeptOther');

  if (deptSelect.value === 'Other') {
    otherWrapper.classList.remove('hidden');
    otherInput.setAttribute('required', 'required');
    otherInput.focus();
  } else {
    otherWrapper.classList.add('hidden');
    otherInput.removeAttribute('required');
    otherInput.value = '';
  }
}

function getSelectedDepartment() {
  const deptSelect = document.getElementById('participantDept');
  if (deptSelect.value === 'Other') {
    return (document.getElementById('participantDeptOther').value || '').trim() || 'Other';
  }
  return deptSelect.value;
}

// ============================================================================
// 4. CUSTOMIZATION MODAL & LIVE PRICE
// ============================================================================

function openCustomModal(drinkId) {
  const drink = currentMenu.find(d => d.id === drinkId);
  if (!drink) return;

  selectedDrink = drink;
  currentCustomization = {
    size: 'Regular',
    sugar: '70% Less Sugar',
    ice: 'Less Ice',
    toppings: []
  };

  // Populate drink info in modal
  document.getElementById('modalDrinkImg').src = drink.image;
  document.getElementById('modalDrinkCategory').textContent = drink.category;
  document.getElementById('modalDrinkName').textContent = drink.name;
  document.getElementById('modalDrinkDesc').textContent = drink.description || '';

  // Size prices
  const regPrice = drink.priceRegular || 120;
  const lrgPrice = drink.priceLarge || (regPrice + 15);
  document.getElementById('sizeRegularPrice').textContent = `₱${regPrice}`;
  document.getElementById('sizeLargePrice').textContent = `₱${lrgPrice}`;

  // Populate Toppings based on config
  const toppingsContainer = document.getElementById('modalToppingsGroup');
  const allToppings = window.MEDTECS_CONFIG.toppings || [];
  
  toppingsContainer.innerHTML = allToppings.map(t => `
    <div onclick="toggleTopping('${t.name}')" id="topping-${t.id}" class="choice-pill flex items-center justify-between py-2 px-3 text-xs">
      <div class="flex items-center gap-2">
        <div id="check-${t.id}" class="w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px] text-white"></div>
        <span class="font-medium text-slate-800">${t.name}</span>
      </div>
      <span class="font-bold text-slate-600">+₱${t.price}</span>
    </div>
  `).join('');

  // Update choice pills visual state
  updateCustomizationUI();
  updateLiveTotal();

  // Show modal
  document.getElementById('customModal').classList.remove('hidden');
}

function closeCustomModal() {
  document.getElementById('customModal').classList.add('hidden');
}

function selectSize(size) {
  currentCustomization.size = size;
  updateCustomizationUI();
  updateLiveTotal();
}

function selectSugar(sugar) {
  currentCustomization.sugar = sugar;
  updateCustomizationUI();
}

function selectIce(ice) {
  currentCustomization.ice = ice;
  updateCustomizationUI();
}

function toggleTopping(toppingName) {
  const idx = currentCustomization.toppings.indexOf(toppingName);
  if (idx > -1) {
    currentCustomization.toppings.splice(idx, 1);
  } else {
    currentCustomization.toppings.push(toppingName);
  }
  updateCustomizationUI();
  updateLiveTotal();
}

function updateCustomizationUI() {
  // Size pills
  ['Regular', 'Large'].forEach(s => {
    const el = document.getElementById(`size-${s}`);
    if (el) {
      if (currentCustomization.size === s) {
        el.className = 'choice-pill selected flex items-center justify-between';
      } else {
        el.className = 'choice-pill flex items-center justify-between';
      }
    }
  });

  // Sugar pills
  const sugarMap = {
    '100% Regular': 'sugar-100',
    '70% Less Sugar': 'sugar-70',
    '50% Half Sugar': 'sugar-50',
    '30% Slight Sugar': 'sugar-30',
    '0% No Sugar': 'sugar-0'
  };
  for (const [val, id] of Object.entries(sugarMap)) {
    const el = document.getElementById(id);
    if (el) {
      el.className = (currentCustomization.sugar === val)
        ? 'choice-pill selected text-xs text-center py-2'
        : 'choice-pill text-xs text-center py-2';
    }
  }

  // Ice pills
  const iceMap = {
    'Regular Ice': 'ice-regular',
    'Less Ice': 'ice-less',
    'No Ice': 'ice-none'
  };
  for (const [val, id] of Object.entries(iceMap)) {
    const el = document.getElementById(id);
    if (el) {
      el.className = (currentCustomization.ice === val)
        ? 'choice-pill selected text-xs text-center py-2'
        : 'choice-pill text-xs text-center py-2';
    }
  }

  // Toppings
  const allToppings = window.MEDTECS_CONFIG.toppings || [];
  allToppings.forEach(t => {
    const isSelected = currentCustomization.toppings.includes(t.name);
    const pill = document.getElementById(`topping-${t.id}`);
    const check = document.getElementById(`check-${t.id}`);
    if (pill && check) {
      if (isSelected) {
        pill.className = 'choice-pill selected flex items-center justify-between py-2 px-3 text-xs';
        check.className = 'w-4 h-4 rounded bg-coco-orange text-white flex items-center justify-center text-[10px] font-bold';
        check.innerHTML = '<i class="fa-solid fa-check"></i>';
      } else {
        pill.className = 'choice-pill flex items-center justify-between py-2 px-3 text-xs';
        check.className = 'w-4 h-4 rounded border border-slate-300 flex items-center justify-center text-[10px] text-white';
        check.innerHTML = '';
      }
    }
  });
}

function calculateCurrentPrice() {
  if (!selectedDrink) return 0;
  const isLarge = currentCustomization.size === 'Large';
  const basePrice = isLarge ? (selectedDrink.priceLarge || 135) : (selectedDrink.priceRegular || 120);

  let toppingSum = 0;
  const allToppings = window.MEDTECS_CONFIG.toppings || [];
  currentCustomization.toppings.forEach(name => {
    const found = allToppings.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (found) toppingSum += found.price;
    else toppingSum += 20;
  });

  return basePrice + toppingSum;
}

function updateLiveTotal() {
  const total = calculateCurrentPrice();
  const totalEl = document.getElementById('modalTotalPrice');
  if (totalEl) totalEl.textContent = `₱${total}`;
}

// ============================================================================
// 5. REVIEW MODAL (Confirmation before submission)
// ============================================================================

function openReviewModal() {
  const nameInput = document.getElementById('participantName');
  const name = (nameInput.value || '').trim();
  const dept = getSelectedDepartment();

  if (!name) {
    showToast('Please enter your name first');
    nameInput.focus();
    return;
  }
  if (!dept) {
    showToast('Please select your department');
    document.getElementById('participantDept').focus();
    return;
  }

  // Populate review card
  document.getElementById('reviewName').textContent = name;
  document.getElementById('reviewDept').textContent = dept;
  document.getElementById('reviewDrink').textContent = selectedDrink.name;
  document.getElementById('reviewSize').textContent = currentCustomization.size;
  document.getElementById('reviewSugar').textContent = currentCustomization.sugar;
  document.getElementById('reviewIce').textContent = currentCustomization.ice;
  document.getElementById('reviewToppings').textContent = currentCustomization.toppings.length > 0
    ? currentCustomization.toppings.join(', ')
    : 'None';
  
  const total = calculateCurrentPrice();
  document.getElementById('reviewTotal').textContent = `₱${total}`;

  // Hide custom modal and show review modal
  closeCustomModal();
  document.getElementById('reviewModal').classList.remove('hidden');
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.add('hidden');
}

// ============================================================================
// 6. ORDER SUBMISSION
// ============================================================================

async function executeSubmitOrder() {
  const btn = document.getElementById('btnSubmitOrder');
  const btnText = document.getElementById('btnSubmitText');
  const btnSpinner = document.getElementById('btnSubmitSpinner');

  // Prevent double click
  btn.disabled = true;
  btnText.textContent = 'Submitting...';
  btnSpinner.classList.remove('hidden');

  const name = (document.getElementById('participantName').value || '').trim();
  const dept = getSelectedDepartment();
  const isLarge = currentCustomization.size === 'Large';
  const basePrice = isLarge ? selectedDrink.priceLarge : selectedDrink.priceRegular;
  
  let toppingPrice = 0;
  const allToppings = window.MEDTECS_CONFIG.toppings || [];
  currentCustomization.toppings.forEach(tName => {
    const found = allToppings.find(t => t.name.toLowerCase() === tName.toLowerCase());
    toppingPrice += found ? found.price : 20;
  });
  const totalPrice = basePrice + toppingPrice;

  const payload = {
    action: 'createOrder',
    name: name,
    department: dept,
    drinkId: selectedDrink.id,
    drink: selectedDrink.name,
    size: currentCustomization.size,
    sugar: currentCustomization.sugar,
    ice: currentCustomization.ice,
    toppings: currentCustomization.toppings.join(', '),
    basePrice: basePrice,
    toppingPrice: toppingPrice,
    totalPrice: totalPrice
  };

  let submitSuccess = false;
  const gasUrl = window.MEDTECS_CONFIG && window.MEDTECS_CONFIG.gasUrl;

  if (gasUrl) {
    try {
      // Send as text/plain to avoid CORS preflight options check
      const res = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        submitSuccess = true;
      } else {
        throw new Error(data.error || 'Server rejected order');
      }
    } catch (postErr) {
      console.warn('POST failed, attempting GET fallback query', postErr);
      // Fallback: GET request with query params
      try {
        const queryParams = new URLSearchParams(payload).toString();
        const getRes = await fetch(`${gasUrl}?${queryParams}`);
        const getData = await getRes.json();
        if (getData.success) {
          submitSuccess = true;
        }
      } catch (getErr) {
        console.error('All Google Apps Script submissions failed', getErr);
      }
    }
  } else {
    // If no Apps Script URL configured yet, simulate local receipt
    console.warn('No Google Apps Script URL configured in config.js or localStorage.');
    submitSuccess = true;
  }

  // Restore button state
  btn.disabled = false;
  btnText.textContent = 'SUBMIT ORDER';
  btnSpinner.classList.add('hidden');

  closeReviewModal();

  if (submitSuccess) {
    showSuccessScreen(payload);
  } else {
    showToast('Failed to submit order. Please check connection and try again.');
  }
}

// ============================================================================
// 7. SUCCESS SCREEN
// ============================================================================

function showSuccessScreen(order) {
  document.getElementById('successName').textContent = order.name;
  document.getElementById('successDrink').textContent = order.drink;
  document.getElementById('successSize').textContent = order.size;
  document.getElementById('successSugar').textContent = order.sugar;
  document.getElementById('successIce').textContent = order.ice;
  document.getElementById('successToppings').textContent = order.toppings || 'None';
  document.getElementById('successTotal').textContent = `₱${order.totalPrice}`;

  document.getElementById('successModal').classList.remove('hidden');
}

function orderAnotherDrink() {
  document.getElementById('successModal').classList.add('hidden');
  // Reset customization
  selectedDrink = null;
  currentCustomization = {
    size: 'Regular',
    sugar: '70% Less Sugar',
    ice: 'Less Ice',
    toppings: []
  };
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// 8. TOAST NOTIFICATION
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
