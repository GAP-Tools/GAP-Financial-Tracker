// Initialize variables
let businesses = [];
let currentBusinessIndex = -1;
let currencyRates = {};
const CURRENCY_API_KEY = 'YOUR_API_KEY';

// DOM Elements
const elements = {
    businessName: document.getElementById('businessName'),
    businessList: document.getElementById('businessList'),
    currency: document.getElementById('currency'),
    fromCurrency: document.getElementById('fromCurrency'),
    toCurrency: document.getElementById('toCurrency'),
    conversionResult: document.getElementById('conversionResult'),
    monthlyTableBody: document.getElementById('monthlyTableBody'),
    balanceSheetBody: document.getElementById('balance-sheet-body'),
    totalAssets: document.getElementById('total-assets'),
    totalLiabilities: document.getElementById('total-liabilities'),
    netWorth: document.getElementById('net-worth'),
    healthChart: new Chart(document.getElementById('healthChart'), {
        type: 'doughnut',
        data: {
            labels: ['Health'],
            datasets: [{
                data: [0],
                backgroundColor: ['#2c836d']
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false
        }
    }),
    healthPercentage: document.getElementById('healthPercentage'),
    healthTips: document.getElementById('healthTips'),
    financialStory: document.getElementById('financialStory')
};

// Initialize application
init();

async function init() {
    await fetchCurrencyRates();
    loadData();
    if (businesses.length > 0) switchBusiness(0);
}

// Currency functions
async function fetchCurrencyRates() {
    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${CURRENCY_API_KEY}/latest/USD`);
        const data = await response.json();
        currencyRates = data.conversion_rates;
        populateCurrencyDropdowns();
    } catch (error) {
        console.error('Error fetching currency rates:', error);
    }
}

function populateCurrencyDropdowns() {
    const currencies = Object.keys(currencyRates);
    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        elements.currency.appendChild(option.cloneNode(true));
        elements.fromCurrency.appendChild(option.cloneNode(true));
        elements.toCurrency.appendChild(option.cloneNode(true));
    });
}

// Business functions
function addBusiness() {
    const name = elements.businessName.value.trim();
    if (!name) return;
    
    const newBusiness = {
        name,
        description: '',
        currency: 'USD',
        residualIncomeTarget: 0,
        transactions: [],
        assets: [],
        liabilities: []
    };
    
    businesses.push(newBusiness);
    saveData();
    updateBusinessList();
    switchBusiness(businesses.length - 1);
    elements.businessName.value = '';
}

function updateBusinessList() {
    elements.businessList.innerHTML = businesses
        .map((business, index) => `<option value="${index}">${business.name}</option>`)
        .join('');
}

function switchBusiness(index) {
    currentBusinessIndex = index;
    updateUI();
}

// Transaction functions
function addIncomeEntry() {
    addTransaction('income');
}

function addExpenseEntry() {
    addTransaction('expense');
}

function addTransaction(type) {
    const amount = parseFloat(prompt(`Enter ${type} amount:`));
    if (isNaN(amount)) return;
    
    const description = prompt(`Enter ${type} description:`);
    if (!description) return;
    
    const transaction = {
        id: Date.now(),
        date: new Date().toISOString(),
        type,
        amount: type === 'income' ? amount : -amount,
        description
    };
    
    businesses[currentBusinessIndex].transactions.push(transaction);
    saveData();
    updateUI();
}

// Update UI
function updateUI() {
    const business = businesses[currentBusinessIndex];
    updateMonthlyTable(business);
    updateBalanceSheet(business);
    updateFinancialHealth(business);
    updateAverages(business);
}

function updateMonthlyTable(business) {
    const monthlyData = groupByMonth(business.transactions);
    elements.monthlyTableBody.innerHTML = Object.entries(monthlyData)
        .map(([month, data]) => `
            <tr>
                <td>${formatMonth(month)}</td>
                <td>$${data.income.toFixed(2)}</td>
                <td>$${Math.abs(data.expenses).toFixed(2)}</td>
                <td>$${(data.income + data.expenses).toFixed(2)}</td>
                <td>
                    <button class="btn-secondary" onclick="deleteTransaction('${month}')">🗑️</button>
                </td>
            </tr>
        `).join('');
}

function updateAverages(business) {
    const monthlyData = groupByMonth(business.transactions);
    const months = Object.keys(monthlyData).length || 1;
    
    const totalIncome = Object.values(monthlyData).reduce((sum, data) => sum + data.income, 0);
    const totalExpenses = Object.values(monthlyData).reduce((sum, data) => sum + data.expenses, 0);
    
    // Add this section to your Income Statement HTML
    document.getElementById('average-income').textContent = `$${(totalIncome / months).toFixed(2)}`;
    document.getElementById('average-expenses').textContent = `$${(Math.abs(totalExpenses) / months).toFixed(2)}`;
    document.getElementById('average-cashflow').textContent = `$${((totalIncome + totalExpenses) / months).toFixed(2)}`;
}

// Helper functions
function groupByMonth(transactions) {
    return transactions.reduce((acc, transaction) => {
        const month = new Date(transaction.date).toISOString().slice(0, 7);
        if (!acc[month]) {
            acc[month] = { income: 0, expenses: 0 };
        }
        if (transaction.amount > 0) {
            acc[month].income += transaction.amount;
        } else {
            acc[month].expenses += transaction.amount;
        }
        return acc;
    }, {});
}

function formatMonth(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Add this to your Income Statement HTML section:
<div class="totals">
    <div class="total-line">
        <span>Average Income:</span> <span id="average-income">$0</span>
    </div>
    <div class="total-line">
        <span>Average Expenses:</span> <span id="average-expenses">$0</span>
    </div>
    <div class="total-line">
        <span>Average Cash Flow:</span> <span id="average-cashflow">$0</span>
    </div>
</div>
