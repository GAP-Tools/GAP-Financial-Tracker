// Initialize with default categories
let categories = {
    assets: { percent: 50, balance: 0 },
    expenses: { percent: 30, balance: 0 },
    investments: { percent: 20, balance: 0 }
};

let transactions = [];

function init() {
    renderCategories();
    updateBalances();
    updateWithdrawOptions();
    loadFromLocalStorage();
}

function renderCategories() {
    const container = document.getElementById('categories');
    container.innerHTML = Object.entries(categories).map(([name, config]) => `
        <div class="category">
            <label>${name.toUpperCase()}</label>
            <input type="number" value="${config.percent}" 
                   onchange="updatePercentage('${name}', this.value)">
            <span>%</span>
        </div>
    `).join('');
}

function updatePercentage(category, value) {
    categories[category].percent = parseInt(value);
    if(getTotalPercentage() !== 100) {
        alert('Total percentages must equal 100%!');
    }
}

function allocateFunds() {
    const amount = parseFloat(document.getElementById('amount').value);
    if(getTotalPercentage() !== 100) return alert('Fix percentages first!');
    
    Object.entries(categories).forEach(([name, config]) => {
        const allocated = amount * (config.percent / 100);
        categories[name].balance += allocated;
    });

    logTransaction(`Allocated ₦${amount} across categories`);
    updateBalances();
    saveToLocalStorage();
}

function withdrawFunds() {
    const category = document.getElementById('withdrawCategory').value;
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    
    if(categories[category].balance >= amount) {
        categories[category].balance -= amount;
        logTransaction(`Withdrew ₦${amount} from ${category}`);
        updateBalances();
        saveToLocalStorage();
    } else {
        alert('Insufficient balance!');
    }
}

function updateBalances() {
    document.getElementById('balanceDisplay').innerHTML = 
        Object.entries(categories).map(([name, config]) => `
            <div class="category">
                <strong>${name}:</strong> ₦${config.balance.toFixed(2)}
            </div>
        `).join('');
}

function logTransaction(message) {
    transactions.push(`${new Date().toLocaleString()}: ${message}`);
    document.getElementById('transactions').innerHTML = 
        transactions.map(t => `<div>${t}</div>`).join('');
}

function updateWithdrawOptions() {
    const select = document.getElementById('withdrawCategory');
    select.innerHTML = Object.keys(categories)
        .map(c => `<option value="${c}">${c}</option>`);
}

function getTotalPercentage() {
    return Object.values(categories).reduce((sum, c) => sum + c.percent, 0);
}

function saveToLocalStorage() {
    localStorage.setItem('wealthData', JSON.stringify({
        categories,
        transactions
    }));
}

function loadFromLocalStorage() {
    const data = JSON.parse(localStorage.getItem('wealthData'));
    if(data) {
        categories = data.categories;
        transactions = data.transactions || [];
        updateBalances();
        document.getElementById('transactions').innerHTML = 
            transactions.map(t => `<div>${t}</div>`).join('');
    }
}

// Initialize app
init();
