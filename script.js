// Initialize variables
let profile = { name: "", age: "", occupation: "", dream: "" };
let incomeStatement = [];
let balanceSheet = [];
let currencyRates = {};
let selectedCurrency = "USD";

// DOM Elements
const incomeStatementBody = document.getElementById("income-statement-body");
const balanceSheetBody = document.getElementById("balance-sheet-body");
const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const totalAssets = document.getElementById("total-assets");
const totalLiabilities = document.getElementById("total-liabilities");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");
const healthPercentage = document.getElementById("healthPercentage");
const healthTips = document.getElementById("healthTips");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const conversionResult = document.getElementById("conversionResult");
const financialStory = document.getElementById("financialStory");

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
  });

// Populate Currency Dropdowns
function populateCurrencyDropdowns() {
  for (const currency in currencyRates) {
    const option1 = document.createElement("option");
    option1.value = currency;
    option1.text = currency;
    fromCurrency.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = currency;
    option2.text = currency;
    toCurrency.appendChild(option2);
  }
}

// Save Profile
function saveProfile() {
  profile.name = document.getElementById("name").value;
  profile.age = document.getElementById("age").value;
  profile.occupation = document.getElementById("occupation").value;
  profile.dream = document.getElementById("dream").value;
  alert("Profile Saved!");
}

// Add Income
function addIncome() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Income Amount:"));
  if (date && description && amount) {
    incomeStatement.push({ date, description, type: "Income", amount });
    updateIncomeStatement();
    updateFinancialHealth();
  } else {
    alert("Invalid Input!");
  }
}

// Add Expense
function addExpense() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Expense Amount:"));
  if (date && description && amount) {
    incomeStatement.push({ date, description, type: "Expense", amount });
    updateIncomeStatement();
    updateFinancialHealth();
  } else {
    alert("Invalid Input!");
  }
}

// Add Asset
function addAsset() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));
  if (date && description && amount) {
    balanceSheet.push({ date, description, type: "Asset", amount });
    updateBalanceSheet();
    updateFinancialHealth();
  } else {
    alert("Invalid Input!");
  }
}

// Add Liability
function addLiability() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));
  if (date && description && amount) {
    balanceSheet.push({ date, description, type: "Liability", amount });
    updateBalanceSheet();
    updateFinancialHealth();
  } else {
    alert("Invalid Input!");
  }
}

// Update Income Statement
function updateIncomeStatement() {
  incomeStatementBody.innerHTML = "";
  let totalIncomeAmount = 0;
  let totalExpensesAmount = 0;

  incomeStatement.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "Income" ? `${selectedCurrency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Expense" ? `${selectedCurrency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editEntry('income', ${index})">✏️</button>
        <button onclick="deleteEntry('income', ${index})">🗑️</button>
      </td>
    `;
    incomeStatementBody.appendChild(row);

    if (entry.type === "Income") totalIncomeAmount += entry.amount;
    if (entry.type === "Expense") totalExpensesAmount += entry.amount;
  });

  totalIncome.textContent = `${selectedCurrency} ${totalIncomeAmount}`;
  totalExpenses.textContent = `${selectedCurrency} ${totalExpensesAmount}`;
}

// Update Balance Sheet
function updateBalanceSheet() {
  balanceSheetBody.innerHTML = "";
  let totalAssetsAmount = 0;
  let totalLiabilitiesAmount = 0;

  balanceSheet.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "Asset" ? `${selectedCurrency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Liability" ? `${selectedCurrency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editEntry('balance', ${index})">✏️</button>
        <button onclick="deleteEntry('balance', ${index})">🗑️</button>
      </td>
    `;
    balanceSheetBody.appendChild(row);

    if (entry.type === "Asset") totalAssetsAmount += entry.amount;
    if (entry.type === "Liability") totalLiabilitiesAmount += entry.amount;
  });

  totalAssets.textContent = `${selectedCurrency} ${totalAssetsAmount}`;
  totalLiabilities.textContent = `${selectedCurrency} ${totalLiabilitiesAmount}`;
}

// Edit Entry
function editEntry(type, index) {
  const entry = type === "income" ? incomeStatement[index] : balanceSheet[index];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  if (newDescription && !isNaN(newAmount)) {
    entry.description = newDescription;
    entry.amount = newAmount;
    if (type === "income") updateIncomeStatement();
    else updateBalanceSheet();
    updateFinancialHealth();
  } else {
    alert("Invalid Input!");
  }
}

// Delete Entry
function deleteEntry(type, index) {
  if (confirm("Are you sure you want to delete this entry?")) {
    if (type === "income") incomeStatement.splice(index, 1);
    else balanceSheet.splice(index, 1);
    if (type === "income") updateIncomeStatement();
    else updateBalanceSheet();
    updateFinancialHealth();
  }
}

// Update Financial Health
function updateFinancialHealth() {
  const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(selectedCurrency, ""));
  const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(selectedCurrency, ""));
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(selectedCurrency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(selectedCurrency, ""));

  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  const savingsRate = (totalIncomeAmount - totalExpensesAmount) / totalIncomeAmount || 0;
  const healthScore = Math.round((netWorth + savingsRate * 100) / 2);

  healthChart.data.datasets[0].data = [healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();

  healthPercentage.textContent = `${healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore);
}

// Get Health Color
function getHealthColor(score) {
  if (score <= 39) return "#ff6384"; // Red
  if (score <= 59) return "#ffcd56"; // Yellow
  if (score <= 79) return "#4bc0c0"; // Green
  return "#36a2eb"; // Deeper Green
}

// Generate Health Tip
function generateHealthTip(score) {
  const tips = [
    "Focus on reducing liabilities and increasing assets.",
    "Consider cutting down on unnecessary expenses.",
    "Great job! Keep building your assets.",
    "You're on the right track. Keep saving!",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

// Convert Currency
function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (amount && from && to) {
    const convertedAmount = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
  }
}

// Save Data
function saveData() {
  const data = { profile, incomeStatement, balanceSheet, selectedCurrency };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "financial_data.json";
  a.click();
}

// Load Data
function loadData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      profile = data.profile;
      incomeStatement = data.incomeStatement;
      balanceSheet = data.balanceSheet;
      selectedCurrency = data.selectedCurrency;
      updateIncomeStatement();
      updateBalanceSheet();
      updateFinancialHealth();
      alert("Data Loaded!");
    };
    reader.readAsText(file);
  };
  input.click();
}

// Clear Data
function clearData() {
  if (confirm("Are you sure you want to clear all data?")) {
    profile = { name: "", age: "", occupation: "", dream: "" };
    incomeStatement = [];
    balanceSheet = [];
    selectedCurrency = "USD";
    updateIncomeStatement();
    updateBalanceSheet();
    updateFinancialHealth();
    alert("Data Cleared!");
  }
}

// Share on WhatsApp
function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check%20out%20this%20awesome%20Financial%20Tracker%20App%20${url}`);
}

// Share on Facebook
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

// Share on Twitter
function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=Check%20out%20this%20awesome%20Financial%20Tracker%20App`);
}

// Generate Financial Story
function generateStory() {
  const story = `Once upon a time, ${profile.name}, a ${profile.age}-year-old ${profile.occupation}, dreamed of ${profile.dream}. Through careful financial management, they achieved a net worth of ${parseFloat(totalAssets.textContent) - parseFloat(totalLiabilities.textContent)}. Their journey was filled with ups and downs, but they persevered. Keep going!`;
  financialStory.textContent = story;
    }
