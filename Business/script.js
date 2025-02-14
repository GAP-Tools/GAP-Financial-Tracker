let businesses = [];
let currentBusiness = {};
const localStorageKey = 'gapFinanceTracker';
const_switchLink = 'https://gap-tools.github.io/GAP-Financial-Tracker/';
const_currencyAPI = 'https://v6.exchangerate-api.com/v6/bbf3e2a38cee4116e7f051b8/latest/USD';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    fetchCurrencyData();
});

// Load saved data
function loadSavedData() {
    businesses = JSON.parse(localStorage.getItem(localStorageKey)) || [];
    if (businesses.length > 0) {
        currentBusiness = businesses[0];
        updateUI();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(localStorageKey, JSON.stringify(businesses));
}

// Add business
function addBusiness() {
    const name = document.getElementById('businessName').value.trim();
    if (name) {
        businesses.push({
            name: name,
            income: [],
            expenses: [],
            incomeCategories: {},
            expenseCategories: {}
        });
        currentBusiness = businesses[businesses.length - 1];
        populateBusinessList();
        updateUI();
        saveData();
    }
}
function populateBusinessList() {
    const select = document.getElementById('businessList');
    select.innerHTML = businesses.map(b => `<option>${b.name}</option>`).join('');
}

// Switch business
function switchBusiness() {
    const index = document.getElementById('businessList').selectedIndex;
    currentBusiness = businesses[index];
    updateUI();
}

function deleteBusiness() {
    businesses = businesses.filter(b => b.name !== currentBusiness.name);
    currentBusiness = businesses[0] || {};
    populateBusinessList();
    updateUI();
    saveData();
}

// Add financial entries
function showEntryModal(type) {
    document.getElementById('entryType').value = type;
    const modal = document.getElementById('entryModal');
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('entryModal');
    modal.style.display = 'none';
}

function addEntry() {
    const date = document.getElementById('entryDate').value;
    const desc = document.getElementById('entryDesc').value;
    const amount = parseFloat(document.getElementById('entryAmount').value);
    const type = document.getElementById('entryType').value;

    const entry = {
        date,
        description: desc,
        amount,
        type
    };

    if (type === 'income') {
        currentBusiness.income.push(entry);
        currentBusiness.incomeCategories[desc] = amount;
    } else if (type === 'expense') {
        currentBusiness.expenses.push(entry);
        currentBusiness.expenseCategories[desc] = amount;
    }

    closeModal();
    updateUI();
    saveData();
}

// Calculate financial metrics
function calculateCashflow() {
    const income = currentBusiness.income.reduce((total, entry) => total + entry.amount, 0);
    const expenses = currentBusiness.expenses.reduce((total, entry) => total + entry.amount, 0);
    return income - expenses;
}

function calculateHealthScore() {
    const targetResidual = parseFloat(document.getElementById('targetResidual').value) || 1000;
    const avgCashflow = calculateCashflow() / (currentBusiness.income.length + currentBusiness.expenses.length || 1);
    return Math.min(Math.max((avgCashflow / targetResidual) * 100, 0), 100);
}

// Update UI
function updateUI() {
    populateIncomeTable();
    populateBalanceSheet();
    updateHealthScore();
}

function populateIncomeTable() {
    const monthlyBody = document.getElementById('monthlyBody');
    monthlyBody.innerHTML = '';

    const currency = currentBusiness.currency || 'USD';

    let cashflow = calculateCashflow();
    const monthlyEntries = {};

    currentBusiness.income.forEach(entry => {
        const month = entry.date.split('-')[0] + '-' + entry.date.split('-')[1];
        if (!monthlyEntries[month]) {
            monthlyEntries[month] = { income: 0, expenses: 0 };
        }
        monthlyEntries[month].income += entry.amount;
    });

    currentBusiness.expenses.forEach(entry => {
        const month = entry.date.split('-')[0] + '-' + entry.date.split('-')[1];
        if (!monthlyEntries[month]) {
            monthlyEntries[month] = { income: 0, expenses: 0 };
        }
        monthlyEntries[month].expenses += entry.amount;
    });

    Object.keys(monthlyEntries).forEach(month => {
        const entry = monthlyEntries[month];
        const net = entry.income - entry.expenses;

        const row = `
            <tr>
                <td>${month}</td>
                <td>${currency} ${entry.income.toFixed(2)}</td>
                <td>${currency} ${entry.expenses.toFixed(2)}</td>
                <td>${currency} ${net.toFixed(2)}</td>
                <td>
                    <button onclick="expandCategory('${month}')">Expand</button>
                </td>
            </tr>
        `;

        monthlyBody.innerHTML += row;
    });
}

function populateBalanceSheet() {
    const balanceBody = document.getElementById('balanceBody');
    balanceBody.innerHTML = '';

    currentBusiness.assets.forEach(asset => {
        const row = `
            <tr>
                <td>Asset</td>
                <td>${asset.description}</td>
                <td>${currentBusiness.currency} ${asset.value}</td>
                <td>
                    <button onclick="editAsset('${asset.description}')">Edit</button>
                    <button onclick="deleteAsset('${asset.description}')">Delete</button>
                </td>
            </tr>
        `;
        balanceBody.innerHTML += row;
    });

    currentBusiness.liabilities.forEach(liability => {
        const row = `
            <tr>
                <td>Liability</td>
                <td>${liability.description}</td>
                <td>${currentBusiness.currency} ${liability.value}</td>
                <td>
                    <button onclick="editLiability('${liability.description}')">Edit</button>
                    <button onclick="deleteLiability('${liability.description}')">Delete</button>
                </td>
            </tr>
        `;
        balanceBody.innerHTML += row;
    });
}

function addAsset() {
    const description = prompt('Enter asset description:');
    const value = parseFloat(prompt('Enter asset value:'));
    if (description && !isNaN(value)) {
        currentBusiness.assets.push({ description, value });
        updateUI();
        saveData();
    }
}

function addLiability() {
    const description = prompt('Enter liability description:');
    const value = parseFloat(prompt('Enter liability value:'));
    if (description && !isNaN(value)) {
        currentBusiness.liabilities.push({ description, value });
        updateUI();
        saveData();
    }
}

function deleteAsset(description) {
    currentBusiness.assets = currentBusiness.assets.filter(a => a.description !== description);
    updateUI();
    saveData();
}

function deleteLiability(description) {
    currentBusiness.liabilities = currentBusiness.liabilities.filter(l => l.description !== description);
    updateUI();
    saveData();
}

// Health score and chart
function updateHealthScore() {
    const healthScore = calculateHealthScore();
    const avgCashflow = calculateCashflow() / (currentBusiness.income.length + currentBusiness.expenses.length || 1);

    document.getElementById('healthScore').textContent = `${healthScore.toFixed(2)}%`;
    document.getElementById('avgCash').textContent = `${avgCashflow.toFixed(2)}`;

    const chart = new Chart(document.getElementById('healthChart'), {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [healthScore, 100 - healthScore],
                backgroundColor: healthScore > 50 ? ['#2ecc71', '#3498db'] : ['#e74c3c', '#f39c12']
            }]
        },
        options: {
            cutout: '70%'
        }
    });
}

