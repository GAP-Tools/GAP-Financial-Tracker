let businesses = [];
let currentBusinessIndex = 0;
let currencyRates = {};

// DOM Elements
const businessList = document.getElementById("businessList");
const businessNameInput = document.getElementById("businessName");
const businessDescriptionInput = document.getElementById("businessDescription");
const currencySelect = document.getElementById("currency");
const residualIncomeTargetInput = document.getElementById("residual-income-target");
const incomeStatementBody = document.getElementById("income-statement-body");
const balanceSheetBody = document.getElementById("balance-sheet-body");
const averageTotalIncomeDisplay = document.getElementById("average-total-income");
const averageTotalExpensesDisplay = document.getElementById("average-total-expenses");
const averageCashflowDisplay = document.getElementById("average-cashflow");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");
const healthPercentage = document.getElementById("healthPercentage");
const healthTips = document.getElementById("healthTips");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const conversionResult = document.getElementById("conversionResult");
const businessFinancialStory = document.getElementById("businessFinancialStory");
const saveFileNameInput = document.getElementById("saveFileName");
const calculatorPopup = document.getElementById("calculatorPopup");
const calculatorInput = document.getElementById("calculatorInput");

// Chart Initialization
const healthChart = new Chart(healthChartCtx, {
  type: "doughnut",
  data: {
    labels: ["Health"],
    datasets: [{
      data: [0],
      backgroundColor: ["#ff6384"],
    }],
  },
  options: {
    cutout: "70%",
    responsive: true,
    maintainAspectRatio: false,
  },
});

// Fetch Currency Rates
fetch("https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD")
  .then((response) => response.json())
  .then((data) => {
    currencyRates = data.conversion_rates;
    populateCurrencyDropdowns();
    loadSavedData(); // Load saved data after currencies are fetched
  });

// Populate Currency Dropdowns
function populateCurrencyDropdowns() {
  for (const currency in currencyRates) {
    const option1 = document.createElement("option");
    option1.value = currency;
    option1.text = `${currency} (${getCurrencySymbol(currency)})`;
    fromCurrency.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = currency;
    option2.text = `${currency} (${getCurrencySymbol(currency)})`;
    toCurrency.appendChild(option2);

    const option3 = document.createElement("option");
    option3.value = currency;
    option3.text = `${currency} (${getCurrencySymbol(currency)})`;
    currencySelect.appendChild(option3);
  }
}

// Get Currency Symbol
function getCurrencySymbol(currency) {
  const symbols = {
    USD: "$", EUR: "€", GBP: "£", NGN: "₦", JPY: "¥", INR: "₹", AUD: "A$", CAD: "C$", CHF: "CHF", CNY: "¥",
    // Add more currency symbols as needed
  };
  return symbols[currency] || currency;
}

// Add Business
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (name) {
    const newBusiness = {
      name,
      description: "",
      currency: "USD",
      residualIncomeTarget: 0,
      incomeStatement: [],
      balanceSheet: [],
    };
    businesses.push(newBusiness);
    updateBusinessList();
    switchBusiness(businesses.length - 1);
    businessNameInput.value = "";
    saveDataToLocalStorage();
  } else {
    alert("Please enter a business name!");
  }
}

// Update Business List
function updateBusinessList() {
  businessList.innerHTML = "";
  businesses.forEach((business, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = business.name;
    businessList.appendChild(option);
  });
}

// Switch Business
function switchBusiness(index = businessList.value) {
  currentBusinessIndex = index;
  const business = businesses[currentBusinessIndex];
  businessDescriptionInput.value = business.description;
  currencySelect.value = business.currency;
  residualIncomeTargetInput.value = business.residualIncomeTarget;
  updateIncomeStatement();
  updateBalanceSheet();
  updateFinancialHealth();
}

// Save Business Profile
function saveBusinessProfile() {
  const business = businesses[currentBusinessIndex];
  business.description = businessDescriptionInput.value;
  business.currency = currencySelect.value;
  business.residualIncomeTarget = parseFloat(residualIncomeTargetInput.value) || 0;
  alert("Business Profile Saved!");
  saveDataToLocalStorage();
}

// Edit Business Name
function editBusinessName() {
  const newName = prompt("Enter New Business Name:", businesses[currentBusinessIndex].name);
  if (newName && newName.trim()) {
    businesses[currentBusinessIndex].name = newName.trim();
    updateBusinessList();
    saveDataToLocalStorage();
    alert("Business Name Updated!");
  } else {
    alert("Invalid Input!");
  }
}

// Delete Business
function deleteBusiness() {
  if (confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
    businesses.splice(currentBusinessIndex, 1); // Remove the business from the array
    if (businesses.length > 0) {
      currentBusinessIndex = 0; // Switch to the first business
      switchBusiness();
    } else {
      // If no businesses are left, reset the UI
      currentBusinessIndex = -1;
      resetUI();
    }
    updateBusinessList();
    saveDataToLocalStorage();
    alert("Business Deleted!");
  }
}

