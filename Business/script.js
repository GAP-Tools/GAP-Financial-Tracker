let businesses = [];
let currentBusinessIndex = -1;
let currencyRates = {};

function populateCurrencyDropdown() {
    fetch("https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD")
        .then(response => response.json())
        .then(data => {
            currencyRates = data.conversion_rates;
            const currencySelect = document.getElementById('currency');
            for (const currency in currencyRates) {
                const option = document.createElement("option");
                option.value = currency;
                option.text = `${currency} (${getCurrencySymbol(currency)})`;
                currencySelect.appendChild(option);
            }
        });
}

function getCurrencySymbol(currency) {
    const symbols = {
        USD: "$", EUR: "€", GBP: "£", NGN: "₦", JPY: "¥", INR: "₹", AUD: "A$", CAD: "C$", CHF: "CHF", CNY: "¥",
    };
    return symbols[currency] || currency;
}

function addBusiness() {
    const name = prompt("Enter Business Name:");
    if (name) {
        businesses.push({
            name: name,
            description: "",
            currency: "USD",
            revenueTarget: 0,
            incomeStatement: [],
            balanceSheet: []
        });
        updateBusinessList();
        switchBusiness(businesses.length - 1);
    }
}

function updateBusinessList() {
    const list = document.getElementById('businessList');
    list.innerHTML = '';
    businesses.forEach((business, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.text = business.name;
        list.appendChild(option);
    });
}

function switchBusiness() {
    currentBusinessIndex = parseInt(document.getElementById('businessList').value);
    const business = businesses[currentBusinessIndex];
    document.getElementById('businessName').value = business.name;
    document.getElementById('businessDescription').value = business.description;
    document.getElementById('currency').value = business.currency;
    document.getElementById('revenueTarget').value = business.revenueTarget;
    updateIncomeStatement();
    updateBalanceSheet();
    updateFinancialHealth();
}

function saveBusinessProfile() {
    if (currentBusinessIndex >= 0) {
        const business = businesses[currentBusinessIndex];
        business.name = document.getElementById('businessName').value;
        business.description = document.getElementById('businessDescription').value;
        business.currency = document.getElementById('currency').value;
        business.revenueTarget = parseFloat(document.getElementById('revenueTarget').value) || 0;
        updateBusinessList();
    }
}

function addTransaction(type, tableId) {
    const date = promptForDate("Enter Date (YYYY-MM-DD):");
    const description = prompt("Enter Description:");
    const amount = parseFloat(prompt("Enter Amount:"));
    if (date && description && !isNaN(amount)) {
        businesses[currentBusinessIndex][tableId].push({ date, description, type, amount });
        if (tableId === 'incomeStatement') updateIncomeStatement();
        else updateBalanceSheet();
        updateFinancialHealth();
    }
}

function promptForDate(message) {
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.valueAsDate = new Date();
    const result = prompt(message, dateInput.outerHTML);
    if (result) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = result;
        return tempDiv.querySelector('input').value;
    }
    return null;
}

function addIncome() { addTransaction('Income', 'incomeStatement'); }
function addExpense() { addTransaction('Expense', 'incomeStatement'); }
function addAsset() { addTransaction('Asset', 'balanceSheet'); }
function addLiability() { addTransaction('Liability', 'balanceSheet'); }

function updateIncomeStatement() {
    const business = businesses[currentBusinessIndex];
    const body = document.getElementById('incomeStatementBody');
    body.innerHTML = '';
    const grouped = groupByMonth(business.incomeStatement);

    Object.entries(grouped).forEach(([month, entries]) => {
        const monthlySum = entries.reduce((sum, entry) => {
            sum[entry.type] = (sum[entry.type] || 0) + entry.amount;
            return sum;
        }, {});
        const row = document.createElement('tr');
        row.className = 'monthly-row';
        row.innerHTML = `
            ${month}
            ${formatCurrency(monthlySum.Income || 0)}
            ${formatCurrency(monthlySum.Expense || 0)}
            ${formatCurrency((monthlySum.Income || 0) - (monthlySum.Expense || 0))}
            🔽
        `;
        body.appendChild(row);

        const details = document.createElement('tr');
        details.className = 'details';
        details.innerHTML = `${entries.map(entry => `
                
            `).join('')}
${entry.date}	${entry.description}	${entry.type === 'Income' ? formatCurrency(entry.amount) : ''}	${entry.type === 'Expense' ? formatCurrency(entry.amount) : ''}	
                        ✏️
                        📋
                        📝
                        🗑️
                    
`;
        body.appendChild(details);
    });

    updateIncomeSummary();
}

