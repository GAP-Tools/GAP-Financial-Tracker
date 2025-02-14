let businesses = []; // Array to store multiple businesses
let currentBusinessIndex = 0; // Index of the currently selected business
let categories = {
  income: ['Sales', 'Investments', 'Royalties'],
  expense: ['Supplies', 'Marketing', 'Salaries']
};
let incomeModal = document.getElementById('incomeModal');
let expenseModal = document.getElementById('expenseModal');
let modalOverlay = document.getElementById('modalOverlay');

// DOM Elements
const businessList = document.getElementById("businessList");
const businessNameInput = document.getElementById("businessName");
const businessDescriptionInput = document.getElementById("businessDescription");
const currencySelect = document.getElementById("currency");
const revenueTargetInput = document.getElementById("revenue-target");
const monthlyTable = document.getElementById("monthlyTable");
const categoryTable = document.getElementById("categoryTable");
const dailyTable = document.getElementById("dailyTable");
const balanceSheetTable = document.getElementById("balanceSheet");
const balanceSheetBody = balanceSheetTable.querySelector('tbody');
const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const totalAssets = document.getElementById("total-assets");
const totalLiabilities = document.getElementById("total-liabilities");
const netWorth = document.getElementById("net-worth");
const cashflow = document.getElementById("cashflow");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");
const healthPercentage = document.getElementById("healthPercentage");
const healthTips = document.getElementById("healthTips");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const conversionResult = document.getElementById("conversionResult");
const businessFinancialStory = document.getElementById("businessFinancialStory");
const saveFileNameInput = document.getElementById("saveFileName");

// Chart Initialization
const healthChart = new Chart(healthChartCtx, {
  type: "doughnut",
  data: {
    labels: ["Health"],
    datasets: [{
      data: [0],
      backgroundColor: ["#17a2b8"],
    }],
  },
  options: {
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  },
});

// Fetch Currency Rates
let currencyRates = {};
fetch("https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD")
  .then(response => response.json())
  .then(data => {
    currencyRates = data.conversion_rates;
    populateCurrencyDropdowns();
    loadSavedData(); // Load saved data after currencies are fetched
  });

// Populate Currency Dropdowns
function populateCurrencyDropdowns() {
  for (const currency in currencyRates) {
    const option1 = document.createElement("option");
    option1.value = currency;
    option1.text = `${currency} (${getCurrencySymbol(currency)})`;
    fromCurrency.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = currency;
    option2.text = `${currency} (${getCurrencySymbol(currency)})`;
    toCurrency.appendChild(option2);

    const option3 = document.createElement("option");
    option3.value = currency;
    option3.text = `${currency} (${getCurrencySymbol(currency)})`;
    currencySelect.appendChild(option3);
  }
}

// Get Currency Symbol
function getCurrencySymbol(currency) {
  const symbols = {
    USD: "$", EUR: "€", GBP: "£", NGN: "₦", JPY: "¥", INR: "₹", AUD: "A$", CAD: "C$", CHF: "CHF", CNY: "¥"
  };
  return symbols[currency] || currency;
}

// Add Business
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (name) {
    const newBusiness = {
      name,
      description: "",
      currency: "USD",
      revenueTarget: 0,
      incomeStatement: {
        daily: {
          entries: []
        },
        monthly: {},
        categories: {}
      },
      balanceSheet: []
    };
    businesses.push(newBusiness);
    updateBusinessList();
    switchBusiness(businesses.length - 1);
    businessNameInput.value = "";
    saveDataToLocalStorage();
  } else {
    alert("Please enter a business name!");
  }
}

// Update Business List
function updateBusinessList() {
  businessList.innerHTML = "";
  businesses.forEach((business, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = business.name;
    businessList.appendChild(option);
  });
}

// Switch Business
function switchBusiness(index) {
  currentBusinessIndex = index;
  const business = businesses[currentBusinessIndex];
  businessDescriptionInput.value = business.description;
  currencySelect.value = business.currency;
  revenueTargetInput.value = business.revenueTarget;
  updateIncomeStatement();
  updateBalanceSheet();
  updateFinancialHealth();
  syncDataToLocalStorage();
}

