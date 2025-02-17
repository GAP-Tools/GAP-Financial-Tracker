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
  generalIncome: {
    balance: 0,
    transactions: [],
  },
};

let currencyRates = {};

const incomeStatementBody = document.getElementById("monthly-body");
const balanceSheetBody = document.getElementById("balance-sheet-body");
const totalAssets = document.getElementById("total-assets");
const totalLiabilities = document.getElementById("total-liabilities");
const netWorthDisplay = document.getElementById("net-worth");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");
const healthPercentage = document.getElementById("healthPercentage");
const healthTips = document.getElementById("healthTips");
const currencySelect = document.getElementById("currency");
const passiveIncomeTargetInput = document.getElementById("passive-income-target");
const cashflowDisplay = document.getElementById("cashflow");
const saveFileNameInput = document.getElementById("saveFileName");
const calculatorPopup = document.getElementById("calculatorPopup");
const calculatorInput = document.getElementById("calculatorInput");
const allocationModal = document.getElementById("allocationModal");
const entryCategorySelect = document.getElementById("entryCategory");
const entryType = document.getElementById("entryType");

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

async function fetchCurrencyRates() {
  const apiUrl = "https://v6.exchangerate-api.com/v6/eb5cfc3ff6c3b48bb6f60c83/latest/USD";
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

function populateCurrencyDropdowns() {
  for (const currency in currencyRates) {
    const newOption = document.createElement("option");
    newOption.value = currency;
    newOption.text = `${currency} (${getCurrencySymbol(currency)})`;
    currencySelect.add(newOption);
  }
}

function getCurrencySymbol(currency) {
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    NGN: "₦",
    JPY: "¥",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
    CNY: "¥",
  };
  return symbols[currency] || currency;
}

document.addEventListener('DOMContentLoaded', function() {
  const switchLink = document.getElementById('switchLink');
  switchLink.addEventListener('click', function() {
    window.location.href = "https://gap-tools.github.io/GAP-Financial-Tracker/Business";
  });
  fetchCurrencyRates();
});

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

function editPassiveIncomeTarget() {
  const newTarget = prompt("Enter New Passive Income Target:", profile.passiveIncomeTarget);
  if (!isNaN(newTarget)) {
    profile.passiveIncomeTarget = parseFloat(newTarget);
    passiveIncomeTargetInput.value = profile.passiveIncomeTarget;
    updateFinancialHealth();
    saveDataToLocalStorage();
  }
}

function showEntryModal(type) {
  document.getElementById('entryModal').style.display = 'block';
  document.getElementById('entryType').value = type;
  populateCategories();
  if (type === 'income') {
    document.getElementById('entryCategory').disabled = true;
    document.getElementById('entryCategory').value = 'General Income';
    document.getElementById('categorySelectDiv').style.display = 'none';
  } else {
    document.getElementById('entryCategory').disabled = false;
    document.getElementById('categorySelectDiv').style.display = 'block';
  }
  document.getElementById('entryAmount').value = '';
  document.getElementById('entryDescription').value = '';
}

function closeModal() {
  document.getElementById('entryModal').style.display = 'none';
}

