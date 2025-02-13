// Initialize variables
let businesses = [];
let currentBusinessIndex = -1;
const currencyRates = {};
const appName = "Multi-Business Financial Tracker";

// DOM Elements
const businessList = document.getElementById('businessList');
const businessNameInput = document.getElementById('businessName');
const currencySelect = document.getElementById('currency');
const conversionFrom = document.getElementById('fromCurrency');
const conversionTo = document.getElementById('toCurrency');
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
const netWorthDisplay = document.getElementById('net-worth');
const healthChartCanvas = document.getElementById('healthChart').getContext('2d');
const healthPercentage = document.getElementById('healthPercentage');
const healthTips = document.getElementById('healthTips');
const financialStory = document.getElementById('financialStory');
const calculatorPopup = document.getElementById('calculatorPopup');
const calcDisplay = document.getElementById('calcDisplay');
const saveFileName = document.getElementById('saveFileName');

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

function populateCurrencyDropdowns() {
  const currencies = Object.keys(currencyRates);
  currencies.forEach(currency => {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = currency;
    conversionFrom.appendChild(option);
    conversionTo.appendChild(option);
    currencySelect.appendChild(option);
  });
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('financialTracker', JSON.stringify(businesses));
}

// Load data from localStorage
function loadData() {
  const data = localStorage.getItem('financialTracker');
  if (data) {
    businesses = JSON.parse(data);
    updateBusinessList();
    if (businesses.length > 0) switchBusiness(0);
  }
}

// Update business list dropdown
function updateBusinessList() {
  businessList.innerHTML = '';
  businesses.forEach((business, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = business.name;
    businessList.appendChild(option);
  });
}

// Add a new business
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (!name) return;
  businesses.push({
    name,
    description: '',
    currency: 'USD',
    residualIncomeTarget: 0,
    incomeStatement: {},
    balanceSheet: [],
    categories: [],
    dailyEntries: []
  });
  saveData();
  updateBusinessList();
  businessNameInput.value = '';
  switchBusiness(businesses.length - 1);
}

// Switch to another business
function switchBusiness(index) {
  currentBusinessIndex = index;
  if (currentBusinessIndex >= 0 && currentBusinessIndex < businesses.length) {
    currentBusiness = businesses[currentBusinessIndex];
    updateUI();
  }
}

// Update the UI
function updateUI() {
  updateProfileSection();
  updateTables();
  updateTotals();
  updateFinancialHealth();
}

// Update profile section
function updateProfileSection() {
  const profile = currentBusiness;
  document.getElementById('businessDescription').value = profile.description || '';
  currencySelect.value = profile.currency || 'USD';
  document.getElementById('residual-income-target').value = profile.residualIncomeTarget || 0;
  populateIncomeCategories();
}

