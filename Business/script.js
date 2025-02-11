// Initialize variables
let businesses = []; // Array to store multiple businesses
let currentBusinessIndex = 0; // Index of the currently selected business
let currencyRates = {}; // Store currency conversion rates

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
const cashflowDisplay = document.getElementById("cashflow");
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
      incomeStatement: {},
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

// Edit Revenue Target
function editRevenueTarget() {
  const newTarget = prompt("Enter New Revenue/Residual Income Target:", businesses[currentBusinessIndex].revenueTarget);
  if (newTarget && !isNaN(newTarget)) {
    businesses[currentBusinessIndex].revenueTarget = parseFloat(newTarget);
    revenueTargetInput.value = businesses[currentBusinessIndex].revenueTarget;
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
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
    businesses.splice(currentBusinessIndex, 1);
    if (businesses.length > 0) {
      currentBusinessIndex = 0;
      switchBusiness();
    } else {
      currentBusinessIndex = -1;
      businessDescriptionInput.value = "";
      currencySelect.value = "USD";
      revenueTargetInput.value = "";
      incomeStatementBody.innerHTML = "";
      balanceSheetBody.innerHTML = "";
      totalIncome.textContent = "0";
      totalExpenses.textContent = "0";
      totalAssets.textContent = "0";
      totalLiabilities.textContent = "0";
      netWorthDisplay.textContent = "0";
      healthChart.data.datasets[0].data = [0];
      healthChart.update();
      healthPercentage.textContent = "0%";
      healthTips.textContent = "";
    }
    updateBusinessList();
    saveDataToLocalStorage();
    alert("Business Deleted!");
  }
}

// Add Income
function addIncome() {
  const business = businesses[currentBusinessIndex];
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Income Amount:"));
  if (description && amount) {
    if (!business.incomeStatement[date]) {
      business.incomeStatement[date] = [];
    }
    business.incomeStatement[date].push({ date: new Date().toLocaleDateString(), description, type: "Income", amount });
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
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Expense Amount:"));
  if (description && amount) {
    if (!business.incomeStatement[date]) {
      business.incomeStatement[date] = [];
    }
    business.incomeStatement[date].push({ date: new Date().toLocaleDateString(), description, type: "Expense", amount });
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
  incomeStatementBody.innerHTML = "";
  let totalIncomeAmount = 0;
  let totalExpensesAmount = 0;

  for (const month in business.incomeStatement) {
    const monthRow = document.createElement("tr");
    monthRow.classList.add("month-row");
    monthRow.innerHTML = `
      <td>${month}</td>
      <td>${business.incomeStatement[month].reduce((sum, entry) => entry.type === "Income" ? sum + entry.amount : sum, 0)}</td>
      <td>${business.incomeStatement[month].reduce((sum, entry) => entry.type === "Expense" ? sum + entry.amount : sum, 0)}</td>
      <td>${business.incomeStatement[month].reduce((sum, entry) => entry.type === "Income" ? sum + entry.amount : sum, 0) - business.incomeStatement[month].reduce((sum, entry) => entry.type === "Expense" ? sum + entry.amount : sum, 0)}</td>
      <td><button onclick="toggleMonth('${month}')">Expand</button></td>
    `;
    incomeStatementBody.appendChild(monthRow);

    const detailsRow = document.createElement("tr");
    detailsRow.classList.add("details-row", "hidden");
    detailsRow.id = `details-${month}`;
    detailsRow.innerHTML = `
      <td colspan="5">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${business.incomeStatement[month].map(entry => `
              <tr>
                <td>${entry.date}</td>
                <td>${entry.description}</td>
                <td>${entry.type === "Income" ? entry.amount : ""}</td>
                <td>${entry.type === "Expense" ? entry.amount : ""}</td>
                <td>
                  <button onclick="editEntry('income', '${month}', ${business.incomeStatement[month].indexOf(entry)})">✏️</button>
                  <button onclick="deleteEntry('income', '${month}', ${business.incomeStatement[month].indexOf(entry)})">🗑️</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </td>
    `;
    incomeStatementBody.appendChild(detailsRow);

    totalIncomeAmount += business.incomeStatement[month].reduce((sum, entry) => entry.type === "Income" ? sum + entry.amount : sum, 0);
    totalExpensesAmount += business.incomeStatement[month].reduce((sum, entry) => entry.type === "Expense" ? sum + entry.amount : sum, 0);
  }

  totalIncome.textContent = `${business.currency} ${totalIncomeAmount}`;
  totalExpenses.textContent = `${business.currency} ${totalExpensesAmount}`;
  const cashflow = totalIncomeAmount - totalExpensesAmount;
  cashflowDisplay.textContent = `${business.currency} ${cashflow}`;
}

// Toggle Month Details
function toggleMonth(month) {
  const detailsRow = document.getElementById(`details-${month}`);
  detailsRow.classList.toggle("hidden");
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
      <td>${entry.type === "Asset" ? entry.amount : ""}</td>
      <td>${entry.type === "Liability" ? entry.amount : ""}</td>
      <td>
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
