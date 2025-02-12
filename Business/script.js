let businesses = [];
let currentBusinessIndex = 0;

// DOM Elements
const businessList = document.getElementById("businessList");
const incomeStatementBody = document.getElementById("income-statement-body");
const balanceSheetBody = document.getElementById("balance-sheet-body");
const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const totalAssets = document.getElementById("total-assets");
const totalLiabilities = document.getElementById("total-liabilities");
const netWorthDisplay = document.getElementById("net-worth");
const cashflowDisplay = document.getElementById("cashflow");

// Modals
const addIncomeExpenseModal = document.getElementById("addIncomeExpenseModal");
const entryAmount = document.getElementById("entryAmount");

// Functions
function addBusiness() {
  const name = document.getElementById("businessName").value.trim();
  if (name) {
    businesses.push({
      name,
      incomeStatement: {},
      balanceSheet: [],
    });
    updateBusinessList();
    switchBusiness(businesses.length - 1);
    saveData();
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
  updateIncomeStatement();
  updateBalanceSheet();
}

function updateIncomeStatement() {
  const business = businesses[currentBusinessIndex];
  incomeStatementBody.innerHTML = "";
  let totalIncomeAmount = 0;
  let totalExpensesAmount = 0;

  Object.keys(business.incomeStatement).forEach((month) => {
    const monthlyData = business.incomeStatement[month];
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${month}</td>
      <td>${monthlyData.totals.income}</td>
      <td>${monthlyData.totals.expenses}</td>
      <td>${monthlyData.totals.income - monthlyData.totals.expenses}</td>
      <td class="actions">
        <button onclick="editEntry('${month}')">✏️</button>
        <button onclick="deleteEntry('${month}')">🗑️</button>
      </td>
    `;
    incomeStatementBody.appendChild(row);

    totalIncomeAmount += monthlyData.totals.income;
    totalExpensesAmount += monthlyData.totals.expenses;
  });

  totalIncome.textContent = totalIncomeAmount;
  totalExpenses.textContent = totalExpensesAmount;
  cashflowDisplay.textContent = totalIncomeAmount - totalExpensesAmount;
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
      <td>${entry.type === "Asset" ? entry.amount : ""}</td>
      <td>${entry.type === "Liability" ? entry.amount : ""}</td>
      <td class="actions">
        <button onclick="editBalanceSheetEntry(${index})">✏️</button>
        <button onclick="deleteBalanceSheetEntry(${index})">🗑️</button>
      </td>
    `;
    balanceSheetBody.appendChild(row);

    if (entry.type === "Asset") totalAssetsAmount += entry.amount;
    if (entry.type === "Liability") totalLiabilitiesAmount += entry.amount;
  });

  totalAssets.textContent = totalAssetsAmount;
  totalLiabilities.textContent = totalLiabilitiesAmount;
  netWorthDisplay.textContent = totalAssetsAmount - totalLiabilitiesAmount;
}

function saveData() {
  localStorage.setItem("businesses", JSON.stringify(businesses));
}

function loadData() {
  const savedData = localStorage.getItem("businesses");
  if (savedData) {
    businesses = JSON.parse(savedData);
    updateBusinessList();
    switchBusiness(0);
  }
}

// Keypad Functions
function appendToAmount(value) {
  entryAmount.value += value;
}

function clearAmount() {
  entryAmount.value = "";
}

// Modal Functions
function openAddIncomeExpenseModal(type) {
  document.getElementById("entryType").value = type;
  addIncomeExpenseModal.style.display = "block";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function submitIncomeExpense() {
  const type = document.getElementById("entryType").value;
  const description = document.getElementById("entryDescription").value;
  const amount = parseFloat(entryAmount.value);

  if (description && amount) {
    const business = businesses[currentBusinessIndex];
    const date = new Date().toISOString().slice(0, 10);
    const month = date.slice(0, 7);

    if (!business.incomeStatement[month]) {
      business.incomeStatement[month] = { totals: { income: 0, expenses: 0 }, categories: [] };
    }

    if (type === "Income") {
      business.incomeStatement[month].totals.income += amount;
    } else {
      business.incomeStatement[month].totals.expenses += amount;
    }

    updateIncomeStatement();
    saveData();
    closeModal("addIncomeExpenseModal");
  }
}

// Initial Load
loadData();