function populateCategories() {
  const categorySelect = document.getElementById('entryCategory');
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  profile.fundAllocations.categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

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
    (monthData.categories || []).forEach((cat, catIndex) => {
      const categoryRow = document.createElement('tr');
      categoryRow.classList.add('expandable');
      categoryRow.innerHTML = `
        <td class="editable-date" onclick="editCategoryName(${monthIndex}, ${catIndex})">${cat.name}</td>
        <td>${profile.currency} ${cat.totalIncome}</td>
        <td>${profile.currency} ${cat.totalExpenses}</td>
        <td>
          <button class="expand-button" onclick="expandCollapseRow(this.parentElement.parentElement)">
            <svg class="expand-icon" viewBox="0 0 24 24">
              <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
            </svg>
          </button>
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
      (cat.entries || []).forEach((entry, entryIndex) => {
        const dailyRow = document.createElement('tr');
        dailyRow.innerHTML = `
          <td class="editable-date" onclick="editEntry('${entry.type}', ${monthIndex}, ${catIndex}, ${entryIndex})">
            ${entry.date}
          </td>
          <td>${entry.description}</td>
          <td>${profile.currency} ${entry.amount}</td>
          <td>${entry.type === 'income' ? 'Income' : 'Expense'}</td>
          <td>
            <button onclick="editEntry('${entry.type}', ${monthIndex}, ${catIndex}, ${entryIndex})">✎</button>
            <button onclick="duplicateEntry('${entry.type}', ${monthIndex}, ${catIndex}, ${entryIndex})">♻️</button>
            <button onclick="deleteEntry('${entry.type}', ${monthIndex}, ${catIndex}, ${entryIndex})">🗑️</button>
          </td>
        `;
        document.getElementById(`daily-body-${monthIndex}-${catIndex}`).appendChild(dailyRow);
      });
    });
  });
  updateAverages();
}

function expandCollapseRow(rowElement) {
  rowElement.classList.toggle('expanded');
  const nextRow = rowElement.nextElementSibling;
  if (nextRow?.classList.contains('nested')) {
    nextRow.style.display = nextRow.style.display === 'table-row' ? 'none' : 'table-row';
  }
}

function saveEntry() {
  const type = document.getElementById('entryType').value;
  const amount = parseFloat(document.getElementById('entryAmount').value);
  const description = document.getElementById('entryDescription').value.trim();
  const category = document.getElementById('entryCategory').value;
  if (isNaN(amount) || amount <= 0 || !description) {
    alert('Invalid or missing amount/description');
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
  if (type === 'income') {
    if (!monthObject.categories.some(cat => cat.name === 'General Income')) {
      monthObject.categories.push({
        name: 'General Income',
        totalIncome: 0,
        totalExpenses: 0,
        entries: [],
      });
    }
    categoryObject = monthObject.categories.find(cat => cat.name === 'General Income');
    categoryObject.totalIncome += amount;
    monthObject.totalIncome += amount;
    categoryObject.entries.push({
      date: new Date().toISOString().split("T")[0],
      description: description,
      amount: amount,
      type: 'income',
    });
    allocateIncome(amount, description);
  } else if (type === 'expense') {
    if (!category) {
      alert('Please select a category for expenses');
      return;
    }
    if (!monthObject.categories.some(cat => cat.name === category)) {
      monthObject.categories.push({
        name: category,
        totalIncome: 0,
        totalExpenses: 0,
        entries: [],
      });
    }
    categoryObject = monthObject.categories.find(cat => cat.name === category);
    categoryObject.totalExpenses += amount;
    monthObject.totalExpenses += amount;
    categoryObject.entries.push({
      date: new Date().toISOString().split("T")[0],
      description: description,
      amount: amount,
      type: 'expense',
    });
    deductExpenseFromCategory(category, amount, description);
  }
  updateMonthlyTable();
  updateFundAllocationTable();
  closeModal();
  saveDataToLocalStorage();
}

function allocateIncome(amount, description) {
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
  profile.generalIncome.balance += amount;
  profile.generalIncome.transactions.push({
    date: new Date().toISOString().split("T")[0],
    amount: amount,
    type: 'income',
    description: description,
  });
}

function deductExpenseFromCategory(categoryName, amount, description) {
  const category = profile.fundAllocations.categories.find(cat => cat.name === categoryName);
  if (!category) return;
  category.balance -= amount;
  category.transactions.push({
    date: new Date().toISOString().split("T")[0],
    amount: -amount,
    type: 'expense',
    description: description,
  });
  profile.generalIncome.balance -= amount;
  profile.generalIncome.transactions.push({
    date: new Date().toISOString().split("T")[0],
    amount: -amount,
    type: 'expense',
    description: description,
  });
}

function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

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

function updateFinancialHealth() {
  const avgCashflow = parseFloat(document.getElementById('average-cashflow').textContent.replace(profile.currency, '').trim());
  const healthScore = Math.round((avgCashflow / profile.passiveIncomeTarget) * 100);
  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();
  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, avgCashflow, profile.passiveIncomeTarget);
}

function getHealthColor(score) {
  return score <= 39 ? "#ff6384" : score <= 59 ? "#ffcd56" : score <= 79 ? "#4bc0c0" : "#36a2eb";
}

function generateHealthTip(score, cashflow, passiveIncomeTarget) {
  const tips = {
    low: [
      "Your expenses are higher than your income. Start by cutting unnecessary spending like dining out or subscriptions you don’t use.",
      "You’re living paycheck to paycheck. Focus on building an emergency fund, even if it’s just $10 a week.",
    ],
    moderate: [
      "Your financial health is improving, but you’re not out of the woods yet. Keep reducing liabilities and focus on acquiring assets."
    ],
    good: [
      "Great job! Your income is higher than your expenses. Keep building your assets and focus on generating passive income.",
    ],
    excellent: [
      "Excellent! Your financial health is in great shape. Keep up the good work and focus on maintaining your wealth.",
    ]
  };

  const section = score <= 39 ? 'low' : score <= 59 ? 'moderate' : score <= 79 ? 'good' : 'excellent';

  const extraTips = [];
  if (cashflow < passiveIncomeTarget) {
    extraTips.push(
      "Your cashflow is below your passive income target. Focus on increasing income or reducing expenses.",
    );
  } else {
    extraTips.push(
      "Your cashflow exceeds your passive income target. Keep up the good work!",
    );
  }

  const randomTip = tips[section][Math.floor(Math.random() * tips[section].length)];
  const randomExtraTip = extraTips[Math.floor(Math.random() * extraTips.length)];
  return `${randomTip} ${randomExtraTip}`;
}

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
        <button onclick="editBalanceEntry('balance', ${index})">✎</button>
        <button onclick="deleteBalanceEntry('balance', ${index})">🗑️</button>
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

function editBalanceEntry(type, index) {
  const entry = profile.balanceSheet[index];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  const newDate = prompt("Edit Date:", entry.date);
  if (newDescription && !isNaN(newAmount) && newDate) {
    entry.description = newDescription;
    entry.amount = newAmount;
    entry.date = newDate;
    updateBalanceSheet();
    saveDataToLocalStorage();
  }
}

function deleteBalanceEntry(type, index) {
  if (confirm("Are you sure you want to delete this entry?")) {
    profile.balanceSheet.splice(index, 1);
    updateBalanceSheet();
    saveDataToLocalStorage();
  }
}

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

function saveDataToLocalStorage() {
  localStorage.setItem("financialData", JSON.stringify(profile));
}

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

function generateStory() {
  const totalIncome = parseFloat(document.getElementById("average-income").textContent.replace(profile.currency, "").trim());
  const totalExpenses = parseFloat(document.getElementById("average-expenses").textContent.replace(profile.currency, "").trim());
  const totalAssets = parseFloat(document.getElementById("total-assets").textContent.replace(profile.currency, "").trim());
  const totalLiabilities = parseFloat(document.getElementById("total-liabilities").textContent.replace(profile.currency, "").trim());
  const netWorth = totalAssets - totalLiabilities;
  let story = `
    Meet ${profile.name}, a ${profile.age}-year-old ${profile.occupation} with a dream to ${profile.dream}. 
    Currently, ${profile.name} earns an average of ${profile.currency} ${totalIncome} per month but spends ${profile.currency} ${totalExpenses}, leaving an average cashflow of ${profile.currency} ${totalIncome - totalExpenses}. 
    They own assets worth ${profile.currency} ${totalAssets} and have liabilities of ${profile.currency} ${totalLiabilities}, resulting in a net worth of ${profile.currency} ${netWorth}. 
    Their goal is to achieve a passive income of ${profile.currency} ${profile.passiveIncomeTarget}. 
  `;
  profile.fundAllocations.categories.forEach(cat => {
    story += `
      ${cat.name} currently has a balance of ${profile.currency} ${cat.balance} with ${cat.transactions.length} transactions.
    `;
  });
  financialStory.textContent = story;
}

function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === "block" ? "none" : "block";
}

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

function deleteLastCharacter() {
  calculatorInput.value = calculatorInput.value.slice(0, -1);
}

function addAllocationCategory() {
  const newCategory = document.getElementById("newAllocationCategory").value;
  const newPercentage = parseFloat(document.getElementById("newAllocationPercentage").value);
  if (newCategory && !isNaN(newPercentage)) {
    if (isNaN(newPercentage) || newPercentage <= 0) {
      alert("Invalid percentage");
      return;
    }
    const totalPercentage = profile.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (totalPercentage + newPercentage > 100) {
      alert("Total percentage exceeds 100%");
      return;
    }
    profile.fundAllocations.categories.push({
      name: newCategory,
      percentage: newPercentage,
      balance: 0,
      transactions: [],
    });
    populateAllocationCategories();
  }
}

function saveAllocations() {
  let totalPercentage = 0;
  profile.fundAllocations.categories.forEach(cat => {
    totalPercentage += cat.percentage;
  });
  if (totalPercentage === 100) {
    closeAllocationModal();
    saveDataToLocalStorage();
    updateFundAllocationTable();
  } else {
    alert("Total percentage must be exactly 100%");
  }
}

function closeAllocationModal() {
  document.getElementById("allocationModal").style.display = "none";
}

function showAllocationModal() {
  document.getElementById("allocationModal").style.display = "block";
}

function populateAllocationCategories() {
  const categoryList = document.getElementById("allocationCategories");
  categoryList.innerHTML = "";
  profile.fundAllocations.categories.forEach((cat, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${cat.name} (${cat.percentage}%)
      <button onclick="editAllocationCategory(${index})">✎</button>
      <button onclick="deleteAllocationCategory(${index})">🗑️</button>
    `;
    categoryList.appendChild(li);
  });
}

