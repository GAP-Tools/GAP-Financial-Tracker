// script.js
let businesses = [];
let currentBusinessIndex = 0;
let currencyRates = {};

// DOM Elements
const businessList = document.getElementById("businessList");
const businessNameInput = document.getElementById("businessName");
const incomeStatementBody = document.getElementById("income-statement-body");
const balanceSheetBody = document.getElementById("balance-sheet-body");
const totalAssets = document.getElementById("total-assets");
const totalLiabilities = document.getElementById("total-liabilities");
const netWorthDisplay = document.getElementById("net-worth");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");
const healthPercentage = document.getElementById("healthPercentage");
const healthTips = document.getElementById("healthTips");

// Initialize Chart
const healthChart = new Chart(healthChartCtx, {
  type: "doughnut",
  data: { labels: ["Health"], datasets: [{ data: [0], backgroundColor: ["#ff6384"] }] },
  options: { cutout: "70%", responsive: true, maintainAspectRatio: false }
});

// Date Utilities
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getMonthYear(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
}

// Business Management
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (name) {
    businesses.push({
      name,
      currency: "USD",
      residualTarget: 0,
      incomeStatement: {},
      balanceSheet: []
    });
    updateBusinessList();
    switchBusiness(businesses.length - 1);
    businessNameInput.value = "";
    saveData();
  }
}

function updateBusinessList() {
  businessList.innerHTML = businesses.map((b, i) => 
    `<option value="${i}">${b.name}</option>`
  ).join('');
}

function switchBusiness() {
  currentBusinessIndex = businessList.value;
  const business = businesses[currentBusinessIndex];
  updateIncomeStatement();
  updateBalanceSheet();
  updateFinancialHealth();
}

// Income Statement Functions
function addMonthlyEntry() {
  const business = businesses[currentBusinessIndex];
  const monthYear = prompt("Enter month and year (MM/YYYY):");
  if (monthYear) {
    business.incomeStatement[monthYear] = { categories: [], collapsed: true };
    updateIncomeStatement();
    saveData();
  }
}

function addCategory(monthYear) {
  const business = businesses[currentBusinessIndex];
  const description = prompt("Enter category name:");
  if (description) {
    business.incomeStatement[monthYear].categories.push({
      description,
      entries: [],
      collapsed: true
    });
    updateIncomeStatement();
    saveData();
  }
}

function addDailyEntry(monthYear, catIndex) {
  const business = businesses[currentBusinessIndex];
  const description = prompt("Enter transaction description:");
  const amount = parseFloat(prompt("Enter amount:"));
  const type = confirm("Is this income? (OK for Yes, Cancel for No)") ? "Income" : "Expense";
  
  if (description && amount) {
    business.incomeStatement[monthYear].categories[catIndex].entries.push({
      date: getCurrentDate(),
      description,
      type,
      amount
    });
    updateIncomeStatement();
    saveData();
  }
}

// Balance Sheet Functions
function addBalanceEntry() {
  const business = businesses[currentBusinessIndex];
  const description = prompt("Enter asset/liability description:");
  const amount = parseFloat(prompt("Enter amount:"));
  const type = confirm("Is this an asset? (OK for Yes, Cancel for No)") ? "Asset" : "Liability";
  
  if (description && amount) {
    business.balanceSheet.push({
      date: getCurrentDate(),
      description,
      type,
      amount
    });
    updateBalanceSheet();
    saveData();
  }
}

// Update Displays
function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];
  incomeStatementBody.innerHTML = "";
  
  Object.entries(business.incomeStatement).forEach(([monthYear, monthData]) => {
    const monthlyTotal = calculateMonthlyTotal(monthYear);
    
    incomeStatementBody.innerHTML += `
      <tr class="month-row ${monthData.collapsed ? 'collapsed' : ''}">
        <td>${monthYear}</td>
        <td>${business.currency} ${monthlyTotal.income}</td>
        <td>${business.currency} ${monthlyTotal.expenses}</td>
        <td>${business.currency} ${monthlyTotal.cashflow}</td>
        <td>
          <button onclick="toggleMonth('${monthYear}')">${monthData.collapsed ? '▶' : '▼'}</button>
          <div class="dropdown">
            <button onclick="showDropdown(event)">⚙️</button>
            <div class="dropdown-content">
              <button onclick="addCategory('${monthYear}')">Add Category</button>
              <button onclick="deleteMonth('${monthYear}')">Delete Month</button>
            </div>
          </div>
        </td>
      </tr>
    `;

    if (!monthData.collapsed) {
      monthData.categories.forEach((category, catIndex) => {
        const categoryTotal = calculateCategoryTotal(category);
        
        incomeStatementBody.innerHTML += `
          <tr class="category-row ${category.collapsed ? 'collapsed' : ''}">
            <td>${category.description}</td>
            <td>${business.currency} ${categoryTotal.income}</td>
            <td>${business.currency} ${categoryTotal.expenses}</td>
            <td>
              <button onclick="toggleCategory('${monthYear}', ${catIndex})">
                ${category.collapsed ? '▶' : '▼'}
              </button>
              <div class="dropdown">
                <button onclick="showDropdown(event)">⚙️</button>
                <div class="dropdown-content">
                  <button onclick="addDailyEntry('${monthYear}', ${catIndex})">Add Daily</button>
                  <button onclick="deleteCategory('${monthYear}', ${catIndex})">Delete</button>
                </div>
              </div>
            </td>
          </tr>
        `;

        if (!category.collapsed) {
          category.entries.forEach((entry, entryIndex) => {
            incomeStatementBody.innerHTML += `
              <tr class="entry-row">
                <td>${entry.date}</td>
                <td>${entry.description}</td>
                <td>${entry.type === 'Income' ? business.currency + ' ' + entry.amount : ''}</td>
                <td>${entry.type === 'Expense' ? business.currency + ' ' + entry.amount : ''}</td>
                <td>
                  <div class="dropdown">
                    <button onclick="showDropdown(event)">⚙️</button>
                    <div class="dropdown-content">
                      <button onclick="editEntry('${monthYear}', ${catIndex}, ${entryIndex})">Edit</button>
                      <button onclick="deleteEntry('${monthYear}', ${catIndex}, ${entryIndex})">Delete</button>
                    </div>
                  </div>
                </td>
              </tr>
            `;
          });
        }
      });
    }
  });
  
  updateAverages();
}

