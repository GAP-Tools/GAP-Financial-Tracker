// Add these to the top of your existing script
let allocationConfig = {
  autoAllocation: false,
  categories: {
    assets: { percent: 50, balance: 0, color: '#4bc0c0' },
    expenses: { percent: 30, balance: 0, color: '#ff6384' },
    investments: { percent: 20, balance: 0, color: '#ffcd56' }
  },
  allocationHistory: []
};

// Modified saveDataToLocalStorage
function saveDataToLocalStorage() {
  localStorage.setItem("financialData", JSON.stringify({
    profile: profile,
    allocationConfig: allocationConfig
  }));
}

// Modified loadSavedData
function loadSavedData() {
  const savedData = localStorage.getItem("financialData");
  if (savedData) {
    const data = JSON.parse(savedData);
    profile = data.profile;
    allocationConfig = data.allocationConfig || allocationConfig;
    // Rest of your existing load code
  }
}

// New Allocation Functions
function showAllocationModal() {
  document.getElementById('allocationModal').style.display = 'block';
  renderAllocationCategories();
}

function renderAllocationCategories() {
  const container = document.getElementById('allocationCategories');
  container.innerHTML = Object.entries(allocationConfig.categories).map(([name, config]) => `
    <div class="category-item" onclick="selectCategory('${name}')">
      <span>${name.toUpperCase()}</span>
      <span>${config.percent}%</span>
    </div>
  `).join('');
}

function selectCategory(name) {
  document.querySelectorAll('.category-item').forEach(item => 
    item.classList.remove('active'));
  document.querySelector(`[onclick="selectCategory('${name}')"]`).classList.add('active');
  document.getElementById('categoryName').value = name;
  document.getElementById('categoryPercentage').value = allocationConfig.categories[name].percent;
}

function saveCategory() {
  const name = document.getElementById('categoryName').value.toLowerCase();
  const percent = parseInt(document.getElementById('categoryPercentage').value);
  
  if (!name || isNaN(percent)) return alert('Invalid input');
  
  // Check total percentage
  const currentTotal = Object.values(allocationConfig.categories)
    .reduce((sum, c) => sum + c.percent, 0);
  const newTotal = currentTotal - (allocationConfig.categories[name]?.percent || 0) + percent;
  
  if (newTotal > 100) return alert('Total percentage cannot exceed 100%');
  
  allocationConfig.categories[name] = {
    percent,
    balance: allocationConfig.categories[name]?.balance || 0,
    color: allocationConfig.categories[name]?.color || `#${Math.floor(Math.random()*16777215).toString(16)}`
  };
  
  saveDataToLocalStorage();
  renderAllocationCategories();
  updateAllocationDisplay();
}

function deleteCategory() {
  const name = document.getElementById('categoryName').value;
  if (!name || !allocationConfig.categories[name]) return;
  if (!confirm(`Delete ${name} and redistribute its ${allocationConfig.categories[name].percent}%?`)) return;
  
  const deletedPercent = allocationConfig.categories[name].percent;
  delete allocationConfig.categories[name];
  
  // Redistribute percentage to other categories
  const categories = Object.keys(allocationConfig.categories);
  const addPerCategory = deletedPercent / categories.length;
  categories.forEach(cat => {
    allocationConfig.categories[cat].percent += addPerCategory;
  });
  
  saveDataToLocalStorage();
  renderAllocationCategories();
  updateAllocationDisplay();
}

// Modified allocateFunds function
function allocateFunds() {
  const amount = parseFloat(document.getElementById('allocateAmount').value);
  if (isNaN(amount)) return alert('Invalid amount');
  
  const totalPercent = Object.values(allocationConfig.categories)
    .reduce((sum, c) => sum + c.percent, 0);
  if (totalPercent !== 100) return alert('Total percentages must equal 100%');
  
  Object.entries(allocationConfig.categories).forEach(([name, config]) => {
    const allocated = amount * (config.percent / 100);
    config.balance += allocated;
  });
  
  allocationConfig.allocationHistory.push({
    date: new Date().toISOString(),
    amount,
    breakdown: { ...allocationConfig.categories }
  });
  
  updateAllocationDisplay();
  saveDataToLocalStorage();
  alert('Funds allocated successfully!');
}

// New Auto-Allocation Integration
function toggleAutoAllocation() {
  allocationConfig.autoAllocation = !allocationConfig.autoAllocation;
  document.getElementById('autoAllocationStatus').textContent = 
    `Auto-Allocation: ${allocationConfig.autoAllocation ? 'On' : 'Off'}`;
  saveDataToLocalStorage();
}

// Modified saveEntry function
function saveEntry() {
  // Existing saveEntry code
  
  // Add auto-allocation if enabled
  if (allocationConfig.autoAllocation && type === 'income') {
    allocateFundsAutomatically(amount);
  }
  
  updateAllocationDisplay();
}

function allocateFundsAutomatically(amount) {
  Object.entries(allocationConfig.categories).forEach(([name, config]) => {
    const allocated = amount * (config.percent / 100);
    config.balance += allocated;
  });
  
  allocationConfig.allocationHistory.push({
    date: new Date().toISOString(),
    amount,
    breakdown: { ...allocationConfig.categories }
  });
  
  saveDataToLocalStorage();
}

// New Balance Checking System
function checkCategoryBalance(category, amount) {
  return allocationConfig.categories[category]?.balance >= amount;
}

// Modified withdrawFunds function
function withdrawFunds() {
  const category = prompt('Enter category to withdraw from:');
  if (!category || !allocationConfig.categories[category]) return alert('Invalid category');
  
  const amount = parseFloat(prompt('Enter withdrawal amount:'));
  if (isNaN(amount)) return alert('Invalid amount');
  
  if (!checkCategoryBalance(category, amount)) {
    return alert(`Insufficient balance in ${category}! Current balance: ${allocationConfig.categories[category].balance}`);
  }
  
  allocationConfig.categories[category].balance -= amount;
  allocationConfig.allocationHistory.push({
    date: new Date().toISOString(),
    type: 'withdrawal',
    category,
    amount
  });
  
  updateAllocationDisplay();
  saveDataToLocalStorage();
  alert('Withdrawal successful!');
}

// New Display Update Function
function updateAllocationDisplay() {
  // Update percentage bars
  const barsContainer = document.getElementById('allocationPercentageBars');
  barsContainer.innerHTML = Object.entries(allocationConfig.categories).map(([name, config]) => `
    <div class="allocation-bar">
      <div class="bar-fill" style="width: ${config.percent}%; background: ${config.color}">
        <span class="bar-label">${name} (${config.percent}%)</span>
      </div>
    </div>
  `).join('');
  
  // Update balances
  const balancesContainer = document.getElementById('categoryBalances');
  balancesContainer.innerHTML = Object.entries(allocationConfig.categories).map(([name, config]) => `
    <div class="category-balance-item">
      <span>${name.toUpperCase()}</span>
      <span>${profile.currency} ${config.balance.toFixed(2)}</span>
    </div>
  `).join('');
}

// Initialize allocation display
document.addEventListener('DOMContentLoaded', () => {
  updateAllocationDisplay();
  document.getElementById('autoAllocationStatus').textContent = 
    `Auto-Allocation: ${allocationConfig.autoAllocation ? 'On' : 'Off'}`;
});

// Rest of your existing JavaScript remains unchanged
