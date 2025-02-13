// Initialize variables
let businesses = [];
let currentBusinessIndex = -1;
const currencyRates = { USD: 1 };
const appName = "Multi-Business Financial Tracker";

// DOM Elements
const businessList = document.getElementById('businessList');
const businessNameInput = document.getElementById('businessName');
const currencySelect = document.getElementById('currency');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const conversionResult = document.getElementById('conversionResult');
const monthlyTableBody = document.getElementById('monthlyTableBody');
const categoryTableBody = document.getElementById('categoryTableBody');
const dailyTableBody = document.getElementById('dailyTableBody');
const balanceTableBody = document.getElementById('balance-sheet-body');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const cashflowDisplay = document.getElementById('cashflow');
const totalAssets = document.getElementById('total-assets');
const totalLiabilities = document.getElementById('total-liabilities');
const netWorth = document.getElementById('net-worth');
const healthChartCanvas = document.getElementById('healthChart').getContext('2d');
const healthPercentage = document.getElementById('healthPercentage');
const healthTips = document.getElementById('healthTips');
const financialStory = document.getElementById('financialStory');
const calculatorPopup = document.getElementById('calculatorPopup');
const calcDisplay = document.getElementById('calcDisplay');
const saveFileName = document.getElementById('saveFileName');
const addIncomeModal = document.getElementById('addIncomeModal');
const addExpenseModal = document.getElementById('addExpenseModal');
const addCategoryModal = document.getElementById('addCategoryModal');
const addAssetModal = document.getElementById('addAssetModal');
const addLiabilityModal = document.getElementById('addLiabilityModal');

// Chart initialization
const healthChart = new Chart(healthChartCanvas, {
  type: 'doughnut',
  data: {
    labels: ['Health'],
    datasets: [{
      data: [0],
      backgroundColor: ['#28a745']
    }]
  },
  options: {
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false
  }
});

// Fetch currency rates from the API
fetch('https://v6.exchangerate-api.com/v6/eb5cfc3ff6c3b48bb6f60c83/latest/USD')
  .then(response => response.json())
  .then(data => {
    currencyRates = data.conversion_rates;
    populateCurrencyDropdowns();
  })
  .catch(error => {
    console.error('Error fetching currency rates:', error);
  });

// Function to populate currency dropdowns
function populateCurrencyDropdowns() {
  const currencies = Object.keys(currencyRates);
  currencies.forEach(currency => {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = currency;
    fromCurrency.appendChild(option.cloneNode(true));
    toCurrency.appendChild(option.cloneNode(true));
    currencySelect.appendChild(option.cloneNode(true));
  });
}

// Function to save data to localStorage
function saveData() {
  localStorage.setItem('financialTracker', JSON.stringify(businesses));
}

// Function to load data from localStorage
function loadData() {
  const data = localStorage.getItem('financialTracker');
  if (data) {
    businesses = JSON.parse(data);
    updateBusinessList();
    if (businesses.length > 0) switchBusiness(0);
  }
}

// Function to update the business list dropdown
function updateBusinessList() {
  businessList.innerHTML = '';
  businesses.forEach((business, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = business.name;
    businessList.appendChild(option);
  });
}

// Function to add a new business
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (!name) return;
  businesses.push({
    name,
    description: '',
    currency: 'USD',
    residualIncomeTarget: 0,
    incomeStatement: {},
    balanceSheet: []
  });
  saveData();
  updateBusinessList();
  businessNameInput.value = '';
  switchBusiness(businesses.length - 1);
}

// Function to switch between businesses
function switchBusiness(index) {
  currentBusinessIndex = index;
  if (currentBusinessIndex >= 0 && currentBusinessIndex < businesses.length) {
    currentBusiness = businesses[currentBusinessIndex];
    updateUI();
  }
}

// Function to update the user interface
function updateUI() {
  updateProfileSection();
  updateTables();
  updateTotals();
  updateFinancialHealth();
}