// Update tables
function updateTables() {
  monthlyTableBody.innerHTML = '';
  categoryTableBody.innerHTML = '';
  dailyTableBody.innerHTML = '';
  balanceTableBody.innerHTML = '';

  // Income Statement
  const months = Object.keys(currentBusiness.incomeStatement || {});
  months.forEach(month => {
    const income = currentBusiness.incomeStatement[month].totals.income || 0;
    const expenses = currentBusiness.incomeStatement[month].totals.expenses || 0;
    const net = income - expenses;
    const row = `
      <tr>
        <td>${month}</td>
        <td class="financial_columns">$${income.toFixed(2)}</td>
        <td class="financial_columns">$${expenses.toFixed(2)}</td>
        <td class="net">${net.toFixed(2)}</td>
        <td class="action_column">
          <button class="clean-button collapse-icon" onclick="toggleCategory('${month}')">▼</button>
        </td>
      </tr>
    `;
    monthlyTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Categories
  const categories = currentBusiness.categories || [];
  categories.forEach(category => {
    const income = category.income || 0;
    const expenses = category.expenses || 0;
    const row = `
      <tr>
        <td>${category.name}</td>
        <td class="financial_columns">$${income.toFixed(2)}</td>
        <td class="financial_columns">$${expenses.toFixed(2)}</td>
        <td class="action_column">
          <button class="clean-button collapse-icon" onclick="toggleCategory('${category.name}')">▼</button>
        </td>
      </tr>
    `;
    categoryTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Daily Entries
  const dailyEntries = currentBusiness.dailyEntries || [];
  dailyEntries.forEach(entry => {
    const row = `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.description}</td>
        <td class="daily_financial_columns">${entry.type === 'income' ? '$' + entry.amount : '-$' + entry.amount}</td>
        <td class="action_column">
          <button class="clean-button" onclick="editDailyEntry(${entry.id})">✏️</button>
          <button class="clean-button" onclick="deleteDailyEntry(${entry.id})">🗑️</button>
        </td>
      </tr>
    `;
    dailyTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Balance Sheet
  currentBusiness.balanceSheet.forEach(asset => {
    const row = `
      <tr>
        <td>${asset.date}</td>
        <td>${asset.description}</td>
        <td>$${asset.amount}</td>
        <td class="action_column">
          <button class="clean-button" onclick="editAsset(${asset.id})">✏️</button>
          <button class="clean-button" onclick="deleteAsset(${asset.id})">🗑️</button>
        </td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });

  currentBusiness.balanceSheet.forEach(liability => {
    const row = `
      <tr>
        <td>${liability.date}</td>
        <td>${liability.description}</td>
        <td>-$${liability.amount}</td>
        <td class="action_column">
          <button class="clean-button" onclick="editLiability(${liability.id})">✏️</button>
          <button class="clean-button" onclick="deleteLiability(${liability.id})">🗑️</button>
        </td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });
}

// Update totals
function updateTotals() {
  let totalIncomeVal = 0;
  let totalExpensesVal = 0;
  let totalAssetsVal = 0;
  let totalLiabilitiesVal = 0;

  Object.values(currentBusiness.incomeStatement || {}).forEach(month => {
    totalIncomeVal += month.totals.income || 0;
    totalExpensesVal += month.totals.expenses || 0;
  });

  currentBusiness.balanceSheet.forEach(item => {
    if (item.type === 'asset') totalAssetsVal += item.amount;
    if (item.type === 'liability') totalLiabilitiesVal += item.amount;
  });

  totalIncome.textContent = `$${totalIncomeVal.toFixed(2)}`;
  totalExpenses.textContent = `$${totalExpensesVal.toFixed(2)}`;
  cashflowDisplay.textContent = `$${(totalIncomeVal - totalExpensesVal).toFixed(2)}`;
  totalAssets.textContent = `$${totalAssetsVal.toFixed(2)}`;
  totalLiabilities.textContent = `$${totalLiabilitiesVal.toFixed(2)}`;
  netWorthDisplay.textContent = `$${(totalAssetsVal - totalLiabilitiesVal).toFixed(2)}`;
}

// Update financial health
function updateFinancialHealth() {
  const averageCashflow = calculateAverageCashflow();
  const target = currentBusiness.residualIncomeTarget;
  let score = 0;
  if (target !== 0) {
    score = Math.round((averageCashflow / target) * 100);
    if (score > 100) score = 100;
    if (score < 0) score = 0;
  }
  healthChart.data.datasets[0].data = [score];
  healthChart.update();
  healthPercentage.textContent = `${score}%`;
  healthTips.textContent = getHealthTip(score);
}

function calculateAverageCashflow() {
  const months = Object.keys(currentBusiness.incomeStatement || {});
  if (months.length === 0) return 0;
  const totalCashflow = months.reduce((sum, month) => {
    const monthData = currentBusiness.incomeStatement[month];
    return sum + (monthData.totals.income - monthData.totals.expenses);
  }, 0);
  return totalCashflow / months.length;
}

function getHealthTip(score) {
  const tips = {
    excellent: [
      "Your financial health is excellent! Keep up the great work.",
      "You've achieved financial freedom. Continue investing in assets to grow your wealth.",
      "Your cashflow exceeds your target by a significant margin.",
      "Your net worth is impressive. Look into philanthropy or legacy planning.",
      "Your financial success is an inspiration. Mentor others to achieve similar results.",
      "Keep diversifying your investments to maintain steady growth.",
      "Monitor your expenses to ensure they remain stable or decrease.",
      "Invest in high-growth stocks to further boost your portfolio.",
      "Consider giving back through charitable donations or community initiatives.",
      "Regularly review your financial statements to optimize your strategy.",
      "You’re well-positioned to take calculated risks for higher returns."
    ],
    good: [
      "Your finances are stable but could improve. Aim to grow your passive income.",
      "Your cashflow is decent but there's room for growth. Invest in assets that appreciate.",
      "Diversify your income streams to build a solid financial foundation.",
      "Your net worth is growing. Keep up the good work and explore wealth-building strategies.",
      "Consider using a financial advisor to optimize your investments.",
      "Save more each month to reach your financial goals faster.",
      "Explore opportunities to automate your savings and investments.",
      "Invest in yourself by learning new skills to increase your earning potential.",
      "Regularly review your budget to identify areas for improvement.",
      "Consider boosting your emergency fund for better financial security."
    ],
    warning: [
      "Your cashflow is below target. Focus on increasing income or reducing expenses.",
      "Consider investing in assets that generate passive income to bridge the gap.",
      "Your financial freedom goal is within reach. Keep working towards it!",
      "Look for ways to cut down on unnecessary expenses and redirect funds to savings.",
      "Explore part-time work or freelance opportunities to boost your income.",
      "Track your expenses closely to identify areas where you can cut costs."
    ],
    critical: [
      "Your financial health is in critical condition. Immediate action required!",
      "Expenses are significantly higher than income. Reduce discretionary spending now!",
      "Seek professional financial advice to avoid further financial risks.",
      "Focus on paying off high-interest debts as a priority.",
      "Consider selling non-essential assets to generate immediate cash flow.",
      "Avoid taking on new debt until your financial situation improves."
    ]
  };

  if (score >= 90) return tips.excellent[Math.floor(Math.random() * tips.excellent.length)];
  if (score >= 70) return tips.good[Math.floor(Math.random() * tips.good.length)];
  if (score >= 50) return tips.warning[Math.floor(Math.random() * tips.warning.length)];
  return tips.critical[Math.floor(Math.random() * tips.critical.length)];
}

function toggleCategory(key) {
  const category = document.querySelector(`[data-key="${key}"]`);
  if (category) {
    category.classList.toggle('collapsed');
  }
}

function addNewCategory() {
  const name = prompt('Enter new category name:');
  if (name) {
    currentBusiness.categories.push({
      name,
      income: 0,
      expenses: 0
    });
    saveData();
    populateIncomeCategories();
    updateTables();
  }
}

function populateIncomeCategories() {
  const categorySelect = document.getElementById('incomeCategory');
  categorySelect.innerHTML = '';
  const expenseSelect = document.getElementById('expenseCategory');
  expenseSelect.innerHTML = '';
  currentBusiness.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
    expenseSelect.appendChild(option.cloneNode(true));
  });
}

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
      currentBusiness.incomeStatement[monthKey].totals.income += amount;
    } else {
      currentBusiness.incomeStatement[monthKey].totals.expenses += amount;
    }

    currentBusiness.incomeStatement[monthKey].entries.push(entry);
    saveData();
    updateTables();
    updateTotals();
  }
}

function addAssetEntry() {
  const amount = parseFloat(prompt('Enter asset amount:'));
  const description = prompt('Enter description:');
  if (!isNaN(amount) && description) {
    currentBusiness.balanceSheet.push({
      id: Date.now(),
      type: 'asset',
      date: new Date().toISOString().slice(0, 10),
      amount,
      description
    });
    saveData();
    updateTables();
    updateTotals();
  }
}

function addLiabilityEntry() {
  const amount = parseFloat(prompt('Enter liability amount:'));
  const description = prompt('Enter description:');
  if (!isNaN(amount) && description) {
    currentBusiness.balanceSheet.push({
      id: Date.now(),
      type: 'liability',
      date: new Date().toISOString().slice(0, 10),
      amount,
      description
    });
    saveData();
    updateTables();
    updateTotals();
  }
}

function editBusinessName() {
  const newName = prompt('Enter new business name:', currentBusiness.name);
  if (newName) {
    currentBusiness.name = newName;
    saveData();
    updateBusinessList();
  }
}

function deleteBusiness() {
  if (confirm('Are you sure you want to delete this business?')) {
    businesses.splice(currentBusinessIndex, 1);
    saveData();
    updateBusinessList();
    switchBusiness(0);
  }
}

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

function convertCurrency() {
  const amount = parseFloat(document.getElementById('convertAmount').value);
  const from = conversionFrom.value;
  const to = conversionTo.value;
  if (from && to && amount && currencyRates[from] && currencyRates[to]) {
    const rate = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${rate.toFixed(2)} ${to}`;
  } else {
    conversionResult.textContent = 'Invalid input';
  }
}

function saveBusinessProfile() {
  currentBusiness.description = document.getElementById('businessDescription').value;
  currentBusiness.currency = currencySelect.value;
  saveData();
  updateUI();
}

function updateResidualTarget() {
  currentBusiness.residualIncomeTarget = parseFloat(document.getElementById('residual-income-target').value) || 0;
  saveData();
  updateFinancialHealth();
}

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

function clearData() {
  if (confirm('Are you sure you want to clear all data?')) {
    currentBusiness.incomeStatement = {};
    currentBusiness.balanceSheet = [];
    currentBusiness.categories = [];
    currentBusiness.dailyEntries = [];
    saveData();
    updateTables();
    updateTotals();
  }
}

function shareOnWhatsApp() {
  const href = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check%20out%20this%20financial%20tracker:%20${href}`);
}

function shareOnLinkedIn() {
  const summary = encodeURIComponent('Check out this financial tracker to manage your finances efficiently.');
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${summary}`;
  window.open(url);
}

function openApp() {
  window.open('https://www.appcreator24.com/app3480869-q98157', '_blank');
}

function generateStory() {
  const incomeTotal = parseFloat(totalIncome.textContent.replace('$', ''));
  const expenseTotal = parseFloat(totalExpenses.textContent.replace('$', ''));
  const cashflow = parseFloat(cashflowDisplay.textContent.replace('$', ''));
  const assetTotal = parseFloat(totalAssets.textContent.replace('$', ''));
  const liabilityTotal = parseFloat(totalLiabilities.textContent.replace('$', ''));
  const netWorth = assetTotal - liabilityTotal;
  const residualTarget = currentBusiness.residualIncomeTarget;
  const remaining = residualTarget - cashflow;

  const story = `
    *Financial Snapshot (${new Date().toLocaleString()})*\n
    Income: *$${incomeTotal.toFixed(2)}* | Expenses: *$${expenseTotal.toFixed(2)}*\n
    Cashflow: *$${cashflow.toFixed(2)}* | Target: *$${residualTarget.toFixed(2)}*\n
    Remaining to Target: *$${remaining.toFixed(2)}*\n
    Net Worth: *$${netWorth.toFixed(2)}*\n
    \n*Recommendations:*\n
    ${getHealthTip(calculateHealthScore())}
    View full report at ${window.location.href}
  `;
  financialStory.textContent = story;
}

function calculateHealthScore() {
  const averageCashflow = calculateAverageCashflow();
  const target = currentBusiness.residualIncomeTarget;
  return Math.ceil((averageCashflow / target) * 100);
}

function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === 'block' ? 'none' : 'block';
}

document.body.addEventListener('click', (event) => {
  if (!event.target.closest('.calculator-icon') && !event.target.closest('.calculator-popup')) {
    calculatorPopup.style.display = 'none';
  }
});

function calcInput(value) {
  const display = calcDisplay.value || '0';
  calcDisplay.value = (display === '0' ? '' : display) + value;
}

function calcDelete() {
  calcDisplay.value = calcDisplay.value.slice(0, -1) || '0';
}

function calcClear() {
  calcDisplay.value = '0';
}

function calcEqual() {
  try {
    calcDisplay.value = eval(calcDisplay.value).toString() || '0';
  } catch {
    calcDisplay.value = 'Error';
  }
}

function calcOperator(operator) {
  calcDisplay.value += operator;
}

// Load data on page load
loadData();
