// Initialize variables
let businesses = [];
let currentBusinessIndex = -1;
const currencyRates = {};
const appName = "Multi-Business Financial Tracker";

// DOM Elements
const businessList = document.getElementById('businessList');
const businessNameInput = document.getElementById('businessName');
const currencySelect = document.getElementById('currency');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const conversionResult = document.getElementById('conversionResult');
const monthlyTableBody = document.getElementById('monthlyTableBody');
const balanceTableBody = document.getElementById('balance-sheet-body');
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
const residualTargetInput = document.getElementById('residual-income-target');

// Chart initialization
const healthChart = new Chart(healthChartCanvas, {
  type: 'doughnut',
  data: {
    labels: ['Health'],
    datasets: [{
      data: [0],
      backgroundColor: ['#2c836d']
    }]
  },
  options: {
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false
  }
});

// Fetch currency rates from the API
async function fetchCurrencyRates() {
  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/your_api_key/latest/USD');
    const data = await response.json();
    currencyRates = data.conversion_rates;
    populateCurrencyDropdowns();
  } catch (error) {
    console.error('Error fetching currency rates:', error);
  }
}

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

function saveData() {
  localStorage.setItem('financialTracker', JSON.stringify(businesses));
}

function loadData() {
  const data = localStorage.getItem('financialTracker');
  if (data) {
    businesses = JSON.parse(data);
    updateBusinessList();
    if (businesses.length > 0) switchBusiness(0);
  }
}

function updateBusinessList() {
  businessList.innerHTML = '';
  businesses.forEach((business, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = business.name;
    businessList.appendChild(option);
  });
}

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

function switchBusiness(index) {
  currentBusinessIndex = index;
  if (currentBusinessIndex >= 0 && currentBusinessIndex < businesses.length) {
    currentBusiness = businesses[currentBusinessIndex];
    updateProfileSection();
    updateUI();
  }
}

function updateProfileSection() {
  document.getElementById('businessDescription').value = currentBusiness.description || '';
  currencySelect.value = currentBusiness.currency || 'USD';
  residualTargetInput.value = currentBusiness.residualIncomeTarget || 0;
}

function updateUI() {
  updateTables();
  updateTotals();
  updateFinancialHealth();
}

function updateTotals() {
  const incomeTotal = currentBusiness.income.reduce((sum, entry) => sum + entry.amount, 0);
  const expenseTotal = currentBusiness.expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const assetTotal = currentBusiness.assets.reduce((sum, entry) => sum + entry.amount, 0);
  const liabilityTotal = currentBusiness.liabilities.reduce((sum, entry) => sum + entry.amount, 0);

  document.getElementById('total-assets').textContent = `$${assetTotal.toFixed(2)}`;
  document.getElementById('total-liabilities').textContent = `$${liabilityTotal.toFixed(2)}`;
  document.getElementById('net-worth').textContent = `$${(assetTotal - liabilityTotal).toFixed(2)}`;

  const months = new Set(currentBusiness.income.concat(currentBusiness.expenses).map(entry => {
    return new Date(entry.date).toISOString().substring(0, 7);
  })).size;
  const avgIncome = incomeTotal / months;
  const avgExpenses = expenseTotal / months;
  const avgCashflow = (incomeTotal - expenseTotal) / months;

  document.getElementById('average-income').textContent = `$${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `$${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `$${avgCashflow.toFixed(2)}`;
}

function updateFinancialHealth() {
  const avgCashflow = parseFloat(document.getElementById('average-cashflow').textContent.replace('$', ''));
  const target = currentBusiness.residualIncomeTarget;
  const score = target === 0 ? 0 : Math.round((avgCashflow / target) * 100);
  healthChart.data.datasets[0].data = [score];
  healthChart.update();
  healthPercentage.textContent = `${score}%`;
  healthTips.textContent = getHealthTip(score, avgCashflow);
}

function getHealthTip(score, cashflow) {
  if (score < 50) {
    return "Your cashflow is below target. Consider reducing expenses or increasing income sources.";
  } else if (score >= 50 && score < 75) {
    return "Your finances are stable but could improve. Consider diversifying your income.";
  } else {
    return "Excellent financial health. Keep up the good work!";
  }
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
    updateUI();
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
    updateUI();
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
    updateUI();
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
    updateUI();
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
}

function updateResidualTarget() {
  currentBusiness.residualIncomeTarget = parseFloat(residualTargetInput.value) || 0;
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
      businesses.push(data);
      saveData();
      updateBusinessList();
      switchBusiness(businesses.length - 1);
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
    updateUI();
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
  const incomeTotal = currentBusiness.income.reduce((sum, entry) => sum + entry.amount, 0);
  const expenseTotal = currentBusiness.expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const cashflow = incomeTotal - expenseTotal;
  const assetTotal = currentBusiness.assets.reduce((sum, entry) => sum + entry.amount, 0);
  const liabilityTotal = currentBusiness.liabilities.reduce((sum, entry) => sum + entry.amount, 0);

  const timeStamp = new Date().toLocaleString();
  const story = `
    ${varTitle('Financial Summary')}
    - **Total Income**: $${incomeTotal}
    - **Total Expenses**: $${expenseTotal}
    - **Cashflow**: $${cashflow}

    ${varTitle('Balance Sheet')}
    - **Total Assets**: $${assetTotal}
    - **Total Liabilities**: $${liabilityTotal}
    - **Net Worth**: $${assetTotal - liabilityTotal}

    ${varTitle('Financial Health')}
    - Health Score: ${healthPercentage.textContent}
    - Recommendation: ${healthTips.textContent}
  `;

  financialStory.textContent = story;
}

function varTitle(text) {
  return `\n#### ${text}\n`;
}

function calcInput(value) {
  calcDisplay.value += value;
}

function calcEqual() {
  try {
    calcDisplay.value = eval(calcDisplay.value);
  } catch (error) {
    calcDisplay.value = 'Error';
  }
}

function calcClear() {
  calcDisplay.value = '0';
}

function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === 'block' ? 'none' : 'block';
}

function updateTables() {
  // Update income table
  monthlyTableBody.innerHTML = '';
  currentBusiness.income.forEach(income => {
    const row = `
      <tr>
        <td>${new Date(income.date).toLocaleDateString()}</td>
        <td>$${income.amount}</td>
        <td></td>
        <td>$${income.amount}</td>
        <td><button class="btn-secondary">-</button></td>
      </tr>
    `;
    monthlyTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Update balance sheet table
  balanceTableBody.innerHTML = '';
  currentBusiness.assets.forEach(asset => {
    const row = `
      <tr>
        <td>${new Date(asset.date).toLocaleDateString()}</td>
        <td>${asset.description}</td>
        <td>Asset</td>
        <td>$${asset.amount}</td>
        <td><button class="btn-secondary">-</button></td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });
  currentBusiness.liabilities.forEach(liability => {
    const row = `
      <tr>
        <td>${new Date(liability.date).toLocaleDateString()}</td>
        <td>${liability.description}</td>
        <td>Liability</td>
        <td>$${liability.amount}</td>
        <td><button class="btn-secondary">-</button></td>
      </tr>
    `;
    balanceTableBody.insertAdjacentHTML('beforeend', row);
  });
}

document.body.addEventListener('click', (event) => {
  if (!event.target.closest('.calculator-icon') && !event.target.closest('.calculator-popup')) {
    calculatorPopup.style.display = 'none';
  }
});

fetchCurrencyRates();
loadData();
