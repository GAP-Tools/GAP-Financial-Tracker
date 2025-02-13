// script.js
let businesses = [];
let currentBusiness = { incomeStatement: {}, balanceSheet: [] };
let currencyRates = { USD: 1 };
const currencySelect = document.getElementById('currency');
const incomeStatementBody = document.getElementById('income-statement-body');
const balanceSheetBody = document.getElementById('balance-sheet-body');
const totalIncome = document.getElementById('total-income');
const totalExpenses = document.getElementById('total-expenses');
const totalAssets = document.getElementById('total-assets');
const totalLiabilities = document.getElementById('total-liabilities');
const netWorthDisplay = document.getElementById('net-worth');
const cashflowDisplay = document.getElementById('cashflow');
const averageIncome = document.getElementById('average-income');
const averageExpenses = document.getElementById('average-expenses');
const averageCashflow = document.getElementById('average-cashflow');
const healthChart = new Chart(document.getElementById('healthChart').getContext('2d'), {
  type: 'doughnut',
  data: {
    labels: ['Health'],
    datasets: [{
      data: [0],
      backgroundColor: ['#4CAF50']
    }]
  },
  options: {
    cutout: '70%',
    responsive: true,
    maintainAspectRatio: false
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await fetchCurrencyRates();
  populateCurrencyDropdowns();
  loadSavedData();
});

async function fetchCurrencyRates() {
  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD');
    const data = await response.json();
    currencyRates = data.conversion_rates;
  } catch (error) {
    console.error('Currency rates fetch failed:', error);
  }
}

function populateCurrencyDropdowns() {
  for (const currency in currencyRates) {
    const option = document.createElement('option');
    option.value = currency;
    option.textContent = `${currency} (${currency})`;
    document.getElementById('fromCurrency').appendChild(option.cloneNode(true));
    document.getElementById('toCurrency').appendChild(option.cloneNode(true));
    currencySelect.appendChild(option.cloneNode(true));
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
  loadBusinessList();
  switchBusiness(businesses.length - 1);
}

function loadBusinessList() {
  const businessList = document.getElementById('businessList');
  businessList.innerHTML = '';
  businesses.forEach((business, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = business.name;
    businessList.appendChild(option);
  });
}

function switchBusiness(index) {
  currentBusiness = businesses[index];
  updateUI();
}

function updateUI() {
  updateProfile();
  updateTables();
  updateCharts();
}

function updateProfile() {
  document.getElementById('businessName').value = currentBusiness.name;
  document.getElementById('businessDescription').value = currentBusiness.description;
  currencySelect.value = currentBusiness.currency;
}

function updateTables() {
  updateIncomeStatementTable();
  updateBalanceSheetTable();
}

function updateIncomeStatementTable() {
  incomeStatementBody.innerHTML = '';
  Object.keys(currentBusiness.incomeStatement).forEach(month => {
    const income = currentBusiness.incomeStatement[month].totals.income.toLocaleString();
    const expenses = currentBusiness.incomeStatement[month].totals.expenses.toLocaleString();
    const net = (income - expenses).toLocaleString();
    const row = `
      <tr>
        <td>${month}</td>
        <td>${income}</td>
        <td>${expenses}</td>
        <td>${net}</td>
        <td><button onclick="showDetails('${month}')">Details</button></td>
      </tr>
    `;
    incomeStatementBody.insertAdjacentHTML('beforeend', row);
  });
}

function showDetails(month) {
  alert(`Details for ${month}`);
}

// ... other functions for adding, editing, deleting, calculating averages, etc. ...

function saveData() {
  localStorage.setItem('businesses', JSON.stringify(businesses));
}

function loadSavedData() {
  const savedData = localStorage.getItem('businesses');
  if (savedData) {
    businesses = JSON.parse(savedData);
    loadBusinessList();
    if (businesses.length > 0) switchBusiness(0);
  }
}

function convertCurrency() {
  const amount = parseFloat(document.getElementById('convertAmount').value);
  const from = document.getElementById('fromCurrency').value;
  const to = document.getElementById('toCurrency').value;
  if (currencyRates[from] && currencyRates[to]) {
    const converted = (amount / currencyRates[from]) * currencyRates[to];
    document.getElementById('conversionResult').textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
  }
}

function shareOnWhatsApp() {
  const message = encodeURIComponent('Check out this Financial Tracker App!');
  window.open(`https://api.whatsapp.com/send?text=${message}`);
}

function shareOnGoogleDrive() {
  alert('Google Drive sharing functionality is being developed');
}

function exportBusinessData() {
  const fileName = document.getElementById('saveFileName').value.trim() || 'financial_data';
  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent('Financial Data...\n');
  const link = document.createElement('a');
  link.href = csvContent;
  link.download = `${fileName}.csv`;
  link.click();
}

function importBusinessData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'text/csv';
  input.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = () => {
      const csvData = reader.result;
      console.log(csvData);
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}

function generateBusinessStory() {
  const story = `
    [Generated Financial Story using DeepSeek AI]
    Total Income: ${totalIncome.textContent}
    Total Expenses: ${totalExpenses.textContent}
    Net Worth: ${netWorthDisplay.textContent}
  `;
  document.getElementById('businessFinancialStory').textContent = story;
}

function toggleCalculator() {
  document.getElementById('calculatorPopup').style.display = 'block';
}

window.onclick = function(event) {
  if (event.target.className === 'calculator-popup') {
    document.getElementById('calculatorPopup').style.display = 'none';
  }
};