// Save Business Profile
function saveBusinessProfile() {
  const business = businesses[currentBusinessIndex];
  business.description = businessDescriptionInput.value;
  business.currency = currencySelect.value;
  business.revenueTarget = parseFloat(revenueTargetInput.value) || 0;
  syncDataToLocalStorage();
}

// Switch to Personal
function switchToPersonal() {
  window.location.href = 'https://gap-tools.github.io/GAP-Financial-Tracker/';
}

// Edit Revenue Target
function editRevenueTarget() {
  const newTarget = prompt("Enter New Revenue/Residual Income Target:", businesses[currentBusinessIndex].revenueTarget);
  if (newTarget && !isNaN(newTarget)) {
    businesses[currentBusinessIndex].revenueTarget = parseFloat(newTarget);
    revenueTargetInput.value = businesses[currentBusinessIndex].revenueTarget;
    updateFinancialHealth();
    syncDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Edit Business Name
function editBusinessName() {
  const newName = prompt("Enter New Business Name:", businesses[currentBusinessIndex].name);
  if (newName && newName.trim()) {
    businesses[currentBusinessIndex].name = newName.trim();
    updateBusinessList();
    syncDataToLocalStorage();
    alert("Business Name Updated!");
  } else {
    alert("Invalid Input!");
  }
}

// Delete Business
function deleteBusiness() {
  if (confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
    businesses.splice(currentBusinessIndex, 1);
    if (businesses.length > 0) {
      currentBusinessIndex = 0;
      switchBusiness(currentBusinessIndex);
    } else {
      clearAllData();
    }
    updateBusinessList();
    syncDataToLocalStorage();
    alert("Business Deleted!");
  }
}

// Clear All Data
function clearAllData() {
  document.querySelectorAll('.business-selector, .profile-section, .income-statement, .balance-sheet').forEach(section => section.style.display = 'none');
}

// Add Income/Expense Entry
function handleIncomeSubmit(e) {
  e.preventDefault();
  const entry = {
    date: document.getElementById('incomeDate').value,
    description: document.getElementById('incomeDescription').value,
    category: document.getElementById('incomeCategory').value,
    amount: parseFloat(document.getElementById('incomeAmount').value),
    type: 'Income'
  };
  if (validateEntry(entry)) {
    addEntryToBusiness(entry);
    closeModal();
  }
}

function handleExpenseSubmit(e) {
  e.preventDefault();
  const entry = {
    date: document.getElementById('expenseDate').value,
    description: document.getElementById('expenseDescription').value,
    category: document.getElementById('expenseCategory').value,
    amount: parseFloat(document.getElementById('expenseAmount').value),
    type: 'Expense'
  };
  if (validateEntry(entry)) {
    addEntryToBusiness(entry);
    closeModal();
  }
}

function addEntryToBusiness(entry) {
  const business = businesses[currentBusinessIndex];
  const entryDate = new Date(entry.date);
  const monthYear = `${entryDate.getFullYear()}-${(entryDate.getMonth() + 1).toString().padStart(2, '0')}`;
  const dailyKey = entry.date;

  if (!business.incomeStatement.monthly[monthYear]) {
    initializeMonth(monthYear, business);
  }

  if (!business.incomeStatement.categories[entry.category]) {
    initializeCategory(entry.category, business);
  }

  // Add to daily
  business.incomeStatement.daily[dailyKey] = business.incomeStatement.daily[dailyKey] || [];
  business.incomeStatement.daily[dailyKey].push(entry);

  // Add to category
  business.incomeStatement.categories[entry.category].entries.push(entry);

  // Add to monthly
  business.incomeStatement.monthly[monthYear].entries.push(entry);

  updateIncomeStatement();
  updateFinancialHealth();
  syncDataToLocalStorage();
}

function initializeMonth(monthYear, business) {
  business.incomeStatement.monthly[monthYear] = {
    label: monthYear,
    totalIncome: 0,
    totalExpenses: 0,
    entries: []
  };
}

function initializeCategory(category, business) {
  business.incomeStatement.categories[category] = {
    label: category,
    totalIncome: 0,
    totalExpenses: 0,
    entries: []
  };
}

function validateEntry(entry) {
  if (!entry.date || !entry.description || !entry.amount) {
    alert('All fields must be filled!');
    return false;
  }
  if (entry.amount <= 0) {
    alert('Amount must be positive!');
    return false;
  }
  return true;
}

// Update Income Statement
function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];

  // Clear existing tables
  monthlyTable.innerHTML = '';
  categoryTable.innerHTML = '';
  dailyTable.innerHTML = '';

  // Rebuild monthly table
  Object.values(business.incomeStatement.monthly).forEach(month => {
    const row = document.createElement('div');
    row.className = 'monthly-row';
    row.innerHTML = `
      <div class="monthly-title">${month.label}</div>
      <div class="monthly-totals">
        Income: ${formatCurrency(month.totalIncome)}<br>
        Expenses: ${formatCurrency(month.totalExpenses)}<br>
        Net: ${formatCurrency(month.totalIncome - month.totalExpenses)}
      </div>
      <div class="monthly-actions">
        <button class="expand-btn" onclick="expandSection(event, 'category')">View Categories</button>
      </div>
    `;
    row.dataset.date = month.label;
    monthlyTable.appendChild(row);
  });

  // Rebuild category table
  Object.values(business.incomeStatement.categories).forEach(category => {
    const row = document.createElement('div');
    row.className = 'category-row';
    row.innerHTML = `
      <div class="category-title">${category.label}</div>
      <div class="category-totals">
        Income: ${formatCurrency(category.totalIncome)}<br>
        Expenses: ${formatCurrency(category.totalExpenses)}<br>
        Net: ${formatCurrency(category.totalIncome - category.totalExpenses)}
      </div>
      <div class="category-actions">
        <button class="expand-btn" onclick="expandSection(event, 'daily')">View Daily Entries</button>
      </div>
    `;
    row.dataset.category = category.label;
    categoryTable.appendChild(row);
  });

  // Rebuild daily table
  Object.values(business.incomeStatement.daily).forEach(dailyEntries => {
    dailyEntries.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'daily-row';
      row.innerHTML = `
        <div class="daily-date">${entry.date}</div>
        <div class="daily-description">${entry.description}</div>
        <div class="daily-income">${entry.type === 'Income' ? formatCurrency(entry.amount) : ''}</div>
        <div class="daily-expense">${entry.type === 'Expense' ? formatCurrency(entry.amount) : ''}</div>
        <div class="daily-actions">
          <button class="edit-btn" onclick="editEntry(this)"><i class="fas fa-edit"></i></button>
          <button class="delete-btn" onclick="deleteEntry(this)"><i class="fas fa-trash"></i></button>
        </div>
      `;
      dailyTable.appendChild(row);
    });
  });

  // Update totals
  updateTotals();
}

