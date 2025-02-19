// Initialize variables
let businesses = []; // Array to store multiple businesses
let currentBusinessIndex = 0; // Index of the currently selected business
let currencyRates = {}; // Currency exchange rate data

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
    const apiUrl = "https://v6.exchangerate-api.com/v6/eb5cfc3ff6c3b48bb6f60c83/latest/USD";
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
    currencySelect.innerHTML = ''; // Clear existing options
    for (const currency in currencyRates) {
        const newOption = document.createElement("option");
        newOption.value = currency;
        newOption.text = `${currency} (${getCurrencySymbol(currency)})`;
        currencySelect.add(newOption);
    }
}

// Get Currency Symbol
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
    if (businesses.length === 0) currentBusinessIndex = -1;
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
    updateFundAllocationTable();
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

// Edit Revenue Target
function editRevenueTarget() {
    const business = businesses[currentBusinessIndex];
    const newTarget = prompt("Enter New Revenue/Residual Income Target:", business.revenueTarget);
    if (newTarget && !isNaN(+newTarget)) {
        business.revenueTarget = +newTarget;
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
    if (businesses.length === 0) return;
    if (confirm("Are you sure you want to delete this business?")) {
        businesses.splice(currentBusinessIndex, 1);
        if (businesses.length > 0) {
            currentBusinessIndex = Math.min(currentBusinessIndex, businesses.length - 1);
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

// Show Entry Modal
function showEntryModal(type) {
    document.getElementById('entryModal').style.display = 'block';
    document.getElementById('entryType').value = type;
    document.getElementById('entryCategory').disabled = false;
    document.getElementById('entryCategory').value = '';
    document.getElementById('categorySelectDiv').style.display = 'block';
    populateCategories();
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

    business.fundAllocations.categories.forEach(category => {
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
        const totalIncome = monthData.categories.reduce((sum, category) => {
            return sum + category.entries.reduce((s, entry) => {
                return (entry.type === 'income' && entry.amount > 0) ? s + entry.amount : s;
            }, 0);
        }, 0);
        const totalExpenses = monthData.categories.reduce((sum, category) => {
            return sum + category.entries.reduce((s, entry) => {
                return (entry.type === 'expense' && entry.amount > 0) ? s + entry.amount : s;
            }, 0);
        }, 0);

        const row = document.createElement('tr');
        row.classList.add('expandable');
        row.innerHTML = `
      <td class="editable-date" onclick="editDate('month', ${monthIndex})">${getFormattedMonth(monthData.month)}</td>
      <td>${business.currency} ${totalIncome}</td>
      <td>${business.currency} ${totalExpenses}</td>
      <td>${business.currency} ${totalIncome - totalExpenses}</td>
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
        <td class="editable-date" onclick="editCategory(${monthIndex}, ${catIndex})">${category.name}</td>
        <td>${business.currency} ${category.entries.reduce((sum, entry) => 
            entry.type === 'income' && entry.amount > 0 ? sum + entry.amount : sum, 0
        )}</td>
        <td>${business.currency} ${category.entries.reduce((sum, entry) => 
            entry.type === 'expense' && entry.amount > 0 ? sum + entry.amount : sum, 0
        )}</td>
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

            (category.entries || []).forEach((entry, entryIndex) => {
                const entryDate = new Date(entry.date);
                const formattedDate = entryDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
                const dailyRow = document.createElement('tr');
                dailyRow.innerHTML = `
          <td class="editable-date" onclick="editEntry(${monthIndex}, ${catIndex}, ${entryIndex})">
            ${formattedDate}
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

function getFormattedMonth(monthString) {
    const dateObj = new Date(`${monthString}-01`);
    return dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
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

    if (isNaN(amount) || amount < 0 || !description || !category) {
        alert('Invalid input. Please fill all fields correctly.');
        return;
    }

    const business = businesses[currentBusinessIndex];
    const currentMonth = getCurrentMonth();
    let monthObject;
    let categoryObject;

    // Update or create month
    if (!business.incomeStatement.months.some(m => m.month === currentMonth)) {
        business.incomeStatement.months.push({
            month: currentMonth,
            categories: [],
        });
    }
    monthObject = business.incomeStatement.months.find(m => m.month === currentMonth);

    // Update or create category
    if (!monthObject.categories.some(cat => cat.name === category)) {
        monthObject.categories.push({
            name: category,
            entries: [],
        });
    }
    categoryObject = monthObject.categories.find(cat => cat.name === category);

    // Create new entry
    categoryObject.entries.push({
        date: new Date().toISOString().split("T")[0],
        description,
        amount: parseFloat(amount),
        type: type === 'income' ? 'income' : 'expense',
    });

    // Sync fund allocations
    syncFundAllocations();

    updateMonthlyTable();
    updateFundAllocationTable();
    closeModal();
    saveDataToLocalStorage();
}

function getCurrentMonth() {
    const date = new Date();
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month < 10 ? `0${month}` : month;
    return `${year}-${month}`;
}

// Data Management
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
            alert("Data imported successfully!");
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
        updateMonthlyTable();
        updateBalanceSheet();
        updateFinancialHealth();
        saveDataToLocalStorage();
    }
}

// Data Storage
function saveDataToLocalStorage() {
    localStorage.setItem("financialTrackerData", JSON.stringify(businesses));
    localStorage.setItem("financialTrackerBackup", JSON.stringify(businesses));
}

function loadSavedData() {
    const savedData = JSON.parse(localStorage.getItem("financialTrackerData"));
    businesses = savedData || [];
    updateBusinessList();
    loadBackup();
}

function loadBackup() {
    const backupData = JSON.parse(localStorage.getItem("financialTrackerBackup"));
    if (backupData) {
        businesses = backupData;
        updateBusinessList();
        switchBusiness(0);
        alert("Data restored from backup!");
    }
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

function deleteLastCharacter() {
    calculatorInput.value = calculatorInput.value.slice(0, -1);
}

function toggleCalculator() {
    calculatorPopup.style.display = calculatorPopup.style.display === "block" ? "none" : "block";
}

// Financial Health Calculations
function updateAverages() {
    const business = businesses[currentBusinessIndex];
    const months = business.incomeStatement.months || [];
    const totalMonths = months.length || 1;

    const avgIncome = months.reduce((sum) => {
        return sum + months.reduce((s, month) => {
            return s + month.categories.reduce((ss, category) => {
                return ss + category.entries.reduce((sss, entry) => {
                    return (entry.type === 'income' && entry.amount > 0) ? sss + entry.amount : sss;
                }, 0);
            }, 0);
        }, 0);
    }, 0) / totalMonths;

    const avgExpenses = months.reduce((sum) => {
        return sum + months.reduce((s, month) => {
            return s + month.categories.reduce((ss, category) => {
                return ss + category.entries.reduce((sss, entry) => {
                    return (entry.type === 'expense' && entry.amount > 0) ? sss + entry.amount : sss;
                }, 0);
            }, 0);
        }, 0);
    }, 0) / totalMonths;

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

    healthChart.data.datasets[0].data = [Math.min(healthScore, 100)];
    healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
    healthChart.update();

    healthPercentage.textContent = `${Math.min(healthScore, 100)}%`;
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
    const avgIncome = parseFloat(document.getElementById("average-income").textContent.replace(business.currency, "").trim());
    const avgExpenses = parseFloat(document.getElementById("average-expenses").textContent.replace(business.currency, "").trim());
    const avgCashflow = parseFloat(document.getElementById("average-cashflow").textContent.replace(business.currency, "").trim());
    const totalAssets = parseFloat(document.getElementById("total-assets").textContent.replace(business.currency, "").trim());
    const totalLiabilities = parseFloat(document.getElementById("total-liabilities").textContent.replace(business.currency, "").trim());

    const story = `
    ${business.name}, a business specialized in ${business.description}, 
    recorded an average monthly income of ${business.currency} ${avgIncome}, 
    with average expenses at ${business.currency} ${avgExpenses}, 
    resulting in a net cashflow of ${business.currency} ${avgCashflow}. 
    Currently, the business holds assets worth ${business.currency} ${totalAssets} 
    and liabilities amounting to ${business.currency} ${totalLiabilities}, 
    yielding a net worth of ${business.currency} ${totalAssets - totalLiabilities}.
    ${generateHealthTip(healthChart.data.datasets[0].data[0], avgCashflow, business.revenueTarget)}
  `;

    businessFinancialStory.textContent = story;
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
    }
}

function editCategory(monthIndex, catIndex) {
    const newName = prompt("Edit Category Name:", businesses[currentBusinessIndex].incomeStatement.months[monthIndex].categories[catIndex].name);
    if (newName) {
        businesses[currentBusinessIndex].incomeStatement.months[monthIndex].categories[catIndex].name = newName;
        populateCategories();
        updateMonthlyTable();
        syncFundAllocations();
        updateFundAllocationTable();
        saveDataToLocalStorage();
    }
}

function editEntry(monthIndex, catIndex, entryIndex) {
    const entry = businesses[currentBusinessIndex].incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
    const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
    const newDescription = prompt("Edit Description:", entry.description);

    if (!isNaN(newAmount) && newDescription) {
        entry.amount = newAmount;
        entry.description = newDescription;

        syncFundAllocations();
        updateMonthlyTable();
        updateFundAllocationTable();
        saveDataToLocalStorage();
    }
}

// Fund Allocation Functions
function addAllocationCategory() {
    const business = businesses[currentBusinessIndex];
    const newCategory = document.getElementById("newAllocationCategory").value;
    const newPercentage = parseFloat(document.getElementById("newAllocationPercentage").value);

    if (newCategory && !isNaN(newPercentage) && newPercentage > 0) {
        const totalPercentage = business.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
        if (totalPercentage + newPercentage > 100) {
            alert("Total percentage exceeds 100%");
            return;
        }
        business.fundAllocations.categories.push({
            name: newCategory,
            percentage: newPercentage,
            balance: 0,
            transactions: [],
        });
        populateAllocationCategories();
        syncFundAllocations();
        updateFundAllocationTable();
        saveDataToLocalStorage();
    } else {
        alert("Invalid input. Please enter a valid percentage and category name.");
    }
}

function saveAllocations() {
    const business = businesses[currentBusinessIndex];
    const totalPercentage = business.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (totalPercentage === 100) {
        closeAllocationModal();
        syncFundAllocations();
        updateFundAllocationTable();
        saveDataToLocalStorage();
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
    const business = businesses[currentBusinessIndex];
    const categoryList = document.getElementById("allocationCategories");
    categoryList.innerHTML = "";
    business.fundAllocations.categories.forEach((cat, index) => {
        const li = document.createElement("li");
        li.innerHTML = ` ${cat.name} (${cat.percentage}%) <button onclick="editAllocationCategory(${index})">✎</button> <button onclick="deleteAllocationCategory(${index})">🗑️</button> `;
        categoryList.appendChild(li);
    });
}

function editAllocationCategory(index) {
    const business = businesses[currentBusinessIndex];
    const category = business.fundAllocations.categories[index];
    const newCategoryName = prompt("Edit Category Name:", category.name);
    const newPercentage = parseFloat(prompt("Edit Percentage:", category.percentage));

    if (newCategoryName && !isNaN(newPercentage) && newPercentage > 0) {
        category.name = newCategoryName;
        category.percentage = newPercentage;
        const totalPercentage = business.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
        if (totalPercentage === 100) {
            populateAllocationCategories();
            syncFundAllocations();
            updateFundAllocationTable();
            saveDataToLocalStorage();
        } else {
            alert("Total percentage must be exactly 100%");
        }
    }
}

function deleteAllocationCategory(index) {
    const business = businesses[currentBusinessIndex];
    if (confirm("Are you sure you want to delete this category?")) {
        business.fundAllocations.categories.splice(index, 1);
        populateAllocationCategories();
        syncFundAllocations();
        updateFundAllocationTable();
        saveDataToLocalStorage();
    }
}

function syncFundAllocations() {
    const business = businesses[currentBusinessIndex];
    if (!business) return;

    // Reset all fund allocations
    business.fundAllocations.categories.forEach(cat => {
        cat.balance = 0;
        cat.transactions = [];
    });

    // Allocate income
    (business.incomeStatement.months || []).forEach(month => {
        (month.categories || []).forEach(category => {
            (category.entries || []).forEach(entry => {
                if (entry.type === 'income' && category.name === 'General Income') {
                    const amount = entry.amount;
                    business.fundAllocations.categories.forEach(fundCat => {
                        const allocatedAmount = amount * (fundCat.percentage / 100);
                        fundCat.balance += allocatedAmount;
                        fundCat.transactions.push({
                            date: entry.date,
                            amount: allocatedAmount,
                            type: 'income',
                            description: entry.description,
                        });
                    });
                } else if (entry.type === 'income') {
                    const fundCat = business.fundAllocations.categories.find(fc => fc.name === category.name);
                    if (fundCat) {
                        fundCat.balance += entry.amount;
                        fundCat.transactions.push({
                            date: entry.date,
                            amount: entry.amount,
                            type: 'income',
                            description: entry.description,
                        });
                    }
                }
            });
        });
    });

    // Deduct expenses
    (business.incomeStatement.months || []).forEach(month => {
        (month.categories || []).forEach(category => {
            (category.entries || []).forEach(entry => {
                if (entry.type === 'expense') {
                    const expenseCat = category.name;
                    const fundCat = business.fundAllocations.categories.find(fc => fc.name === expenseCat);
                    if (fundCat) {
                        fundCat.balance -= entry.amount;
                        fundCat.transactions.push({
                            date: entry.date,
                            amount: -entry.amount,
                            type: 'expense',
                            description: entry.description,
                        });
                    }
                }
            });
        });
    });
}

function updateFundAllocationTable() {
    const business = businesses[currentBusinessIndex];
    const body = document.getElementById('fund-allocation-body');
    body.innerHTML = '';
    business.fundAllocations.categories.forEach(cat => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${cat.name}</td>
        <td>${cat.percentage}%</td>
        <td>${business.currency} ${parseFloat(cat.balance).toFixed(2)}</td>
        <td>
            <button onclick="viewCategoryTransactions(${business.fundAllocations.categories.indexOf(cat)})">View</button>
        </td>
    `;
        body.appendChild(row);
    });
}

function viewCategoryTransactions(categoryIndex) {
    const business = businesses[currentBusinessIndex];
    const category = business.fundAllocations.categories[categoryIndex];
    if (!category) return;
    const summaryText = document.getElementById('transactionSummaryText');
    summaryText.innerHTML = '';
    category.transactions.forEach(transaction => {
        if (transaction.amount !== 0) { // Filter out zero-amount transactions
            const paragraph = document.createElement('p');
            paragraph.textContent = `On ${transaction.date}, ${transaction.amount} ${transaction.type} transaction for ${transaction.description}.`;
            summaryText.appendChild(paragraph);
        }
    });
    document.getElementById('transactionSummaryModal').style.display = 'block';
}

function closeSummaryModal() {
    document.getElementById('transactionSummaryModal').style.display = 'none';
}

function clearData() {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
        localStorage.removeItem("financialTrackerData");
        localStorage.removeItem("financialTrackerBackup");
        location.reload();
    }
}

// Backup and Restore
function backupData() {
    localStorage.setItem("financialTrackerBackup", JSON.stringify(businesses));
}

function restoreData() {
    const backup = localStorage.getItem("financialTrackerBackup");
    if (backup) {
        const confirmed = confirm("A backup was found. Do you want to restore it?");
        if (confirmed) {
            businesses = JSON.parse(backup);
            updateBusinessList();
            switchBusiness(0);
            alert("Data restored from backup!");
        }
    }
}

window.addEventListener("beforeunload", () => {
    backupData();
});

window.addEventListener("load", () => {
    restoreData();
});

// Add Balance Sheet Entries
function addBalanceSheetEntry(type) {
    const business = businesses[currentBusinessIndex];
    const description = prompt("Enter Description:");
    const amount = parseFloat(prompt("Enter Amount:"));
    const date = new Date().toISOString().split("T")[0];

    if (description && !isNaN(amount) && amount >= 0) {
        business.balanceSheet.push({
            date,
            description,
            amount,
            type: type.toLowerCase(),
        });
        updateBalanceSheet();
        saveDataToLocalStorage();
    } else {
        alert("Invalid Input!");
    }
}

function updateBalanceSheet() {
    const business = businesses[currentBusinessIndex];
    balanceSheetBody.innerHTML = "";
    let totalAssetsAmount = 0;
    let totalLiabilitiesAmount = 0;

    business.balanceSheet.forEach((entry, index) => {
        const row = document.createElement("tr");
        const entryDate = new Date(entry.date);
        const formattedDate = entryDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        row.innerHTML = `
      <td>${formattedDate}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "asset" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "liability" ? `${business.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editBalanceSheetEntry(${index})">✎</button>
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

function editBalanceSheetEntry(index) {
    const business = businesses[currentBusinessIndex];
    const entry = business.balanceSheet[index];
    const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
    const newDescription = prompt("Edit Description:", entry.description);
    const newDate = prompt("Edit Date:", entry.date);

    if (!isNaN(newAmount) && newDescription && newDate && newAmount >= 0) {
        entry.amount = newAmount;
        entry.description = newDescription;
        entry.date = newDate;
        updateBalanceSheet();
        saveDataToLocalStorage();
    } else {
        alert("Invalid Input!");
    }
}

function duplicateBalanceSheetEntry(index) {
    const business = businesses[currentBusinessIndex];
    const entry = business.balanceSheet[index];
    const newEntry = {
        date: entry.date, // Same date as original
        description: `${entry.description} (copy)`,
        amount: 0, // Set amount to zero
        type: entry.type,
    };
    business.balanceSheet.push(newEntry);
    updateBalanceSheet();
    saveDataToLocalStorage();
}

function deleteBalanceSheetEntry(index) {
    const business = businesses[currentBusinessIndex];
    if (confirm("Are you sure you want to delete this entry?")) {
        business.balanceSheet.splice(index, 1);
        updateBalanceSheet();
        saveDataToLocalStorage();
    }
}

// Duplicate and Delete Entries
function duplicateEntry(monthIndex, catIndex, entryIndex) {
    const business = businesses[currentBusinessIndex];
    const entry = business.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
    const newDescription = `${entry.description} (copy)`;

    business.incomeStatement.months[monthIndex].categories[catIndex].entries.push({
        date: entry.date, // Same date as original
        description: newDescription,
        amount: 0, // Set amount to zero
        type: entry.type,
    });

    syncFundAllocations();
    updateMonthlyTable();
    updateFundAllocationTable();
    saveDataToLocalStorage();
}

function deleteEntry(monthIndex, catIndex, entryIndex) {
    const business = businesses[currentBusinessIndex];
    if (confirm("Are you sure you want to delete this entry?")) {
        business.incomeStatement.months[monthIndex].categories[catIndex].entries.splice(entryIndex, 1);

        syncFundAllocations();
        updateMonthlyTable();
        updateFundAllocationTable();
        saveDataToLocalStorage();
    }
    }
