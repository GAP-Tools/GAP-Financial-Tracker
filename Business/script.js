// Initialize variables
let businesses = []; // Array to store multiple businesses
let currentBusinessIndex = 0; // Index of the currently selected business

// DOM Elements
const businessList = document.getElementById("businessList");
const businessNameInput = document.getElementById("businessName");
const businessDescriptionInput = document.getElementById("businessDescription");
const currencySelect = document.getElementById("currency");
const revenueTargetInput = document.getElementById("revenue-target");
const incomeStatementBody = document.getElementById("income-statement-body");
const balanceSheetBody = document.getElementById("balance-sheet-body");
const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const totalAssets = document.getElementById("total-assets");
const totalLiabilities = document.getElementById("total-liabilities");
const netWorthDisplay = document.getElementById("net-worth");
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
      revenueTarget: 0,
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
function switchBusiness() {
  currentBusinessIndex = businessList.value;
  const business = businesses[currentBusinessIndex];
  businessDescriptionInput.value = business.description;
  currencySelect.value = business.currency;
  revenueTargetInput.value = business.revenueTarget;
  updateIncomeStatement();
  updateBalanceSheet();
  updateFinancialHealth();
}

// Save Business Profile
function saveBusinessProfile() {
  const business = businesses[currentBusinessIndex];
  business.description = businessDescriptionInput.value;
  business.currency = currencySelect.value;
  business.revenueTarget = parseFloat(revenueTargetInput.value) || 0;
  alert("Business Profile Saved!");
  saveDataToLocalStorage();
}

// Switch to Personal
document.addEventListener('DOMContentLoaded', function() {
    var switchLink = document.getElementById('switchLink');
    if (switchLink) {
        switchLink.addEventListener('click', function() {
            window.location.href = 'https://gap-tools.github.io/GAP-Financial-Tracker/';
        });
    }
});

// Edit Revenue Target
function editRevenueTarget() {
  const newTarget = prompt("Enter New Residual Income Target:", businesses[currentBusinessIndex].revenueTarget);
  if (newTarget && !isNaN(newTarget)) {
    businesses[currentBusinessIndex].revenueTarget = parseFloat(newTarget);
    revenueTargetInput.value = businesses[currentBusinessIndex].revenueTarget;
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Income
function addIncome() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Income Amount:"));
  if (date && description && amount) {
    business.incomeStatement.push({ date, description, type: "Income", amount });
    updateIncomeStatement();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Expense
function addExpense() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Expense Amount:"));
  if (date && description && amount) {
    business.incomeStatement.push({ date, description, type: "Expense", amount });
    updateIncomeStatement();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Asset
function addAsset() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: "Asset", amount });
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Liability
function addLiability() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: "Liability", amount });
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Update Income Statement
function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];
  incomeStatementBody.innerHTML = "";
  let totalIncomeAmount = 0;
  let totalExpensesAmount = 0;

  business.incomeStatement.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "Income" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Expense" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editEntry('income', ${index})">✏️</button>
        <button onclick="deleteEntry('income', ${index})">🗑️</button>
      </td>
    `;
    incomeStatementBody.appendChild(row);

    if (entry.type === "Income") totalIncomeAmount += entry.amount;
    if (entry.type === "Expense") totalExpensesAmount += entry.amount;
  });

  totalIncome.textContent = `${business.currency} ${totalIncomeAmount}`;
  totalExpenses.textContent = `${business.currency} ${totalExpensesAmount}`;
  const cashflow = totalIncomeAmount - totalExpensesAmount;
  cashflowDisplay.textContent = `${business.currency} ${cashflow}`;
}

// Update Balance Sheet
function updateBalanceSheet() {
  const business = businesses[currentBusinessIndex];
  balanceSheetBody.innerHTML = "";
  let totalAssetsAmount = 0;
  let totalLiabilitiesAmount = 0;

  business.balanceSheet.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "Asset" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Liability" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editEntry('balance', ${index})">✏️</button>
        <button onclick="deleteEntry('balance', ${index})">🗑️</button>
      </td>
    `;
    balanceSheetBody.appendChild(row);

    if (entry.type === "Asset") totalAssetsAmount += entry.amount;
    if (entry.type === "Liability") totalLiabilitiesAmount += entry.amount;
  });

  totalAssets.textContent = `${business.currency} ${totalAssetsAmount}`;
  totalLiabilities.textContent = `${business.currency} ${totalLiabilitiesAmount}`;
  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  netWorthDisplay.textContent = `${business.currency} ${netWorth}`;
}

