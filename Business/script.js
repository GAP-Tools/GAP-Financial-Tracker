document.addEventListener('DOMContentLoaded', () => {
  // Initialize variables
  let businesses = [];
  let currentBusinessIndex = 0;
  let currencyRates = {};

  // DOM Elements
  const businessList = document.getElementById("businessList");
  const businessNameInput = document.getElementById("businessName");
  const businessDescriptionInput = document.getElementById("businessDescription");
  const currencySelect = document.getElementById("currency");
  const revenueTargetInput = document.getElementById("revenue-target");
  const incomeStatementBody = document.getElementById("income-statement-body");
  const balanceSheetBody = document.getElementById("balance-sheet-body");
  const totalIncome = document.getElementById("total-income");
  const totalExpenses = document.getElementById("total-expenses");
  const totalAssets = document.getElementById("total-assets");
  const totalLiabilities = document.getElementById("total-liabilities");
  const netWorthDisplay = document.getElementById("net-worth");
  const cashflowDisplay = document.getElementById("cashflow");
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
  const avgIncome = document.getElementById("avgIncome");
  const avgExpenses = document.getElementById("avgExpenses");
  const avgCashflow = document.getElementById("avgCashflow");

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
    .then(response => response.json())
    .then(data => {
      currencyRates = data.conversion_rates;
      populateCurrencyDropdowns();
      loadSavedData();
    });

  // Populate Currency Dropdowns
  function populateCurrencyDropdowns() {
    ['currency', 'fromCurrency', 'toCurrency'].forEach(id => {
      const select = document.getElementById(id);
      for (const currency in currencyRates) {
        const option = document.createElement("option");
        option.value = currency;
        option.text = `${currency} (${getCurrencySymbol(currency)})`;
        select.appendChild(option);
      }
    });
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
      businesses.push({
        name,
        description: "",
        currency: "USD",
        revenueTarget: 0,
        incomeStatement: [],
        balanceSheet: [],
      });
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
    businessDescriptionInput.value = business.description;
    currencySelect.value = business.currency;
    revenueTargetInput.value = business.revenueTarget;
    updateIncomeStatement();
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
  document.getElementById('switchLink').addEventListener('click', function() {
    window.location.href = 'https://gap-tools.github.io/GAP-Financial-Tracker/';
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
      businesses.splice(currentBusinessIndex, 1);
      if (businesses.length > 0) {
        currentBusinessIndex = 0;
        switchBusiness();
      } else {
        currentBusinessIndex = -1;
        resetUI();
      }
      updateBusinessList();
      saveDataToLocalStorage();
      alert("Business Deleted!");
    }
  }

  function resetUI() {
    businessDescriptionInput.value = "";
    currencySelect.value = "USD";
    revenueTargetInput.value = "";
    incomeStatementBody.innerHTML = "";
    balanceSheetBody.innerHTML = "";
    totalIncome.textContent = "0";
    totalExpenses.textContent = "0";
    totalAssets.textContent = "0";
    totalLiabilities.textContent = "0";
    netWorthDisplay.textContent = "0";
    healthChart.data.datasets[0].data = [0];
    healthChart.update();
    healthPercentage.textContent = "0%";
    healthTips.textContent = "";
  }

  // Add Income/Expense
  function addTransaction(type) {
    const business = businesses[currentBusinessIndex];
    const date = prompt("Enter Date (YYYY-MM-DD):");
    const description = prompt("Enter Description:");
    const amount = parseFloat(prompt(`Enter ${type} Amount:`));
    if (date && description && !isNaN(amount)) {
      business.incomeStatement.push({ date, description, type, amount });
      updateIncomeStatement();
      updateFinancialHealth();
      saveDataToLocalStorage();
    } else {
      alert("Invalid Input!");
    }
  }

  function addIncome() { addTransaction('Income'); }
  function addExpense() { addTransaction('Expense'); }

    // Add Asset/Liability
  function addAssetOrLiability(type) {
    const business = businesses[currentBusinessIndex];
    const date = prompt("Enter Date (YYYY-MM-DD):");
    const description = prompt("Enter Description:");
    const amount = parseFloat(prompt(`Enter ${type} Amount:`));
    if (date && description && !isNaN(amount)) {
      business.balanceSheet.push({ date, description, type, amount });
      updateBalanceSheet();
      updateFinancialHealth();
      saveDataToLocalStorage();
    } else {
      alert("Invalid Input!");
    }
  }

  function addAsset() { addAssetOrLiability('Asset'); }
  function addLiability() { addAssetOrLiability('Liability'); }

  // Update Income Statement
  function updateIncomeStatement() {
    const business = businesses[currentBusinessIndex];
    incomeStatementBody.innerHTML = "";
    const monthlyData = groupByMonth(business.incomeStatement);

    Object.keys(monthlyData).forEach(month => {
      const monthlySum = calculateMonthlySum(monthlyData[month]);
      const row = document.createElement("tr");
      row.className = "monthly-row";
      row.innerHTML = `
        ${month}
        ${business.currency} ${monthlySum.income.toFixed(2)}
        ${business.currency} ${monthlySum.expense.toFixed(2)}
        ${business.currency} ${(monthlySum.income - monthlySum.expense).toFixed(2)}
        🔽
      `;
      incomeStatementBody.appendChild(row);

      // Add Daily Entries
      const detailsRow = document.createElement("tr");
      detailsRow.className = "details";
      detailsRow.style.display = "none";
      const detailsTable = document.createElement("table");
      detailsTable.innerHTML = `
        
          
            Daily Date
            Description
            Income
            Expenses
            Action
          
        
        
          ${monthlyData[month].map(entry => `
            
              ${entry.date}
              ${entry.description}
              ${entry.type === "Income" ? `${business.currency} ${entry.amount.toFixed(2)}` : ""}
              ${entry.type === "Expense" ? `${business.currency} ${entry.amount.toFixed(2)}` : ""}
              
                ✏️
                📋
                📝
                🗑️
              
            
          `).join('')}
        
      `;
      detailsRow.appendChild(detailsTable);
      incomeStatementBody.appendChild(detailsRow);
    });

    updateIncomeSummary();
  }

  function toggleDetails(element) {
    const details = element.closest('.monthly-row').nextElementSibling;
    if (details.style.display === "none") {
      details.style.display = "table-row-group";
      element.textContent = "🔼";
    } else {
      details.style.display = "none";
      element.textContent = "🔽";
    }
  }

  function groupByMonth(entries) {
    return entries.reduce((acc, entry, index) => {
      const month = entry.date.split('-').slice(0, 2).join('-');
      entry.index = index;  // Store the original index
      if (!acc[month]) acc[month] = [];
      acc[month].push(entry);
      return acc;
    }, {});
  }

  function calculateMonthlySum(entries) {
    return entries.reduce((sum, entry) => {
      sum[entry.type.toLowerCase()] += entry.amount;
      return sum;
    }, { income: 0, expense: 0 });
  }

  function updateIncomeSummary() {
    const business = businesses[currentBusinessIndex];
    const monthlyData = groupByMonth(business.incomeStatement);
    const incomeSums = Object.values(monthlyData).map(calculateMonthlySum);
    const totalIncomeSum = incomeSums.reduce((total, sum) => total + sum.income, 0);
    const totalExpenseSum = incomeSums.reduce((total, sum) => total + sum.expense, 0);
    const totalCashflow = totalIncomeSum - totalExpenseSum;
    const monthCount = Object.keys(monthlyData).length;

    avgIncome.textContent = `${business.currency} ${(totalIncomeSum / monthCount).toFixed(2)}`;
    avgExpenses.textContent = `${business.currency} ${(totalExpenseSum / monthCount).toFixed(2)}`;
    avgCashflow.textContent = `${business.currency} ${(totalCashflow / monthCount).toFixed(2)}`;
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
        ${entry.date}
        ${entry.description}
        ${entry.type === "Asset" ? `${business.currency} ${entry.amount.toFixed(2)}` : ""}
        ${entry.type === "Liability" ? `${business.currency} ${entry.amount.toFixed(2)}` : ""}
        
          ✏️
          📋
          📝
          🗑️
        
      `;
      balanceSheetBody.appendChild(row);

      if (entry.type === "Asset") totalAssetsAmount += entry.amount;
      if (entry.type === "Liability") totalLiabilitiesAmount += entry.amount;
    });

    totalAssets.textContent = `${business.currency} ${totalAssetsAmount.toFixed(2)}`;
    totalLiabilities.textContent = `${business.currency} ${totalLiabilitiesAmount.toFixed(2)}`;
    const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
    netWorthDisplay.textContent = `${business.currency} ${netWorth.toFixed(2)}`;
  }

  // Edit Entry
  function editEntry(type, index) {
    const business = businesses[currentBusinessIndex];
    const entry = type === "income" ? business.incomeStatement[index] : business.balanceSheet[index];
    const newDate = flatpickr.prompt("Edit Date:", entry.date);
    const newDescription = prompt("Edit Description:", entry.description);
    const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
    if (newDate && newDescription && !isNaN(newAmount)) {
      entry.date = newDate;
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

  // Duplicate Entry
  function duplicateEntry(type, index) {
    const business = businesses[currentBusinessIndex];
    const originalEntry = type === "income" ? business.incomeStatement[index] : business.balanceSheet[index];
    const newEntry = { ...originalEntry };
    newEntry.date = flatpickr.prompt("Enter Date for New Entry:", new Date().toISOString().split('T')[0]);
    if (type === "income") {
      business.incomeStatement.push(newEntry);
      updateIncomeStatement();
    } else {
      business.balanceSheet.push(newEntry);
      updateBalanceSheet();
    }
    updateFinancialHealth();
    saveDataToLocalStorage();
  }

  // Copy Entry to Clipboard
  function copyEntry(type, index) {
    const business = businesses[currentBusinessIndex];
    const entry = type === "income" ? business.incomeStatement[index] : business.balanceSheet[index];
    const text = `${entry.date} - ${entry.description}: ${entry.amount}`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Entry copied to clipboard!");
    }, () => {
      alert("Failed to copy entry!");
    });
  }

  // Delete Entry
  function deleteEntry(type, index) {
    const business = businesses[currentBusinessIndex];
    if (confirm("Are you sure you want to delete this entry?")) {
      if (type === "income") business.incomeStatement.splice(index, 1);
      else business.balanceSheet.splice(index, 1);
      if (type === "income") updateIncomeStatement();
      else updateBalanceSheet();
      updateFinancialHealth();
      saveDataToLocalStorage();
    }
  }

  // Enhancements for the Date Picker

document.addEventListener('DOMContentLoaded', () => {
  // Assuming you've already defined the flatpickr function in your global scope or in another script

  // Custom function to handle date picker for adding new entries
  function datePickerPrompt(message, initialDate) {
    return new Promise((resolve) => {
      const flatpickrInstance = flatpickr(document.createElement('input'), {
        defaultDate: initialDate || new Date(),
        enableTime: false,
        dateFormat: "Y-m-d",
        onClose: function(selectedDates, dateStr, instance) {
          instance.destroy(); // Clean up the flatpickr instance
          resolve(dateStr);
        }
      });

      // Create a modal or overlay to position the date picker
      const modal = document.createElement('div');
      modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;";
      modal.appendChild(flatpickrInstance.element);
      
      document.body.appendChild(modal);

      // Optionally, add a close button or handle escape key for better user experience
      document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
          flatpickrInstance.destroy();
          document.body.removeChild(modal);
          document.removeEventListener('keydown', escapeHandler);
          resolve(null); // Signal that user cancelled
        }
      });

      modal.addEventListener('click', function(e) {
        if (e.target === modal) { // Click outside the date picker
          flatpickrInstance.destroy();
          document.body.removeChild(modal);
          document.removeEventListener('keydown', escapeHandler);
          resolve(null); // Signal that user cancelled
        }
      });
    });
  }

  // Update the existing functions to use this new date picker
  ['addIncome', 'addExpense', 'addAsset', 'addLiability', 'editEntry', 'duplicateEntry'].forEach(funcName => {
    const originalFunction = window[funcName];
    window[funcName] = async function(...args) {
      const promptForDate = async (message) => {
        const date = await datePickerPrompt(message);
        if (!date) throw new Error('Date selection cancelled'); // Handle cancellation
        return date;
      };

      try {
        // Replace the date prompt with our custom date picker prompt
        if (funcName === 'editEntry' || funcName === 'duplicateEntry') {
          let date;
          if (funcName === 'editEntry') {
            date = await promptForDate("Edit Date:", args[0] === 'income' ? businesses[currentBusinessIndex].incomeStatement[args[1]].date : businesses[currentBusinessIndex].balanceSheet[args[1]].date);
          } else {
            date = await promptForDate("Enter Date for New Entry:", new Date().toISOString().split('T')[0]);

  // Update Financial Health
  function updateFinancialHealth() {
    const business = businesses[currentBusinessIndex];
    const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(business.currency, ""));
    const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(business.currency, ""));
    const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(business.currency, ""));
    const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(business.currency, ""));
    const cashflow = totalIncomeAmount - totalExpensesAmount;

    const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
    const savingsRate = (totalIncomeAmount - totalExpensesAmount) / totalIncomeAmount || 0;
    const healthScore = Math.round((cashflow / business.revenueTarget) * 100);

    healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
    healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
    healthChart.update();

    healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
    healthTips.textContent = generateHealthTip(healthScore, totalIncomeAmount, totalExpensesAmount, totalAssetsAmount, totalLiabilitiesAmount, cashflow, business.revenueTarget);
  }

  // Get Health Color
  function getHealthColor(score) {
    if (score <= 39) return "#ff6384"; // Red
    if (score <= 59) return "#ffcd56"; // Yellow
    if (score <= 79) return "#4bc0c0"; // Green
    return "#36a2eb"; // Deeper Green
  }

  // Generate Health Tip
  function generateHealthTip(score, income, expenses, assets, liabilities, cashflow, revenueTarget) {
    const tips = [];
    if (score <= 39) {
      tips.push(
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
      );
    } else if (score <= 59) {
      tips.push(
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
    );
  } else if (score <= 79) {
    tips.push(
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
    );
  } else {
    tips.push(
      "Excellent! Your financial health is in great shape. Keep up the good work!",
      "You're doing amazing! Consider diversifying your investments to further grow your wealth.",
      "Your net worth is impressive. Keep focusing on building assets and reducing liabilities.",
      "You've achieved financial stability. Focus on giving back and helping others.",
      "Your financial health is exceptional. Consider mentoring others on financial management.",
      "You're a financial role model. Keep inspiring others with your success.",
      "Your wealth is growing steadily. Focus on legacy planning and philanthropy.",
      "You've mastered financial management. Consider exploring new investment opportunities.",
      "Your financial health is outstanding. Keep setting and achieving new goals.",
      "You're financially free. Enjoy the fruits of your hard work and smart decisions."
    );
  }

  // Add tips based on cashflow and revenue target
  if (cashflow < revenueTarget) {
    tips.push(
      "Your cashflow is below your revenue target. Focus on increasing income or reducing expenses.",
      "Consider investing in assets that generate passive income to bridge the gap.",
      "Your financial freedom goal is within reach. Keep working towards it!"
    );
  } else {
    tips.push(
      "Congratulations! Your cashflow exceeds your revenue target. You're financially free!",
      "You've achieved financial freedom. Consider reinvesting your surplus income to grow your wealth further.",
      "Your financial health is excellent. Focus on maintaining your freedom and exploring new opportunities."
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
      businesses.push(data);
      updateBusinessList();
      switchBusiness(businesses.length - 1);
      saveDataToLocalStorage();
      alert("Business Data Loaded!");
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
      incomeStatement: [],
      balanceSheet: [],
    };
    businessDescriptionInput.value = "";
    currencySelect.value = "USD";
    revenueTargetInput.value = "";
    updateIncomeStatement();
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
  const totalIncomeAmount = parseFloat(totalIncome.textContent.replace(business.currency, ""));
  const totalExpensesAmount = parseFloat(totalExpenses.textContent.replace(business.currency, ""));
  const totalAssetsAmount = parseFloat(totalAssets.textContent.replace(business.currency, ""));
  const totalLiabilitiesAmount = parseFloat(totalLiabilities.textContent.replace(business.currency, ""));
  const netWorth = totalAssetsAmount - totalLiabilitiesAmount;
  const cashflow = totalIncomeAmount - totalExpensesAmount;

  const story = `
    ${business.name}, a business focused on ${business.description}, has been tracking its finances diligently. 
    
    Its total income is ${business.currency} ${totalIncomeAmount}, while its expenses amount to ${business.currency} ${totalExpensesAmount}. 
    
    It owns assets worth ${business.currency} ${totalAssetsAmount} and has liabilities of ${business.currency} ${totalLiabilitiesAmount}, 
    resulting in a net worth of ${business.currency} ${netWorth}. 
    
    Its cashflow is ${business.currency} ${cashflow}, and its revenue target is ${business.currency} ${business.revenueTarget}. 
    
    TIPS: ${generateHealthTip(healthChart.data.datasets[0].data[0], totalIncomeAmount, totalExpensesAmount, totalAssetsAmount, totalLiabilitiesAmount, cashflow, business.revenueTarget)}
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