function toggleDetails(element) {
    const details = element.closest('.monthly-row').nextElementSibling;
    if (details.style.display === "none" || !details.style.display) {
        details.style.display = "table-row";
        element.textContent = "🔼";
    } else {
        details.style.display = "none";
        element.textContent = "🔽";
    }
}

function groupByMonth(entries) {
    return entries.reduce((acc, entry, index) => {
        const date = new Date(entry.date);
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
        entry.index = index;
        acc[monthYear] = acc[monthYear] || [];
        acc[monthYear].push(entry);
        return acc;
    }, {});
}

function updateIncomeSummary() {
    const business = businesses[currentBusinessIndex];
    const grouped = groupByMonth(business.incomeStatement);
    const monthlySums = Object.values(grouped).map(entries => entries.reduce((sum, entry) => {
        sum[entry.type] = (sum[entry.type] || 0) + entry.amount;
        return sum;
    }, {}));
    
    const avgIncome = monthlySums.reduce((sum, m) => sum + (m.Income || 0), 0) / monthlySums.length || 0;
    const avgExpense = monthlySums.reduce((sum, m) => sum + (m.Expense || 0), 0) / monthlySums.length || 0;
    const avgCashflow = avgIncome - avgExpense;

    document.getElementById('avgIncome').textContent = formatCurrency(avgIncome);
    document.getElementById('avgExpenses').textContent = formatCurrency(avgExpense);
    document.getElementById('avgCashflow').textContent = formatCurrency(avgCashflow);
}