// Edit Entry
function editEntry(type, index) {
  const business = businesses[currentBusinessIndex];
  const entry = type === "income" ? business.incomeStatement[index] : business.balanceSheet[index];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  if (newDescription && !isNaN(newAmount)) {
    entry.description = newDescription;
    entry.amount = newAmount;
    if (type === "income") updateIncomeStatement();
    else updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Delete Entry
function deleteEntry(type, index) {
  const business = businesses[currentBusinessIndex];
  if (confirm("Are you sure you want to delete this entry?")) {
    if (type === "income") business.incomeStatement.splice(index, 1);
    else business.balanceSheet.splice(index, 1);
    if (type === "income") updateIncomeStatement();
    else updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  }
}

// Update Financial Health
function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(business.currency, ""));
  const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(business.currency, ""));
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(business.currency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(business.currency, ""));
  const cashflow = totalIncomeAmount - totalExpensesAmount;

  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  const savingsRate = (totalIncomeAmount - totalExpensesAmount) / totalIncomeAmount || 0;
  const healthScore = Math.round((cashflow / business.revenueTarget) * 100);

  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();

  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, totalIncomeAmount, totalExpensesAmount, totalAssetsAmount, totalLiabilitiesAmount, cashflow, business.revenueTarget);
}

// Get Health Color
function getHealthColor(score) {
  if (score <= 39) return "#ff6384"; // Red
  if (score <= 59) return "#ffcd56"; // Yellow
  if (score <= 79) return "#4bc0c0"; // Green
  return "#36a2eb"; // Deeper Green
}

// Generate Health Tip
function generateHealthTip(score, income, expenses, assets, liabilities, cashflow, revenueTarget) {
  const tips = [];
  if (score <= 39) {
    tips.push(
      "Your expenses are higher than your income. Consider cutting down on unnecessary spending.",
      "Focus on reducing liabilities and increasing assets to improve your financial health.",
      "You're spending more than you earn. Try to find ways to increase your income or reduce expenses.",
      "High liabilities can lead to financial stress. Focus on paying off debts.",
      "Your savings rate is low. Consider creating a budget to track your spending.",
      "Invest in assets that generate passive income to improve your financial health.",
      "Avoid unnecessary expenses and focus on building an emergency fund.",
      "Your financial health is in danger. Take immediate steps to reduce liabilities.",
      "Consider consulting a financial advisor to improve your financial situation.",
      "Track your spending habits to identify areas where you can cut costs."
    );
  } else if (score <= 59) {
    tips.push(
      "Your financial health is improving, but there's still room for growth. Consider investing in assets.",
      "You're doing okay, but try to reduce your liabilities to improve your net worth.",
      "Your savings rate is low. Consider increasing your income or reducing expenses.",
      "Focus on building assets that appreciate over time.",
      "Avoid taking on new debts and focus on paying off existing ones.",
      "Your net worth is improving, but you can do better by increasing your income.",
      "Consider diversifying your income streams to improve financial stability.",
      "Your financial health is stable, but you need to focus on long-term goals.",
      "Invest in education or skills that can increase your earning potential.",
      "Create a financial plan to achieve your dreams and goals."
    );
  } else if (score <= 79) {
    tips.push(
      "Great job! Your income is higher than your expenses. Keep building your assets.",
      "You're on the right track. Consider investing in assets to generate passive income.",
      "Your financial health is good. Keep saving and investing to reach your goals.",
      "Your net worth is growing. Focus on maintaining a healthy savings rate.",
      "Consider investing in real estate or stocks to grow your wealth.",
      "Your financial habits are improving. Keep up the good work!",
      "You're doing well, but don't forget to plan for retirement.",
      "Your financial health is strong. Focus on long-term wealth-building strategies.",
      "Consider creating multiple income streams to further improve your financial health.",
      "You're on the path to financial freedom. Keep making smart financial decisions."
    );
  } else {
    tips.push(
      "Excellent! Your financial health is in great shape. Keep up the good work!",
      "You're doing amazing! Consider diversifying your investments to further grow your wealth.",
      "Your net worth is impressive. Keep focusing on building assets and reducing liabilities.",
      "You've achieved financial stability. Focus on giving back and helping others.",
      "Your financial health is exceptional. Consider mentoring others on financial management.",
      "You're a financial role model. Keep inspiring others with your success.",
      "Your wealth is growing steadily. Focus on legacy planning and philanthropy.",
      "You've mastered financial management. Consider exploring new investment opportunities.",
      "Your financial health is outstanding. Keep setting and achieving new goals.",
      "You're financially free. Enjoy the fruits of your hard work and smart decisions."
    );
  }

  // Add tips based on cashflow and revenue target
  if (cashflow < revenueTarget) {
    tips.push(
      "Your cashflow is below your revenue target. Focus on increasing income or reducing expenses.",
      "Consider investing in assets that generate passive income to bridge the gap.",
      "Your financial freedom goal is within reach. Keep working towards it!"
    );
  } else {
    tips.push(
      "Congratulations! Your cashflow exceeds your revenue target. You're financially free!",
      "You've achieved financial freedom. Consider reinvesting your surplus income to grow your wealth further.",
      "Your financial health is excellent. Focus on maintaining your freedom and exploring new opportunities."
    );
  }

  return tips[Math.floor(Math.random() * tips.length)];
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

// Export Business Data
function exportBusinessData() {
  const fileName = saveFileNameInput.value.trim() || businesses[currentBusinessIndex].name;
  const data = businesses[currentBusinessIndex];
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
}

// Import Business Data
function importBusinessData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      businesses.push(data);
      updateBusinessList();
      switchBusiness(businesses.length - 1);
      saveDataToLocalStorage();
      alert("Business Data Loaded!");
    };
    reader.readAsText(file);
  };
  input.click();
}