function formatCurrency(amount) {
  const business = businesses[currentBusinessIndex];
  return `${getCurrencySymbol(business.currency)} ${amount.toFixed(2)}`;
}

function updateTotals() {
  const business = businesses[currentBusinessIndex];
  let totalIncome = 0;
  let totalExpenses = 0;

  Object.values(business.incomeStatement.daily).forEach(dailyEntries => {
    dailyEntries.forEach(entry => {
      if (entry.type === 'Income') totalIncome += entry.amount;
      if (entry.type === 'Expense') totalExpenses += entry.amount;
    });
  });

  totalIncome.textContent = formatCurrency(totalIncome);
  totalExpenses.textContent = formatCurrency(totalExpenses);
  cashflow.textContent = formatCurrency(totalIncome - totalExpenses);
}

// Expand/Collapse Sections
function expandSection(e, sectionType) {
  e.preventDefault();
  const targetTable = sectionType === 'category' ? categoryTable : dailyTable;
  if (targetTable.style.display === 'block') {
    targetTable.style.display = 'none';
  } else {
    targetTable.style.display = 'block';
  }
}

// Edit/Delete Entries
function editEntry(button) {
  const row = button.closest('.daily-row');
  const entries = businesses[currentBusinessIndex].incomeStatement.daily[row.querySelector('.daily-date').textContent];
  const entry = entries[entries.length - 1]; // Assume last entry is being edited

  // Pre-fill modal
  if (entry.type === 'Income') {
    showModal('income');
    document.getElementById('incomeDate').value = entry.date;
    document.getElementById('incomeDescription').value = entry.description;
    document.getElementById('incomeAmount').value = entry.amount;
    document.getElementById('incomeCategory').value = entry.category;
  } else {
    showModal('expense');
    document.getElementById('expenseDate').value = entry.date;
    document.getElementById('expenseDescription').value = entry.description;
    document.getElementById('expenseAmount').value = entry.amount;
    document.getElementById('expenseCategory').value = entry.category;
  }
}