function updateHealthTip() {
    const tips = [
        'Your financial health is excellent! Keep up the good work.',
        'Your expenses are high. Try reducing discretionary spending.',
        ' Invest in assets to increase your residual income.',
        'High debt levels are impacting your cashflow negatively.'
    ];

    const healthTip = document.getElementById('healthTip');
    healthTip.textContent = tips[Math.floor(Math.random() * tips.length)];
}

// Currency converter
async function fetchCurrencyData() {
    try {
        const response = await fetch(_currencyAPI);
        const data = await response.json();
        populateCurrencyDropdowns(data);
    } catch (error) {
        console.error('Failed to fetch currency data:', error);
    }
}

function populateCurrencyDropdowns(data) {
    const currencySelect = document.getElementById('targetCurrency');
    Object.keys(data.conversion_rates).forEach(code => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = code;
        currencySelect.appendChild(option);
    });
}

// Calculator
function toggleCalculator() {
    const calculator = document.getElementById('calculator');
    calculator.classList.toggle('hidden');
}

function calc(key) {
    const display = document.getElementById('display');
    if (key === 'C') {
        display.value = '';
    } else if (key === '=') {
        try {
            display.value = eval(display.value);
        } catch (error) {
            display.value = 'Error';
        }
    } else {
        display.value += key;
    }
}
