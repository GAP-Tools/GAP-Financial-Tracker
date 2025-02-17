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
const healthChart = new Chart(document.getElementById("healthChart").getContext("2d"), {
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
const healthPercentage = document.getElementById("healthPercentage");
const healthTips = document.getElementById("healthTips");
const currencySelect = document.getElementById("currency");
const passiveIncomeTargetInput = document.getElementById("passive-income-target");
const cashflowDisplay = document.getElementById("cashflow");
const saveFileNameInput = document.getElementById("saveFileName");
const calculatorPopup = document.getElementById("calculatorPopup");
const calculatorInput = document.getElementById("calculatorInput");
const entryModal = document.getElementById("entryModal");
const allocationModal = document.getElementById("allocationModal");
const transactionSummaryModal = document.getElementById("transactionSummaryModal");
const entryCategorySelect = document.getElementById("entryCategory");
const entryType = document.getElementById("entryType");
const financialStory = document.getElementById("financialStory");

document.addEventListener("DOMContentLoaded", function () {
    loadSavedData();
    fetchCurrencyRates();
});

function fetchCurrencyRates() {
    const apiUrl = "https://v6.exchangerate-api.com/v6/eb5cfc3ff6c3b48bb6f60c83/latest/USD";
    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            if (data.result === "success") {
                currencyRates = data.conversion_rates;
                populateCurrencyDropdowns();
                loadSavedData();
            }
        })
        .catch((error) => console.error("Error fetching currency rates:", error));
}