function resetUI() {
  businessDescriptionInput.value = "";
  currencySelect.value = "USD";
  residualIncomeTargetInput.value = "";
  incomeStatementBody.innerHTML = "";
  balanceSheetBody.innerHTML = "";
  averageTotalIncomeDisplay.textContent = "0";
  averageTotalExpensesDisplay.textContent = "0";
  averageCashflowDisplay.textContent = "0";
  healthChart.data.datasets[0].data = [0];
  healthChart.update();
  healthPercentage.textContent = "0%";
  healthTips.textContent = "";
}

// Add Income or Expense
function addIncomeOrExpense(isIncome) {
  const type = isIncome ? "Income" : "Expense";
  const date = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long' });
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Amount:"));
  if (description && !isNaN(amount)) {
    const business = businesses[currentBusinessIndex];
    business.incomeStatement.push({
      date: date,
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      description,
      type,
      amount
    });
    updateIncomeStatement();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Update Income Statement
function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];
  const monthlyData = groupByMonth(business.incomeStatement);
  
  incomeStatementBody.innerHTML = "";
  
  Object.entries(monthlyData).forEach(([key, entries]) => {
    const [year, month] = key.split('-');
    const monthlyTotalIncome = entries.filter(e => e.type === 'Income').reduce((sum, entry) => sum + entry.amount, 0);
    const monthlyTotalExpenses = entries.filter(e => e.type === 'Expense').reduce((sum, entry) => sum + entry.amount, 0);
    const monthlyCashflow = monthlyTotalIncome - monthlyTotalExpenses;

    const row = document.createElement("tr");
    row.innerHTML = `
      ${new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
      ${business.currency} ${monthlyTotalIncome.toFixed(2)}
      ${business.currency} ${monthlyTotalExpenses.toFixed(2)}
      ${business.currency} ${monthlyCashflow.toFixed(2)}
      ▼
    `;
    incomeStatementBody.appendChild(row);

    const detailsRow = document.createElement("tr");
    detailsRow.className = "details";
    detailsRow.style.display = "none";
    detailsRow.innerHTML = `
      
        
Description	Income	Expenses	Action

      
    `;
    incomeStatementBody.appendChild(detailsRow);

    const detailsBody = document.getElementById(`details-${year}-${month}`);
    entries.forEach(entry => {
      const detailRow = document.createElement("tr");
      detailRow.innerHTML = `
        ${entry.description}
        ${entry.type === "Income" ? `${business.currency} ${entry.amount.toFixed(2)}` : ""}
        ${entry.type === "Expense" ? `${business.currency} ${entry.amount.toFixed(2)}` : ""}
        Click for Options
      `;
      detailsBody.appendChild(detailRow);
    });
  });

  updateAverages();
}

