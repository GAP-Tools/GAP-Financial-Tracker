// Initialize variables
let businesses = []; // Array to store multiple businesses
let currentBusinessIndex = 0; // Index of the currently selected business
let currencyRates = {}; // Currency exchange rate data
let localStorageBackup = 0;

const monthsData = {};

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
const saveFileNameInput = document.getElementById("saveFileName");
const calculatorPopup = document.getElementById("calculatorPopup");
const calculatorInput = document.getElementById("calculatorInput");

// Chart Initialization
let healthChart = new Chart(healthChartCtx, {
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
async function fetchCurrencyRates() {
  const apiUrl = "https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD";
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.result === "success") {
      currencyRates = data.conversion_rates;
      populateCurrencyDropdowns();
      if (businesses.length > 0) loadSavedData();
    }
  } catch (error) {
    console.error("Error fetching currency rates:", error);
  }
}

fetchCurrencyRates();

// Populate Currency Dropdowns
function populateCurrencyDropdowns() {
  for (const currency in currencyRates) {
    const newOption = document.createElement("option");
    newOption.value = currency;
    newOption.text = `${currency} (${getCurrencySymbol(currency)})`;
    fromCurrency.add(newOption);
    toCurrency.add(newOption);
    currencySelect.add(newOption);
  }
}

