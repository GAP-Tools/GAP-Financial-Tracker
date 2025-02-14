let businesses = [];
let currentBusinessIndex = 0;
let categories = { income: [], expense: [] };

// DOM Elements
const businessList = document.getElementById("businessList");
const incomeBody = document.getElementById("monthlyBody");
const balanceBody = document.getElementById("balanceBody");
const entryModal = document.getElementById("entryModal");
const modalTitle = document.getElementById("modalTitle");
const entryForm = document.getElementById("entryForm");
const entryCategory = document.getElementById("entryCategory");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadSavedData();
  updateBusinessList();
  switchBusiness(0);
});

// Business Management
function addBusiness() {
  const name = document.getElementById("businessName").value.trim();
  if (name) {
    businesses.push({
      name,
      description: "",
      currency: "USD",
      incomeStatement: [],
      balanceSheet: [],
    });
    saveDataToLocalStorage();
    updateBusinessList();
    switchBusiness(businesses.length - 1);
  }
}

function updateBusinessList() {
  businessList.innerHTML = businesses.map((business, index) => 
    `<option value="${index}">${business.name}</option>`
  ).join("");
}

function switchBusiness(index) {
  currentBusinessIndex = index;
  updateIncomeStatement();
  updateBalanceSheet();
  updateFinancialHealth();
}

// Income/Expense Management
function showEntryModal(type) {
  modalTitle.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
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

function addFinancialEntry() {
  const date = document.getElementById("entryDate").value || new Date().toISOString().split("T")[0];
  const description = document.getElementById("entryDescription").value;
  const category = document.getElementById("entryCategory").value;
  const amount = parseFloat(document.getElementById("entryAmount").value);

  if (description && amount) {
    const business = businesses[currentBusinessIndex];
    business.incomeStatement.push({
      type: modalTitle.textContent.includes("Income") ? "income" : "expense",
      date,
      description,
      category,
      amount,
    });
    if (!categories[type].includes(category)) {
      categories[type].push(category);
    }
    updateIncomeStatement();
    entryModal.style.display = "none";
    saveDataToLocalStorage();
  }
}

// Update Tables
function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];
  incomeBody.innerHTML = "";

  const monthlyTotals = {};
  business.incomeStatement.forEach(entry => {
    const month = entry.date.slice(0, 7);
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
    const netIncome = income - expenses;
    incomeBody.innerHTML += `
      <tr>
        <td>${month}</td>
        <td>${income}</td>
        <td>${expenses}</td>
        <td>${netIncome}</td>
        <td>
          <button onclick="expandCategory('${month}')">Expand</button>
        </td>
      </tr>
    `;
  });
}

// Save/Load Data
function saveDataToLocalStorage() {
  localStorage.setItem("gapFinanceTracker", JSON.stringify(businesses));
}

function loadSavedData() {
  const savedData = localStorage.getItem("gapFinanceTracker");
  if (savedData) {
    businesses = JSON.parse(savedData);
  }
         }