// Clear Business Data
function clearBusinessData() {
  if (confirm("Are you sure you want to clear this business's data?")) {
    businesses[currentBusinessIndex] = {
      name: businesses[currentBusinessIndex].name,
      description: "",
      currency: "USD",
      revenueTarget: 0,
      incomeStatement: [],
      balanceSheet: [],
    };
    businessDescriptionInput.value = "";
    currencySelect.value = "USD";
    revenueTargetInput.value = "";
    updateIncomeStatement();
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
    alert("Business Data Cleared!");
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

// Download App
function downloadApp() {
  window.open("https://www.appcreator24.com/app3480869-q98157", "_blank");
}

// Generate Business Financial Story
function generateBusinessStory() {
  const business = businesses[currentBusinessIndex];
  const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(business.currency, ""));
  const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(business.currency, ""));
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(business.currency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(business.currency, ""));
  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  const cashflow = totalIncomeAmount - totalExpensesAmount;

  const story = `
    ${business.name}, a business focused on ${business.description}, has been tracking its finances diligently. 
    
    Its total income is ${business.currency} ${totalIncomeAmount}, while its expenses amount to ${business.currency} ${totalExpensesAmount}. 
    
    It owns assets worth ${business.currency} ${totalAssetsAmount} and has liabilities of ${business.currency} ${totalLiabilitiesAmount}, 
    resulting in a net worth of ${business.currency} ${netWorth}. 
    
    Its cashflow is ${business.currency} ${cashflow}, and its revenue target is ${business.currency} ${business.revenueTarget}. 
    
    TIPS: ${generateHealthTip(healthChart.data.datasets[0].data[0], totalIncomeAmount, totalExpensesAmount, totalAssetsAmount, totalLiabilitiesAmount, cashflow, business.revenueTarget)}
  `;
  businessFinancialStory.textContent = story;
}

// Toggle Calculator Popup
function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === "block" ? "none" : "block";
}

// Append to Calculator Input
function appendToCalculator(value) {
  calculatorInput.value += value;
}

// Calculate Result
function calculateResult() {
  try {
    calculatorInput.value = eval(calculatorInput.value);
  } catch (error) {
    calculatorInput.value = "Error";
  }
}

// Clear Calculator
function clearCalculator() {
  calculatorInput.value = "";
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