// Get Currency Symbol
function getCurrencySymbol(currency) {
  const symbols = {
    USD: "$", EUR: "€", GBP: "£", NGN: "₦", JPY: "¥", INR: "₹", AUD: "A$", CAD: "C$",
    CHF: "CHF", CNY: "¥", // Add more symbols as needed
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
      currencyList: [],
      revenueTarget: 0,
      incomeStatement: {
        months: [],
        categories: [],
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

// Update Business List
function updateBusinessList() {
  businessList.innerHTML = "";
  businesses.forEach((business, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.text = business.name;
    businessList.add(option);
  });
}

// Switch Business
function switchBusiness() {
  currentBusinessIndex = +businessList.value;
  const business = businesses[currentBusinessIndex];
  businessDescriptionInput.value = business.description;
  currencySelect.value = business.currency;
  revenueTargetInput.value = business.revenueTarget;
  updateMonthlyTable();
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
document.addEventListener('DOMContentLoaded', () => {
  const switchLink = document.getElementById('switchLink');
  switchLink.addEventListener('click', () => {
    window.location.href = "https://gap-tools.github.io/GAP-Financial-Tracker/";
  });
});

// Edit Revenue Target
function editRevenueTarget() {
  const business = businesses[currentBusinessIndex];
  const newTarget = prompt("Enter New Revenue/Residual Income Target:", business.revenueTarget);
  if (newTarget && !isNaN(newTarget)) {
    business.revenueTarget = parseFloat(newTarget);
    saveBusinessProfile();
    updateFinancialHealth();
  } else {
    alert("Invalid Input!");
  }
}

// Edit Business Name
function editBusinessName() {
  const currentBusiness = businesses[currentBusinessIndex];
  const newName = prompt("Enter New Business Name:", currentBusiness.name);
  if (newName && newName.trim()) {
    currentBusiness.name = newName.trim();
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
      clearAllData();
    }
    updateBusinessList();
    saveDataToLocalStorage();
    alert("Business Deleted!");
  }
}

// Add Balance Sheet Entry
function addBalanceSheetEntry(type) {
  const business = businesses[currentBusinessIndex];
  const date = new Date().toISOString().split("T")[0];
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Amount:"));

  if (date && description && amount) {
    business.balanceSheet.push({ date, description, amount, type });
    updateBalanceSheet();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
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
      <td>${entry.type === "asset" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "liability" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editBalanceSheetEntry(${index})">✏️</button>
        <button onclick="duplicateBalanceSheetEntry(${index})">♻️</button>
        <button onclick="deleteBalanceSheetEntry(${index})">🗑️</button>
      </td>
    `;
    balanceSheetBody.appendChild(row);

    if (entry.type === "asset") totalAssetsAmount += entry.amount;
    if (entry.type === "liability") totalLiabilitiesAmount += entry.amount;
  });

  totalAssets.textContent = `${business.currency} ${totalAssetsAmount}`;
  totalLiabilities.textContent = `${business.currency} ${totalLiabilitiesAmount}`;
  netWorthDisplay.textContent = `${business.currency} ${totalAssetsAmount - totalLiabilitiesAmount}`;
}

// Edit Balance Sheet Entry
function editBalanceSheetEntry(index) {
  const business = businesses[currentBusinessIndex];
  const entry = business.balanceSheet[index];
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  if (!isNaN(newAmount)) {
    entry.amount = newAmount;
    updateBalanceSheet();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Duplicate Balance Sheet Entry
function duplicateBalanceSheetEntry(index) {
  const business = businesses[currentBusinessIndex];
  const entryToDuplicate = business.balanceSheet[index];
  const newEntry = { ...entryToDuplicate };
  newEntry.date = entryToDuplicate.date.split("-").map((part, idx) => part + (idx === 2 ? 1 : 0)).join("-");
  business.balanceSheet.push(newEntry);
  updateBalanceSheet();
  saveDataToLocalStorage();
}

// Delete Balance Sheet Entry
function deleteBalanceSheetEntry(index) {
  if (confirm("Are you sure you want to delete this entry?")) {
    const business = businesses[currentBusinessIndex];
    business.balanceSheet.splice(index, 1);
    updateBalanceSheet();
    saveDataToLocalStorage();
  }
}

// Show Entry Modal
function showEntryModal(type) {
  document.getElementById('entryModal').style.display = 'block';
  document.getElementById('entryType').value = type;
  populateCategories();
  document.getElementById('newCategory').value = '';
  document.getElementById('entryAmount').value = '';
  document.getElementById('entryDescription').value = '';
}

// Close Modal
function closeModal() {
  document.getElementById('entryModal').style.display = 'none';
}

// Populate Categories in Entry Modal
function populateCategories() {
  const business = businesses[currentBusinessIndex];
  const categorySelect = document.getElementById('entryCategory');
  categorySelect.innerHTML = '<option value="">Select Category</option>';

  business.incomeStatement.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// Update Monthly Table
function updateMonthlyTable() {
  const business = businesses[currentBusinessIndex];
  const monthlyBody = document.getElementById('monthly-body');
  monthlyBody.innerHTML = '';

  (business.incomeStatement.months || []).forEach((monthData, monthIndex) => {
    const row = document.createElement('tr');
    row.classList.add('expandable');
    row.innerHTML = `
      <td class="editable-date" onclick="editDate('month', ${monthIndex})">${monthData.month}</td>
      <td>${business.currency} ${monthData.totalIncome}</td>
      <td>${business.currency} ${monthData.totalExpenses}</td>
      <td>${business.currency} ${monthData.totalIncome - monthData.totalExpenses}</td>
      <td>
        <button class="expand-button" onclick="expandCollapseRow(this.parentElement.parentElement)">
          <svg class="expand-icon" viewBox="0 0 24 24">
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
          </svg>
        </button>
      </td>
    `;
    monthlyBody.appendChild(row);

    const categoryContainer = document.createElement('tr');
    categoryContainer.classList.add('nested');
    categoryContainer.innerHTML = `
      <td colspan="5">
        <table class="category-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="category-body-${monthIndex}"></tbody>
        </table>
      </td>
    `;
    monthlyBody.appendChild(categoryContainer);

    (monthData.categories || []).forEach((category, catIndex) => {
      const categoryRow = document.createElement('tr');
      categoryRow.classList.add('expandable');
      categoryRow.innerHTML = `
        <td class="editable-date" onclick="editCategoryName(${monthIndex}, ${catIndex})">${category.name}</td>
        <td>${business.currency} ${category.totalIncome}</td>
        <td>${business.currency} ${category.totalExpenses}</td>
        <td>
          <button class="expand-button" onclick="expandCollapseRow(this.parentElement.parentElement)">
            <svg class="expand-icon" viewBox="0 0 24 24">
              <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
            </svg>
          </button>
          <button onclick="editCategoryName(${monthIndex}, ${catIndex})">✎</button>
          <button onclick="duplicateCategory(${monthIndex}, ${catIndex})">♻️</button>
          <button onclick="deleteCategory(${monthIndex}, ${catIndex})">🗑️</button>
        </td>
      `;
      document.getElementById(`category-body-${monthIndex}`).appendChild(categoryRow);

      const dailyContainer = document.createElement('tr');
      dailyContainer.classList.add('nested');
      dailyContainer.innerHTML = `
        <td colspan="4">
          <table class="daily-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="daily-body-${monthIndex}-${catIndex}"></tbody>
          </table>
        </td>
      `;
      document.getElementById(`category-body-${monthIndex}`).appendChild(dailyContainer);

      (category.entries || []).forEach((entry, entryIndex) => {
        const dailyRow = document.createElement('tr');
        dailyRow.innerHTML = `
          <td class="editable-date" onclick="editEntryDate(${monthIndex}, ${catIndex}, ${entryIndex})">
            ${entry.date}
          </td>
          <td>${entry.description}</td>
          <td>${business.currency} ${entry.amount}</td>
          <td>${entry.type === 'income' ? 'Income' : 'Expense'}</td>
          <td>
            <button onclick="editEntry(${monthIndex}, ${catIndex}, ${entryIndex})">✎</button>
            <button onclick="duplicateEntry(${monthIndex}, ${catIndex}, ${entryIndex})">♻️</button>
            <button onclick="deleteEntry(${monthIndex}, ${catIndex}, ${entryIndex})">🗑️</button>
          </td>
        `;
        document.getElementById(`daily-body-${monthIndex}-${catIndex}`).appendChild(dailyRow);
      });
    });
  });

  updateAverages();
}

// Expand/Collapse Row
function expandCollapseRow(rowElement) {
  rowElement.classList.toggle('expanded');
  const nextRow = rowElement.nextElementSibling;
  if (nextRow?.classList.contains('nested')) {
    nextRow.style.display = nextRow.style.display === 'table-row' ? 'none' : 'table-row';
  }
}

// Save New Entry
function saveEntry() {
  const type = document.getElementById('entryType').value;
  const amount = parseFloat(document.getElementById('entryAmount').value);
  const description = document.getElementById('entryDescription').value.trim();
  const category = document.getElementById('entryCategory').value || document.getElementById('newCategory').value.trim();

  if (!category || isNaN(amount) || amount <= 0 || !description) {
    alert('Please fill all fields correctly');
    return;
  }

  const business = businesses[currentBusinessIndex];
  const currentMonth = getCurrentMonth();
  let monthObject;
  let categoryObject;

  // Create or Update Month
  if (!business.incomeStatement.months.some(m => m.month === currentMonth)) {
    business.incomeStatement.months.push({
      month: currentMonth,
      categories: [],
      totalIncome: 0,
      totalExpenses: 0,
    });
  }

  monthObject = business.incomeStatement.months.find(m => m.month === currentMonth);

  // Create or Update Category
  if (!monthObject.categories.some(cat => cat.name === category)) {
    monthObject.categories.push({
      name: category,
      totalIncome: 0,
      totalExpenses: 0,
      entries: [],
    });
  }

  categoryObject = monthObject.categories.find(cat => cat.name === category);

  // Create New Entry
  categoryObject.entries.push({
    date: new Date().toISOString().split("T")[0],
    description,
    amount,
    type: type,
  });

  // Update Totals
  if (type === 'income') {
    categoryObject.totalIncome += amount;
    monthObject.totalIncome += amount;
  } else if (type === 'expense') {
    categoryObject.totalExpenses += amount;
    monthObject.totalExpenses += amount;
  }

  updateMonthlyTable();
  closeModal();
  saveDataToLocalStorage();
}

// Generate Current Month
function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

// Additional Data Management Functions
function exportBusinessData() {
  const business = businesses[currentBusinessIndex];
  const fileName = saveFileNameInput.value.trim() || business.name;
  const data = JSON.stringify(business);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
}

function importBusinessData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      businesses.push(data);
      updateBusinessList();
      switchBusiness(businesses.length - 1);
      saveDataToLocalStorage();
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearBusinessData() {
  if (confirm("Are you sure you want to clear this business's data?")) {
    businesses[currentBusinessIndex] = {
      name: businesses[currentBusinessIndex].name,
      description: "",
      currency: "USD",
      revenueTarget: 0,
      incomeStatement: {
        months: [],
        categories: [],
      },
      balanceSheet: [],
    };
    updateMonthlyTable();
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  }
}

// Data Storage
function saveDataToLocalStorage() {
  localStorage.setItem("financialTrackerData", JSON.stringify(businesses));
}

function loadSavedData() {
  const savedData = JSON.parse(localStorage.getItem("financialTrackerData"));
  businesses = savedData || [];
  updateBusinessList();
  if (businesses.length > 0) switchBusiness(0);
}

// UI Event Handlers
document.addEventListener('click', (e) => {
  const target = e.target;
  if (target.classList.contains('expand-button')) {
    expandCollapseRow(target.parentElement.parentElement);
  }
});

// Share Functions
function shareOnWhatsApp() {
  const appUrl = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check out this app ${appUrl}`);
}

function shareOnFacebook() {
  const appUrl = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${appUrl}`);
}

function shareOnTwitter() {
  const appUrl = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?url=${appUrl}&text=Check out this app`);
}

function openAppDownload() {
  window.open("https://www.appcreator24.com/app3480869-q98157", "_blank");
}

// Calculator Functions
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

function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === "block" ? "none" : "block";
}

// Financial Health Calculations
function updateAverages() {
  const business = businesses[currentBusinessIndex];
  const months = business.incomeStatement.months || [];
  
  const totalMonths = months.length || 1;
  const avgIncome = months.reduce((sum, m) => sum + m.totalIncome, 0) / totalMonths;
  const avgExpenses = months.reduce((sum, m) => sum + m.totalExpenses, 0) / totalMonths;
  const avgCashflow = avgIncome - avgExpenses;

  document.getElementById('average-income').textContent = `${business.currency} ${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `${business.currency} ${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `${business.currency} ${avgCashflow.toFixed(2)}`;

  updateFinancialHealth();
}

function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const avgCashflow = parseFloat(document.getElementById('average-cashflow').textContent.replace(business.currency, '').trim());
  const healthScore = Math.round((avgCashflow / business.revenueTarget) * 100);

  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();

  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, avgCashflow, business.revenueTarget);
}

function getHealthColor(score) {
  return score <= 39 ? "#ff6384" : score <= 59 ? "#ffcd56" : score <= 79 ? "#4bc0c0" : "#36a2eb";
}

function generateHealthTip(score, cashflow, target) {
  const tips = {
    low: [
      "Your expenses are higher than your income. Consider cutting down on unnecessary spending.",
      "Focus on reducing liabilities and increasing assets to improve your financial health."
    ],
    moderate: [
      "Your financial health is improving. Try to reduce your liabilities to improve your net worth.",
      "Your savings rate is low. Consider increasing your income or reducing expenses."
    ],
    good: [
      "Great job! Your income is higher than your expenses. Keep building your assets.",
      "You're on the right track. Consider investing in assets to generate passive income."
    ],
    excellent: [
      "Excellent! Your financial health is in great shape. Keep up the good work!",
      "You're doing amazing! Consider diversifying your investments to further grow your wealth."
    ]
  };

  const section = score <= 39 ? 'low' : score <= 59 ? 'moderate' : score <= 79 ? 'good' : 'excellent';
  const extraTips = [];
  
  if (cashflow < target) {
    extraTips.push("Your cashflow is below your revenue target. Focus on increasing income or reducing expenses.");
  } else {
    extraTips.push("Your cashflow exceeds your revenue target. Keep up the good work!");
  }

  return `${tips[section][Math.floor(Math.random() * tips[section].length)]} ${extraTips.join(" ")}`;
}

// Generate Business Financial Story
function generateBusinessStory() {
  const business = businesses[currentBusinessIndex];
  const totalAssets = parseFloat(document.getElementById("total-assets").textContent.replace(business.currency, "").trim());
  const totalLiabilities = parseFloat(document.getElementById("total-liabilities").textContent.replace(business.currency, "").trim());
  const avgCashflow = parseFloat(document.getElementById("average-cashflow").textContent.replace(business.currency, "").trim());
  const avgIncome = parseFloat(document.getElementById("average-income").textContent.replace(business.currency, "").trim());
  const avgExpenses = parseFloat(document.getElementById("average-expenses").textContent.replace(business.currency, "").trim());

  const story = `
    ${business.name} is a thriving ${business.description} business. 
    Their average monthly income stands at ${business.currency} ${avgIncome}, 
    with average expenses totaling ${business.currency} ${avgExpenses}. This results in a monthly net profit of ${business.currency} ${avgCashflow}. 
    The business owns assets worth ${business.currency} ${totalAssets}, 
    and maintains a manageable level of liabilities at ${business.currency} ${totalLiabilities}, 
    leading to a robust net worth of ${business.currency} ${totalAssets - totalLiabilities}.
    Financial tip: ${generateHealthTip(healthChart.data.datasets[0].data[0], avgCashflow, business.revenueTarget)}
    `;

  businessFinancialStory.textContent = story;
}

// Currency Converter
function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (!isNaN(amount) && from && to) {
    const convertedAmount = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
  }
}

