let businesses = [];
let currentBusiness = { incomeStatement: {}, balanceSheet: [] };
let currencyRates = { USD: 1 };

// DOM Elements
const businessList = document.getElementById('businessList');
const businessNameInput = document.getElementById('businessName');
const currencySelect = document.getElementById('currency');
const incomeBody = document.getElementById('income-statement-body');
const balanceBody = document.getElementById('balance-sheet-body');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const netWorthDisplay = document.getElementById('net-worth');
const healthChart = new Chart(document.getElementById('healthChart').getContext('2d'), {
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

// Fetch Currency Rates
(async () => {
  const response = await fetch('https://v6.exchangerate-api.com/v6/free/latest/USD');
  const data = await response.json();
  currencyRates = data.conversion_rates;
  populateCurrencyDropdown();
})();

function populateCurrencyDropdown() {
  for (const code in currencyRates) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = `${code} (${code})`;
    currencySelect.appendChild(option);
  }
}

function addBusiness() {
  const name = businessNameInput.value.trim();
  if (!name) return;

  businesses.push({
    name,
    description: '',
    currency: 'USD',
    incomeStatement: {},
    balanceSheet: []
  });
  saveData();
  updateBusinessList();
}

function updateBusinessList() {
  businessList.innerHTML = businesses.map((business, index) => 
    `<option value="${index}">${business.name}</option>`).join('');
  if (businesses.length) switchBusiness(0);
}

function switchBusiness(index) {
  currentBusiness = businesses[index];
  loadBusinessData();
}

function loadBusinessData() {
  updateIncomeStatementTable();
  updateBalanceSheetTable();
  updateTotals();
  updateFinancialHealth();
}

function addNewCategory(type) {
  const category = prompt('Enter new category name:');
  if (category) {
    const currentDate = new Date();
    const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!currentBusiness.incomeStatement[monthKey]) {
      currentBusiness.incomeStatement[monthKey] = {
        categories: [],
        totals: { income: 0, expenses: 0 }
      };
    }
    
    currentBusiness.incomeStatement[monthKey].categories.push({
      name: category,
      entries: []
    });
    saveData();
    updateIncomeStatementTable();
  }
}

function addIncomeOrExpense(type) {
  const amount = parseFloat(prompt(`Enter ${type} amount:`));
  const description = prompt(`Enter ${type} description:`);
  const category = prompt(`Enter ${type} category:`);
  
  if (isNaN(amount) || !description || !category) return;
  
  let typeKey = type === 'income' ? 'Income' : 'Expense';
  
  const currentDate = new Date();
  const monthKey = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
  
  if (!currentBusiness.incomeStatement[monthKey]) {
    currentBusiness.incomeStatement[monthKey] = {
      categories: [],
      totals: { income: 0, expenses: 0 }
    };
  }
  
  let targetCategory = currentBusiness.incomeStatement[monthKey].categories.find(cat => cat.name === category);
  if (!targetCategory) {
    targetCategory = { name: category, entries: [] };
    currentBusiness.incomeStatement[monthKey].categories.push(targetCategory);
  }
  
  targetCategory.entries.push({
    date: currentDate.toISOString().slice(0, 10),
    description,
    type: typeKey,
    amount
  });

  currentBusiness.incomeStatement[monthKey].totals[type === 'income' ? 'income' : 'expenses'] += amount;
  saveData();
  updateIncomeStatementTable();
}

function updateTotals() {
  let totalIncomeVal = 0;
  let totalExpensesVal = 0;
  let netWorthVal = 0;
  
  for (const month in currentBusiness.incomeStatement) {
    totalIncomeVal += currentBusiness.incomeStatement[month].totals.income;
    totalExpensesVal += currentBusiness.incomeStatement[month].totals.expenses;
  }

  totalIncome.textContent = totalIncomeVal.toLocaleString();
  totalExpenses.textContent = totalExpensesVal.toLocaleString();
  netWorthDisplay.textContent = (totalIncomeVal - totalExpensesVal).toLocaleString();
}

function updateFinancialHealth() {
  const healthScore = Math.round((totalIncome.textContent / (totalIncome.textContent + totalExpenses.textContent)) * 100);
  healthChart.data.datasets[0].data = [healthScore];
  healthChart.update();
}

function saveData() {
  localStorage.setItem('finAppBusinesses', JSON.stringify(businesses));
}

function loadSavedData() {
  const savedData = localStorage.getItem('finAppBusinesses');
  if (savedData) {
    businesses = JSON.parse(savedData);
    updateBusinessList();
  }
}

// Initialization
loadSavedData();
