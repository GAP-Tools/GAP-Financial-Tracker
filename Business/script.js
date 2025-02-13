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
const incomeTableBody = document.getElementById('income-statement-body');
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
  incomeTableBody.innerHTML = '';
  currentBusiness.income.forEach(income => {
    const row = `
      <tr>
        <td>${new Date(income.date).toLocaleDateString()}</td>
        <td>$${income.amount}</td>
        <td>${income.description}</td>
        <td>
          <button class="clean-button danger-button" onclick="editItem('income', ${income.id})">✏️</button>
          <button class="clean-button danger-button" onclick="deleteItem('income', ${income.id})">🗑️</button>
        </td>
      </tr>
    `;
    incomeTableBody.insertAdjacentHTML('beforeend', row);
  });

  balanceTableBody.innerHTML = '';
  currentBusiness.assets.forEach(asset => {
    const row = `
      <tr>
        <td>${new Date(asset.date).toLocaleDateString()}</td>
        <td>$${asset.amount}</td>
        <td>${asset.description}</td>
        <td>
          <button class="clean-button danger-button" onclick="editItem('assets', ${asset.id})">✏️</button>
          <button class="clean-button danger-button" onclick="deleteItem('assets', ${asset.id})">🗑️</button>
        </td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });

  currentBusiness.liabilities.forEach(liability => {
    const row = `
      <tr>
        <td>${new Date(liability.date).toLocaleDateString()}</td>
        <td>$${liability.amount}</td>
        <td>${liability.description}</td>
        <td>
          <button class="clean-button danger-button" onclick="editItem('liabilities', ${liability.id})">✏️</button>
          <button class="clean-button danger-button" onclick="deleteItem('liabilities', ${liability.id})">🗑️</button>
        </td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });
}

// Function to update totals
function updateTotals() {
  const incomeTotal = calculateTotal(currentBusiness.income);
  const expensesTotal = calculateTotal(currentBusiness.expenses);
  const cashflow = incomeTotal - expensesTotal;
  const assetsTotal = calculateTotal(currentBusiness.assets);
  const liabilitiesTotal = calculateTotal(currentBusiness.liabilities);

  totalIncome.textContent = `$${incomeTotal.toFixed(2)}`;
  totalExpenses.textContent = `$${expensesTotal.toFixed(2)}`;
  cashflowDisplay.textContent = `$${cashflow.toFixed(2)}`;
  totalAssets.textContent = `$${assetsTotal.toFixed(2)}`;
  totalLiabilities.textContent = `$${liabilitiesTotal.toFixed(2)}`;
  netWorth.textContent = `$${(assetsTotal - liabilitiesTotal).toFixed(2)}`;

  updateAverages(incomeTotal, expensesTotal, cashflow);
}

// Function to calculate the total for a category
function calculateTotal(categoryItems) {
  return categoryItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
}

// Function to update averages
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

// Function to get a financial health tip
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

// Function to add a new category
function addNewCategory(type) {
  const description = prompt(`Enter new ${type} category description:`);
  if (description) {
    if (type === 'income') {
      currentBusiness.income.push({ id: Date.now(), date: new Date(), amount: 0, description });
    } else {
      currentBusiness[type].push({ id: Date.now(), date: new Date(), amount: 0, description });
    }
    saveData();
    updateTables();
  }
}

// Function to add an income entry
function addIncomeEntry() {
  const amount = parseFloat(prompt('Enter income amount:'));
  const description = prompt('Enter income description:');
  if (!isNaN(amount) && description) {
    currentBusiness.income.push({ id: Date.now(), date: new Date(), amount, description });
    saveData();
    updateTables();
    updateTotals();
  }
}

// Function to add an expense entry
function addExpenseEntry() {
  const amount = parseFloat(prompt('Enter expense amount:'));
  const description = prompt('Enter expense description:');
  if (!isNaN(amount) && description) {
    currentBusiness.expenses.push({ id: Date.now(), date: new Date(), amount, description });
    saveData();
    updateTables();
    updateTotals();
  }
}

// Function to edit an item
function editItem(type, id) {
  const items = currentBusiness[type];
  const itemIndex = items.findIndex(item => item.id === id);
  if (itemIndex !== -1) {
    const newItem = items[itemIndex];
    const newAmount = parseFloat(prompt('Enter new amount:', newItem.amount));
    const newDescription = prompt('Enter new description:', newItem.description);
    if (!isNaN(newAmount) && newDescription) {
      newItem.amount = newAmount;
      newItem.description = newDescription;
      saveData();
      updateTables();
      updateTotals();
    }
  }
}

// Function to delete an item
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

// Function to save profile
function saveBusinessProfile() {
  currentBusiness.description = document.getElementById('businessDescription').value;
  currentBusiness.currency = currencySelect.value;
  saveData();
  updateProfileSection();
}

// Function to update residual income target
function updateResidualTarget() {
  currentBusiness.residualIncomeTarget = parseFloat(document.getElementById('residual-income-target').value) || 0;
  saveData();
  updateFinancialHealth();
}

// Function to export data
function exportData() {
  const fileName = document.getElementById('saveFileName').value || 'financial-data';
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
    currentBusiness.income = [];
    currentBusiness.expenses = [];
    currentBusiness.assets = [];
    currentBusiness.liabilities = [];
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

// Function to open the app
function openApp() {
  window.open('https://www.appcreator24.com/app3480869-q98157', '_blank');
}

// Function to generate financial story
function generateStory() {
  const incomeTotal = parseFloat(totalIncome.textContent.replace('$', ''));
  const expensesTotal = parseFloat(totalExpenses.textContent.replace('$', ''));
  const cashflow = parseFloat(cashflowDisplay.textContent.replace('$', ''));
  const assetsTotal = parseFloat(totalAssets.textContent.replace('$', ''));
  const liabilitiesTotal = parseFloat(totalLiabilities.textContent.replace('$', ''));
  const netWorthValue = assetsTotal - liabilitiesTotal;
  const residualTarget = currentBusiness.residualIncomeTarget;
  const remainingToTarget = residualTarget - cashflow;

  const timeStamp = new Date().toLocaleString();
  const story = `
    ## Financial Snapshot (${timeStamp})

    ### Income & Expenses
    - **Total Income**: $${incomeTotal}
    - **Total Expenses**: $${expensesTotal}
    - **Cashflow**: $${cashflow}

    ### Balance Sheet
    - **Total Assets**: $${assetsTotal}
    - **Total Liabilities**: $${liabilitiesTotal}
    - **Net Worth**: $${netWorthValue}

    ### Financial Health
    - **Health Score**: ${healthPercentage.textContent}%
    - **Residual Income Target**: $${residualTarget}
    - **Remaining to Target**: $${remainingToTarget}

    ---
    ### Highlights
    1. Your business is generating a steady income stream of $${incomeTotal} this year.
    2. Expenses are currently at $${expensesTotal}, ensure they remain under control to maintain profitability.
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

// Set background colors for balance sheet and income statement
const balanceSheet = document.querySelector('.balance-sheet table');
const incomeStatement = document.querySelector('.income-statement table');
balanceSheet.style.background = '#c8e6c9';
incomeStatement.style.background = '#fff3e0';
