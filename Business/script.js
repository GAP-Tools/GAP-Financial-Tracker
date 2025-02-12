// Initialize variables
let businesses = []; // Array to store multiple businesses
let currentBusinessIndex = 0; // Index of the currently selected business
let currencyRates = {}; // Currency conversion rates

// DOM Elements
const businessList = document.getElementById("businessList");
const businessNameInput = document.getElementById("businessName");
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

// Date Utilities
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getMonthYear(dateString) {
  const date = new Date(dateString);
  return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
}

// Add Business
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (name) {
    const newBusiness = {
      name,
      currency: "USD",
      residualTarget: 0,
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
  updateIncomeStatement();
  updateBalanceSheet();
  updateFinancialHealth();
}

// Add Monthly Entry
function addMonthlyEntry() {
  const business = businesses[currentBusinessIndex];
  const monthYear = prompt("Enter month and year (MM/YYYY):");
  if (monthYear) {
    business.incomeStatement[monthYear] = { categories: [], collapsed: true };
    updateIncomeStatement();
    saveDataToLocalStorage();
  }
}

// Add Category
function addCategory(monthYear) {
  const business = businesses[currentBusinessIndex];
  const description = prompt("Enter category name:");
  if (description) {
    business.incomeStatement[monthYear].categories.push({
      description,
      entries: [],
      collapsed: true,
    });
    updateIncomeStatement();
    saveDataToLocalStorage();
  }
}

// Add Daily Entry
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
      amount,
    });
    updateIncomeStatement();
    saveDataToLocalStorage();
  }
}

// Update Income Statement
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

// Update Averages
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

// Update Financial Health
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

// Initial Load
loadSavedData();
