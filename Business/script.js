// Business Data Structure
let businesses = [];
let currentBusiness = null;
let currencyRates = {};
let chartInstance = null;

const healthTips = {
    excellent: [
        "🌟 Excellent financial health! Keep up the great work!",
        "💡 Consider investing surplus funds for long-term growth",
        "📈 You're exceeding targets - maybe increase your goals?",
        "🛡️ Maintain an emergency fund for 6 months of expenses"
    ],
    good: [
        "👍 Solid financial position - keep maintaining discipline",
        "📊 Review monthly expenses for optimization opportunities",
        "💸 Consider paying down high-interest debts first",
        "📅 Schedule quarterly financial reviews"
    ],
    warning: [
        "⚠️ Monitor expenses closely - consider budget adjustments",
        "💼 Explore additional income streams",
        "📉 Reduce discretionary spending where possible",
        "🔍 Audit recurring subscriptions and memberships"
    ],
    critical: [
        "🚨 Immediate action required - expenses exceed income",
        "📉 Drastic cost-cutting measures needed",
        "💳 Prioritize paying off high-interest debts",
        "📞 Consider consulting a financial advisor"
    ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrencyRates();
    loadBusinesses();
    setInterval(saveData, 30000); // Auto-save every 30 seconds
});

// Currency Functions
async function loadCurrencyRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        currencyRates = data.rates;
        populateCurrencyDropdown();
    } catch (error) {
        console.error('Error loading currency rates:', error);
    }
}

function populateCurrencyDropdown() {
    const select = document.getElementById('currencySelect');
    Object.keys(currencyRates).forEach(currency => {
        const option = document.createElement('option');
        option.value = currency;
        option.textContent = currency;
        select.appendChild(option);
    });
}

// Business Management
function addBusiness() {
    const business = {
        id: Date.now(),
        name: document.getElementById('businessName').value,
        description: document.getElementById('businessDesc').value,
        currency: document.getElementById('currencySelect').value,
        target: parseFloat(document.getElementById('revenueTarget').value),
        transactions: [],
        categories: ['General'],
        assets: [],
        liabilities: []
    };
    businesses.push(business);
    currentBusiness = business;
    updateUI();
}

function deleteBusiness() {
    // Implementation needed
}

function switchBusiness(index) {
    currentBusiness = businesses[index];
    updateUI();
}

// Transaction Management
function showEntryModal(type) {
    document.getElementById('entryType').value = type;
    populateCategories();
    document.getElementById('entryModal').style.display = 'flex';
}

function populateCategories() {
    const select = document.getElementById('categorySelect');
    select.innerHTML = currentBusiness.categories.map(c => 
        `<option>${c}</option>`
    ).join('');
}

function addCategory() {
    const category = prompt('Enter new category name:');
    if (category) {
        currentBusiness.categories.push(category);
        populateCategories();
    }
}

function saveEntry() {
    const transaction = {
        date: new Date().toISOString(),
        type: document.getElementById('entryType').value,
        amount: parseFloat(document.getElementById('entryAmount').value),
        description: document.getElementById('entryDesc').value,
        category: document.getElementById('categorySelect').value
    };
    
    currentBusiness.transactions.push(transaction);
    updateUI();
    closeModals();
}

// UI Updates
function updateUI() {
    updateFinancialTable();
    updateBalanceSheet();
    updateFinancialHealth();
    saveData();
}

function updateFinancialTable() {
    const tbody = document.getElementById('monthlyBody');
    // Implementation for hierarchical table updates
}

function updateBalanceSheet() {
    const tbody = document.getElementById('balanceBody');
    // Implementation for balance sheet updates
}

function updateFinancialHealth() {
    // Destroy existing chart instance
    if (chartInstance) chartInstance.destroy();
    
    const ctx = document.getElementById('healthChart').getContext('2d');
    const score = calculateHealthScore();
    
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: ['#2c836d', '#e0e0e0']
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false
        }
    });
    
    document.getElementById('healthPercentage').textContent = `${score}%`;
    document.getElementById('healthTips').innerHTML = getHealthTips(score);
}

function calculateHealthScore() {
    // Implementation needed
    return 75; // Example value
}

function getHealthTips(score) {
    let tips = [];
    if (score >= 90) tips = healthTips.excellent;
    else if (score >= 70) tips = healthTips.good;
    else if (score >= 50) tips = healthTips.warning;
    else tips = healthTips.critical;
    
    return tips.map(t => `<div class="tip-item">✅ ${t}</div>`).join('');
}

// Data Persistence
function saveData() {
    localStorage.setItem('businessFinanceData', JSON.stringify(businesses));
}

function loadBusinesses() {
    const data = localStorage.getItem('businessFinanceData');
    if (data) {
        businesses = JSON.parse(data);
        updateBusinessList();
        if (businesses.length > 0) switchBusiness(0);
    }
}

// Utility Functions
function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentBusiness?.currency || 'USD'
    }).format(amount);
           }
