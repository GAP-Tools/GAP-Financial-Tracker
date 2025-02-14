// Initialize variables
let businesses = []; // Array to store multiple businesses
let currentBusinessIndex = 0; // Index of the currently selected business

// DOM Elements
const businessList = document.getElementById("businessList");
const businessNameInput = document.getElementById("businessName");
const businessDescriptionInput = document.getElementById("businessDescription");
const currencySelect = document.getElementById("currency");
const revenueTargetInput = document.getElementById("revenue-target");
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
const businessFinancialStory = document.getElementById("businessFinancialStory");
const saveFileNameInput = document.getElementById("saveFileName");
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
    loadSavedData(); // Load saved data after currencies are fetched
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

// Add Business
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
    businessList.appendChild(option);
  });
}

// Switch Business
function switchBusiness() {
  currentBusinessIndex = parseInt(businessList.value) || currentBusinessIndex;
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
document.addEventListener('DOMContentLoaded', function() {
    var switchLink = document.getElementById('switchLink');
    if (switchLink) {
        switchLink.addEventListener('click', function() {
            window.location.href = 'https://gap-tools.github.io/GAP-Financial-Tracker/';
        });
    }
});

// Edit Revenue Target
function editRevenueTarget() {
  const newTarget = prompt("Enter New Revenue/Residual Income Target:", businesses[currentBusinessIndex].revenueTarget);
  if (newTarget && !isNaN(newTarget)) {
    businesses[currentBusinessIndex].revenueTarget = parseFloat(newTarget);
    revenueTargetInput.value = businesses[currentBusinessIndex].revenueTarget;
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Edit Business Name
function editBusinessName() {
  const newName = prompt("Enter New Business Name:", businesses[currentBusinessIndex].name);
  if (newName && newName.trim()) {
    businesses[currentBusinessIndex].name = newName.trim();
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
    businesses.splice(currentBusinessIndex, 1); // Remove the business from the array
    if (businesses.length > 0) {
      currentBusinessIndex = 0; // Switch to the first business
      switchBusiness();
    } else {
      // If no businesses are left, reset the UI
      currentBusinessIndex = -1;
      businessDescriptionInput.value = "";
      currencySelect.value = "USD";
      revenueTargetInput.value = "";
      document.getElementById('monthly-body').innerHTML = "";
      balanceSheetBody.innerHTML = "";
      totalAssets.textContent = "0";
      totalLiabilities.textContent = "0";
      netWorthDisplay.textContent = "0";
      healthChart.data.datasets[0].data = [0];
      healthChart.update();
      healthPercentage.textContent = "0%";
      healthTips.textContent = "";
    }
    updateBusinessList();
    saveDataToLocalStorage();
    alert("Business Deleted!");
  }
}

// Add Asset
function addAsset() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: "Asset", amount });
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Add Liability
function addLiability() {
  const business = businesses[currentBusinessIndex];
  const date = prompt("Enter Date (YYYY-MM-DD):");
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));
  if (date && description && amount) {
    business.balanceSheet.push({ date, description, type: "Liability", amount });
    updateBalanceSheet();
    updateFinancialHealth();
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
      <td>${entry.type === "Asset" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Liability" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editEntryBalance('balance', ${index})">✏️</button>
        <button onclick="deleteEntryBalance('balance', ${index})">🗑️</button>
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

// Edit Entry Balance
function editEntryBalance(type, index) {
  const business = businesses[currentBusinessIndex];
  const entry = business.balanceSheet[index];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  if (newDescription && !isNaN(newAmount)) {
    entry.description = newDescription;
    entry.amount = newAmount;
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

// Delete Entry Balance
function deleteEntryBalance(type, index) {
  const business = businesses[currentBusinessIndex];
  if (confirm("Are you sure you want to delete this entry?")) {
    business.balanceSheet.splice(index, 1);
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
  }
}

// Close Modal
function closeModal() {
  document.getElementById('entryModal').style.display = 'none';
}

// Update Financial Health
function updateFinancialHealth() {
  const business = businesses[currentBusinessIndex];
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(business.currency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(business.currency, ""));
  
  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;

  const healthScore = Math.round((netWorth / business.revenueTarget) * 100);
  
  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();

  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, netWorth, business.revenueTarget);
}

// Get Health Color
function getHealthColor(score) {
  if (score <= 39) return "#ff6384"; // Red
  if (score <= 59) return "#ffcd56"; // Yellow
  if (score <= 79) return "#4bc0c0"; // Green
  return "#36a2eb"; // Deeper Green
}

// Generate Health Tip
function generateHealthTip(score, netWorth, revenueTarget) {
  const tips = [];
  if (score <= 39) {
    tips.push(
      "Your liabilities exceed your assets. Consider reducing debts or increasing assets.",
      "Your net worth is negative. Focus on paying off debts to improve your financial health.",
      "High liabilities can lead to financial stress. Focus on reducing debts and building assets.",
      "Your financial health is in danger. Take immediate steps to reduce liabilities and increase assets.",
      "Your net worth is low compared to your revenue target. Work on improving it."
    );
  } else if (score <= 59) {
    tips.push(
      "Your net worth is marginally positive. Continue building assets and reducing liabilities.",
      "You're making progress. Keep working on reducing liabilities to improve your financial health.",
      "Your net worth is slightly lower than half your revenue target. Invest in assets to grow wealth.",
      "Your financial health is moderate. Strengthen your finances by increasing assets.",
      "Track your spending to identify areas where you can allocate more funds towards liabilities."
    );
  } else if (score <= 79) {
    tips.push(
      "Great job! Your net worth is growing. Keep building your assets.",
      "Your net worth is over half your revenue target. Maintain a healthy savings rate.",
      "Your financial health is good. Continue investing in assets to achieve your financial goals.",
      "Your net worth is steadily increasing. Consider diversifying your investments.",
      "Your financial habits are improving. Keep up the good work and stay committed to your goals."
    );
  } else {
    tips.push(
      "Congratulations! Your net worth exceeds your revenue target.",
      "You're financially free. Continue growing your wealth to create long-term financial stability.",
      "Your financial health is exceptional. Consider mentoring others on managing finances.",
      "Your net worth is outstanding. Focus on strategic investments and philanthropy.",
      "You've achieved financial freedom. Enjoy the fruits of your hard work and consider diversifying."
    );
  }

  return tips[Math.floor(Math.random() * tips.length)];
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
    businesses.forEach(business => {
      business.incomeStatement = business.incomeStatement || {
        months: [],
        categories: []
      };
    });
    updateBusinessList();
    switchBusiness(0);
  }
}

// Export Business Data
function exportBusinessData() {
  const fileName = saveFileNameInput.value.trim() || businesses[currentBusinessIndex].name;
  const data = businesses[currentBusinessIndex];
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();
}

// Import Business Data
function importBusinessData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      const business = businesses.find(b => b.name === data.name);
      if (business) {
        Object.assign(business, data);
        saveDataToLocalStorage();
        alert("Business Data Updated!");
      } else {
        businesses.push(data);
        updateBusinessList();
        switchBusiness(businesses.length - 1);
        saveDataToLocalStorage();
        alert("Business Data Imported!");
      }
      updateMonthlyTable();
      updateBalanceSheet();
      updateFinancialHealth();
    };
    reader.readAsText(file);
  };
  input.click();
}