function populateCurrencyDropdowns() {
    Object.entries(currencyRates).forEach(([code, rate]) => {
        const option = new Option(`${code} (${getCurrencySymbol(code)})`, code);
        currencySelect.add(option);
    });
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

function saveProfile() {
    Object.assign(profile, {
        name: document.getElementById("name").value,
        age: document.getElementById("age").value,
        occupation: document.getElementById("occupation").value,
        dream: document.getElementById("dream").value,
        currency: currencySelect.value,
        passiveIncomeTarget: parseFloat(passiveIncomeTargetInput.value) || 0,
    });
    alert("Profile Saved!");
    saveDataToLocalStorage();
    updateFinancialHealth();
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

function loadSavedData() {
    const savedData = JSON.parse(localStorage.getItem("financialData") ?? "{}");
    Object.assign(profile, savedData);
    updateAllViews();
    populateCurrencyDropdowns();
    populateAllocationCategories();
}

function updateAllViews() {
    updateMonthlyTable();
    updateBalanceSheet();
    updateFinancialHealth();
    updateFundAllocationTable();
}

function getCurrentMonth() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentDate() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function showEntryModal(type) {
    entryModal.style.display = "block";
    document.getElementById("entryType").value = type;
    populateCategories();
    if (type === "income") {
        entryCategorySelect.disabled = true;
        entryCategorySelect.value = "General Income";
        document.getElementById("categorySelectDiv").style.display = "none";
    } else {
        entryCategorySelect.disabled = false;
        document.getElementById("categorySelectDiv").style.display = "block";
    }
    document.getElementById("entryAmount").value = "";
    document.getElementById("entryDescription").value = "";
}

function populateCategories() {
    entryCategorySelect.innerHTML = "<option value=''>Select Category</option>";
    profile.fundAllocations.categories.forEach((cat) => {
        const option = new Option(cat.name, cat.name);
        entryCategorySelect.add(option);
    });
}

function closeModal() {
    entryModal.style.display = "none";
    allocationModal.style.display = "none";
    transactionSummaryModal.style.display = "none";
}

function saveEntry() {
    const type = entryType.value;
    const amount = parseFloat(document.getElementById("entryAmount").value);
    const description = document.getElementById("entryDescription").value.trim();
    const category = entryCategorySelect.value;
    if (isNaN(amount) || amount <= 0 || !description) {
        alert("Please enter valid amount and description.");
        return;
    }
    const currentMonth = getCurrentMonth();
    let monthObject = profile.incomeStatement.months.find((m) => m.month === currentMonth);
    if (!monthObject) {
        profile.incomeStatement.months.push((monthObject = {
            month: currentMonth,
            categories: [],
            totalIncome: 0,
            totalExpenses: 0,
        }));
    }

    // Update category and income statement
    const processTransaction = (transactionType, categoryName) => {
        let categoryObject = monthObject.categories.find((cat) => cat.name === categoryName);
        if (!categoryObject) {
            monthObject.categories.push(
                (categoryObject = {
                    name: categoryName,
                    totalIncome: 0,
                    totalExpenses: 0,
                    entries: [],
                })
            );
        }
        const entry = {
            date: getCurrentDate(),
            description,
            amount,
            type: transactionType,
        };
        categoryObject.entries.push(entry);
        if (transactionType === "income") {
            categoryObject.totalIncome += amount;
            monthObject.totalIncome += amount;
            allocateIncome(amount, description);
        } else {
            categoryObject.totalExpenses += amount;
            monthObject.totalExpenses += amount;
            deductExpenseFromCategory(categoryObject.name, amount, description);
        }
    };

    if (type === "income") {
        processTransaction("income", "General Income");
    } else {
        if (!category) {
            alert("Please select a category for expenses.");
            return;
        }
        processTransaction("expense", category);
    }

    updateAllViews();
    saveDataToLocalStorage();
    closeModal();
}

function allocateIncome(amount, description) {
    profile.fundAllocations.categories.forEach((cat) => {
        const allocatedAmount = amount * (cat.percentage / 100);
        cat.balance += allocatedAmount;
        cat.transactions.push({
            date: getCurrentDate(),
            amount: allocatedAmount,
            type: "income",
            description,
        });
    });
    profile.generalIncome.balance += amount;
    profile.generalIncome.transactions.push({
        date: getCurrentDate(),
        amount,
        type: "income",
        description,
    });
}

function deductExpenseFromCategory(categoryName, amount, description) {
    const category = profile.fundAllocations.categories.find((cat) => cat.name === categoryName);
    if (category) {
        category.balance -= amount;
        category.transactions.push({
            date: getCurrentDate(),
            amount: -amount,
            type: "expense",
            description,
        });
    }
    profile.generalIncome.balance -= amount;
    profile.generalIncome.transactions.push({
        date: getCurrentDate(),
        amount: -amount,
        type: "expense",
        description,
    });
}

function duplicateEntry(type, monthIndex, catIndex, entryIndex) {
    const originalEntry = profile.incomeStatement.months[monthIndex].categories[catIndex].entries[entryIndex];
    const duplicatedEntry = {
        date: getCurrentDate(),
        description: `${originalEntry.description} (copy)`,
        amount: originalEntry.amount,
        type: originalEntry.type,
    };
    const category = profile.incomeStatement.months[monthIndex].categories[catIndex];
    category.entries.push(duplicatedEntry);

    if (type === "income") {
        category.totalIncome += duplicatedEntry.amount;
        profile.incomeStatement.months[monthIndex].totalIncome += duplicatedEntry.amount;
        allocateIncome(duplicatedEntry.amount, duplicatedEntry.description);
    } else {
        category.totalExpenses += duplicatedEntry.amount;
        profile.incomeStatement.months[monthIndex].totalExpenses += duplicatedEntry.amount;
        deductExpenseFromCategory(category.name, duplicatedEntry.amount, duplicatedEntry.description);
    }

    updateAllViews();
    saveDataToLocalStorage();
}

function deleteEntry(type, monthIndex, catIndex, entryIndex) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const category = profile.incomeStatement.months[monthIndex].categories[catIndex];
    const entry = category.entries.splice(entryIndex, 1)[0];
    if (type === "income") {
        category.totalIncome -= entry.amount;
        profile.incomeStatement.months[monthIndex].totalIncome -= entry.amount;
    } else {
        category.totalExpenses -= entry.amount;
        profile.incomeStatement.months[monthIndex].totalExpenses -= entry.amount;
    }

    // Reverse transactions
    profile.fundAllocations.categories.forEach((cat) => {
        if (type === "income") {
            cat.balance -= entry.amount * (cat.percentage / 100);
            const transactionsToRemove = cat.transactions.filter((tx) => tx.description === entry.description);
            transactionsToRemove.forEach((tx) => cat.transactions.splice(cat.transactions.indexOf(tx), 1));
        }
    });
    profile.generalIncome.balance -= (type === "income" ? entry.amount : -entry.amount);
    const generalTransactions = profile.generalIncome.transactions.filter((tx) => tx.description === entry.description);
    generalTransactions.forEach((tx) => profile.generalIncome.transactions.splice(profile.generalIncome.transactions.indexOf(tx), 1));

    updateAllViews();
    saveDataToLocalStorage();
}

function updateMonthlyTable() {
    incomeStatementBody.innerHTML = "";
    profile.incomeStatement.months.forEach((month, index) => {
        // Render month row
        const monthRow = document.createElement("tr");
        monthRow.innerHTML = `
            <td>${month.month}</td>
            <td>${profile.currency} ${month.totalIncome}</td>
            <td>${profile.currency} ${month.totalExpenses}</td>
            <td>${profile.currency} ${month.totalIncome - month.totalExpenses}</td>
            <td>
                <button onclick="editDate('month', ${index})">Edit</button>
                <button onclick="showCategoryDetails(${index})">View Categories</button>
            </td>
        `;
        incomeStatementBody.appendChild(monthRow);

        // Render categories
        month.categories.forEach((cat, catIndex) => {
            const categoryRow = document.createElement("tr");
            categoryRow.style.backgroundColor = "#f8f9fa";
            categoryRow.innerHTML = `
                <td>&nbsp;└─ ${cat.name}</td>
                <td>${profile.currency} ${cat.totalIncome}</td>
                <td>${profile.currency} ${cat.totalExpenses}</td>
                <td>${profile.currency} ${cat.totalIncome - cat.totalExpenses}</td>
                <td>
                    <button onclick="editCategory(${index}, ${catIndex})">Edit</button>
                    <button onclick="showEntries(${index}, ${catIndex})">View Entries</button>
                </td>
            `;
            incomeStatementBody.appendChild(categoryRow);

            // Render entries
            cat.entries.forEach((entry, entryIndex) => {
                const entryRow = document.createElement("tr");
                entryRow.style.backgroundColor = "#fff";
                entryRow.innerHTML = `
                    <td>&nbsp;&nbsp;&nbsp;&nbsp;└─ ${entry.date}</td>
                    <td>${profile.currency} ${entry.amount}</td>
                    <td>${description}</td>
                    <td>
                        <button onclick="editEntry('${entry.type}', ${index}, ${catIndex}, ${entryIndex})">Edit</button>
                        <button onclick="duplicateEntry('${entry.type}', ${index}, ${catIndex}, ${entryIndex})">Copy</button>
                        <button onclick="deleteEntry('${entry.type}', ${index}, ${catIndex}, ${entryIndex})">Delete</button>
                    </td>
                `;
                incomeStatementBody.appendChild(entryRow);
            });
        });
    });
}

function showCategoryDetails(monthIndex) {
    // Implement if needed
}

function editCategory(monthIndex, catIndex) {
    const category = profile.incomeStatement.months[monthIndex].categories[catIndex];
    const newCategory = prompt("Edit Category Name:", category.name);
    if (newCategory) {
        category.name = newCategory;
        saveDataToLocalStorage();
        updateMonthlyTable();
    }
}

function editDate(type, index) {
    const value = type === "month"
        ? profile.incomeStatement.months[index].month
        : profile.balanceSheet[index].date;
    const newValue = prompt("Edit Date:", value);
    if (newValue) {
        if (type === "month") {
            profile.incomeStatement.months[index].month = newValue;
        } else {
            profile.balanceSheet[index].date = newValue;
        }
        saveDataToLocalStorage();
        updateAllViews();
    }
}

function showEntries(monthIndex, catIndex) {
    const entries = profile.incomeStatement.months[monthIndex].categories[catIndex].entries;
    alert("Entries: " + entries.map((e) => `${e.date}: ${e.description} - ${e.amount}`).join("\n"));
}

function addAsset() {
    const asset = {
        date: prompt("Date (YYYY-MM-DD):", getCurrentDate()),
        description: prompt("Description:"),
        amount: parseFloat(prompt("Value:")),
        type: "Asset",
    };
    if (asset.date && asset.description && !isNaN(asset.amount)) {
        profile.balanceSheet.push(asset);
        saveDataToLocalStorage();
        updateBalanceSheet();
    }
}

function addLiability() {
    const liability = {
        date: prompt("Date (YYYY-MM-DD):", getCurrentDate()),
        description: prompt("Description:"),
        amount: parseFloat(prompt("Value:")),
        type: "Liability",
    };
    if (liability.date && liability.description && !isNaN(liability.amount)) {
        profile.balanceSheet.push(liability);
        saveDataToLocalStorage();
        updateBalanceSheet();
    }
}

function updateBalanceSheet() {
    balanceSheetBody.innerHTML = "";
    let totalAssets = 0;
    let totalLiabilities = 0;
    profile.balanceSheet.forEach((entry, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.description}</td>
            <td>${entry.type === "Asset" ? `${profile.currency} ${entry.amount}` : ""}</td>
            <td>${entry.type === "Liability" ? `${profile.currency} ${entry.amount}` : ""}</td>
            <td>
                <button onclick="editBalanceEntry(${index})">Edit</button>
                <button onclick="deleteBalanceEntry(${index})">Delete</button>
            </td>
        `;
        balanceSheetBody.appendChild(row);
        if (entry.type === "Asset") totalAssets += entry.amount;
        if (entry.type === "Liability") totalLiabilities += entry.amount;
    });
    totalAssets.textContent = `${profile.currency} ${totalAssets}`;
    totalLiabilities.textContent = `${profile.currency} ${totalLiabilities}`;
    netWorthDisplay.textContent = `${profile.currency} ${totalAssets - totalLiabilities}`;
}

function editBalanceEntry(index) {
    const entry = profile.balanceSheet[index];
    const newDate = prompt("New Date:", entry.date);
    const newDescription = prompt("New Description:", entry.description);
    const newAmount = parseFloat(prompt("New Value:", entry.amount));
    if (newDate && newDescription && !isNaN(newAmount)) {
        entry.date = newDate;
        entry.description = newDescription;
        entry.amount = newAmount;
        saveDataToLocalStorage();
        updateBalanceSheet();
    }
}

function deleteBalanceEntry(index) {
    if (confirm("Delete this entry?")) {
        profile.balanceSheet.splice(index, 1);
        saveDataToLocalStorage();
        updateBalanceSheet();
    }
}

function updateAverages() {
    const months = profile.incomeStatement.months;
    const avgIncome = months.reduce((sum, m) => sum + m.totalIncome, 0) / (months.length || 1);
    const avgExpenses = months.reduce((sum, m) => sum + m.totalExpenses, 0) / (months.length || 1);
    document.getElementById("average-income").textContent = `${profile.currency} ${avgIncome.toFixed(2)}`;
    document.getElementById("average-expenses").textContent = `${profile.currency} ${avgExpenses.toFixed(2)}`;
    document.getElementById("average-cashflow").textContent = `${profile.currency} ${Math.round(avgIncome - avgExpenses).toFixed(2)}`;
}

function updateFinancialHealth() {
    const avgCashflow = parseFloat(document.getElementById("average-cashflow").textContent.replace(profile.currency, "").trim());
    const healthScore = Math.min(100, Math.round((avgCashflow / (profile.passiveIncomeTarget || 1)) * 100));
    healthChart.data.datasets[0].data = [healthScore];
    healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
    healthChart.update();
    healthPercentage.textContent = healthScore + "%";
    healthTips.textContent = generateHealthTip(healthScore, avgCashflow, profile.passiveIncomeTarget);
}

function getHealthColor(score) {
    return score <= 39 ? "#ff6384" : score <= 59 ? "#ffcd56" : score <= 79 ? "#4bc0c0" : "#36a2eb";
}

function generateHealthTip(score, cashflow, target) {
    const tips = {
        39: ["Your expenses exceed income. Cut costs!"],
        59: ["Stabilizing but vulnerable. Build emergency funds."],
        79: ["Good progress! Aim for higher assets."],
        100: ["Excellent! Maintain wealth momentum."],
    }[score <= 39 ? 39 : score <= 59 ? 59 : score <= 79 ? 79 : 100];
    return `${tips?.[0] || "Unknown"}${cashflow < target ? " [Cashflow below target]" : ""}`;
}

function addAllocationCategory() {
    const category = prompt("New Category:");
    const percentage = parseFloat(prompt("Percentage Allocation:"));
    if (category && percentage > 0) {
        profile.fundAllocations.categories.push({ name: category, percentage, balance: 0, transactions: [] });
        saveDataToLocalStorage();
        populateAllocationCategories();
    }
}

function saveAllocations() {
    if (profile.fundAllocations.categories.reduce((s, c) => s + c.percentage, 0) !== 100) {
        alert("Total percentage must be exactly 100%");
        return;
    }
    saveDataToLocalStorage();
    updateFundAllocationTable();
}

function populateAllocationCategories() {
    const categoryList = document.getElementById("allocationCategories");
    categoryList.innerHTML = "";
    profile.fundAllocations.categories.forEach((cat, index) => {
        categoryList.innerHTML += `
            <li>${cat.name} (${cat.percentage}%)
                <button onclick="editAllocationCategory(${index})">Edit</button>
                <button onclick="deleteAllocationCategory(${index})">Delete</button>
            </li>
        `;
    });
}

function editAllocationCategory(index) {
    const cat = profile.fundAllocations.categories[index];
    const newName = prompt("New Categroy Name:", cat.name);
    const newPercentage = parseFloat(prompt("New Percentage:", cat.percentage));
    if (newName && newPercentage) {
        cat.name = newName;
        cat.percentage = newPercentage;
        saveDataToLocalStorage();
        populateAllocationCategories();
    }
}

function deleteAllocationCategory(index) {
    profile.fundAllocations.categories.splice(index, 1);
    saveDataToLocalStorage();
    populateAllocationCategories();
}

function updateFundAllocationTable() {
    const body = document.getElementById("fund-allocation-body");
    body.innerHTML = "";
    profile.fundAllocations.categories.forEach((cat) => {
        body.innerHTML += `
            <tr>
                <td>${cat.name}</td>
                <td>${cat.percentage}%</td>
                <td>${profile.currency} ${cat.balance}</td>
                <td>
                    <button onclick="viewCategoryTransactions(${profile.fundAllocations.categories.indexOf(cat)})">View</button>
                </td>
            </tr>
        `;
    });
}

function viewCategoryTransactions(categoryIndex) {
    const transactions = profile.fundAllocations.categories[categoryIndex]?.transactions ?? [];
    transactionSummaryModal.style.display = "block";
    document.getElementById("transactionSummaryText").innerHTML = transactions
        .map((tx) => `<p>${tx.date}: ${tx.description} (${profile.currency} ${tx.amount})</p>`)
        .join("");
}

function closeSummaryModal() {
    transactionSummaryModal.style.display = "none";
}

function generateStory() {
    const totalIncome = parseFloat(document.getElementById("average-income").textContent.replace(profile.currency, "").trim());
    const totalExpenses = parseFloat(document.getElementById("average-expenses").textContent.replace(profile.currency, "").trim());
    const totalAssets = parseFloat(totalAssets.textContent.replace(profile.currency, "").trim());
    const totalLiabilities = parseFloat(totalLiabilities.textContent.replace(profile.currency, "").trim());
    const netWorth = totalAssets - totalLiabilities;
    const story = `
        Profile Name: ${profile.name}\n
        Age: ${profile.age}\n
        Occupation: ${profile.occupation}\n
        Dream: ${profile.dream}\n
        Currency: ${profile.currency}\n
        Passive Income Target: ${profile.passiveIncomeTarget}\n
        Avg Monthly Income: ${profile.currency} ${totalIncome}\n
        Avg Monthly Expenses: ${profile.currency} ${totalExpenses}\n
        Avg Cashflow: ${profile.currency} ${totalIncome - totalExpenses}\n
        Total Assets: ${profile.currency} ${totalAssets}\n
        Total Liabilities: ${profile.currency} ${totalLiabilities}\n
        Net Worth: ${profile.currency} ${netWorth}\n
        Fund Allocations:
        ${profile.fundAllocations.categories.map((cat) => ` - ${cat.name}: ${profile.currency} ${cat.balance}`).join("\n")}
    `;
    financialStory.textContent = story.replace(/\\n/g, "\n");
}

function toggleCalculator() {
    calculatorPopup.style.display = calculatorPopup.style.display === "block" ? "none" : "block";
}

function appendToCalculator(value) {
    calculatorInput.value += value;
}

function calculateResult() {
    calculatorInput.value = eval(calculatorInput.value);
}

function clearCalculator() {
    calculatorInput.value = "";
}

function deleteLastCharacter() {
    calculatorInput.value = calculatorInput.value.slice(0, -1);
}

function saveDataToLocalStorage() {
    localStorage.setItem("financialData", JSON.stringify(profile));
}

function loadSavedData() {
    const savedData = JSON.parse(localStorage.getItem("financialData") ?? "{}");
    Object.assign(profile, savedData);
    updateCurrencyDropdown();
    updateAllViews();
    populateAllocationCategories();
}

function downloadApp() {
    window.open("https://www.appcreator24.com/app3480869-q98157", "_blank");
}

function exportData() {
    const fileName = saveFileNameInput.value || "financial_data.json";
    const blob = new Blob([JSON.stringify(profile)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

function importData() {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";
    fileInput.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            Object.assign(profile, data);
            saveDataToLocalStorage();
            updateAllViews();
        };
        reader.readAsText(e.target.files[0]);
    };
    fileInput.click();
}

function clearData() {
    if (confirm("Clear all data? This cannot be undone.")) {
        localStorage.removeItem("financialData");
        location.reload();
    }
}

function shareOnSocial(platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Check out this Financial Tracker!");
    switch (platform) {
        case "whatsapp":
            window.open("https://api.whatsapp.com/send?text=" + text + "%20" + url);
            break;
        case "facebook":
            window.open("https://www.facebook.com/sharer/sharer.php?u=" + url);
            break;
        case "twitter":
            window.open("https://twitter.com/intent/tweet?url=" + url + "&text=" + text);
            break;
    }
}

function updateCurrencyDropdown() {
    currencySelect.value = profile.currency || "USD";
}

window.toggleCalculator = toggleCalculator;
window.appendToCalculator = appendToCalculator;
window.calculateResult = calculateResult;
window.clearCalculator = clearCalculator;
window.deleteLastCharacter = deleteLastCharacter;
window.saveProfile = saveProfile;
window.editPassiveIncomeTarget = editPassiveIncomeTarget;
window.showEntryModal = showEntryModal;
window.closeModal = closeModal;
window.saveEntry = saveEntry;
window.duplicateEntry = duplicateEntry;
window.deleteEntry = deleteEntry;
window.addAsset = addAsset;
window.addLiability = addLiability;
window.updateBalanceSheet = updateBalanceSheet;
window.editBalanceEntry = editBalanceEntry;
window.deleteBalanceEntry = deleteBalanceEntry;
window.updateAverages = updateAverages;
window.updateFinancialHealth = updateFinancialHealth;
window.addAllocationCategory = addAllocationCategory;
window.saveAllocations = saveAllocations;
window.populateAllocationCategories = populateAllocationCategories;
window.editAllocationCategory = editAllocationCategory;
window.deleteAllocationCategory = deleteAllocationCategory;
window.updateFundAllocationTable = updateFundAllocationTable;
window.viewCategoryTransactions = viewCategoryTransactions;
window.closeSummaryModal = closeSummaryModal;
window.generateStory = generateStory;
window.downloadApp = downloadApp;
window.exportData = exportData;
window.importData = importData;
window.clearData = clearData;
window.shareOnSocial = shareOnSocial;