function groupByMonth(entries) {
  return entries.reduce((acc, entry) => {
    const key = `${entry.year}-${entry.month}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});
}

function toggleMonthDetails(button, monthKey) {
  const detailsRow = button.closest('tr').nextElementSibling;
  detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
  button.textContent = button.textContent === '▼' ? '▲' : '▼';
}

function showOptions(event, type, monthKey, index) {
  const options = [
    {action: 'Edit', callback: `editEntry('${type}', '${monthKey}', ${index})`},
    {action: 'Duplicate', callback: `duplicateEntry('${type}', '${monthKey}', ${index})`},
    {action: 'Delete', callback: `deleteEntry('${type}', '${monthKey}', ${index})`}
  ];

  const popup = document.createElement('div');
  popup.className = 'action-popup';
  popup.style.position = 'absolute';
  popup.style.left = `${event.clientX}px`;
  popup.style.top = `${event.clientY}px`;
  options.forEach(opt => {
    const button = document.createElement('button');
    button.textContent = opt.action;
    button.onclick = new Function(opt.callback);
    popup.appendChild(button);
  });
  document.body.appendChild(popup);

  // Remove the popup when clicking outside
  document.addEventListener('click', removePopup = (e) => {
    if (!popup.contains(e.target)) {
      document.body.removeChild(popup);
      document.removeEventListener('click', removePopup);
    }
  });
}

function editEntry(type, monthKey, index) {
  const business = businesses[currentBusinessIndex];
  const entries = business.incomeStatement.filter(e => `${e.year}-${e.month}` === monthKey);
  const entry = entries[index];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  if (newDescription && !isNaN(newAmount)) {
    entry.description = newDescription;
    entry.amount = newAmount;
    updateIncomeStatement();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

function duplicateEntry(type, monthKey, index) {
  const business = businesses[currentBusinessIndex];
  const entries = business.incomeStatement.filter(e => `${e.year}-${e.month}` === monthKey);
  const entry = entries[index];
  business.incomeStatement.push({
    ...entry,
    date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long' }),
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });
  updateIncomeStatement();
  updateFinancialHealth();
  saveDataToLocalStorage();
}

function deleteEntry(type, monthKey, index) {
  const business = businesses[currentBusinessIndex];
  const entries = business.incomeStatement.filter(e => `${e.year}-${e.month}` === monthKey);
  if (confirm("Are you sure you want to delete this entry?")) {
    business.incomeStatement.splice(business.incomeStatement.indexOf(entries[index]), 1);
    updateIncomeStatement();
    updateFinancialHealth();
    saveDataToLocalStorage();
  }
}

function updateAverages() {
  const business = businesses[currentBusinessIndex];
  const monthlyData = groupByMonth(business.incomeStatement);
  const totalMonths = Object.keys(monthlyData).length;
  
  let totalIncome = 0, totalExpenses = 0;
  Object.values(monthlyData).forEach(entries => {
    totalIncome += entries.filter(e => e.type === 'Income').reduce((sum, e) => sum + e.amount, 0);
    totalExpenses += entries.filter(e => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0);
  });

  const averageIncome = totalIncome / totalMonths || 0;
  const averageExpenses = totalExpenses / totalMonths || 0;
  const averageCashflow = (averageIncome - averageExpenses) || 0;

  averageTotalIncomeDisplay.textContent = `${business.currency} ${averageIncome.toFixed(2)}`;
  averageTotalExpensesDisplay.textContent = `${business.currency} ${averageExpenses.toFixed(2)}`;
  averageCashflowDisplay.textContent = `${business.currency} ${averageCashflow.toFixed(2)}`;
}

// Update Financial Health
function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const averageIncome = parseFloat(averageTotalIncomeDisplay.textContent.replace(business.currency, ""));
  const averageExpenses = parseFloat(averageTotalExpensesDisplay.textContent.replace(business.currency, ""));
  const averageCashflow = averageIncome - averageExpenses;

  const healthScore = Math.round((averageCashflow / business.residualIncomeTarget) * 100);

  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();

  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, averageIncome, averageExpenses, averageCashflow, business.residualIncomeTarget);
}

// Get Health Color
function getHealthColor(score) {
  if (score <= 39) return "#ff6384"; // Red
  if (score <= 59) return "#ffcd56"; // Yellow
  if (score <= 79) return "#4bc0c0"; // Green
  return "#36a2eb"; // Deeper Green
}

// Generate Health Tip
function generateHealthTip(score, income, expenses, cashflow, residualTarget) {
  // Implement tip generation logic here
  return "Health Tip: " + (score > 70 ? "Excellent financial health!" : "Consider revising your financial strategy.");
}

// Save Data to LocalStorage
function saveDataToLocalStorage() {
  localStorage.setItem("businesses", JSON.stringify(businesses));
}

// Load Saved Data
function loadSavedData() {
  const savedData = localStorage.getItem("businesses");
  if (savedData) {
    businesses = JSON.parse(savedData);
    updateBusinessList();
    switchBusiness(0);
  }
}

// Currency Conversion
function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (amount && from && to) {
    const convertedAmount = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
  }
}

// Calculator functionality
function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === "block" ? "none" : "block";
}

function appendToCalculator(value) {
  calculatorInput.value += value;
}

function calculateResult() {
  try {
    calculatorInput.value = eval(calculatorInput.value);
  } catch (error) {
    calculatorInput.value = "Error";
  }
}

function clearCalculator() {
  calculatorInput.value = "";
}

// Generate Business Story
function generateBusinessStory() {
  const business = businesses[currentBusinessIndex];
  const averageIncome = parseFloat(averageTotalIncomeDisplay.textContent.replace(business.currency, ""));
  const averageExpenses = parseFloat(averageTotalExpensesDisplay.textContent.replace(business.currency, ""));
  const averageCashflow = parseFloat(averageCashflowDisplay.textContent.replace(business.currency, ""));

  const story = `Financial Overview for ${business.name}, focused on ${business.description}:
  
  - **Average Total Income:** ${business.currency} ${averageIncome.toFixed(2)}
  - **Average Total Expenses:** ${business.currency} ${averageExpenses.toFixed(2)}
  - **Average Cashflow:** ${business.currency} ${averageCashflow.toFixed(2)}
  
  Financial Health: ${healthPercentage.textContent}

  ${healthTips.textContent}
  `;
  businessFinancialStory.textContent = story;
}

// Event listeners for switch to personal link
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('switchLink').addEventListener('click', function() {
    window.location.href = 'https://gap-tools.github.io/GAP-Financial-Tracker/';
  });
});