function updateBalanceSheet() {
  const business = businesses[currentBusinessIndex];
  balanceSheetBody.innerHTML = "";
  let totalAssetsAmount = 0;
  let totalLiabilitiesAmount = 0;

  business.balanceSheet.forEach(entry => {
    balanceSheetBody.innerHTML += `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.description}</td>
        <td>${entry.type === 'Asset' ? business.currency + ' ' + entry.amount : ''}</td>
        <td>${entry.type === 'Liability' ? business.currency + ' ' + entry.amount : ''}</td>
        <td>
          <div class="dropdown">
            <button onclick="showDropdown(event)">⚙️</button>
            <div class="dropdown-content">
              <button onclick="editBalanceEntry(${business.balanceSheet.indexOf(entry)})">Edit</button>
              <button onclick="deleteBalanceEntry(${business.balanceSheet.indexOf(entry)})">Delete</button>
            </div>
          </div>
        </td>
      </tr>
    `;

    if (entry.type === 'Asset') totalAssetsAmount += entry.amount;
    if (entry.type === 'Liability') totalLiabilitiesAmount += entry.amount;
  });

  totalAssets.textContent = `${business.currency} ${totalAssetsAmount}`;
  totalLiabilities.textContent = `${business.currency} ${totalLiabilitiesAmount}`;
  netWorthDisplay.textContent = `${business.currency} ${totalAssetsAmount - totalLiabilitiesAmount}`;
}

// Calculation Functions
function calculateMonthlyTotal(monthYear) {
  const categories = businesses[currentBusinessIndex].incomeStatement[monthYear].categories;
  return categories.reduce((acc, category) => {
    const catTotal = calculateCategoryTotal(category);
    acc.income += catTotal.income;
    acc.expenses += catTotal.expenses;
    acc.cashflow += catTotal.cashflow;
    return acc;
  }, { income: 0, expenses: 0, cashflow: 0 });
}

function calculateCategoryTotal(category) {
  return category.entries.reduce((acc, entry) => {
    if (entry.type === 'Income') acc.income += entry.amount;
    if (entry.type === 'Expense') acc.expenses += entry.amount;
    acc.cashflow = acc.income - acc.expenses;
    return acc;
  }, { income: 0, expenses: 0, cashflow: 0 });
}

function updateAverages() {
  const business = businesses[currentBusinessIndex];
  const months = Object.keys(business.incomeStatement);
  const monthlyTotals = months.map(month => calculateMonthlyTotal(month));
  
  const totalIncome = monthlyTotals.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyTotals.reduce((sum, m) => sum + m.expenses, 0);
  const avgIncome = months.length ? totalIncome / months.length : 0;
  const avgExpenses = months.length ? totalExpenses / months.length : 0;
  
  document.getElementById("avg-income").textContent = `${business.currency} ${avgIncome.toFixed(2)}`;
  document.getElementById("avg-expenses").textContent = `${business.currency} ${avgExpenses.toFixed(2)}`;
  document.getElementById("avg-cashflow").textContent = `${business.currency} ${(avgIncome - avgExpenses).toFixed(2)}`;
}

// Financial Health Calculation
function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const avgCashflow = parseFloat(document.getElementById("avg-cashflow").textContent.split(' ')[1]) || 0;
  const healthScore = business.residualTarget ? Math.min(Math.round((avgCashflow / business.residualTarget) * 100), 100) : 0;

  healthChart.data.datasets[0].data = [healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();
  healthPercentage.textContent = `${healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, avgCashflow, business.residualTarget);
}

// Helper Functions
function showDropdown(event) {
  event.stopPropagation();
  const dropdown = event.target.closest('.dropdown');
  dropdown.querySelector('.dropdown-content').classList.toggle('show');
}

window.onclick = function(event) {
  if (!event.target.matches('.dropdown button')) {
    document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
  }
}

function saveData() {
  localStorage.setItem("businesses", JSON.stringify(businesses));
}

function loadData() {
  const saved = localStorage.getItem("businesses");
  if (saved) businesses = JSON.parse(saved);
  updateBusinessList();
  switchBusiness(0);
}

// Initial Load
loadData();