// Function to update the profile section
function updateProfileSection() {
  document.getElementById('businessDescription').value = currentBusiness.description || '';
  currencySelect.value = currentBusiness.currency || 'USD';
  document.getElementById('residual-income-target').value = currentBusiness.residualIncomeTarget || 0;
}

// Function to update tables
function updateTables() {
  monthlyTableBody.innerHTML = '';
  categoryTableBody.innerHTML = '';
  dailyTableBody.innerHTML = '';

  // Update monthly table
  const months = Object.keys(currentBusiness.incomeStatement || {});
  months.forEach(month => {
    const monthData = currentBusiness.incomeStatement[month];
    const row = `
      <tr>
        <td>${month}</td>
        <td class="financial_columns">
          <div class="income_expense_header">
            <span>$${monthData.totals.income}</span>
            <span>$${monthData.totals.expenses}</span>
          </div>
        </td>
        <td>$${monthData.totals.net}</td>
        <td class="action_column">
          <button class="clean-button danger-button" onclick="toggleCategory('${month}')">▼</button>
        </td>
      </tr>
    `;
    monthlyTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Update category table
  const categories = Object.keys(currentBusiness.categories || {});
  categories.forEach(category => {
    const categoryData = currentBusiness.categories[category];
    const row = `
      <tr>
        <td>${category}</td>
        <td class="financial_columns">
          <div class="income_expense_header">
            <span>$${categoryData.income}</span>
            <span>$${categoryData.expenses}</span>
          </div>
        </td>
        <td class="action_column">
          <button class="clean-button danger-button" onclick="toggleDailyEntries('${category}')">▼</button>
        </td>
      </tr>
    `;
    categoryTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Update daily entries table
  const dailyEntries = currentBusiness.dailyEntries || [];
  dailyEntries.forEach(entry => {
    const row = `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.description}</td>
        <td class="daily_financial_columns">
          <div class="income_expense_header_daily">
            <span>${entry.type === 'income' ? '$' + entry.amount : ''}</span>
            <span>${entry.type === 'expense' ? '-$' + entry.amount : ''}</span>
          </div>
        </td>
        <td class="daily_action_column">
          <button class="clean-button danger-button" onclick="editDailyEntry(${entry.id})">✏️</button>
          <button class="clean-button danger-button" onclick="deleteDailyEntry(${entry.id})">🗑️</button>
        </td>
      </tr>
    `;
    dailyTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Update balance sheet
  balanceTableBody.innerHTML = '';
  currentBusiness.assets.forEach(asset => {
    const row = `
      <tr>
        <td>${new Date(asset.date).toLocaleDateString()}</td>
        <td>${asset.description}</td>
        <td>$${asset.amount}</td>
        <td>
          <button class="clean-button danger-button" onclick="editAsset(${asset.id})">✏️</button>
          <button class="clean-button danger-button" onclick="deleteAsset(${asset.id})">🗑️</button>
        </td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });

  currentBusiness.liabilities.forEach(liability => {
    const row = `
      <tr>
        <td>${new Date(liability.date).toLocaleDateString()}</td>
        <td>${liability.description}</td>
        <td>-$${liability.amount}</td>
        <td>
          <button class="clean-button danger-button" onclick="editLiability(${liability.id})">✏️</button>
          <button class="clean-button danger-button" onclick="deleteLiability(${liability.id})">🗑️</button>
        </td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });
}

// Function to update totals
function updateTotals() {
  let totalIncomeVal = 0;
  let totalExpensesVal = 0;
  for (const month in currentBusiness.incomeStatement || {}) {
    const monthData = currentBusiness.incomeStatement[month];
    totalIncomeVal += monthData.totals.income;
    totalExpensesVal += monthData.totals.expenses;
  }

  totalIncome.textContent = `$${totalIncomeVal.toFixed(2)}`;
  totalExpenses.textContent = `$${totalExpensesVal.toFixed(2)}`;
  cashflowDisplay.textContent = `$${(totalIncomeVal - totalExpensesVal).toFixed(2)}`;

  const assetTotal = calculateBalance(currentBusiness.assets, 'asset');
  const liabilityTotal = calculateBalance(currentBusiness.liabilities, 'liability');
  totalAssets.textContent = `$${assetTotal.toFixed(2)}`;
  totalLiabilities.textContent = `$${liabilityTotal.toFixed(2)}`;
  netWorth.textContent = `$${(assetTotal - liabilityTotal).toFixed(2)}`;
}

// Function to calculate totals
function calculateTotal(categoryItems, type) {
  return categoryItems.reduce((sum, item) => {
    if (type === 'income' && item.type === 'income') {
      return sum + parseFloat(item.amount);
    } else if (type === 'expense' && item.type === 'expense') {
      return sum + parseFloat(item.amount);
    } else {
      return sum;
    }
  }, 0);
}

function calculateBalance(balanceItems, type) {
  return balanceItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
}

// Function to update financial health
function updateFinancialHealth() {
  const cashflow = parseFloat(cashflowDisplay.textContent.replace('$', '').replace(',', '')).toFixed(2);
  const target = currentBusiness.residualIncomeTarget;
  let score = 0;
  if (target !== 0) {
    score = Math.round((cashflow / target) * 100);
    if (score < 0) score = 0;
    else if (score > 100) score = 100;
  }
  healthChart.data.datasets[0].data = [score];
  healthChart.update();
  healthPercentage.textContent = `${score}%`;
  healthTips.textContent = getHealthTip(score, cashflow);
}

function getHealthTip(score, cashflow) {
  const tips = {
    excellent: [
      "Your financial health is excellent! Keep up the great work.",
      "You've achieved financial freedom. Continue investing in assets to grow your wealth.",
      "Your cashflow exceeds your target by a significant margin.",
      "Your net worth is impressive. Look into philanthropy or legacy planning.",
      "Your financial success is an inspiration. Mentor others to achieve similar results.",
      "Keep diversifying your investments to maintain steady growth."
    ],
    good: [
      "Your finances are stable but could improve. Aim to grow your passive income.",
      "Your cashflow is decent but there's room for growth. Invest in assets that appreciate.",
      "Diversify your income streams to build a solid financial foundation.",
      "Your net worth is growing. Keep up the good work and explore wealth-building strategies.",
      "Consider using a financial advisor to optimize your investments.",
      "Save more each month to reach your financial goals faster."
    ],
    warning: [
      "Your cashflow is below target. Focus on increasing income or reducing expenses.",
      "Consider investing in assets that generate passive income to bridge the gap.",
      "Your financial freedom goal is within reach. Keep working towards it!"
    ],
    critical: [
      "Your financial health is in critical condition. Immediate action required!",
      "Expenses are significantly higher than income. Reduce discretionary spending now!",
      "Seek professional financial advice to avoid further financial risks."
    ]
  };

  if (score >= 90) return tips.excellent[Math.floor(Math.random() * tips.excellent.length)];
  if (score >= 70) return tips.good[Math.floor(Math.random() * tips.good.length)];
  if (score >= 50) return tips.warning[Math.floor(Math.random() * tips.warning.length)];
  return tips.critical[Math.floor(Math.random() * tips.critical.length)];
}

// Function to toggle category table
function toggleCategory(month) {
  const categoryContainer = document.getElementById(`category-${month}`);
  if (categoryContainer) {
    categoryContainer.classList.toggle('collapsed');
  }
}

// Function to toggle daily entries
function toggleDailyEntries(category) {
  const dailyEntriesContainer = document.getElementById(`daily-${category}`);
  if (dailyEntriesContainer) {
    dailyEntriesContainer.classList.toggle('collapsed');
  }
}

// Function to add daily entry
function addDailyEntry(type) {
  const amount = parseFloat(prompt(`Enter ${type} amount:`));
  const description = prompt(`Enter ${type} description:`);
  const category = prompt(`Enter ${type} category:`) || 'Default';
  const date = new Date().toISOString().slice(0, 10);

  if (!isNaN(amount) && description && category) {
    if (!currentBusiness.incomeStatement) currentBusiness.incomeStatement = {};
    const monthKey = date.slice(0, 7);
    if (!currentBusiness.incomeStatement[monthKey]) {
      currentBusiness.incomeStatement[monthKey] = {
        categories: {},
        totals: { income: 0, expenses: 0, net: 0 }
      };
    }

    if (!currentBusiness.incomeStatement[monthKey].categories[category]) {
      currentBusiness.incomeStatement[monthKey].categories[category] = {
        entries: [],
        totals: { income: 0, expenses: 0 }
      };
    }

    const entry = {
      id: Date.now(),
      date,
      type,
      amount,
      description,
      category
    };

    if (type === 'income') {
      currentBusiness.incomeStatement[monthKey].categories[category].totals.income += amount;
      currentBusiness.incomeStatement[monthKey].totals.income += amount;
    } else {
      currentBusiness.incomeStatement[monthKey].categories[category].totals.expenses += amount;
      currentBusiness.incomeStatement[monthKey].totals.expenses += amount;
    }

    currentBusiness.incomeStatement[monthKey].categories[category].entries.push(entry);
    currentBusiness.incomeStatement[monthKey].totals.net = currentBusiness.incomeStatement[monthKey].totals.income - currentBusiness.incomeStatement[monthKey].totals.expenses;

    saveData();
    updateTables();
    updateTotals();
  }
}

// Function to add new category
function addNewCategory() {
  const category = prompt('Enter new category name:');
  if (category) {
    if (!currentBusiness.categories) currentBusiness.categories = {};
    currentBusiness.categories[category] = {
      income: 0,
      expenses: 0
    };
    saveData();
    updateTables();
  }
}

// Function to edit business name
function editBusinessName() {
  const newName = prompt('Enter new business name:', currentBusiness.name);
  if (newName) {
    currentBusiness.name = newName;
    saveData();
    updateBusinessList();
  }
}

// Function to delete business
function deleteBusiness() {
  if (confirm('Are you sure you want to delete this business?')) {
    businesses.splice(currentBusinessIndex, 1);
    saveData();
    updateBusinessList();
    switchBusiness(0);
  }
}

// Function to edit item
function editItem(type, id) {
  const items = currentBusiness[type];
  const itemIndex = items.findIndex(item => item.id === id);
  if (itemIndex !== -1) {
    const item = items[itemIndex];
    const newAmount = parseFloat(prompt('Enter new amount:', item.amount));
    const newDescription = prompt('Enter new description:', item.description);
    if (!isNaN(newAmount) && newDescription) {
      item.amount = newAmount;
      item.description = newDescription;
      saveData();
      updateTables();
      updateTotals();
    }
  }
}

// Function to delete item
function deleteItem(type, id) {
  const items = currentBusiness[type];
  const itemIndex = items.findIndex(item => item.id === id);
  if (itemIndex !== -1) {
    items.splice(itemIndex, 1);
    saveData();
    updateTables();
    updateTotals();
  }
}

// Function to convert currency
function convertCurrency() {
  const amount = parseFloat(document.getElementById('convertAmount').value);
  const from = fromCurrency.value;
  const to = toCurrency.value;
  if (from && to && amount) {
    const rate = currencyRates[from] ? (amount / currencyRates[from]) * currencyRates[to] : 'Invalid';
    conversionResult.textContent = rate !== 'Invalid' ? `${amount} ${from} = ${rate.toFixed(2)} ${to}` : 'Invalid currency';
  } else {
    conversionResult.textContent = 'Invalid input';
  }
}

// Function to save business profile
function saveBusinessProfile() {
  currentBusiness.description = document.getElementById('businessDescription').value;
  currentBusiness.currency = currencySelect.value;
  saveData();
  updateUI();
}

// Function to update residual target
function updateResidualTarget() {
  currentBusiness.residualIncomeTarget = parseFloat(document.getElementById('residual-income-target').value) || 0;
  saveData();
  updateFinancialHealth();
}

// Function to export data
function exportData() {
  const fileName = saveFileName.value || 'financial-data';
  const blob = new Blob([JSON.stringify(currentBusiness)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Function to import data
function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = JSON.parse(event.target.result);
      if (data.name) {
        businesses.push(data);
        saveData();
        updateBusinessList();
        switchBusiness(businesses.length - 1);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Function to clear data
function clearData() {
  if (confirm('Are you sure you want to clear all data?')) {
    currentBusiness.incomeStatement = {};
    currentBusiness.balanceSheet = [];
    saveData();
    updateTables();
    updateTotals();
  }
}

// Function to share on WhatsApp
function shareOnWhatsApp() {
  const href = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check%20out%20this%20financial%20tracker:%20${href}`);
}

// Function to share on LinkedIn
function shareOnLinkedIn() {
  const summary = encodeURIComponent('Check out this financial tracker to manage your finances efficiently.');
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${summary}`;
  window.open(url);
}

// Function to open app
function openApp() {
  window.open('https://www.appcreator24.com/app3480869-q98157', '_blank');
}

// Function to generate story
function generateStory() {
  const incomeTotal = parseFloat(totalIncome.textContent.replace('$', ''));
  const expenseTotal = parseFloat(totalExpenses.textContent.replace('$', ''));
  const cashflow = parseFloat(cashflowDisplay.textContent.replace('$', ''));
  const assetTotal = parseFloat(totalAssets.textContent.replace('$', ''));
  const liabilityTotal = parseFloat(totalLiabilities.textContent.replace('$', ''));
  const netWorthValue = assetTotal - liabilityTotal;
  const residualTarget = currentBusiness.residualIncomeTarget;
  const remainingToTarget = residualTarget - cashflow;

  const timeStamp = new Date().toLocaleString();
  const story = `
    ## Financial Snapshot (${timeStamp})

    ### Income & Expenses
    - **Total Income**: $${incomeTotal}
    - **Total Expenses**: $${expenseTotal}
    - **Cashflow**: $${cashflow}

    ### Balance Sheet
    - **Total Assets**: $${assetTotal}
    - **Total Liabilities**: $${liabilityTotal}
    - **Net Worth**: $${netWorthValue}

    ### Financial Health
    - **Health Score**: ${healthPercentage.textContent}%
    - **Residual Income Target**: $${residualTarget}
    - **Remaining to Target**: $${remainingToTarget}

    ---
    ### Highlights
    1. Your business is generating a steady income stream of $${incomeTotal} this year.
    2. Expenses are currently at $${expenseTotal}, ensure they remain under control to maintain profitability.
    3. Your current cashflow of $${cashflow} is ${cashflow < residualTarget ? 'falling short' : 'exceeding'} your residual income target by $${Math.abs(remainingToTarget)}.

    ### Actionable Insights
    - If your cashflow is below target, look for opportunities to reduce variable expenses.
    - Explore new revenue channels to boost your income.
    - Consider reinvesting profits into assets that can generate passive income.

    ### Recommendations
    - If you are aiming to increase your net worth, focus on reducing liabilities and increasing assets systematically.
    - Regularly review your financial statements to identify trends and adjust your strategy accordingly.

    ---
    *This report is generated by ${appName} – your ultimate financial management tool.*
  `;

  financialStory.textContent = story;
}

// Calculator functionality
let calcExpression = '';
function calcInput(value) {
  calcExpression += value;
  calcDisplay.textContent = calcExpression;
}

function calcEqual() {
  try {
    const result = eval(calcExpression);
    calcExpression = result.toString();
    calcDisplay.textContent = calcExpression;
  } catch {
    calcDisplay.textContent = 'Error';
  }
}

function calcClear() {
  calcExpression = '';
  calcDisplay.textContent = '0';
}

function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === 'block' ? 'none' : 'block';
}

// Event listener to hide calculator on outside click
document.body.addEventListener('click', (event) => {
  if (!event.target.closest('.calculator-icon') && !event.target.closest('.calculator-popup')) {
    calculatorPopup.style.display = 'none';
  }
});

// Load data on page load
loadData();

// Modal handling
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
}

// Add income modal
document.getElementById('addIncomeBtn').addEventListener('click', () => {
  openModal('addIncomeModal');
});

document.getElementById('addIncomeForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const amount = parseFloat(document.getElementById('incomeAmount').value);
  const description = document.getElementById('incomeDescription').value;
  const category = document.getElementById('incomeCategory').value;
  const date = new Date().toISOString().slice(0, 10);

  if (!isNaN(amount) && description && category) {
    if (!currentBusiness.incomeStatement) currentBusiness.incomeStatement = {};
    const monthKey = date.slice(0, 7);
    if (!currentBusiness.incomeStatement[monthKey]) {
      currentBusiness.incomeStatement[monthKey] = {
        categories: {},
        totals: { income: 0, expenses: 0, net: 0 }
      };
    }

    if (!currentBusiness.incomeStatement[monthKey].categories[category]) {
      currentBusiness.incomeStatement[monthKey].categories[category] = {
        entries: [],
        totals: { income: 0, expenses: 0 }
      };
    }

    const entry = {
      id: Date.now(),
      date,
      type: 'income',
      amount,
      description,
      category
    };

    currentBusiness.incomeStatement[monthKey].categories[category].totals.income += amount;
    currentBusiness.incomeStatement[monthKey].totals.income += amount;
    currentBusiness.incomeStatement[monthKey].categories[category].entries.push(entry);
    currentBusiness.incomeStatement[monthKey].totals.net = currentBusiness.incomeStatement[monthKey].totals.income - currentBusiness.incomeStatement[monthKey].totals.expenses;

    saveData();
    updateTables();
    updateTotals();
    closeModal('addIncomeModal');
  }
});

// Add expense modal
document.getElementById('addExpenseBtn').addEventListener('click', () => {
  openModal('addExpenseModal');
});

document.getElementById('addExpenseForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const description = document.getElementById('expenseDescription').value;
  const category = document.getElementById('expenseCategory').value;
  const date = new Date().toISOString().slice(0, 10);

  if (!isNaN(amount) && description && category) {
    if (!currentBusiness.incomeStatement) currentBusiness.incomeStatement = {};
    const monthKey = date.slice(0, 7);
    if (!currentBusiness.incomeStatement[monthKey]) {
      currentBusiness.incomeStatement[monthKey] = {
        categories: {},
        totals: { income: 0, expenses: 0, net: 0 }
      };
    }

    if (!currentBusiness.incomeStatement[monthKey].categories[category]) {
      currentBusiness.incomeStatement[monthKey].categories[category] = {
        entries: [],
        totals: { income: 0, expenses: 0 }
      };
    }

    const entry = {
      id: Date.now(),
      date,
      type: 'expense',
      amount,
      description,
      category
    };

    currentBusiness.incomeStatement[monthKey].categories[category].totals.expenses += amount;
    currentBusiness.incomeStatement[monthKey].totals.expenses += amount;
    currentBusiness.incomeStatement[monthKey].categories[category].entries.push(entry);
    currentBusiness.incomeStatement[monthKey].totals.net = currentBusiness.incomeStatement[monthKey].totals.income - currentBusiness.incomeStatement[monthKey].totals.expenses;

    saveData();
    updateTables();
    updateTotals();
    closeModal('addExpenseModal');
  }
});
