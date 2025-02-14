document.addEventListener('DOMContentLoaded', async () => {
  const currencyData = await fetchCurrencyData();
  setupCurrencyDropdowns(currencyData);
  loadSavedData();
});

// Currency Data Handling ----------------------------------------------
async function fetchCurrencyData() {
  try {
    const response = await fetch("https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD");
    return await response.json();
  } catch (error) {
    console.error("Currency data failed to load:", error);
    return { conversion_rates: {} };
  }
}

function setupCurrencyDropdowns(data) {
  const currencyRates = data.conversion_rates;
  const currencyOptions = Object.entries(currencyRates).map(([code, rate]) => ({
    code: code,
    symbol: getCurrencySymbol(code),
    rate: rate
  }));
  
  [currencySelect, fromCurrency, toCurrency].forEach(select => {
    const base = select === currencySelect ? 'USD' : null;
    select.innerHTML = currencyOptions
      .filter(opt => base ? opt.code === base : true)
      .map(opt => `
        <option value="${opt.code}">${opt.code} (${opt.symbol})</option>
      `).join('');
  });
}

function getCurrencySymbol(currency) {
  const symbols = {
    USD: '$', EUR: '€', GBP: '£', NGN: '₦', JPY: '¥', INR: '₹', AUD: 'A$', CAD: 'C$',
    CHF: 'CHF', CNY: '¥', BRL: 'R$', PHP: '₱', MXN: 'MX$', ZAR: 'R', DKK: 'DKK'
  };
  return symbols[currency] || currency;
}

// Business Management System -------------------------------------------
let businesses = [];
let currentBusinessIndex = 0;

function loadSavedData() {
  const saved = localStorage.getItem("gapFinanceApp");
  if (saved) {
    businesses = JSON.parse(saved);
    updateBusinessList();
    switchBusiness(currentBusinessIndex);
  }
}

function saveDataToLocalStorage() {
  localStorage.setItem("gapFinanceApp", JSON.stringify(businesses));
  updateBusinessList();
}

function updateBusinessList() {
  const businessList = document.getElementById("businessList");
  businessList.innerHTML = businesses.map((b, i) => `
    <option value="${i}">${b.name}</option>
  `).join('');
}

// UI Handlers ---------------------------------------------------------
function switchBusiness() {
  currentBusinessIndex = Number(document.getElementById("businessList").value);
  loadCurrentBusinessData();
}

function addBusiness() {
  const name = prompt("Enter Business Name:");
  if (name) {
    businesses.push({
      name,
      description: "",
      currency: "USD",
      revenueTarget: 0,
      incomeStatement: [],
      balanceSheet: []
    });
    saveDataToLocalStorage();
    switchBusiness(businesses.length - 1);
  }
}

function editBusinessName() {
  const business = businesses[currentBusinessIndex];
  const newName = prompt("Enter New Name:", business.name);
  if (newName) {
    business.name = newName.trim();
    saveDataToLocalStorage();
  }
}

function deleteBusiness() {
  if (confirm("Are you sure?")) {
    businesses.splice(currentBusinessIndex, 1);
    currentBusinessIndex = Math.min(currentBusinessIndex, businesses.length - 1);
    saveDataToLocalStorage();
  }
}

// Profile Management --------------------------------------------------
function saveBusinessProfile() {
  const business = businesses[currentBusinessIndex];
  business.description = document.getElementById("businessDescription").value;
  business.currency = document.getElementById("currency").value;
  business.revenueTarget = parseFloat(document.getElementById("revenue-target").value) || 0;
  saveDataToLocalStorage();
}

function editRevenueTarget() {
  const business = businesses[currentBusinessIndex];
  const newTarget = prompt("New Revenue Target:", business.revenueTarget);
  if (newTarget) {
    business.revenueTarget = parseFloat(newTarget);
    saveDataToLocalStorage();
  }
}

function generateBusinessStory() {
  const business = businesses[currentBusinessIndex];
  const story = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long', timeStyle: 'medium', timeZone: 'UTC'
  }).format(new Date());
  
  console.log("Generating Financial Story...");
  // Your story generation logic here
}

