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

// Currency Functions
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

function populateCurrencyDropdowns() {
    currencySelect.innerHTML = '';
    for (const currency in currencyRates) {
        const option = document.createElement("option");
        option.value = currency;
        option.text = `${currency} (${getCurrencySymbol(currency)})`;
        currencySelect.add(option);
    }
}

function getCurrencySymbol(currency) {
    const symbols = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", JPY: "¥", INR: "₹" };
    return symbols[currency] || currency;
}

// Business Management
function addBusiness() {
    const name = businessNameInput.value.trim();
    if (name) {
        businesses.push({
            name,
            description: "",
            currency: "USD",
            revenueTarget: 0,
            incomeStatement: { months: [] },
            balanceSheet: [],
            fundAllocations: { categories: [], totalPercentage: 0 },
            generalRevenue: { balance: 0, transactions: [] },
        });
        updateBusinessList();
        switchBusiness(businesses.length - 1);
        businessNameInput.value = "";
        saveDataToLocalStorage();
    } else {
        alert("Please enter a business name!");
    }
}

function updateBusinessList() {
    businessList.innerHTML = "";
    businesses.forEach((business, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.text = business.name;
        businessList.add(option);
    });
}

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

function saveBusinessProfile() {
    const business = businesses[currentBusinessIndex];
    business.description = businessDescriptionInput.value;
    business.currency = currencySelect.value;
    business.revenueTarget = parseFloat(revenueTargetInput.value) || 0;
    alert("Business Profile Saved!");
    saveDataToLocalStorage();
}

function editRevenueTarget() {
    const business = businesses[currentBusinessIndex];
    const newTarget = prompt("New Revenue Target:", business.revenueTarget);
    if (newTarget && !isNaN(+newTarget)) {
        business.revenueTarget = +newTarget;
        saveBusinessProfile();
        updateFinancialHealth();
    }
}

function editBusinessName() {
    const business = businesses[currentBusinessIndex];
    const newName = prompt("New Business Name:", business.name);
    if (newName) {
        business.name = newName.trim();
        updateBusinessList();
        saveDataToLocalStorage();
    }
}

function deleteBusiness() {
    if (confirm("Delete this business?")) {
        businesses.splice(currentBusinessIndex, 1);
        if (businesses.length > 0) switchBusiness();
        else clearBusinessData();
        updateBusinessList();
        saveDataToLocalStorage();
    }
}

// Balance Sheet Functions
function addBalanceSheetEntry(type) {
    const business = businesses[currentBusinessIndex];
    const description = prompt("Description:");
    const amount = parseFloat(prompt("Amount:"));
    const date = new Date().toISOString().split("T")[0];

    if (description && amount) {
        business.balanceSheet.push({ date, description, amount, type });
        updateBalanceSheet();
        saveDataToLocalStorage();
    }
}

