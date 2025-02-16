// Initialize variables
let profile = {
  name: '',
  age: '',
  occupation: '',
  dream: '',
  currency: 'NGN',
  fundAllocations: [],
  incomeStatement: [],
  balanceSheet: []
};

// DOM Elements
const currencySelect = document.getElementById('currency');
const entryType = document.getElementById('entryType');
const entryAmount = document.getElementById('entryAmount');
const entryDescription = document.getElementById('entryDescription');
const entryCategory = document.getElementById('entryCategory');
const allocationCategories = document.getElementById('allocationCategories');
const newCategory = document.getElementById('newCategory');
const newPercentage = document.getElementById('newPercentage');
const monthlyBody = document.getElementById('monthly-body');
const fundAllocationBody = document.getElementById('fund-allocation-body');
const balanceSheetBody = document.getElementById('balance-sheet-body');
const totalAssets = document.getElementById('total-assets');
const totalLiabilities = document.getElementById('total-liabilities');
const netWorth = document.getElementById('net-worth');
const healthChart = document.getElementById('healthChart').getContext('2d');
const financialStory = document.getElementById('financialStory');

// Chart Initialization
const healthChartConfig = {
  type: 'doughnut',
  data: {
    labels: ['Health'],
    datasets: [{
      data: [0],
      backgroundColor: ['#ff6384']
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
};
const chart = new Chart(healthChart, healthChartConfig);

// Fetch Currency Rates
async function fetchCurrencyRates() {
  const apiUrl = 'https://api.exchangerate-api.com/v4/latest/USD';
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    populateCurrencyDropdown(data.rates);
  } catch (error) {
    console.error('Error fetching currency rates:', error);
  }
}

fetchCurrencyRates();

// Populate Currency Dropdown
function populateCurrencyDropdown(rates) {
  const currencies = Object.keys(rates);
  currencies.forEach(currency => {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = currency;
    currencySelect.appendChild(option);
  });
}

// Save Profile
function saveProfile() {
  profile.name = document.getElementById('name').value;
  profile.age = document.getElementById('age').value;
  profile.occupation = document.getElementById('occupation').value;
  profile.dream = document.getElementById('dream').value;
  profile.currency = currencySelect.value;
  saveData();
  alert('Profile saved successfully!');
}

// Show Entry Modal
function showEntryModal(type) {
  document.getElementById('entryModal').style.display = 'block';
  entryType.value = type;
  populateCategories();
}

// Close Modal
function closeModal() {
  document.getElementById('entryModal').style.display = 'none';
}

// Populate Categories
function populateCategories() {
  const categories = profile.fundAllocations.map(cat => cat.name);
  const categorySelect = document.getElementById('entryCategory');
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

// Save Entry
function saveEntry() {
  const type = entryType.value;
  const amount = parseFloat(entryAmount.value);
  const description = entryDescription.value;
  const category = entryCategory.value;

  if (isNaN(amount) || amount <= 0 || !description || !category) {
    alert('Please fill all fields correctly');
    return;
  }

  const date = new Date().toISOString().split('T')[0];
  const entry = { date, amount, description, category, type };

  if (type === 'income') {
    profile.incomeStatement.push(entry);
  } else {
    profile.incomeStatement.push(entry);
  }

  updateTables();
  saveData();
  closeModal();
}

// Update Tables
function updateTables() {
  updateMonthlyTable();
  updateFundAllocationTable();
  updateBalanceSheet();
  updateFinancialHealth();
}

// Update Monthly Table
function updateMonthlyTable() {
  monthlyBody.innerHTML = '';
  const months = [...new Set(profile.incomeStatement.map(entry => entry.date))];
  months.forEach(month => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${month}</td>
      <td>${calculateTotal('income', month)}</td>
      <td>${calculateTotal('expense', month)}</td>
      <td>${calculateNet(month)}</td>
      <td><button onclick="showMonthDetails('${month}')">Details</button></td>
    `;
    monthlyBody.appendChild(row);
  });
}

// Update Fund Allocation Table
function updateFundAllocationTable() {
  fundAllocationBody.innerHTML = '';
  profile.fundAllocations.forEach(cat => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cat.name}</td>
      <td>${cat.percentage}%</td>
      <td>${cat.balance}</td>
      <td><button onclick="showCategorySummary('${cat.name}')">Summary</button></td>
    `;
    fundAllocationBody.appendChild(row);
  });
}

// Update Balance Sheet
function updateBalanceSheet() {
  balanceSheetBody.innerHTML = '';
  profile.balanceSheet.forEach(entry => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === 'asset' ? entry.amount : ''}</td>
      <td>${entry.type === 'liability' ? entry.amount : ''}</td>
      <td><button onclick="deleteBalanceEntry(${entry.id})">Delete</button></td>
    `;
    balanceSheetBody.appendChild(row);
  });
  updateTotals();
}

// Update Financial Health
function updateFinancialHealth() {
  const totalIncome = profile.incomeStatement.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = profile.incomeStatement.filter(e => e.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const netWorth = parseFloat(totalAssets.textContent) - parseFloat(totalLiabilities.textContent);

  const healthScore = Math.min(100, (netWorth / totalIncome) * 100);
  chart.data.datasets[0].data = [healthScore];
  chart.update();
}

// Helper Functions
function calculateTotal(type, month) {
  return profile.incomeStatement
    .filter(entry => entry.type === type && entry.date === month)
    .reduce((total, entry) => total + entry.amount, 0);
}

function calculateNet(month) {
  return calculateTotal('income', month) - calculateTotal('expense', month);
}

function updateTotals() {
  totalAssets.textContent = profile.balanceSheet
    .filter(e => e.type === 'asset')
    .reduce((total, e) => total + e.amount, 0);
  totalLiabilities.textContent = profile.balanceSheet
    .filter(e => e.type === 'liability')
    .reduce((total, e) => total + e.amount, 0);
  netWorth.textContent = totalAssets.textContent - totalLiabilities.textContent;
}

function saveData() {
  localStorage.setItem('financialData', JSON.stringify(profile));
}

function loadData() {
  const data = localStorage.getItem('financialData');
  if (data) {
    profile = JSON.parse(data);
    updateTables();
  }
}

// Initialize
loadData();