// Transactions Management --------------------------------------------
function addIncome() {
  const business = businesses[currentBusinessIndex];
  const amount = parseFloat(prompt("Enter Income Amount:"));
  const description = prompt("Enter Description:");
  const category = prompt("Enter Category:");
  
  if (!isNaN(amount) && description) {
    business.incomeStatement.push({
      type: 'Income',
      date: new Date().toISOString().split('T')[0],
      amount,
      description,
      category
    });
    updateIncomeStatement();
  }
}

function addExpense() {
  const business = businesses[currentBusinessIndex];
  const amount = parseFloat(prompt("Enter Expense Amount:"));
  const description = prompt("Enter Description:");
  const category = prompt("Enter Category:");
  
  if (!isNaN(amount) && description) {
    business.incomeStatement.push({
      type: 'Expense',
      date: new Date().toISOString().split('T')[0],
      amount,
      description,
      category
    });
    updateIncomeStatement();
  }
}

function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];
  const incomeTable = document.getElementById("income-statement-body");
  incomeTable.innerHTML = "";
  
  let totalIncome = 0;
  let totalExpenses = 0;
  let monthlyTotals = {};

  business.incomeStatement.forEach(entry => {
    const month = entry.date.slice(0, 7);
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = {
        income: 0,
        expenses: 0,
        entries: []
      };
    }

    monthlyTotals[month].entries.push(entry);
    if (entry.type === 'Income') {
      totalIncome += entry.amount;
      monthlyTotals[month].income += entry.amount;
    } else {
      totalExpenses += entry.amount;
      monthlyTotals[month].expenses += entry.amount;
    }
  });

  Object.entries(monthlyTotals).forEach(([month, {income, expenses, entries}] ) => {
    const monthRow = document.createElement('tr');
    monthRow.innerHTML = `
      <th colspan="5" class="text-center">${month}</th>
    `;
    incomeTable.appendChild(monthRow);
    
    const categoryTotals = {};
    entries.forEach(e => {
      const category = e.category || 'Uncategorized';
      if (!categoryTotals[category]) categoryTotals[category] = { income:0, expenses:0, entries: [] };
      
      categoryTotals[category].entries.push(e);
      categoryTotals[category][e.type === 'Income' ? 'income' : 'expenses'] += e.amount;
    });
    
    Object.entries(categoryTotals).forEach(([category, {income, expenses, entries}]) => {
      const categoryRow = document.createElement('tr');
      categoryRow.innerHTML = `
        <td colspan="5">
          <div class="collapse" id="collapse-${month}-${category}">
            <table class="table table-sm">
              <tbody>
                ${entries.map(e => `
                  <tr>
                    <td>${e.date}</td>
                    <td>${e.description}</td>
                    <td>${e.type === 'Income' ? `$${e.amount}` : ''}</td>
                    <td>${e.type === 'Expense' ? `$${e.amount}` : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </td>
      `;
      incomeTable.appendChild(categoryRow);
      
      const categoryHeaderRow = document.createElement('tr');
      categoryHeaderRow.innerHTML = `
        <td colspan="5">
          <button class="btn btn-link" data-bs-toggle="collapse" data-bs-target="#collapse-${month}-${category}">
            ▶️ ${category} (${entries.length} entries)
          </button>
        </td>
      `;
      incomeTable.insertBefore(categoryHeaderRow, categoryRow);
    });
    
    const totalRow = document.createElement('tr');
    totalRow.innerHTML = `
      <td colspan="5">
        <div class="text-muted">Total Income: $${income.toFixed(2)} | Total Expenses: $${expenses.toFixed(2)}</div>
      </td>
    `;
    incomeTable.insertBefore(totalRow, null);
  });

  document.getElementById("avg-income").textContent = (totalIncome / (totalIncome ? 1 : 1)).toFixed(2);
  document.getElementById("avg-expenses").textContent = (totalExpenses / (totalExpenses ? 1 : 1)).toFixed(2);
  document.getElementById("avg-cashflow").textContent = ((totalIncome - totalExpenses) / 1).toFixed(2);
}

// Financial Health Score -------------------------------------------
function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const totalIncome = business.incomeStatement.reduce((sum, e) => sum + (e.type === 'Income' ? e.amount : 0), 0);
  const totalExpenses = business.incomeStatement.reduce((sum, e) => sum + (e.type === 'Expense' ? e.amount : 0), 0);
  const cashflow = totalIncome - totalExpenses;
  const revenueTarget = business.revenueTarget;

  let healthScore = 0;
  if (revenueTarget > 0) {
    healthScore = (cashflow / revenueTarget) * 100;
    healthScore = Math.max(0, Math.min(100, healthScore));
  }

  const chartData = [healthScore || 0, 100 - healthScore];
  const chartColors = ['#4CAF50', '#c8c8c8']; // Green and Gray

  if (healthChart.data.datasets[0]) {
    healthChart.data.datasets[0].data = chartData;
    healthChart.update();
  } else {
    new Chart(healthChartCtx, {
      type: 'doughnut',
      data: {
        labels: ['Healthy', 'Average'],
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderWidth: 0
        }]
      },
      options: {
        cutout: '80%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  document.getElementById("healthPercentage").textContent = `${healthScore.toFixed(1)}%`;
  document.getElementById("healthTips").textContent = generateHealthAdvice(healthScore);
}

function generateHealthAdvice(score) {
  if (score > 80) return "Your financial health is exceptional! 🌟 Keep saving and diversify investments!";
  if (score > 60) return "You're above average. 👍 Try automating savings for steady growth!";
  if (score > 40) return "Balanced health. 💼 Reduce debt & plan for emergencies.";
  return "Need improvement. 😕 Cut expenses and prioritize high-interest debts!";
}

// Currency Converter ------------------------------------------------
function convertCurrency() {
  const amount = document.getElementById("amount").value;
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (currencyRates.hasOwnProperty(from) && currencyRates.hasOwnProperty(to)) {
    const converted = (amount / currencyRates[from]) * currencyRates[to];
    document.getElementById("conversionResult").textContent = `${amount} ${from} = ${converted.toFixed(2)} ${to}`;
  }
}

// Data Export/Import ------------------------------------------------
function exportBusinessData() {
  const business = businesses[currentBusinessIndex];
  const blob = new Blob([JSON.stringify(business)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${business.name}_data.json`;
  a.click();
}

function importBusinessData() {
  const input = new zam(this).val('object');
  if (input && input.target.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      const data = JSON.parse(e.target.result);
      businesses.push(data);
      saveDataToLocalStorage();
    };
    reader.readAsText(input.target.files[0]);
  }
}

// Calculator --------------------------------------------------------
const calculator = {
  displayValue: '0',
  firstOperand: null,
  waitingForSecondOperand: false,
  operator: null
};

function appendToCalculator(value) {
  const isDigit = /[0-9]/.test(value);
  if (isDigit) {
    calculator.displayValue = (calculator.displayValue === '0' ? '' : calculator.displayValue) + value;
  } else if (value === '.' && !calculator.displayValue.includes('.')) {
    calculator.displayValue += '.';
  } else {
    handleOperator(value);
  }
  document.getElementById("calculatorInput").value = calculator.displayValue;
}

function handleOperator(nextOperator) {
  const { firstOperand, displayValue, operator } = calculator;
  const inputValue = parseFloat(displayValue);

  if (operator && calculator.waitingForSecondOperand) {
    calculator.operator = nextOperator;
    return;
  }

  if (firstOperand === null && !isNaN(inputValue)) {
    calculator.firstOperand = inputValue;
  } else if (operator) {
    const result = calculate(firstOperand, inputValue, operator);
    calculator.displayValue = String(result);
    calculator.firstOperand = result;
  }

  calculator.waitingForSecondOperand = true;
  calculator.operator = nextOperator;
}

function calculate(first, second, operator) {
  switch (operator) {
    case '+': return first + second;
    case '-': return first - second;
    case '*': return first * second;
    case '/': return first / second;
  }
  return second;
}

function calculateResult() {
  const { firstOperand, displayValue, operator } = calculator;
  const secondOperand = parseFloat(displayValue);

  if (firstOperand === null || secondOperand === null || !operator) {
    return;
  }

  calculator.displayValue = String(calculate(firstOperand, secondOperand, operator));
  calculator.firstOperand = null;
  calculator.waitingForSecondOperand = false;
  calculator.operator = null;
  document.getElementById("calculatorInput").value = calculator.displayValue;
}

function clearCalculator() {
  calculator.displayValue = '0';
  calculator.firstOperand = null;
  calculator.waitingForSecondOperand = false;
  calculator.operator = null;
  document.getElementById("calculatorInput").value = '0';
    }