function editAllocationCategory(index) {
  const category = profile.fundAllocations.categories[index];
  const newCategoryName = prompt("Edit Category Name:", category.name);
  const newPercentage = parseFloat(prompt("Edit Percentage:", category.percentage));
  if (newCategoryName && !isNaN(newPercentage)) {
    category.name = newCategoryName;
    category.percentage = newPercentage;
    let totalPercentage = 0;
    profile.fundAllocations.categories.forEach(cat => {
      totalPercentage += cat.percentage;
    });
    if (totalPercentage === 100) {
      populateAllocationCategories();
      saveDataToLocalStorage();
    } else {
      alert("Total percentage must be exactly 100%");
    }
  }
}

function deleteAllocationCategory(index) {
  if (confirm("Are you sure you want to delete this category?")) {
    profile.fundAllocations.categories.splice(index, 1);
    populateAllocationCategories();
    saveDataToLocalStorage();
  }
}

function updateFundAllocationTable() {
  const body = document.getElementById('fund-allocation-body');
  body.innerHTML = '';
  profile.fundAllocations.categories.forEach(cat => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cat.name}</td>
      <td>${cat.percentage}%</td>
      <td>${profile.currency} ${parseFloat(cat.balance).toFixed(2)}</td>
      <td>
        <button onclick="viewCategoryTransactions(${profile.fundAllocations.categories.indexOf(cat)})">View</button>
      </td>
    `;
    body.appendChild(row);
  });
}

function viewCategoryTransactions(categoryIndex) {
  const category = profile.fundAllocations.categories[categoryIndex];
  if (!category) return;
  const summaryText = document.getElementById('transactionSummaryText');
  summaryText.innerHTML = '';
  category.transactions.forEach(transaction => {
    const paragraph = document.createElement('p');
    paragraph.textContent = `On ${transaction.date}, an amount of ${profile.currency} ${transaction.amount} was recorded as ${transaction.type}: ${transaction.description}.`;
    summaryText.appendChild(paragraph);
  });
  document.getElementById('transactionSummaryModal').style.display = 'block';
}

function closeSummaryModal() {
  document.getElementById('transactionSummaryModal').style.display = 'none';
}

function exportData() {
  const fileName = document.getElementById("saveFileName").value || "financial_data.json";
  const data = JSON.stringify(profile);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      profile = data;
      loadSavedData();
      saveDataToLocalStorage();
      alert("Data imported successfully!");
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearData() {
  if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
    localStorage.removeItem("financialData");
    location.reload();
  }
}

function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check%20out%20this%20financial%20tracker%20application:%20${url}`);
}

