const apiKey = 'bbf3e2a38cee4116e7f051b8';
const baseURL = 'https://v6.exchangerate-api.com/v6';

let income = 0;
let expenses = 0;
let assets = 0;
let liabilities = 0;

// Currency Converter
async function convertCurrency() {
  const amount = document.getElementById('amount').value;
  const fromCurrency = document.getElementById('fromCurrency').value;
  const toCurrency = document.getElementById('toCurrency').value;

  const url = `${baseURL}/${apiKey}/latest/${fromCurrency}`;
  const response = await fetch(url);
  const data = await response.json();
  const rate = data.conversion_rates[toCurrency];
  const convertedAmount = (amount * rate).toFixed(2);

  document.getElementById('conversionResult').innerText = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
}

// Add Entry
function addEntry() {
  const name = document.getElementById('entryName').value;
  const amount = parseFloat(document.getElementById('entryAmount').value);
  const type = document.getElementById('entryType').value;

  if (!name || isNaN(amount)) {
    alert('Please fill all fields correctly.');
    return;
  }

  const table = type === 'income' || type === 'expense' ? document.querySelector('#incomeStatement tbody') : document.querySelector('#balanceSheet tbody');
  const row = `<tr><td>${name}</td><td>${amount}</td></tr>`;
  table.insertAdjacentHTML('beforeend', row);

  // Update totals
  if (type === 'income') income += amount;
  else if (type === 'expense') expenses += amount;
  else if (type === 'asset') assets += amount;
  else if (type === 'liability') liabilities += amount;

  updateFinancialHealth();
  provideTips(type);
  clearInputs();
}

// Update Financial Health
function updateFinancialHealth() {
  const netWorth = assets - liabilities;
  const cashFlow = income - expenses;
  const healthScore = ((netWorth + cashFlow) / (income + assets)) * 100 || 0;

  const healthBar = document.querySelector('.health-bar');
  healthBar.setAttribute('data-score', `${healthScore.toFixed(2)}%`);
  healthBar.style.background = `conic-gradient(
    green 0% 33%,
    yellow 33% 66%,
    red 66% 100%
  )`;
}

// Provide Tips
function provideTips(type) {
  const tips = {
    income: "Great job! Keep increasing your income streams.",
    expense: "Try to reduce unnecessary expenses.",
    asset: "Assets are key to building wealth. Keep investing!",
    liability: "Focus on reducing liabilities to improve financial health."
  };
  document.getElementById('tipText').innerText = tips[type];
}

// Clear Inputs
function clearInputs() {
  document.getElementById('entryName').value = '';
  document.getElementById('entryAmount').value = '';
                         }