// Clear Business Data
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
    businessDescriptionInput.value = "";
    currencySelect.value = "USD";
    revenueTargetInput.value = "";
    updateMonthlyTable();
    updateBalanceSheet();
    updateFinancialHealth();
    saveDataToLocalStorage();
    alert("Business Data Cleared!");
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

// Generate Business Financial Story
function generateBusinessStory() {
  const business = businesses[currentBusinessIndex];
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(business.currency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(business.currency, ""));
  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;

  const story = `
    ${business.name}, a business focused on ${business.description}, has been tracking its finances diligently. 

    Its total assets are ${business.currency} ${totalAssetsAmount}, and its liabilities amount to ${business.currency} ${totalLiabilitiesAmount}, resulting in a net worth of ${business.currency} ${netWorth}. 

    Its revenue target is ${business.currency} ${business.revenueTarget}. 

    TIPS: ${generateHealthTip(healthChart.data.datasets[0].data[0], netWorth, business.revenueTarget)}
  `;
  businessFinancialStory.textContent = story;
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

// Function to get the current month
function getCurrentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}`;
}

// Add new month if not exists
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

// Function to update monthly table
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
    
    // Add category table
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

// Function to update category table
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
    
    // Add daily table
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

// Function to update daily table
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

// Function to show the entry modal
function showEntryModal(type) {
  document.getElementById('entryType').value = type;
  document.getElementById('entryModal').style.display = 'block';
  populateCategories();
}

// Function to populate categories in the modal
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

// Function to save the entry
function saveEntry() {
  const type = document.getElementById('entryType').value;
  let amount = document.getElementById('entryAmount').value;
  const description = document.getElementById('entryDescription').value;
  const category = document.getElementById('entryCategory').value || document.getElementById('newCategory').value;
  
  if (!category || isNaN(amount) || !description) {
    alert('Please fill all fields');
    return;
  }
  
  amount = parseFloat(amount);
  
  const business = businesses[currentBusinessIndex];
  const date = new Date();
  const month = getCurrentMonth();
  
  // Update categories
  if (!business.incomeStatement.categories.some(c => c.name === category)) {
    business.incomeStatement.categories.push({ name: category, type: type });
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
    date: date.toLocaleDateString(),
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

// Function to update averages
function updateAverages() {
  const business = businesses[currentBusinessIndex];
  const months = business.incomeStatement.months;
  const totalMonths = months.length || 1;
  
  const totalIncomes = months.reduce((sum, m) => sum + m.totalIncome, 0);
  const totalExpenses = months.reduce((sum, m) => sum + m.totalExpenses, 0);
  const totalCashflow = totalIncomes - totalExpenses;
  
  const avgIncome = (totalIncomes / totalMonths).toFixed(2);
  const avgExpenses = (totalExpenses / totalMonths).toFixed(2);
  const avgCashflow = (totalCashflow / totalMonths).toFixed(2);
  
  document.getElementById('average-income').textContent = `${business.currency} ${avgIncome}`;
  document.getElementById('average-expenses').textContent = `${business.currency} ${avgExpenses}`;
  document.getElementById('average-cashflow').textContent = `${business.currency} ${avgCashflow}`;
  
  // Update financial health score
  const healthScore = Math.round((totalCashflow / business.revenueTarget) * 100);
  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.update();
  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
}

// Function to add event listeners for table rows
document.addEventListener('click', function(e) {
  if (e.target.closest('.expandable')) {
    const nested = e.target.closest('tr').nextElementSibling;
    nested.style.display = nested.style.display === 'none' ? 'table-row' : 'none';
  }
});

// Function to delete a month
function deleteMonth(index) {
  const business = businesses[currentBusinessIndex];
  if (confirm("Are you sure you want to delete this month's data?")) {
    business.incomeStatement.months.splice(index, 1);
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Function to delete a category
function deleteCategory(monthIndex, categoryIndex) {
  const business = businesses[currentBusinessIndex];
  if (confirm("Are you sure you want to delete this category?")) {
    business.incomeStatement.months[monthIndex].categories.splice(categoryIndex, 1);
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Function to delete an entry
function deleteEntry(monthIndex, categoryIndex, entryIndex) {
  const business = businesses[currentBusinessIndex];
  if (confirm("Are you sure you want to delete this entry?")) {
    business.incomeStatement.months[monthIndex].categories[categoryIndex].entries.splice(entryIndex, 1);
    updateMonthlyTable();
    saveDataToLocalStorage();
  }
}

// Function to handle date picker
function updateEntryDate() {
  const business = businesses[currentBusinessIndex];
  const entryAmount = document.getElementById('entryAmount');
  entryAmount.placeholder = `Amount (${business.currency})`;
  entryAmount.value = '';
}