function updateBalanceSheet() {
    const business = businesses[currentBusinessIndex];
    balanceSheetBody.innerHTML = "";
    let assets = 0, liabilities = 0;

    business.balanceSheet.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.description}</td>
            <td>${entry.type === 'asset' ? business.currency + ' ' + entry.amount : ''}</td>
            <td>${entry.type === 'liability' ? business.currency + ' ' + entry.amount : ''}</td>
            <td>
                <button onclick="editBalanceEntry(${index})">✎</button>
                <button onclick="deleteBalanceEntry(${index})">🗑️</button>
            </td>
        `;
        balanceSheetBody.appendChild(row);
        if (entry.type === 'asset') assets += entry.amount;
        if (entry.type === 'liability') liabilities += entry.amount;
    });

    totalAssets.textContent = `${business.currency} ${assets}`;
    totalLiabilities.textContent = `${business.currency} ${liabilities}`;
    netWorthDisplay.textContent = `${business.currency} ${assets - liabilities}`;
}

function editBalanceEntry(index) {
    const business = businesses[currentBusinessIndex];
    const entry = business.balanceSheet[index];
    const newAmount = parseFloat(prompt("New Amount:", entry.amount));
    const newDesc = prompt("New Description:", entry.description);
    const newDate = prompt("New Date:", entry.date);

    if (newAmount && newDesc && newDate) {
        entry.amount = newAmount;
        entry.description = newDesc;
        entry.date = newDate;
        updateBalanceSheet();
        saveDataToLocalStorage();
    }
}

function deleteBalanceEntry(index) {
    if (confirm("Delete this entry?")) {
        businesses[currentBusinessIndex].balanceSheet.splice(index, 1);
        updateBalanceSheet();
        saveDataToLocalStorage();
    }
}

// Income Statement Functions
function showEntryModal(type) {
    document.getElementById('entryModal').style.display = 'block';
    document.getElementById('entryType').value = type;
    document.getElementById('entryCategory').disabled = type === 'income';
    document.getElementById('categorySelectDiv').style.display = type === 'income' ? 'none' : 'block';
    populateCategories();
}

function closeModal() { document.getElementById('entryModal').style.display = 'none'; }

function populateCategories() {
    const select = document.getElementById('entryCategory");
    select.innerHTML = '<option value="">Select Category</option>';
    businesses[currentBusinessIndex].fundAllocations.categories.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.name;
        option.text = cat.name;
        select.add(option);
    });
}

function saveEntry() {
    const type = document.getElementById('entryType').value;
    const amount = parseFloat(document.getElementById('entryAmount').value);
    const description = document.getElementById('entryDescription').value.trim();
    const category = type === 'income' ? 'General Revenue' : document.getElementById('entryCategory').value;
    const business = businesses[currentBusinessIndex];
    const currentMonth = getCurrentMonth();

    if (!amount || !description || (type === 'expense' && !category)) {
        alert("Invalid input");
        return;
    }

    // Update monthly statement
    let month = business.incomeStatement.months.find(m => m.month === currentMonth);
    if (!month) {
        month = { month: currentMonth, categories: [] };
        business.incomeStatement.months.push(month);
    }

    let categoryObj = month.categories.find(c => c.name === category);
    if (!categoryObj) {
        categoryObj = { name: category, entries: [] };
        month.categories.push(categoryObj);
    }

    categoryObj.entries.push({
        date: new Date().toISOString().split("T")[0],
        description,
        amount,
        type: type === 'income' ? 'revenue' : 'expense'
    });

    // Update fund allocations
    if (type === 'income') {
        allocateRevenue(amount, description);
    } else {
        deductExpense(category, amount, description);
    }

    updateMonthlyTable();
    updateFundAllocationTable();
    closeModal();
    saveDataToLocalStorage();
}

function allocateRevenue(amount, description) {
    const business = businesses[currentBusinessIndex];
    business.fundAllocations.categories.forEach(cat => {
        const allocated = amount * (cat.percentage / 100);
        cat.balance += allocated;
        cat.transactions.push({
            date: new Date().toISOString().split("T")[0],
            amount: allocated,
            description,
            type: 'revenue'
        });
    });
    business.generalRevenue.balance += amount;
    business.generalRevenue.transactions.push({
        date: new Date().toISOString().split("T")[0],
        amount,
        description,
        type: 'revenue'
    });
}

function deductExpense(category, amount, description) {
    const business = businesses[currentBusinessIndex];
    const fundCat = business.fundAllocations.categories.find(c => c.name === category);
    if (fundCat) {
        fundCat.balance -= amount;
        fundCat.transactions.push({
            date: new Date().toISOString().split("T")[0],
            amount: -amount,
            description,
            type: 'expense'
        });
    }
    business.generalRevenue.balance -= amount;
    business.generalRevenue.transactions.push({
        date: new Date().toISOString().split("T")[0],
        amount: -amount,
        description,
        type: 'expense'
    });
}

function updateMonthlyTable() {
    const business = businesses[currentBusinessIndex];
    const monthlyBody = document.getElementById('monthly-body");
    monthlyBody.innerHTML = '';

    business.incomeStatement.months.forEach((month, monthIndex) => {
        // Calculate totals
        const totals = month.categories.reduce((acc, cat) => {
            cat.entries.forEach(entry => {
                entry.type === 'revenue' ? acc.revenue += entry.amount : acc.expense += entry.amount;
            });
            return acc;
        }, { revenue: 0, expense: 0 });

        // Create month row
        const monthRow = `
            <tr class="expandable">
                <td>${month.month}</td>
                <td>${business.currency} ${totals.revenue}</td>
                <td>${business.currency} ${totals.expense}</td>
                <td>${business.currency} ${totals.revenue - totals.expense}</td>
                <td><button class="expand-button">▼</button></td>
            </tr>
        `;
        monthlyBody.insertAdjacentHTML('beforeend', monthRow);

        // Create category rows
        const categoryRows = document.createElement('tr");
        categoryRows.className = 'nested';
        categoryRows.innerHTML = `
            <td colspan="5">
                <table class="category-table">
                    <thead>
                        <tr><th>Category</th><th>Revenue</th><th>Expenses</th><th>Actions</th></tr>
                    </thead>
                    <tbody id="category-${monthIndex}"></tbody>
                </table>
            </td>
        `;
        monthlyBody.appendChild(categoryRows);

        month.categories.forEach((cat, catIndex) => {
            const catTotals = cat.entries.reduce((acc, entry) => {
                entry.type === 'revenue' ? acc.revenue += entry.amount : acc.expense += entry.amount;
                return acc;
            }, { revenue: 0, expense: 0 });

            const catRow = `
                <tr class="expandable">
                    <td>${cat.name}</td>
                    <td>${business.currency} ${catTotals.revenue}</td>
                    <td>${business.currency} ${catTotals.expense}</td>
                    <td><button class="expand-button">▼</button></td>
                </tr>
            `;
            document.getElementById(`category-${monthIndex}`).insertAdjacentHTML('beforeend', catRow);

            // Create entry rows
            const entryRows = document.createElement('tr");
            entryRows.className = 'nested';
            entryRows.innerHTML = `
                <td colspan="4">
                    <table class="entry-table">
                        <thead>
                            <tr><th>Date</th><th>Description</th><th>Amount</th><th>Type</th><th>Actions</th></tr>
                        </thead>
                        <tbody id="entries-${monthIndex}-${catIndex}"></tbody>
                    </table>
                </td>
            `;
            document.getElementById(`category-${monthIndex}`).appendChild(entryRows);

            cat.entries.forEach((entry, entryIndex) => {
                const entryRow = `
                    <tr>
                        <td>${entry.date}</td>
                        <td>${entry.description}</td>
                        <td>${business.currency} ${entry.amount}</td>
                        <td>${entry.type}</td>
                        <td>
                            <button onclick="editEntry(${monthIndex}, ${catIndex}, ${entryIndex})">✎</button>
                            <button onclick="deleteEntry(${monthIndex}, ${catIndex}, ${entryIndex})">🗑️</button>
                        </td>
                    </tr>
                `;
                document.getElementById(`entries-${monthIndex}-${catIndex}`).insertAdjacentHTML('beforeend', entryRow);
            });
        });
    });
    updateAverages();
}

// Fund Allocation Functions
function showAllocationModal() {
    document.getElementById('allocationModal').style.display = 'block';
    populateAllocationCategories();
}

function addAllocationCategory() {
    const business = businesses[currentBusinessIndex];
    const name = document.getElementById('newAllocationCategory').value;
    const percentage = parseFloat(document.getElementById('newAllocationPercentage').value);

    if (name && percentage) {
        const total = business.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
        if (total + percentage > 100) {
            alert("Total allocation exceeds 100%");
            return;
        }
        business.fundAllocations.categories.push({
            name,
            percentage,
            balance: 0,
            transactions: []
        });
        populateAllocationCategories();
    }
}

function populateAllocationCategories() {
    const list = document.getElementById('allocationCategories");
    list.innerHTML = '';
    businesses[currentBusinessIndex].fundAllocations.categories.forEach((cat, index) => {
        const li = document.createElement('li");
        li.innerHTML = `
            ${cat.name} (${cat.percentage}%)
            <button onclick="editAllocation(${index})">✎</button>
            <button onclick="deleteAllocation(${index})">🗑️</button>
        `;
        list.appendChild(li);
    });
}

function saveAllocations() {
    const business = businesses[currentBusinessIndex];
    const total = business.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (total === 100) {
        closeAllocationModal();
        saveDataToLocalStorage();
    } else {
        alert("Total must be 100%");
    }
}

function closeAllocationModal() { document.getElementById('allocationModal').style.display = 'none'; }

// Data Management
function saveDataToLocalStorage() {
    localStorage.setItem("businessFinancialData", JSON.stringify(businesses));
}

function loadSavedData() {
    const data = JSON.parse(localStorage.getItem("businessFinancialData"));
    if (data) {
        businesses = data;
        updateBusinessList();
        switchBusiness(0);
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchCurrencyRates();
    loadSavedData();
    document.getElementById('switchLink').addEventListener('click', () => {
        window.location.href = "https://gap-tools.github.io/GAP-Financial-Tracker/Personal";
    });
});
