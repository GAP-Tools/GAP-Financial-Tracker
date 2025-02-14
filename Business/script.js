// Initialize variables
let businesses = [];
let currentBusinessIndex = 0;
let currencyRates = {};

// DOM Elements
const businessList = document.getElementById("businessList");
const businessNameInput = document.getElementById("businessName");
const businessDescriptionInput = document.getElementById("businessDescription");
const currencySelect = document.getElementById("currency");
const revenueTargetInput = document.getElementById("revenue-target");
const balanceSheetBody = document.getElementById("balance-sheet-body");
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
    loadSavedData();
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

// Business Management Functions
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (name) {
    const newBusiness = {
      name,
      description: "",
      currency: "USD",
      revenueTarget: 0,
      incomeStatement: {
        months: [],
        categories: []
      },
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

function updateBusinessList() {
  businessList.innerHTML = "";
  businesses.forEach((business, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = business.name;
    businessList.appendChild(option);
  });
}

function switchBusiness() {
  currentBusinessIndex = businessList.value;
  const business = businesses[currentBusinessIndex];
  businessDescriptionInput.value = business.description;
  currencySelect.value = business.currency;
  revenueTargetInput.value = business.revenueTarget;
  updateMonthlyTable();
  updateBalanceSheet();
  updateAverages();
}

// Income Statement Functions
function getCurrentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
}

function addMonthIfNew(month) {
  const business = businesses[currentBusinessIndex];
  if (!business.incomeStatement.months.some(m => m.month === month)) {
    business.incomeStatement.months.push({
      month,
      categories: [],
      totalIncome: 0,
      totalExpenses: 0
    });
  }
}

function updateMonthlyTable() {
  const business = businesses[currentBusinessIndex];
  const monthlyBody = document.getElementById('monthly-body');
  monthlyBody.innerHTML = '';
  
  business.incomeStatement.months.forEach((monthData, index) => {
    const row = document.createElement('tr');
    row.classList.add('expandable');
    row.innerHTML = `
      <td class="editable-date">${monthData.month}</td>
      <td>${business.currency} ${monthData.totalIncome}</td>
      <td>${business.currency} ${monthData.totalExpenses}</td>
      <td>${business.currency} ${monthData.totalIncome - monthData.totalExpenses}</td>
      <td>
        <button onclick="deleteMonth(${index})">🗑️</button>
      </td>
    `;
    monthlyBody.appendChild(row);
    
    const categoryRow = document.createElement('tr');
    categoryRow.classList.add('nested');
    const categoryCell = document.createElement('td');
    categoryCell.colSpan = 5;
    categoryCell.innerHTML = `
      <table class="category-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Income</th>
            <th>Expenses</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="category-body-${index}"></tbody>
      </table>
    `;
    monthlyBody.appendChild(categoryRow);
    updateCategoryTable(index);
  });
  
  updateAverages();
}

function updateCategoryTable(monthIndex) {
  const business = businesses[currentBusinessIndex];
  const month = business.incomeStatement.months[monthIndex];
  const categoryBody = document.getElementById(`category-body-${monthIndex}`);
  categoryBody.innerHTML = '';
  
  month.categories.forEach((category, catIndex) => {
    const row = document.createElement('tr');
    row.classList.add('expandable');
    row.innerHTML = `
      <td>${category.name}</td>
      <td>${business.currency} ${category.totalIncome}</td>
      <td>${business.currency} ${category.totalExpenses}</td>
      <td>
        <button onclick="deleteCategory(${monthIndex}, ${catIndex})">🗑️</button>
      </td>
    `;
    categoryBody.appendChild(row);
    
    const dailyRow = document.createElement('tr');
    dailyRow.classList.add('nested');
    const dailyCell = document.createElement('td');
    dailyCell.colSpan = 4;
    dailyCell.innerHTML = `
      <table class="daily-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="daily-body-${monthIndex}-${catIndex}"></tbody>
      </table>
    `;
    categoryBody.appendChild(dailyRow);
    updateDailyTable(monthIndex, catIndex);
  });
}

function updateDailyTable(monthIndex, catIndex) {
  const business = businesses[currentBusinessIndex];
  const category = business.incomeStatement.months[monthIndex].categories[catIndex];
  const dailyBody = document.getElementById(`daily-body-${monthIndex}-${catIndex}`);
  dailyBody.innerHTML = '';
  
  category.entries.forEach((entry, entryIndex) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${business.currency} ${entry.amount}</td>
      <td>
        <button onclick="deleteEntry(${monthIndex}, ${catIndex}, ${entryIndex})">🗑️</button>
      </td>
    `;
    dailyBody.appendChild(row);
  });
}

// Modal Functions
function showEntryModal(type) {
  document.getElementById('entryType').value = type;
  document.getElementById('entryModal').style.display = 'block';
  populateCategories();
}

function closeModal() {
  document.getElementById('entryModal').style.display = 'none';
}

function populateCategories() {
  const business = businesses[currentBusinessIndex];
  const select = document.getElementById('entryCategory');
  select.innerHTML = '';
  business.incomeStatement.categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    select.appendChild(option);
  });
}

function saveEntry() {
  const type = document.getElementById('entryType').value;
  const amount = parseFloat(document.getElementById('entryAmount').value);
  const description = document.getElementById('entryDescription').value;
  const category = document.getElementById('newCategory').value || document.getElementById('entryCategory').value;
  
  if (!category || !amount || !description) {
    alert('Please fill all fields');
    return;
  }
  
  const business = businesses[currentBusinessIndex];
  const date = new Date();
  const month = getCurrentMonth();
  
  if (!business.incomeStatement.categories.some(c => c.name === category)) {
    business.incomeStatement.categories.push({
      name: category,
      type: type
    });
  }
  
  addMonthIfNew(month);
  
  const monthIndex = business.incomeStatement.months.findIndex(m => m.month === month);
  let categoryIndex = business.incomeStatement.months[monthIndex].categories.findIndex(c => c.name === category);
  
  if (categoryIndex === -1) {
    business.incomeStatement.months[monthIndex].categories.push({
      name: category,
      totalIncome: 0,
      totalExpenses: 0,
      entries: []
    });
    categoryIndex = business.incomeStatement.months[monthIndex].categories.length - 1;
  }
  
  const entry = {
    date: date.toISOString().split('T')[0],
    description,
    amount,
    type
  };
  
  business.incomeStatement.months[monthIndex].categories[categoryIndex].entries.push(entry);
  
  if (type === 'income') {
    business.incomeStatement.months[monthIndex].totalIncome += amount;
    business.incomeStatement.months[monthIndex].categories[categoryIndex].totalIncome += amount;
  } else {
    business.incomeStatement.months[monthIndex].totalExpenses += amount;
    business.incomeStatement.months[monthIndex].categories[categoryIndex].totalExpenses += amount;
  }
  
  updateMonthlyTable();
  closeModal();
  saveDataToLocalStorage();
}

// Balance Sheet Functions
function addAsset() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: "Asset", amount });
    updateBalanceSheet();
    updateAverages();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

function addLiability() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: "Liability", amount });
    updateBalanceSheet();
    updateAverages();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

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

// Financial Health Calculations
function updateAverages() {
  const business = businesses[currentBusinessIndex];
  const months = business.incomeStatement.months;
  const totalMonths = months.length || 1;
  
  const avgIncome = months.reduce((sum, m) => sum + m.totalIncome, 0) / totalMonths;
  const avgExpenses = months.reduce((sum, m) => sum + m.totalExpenses, 0) / totalMonths;
  const avgCashflow = avgIncome - avgExpenses;
  
  document.getElementById('average-income').textContent = `${business.currency} ${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `${business.currency} ${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `${business.currency} ${avgCashflow.toFixed(2)}`;
  
  const healthScore = Math.round((avgCashflow / business.revenueTarget) * 100);
  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.update();
  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
}

// Data Management
function saveDataToLocalStorage() {
  localStorage.setItem("businesses", JSON.stringify(businesses));
}

function loadSavedData() {
  const savedData = localStorage.getItem("businesses");
  if (savedData) {
    businesses = JSON.parse(savedData);
    updateBusinessList();
    switchBusiness(0);
  }
}

// Other existing functions (currency converter, sharing, calculator, etc.)
// ... [Remaining functions from original script.js remain unchanged]

// Initialize event listeners
document.addEventListener('click', function(e) {
  if (e.target.closest('.expandable')) {
    const nested = e.target.closest('tr').nextElementSibling;
    nested.style.display = nested.style.display === 'none' ? 'table-row' : 'none';
  }
});

document.addEventListener('DOMContentLoaded', function() {
  var switchLink = document.getElementById('switchLink');
  if (switchLink) {
    switchLink.addEventListener('click', function() {
      window.location.href = 'https://gap-tools.github.io/GAP-Financial-Tracker/';
    });
  }
});
