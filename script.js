const currencySelector = document.getElementById('currency');
const entryName = document.getElementById('entryName');
const entryAmount = document.getElementById('entryAmount');
const entryType = document.getElementById('entryType');
const addEntryButton = document.getElementById('addEntry');
const statementBody = document.getElementById('statementBody');
const totalIncome = document.getElementById('totalIncome');
const totalExpenses = document.getElementById('totalExpenses');
const netProfit = document.getElementById('netProfit');
const totalAssets = document.getElementById('totalAssets');
const totalLiabilities = document.getElementById('totalLiabilities');
const tip = document.getElementById('tip');

let financialData = {
  income: [],
  expenses: [],
  assets: [],
  liabilities: []
};

function updateSummary() {
  const totalIncomeValue = financialData.income.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpensesValue = financialData.expenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalAssetsValue = financialData.assets.reduce((sum, entry) => sum + entry.amount, 0);
  const totalLiabilitiesValue = financialData.liabilities.reduce((sum, entry) => sum + entry.amount, 0);

  totalIncome.textContent = totalIncomeValue;
  totalExpenses.textContent = totalExpensesValue;
  netProfit.textContent = totalIncomeValue - totalExpensesValue;
  totalAssets.textContent = totalAssetsValue;
  totalLiabilities.textContent = totalLiabilitiesValue;

  // Provide tips
  if (totalLiabilitiesValue > totalAssetsValue) {
    tip.textContent = "Tip: Focus on reducing liabilities and increasing assets to improve your financial health.";
  } else if (totalIncomeValue < totalExpensesValue) {
    tip.textContent = "Tip: Try to reduce expenses or find additional income sources to avoid losses.";
  } else {
    tip.textContent = "Tip: You're doing well! Keep building assets and managing expenses.";
  }
}

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

  // Update table
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${type}</td>
    <td>${name}</td>
    <td>${amount}</td>
  `;
  statementBody.appendChild(row);

  // Update summary
  updateSummary();

  // Clear inputs
  entryName.value = '';
  entryAmount.value = '';
}

addEntryButton.addEventListener('click', addEntry);

// Currency conversion (simplified example)
currencySelector.addEventListener('change', () => {
  const currency = currencySelector.value;
  alert(`Currency changed to ${currency}. Note: Actual conversion requires an API.`);
});