// Edit Functions
function editDate(tableType, index) {
  const business = businesses[currentBusinessIndex];
  if (tableType === 'month') {
    const oldDate = business.incomeStatement.months[index].month;
    const newDate = prompt("Enter New Date (YYYY-MM):", oldDate);
    if (newDate) {
      business.incomeStatement.months[index].month = newDate;
      updateMonthlyTable();
      saveDataToLocalStorage();
    }
  } else if (tableType === 'entry') {
    // Handle entry date edit if needed
  }
}

function editCategoryName(monthIndex, catIndex) {
  const business = businesses[currentBusinessIndex];
  const newName = prompt("Edit Category Name:", business.incomeStatement.months[monthIndex].categories[catIndex].name);
  if (newName && newName.trim()) {
    business.incomeStatement.months[monthIndex].categories[catIndex].name = newName.trim();
    populateCategories();
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

function editEntry(monthIndex, catIndex, entryIndex) {
  const business = businesses[currentBusinessIndex];
  const entry = business.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  const newDescription = prompt("Edit Description:", entry.description);

  if (!isNaN(newAmount) && newDescription) {
    entry.amount = newAmount;
    entry.description = newDescription;
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

function duplicateCategory(monthIndex, catIndex) {
  const business = businesses[currentBusinessIndex];
  const categoryToDuplicate = business.incomeStatement.months[monthIndex].categories[catIndex];
  const newCategory = { ...categoryToDuplicate };
  newCategory.name += " - Copy";
  newCategory.totalIncome = 0;
  newCategory.totalExpenses = 0;
  newCategory.entries = [];
  business.incomeStatement.months[monthIndex].categories.push(newCategory);
  populateCategories();
  updateMonthlyTable();
}

function deleteCategory(monthIndex, catIndex) {
  if (confirm("Are you sure you want to delete this category?")) {
    const business = businesses[currentBusinessIndex];
    business.incomeStatement.months[monthIndex].categories.splice(catIndex, 1);
    populateCategories();
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

function duplicateEntry(monthIndex, catIndex, entryIndex) {
  const business = businesses[currentBusinessIndex];
  const entryToDuplicate = business.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
  const newEntry = { ...entryToDuplicate };
  newEntry.date = new Date(entryToDuplicate.date).toLocaleDateString();
  newEntry.amount = 0; // Reset amount for copy
  business.incomeStatement.months[monthIndex].categories[catIndex].entries.push(newEntry);
  updateMonthlyTable();
}

function deleteEntry(monthIndex, catIndex, entryIndex) {
  if (confirm("Are you sure you want to delete this entry?")) {
    const business = businesses[currentBusinessIndex];
    business.incomeStatement.months[monthIndex].categories[catIndex].entries.splice(entryIndex, 1);
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Financial Health Event Listeners
healthChart.canvas.addEventListener('mousemove', function (event) {
  const tooltip = this.tooltip;
  if (tooltip) {
    const position = Chart.helpers.getRelativePosition(event, this);
    tooltip.update(true, position);
    tooltip.draw();
  }
});

// Browser Back Button and Refresh Handling
window.onbeforeunload = function () {
  confirm("Are you sure you want to leave? Changes might be lost.");
};

function checkBackupTimer() {
  const lastBackup = localStorage.getItem("lastBackup");
  if (lastBackup) {
    const now = Date.now();
    const timeSinceBackup = now - lastBackup;
    if (timeSinceBackup >= 24 * 60 * 60 * 1000) {
      backupData();
    }
  } else {
    backupData();
  }
}

setInterval(checkBackupTimer, 1000);

function backupData() {
  const backup = JSON.stringify(businesses);
  localStorage.setItem("financialTrackerBackup", backup);
  localStorage.setItem("lastBackup", Date.now());
  localStorageBackup++;
}

function restoreData() {
  const backup = JSON.parse(localStorage.getItem("financialTrackerBackup"));
  if (backup) {
    if (confirm("A backup was found. Do you want to restore it?")) {
      businesses = backup;
      updateBusinessList();
      loadSavedData();
      alert("Data restored from backup!");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  restoreData();
});

// Add AI Tip of the Day
function aiFinancialTip() {
  const tips = [
    "Invest in yourself - education is the best asset.",
    "Save 20% of your income for future goals.",
    "Automate your savings for peace of mind.",
    "Diversify your investments to manage risk."
  ];

  return tips[Math.floor(Math.random() * tips.length)];
}

document.getElementById("healthTips").innerHTML += `<br>Tip of the Day: ${aiFinancialTip()}`;

// Add dateFormat function
function dateFormat(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Add cancel button functionality
document.getElementById("cancelButton").onclick = () => {
  document.getElementById("newCategory").value = "";
};
