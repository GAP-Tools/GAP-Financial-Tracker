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

// Mock currency rates for demonstration
const currencyRates = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.8,
  JPY: 130,
  CAD: 1.3
};

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
    categories: []
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
  // Monthly Table
  monthlyTableBody.innerHTML = '';
  const monthlyData = {};
  currentBusiness.income.forEach(income => {
    const month = new Date(income.date).toLocaleDateString('default', { month: 'long', year: 'numeric' });
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expenses: 0 };
    }
    monthlyData[month].income += income.amount;
  });
  currentBusiness.expenses.forEach(expense => {
    const month = new Date(expense.date).toLocaleDateString('default', { month: 'long', year: 'numeric' });
    if (!monthlyData[month]) {
      monthlyData[month] = { income: 0, expenses: 0 };
    }
    monthlyData[month].expenses += expense.amount;
  });
  for (const month in monthlyData) {
    const row = `
      <tr>
        <td>${month}</td>
        <td>$${monthlyData[month].income.toFixed(2)}</td>
        <td>$${monthlyData[month].expenses.toFixed(2)}</td>
        <td>$${(monthlyData[month].income - monthlyData[month].expenses).toFixed(2)}</td>
        <td><button class="clean-button danger-button">-</button></td>
      </tr>
    `;
    monthlyTableBody.insertAdjacentHTML('beforeend', row);
  }

  // Category Table
  categoryTableBody.innerHTML = '';
  currentBusiness.categories.forEach(category => {
    const income = currentBusiness.income.reduce((sum, entry) => {
      return entry.category === category ? sum + entry.amount : sum;
    }, 0);
    const expenses = currentBusiness.expenses.reduce((sum, entry) => {
      return entry.category === category ? sum + entry.amount : sum;
    }, 0);
    const row = `
      <tr>
        <td>${category}</td>
        <td>$${income.toFixed(2)}</td>
        <td>$${expenses.toFixed(2)}</td>
        <td><button class="clean-button danger-button">-</button></td>
      </tr>
    `;
    categoryTableBody.insertAdjacentHTML('beforeend', row);
  });

  // Daily Table
  dailyTableBody.innerHTML = '';
  currentBusiness.income.forEach(income => {
    const row = `
      <tr>
        <td>${new Date(income.date).toLocaleDateString()}</td>
        <td>${income.description}</td>
        <td>$${income.amount}</td>
        <td></td>
        <td><button class="clean-button danger-button">-</button></td>
      </tr>
    `;
    dailyTableBody.insertAdjacentHTML('beforeend', row);
  });
  currentBusiness.expenses.forEach(expense => {
    const row = `
      <tr>
        <td>${new Date(expense.date).toLocaleDateString()}</td>
        <td>${expense.description}</td>
        <td></td>
        <td>$${expense.amount}</td>
        <td><button class="clean-button danger-button">-</button></td>
      </tr>
    `;
    dailyTableBody.insertAdjacentHTML('beforeend', row);
  });
}

// Function to update totals
function updateTotals() {
  const incomeTotal = currentBusiness.income.reduce((sum, entry) => sum + entry.amount, 0);
  const expenseTotal = currentBusiness.expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const cashflow = incomeTotal - expenseTotal;
  const assetTotal = currentBusiness.assets.reduce((sum, entry) => sum + entry.amount, 0);
  const liabilityTotal = currentBusiness.liabilities.reduce((sum, entry) => sum + entry.amount, 0);

  totalAssets.textContent = `$${assetTotal.toFixed(2)}`;
  totalLiabilities.textContent = `$${liabilityTotal.toFixed(2)}`;
  netWorth.textContent = `$${(assetTotal - liabilityTotal).toFixed(2)}`;

  const months = new Set(currentBusiness.income.concat(currentBusiness.expenses).map(entry => {
    return new Date(entry.date).toISOString().substring(0, 7);
  })).size;
  const avgIncome = incomeTotal / months;
  const avgExpenses = expenseTotal / months;
  const avgCashflow = cashflow / months;

  document.getElementById('average-income').textContent = `$${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `$${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `$${avgCashflow.toFixed(2)}`;
}

// Function to update financial health
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

// Function to add income entry
function addIncomeEntry() {
  const amount = parseFloat(prompt('Enter income amount:'));
  const description = prompt('Enter description:');
  const category = prompt('Enter category (existing categories: ' + currentBusiness.categories.join(', ') + '):');
  if (!isNaN(amount) && description && category) {
    currentBusiness.income.push({
      id: Date.now(),
      date: new Date(),
      amount,
      description,
      category
    });
    if (!currentBusiness.categories.includes(category)) {
      currentBusiness.categories.push(category);
    }
    saveData();
    updateTables();
    updateTotals();
  }
}

// Function to add expense entry
function addExpenseEntry() {
  const amount = parseFloat(prompt('Enter expense amount:'));
  const description = prompt('Enter description:');
  const category = prompt('Enter category (existing categories: ' + currentBusiness.categories.join(', ') + '):');
  if (!isNaN(amount) && description && category) {
    currentBusiness.expenses.push({
      id: Date.now(),
      date: new Date(),
      amount,
      description,
      category
    });
    if (!currentBusiness.categories.includes(category)) {
      currentBusiness.categories.push(category);
    }
    saveData();
    updateTables();
    updateTotals();
  }
}

// Function to add asset entry
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

// Function to add liability entry
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

// Function to convert currency
function convertCurrency() {
  const amount = parseFloat(document.getElementById('convertAmount').value);
  const from = fromCurrency.value;
  const to = toCurrency.value;
  const rate = currencyRates[from] ? (amount / currencyRates[from]) * currencyRates[to] : 'Invalid';
  conversionResult.textContent = rate !== 'Invalid' ? `${amount} ${from} = ${rate.toFixed(2)} ${to}` : 'Invalid currency';
}

// Function to save business profile
function saveBusinessProfile() {
  currentBusiness.description = document.getElementById('businessDescription').value;
  currentBusiness.currency = currencySelect.value;
  saveData();
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
    currentBusiness.income = [];
    currentBusiness.expenses = [];
    currentBusiness.assets = [];
    currentBusiness.liabilities = [];
    currentBusiness.categories = [];
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
  const incomeTotal = parseFloat(document.getElementById('total-income').textContent.replace('$', ''));
  const expenseTotal = parseFloat(document.getElementById('total-expenses').textContent.replace('$', ''));
  const cashflow = parseFloat(document.getElementById('cashflow').textContent.replace('$', ''));
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
    - **Total Assets**: $${incomeTotal}
    - **Total Liabilities**: $${expenseTotal}
    - **Net Worth**: $${cashflow}

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