function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=Check%20out%20this%20financial%20tracker%20application`);
}

function downloadApp() {
  window.open("https://www.appcreator24.com/app3480869-q98157", "_blank");
}

function editEntry(type, monthIndex, catIndex, entryIndex) {
  const entry = profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
  const oldAmount = entry.amount;
  const oldDescription = entry.description;
  const oldDate = entry.date;

  const newAmount = parseFloat(prompt("Edit Amount:", oldAmount));
  const newDescription = prompt("Edit Description:", oldDescription);
  const newDate = prompt("Edit Date (YYYY-MM-DD):", oldDate);

  if (!isNaN(newAmount) && newDescription && newDate) {
    const diff = newAmount - oldAmount;
    const month = profile.incomeStatement.months[monthIndex];
    const category = month.categories[catIndex];

    // Update income statement totals
    if (type === 'income') {
      category.totalIncome += diff;
      month.totalIncome += diff;
    } else {
      category.totalExpenses += diff;
      month.totalExpenses += diff;
    }

    // Update fund allocations
    if (type === 'income') {
      profile.generalIncome.balance += diff;
      profile.fundAllocations.categories.forEach(cat => {
        const allocatedDiff = diff * (cat.percentage / 100);
        cat.balance += allocatedDiff;
        updateFundTransactions(cat.transactions, oldAmount, newAmount, oldDescription, newDescription, oldDate, newDate);
      });
      updateGeneralIncomeTransactions(oldAmount, newAmount, oldDescription, newDescription, oldDate, newDate);
    } else {
      const fundCategory = profile.fundAllocations.categories.find(c => c.name === category.name);
      if (fundCategory) {
        fundCategory.balance -= diff;
        updateFundExpenseTransactions(fundCategory.transactions, oldAmount, newAmount, oldDescription, newDescription, oldDate, newDate);
      }
      profile.generalIncome.balance -= diff;
      updateGeneralExpenseTransactions(oldAmount, newAmount, oldDescription, newDescription, oldDate, newDate);
    }

    // Update entry data
    entry.amount = newAmount;
    entry.description = newDescription;
    entry.date = newDate;

    updateMonthlyTable();
    updateFundAllocationTable();
    saveDataToLocalStorage();
  }
}

function duplicateEntry(type, monthIndex, catIndex, entryIndex) {
  const originalEntry = profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
  const newEntry = {
    date: new Date().toISOString().split("T")[0],
    description: `${originalEntry.description} (copy)`,
    amount: originalEntry.amount,
    type: originalEntry.type
  };
  profile.incomeStatement.months[monthIndex].categories[catIndex].entries.push(newEntry);

  // Update fund allocations
  if (type === 'income') {
    profile.generalIncome.balance += newEntry.amount;
    profile.fundAllocations.categories.forEach(cat => {
      const allocatedAmount = newEntry.amount * (cat.percentage / 100);
      cat.balance += allocatedAmount;
      cat.transactions.push({
        date: newEntry.date,
        amount: allocatedAmount,
        type: 'income',
        description: newEntry.description,
      });
    });
    profile.generalIncome.transactions.push({
      date: newEntry.date,
      amount: newEntry.amount,
      type: 'income',
      description: newEntry.description,
    });
  } else {
    const fundCategory = profile.fundAllocations.categories.find(c => c.name === profile.incomeStatement.months[monthIndex].categories[catIndex].name);
    if (fundCategory) {
      fundCategory.balance -= newEntry.amount;
      fundCategory.transactions.push({
        date: newEntry.date,
        amount: -newEntry.amount,
        type: 'expense',
        description: newEntry.description,
      });
    }
    profile.generalIncome.balance -= newEntry.amount;
    profile.generalIncome.transactions.push({
      date: newEntry.date,
      amount: -newEntry.amount,
      type: 'expense',
      description: newEntry.description,
    });
  }

  updateMonthlyTable();
  updateFundAllocationTable();
  saveDataToLocalStorage();
}

function deleteEntry(type, monthIndex, catIndex, entryIndex) {
  if (confirm("Are you sure you want to delete this entry?")) {
    const entry = profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
    const month = profile.incomeStatement.months[monthIndex];
    const category = month.categories[catIndex];

    // Update income statement totals
    if (type === 'income') {
      category.totalIncome -= entry.amount;
      month.totalIncome -= entry.amount;
    } else {
      category.totalExpenses -= entry.amount;
      month.totalExpenses -= entry.amount;
    }

    // Update fund allocations
    if (type === 'income') {
      profile.generalIncome.balance -= entry.amount;
      profile.fundAllocations.categories.forEach(cat => {
        const allocatedAmount = entry.amount * (cat.percentage / 100);
        cat.balance -= allocatedAmount;
        removeFundTransactions(cat.transactions, allocatedAmount, entry.description, entry.date);
      });
      removeGeneralIncomeTransactions(entry.amount, entry.description, entry.date);
    } else {
      const fundCategory = profile.fundAllocations.categories.find(c => c.name === category.name);
      if (fundCategory) {
        fundCategory.balance += entry.amount;
        removeFundExpenseTransactions(fundCategory.transactions, entry.amount, entry.description, entry.date);
      }
      profile.generalIncome.balance += entry.amount;
      removeGeneralExpenseTransactions(entry.amount, entry.description, entry.date);
    }

    // Remove entry
    category.entries.splice(entryIndex, 1);

    updateMonthlyTable();
    updateFundAllocationTable();
    saveDataToLocalStorage();
  }
}

// Helper functions for transaction updates
function updateFundTransactions(transactions, oldAmount, newAmount, oldDesc, newDesc, oldDate, newDate) {
  transactions.forEach(tx => {
    if (tx.description === oldDesc && tx.date === oldDate && tx.amount === oldAmount) {
      tx.amount = newAmount;
      tx.description = newDesc;
      tx.date = newDate;
    }
  });
}

function updateGeneralIncomeTransactions(oldAmount, newAmount, oldDesc, newDesc, oldDate, newDate) {
  profile.generalIncome.transactions.forEach(tx => {
    if (tx.description === oldDesc && tx.date === oldDate && tx.amount === oldAmount) {
      tx.amount = newAmount;
      tx.description = newDesc;
      tx.date = newDate;
    }
  });
}

function removeFundTransactions(transactions, amount, desc, date) {
  const index = transactions.findIndex(tx => 
    tx.amount === amount && tx.description === desc && tx.date === date
  );
  if (index > -1) transactions.splice(index, 1);
}

function removeGeneralIncomeTransactions(amount, desc, date) {
  const index = profile.generalIncome.transactions.findIndex(tx => 
    tx.amount === amount && tx.description === desc && tx.date === date
  );
  if (index > -1) profile.generalIncome.transactions.splice(index, 1);
}

function updateFundExpenseTransactions(transactions, oldAmount, newAmount, oldDesc, newDesc, oldDate, newDate) {
  transactions.forEach(tx => {
    if (tx.description === oldDesc && tx.date === oldDate && tx.amount === -oldAmount) {
      tx.amount = -newAmount;
      tx.description = newDesc;
      tx.date = newDate;
    }
  });
}

function updateGeneralExpenseTransactions(oldAmount, newAmount, oldDesc, newDesc, oldDate, newDate) {
  profile.generalIncome.transactions.forEach(tx => {
    if (tx.description === oldDesc && tx.date === oldDate && tx.amount === -oldAmount) {
      tx.amount = -newAmount;
      tx.description = newDesc;
      tx.date = newDate;
    }
  });
}

function removeFundExpenseTransactions(transactions, amount, desc, date) {
  const index = transactions.findIndex(tx => 
    tx.amount === -amount && tx.description === desc && tx.date === date
  );
  if (index > -1) transactions.splice(index, 1);
}

function removeGeneralExpenseTransactions(amount, desc, date) {
  const index = profile.generalIncome.transactions.findIndex(tx => 
    tx.amount === -amount && tx.description === desc && tx.date === date
  );
  if (index > -1) profile.generalIncome.transactions.splice(index, 1);
  }
