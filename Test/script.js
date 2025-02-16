// Initialize variables
let profile = {
  name: "",
  age: "",
  occupation: "",
  dream: "",
  currency: "USD",
  passiveIncomeTarget: 0,
  incomeStatement: {
    months: [],
  },
  balanceSheet: [],
  fundAllocations: {
    categories: [],
    totalPercentage: 0,
  },
};

let currencyRates = {};

// DOM Elements
const incomeStatementBody = document.getElementById("income-statement-body");
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
const financialStory = document.getElementById("financialStory");
const currencySelect = document.getElementById("currency");
const passiveIncomeTargetInput = document.getElementById("passive-income-target");
const cashflowDisplay = document.getElementById("cashflow");
const saveFileNameInput = document.getElementById("saveFileName");
const calculatorPopup = document.getElementById("calculatorPopup");
const calculatorInput = document.getElementById("calculatorInput");
const allocationModal = document.getElementById("allocationModal");
const entryCategorySelect = document.getElementById("entryCategory");

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
async function fetchCurrencyRates() {
  const apiUrl = "https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD";
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.result === "success") {
      currencyRates = data.conversion_rates;
      populateCurrencyDropdowns();
      loadSavedData();
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

// Switch to Business
document.addEventListener('DOMContentLoaded', function() {
  const switchLink = document.getElementById('switchLink');
  switchLink.addEventListener('click', function() {
    window.location.href = "https://gap-tools.github.io/GAP-Financial-Tracker/Business";
  });
});

// Save Profile
function saveProfile() {
  profile.name = document.getElementById("name").value;
  profile.age = document.getElementById("age").value;
  profile.occupation = document.getElementById("occupation").value;
  profile.dream = document.getElementById("dream").value;
  profile.currency = currencySelect.value;
  profile.passiveIncomeTarget = parseFloat(passiveIncomeTargetInput.value) || 0;
  alert("Profile Saved!");
  saveDataToLocalStorage();
}

// Edit Passive Income Target
function editPassiveIncomeTarget() {
  const newTarget = prompt("Enter New Passive Income Target:", profile.passiveIncomeTarget);
  if (newTarget && !isNaN(newTarget)) {
    profile.passiveIncomeTarget = parseFloat(newTarget);
    passiveIncomeTargetInput.value = profile.passiveIncomeTarget;
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
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
  const categorySelect = document.getElementById('entryCategory');
  categorySelect.innerHTML = '<option value="">Select Category</option>';

  profile.fundAllocations.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// Update Monthly Table
function updateMonthlyTable() {
  const monthlyBody = document.getElementById('monthly-body');
  monthlyBody.innerHTML = '';

  (profile.incomeStatement.months || []).forEach((monthData, monthIndex) => {
    const row = document.createElement('tr');
    row.classList.add('expandable');
    row.innerHTML = `
      <td class="editable-date" onclick="editDate('month', ${monthIndex})">${monthData.month}</td>
      <td>${profile.currency} ${monthData.totalIncome}</td>
      <td>${profile.currency} ${monthData.totalExpenses}</td>
      <td>${profile.currency} ${monthData.totalIncome - monthData.totalExpenses}</td>
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
        <td>${profile.currency} ${category.totalIncome}</td>
        <td>${profile.currency} ${category.totalExpenses}</td>
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
          <td class="editable-date" onclick="editEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">
            ${entry.date}
          </td>
          <td>${entry.description}</td>
          <td>${profile.currency} ${entry.amount}</td>
          <td>${entry.type === 'income' ? 'Income' : 'Expense'}</td>
          <td>
            <button onclick="editEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">✎</button>
            <button onclick="duplicateEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">♻️</button>
            <button onclick="deleteEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">🗑️</button>
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

// Save Entry
function saveEntry() {
  const type = document.getElementById('entryType').value;
  const amount = parseFloat(document.getElementById('entryAmount').value);
  const description = document.getElementById('entryDescription').value.trim();
  const category = document.getElementById('entryCategory').value;

  if (!category || isNaN(amount) || amount <= 0 || !description) {
    alert('Please fill all fields correctly');
    return;
  }

  const currentMonth = getCurrentMonth();
  let monthObject;
  let categoryObject;

  if (!profile.incomeStatement.months.some(m => m.month === currentMonth)) {
    profile.incomeStatement.months.push({
      month: currentMonth,
      categories: [],
      totalIncome: 0,
      totalExpenses: 0,
    });
  }

  monthObject = profile.incomeStatement.months.find(m => m.month === currentMonth);

  if (!monthObject.categories.some(cat => cat.name === category)) {
    monthObject.categories.push({
      name: category,
      totalIncome: 0,
      totalExpenses: 0,
      entries: [],
    });
  }

  categoryObject = monthObject.categories.find(cat => cat.name === category);

  if (type === 'income') {
    categoryObject.totalIncome += amount;
    monthObject.totalIncome += amount;
    categoryObject.entries.push({
      date: new Date().toISOString().split("T")[0],
      description: description,
      amount: amount,
      type: 'income',
    });
    allocateIncome(amount);
  } else if (type === 'expense') {
    categoryObject.totalExpenses += amount;
    monthObject.totalExpenses += amount;
    categoryObject.entries.push({
      date: new Date().toISOString().split("T")[0],
      description: description,
      amount: amount,
      type: 'expense',
    });
    deductExpenseFromCategory(category, amount);
  }

  updateMonthlyTable();
  updateFundAllocationTable();
  closeModal();
  saveDataToLocalStorage();
}

// Distribute income to fund allocations
function allocateIncome(amount) {
  profile.fundAllocations.categories.forEach(cat => {
    const allocatedAmount = amount * (cat.percentage / 100);
    cat.balance += allocatedAmount;
    cat.transactions.push({
      date: new Date().toISOString().split("T")[0],
      amount: allocatedAmount,
      type: 'income',
      description: description,
    });
  });
}

// Deduct expense from selected category
function deductExpenseFromCategory(categoryName, amount) {
  const category = profile.fundAllocations.categories.find(cat => cat.name === categoryName);
  if (!category) return;
  category.balance -= amount;
  category.transactions.push({
    date: new Date().toISOString().split("T")[0],
    amount: -amount,
    type: 'expense',
    description: description,
  });
}

// Generate Current Month
function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

// Update Averages
function updateAverages() {
  const profileMonths = profile.incomeStatement.months || [];
  const totalMonths = profileMonths.length || 1;
  const avgIncome = profileMonths.reduce((sum, m) => sum + m.totalIncome, 0) / totalMonths;
  const avgExpenses = profileMonths.reduce((sum, m) => sum + m.totalExpenses, 0) / totalMonths;
  const avgCashflow = avgIncome - avgExpenses;

  document.getElementById('average-income').textContent = `${profile.currency} ${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `${profile.currency} ${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `${profile.currency} ${avgCashflow.toFixed(2)}`;

  updateFinancialHealth();
}

// Update Financial Health
function updateFinancialHealth() {
  const avgCashflow = parseFloat(document.getElementById('average-cashflow').textContent.replace(profile.currency, '').trim());
  const healthScore = Math.round((avgCashflow / profile.passiveIncomeTarget) * 100);

  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();

  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, avgCashflow, profile.passiveIncomeTarget);
}

// Get Health Color
function getHealthColor(score) {
  return score <= 39 ? "#ff6384" : score <= 59 ? "#ffcd56" : score <= 79 ? "#4bc0c0" : "#36a2eb";
}

// Generate Health Tip
function generateHealthTip(score, cashflow, passiveIncomeTarget) {
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
  
  if (cashflow < passiveIncomeTarget) {
    extraTips.push("Your cashflow is below your passive income target. Focus on increasing income or reducing expenses.");
  } else {
    extraTips.push("Your cashflow exceeds your passive income target. Keep up the good work!");
  }

  return `${tips[section][Math.floor(Math.random() * tips[section].length)]} ${extraTips.join(" ")}`;
}

// Add Asset
function addAsset() {
  const date = prompt("Enter Date (YYYY-MM-DD):", getCurrentDate());
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));

  if (date && description && amount) {
    profile.balanceSheet.push({ date, description, type: "Asset", amount });
    updateBalanceSheet();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Liability
function addLiability() {
  const date = prompt("Enter Date (YYYY-MM-DD):", getCurrentDate());
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));

  if (date && description && amount) {
    profile.balanceSheet.push({ date, description, type: "Liability", amount });
    updateBalanceSheet();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Update Balance Sheet
function updateBalanceSheet() {
  const balanceSheetBody = document.getElementById("balance-sheet-body");
  balanceSheetBody.innerHTML = "";
  let totalAssetsAmount = 0;
  let totalLiabilitiesAmount = 0;

  profile.balanceSheet.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "Asset" ? `${profile.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Liability" ? `${profile.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editEntry('balance', ${index})">✎</button>
        <button onclick="deleteEntry('balance', ${index})">🗑️</button>
      </td>
    `;
    balanceSheetBody.appendChild(row);

    if (entry.type === "Asset") totalAssetsAmount += entry.amount;
    if (entry.type === "Liability") totalLiabilitiesAmount += entry.amount;
  });

  totalAssets.textContent = `${profile.currency} ${totalAssetsAmount}`;
  totalLiabilities.textContent = `${profile.currency} ${totalLiabilitiesAmount}`;
  netWorthDisplay.textContent = `${profile.currency} ${totalAssetsAmount - totalLiabilitiesAmount}`;
}

// Edit Entry
function editEntry(type, ...args) {
  if (type === 'income') {
    const [monthIndex, catIndex, entryIndex] = args;
    const entry = profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
    const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
    const newDescription = prompt("Edit Description:", entry.description);
    const newDate = prompt("Edit Date:", entry.date);

    if (!isNaN(newAmount) && newDescription && newDate) {
      const oldAmount = entry.amount;
      entry.amount = newAmount;
      entry.description = newDescription;
      entry.date = new Date(newDate).toISOString().split("T")[0];

      // Update totals
      if (entry.type === 'income') {
        profile.incomeStatement.months[monthIndex].categories[catIndex].totalIncome += newAmount - oldAmount;
        profile.incomeStatement.months[monthIndex].totalIncome += newAmount - oldAmount;
      } else if (entry.type === 'expense') {
        profile.incomeStatement.months[monthIndex].categories[catIndex].totalExpenses += newAmount - oldAmount;
        profile.incomeStatement.months[monthIndex].totalExpenses += newAmount - oldAmount;
      }

      updateMonthlyTable();
      saveDataToLocalStorage();
    }
  } else if (type === 'balance') {
    const index = args[0];
    const entry = profile.balanceSheet[index];
    const newDescription = prompt("Edit Description:", entry.description);
    const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
    const newDate = prompt("Edit Date:", entry.date);

    if (newDescription && !isNaN(newAmount) && newDate) {
      entry.description = newDescription;
      entry.amount = newAmount;
      entry.date = new Date(newDate).toISOString().split("T")[0];
      updateBalanceSheet();
      saveDataToLocalStorage();
    }
  }
}

// Delete Entry
function deleteEntry(type, ...args) {
  if (type === 'income') {
    const [monthIndex, catIndex, entryIndex] = args;
    const entry = profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
    const oldAmount = entry.amount;

    if (confirm("Are you sure you want to delete this entry?")) {
      profile.incomeStatement.months[monthIndex].categories[catIndex].entries.splice(entryIndex, 1);

      // Update totals
      if (entry.type === 'income') {
        profile.incomeStatement.months[monthIndex].categories[catIndex].totalIncome -= oldAmount;
        profile.incomeStatement.months[monthIndex].totalIncome -= oldAmount;
      } else if (entry.type === 'expense') {
        profile.incomeStatement.months[monthIndex].categories[catIndex].totalExpenses -= oldAmount;
        profile.incomeStatement.months[monthIndex].totalExpenses -= oldAmount;
      }

      updateMonthlyTable();
      saveDataToLocalStorage();
    }
  } else if (type === 'balance') {
    const index = args[0];
    const entry = profile.balanceSheet[index];

    if (confirm("Are you sure you want to delete this entry?")) {
      profile.balanceSheet.splice(index, 1);
      updateBalanceSheet();
      saveDataToLocalStorage();
    }
  }
}

// Duplicate Entry
function duplicateEntry(type, monthIndex, catIndex, entryIndex) {
  if (type === 'income') {
    const month = profile.incomeStatement.months[monthIndex];
    const category = month.categories[catIndex];
    const entry = category.entries[entryIndex];

    // Create a new entry with the same details but amount set to zero
    const newEntry = {
      date: entry.date,
      description: `${entry.description} - Copy`,
      amount: 0,
      type: entry.type
    };

    // Add the new entry to the same category
    category.entries.push(newEntry);

    // Update the UI
    updateMonthlyTable();
    saveDataToLocalStorage();
  } else if (type === 'balance') {
    const entry = profile.balanceSheet[entryIndex];

    // Create a new entry with the same details but amount set to zero
    const newEntry = {
      date: entry.date,
      description: `${entry.description} - Copy`,
      amount: 0,
      type: entry.type
    };

    // Add the new entry to the balance sheet
    profile.balanceSheet.push(newEntry);

    // Update the UI
    updateBalanceSheet();
    saveDataToLocalStorage();
  }
}

// Duplicate Category
function duplicateCategory(monthIndex, catIndex) {
  const month = profile.incomeStatement.months[monthIndex];
  const category = month.categories[catIndex];

  // Create a new category with the same details but name appended with " - Copy"
  const newCategory = {
    name: `${category.name} - Copy`,
    totalIncome: 0,
    totalExpenses: 0,
    entries: category.entries.map(entry => ({
      date: entry.date,
      description: `${entry.description} - Copy`,
      amount: 0,
      type: entry.type
    }))
  };

  // Add the new category to the same month
  month.categories.push(newCategory);

  // Update the UI
  updateMonthlyTable();
  saveDataToLocalStorage();
}

// Edit Category Name
function editCategoryName(monthIndex, catIndex) {
  const month = profile.incomeStatement.months[monthIndex];
  const category = month.categories[catIndex];
  const newCategoryName = prompt("Edit Category Name:", category.name);

  if (newCategoryName) {
    category.name = newCategoryName;
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Delete Category
function deleteCategory(monthIndex, catIndex) {
  const month = profile.incomeStatement.months[monthIndex];
  const category = month.categories[catIndex];

  if (confirm("Are you sure you want to delete this category?")) {
    month.categories.splice(catIndex, 1);

    // Update the UI
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Generate Financial Story
function generateStory() {
  const totalIncome = parseFloat(document.getElementById("average-income").textContent.replace(profile.currency, "").trim());
  const totalExpenses = parseFloat(document.getElementById("average-expenses").textContent.replace(profile.currency, "").trim());
  const totalAssets = parseFloat(document.getElementById("total-assets").textContent.replace(profile.currency, "").trim());
  const totalLiabilities = parseFloat(document.getElementById("total-liabilities").textContent.replace(profile.currency, "").trim());
  const netWorth = totalAssets - totalLiabilities;

  const story = `
    Meet ${profile.name}, a ${profile.age}-year-old ${profile.occupation} with a dream to ${profile.dream}. 
    Currently, ${profile.name} earns an average of ${profile.currency} ${totalIncome} per month but spends ${profile.currency} ${totalExpenses}, leaving an average cashflow of ${profile.currency} ${totalIncome - totalExpenses}. 
    They own assets worth ${profile.currency} ${totalAssets} and have liabilities of ${profile.currency} ${totalLiabilities}, resulting in a net worth of ${profile.currency} ${netWorth}. 
    Their goal is to achieve a passive income of ${profile.currency} ${profile.passiveIncomeTarget}. ${generateHealthTip(healthChart.data.datasets[0].data[0], totalIncome - totalExpenses, profile.passiveIncomeTarget)}
  `;

  financialStory.textContent = story;
}

// Convert Currency
function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (!isNaN(amount) && from && to) {
    const convertedAmount = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
  }
}

// Get Current Date
function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

// Save Data to LocalStorage
function saveDataToLocalStorage() {
  localStorage.setItem("financialData", JSON.stringify(profile));
}

// Load Saved Data
function loadSavedData() {
  const savedData = localStorage.getItem("financialData");
  if (savedData) {
    profile = JSON.parse(savedData);
    document.getElementById("name").value = profile.name;
    document.getElementById("age").value = profile.age;
    document.getElementById("occupation").value = profile.occupation;
    document.getElementById("dream").value = profile.dream;
    currencySelect.value = profile.currency;
    passiveIncomeTargetInput.value = profile.passiveIncomeTarget;
    updateMonthlyTable();
    updateBalanceSheet();
    updateFinancialHealth();
    populateAllocationCategories();
    updateFundAllocationTable();
  }
}

// Export Data
function exportData() {
  const fileName = saveFileNameInput.value.trim() || "financial_data";
  const data = { profile };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
}

// Import Data
function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      profile = data.profile;
      document.getElementById("name").value = profile.name;
      document.getElementById("age").value = profile.age;
      document.getElementById("occupation").value = profile.occupation;
      document.getElementById("dream").value = profile.dream;
      currencySelect.value = profile.currency;
      passiveIncomeTargetInput.value = profile.passiveIncomeTarget;
      updateMonthlyTable();
      updateBalanceSheet();
      updateFinancialHealth();
      populateAllocationCategories();
      updateFundAllocationTable();
      saveDataToLocalStorage();
      alert("Data Loaded!");
    };
    reader.readAsText(file);
  };
  input.click();
}

// Clear Data
function clearData() {
  if (confirm("Are you sure you want to clear all data?")) {
    profile = {
      name: "",
      age: "",
      occupation: "",
      dream: "",
      currency: "USD",
      passiveIncomeTarget: 0,
      incomeStatement: {
        months: [],
      },
      balanceSheet: [],
      fundAllocations: {
        categories: [],
        totalPercentage: 0,
      },
    };
    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("occupation").value = "";
    document.getElementById("dream").value = "";
    currencySelect.value = "USD";
    passiveIncomeTargetInput.value = "";
    updateMonthlyTable();
    updateBalanceSheet();
    updateFinancialHealth();
    updateFundAllocationTable();
    localStorage.removeItem("financialData");
    alert("Data Cleared!");
  }
}

// Share on WhatsApp
function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check out this Financial Tracker ${url}`);
}

// Share on Facebook
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

// Share on Twitter
function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=Check out this Financial Tracker`);
}

// Download App
function downloadApp() {
  window.open("https://www.appcreator24.com/app3480869-q98157", "_blank");
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

// Fund Allocation Features
function showAllocationModal() {
  allocationModal.style.display = 'block';
  populateAllocationCategories();
}

function closeAllocationModal() {
  allocationModal.style.display = 'none';
}

function populateAllocationCategories() {
  const categoryList = document.getElementById('allocationCategories');
  categoryList.innerHTML = '';
  profile.fundAllocations.categories.forEach((cat, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${cat.name} (${cat.percentage}%)
      <button onclick="editAllocationCategory(${index})">✎</button>
      <button onclick="deleteAllocationCategory(${index})">🗑️</button>
    `;
    categoryList.appendChild(li);
  });
}

function addAllocationCategory() {
  const name = document.getElementById('newAllocationCategory').value;
  const percentage = parseFloat(document.getElementById('newAllocationPercentage').value);
  if (name && percentage) {
    profile.fundAllocations.categories.push({
      name: name,
      percentage: percentage,
      balance: 0,
      transactions: [],
    });
    populateAllocationCategories();
    document.getElementById('newAllocationCategory').value = '';
    document.getElementById('newAllocationPercentage').value = '';
  }
}

function saveAllocations() {
  let totalPercentage = profile.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
  if (totalPercentage !== 100) {
    alert("Total percentage must be 100%");
    return;
  }
  closeAllocationModal();
  saveDataToLocalStorage();
}

function updateFundAllocationTable() {
  const body = document.getElementById('fund-allocation-body');
  body.innerHTML = '';
  profile.fundAllocations.categories.forEach(cat => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cat.name}</td>
      <td>${profile.currency} ${parseFloat(cat.balance).toFixed(2)}</td>
      <td>
        <button onclick="viewCategoryTransactions(${profile.fundAllocations.categories.indexOf(cat)})">View</button>
      </td>
    `;
    body.appendChild(row);
  });
}

function viewCategoryTransactions(categoryIndex) {
  console.log("Viewing transactions for category:", categoryIndex);
  // Implement modal to display category transactions here
}

function editAllocationCategory(index) {
  const category = profile.fundAllocations.categories[index];
  const newName = prompt("Edit Category Name:", category.name);
  const newPercentage = prompt("Edit Percentage:", category.percentage);

  if (newName && !isNaN(newPercentage)) {
    category.name = newName;
    category.percentage = parseFloat(newPercentage);
    populateAllocationCategories();
    saveDataToLocalStorage();
  }
}

function deleteAllocationCategory(index) {
  const category = profile.fundAllocations.categories[index];
  if (confirm("Are you sure you want to delete this category?")) {
    profile.fundAllocations.categories.splice(index, 1);
    populateAllocationCategories();
    saveDataToLocalStorage();
  }
  }