function deleteEntry(button) {
  if (confirm('Are you sure you want to delete this entry?')) {
    const row = button.closest('.daily-row');
    const date = row.querySelector('.daily-date').textContent;
    const entries = businesses[currentBusinessIndex].incomeStatement.daily[date];
    const index = entries.findIndex(e => e.date === date); // Simplified, may need better key

    if (index > -1) {
      entries.splice(index, 1);
      updateIncomeStatement();
      updateFinancialHealth();
      syncDataToLocalStorage();
    }
  }
}

// Update Financial Health
function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(business.currency, "").replace(/[^0-9.]/g, ""));
  const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(business.currency, "").replace(/[^0-9.]/g, ""));
  const netWorthAmount = parseFloat(totalIncome.textContent.replace(business.currency, "").replace(/[^0-9.]/g, "")) - parseFloat(totalExpenses.textContent.replace(business.currency, "").replace(/[^0-9.]/g, ""));
  
  let healthScore = 0;
  if (totalIncomeAmount > 0) {
    healthScore = Math.round(((totalIncomeAmount - totalExpensesAmount) / totalIncomeAmount) * 100);
  }

  healthChart.data.datasets[0].data = [healthScore];
  healthChart.update();
  healthPercentage.textContent = `${healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore);
}

function generateHealthTip(score) {
  if (score > 80) {
    return "Your financial health is excellent. Keep up the good work!";
  } else if (score > 60) {
    return "You're doing well! Focus on increasing income and reducing expenses.";
  } else if (score > 30) {
    return "Your financial health could use some attention. Try to find ways to improve cash flow.";
  } else {
    return "Your financial health is at risk. Take immediate steps to reduce expenses and increase income.";
  }
}

// Balance Sheet Functions
function updateBalanceSheet() {
  const business = businesses[currentBusinessIndex];
  balanceSheetBody.innerHTML = '';

  business.balanceSheet.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === 'Asset' ? formatCurrency(entry.amount) : ''}</td>
      <td>${entry.type === 'Liability' ? formatCurrency(entry.amount) : ''}</td>
      <td>
        <button class="edit-btn asset-liability" onclick="editBalanceEntry(this)"><i class="fas fa-edit"></i></button>
        <button class="delete-btn asset-liability" onclick="deleteBalanceEntry(this)"><i class="fas fa-trash"></i></button>
      </td>
    `;
    balanceSheetBody.appendChild(row);
  });

  let totalAssets = 0;
  let totalLiabilities = 0;
  business.balanceSheet.forEach(entry => {
    if (entry.type === 'Asset') totalAssets += entry.amount;
    if (entry.type === 'Liability') totalLiabilities += entry.amount;
  });

  totalAssets.textContent = formatCurrency(totalAssets);
  totalLiabilities.textContent = formatCurrency(totalLiabilities);
  netWorth.textContent = formatCurrency(totalAssets - totalLiabilities);
}

function addAsset() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: 'Asset', amount });
    updateBalanceSheet();
    syncDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

function addLiability() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: 'Liability', amount });
    updateBalanceSheet();
    syncDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

