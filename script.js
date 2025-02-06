const currencySelector = document.getElementById('currency');
const exchangeRate = document.getElementById('exchangeRate');
const entryName = document.getElementById('entryName');
const entryAmount = document.getElementById('entryAmount');
const entryType = document.getElementById('entryType');
const addEntryButton = document.getElementById('addEntry');
const incomeTable = document.getElementById('incomeTable');
const expenseTable = document.getElementById('expenseTable');
const assetTable = document.getElementById('assetTable');
const liabilityTable = document.getElementById('liabilityTable');
const healthScore = document.getElementById('healthScore');
const healthGrade = document.getElementById('healthGrade');
const circleProgress = document.getElementById('circleProgress');
const tip = document.getElementById('tip');
const hint = document.getElementById('hint');

let financialData = {
  income: [],
  expenses: [],
  assets: [],
  liabilities: []
};

// Currency Converter API
const apiKey = bbf3e2a38cee4116e7f051b8; //

async function fetchCurrencies() {
  const url = https://v6.exchangerate-api.com/v6/$bbf3e2a38cee4116e7f051b8/latest/USD;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const currencies = Object.keys(data.conversion_rates);
    currencies.forEach(currency => {
      const option = document.createElement('option');
      option.value = currency;
      option.textContent = currency;
      currencySelector.appendChild(option);
    });
    updateExchangeRate();
  } catch (error) {
    console.error('Error fetching currencies:', error);
  }
}

async function updateExchangeRate() {
  const currency = currencySelector.value;
  const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const rate = data.conversion_rates[currency];
    exchangeRate.textContent = `${rate} ${currency}`;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
  }
}

currencySelector.addEventListener('change', updateExchangeRate);
fetchCurrencies();

// Add Entry
function addEntry() {
  const name = entryName.value.trim();
  const amount = parseFloat(entryAmount.value);
  const type = entryType.value;

  if (!name || isNaN(amount)) {
    alert("Please enter valid details.");
    return;
  }

  const entry = { name, amount };
  financialData[type].push(entry);

  updateTables();
  updateFinancialHealth();
  updateTips();

  // Clear inputs
  entryName.value = '';
  entryAmount.value = '';
  hint.textContent = '';
}

addEntryButton.addEventListener('click', addEntry);

// Update Tables
function updateTables() {
  const updateTable = (table, data) => {
    table.innerHTML = data.map(entry => `
      <tr>
        <td>${entry.name}</td>
        <td>${entry.amount}</td>
      </tr>
    `).join('');
  };

  updateTable(incomeTable, financialData.income);
  updateTable(expenseTable, financialData.expenses);
  updateTable(assetTable, financialData.assets);
  updateTable(liabilityTable, financialData.liabilities);
}

// Update Financial Health
function updateFinancialHealth() {
  const totalIncome = financialData.income.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = financialData.expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalAssets = financialData.assets.reduce((sum, entry) => sum + entry.amount, 0);
  const totalLiabilities = financialData.liabilities.reduce((sum, entry) => sum + entry.amount, 0);

  const netWorth = totalAssets - totalLiabilities;
  const score = Math.max(0, Math.min(100, (netWorth / (totalIncome || 1)) * 100));

  healthScore.textContent = `${score.toFixed(0)}%`;
  circleProgress.style.background = `conic-gradient(${getHealthColor(score)} ${score}%, #e0e0e0 ${score}% 100%)`;

  if (score >= 80) {
    healthGrade.textContent = 'A';
  } else if (score >= 60) {
    healthGrade.textContent = 'B';
  } else if (score >= 40) {
    healthGrade.textContent = 'C';
  } else {
    healthGrade.textContent = 'D';
  }
}

// Get Health Color
function getHealthColor(score) {
  if (score >= 80) return '#2ecc71'; // Green
  if (score >= 60) return '#f1c40f'; // Yellow
  return '#e74c3c'; // Red
}

// Update Tips
function updateTips() {
  const totalIncome = financialData.income.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = financialData.expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalLiabilities = financialData.liabilities.reduce((sum, entry) => sum + entry.amount, 0);

  if (totalLiabilities > totalIncome) {
    tip.textContent = "Warning: Your liabilities are too high. Focus on reducing debt.";
  } else if (totalExpenses > totalIncome) {
    tip.textContent = "Warning: Your expenses exceed your income. Cut unnecessary spending.";
  } else {
    tip.textContent = "Tip: Your financial health is good! Keep building assets.";
  }
}

// Generate Hint
function generateHint() {
  const name = entryName.value.trim().toLowerCase();
  if (name.includes('land') || name.includes('property')) {
    hint.textContent = "Hint: This is likely an Asset.";
  } else if (name.includes('shoe') || name.includes('clothing')) {
    hint.textContent = "Hint: This is likely an Expense.";
  } else {
    hint.textContent = "";
  }
    }
