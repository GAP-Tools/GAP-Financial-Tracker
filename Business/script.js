let businesses = [];
let currentBusiness = null;
let currencyRates = {};
const healthTips = {
    low: [
        "Consider reducing discretionary spending",
        "Review recurring expenses for potential savings",
        "Explore additional income streams",
        "Delay non-essential purchases",
        "Negotiate better rates with suppliers",
        "Optimize inventory management",
        "Renegotiate debt terms",
        "Implement strict budget controls",
        "Offer promotions to boost sales",
        "Diversify revenue sources"
    ],
    medium: [
        "Maintain current financial discipline",
        "Invest in marketing to grow revenue",
        "Consider strategic partnerships",
        "Review pricing strategy",
        "Explore export opportunities",
        "Invest in employee training",
        "Upgrade operational efficiency",
        "Build emergency cash reserves",
        "Refinance high-interest debt",
        "Expand to new markets"
    ],
    high: [
        "Reinvest profits for growth",
        "Explore acquisition opportunities",
        "Implement profit-sharing programs",
        "Upgrade business technology",
        "Expand product lines",
        "Invest in research & development",
        "Consider franchising model",
        "Build long-term investments",
        "Enhance customer experience",
        "Develop sustainability initiatives"
    ]
};

// Initialize Chart
const ctx = document.getElementById('healthChart').getContext('2d');
const healthChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Achieved', 'Remaining'],
        datasets: [{
            data: [0, 100],
            backgroundColor: ['#4CAF50', '#E0E0E0']
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

// Business Functions
function addBusiness() {
    const name = document.getElementById('businessName').value.trim();
    if (!name) return;
    
    const newBusiness = {
        name,
        currency: 'USD',
        target: 0,
        months: {},
        categories: [],
        assets: [],
        liabilities: []
    };
    
    businesses.push(newBusiness);
    saveData();
    updateBusinessList();
    switchBusiness(businesses.length - 1);
}

function switchBusiness(index) {
    currentBusiness = businesses[index];
    updateUI();
}

function updateBusinessList() {
    const select = document.getElementById('businessList');
    select.innerHTML = businesses.map((b, i) => 
        `<option value="${i}">${b.name}</option>`
    ).join('');
}

// Financial Functions
function showEntryModal(type) {
    const modal = document.getElementById('entryModal');
    document.getElementById('modalTitle').textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    document.getElementById('entryType').value = type;
    populateCategories();
    modal.style.display = 'block';
}

function saveEntry() {
    const entry = {
        date: document.getElementById('entryDate').value || new Date().toISOString().slice(0,10),
        description: document.getElementById('entryDesc').value,
        amount: parseFloat(document.getElementById('entryAmount').value),
        type: document.getElementById('entryType').value,
        category: document.getElementById('entryCategory').value || 
                 document.getElementById('newCategory').value
    };

    if (!entry.category || isNaN(entry.amount)) return;

    // Update business data
    const monthKey = entry.date.slice(0,7);
    if (!currentBusiness.months[monthKey]) {
        currentBusiness.months[monthKey] = {
            income: 0,
            expenses: 0,
            categories: {}
        };
    }
    
    if (!currentBusiness.categories.includes(entry.category)) {
        currentBusiness.categories.push(entry.category);
    }

    const month = currentBusiness.months[monthKey];
    if (entry.type === 'income') {
        month.income += entry.amount;
    } else {
        month.expenses += entry.amount;
    }

    if (!month.categories[entry.category]) {
        month.categories[entry.category] = {
            income: 0,
            expenses: 0,
            entries: []
        };
    }

    const category = month.categories[entry.category];
    category[entry.type + 's'] += entry.amount;
    category.entries.push(entry);

    closeModal();
    saveData();
    updateUI();
}

// UI Update Functions
function updateUI() {
    updateMonthlyTable();
    updateBalanceSheet();
    updateFinancialHealth();
    populateCurrencyDropdowns();
}

function updateMonthlyTable() {
    const tbody = document.getElementById('monthlyBody');
    tbody.innerHTML = Object.entries(currentBusiness.months).map(([month, data]) => `
        <tr data-month="${month}">
            <td>${formatMonth(month)}</td>
            <td>${formatCurrency(data.income)}</td>
            <td>${formatCurrency(data.expenses)}</td>
            <td>${formatCurrency(data.income - data.expenses)}</td>
            <td>
                <button onclick="toggleCategory('${month}')" class="action-btn">▼</button>
                <button onclick="deleteMonth('${month}')" class="action-btn">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function toggleCategory(monthKey) {
    const row = document.querySelector(`tr[data-month="${monthKey}"]`);
    row.classList.toggle('collapsed');
    
    const categoryTable = document.getElementById('categoryBody');
    categoryTable.innerHTML = Object.entries(currentBusiness.months[monthKey].categories)
        .map(([category, data]) => `
            <tr data-category="${category}">
                <td>${category}</td>
                <td>${formatCurrency(data.income)}</td>
                <td>${formatCurrency(data.expenses)}</td>
                <td>
                    <button onclick="toggleDaily('${monthKey}','${category}')" class="action-btn">▼</button>
                    <button onclick="deleteCategory('${monthKey}','${category}')" class="action-btn">🗑️</button>
                </td>
            </tr>
        `).join('');
}

// Helper Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currentBusiness.currency
    }).format(amount);
}

function formatMonth(monthString) {
    const [year, month] = monthString.split('-');
    return new Date(year, month-1).toLocaleString('default', {month: 'long'}) + ' ' + year;
}

function saveData() {
    localStorage.setItem('businessData', JSON.stringify(businesses));
}

function loadData() {
    const data = localStorage.getItem('businessData');
    if (data) businesses = JSON.parse(data);
    if (businesses.length) switchBusiness(0);
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.querySelector('.modal .close').addEventListener('click', closeModal);
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal')) closeModal();
    });
});

function closeModal() {
    document.getElementById('entryModal').style.display = 'none';
    document.getElementById('newCategory').value = '';
}

function populateCategories() {
    const select = document.getElementById('entryCategory');
    select.innerHTML = currentBusiness.categories
        .map(c => `<option value="${c}">${c}</option>`)
        .concat('<option value="">-- New Category --</option>');
        }