function editBalanceEntry(button) {
  const row = button.closest('tr');
  const index = Array.from(balanceSheetBody.children).indexOf(row);
  const entry = businesses[currentBusinessIndex].balanceSheet[index];

  // Pre-fill inputs
  const newDate = prompt("Enter New Date:", entry.date);
  const newDescription = prompt("Enter New Description:", entry.description);
  const newAmount = parseFloat(prompt("Enter New Amount:", entry.amount));

  if (newDate && newDescription && !isNaN(newAmount)) {
    entry.date = newDate;
    entry.description = newDescription;
    entry.amount = newAmount;
    updateBalanceSheet();
    syncDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

function deleteBalanceEntry(button) {
  if (confirm("Are you sure you want to delete this entry?")) {
    const row = button.closest('tr');
    const index = Array.from(balanceSheetBody.children).indexOf(row);
    businesses[currentBusinessIndex].balanceSheet.splice(index, 1);
    updateBalanceSheet();
    syncDataToLocalStorage();
  }
}

// Data Management Functions
function exportBusinessData() {
  const fileName = saveFileNameInput.value.trim() || businesses[currentBusinessIndex].name;
  const data = businesses[currentBusinessIndex];
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
}

function importBusinessData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      businesses.push(data);
      updateBusinessList();
      switchBusiness(businesses.length - 1);
      syncDataToLocalStorage();
      alert("Business Data Imported!");
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearBusinessData() {
  if (confirm("Are you sure you want to clear this business's data?")) {
    businesses[currentBusinessIndex] = {
      name: businesses[currentBusinessIndex].name,
      description: "",
      currency: "USD",
      revenueTarget: 0,
      incomeStatement: {
        daily: { entries: [] },
        monthly: {},
        categories: {}
      },
      balanceSheet: []
    };
    updateIncomeStatement();
    updateBalanceSheet();
    updateFinancialHealth();
    syncDataToLocalStorage();
  }
}

// Share Functions
function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check out this app: ${url}`);
}

function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent('Check out this awesome app!');
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`);
}

function downloadApp() {
  window.open('https://www.appcreator24.com/app3480869-q98157', '_blank');
}

// Generate Story
function generateBusinessStory() {
  const business = businesses[currentBusinessIndex];
  const totalIncome = parseFloat(totalIncome.textContent.replace(business.currency, "").replace(/[^0-9.]/g, ""));
  const totalExpenses = parseFloat(totalExpenses.textContent.replace(business.currency, "").replace(/[^0-9.]/g, ""));
  const totalAssets = parseFloat(totalAssets.textContent.replace(business.currency, "").replace(/[^0-9.]/g, ""));
  const totalLiabilities = parseFloat(totalLiabilities.textContent.replace(business.currency, "").replace(/[^0-9.]/g, ""));
  const netWorth = totalAssets - totalLiabilities;
  const cashflow = totalIncome - totalExpenses;

  const story = `
    ## Financial Summary for ${business.name}
    
    - **Total Income**: ${formatCurrency(totalIncome)}
    - **Total Expenses**: ${formatCurrency(totalExpenses)}
    - **Cashflow**: ${formatCurrency(cashflow)}
    - **Total Assets**: ${formatCurrency(totalAssets)}
    - **Total Liabilities**: ${formatCurrency(totalLiabilities)}
    - **Net Worth**: ${formatCurrency(netWorth)}
    
    ${generateHealthTip(healthChart.data.datasets[0].data[0])}
  `;

  businessFinancialStory.innerHTML = story;
}

// Local Storage
function syncDataToLocalStorage() {
  localStorage.setItem("businesses", JSON.stringify(businesses));
}

function loadSavedData() {
  const savedData = localStorage.getItem("businesses");
  if (savedData) {
    businesses = JSON.parse(savedData);
    updateBusinessList();
    if (businesses.length > 0) {
      switchBusiness(0);
    }
  }
}

// Currency Converter
function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (amount && from && to && currencyRates[from] && currencyRates[to]) {
    const convertedAmount = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
  }
}

// Modals
function showModal(type) {
  modalOverlay.style.display = 'block';
  incomeModal.style.display = 'none';
  expenseModal.style.display = 'none';

  if (type === 'income') {
    incomeModal.style.display = 'block';
    populateCategories('income');
  } else {
    expenseModal.style.display = 'block';
    populateCategories('expense');
  }
}

function closeModal() {
  modalOverlay.style.display = 'none';
  incomeModal.style.display = 'none';
  expenseModal.style.display = 'none';
}

function populateCategories(type) {
  const select = document.getElementById(`${type}Category`);
  select.innerHTML = '<option value="">Select Category</option>';
  categories[type].forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function addNewCategory(type) {
  const input = document.getElementById(`new${type.charAt(0).toUpperCase() + type.slice(1)}Category`);
  const newCat = input.value.trim();
  if (newCat && !categories[type].includes(newCat)) {
    categories[type].push(newCat);
    populateCategories(type);
    input.value = '';
  }
}

window.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// Initialize
loadSavedData();