function updateBalanceSheet() {
    const business = businesses[currentBusinessIndex];
    const body = document.getElementById('balanceSheetBody');
    body.innerHTML = '';
    const totals = { Asset: 0, Liability: 0 };

    business.balanceSheet.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            ${entry.date}
            ${entry.description}
            ${entry.type === 'Asset' ? formatCurrency(entry.amount) : ''}
            ${entry.type === 'Liability' ? formatCurrency(entry.amount) : ''}
            
                ✏️
                📋
                📝
                🗑️
            
        `;
        body.appendChild(row);
        totals[entry.type] += entry.amount;
    });

    document.getElementById('totalAssets').textContent = formatCurrency(totals.Asset);
    document.getElementById('totalLiabilities').textContent = formatCurrency(totals.Liability);
    document.getElementById('netWorth').textContent = formatCurrency(totals.Asset - totals.Liability);
}

function editEntry(tableId, index) {
    const entry = businesses[currentBusinessIndex][tableId][index];
    const newDate = promptForDate("Edit Date:", entry.date);
    const newDescription = prompt("Edit Description:", entry.description);
    const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
    if (newDate && newDescription && !isNaN(newAmount)) {
        entry.date = newDate;
        entry.description = newDescription;
        entry.amount = newAmount;
        if (tableId === 'incomeStatement') updateIncomeStatement();
        else updateBalanceSheet();
        updateFinancialHealth();
    }
}

function duplicateEntry(tableId, index) {
    const entry = businesses[currentBusinessIndex][tableId][index];
    const newEntry = { ...entry, date: promptForDate("Enter New Date:", entry.date) };
    businesses[currentBusinessIndex][tableId].push(newEntry);
    if (tableId === 'incomeStatement') updateIncomeStatement();
    else updateBalanceSheet();
    updateFinancialHealth();
}

function copyEntry(tableId, index) {
    const entry = businesses[currentBusinessIndex][tableId][index];
    const text = `${entry.date} - ${entry.description}: ${entry.amount}`;
    navigator.clipboard.writeText(text).then(() => alert("Copied to clipboard!"), () => alert("Copy failed."));
}

function deleteEntry(tableId, index) {
    if (confirm("Delete this entry?")) {
        businesses[currentBusinessIndex][tableId].splice(index, 1);
        if (tableId === 'incomeStatement') updateIncomeStatement();
        else updateBalanceSheet();
        updateFinancialHealth();
    }
}

function formatCurrency(amount) {
    const business = businesses[currentBusinessIndex];
    if (business) {
        return `${business.currency} ${amount.toFixed(2)}`;
    }
    return `${amount.toFixed(2)}`;
}

function updateFinancialHealth() {
    const business = businesses[currentBusinessIndex];
    if (!business) return;

    const incomeStatement = business.incomeStatement;
    const balanceSheet = business.balanceSheet;

    // Calculate Passive Income based on Kiyosaki's principles
    const passiveIncome = balanceSheet.filter(e => e.type === 'Asset').reduce((sum, asset) => sum + asset.amount, 0) * 0.05; // Assuming 5% return on assets
    document.getElementById('passiveIncome').textContent = formatCurrency(passiveIncome);

    const avgCashflow = parseFloat(document.getElementById('avgCashflow').textContent.replace(/[^0-9.-]+/g,""));
    const progress = (avgCashflow / business.revenueTarget) * 100;

    document.getElementById('progressToGoal').textContent = `${progress.toFixed(2)}%`;

    // Generate health tips
    let tips = [];
    if (progress < 50) {
        tips.push("Your business is facing hurdles. Aim to increase your passive income sources or decrease expenses.");
    } else if (progress < 80) {
        tips.push("You're on track but not there yet. Consider investing in assets that generate regular income.");
    } else {
        tips.push("Great progress! Keep building your asset base to ensure steady passive income.");
    }
    document.getElementById('healthTips').textContent = tips[Math.floor(Math.random() * tips.length)];
}

function generateStory() {
    const business = businesses[currentBusinessIndex];
    if (!business) return;

    const incomeStatement = business.incomeStatement;
    const balanceSheet = business.balanceSheet;
    const avgCashflow = parseFloat(document.getElementById('avgCashflow').textContent.replace(/[^0-9.-]+/g,""));
    const progress = (avgCashflow / business.revenueTarget) * 100;

    let story = `
${business.name}'s Financial Journey

    
Your business, focused on ${business.description}, has been on a rollercoaster of financial ups and downs. Starting from ${incomeStatement[0]?.date || "the beginning"}, you've seen:


    
`;

    // Analyze financial events
    incomeStatement.forEach(entry => {
        if (entry.type === 'Expense' && entry.amount > (avgCashflow * 2)) {
            story += `
A significant expense on ${entry.date}: ${entry.description} for ${formatCurrency(entry.amount)}. This might have been a hurdle!
`;
        } else if (entry.type === 'Income' && entry.amount > (avgCashflow * 2)) {
            story += `
A notable income boost on ${entry.date}: ${entry.description} brought in ${formatCurrency(entry.amount)}. A step forward!
`;
        }
    });

    story += `
With an average monthly cashflow of ${formatCurrency(avgCashflow)}, you're ${progress.toFixed(2)}% towards your financial freedom goal of ${formatCurrency(business.revenueTarget)}.


    
Here's how you can push forward:


    
`;

    // Tips based on current financial status
    if (progress < 50) {
        story += "
Focus on reducing liabilities and increasing assets.
";
        story += "
Seek new income streams that require minimal active involvement.
";
    } else if (progress < 80) {
        story += "
Continue to invest in assets that generate income.
";
        story += "
Consider scaling up operations if cashflow permits.
";
    } else {
        story += "
Maintain your momentum by reinvesting in growth opportunities.
";
        story += "
Plan for future expansion or diversification to keep the momentum going.
";
    }

    story += "
";

    document.getElementById('storyContent').innerHTML = story;
}

// Initialize
populateCurrencyDropdown();
if (businesses.length === 0) {
    addBusiness();
} else {
    updateBusinessList();
    switchBusiness(0);
}
