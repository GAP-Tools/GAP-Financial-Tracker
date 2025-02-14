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
    categories: [],
  },
};
let balanceSheet = [];
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
const monthlyBody = document.getElementById("monthly-body");

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

// Switch to Business
document.addEventListener('DOMContentLoaded', function() {
  var switchLink = document.getElementById('switchLink');
  if (switchLink) {
    switchLink.addEventListener('click', function() {
      window.location.href = 'https://gap-tools.github.io/GAP-Financial-Tracker/Business';
    });
  }
});

// Add Income
function addIncome() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Income Amount:"));
  if (date && description && amount) {
    profile.incomeStatement.push({ date, description, type: "Income", amount });
    updateIncomeStatement();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Expense
function addExpense() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Expense Amount:"));
  if (date && description && amount) {
    profile.incomeStatement.push({ date, description, type: "Expense", amount });
    updateIncomeStatement();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Asset
function addAsset() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));
  if (date && description && amount) {
    balanceSheet.push({ date, description, type: "Asset", amount });
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Liability
function addLiability() {
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));
  if (date && description && amount) {
    balanceSheet.push({ date, description, type: "Liability", amount });
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Update Income Statement
function updateIncomeStatement() {
  incomeStatementBody.innerHTML = "";
  let totalIncomeAmount = 0;
  let totalExpensesAmount = 0;

  profile.incomeStatement.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "Income" ? `${profile.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Expense" ? `${profile.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editEntry('income', ${index})">✏️</button>
        <button onclick="deleteEntry('income', ${index})">🗑️</button>
      </td>
    `;
    incomeStatementBody.appendChild(row);

    if (entry.type === "Income") totalIncomeAmount += entry.amount;
    if (entry.type === "Expense") totalExpensesAmount += entry.amount;
  });

  totalIncome.textContent = `${profile.currency} ${totalIncomeAmount}`;
  totalExpenses.textContent = `${profile.currency} ${totalExpensesAmount}`;
  const cashflow = totalIncomeAmount - totalExpensesAmount;
  cashflowDisplay.textContent = `${profile.currency} ${cashflow}`;
}

// Update Balance Sheet
function updateBalanceSheet() {
  balanceSheetBody.innerHTML = "";
  let totalAssetsAmount = 0;
  let totalLiabilitiesAmount = 0;

  balanceSheet.forEach((entry, index) => {
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
  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  netWorthDisplay.textContent = `${profile.currency} ${netWorth}`;
}

// Edit Entry
function editEntry(type, index) {
  const entry = type === "income" ? profile.incomeStatement[index] : balanceSheet[index];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  if (newDescription && !isNaN(newAmount)) {
    entry.description = newDescription;
    entry.amount = newAmount;
    if (type === "income") updateIncomeStatement();
    else updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Delete Entry
function deleteEntry(type, index) {
  if (confirm("Are you sure you want to delete this entry?")) {
    if (type === "income") profile.incomeStatement.splice(index, 1);
    else balanceSheet.splice(index, 1);
    if (type === "income") updateIncomeStatement();
    else updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  }
}

// Update Financial Health
function updateFinancialHealth() {
  const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(profile.currency, ""));
  const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(profile.currency, ""));
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(profile.currency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(profile.currency, ""));
  const cashflow = totalIncomeAmount - totalExpensesAmount;

  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  const savingsRate = (totalIncomeAmount - totalExpensesAmount) / totalIncomeAmount || 0;
  const healthScore = Math.round((cashflow / profile.passiveIncomeTarget) * 100);

  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();

  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, totalIncomeAmount, totalExpensesAmount, totalAssetsAmount, totalLiabilitiesAmount, cashflow, profile.passiveIncomeTarget);
}

// Get Health Color
function getHealthColor(score) {
  return score <= 39 ? "#ff6384" : score <= 59 ? "#ffcd56" : score <= 79 ? "#4bc0c0" : "#36a2eb";
}

// Generate Health Tip
function generateHealthTip(score, income, expenses, assets, liabilities, cashflow, passiveIncomeTarget) {
  const tips = {
    low: [
      "Your expenses are higher than your income. Consider cutting down on unnecessary spending.",
      "Focus on reducing liabilities and increasing assets to improve your financial health.",
      "You're spending more than you earn. Try to find ways to increase your income or reduce expenses.",
      "High liabilities can lead to financial stress. Focus on paying off debts.",
      "Your savings rate is low. Consider creating a budget to track your spending.",
      "Invest in assets that generate passive income to improve your financial health.",
      "Avoid unnecessary expenses and focus on building an emergency fund.",
      "Your financial health is in danger. Take immediate steps to reduce liabilities.",
      "Consider consulting a financial advisor to improve your financial situation.",
      "Track your spending habits to identify areas where you can cut costs."
    ],
    moderate: [
      "Your financial health is improving, but there's still room for growth. Consider investing in assets.",
      "You're doing okay, but try to reduce your liabilities to improve your net worth.",
      "Your savings rate is low. Consider increasing your income or reducing expenses.",
      "Focus on building assets that appreciate over time.",
      "Avoid taking on new debts and focus on paying off existing ones.",
      "Your net worth is improving, but you can do better by increasing your income.",
      "Consider diversifying your income streams to improve financial stability.",
      "Your financial health is stable, but you need to focus on long-term goals.",
      "Invest in education or skills that can increase your earning potential.",
      "Create a financial plan to achieve your dreams and goals."
    ],
    good: [
      "Great job! Your income is higher than your expenses. Keep building your assets.",
      "You're on the right track. Consider investing in assets to generate passive income.",
      "Your financial health is good. Keep saving and investing to reach your goals.",
      "Your net worth is growing. Focus on maintaining a healthy savings rate.",
      "Consider investing in real estate or stocks to grow your wealth.",
      "Your financial habits are improving. Keep up the good work!",
      "You're doing well, but don't forget to plan for retirement.",
      "Your financial health is strong. Focus on long-term wealth-building strategies.",
      "Consider creating multiple income streams to further improve your financial health.",
      "You're on the path to financial freedom. Keep making smart financial decisions."
    ],
    excellent: [
      "Excellent! Your financial health is in great shape. Keep up the good work!",
      "You're doing amazing! Consider diversifying your investments to further grow your wealth.",
      "Your net worth is impressive. Keep focusing on building assets and reducing liabilities.",
      "You've achieved financial stability. Focus on giving back and helping others.",
      "You're a financial role model. Keep inspiring others with your success.",
      "Your wealth is growing steadily. Focus on legacy planning and philanthropy.",
      "You've mastered financial management. Consider exploring new investment opportunities.",
      "Your financial health is outstanding. Keep setting and achieving new goals.",
      "You're financially free. Enjoy the fruits of your hard work and smart decisions.",
      "You're a financial wizard. Keep making wise investment choices."
    ]
  };

  const section = score <= 39 ? 'low' : score <= 59 ? 'moderate' : score <= 79 ? 'good' : 'excellent';
  const additionalTips = [];

  if (cashflow < passiveIncomeTarget) {
    additionalTips.push(
      "Your cashflow is below your passive income target. Focus on increasing income or reducing expenses.",
      "Consider investing in assets that generate passive income to bridge the gap.",
      "Your financial freedom goal is within reach. Keep working towards it!"
    );
  } else {
    additionalTips.push(
      "Congratulations! Your cashflow exceeds your passive income target. You're financially free!",
      "You've achieved financial freedom. Consider reinvesting your surplus income to grow your wealth further.",
      "Your financial health is excellent. Focus on maintaining your freedom and exploring new opportunities."
    );
  }

  return `${tips[section][Math.floor(Math.random() * tips[section].length)]} ${additionalTips.join(" ")}`;
}

// Save Data to LocalStorage
function saveDataToLocalStorage() {
  const data = { profile, balanceSheet };
  localStorage.setItem("financialData", JSON.stringify(data));
}

// Load Saved Data
function loadSavedData() {
  const savedData = localStorage.getItem("financialData");
  if (savedData) {
    const data = JSON.parse(savedData);
    profile = data.profile;
    balanceSheet = data.balanceSheet;
    document.getElementById("name").value = profile.name;
    document.getElementById("age").value = profile.age;
    document.getElementById("occupation").value = profile.occupation;
    document.getElementById("dream").value = profile.dream;
    currencySelect.value = profile.currency;
    passiveIncomeTargetInput.value = profile.passiveIncomeTarget;
    updateIncomeStatement();
    updateBalanceSheet();
    updateFinancialHealth();
  }
}

// Export Data
function exportData() {
  const fileName = saveFileNameInput.value.trim() || "financial_data";
  const data = { profile, balanceSheet };
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
      balanceSheet = data.balanceSheet;
      document.getElementById("name").value = profile.name;
      document.getElementById("age").value = profile.age;
      document.getElementById("occupation").value = profile.occupation;
      document.getElementById("dream").value = profile.dream;
      currencySelect.value = profile.currency;
      passiveIncomeTargetInput.value = profile.passiveIncomeTarget;
      updateIncomeStatement();
      updateBalanceSheet();
      updateFinancialHealth();
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
      incomeStatement: { months: [], categories: [] }
    };
    balanceSheet = [];
    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("occupation").value = "";
    document.getElementById("dream").value = "";
    currencySelect.value = "USD";
    passiveIncomeTargetInput.value = "";
    updateIncomeStatement();
    updateBalanceSheet();
    updateFinancialHealth();
    localStorage.removeItem("financialData");
    alert("Data Cleared!");
  }
}

// Share on WhatsApp
function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check%20out%20this%20awesome%20Financial%20Tracker%20App%20${url}`);
}

// Share on Facebook
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

// Share on Twitter
function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=Check%20out%20this%20awesome%20Financial%20Tracker%20App`);
}

// Download App
function downloadApp() {
  window.open("https://www.appcreator24.com/app3480869-q98157", "_blank");
}

// Generate Financial Story
function generateStory() {
  const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(profile.currency, ""));
  const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(profile.currency, ""));
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(profile.currency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(profile.currency, ""));
  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  const cashflow = totalIncomeAmount - totalExpensesAmount;
  const passiveIncomeTarget = profile.passiveIncomeTarget;
  const remainingToTarget = passiveIncomeTarget - cashflow;

  let story = `Meet ${profile.name}, a ${profile.age}-year-old ${profile.occupation} with a dream to ${profile.dream}. `;

  // Income and Expenses
  story += `Currently, ${profile.name} earns ${profile.currency} ${totalIncomeAmount} per month but spends ${profile.currency} ${totalExpensesAmount}, leaving a cashflow of ${profile.currency} ${cashflow}. `;

  // Assets and Liabilities
  story += `They own assets worth ${profile.currency} ${totalAssetsAmount} and have liabilities of ${profile.currency} ${totalLiabilitiesAmount}, resulting in a net worth of ${profile.currency} ${netWorth}. `;

  // Passive Income Target
  if (cashflow < passiveIncomeTarget) {
    story += `Their goal is to achieve a passive income of ${profile.currency} ${passiveIncomeTarget}, but they are currently ${profile.currency} ${remainingToTarget} short. `;
  } else {
    story += `Congratulations! ${profile.name} has achieved their passive income target of ${profile.currency} ${passiveIncomeTarget}. `;
  }

  // Financial Health and Tips
  if (cashflow < passiveIncomeTarget) {
    story += `To bridge the gap, ${profile.name} needs to focus on increasing income or reducing expenses. `;
    if (totalLiabilitiesAmount > totalAssetsAmount) {
      story += `They should also consider paying off liabilities to improve their net worth. `;
    }
    if (totalIncomeAmount < totalExpensesAmount) {
      story += `Their expenses are higher than their income, which is a red flag. Cutting unnecessary spending is crucial. `;
    }
    if (totalAssetsAmount < totalLiabilitiesAmount) {
      story += `Their liabilities outweigh their assets, which could lead to financial stress. Focus on building assets. `;
    }
  } else {
    story += `They are financially free and can now focus on growing their wealth further. `;
  }

  // Relatable Journey
  story += `The journey hasn't been easy. ${profile.name} has faced setbacks like unexpected expenses and fluctuating income. `;
  story += `However, they've also made progress by investing in assets and reducing liabilities. `;
  story += `The key to their success has been consistent tracking and making informed financial decisions. `;

  // Actionable Insights
  if (remainingToTarget > 0) {
    story += `To reach their passive income target, ${profile.name} needs to generate an additional ${profile.currency} ${remainingToTarget} per month. `;
    story += `This can be achieved by increasing income streams, reducing expenses, or investing in assets that generate passive income. `;
  } else {
    story += `Now that they've achieved financial freedom, ${profile.name} can focus on giving back, mentoring others, or exploring new opportunities. `;
  }

  // Final Motivation
  story += `Remember, financial freedom is a journey, not a destination. Keep tracking, keep improving, and you'll get there!`;

  financialStory.textContent = story;
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

// Convert Currency
function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (amount && from && to) {
    const convertedAmount = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
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

  profile.incomeStatement.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.name;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// Save Entry
function saveEntry() {
  const type = document.getElementById('entryType').value;
  const amount = parseFloat(document.getElementById('entryAmount').value);
  const description = document.getElementById('entryDescription').value.trim();
  const category = document.getElementById('entryCategory').value || document.getElementById('newCategory').value.trim();

  if (!category || isNaN(amount) || amount <= 0 || !description) {
    alert('Please fill all fields correctly');
    return;
  }

  const currentMonth = getCurrentMonth();
  const monthExists = profile.incomeStatement.months.some(m => m.month === currentMonth);

  if (!monthExists) {
    profile.incomeStatement.months.push({
      month: currentMonth,
      categories: [],
    });
  }

  const monthIndex = profile.incomeStatement.months.findIndex(m => m.month === currentMonth);
  const categoryExists = profile.incomeStatement.months[monthIndex].categories.some(c => c.name === category);

  if (!categoryExists) {
    profile.incomeStatement.months[monthIndex].categories.push({
      name: category,
      totalIncome: 0,
      totalExpenses: 0,
      entries: [],
    });
  }

  const catIndex = profile.incomeStatement.months[monthIndex].categories.findIndex(c => c.name === category);
  const entry = {
    date: new Date().toISOString().split("T")[0],
    description,
    amount,
    type,
  };

  if (type === 'income') {
    profile.incomeStatement.months[monthIndex].categories[catIndex].totalIncome += amount;
  } else {
    profile.incomeStatement.months[monthIndex].categories[catIndex].totalExpenses += amount;
  }

  profile.incomeStatement.months[monthIndex].categories[catIndex].entries.push(entry);

  updateMonthlyTable();
  closeModal();
  saveDataToLocalStorage();
}

// Get Current Month
function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

// Update Monthly Table
function updateMonthlyTable() {
  const monthlyBody = document.getElementById('monthly-body');
  monthlyBody.innerHTML = '';

  profile.incomeStatement.months.forEach((monthData, monthIndex) => {
    const totalIncome = monthData.categories.reduce((sum, category) => {
      return sum + category.totalIncome;
    }, 0);
    const totalExpenses = monthData.categories.reduce((sum, category) => {
      return sum + category.totalExpenses;
    }, 0);
    const netIncome = totalIncome - totalExpenses;

    const row = document.createElement('tr');
    row.classList.add('expandable');
    row.innerHTML = `
      <td class="editable-date" onclick="editMonth(${monthIndex})">${monthData.month}</td>
      <td>${profile.currency} ${totalIncome}</td>
      <td>${profile.currency} ${totalExpenses}</td>
      <td>${profile.currency} ${netIncome}</td>
      <td>
        <button class="expand-button" onclick="expandCollapseRow(this.parentElement)">
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

    monthData.categories.forEach((category, catIndex) => {
      const categoryRow = document.createElement('tr');
      categoryRow.classList.add('expandable');
      categoryRow.innerHTML = `
        <td class="editable-date" onclick="editCategory(${monthIndex}, ${catIndex})">${category.name}</td>
        <td>${profile.currency} ${category.totalIncome}</td>
        <td>${profile.currency} ${category.totalExpenses}</td>
        <td>
          <button class="expand-button" onclick="expandCollapseRow(this.parentElement)">
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

      category.entries.forEach((entry, entryIndex) => {
        const dailyRow = document.createElement('tr');
        dailyRow.innerHTML = `
          <td class="editable-date" onclick="editEntry(${monthIndex}, ${catIndex}, ${entryIndex})">
            ${entry.date}
          </td>
          <td>${entry.description}</td>
          <td>${profile.currency} ${entry.amount}</td>
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

// Edit Month
function editMonth(monthIndex) {
  const newMonth = prompt("Edit Month:", profile.incomeStatement.months[monthIndex].month);
  if (newMonth) {
    profile.incomeStatement.months[monthIndex].month = newMonth;
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Edit Category
function editCategory(monthIndex, catIndex) {
  const newCategory = prompt("Edit Category:", profile.incomeStatement.months[monthIndex].categories[catIndex].name);
  if (newCategory) {
    profile.incomeStatement.months[monthIndex].categories[catIndex].name = newCategory;
    populateCategories();
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Edit Category Name
function editCategoryName(monthIndex, catIndex) {
  const newCategory = prompt("Edit Category Name:", profile.incomeStatement.months[monthIndex].categories[catIndex].name);
  if (newCategory) {
    profile.incomeStatement.months[monthIndex].categories[catIndex].name = newCategory;
    populateCategories();
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Duplicate Category
function duplicateCategory(monthIndex, catIndex) {
  const newCategory = {
    name: `${profile.incomeStatement.months[monthIndex].categories[catIndex].name} - Copy`,
    totalIncome: 0,
    totalExpenses: 0,
    entries: [],
  };
  profile.incomeStatement.months[monthIndex].categories.push(newCategory);
  populateCategories();
  updateMonthlyTable();
  saveDataToLocalStorage();
}

// Delete Category
function deleteCategory(monthIndex, catIndex) {
  if (confirm("Are you sure you want to delete this category?")) {
    profile.incomeStatement.months[monthIndex].categories.splice(catIndex, 1);
    populateCategories();
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Edit Entry
function editEntry(monthIndex, catIndex, entryIndex) {
  const entry = profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  if (newDescription !== null && !isNaN(newAmount)) {
    entry.description = newDescription;
    entry.amount = newAmount;
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Duplicate Entry
function duplicateEntry(monthIndex, catIndex, entryIndex) {
  const newEntry = {
    date: new Date().toISOString().split("T")[0],
    description: `Copy of ${profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex].description}`,
    amount: 0,
    type: profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex].type,
  };
  profile.incomeStatement.months[monthIndex].categories[catIndex].entries.push(newEntry);
  updateMonthlyTable();
  saveDataToLocalStorage();
}

// Delete Entry
function deleteEntry(monthIndex, catIndex, entryIndex) {
  if (confirm("Are you sure you want to delete this entry?")) {
    profile.incomeStatement.months[monthIndex].categories[catIndex].entries.splice(entryIndex, 1);
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Update Averages
function updateAverages() {
  const totalMonths = profile.incomeStatement.months.length || 1;
  const totalIncome = profile.incomeStatement.months.reduce((sum, month) => {
    return sum + month.categories.reduce((sumCat, category) => sumCat + category.totalIncome, 0);
  }, 0);
  const totalExpenses = profile.incomeStatement.months.reduce((sum, month) => {
    return sum + month.categories.reduce((sumCat, category) => sumCat + category.totalExpenses, 0);
  }, 0);
  const avgIncome = totalIncome / totalMonths;
  const avgExpenses = totalExpenses / totalMonths;
  const avgCashflow = avgIncome - avgExpenses;

  document.getElementById('average-income').textContent = `${profile.currency} ${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `${profile.currency} ${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `${profile.currency} ${avgCashflow.toFixed(2)}`;

  updateFinancialHealth();
    }
