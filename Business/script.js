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
fetch('https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD')
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
    income: [],
    expenses: [],
    assets: [],
    liabilities: []
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
  currentBusiness.income.forEach(income => {
    const row = `
      <tr>
        <td>${new Date(income.date).toLocaleDateString()}</td>
        <td class="financial_columns">
          <div class="income_expense_header">
            <span>$${income.amount}</span>
            <span></span>
          </div>
        </td>
        <td>$${income.amount}</td>
        <td class="action_column">
          <button class="clean-button danger-button collapse-icon" onclick="toggleCategory(this)">▼</button>
        </td>
      </tr>
    `;
    monthlyTableBody.insertAdjacentHTML('beforeend', row);
  });

  currentBusiness.expenses.forEach(expense => {
    const row = `
      <tr>
        <td>${new Date(expense.date).toLocaleDateString()}</td>
        <td class="financial_columns">
          <div class="income_expense_header">
            <span></span>
            <span>-$${expense.amount}</span>
          </div>
        </td>
        <td>-$${expense.amount}</td>
        <td class="action_column">
          <button class="clean-button danger-button collapse-icon" onclick="toggleCategory(this)">▼</button>
        </td>
      </tr>
    `;
    monthlyTableBody.insertAdjacentHTML('beforeend', row);
  });

  categoryTableBody.innerHTML = '';
  currentBusiness.categories.forEach(category => {
    const row = `
      <tr>
        <td>${category.name}</td>
        <td class="financial_columns">
          <div class="income_expense_header">
            <span>$${category.income}</span>
            <span>-$${category.expenses}</span>
          </div>
        </td>
        <td class="action_column">
          <button class="clean-button danger-button collapse-icon" onclick="toggleDailyEntries(this)">▼</button>
        </td>
      </tr>
    `;
    categoryTableBody.insertAdjacentHTML('beforeend', row);
  });

  dailyTableBody.innerHTML = '';
  currentBusiness.dailyEntries.forEach(entry => {
    const row = `
      <tr>
        <td>${new Date(entry.date).toLocaleDateString()}</td>
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
  const incomeTotal = calculateTotal(currentBusiness.income, 'income');
  const expenseTotal = calculateTotal(currentBusiness.expenses, 'expense');
  const cashflow = incomeTotal - expenseTotal;
  const assetTotal = calculateBalance(currentBusiness.assets, 'asset');
  const liabilityTotal = calculateBalance(currentBusiness.liabilities, 'liability');

  totalIncome.textContent = `$${incomeTotal.toFixed(2)}`;
  totalExpenses.textContent = `$${expenseTotal.toFixed(2)}`;
  cashflowDisplay.textContent = `$${cashflow.toFixed(2)}`;
  totalAssets.textContent = `$${assetTotal.toFixed(2)}`;
  totalLiabilities.textContent = `$${liabilityTotal.toFixed(2)}`;
  netWorth.textContent = `$${(assetTotal - liabilityTotal).toFixed(2)}`;

  updateAverages(incomeTotal, expenseTotal, cashflow);
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

function updateAverages(income, expenses, cashflow) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const avgIncome = income / months.length;
  const avgExpenses = expenses / months.length;
  const avgCashflow = cashflow / months.length;

  document.getElementById('average-income').textContent = `$${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `$${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `$${avgCashflow.toFixed(2)}`;
}

// Function to update financial health
function updateFinancialHealth() {
  const cashflow = parseFloat(cashflowDisplay.textContent.replace('$', '')).toFixed(2);
  const target = currentBusiness.residualIncomeTarget;
  const score = target === 0 ? 0 : Math.round((cashflow / target) * 100);
  healthChart.data.datasets[0].data = [score];
  healthChart.update();
  healthPercentage.textContent = `${score}%`;
  healthTips.textContent = getHealthTip(score, cashflow);
}

function getHealthTip(score, cashflow) {
  if (score < 50) {
    return [
      "Your cashflow is below target. Consider cutting down on unnecessary spending.",
      "Try reducing variable expenses like eating out or subscriptions to save money.",
      "Increase your income through part-time work or freelance gigs.",
      "Set a strict budget and track your expenses daily.",
      "Consider consolidating your debts to lower interest rates.",
      "Explore passive income streams to improve your cashflow."
    ][Math.floor(Math.random() * 6)];
  } else if (score >= 50 && score < 75) {
    return [
      "Your finances are stable but could improve. Aim to grow your passive income.",
      "Your cashflow is decent but there's room for growth. Invest in assets that appreciate.",
      "Diversify your income streams to build a solid financial foundation.",
      "Your net worth is growing. Keep up the good work and explore wealth-building strategies.",
      "Consider using a financial advisor to optimize your investments.",
      "Save more each month to reach your financial goals faster."
    ][Math.floor(Math.random() * 6)];
  } else {
    return [
      "Your financial health is excellent! Keep up the great work.",
      "You've achieved financial freedom. Continue investing in assets to grow your wealth.",
      "Your cashflow exceeds your target by a significant margin.",
      "Your net worth is impressive. Look into philanthropy or legacy planning.",
      "Your financial success is an inspiration. Mentor others to achieve similar results.",
      "Keep diversifying your investments to maintain steady growth."
    ][Math.floor(Math.random() * 6)];
  }
}

function toggleMonthlyEntries(row) {
  const categoryContainer = row.parentNode.nextElementSibling;
  if (categoryContainer) {
    categoryContainer.classList.toggle('collapsed');
  }
}

function toggleCategory(row) {
  const categoryRow = row.closest('tr');
  const category = categoryRow.querySelector('.category');
  category.classList.toggle('collapsed');
}

function toggleDailyEntries() {
  // Daily entries toggle logic
}

function addIncomeEntry() {
  const amount = parseFloat(prompt('Enter income amount:'));
  const description = prompt('Enter description:');
  const category = prompt('Enter category:');
  if (!isNaN(amount) && description && category) {
    currentBusiness.income.push({
      id: Date.now(),
      date: new Date(),
      amount,
      description,
      category
    });
    saveData();
    updateTables();
    updateTotals();
  }
}

function addExpenseEntry() {
  const amount = parseFloat(prompt('Enter expense amount:'));
  const description = prompt('Enter description:');
  const category = prompt('Enter category:');
  if (!isNaN(amount) && description && category) {
    currentBusiness.expenses.push({
      id: Date.now(),
      date: new Date(),
      amount,
      description,
      category
    });
    saveData();
    updateTables();
    updateTotals();
  }
}

function addAssetEntry() {
  const amount = parseFloat(prompt('Enter asset amount:'));
  const description = prompt('Enter description:');
  if (!isNaN(amount) && description) {
    currentBusiness.assets.push({
      id: Date.now(),
      date: new Date(),
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
    currentBusiness.liabilities.push({
      id: Date.now(),
      date: new Date(),
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
  const from = fromCurrency.value;
  const to = toCurrency.value;
  if (from && to && amount) {
    const rate = currencyRates[from] ? (amount / currencyRates[from]) * currencyRates[to] : 'Invalid';
    conversionResult.textContent = rate !== 'Invalid' ? `${amount} ${from} = ${rate.toFixed(2)} ${to}` : 'Invalid currency';
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
    currentBusiness.income = [];
    currentBusiness.expenses = [];
    currentBusiness.assets = [];
    currentBusiness.liabilities = [];
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
