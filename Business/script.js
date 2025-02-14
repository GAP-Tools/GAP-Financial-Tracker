document.addEventListener('DOMContentLoaded', () => {
  const currencyData = fetchCurrencyData();
  setupCurrencyDropdowns(currencyData);
  loadSavedData();
});

// Data Structures
let businesses = [];
let currentBusinessIndex = 0;
let currentCategory = "";
let currentType = "";
const categories = { income: [], expenses: [] };

// DOM Elements
const businessNameInput = document.getElementById("businessName");
const businessList = document.getElementById("businessList");
const incomeBody = document.getElementById("incomeBody");
const balanceBody = document.getElementById("balanceBody");
const entryModal = document.getElementById("entryModal");
const modalTitle = document.getElementById("modalTitle");
const entryForm = document.getElementById("entryForm");
const entryCategory = document.getElementById("entryCategory");
const currencySelect = document.getElementById("businessCurrency");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");

// Helper Functions
function fetchCurrencyData() {
  return fetch("https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD")
    .then(response => response.json())
    .then(data => data.conversion_rates);
}

function setupCurrencyDropdowns(currencies) {
  for (const code in currencies) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${code} (${getCurrencySymbol(code)})`;
    currencySelect.appendChild(option);
  }
}

function getCurrencySymbol(currency) {
  return {
    USD: "$",
    EUR: "€",
    GBP: "£",
    NGN: "₦",
    JPY: "¥",
  }[currency];
}

// Business Management
function addBusiness() {
  const name = businessNameInput.value.trim();
  if (name) {
    businesses.push({
      name,
      description: "",
      currency: currencySelect.value,
      incomeStatement: [],
      balanceSheet: []
    });
    saveDataToLocalStorage();
    switchBusiness(businesses.length - 1);
    businessNameInput.value = "";
  }
}

function updateBusinessList() {
  businessList.innerHTML = businesses.map((business, index) => 
    `<option value="${index}">${business.name}</option>`
  ).join('');
}

function switchBusiness(index) {
  currentBusinessIndex = index;
  const business = businesses[currentBusinessIndex];
  document.getElementById("businessDescription").value = business.description;
  currencySelect.value = business.currency;
  updateIncomeStatement();
  updateBalanceSheet();
}

function editBusinessName() {
  const newName = prompt("Enter new business name:", businesses[currentBusinessIndex].name);
  businesses[currentBusinessIndex].name = newName;
  saveDataToLocalStorage();
  updateBusinessList();
}

function deleteBusiness() {
  const confirmDelete = confirm("Confirm deletion of this business?");
  if (confirmDelete) {
    businesses.splice(currentBusinessIndex, 1);
    saveDataToLocalStorage();
    updateBusinessList();
  }
}

// Income/Expense Management
function showEntryModal(type) {
  currentType = type;
  modalTitle.textContent = `Add ${type}`;
  populateCategories(type);
  entryModal.style.display = "block";
}

function populateCategories(type) {
  entryCategory.innerHTML = "<option value=''>Select Category</option>";
  categories[type].forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    entryCategory.appendChild(option);
  });
}

function addCategory(category, type) {
  if (!categories[type].includes(category)) {
    categories[type].push(category);
    populateCategories(type);
  }
}

function addFinancialEntry() {
  const date = new Date(entryForm.elements["entryDate"].value).toLocaleDateString();
  const description = entryForm.elements["entryDescription"].value;
  const category = entryForm.elements["entryCategory"].value;
  const amount = parseFloat(entryForm.elements["entryAmount"].value);
  
  if (description && amount) {
    const business = businesses[currentBusinessIndex];
    business.incomeStatement.push({
      type: currentType,
      date,
      description,
      category,
      amount
    });
    addCategory(category, currentType);
    updateIncomeStatement();
    entryForm.reset();
    entryModal.style.display = "none";
  }
}

// Balance Sheet
function addAsset() {
  const business = businesses[currentBusinessIndex];
  const asset = {
    date: new Date().toLocaleDateString(),
    description: prompt("Asset Description:"),
    value: parseFloat(prompt("Asset Value:"))
  };
  business.balanceSheet.push(asset);
  updateBalanceSheet();
}

function addLiability() {
  const business = businesses[currentBusinessIndex];
  const liability = {
    date: new Date().toLocaleDateString(),
    description: prompt("Liability Description:"),
    value: parseFloat(prompt("Liability Value:"))
  };
  business.balanceSheet.push(liability);
  updateBalanceSheet();
}

// Data Tables
function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];
  incomeBody.innerHTML = "";
  
  const monthlyTotals = {};
  business.incomeStatement.forEach(entry => {
    const month = entry.date.split('/').slice(0, 2).join('/');
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = { income: 0, expenses: 0 };
    }
    if (entry.type === "income") {
      monthlyTotals[month].income += entry.amount;
    } else {
      monthlyTotals[month].expenses += entry.amount;
    }
  });

  Object.entries(monthlyTotals).forEach(([month, { income, expenses }]) => {
    const avgCashflow = (income - expenses) / business.incomeStatement.length;
    incomeBody.innerHTML += `
      <tr>
        <td>${month}</td>
        <td>${income}</td>
        <td>${expenses}</td>
        <td>${avgCashflow}</td>
      </tr>
    `;
  });
}

function updateBalanceSheet() {
  const business = businesses[currentBusinessIndex];
  balanceBody.innerHTML = "";
  
  const assets = business.balanceSheet.filter(item => item.type === "asset");
  const liabilities = business.balanceSheet.filter(item => item.type === "liability");
  
  assets.forEach(asset => {
    balanceBody.innerHTML += `
      <tr>
        <td>${asset.date}</td>
        <td>${asset.description}</td>
        <td>${asset.value}</td>
        <td></td>
      </tr>
    `;
  });
  
  liabilities.forEach(liability => {
    balanceBody.innerHTML += `
      <tr>
        <td>${liability.date}</td>
        <td>${liability.description}</td>
        <td></td>
        <td>${liability.value}</td>
      </tr>
    `;
  });
}

// Financial Health
function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const cashflow = business.incomeStatement.reduce((sum, entry) => {
    return sum + (entry.type === "income" ? entry.amount : -entry.amount);
  }, 0);
  
  const revenueTarget = parseFloat(document.getElementById("revenue-target").value) || 1;
  const healthScore = (cashflow / revenueTarget) * 100;

  const healthChartData = {
    datasets: [{
      data: [healthScore, 100 - healthScore],
      backgroundColor: ['#27ae60', '#ecf0f1'],
      borderWidth: 0
    }]
  };

  new Chart(healthChartCtx, {
    type: 'doughnut',
    data: healthChartData,
    options: {
      cutout: '70%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      }
    }
  });

  document.getElementById("healthPercentage").textContent = `${healthScore.toFixed(2)}%`;
  document.getElementById("healthAdvice").textContent = generateHealthAdvice(healthScore);
}

function generateHealthAdvice(score) {
  if (score >= 80) return "Excellent financial health! Keep up the good work.";
  if (score >= 60) return "Stable financial health. Stay consistent.";
  if (score >= 40) return "Improve your income or reduce expenses.";
  return "Financial health in danger. Please take action.";
}

// Data Persistence
function saveDataToLocalStorage() {
  localStorage.setItem("gapFinanceTracker", JSON.stringify(businesses));
}

function loadSavedData() {
  const savedData = localStorage.getItem("gapFinanceTracker");
  if (savedData) {
    businesses = JSON.parse(savedData);
    updateBusinessList();
    switchBusiness(0);
  }
}

function exportBusinessData() {
  const business = businesses[currentBusinessIndex];
  const blob = new Blob([JSON.stringify(business)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${business.name}-data.json`;
  a.click();
}

function importBusinessData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      businesses.push(data);
      saveDataToLocalStorage();
    };
    reader.readAsText(file);
  };
  input.click();
}

// Event Listeners
document.getElementById("switchLink").addEventListener("click", () => {
  window.location.href = "https://gap-tools.github.io/GAP-Financial-Tracker/";
});

entryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addFinancialEntry();
});

document.querySelector(".close").addEventListener("click", () => {
  entryModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === entryModal) {
    entryModal.style.display = "none";
  }
});
