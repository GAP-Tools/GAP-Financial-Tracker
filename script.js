const apiKey = 'bbf3e2a38cee4116e7f051b8';
const baseURL = 'https://v6.exchangerate-api.com/v6';

let income = 0;
let expenses = 0;
let assets = 0;
let liabilities = 0;

// Load saved data
window.onload = () => {
  loadProfile();
  loadProgress();
};

// Save Profile
function saveProfile() {
  const profile = {
    name: document.getElementById('name').value,
    age: document.getElementById('age').value,
    occupation: document.getElementById('occupation').value,
    dream: document.getElementById('dream').value,
  };
  localStorage.setItem('profile', JSON.stringify(profile));
  alert('Profile saved!');
}

// Load Profile
function loadProfile() {
  const profile = JSON.parse(localStorage.getItem('profile'));
  if (profile) {
    document.getElementById('name').value = profile.name;
    document.getElementById('age').value = profile.age;
    document.getElementById('occupation').value = profile.occupation;
    document.getElementById('dream').value = profile.dream;
  }
}

// Save Progress
function saveProgress() {
  const progress = {
    income,
    expenses,
    assets,
    liabilities,
    incomeStatement: document.querySelector('#incomeStatement tbody').innerHTML,
    balanceSheet: document.querySelector('#balanceSheet tbody').innerHTML,
  };
  localStorage.setItem('progress', JSON.stringify(progress));
  alert('Progress saved!');
}

// Load Progress
function loadProgress() {
  const progress = JSON.parse(localStorage.getItem('progress'));
  if (progress) {
    income = progress.income;
    expenses = progress.expenses;
    assets = progress.assets;
    liabilities = progress.liabilities;
    document.querySelector('#incomeStatement tbody').innerHTML = progress.incomeStatement;
    document.querySelector('#balanceSheet tbody').innerHTML = progress.balanceSheet;
    updateTotals();
    updateFinancialHealth();
  }
}

// Update Totals
function updateTotals() {
  document.getElementById('totalIncome').innerText = income;
  document.getElementById('totalExpenses').innerText = expenses;
  document.getElementById('totalAssets').innerText = assets;
  document.getElementById('totalLiabilities').innerText = liabilities;
}

// Currency Converter
async function convertCurrency() {
  const amount = document.getElementById('amount').value;
  const fromCurrency = document.getElementById('fromCurrency').value;
  const toCurrency = document.getElementById('toCurrency').value;

  const url = `${baseURL}/${apiKey}/latest/${fromCurrency}`;
  const response = await fetch(url);
  const data = await response.json();
  const rate = data.conversion_rates[toCurrency];
  const convertedAmount = (amount * rate).toFixed(2);

  document.getElementById('conversionResult').innerText = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
}

// Add Entry
function addEntry() {
  const name = document.getElementById('entryName').value;
  const amount = parseFloat(document.getElementById('entryAmount').value);
  const date = document.getElementById('entryDate').value;
  const type = document.getElementById('entryType').value;

  if (!name || isNaN(amount) || !date) {
    alert('Please fill all fields correctly.');
    return;
  }

  const table = type === 'income' || type === 'expense' ? document.querySelector('#incomeStatement tbody') : document.querySelector('#balanceSheet tbody');
  const row = `<tr>
    <td>${date}</td>
    <td class="${type === 'income' ? 'income' : ''}">${type === 'income' ? amount : ''}</td>
    <td class="${type === 'expense' ? 'expense' : ''}">${type === 'expense' ? amount : ''}</td>
  </tr>`;
  table.insertAdjacentHTML('beforeend', row);

  // Update totals
  if (type === 'income') income += amount;
  else if (type === 'expense') expenses += amount;
  else if (type === 'asset') assets += amount;
  else if (type === 'liability') liabilities += amount;

  updateTotals();
  updateFinancialHealth();
  provideTips();
  clearInputs();
}

// Update Financial Health
function updateFinancialHealth() {
  const netWorth = assets - liabilities;
  const cashFlow = income - expenses;
  const healthScore = ((netWorth + cashFlow) / (income + assets)) * 100 || 0;

  const healthBar = document.querySelector('.health-bar');
  healthBar.setAttribute('data-score', `${healthScore.toFixed(2)}%`);

  let color;
  if (healthScore < 40) color = 'red';
  else if (healthScore < 60) color = 'yellow';
  else if (healthScore < 80) color = 'green';
  else color = 'darkgreen';

  healthBar.style.background = `conic-gradient(
    ${color} 0% ${healthScore}%,
    #ddd ${healthScore}% 100%
  )`;
}

// Provide Tips
function provideTips() {
  const tips = [
    "Focus on increasing your income streams.",
    "Reduce unnecessary expenses to improve cash flow.",
    "Invest in assets that generate passive income.",
    "Pay off high-interest liabilities as soon as possible.",
    "Diversify your investments to reduce risk.",
    "Track your spending to identify areas for improvement.",
    "Set financial goals and review them regularly.",
    "Build an emergency fund to cover unexpected expenses.",
    "Avoid lifestyle inflation as your income grows.",
    "Consider consulting a financial advisor for personalized advice.",
  ];
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  document.getElementById('tipText').innerText = randomTip;
}

// Clear Inputs
function clearInputs() {
  document.getElementById('entryName').value = '';
  document.getElementById('entryAmount').value = '';
  document.getElementById('entryDate').value = '';
}

// Download Summary
function downloadSummary() {
  const doc = new jspdf.jsPDF();
  const profile = JSON.parse(localStorage.getItem('profile'));
  const progress = JSON.parse(localStorage.getItem('progress'));

  let content = `Financial Summary for ${profile.name}\n\n`;
  content += `Age: ${profile.age}\n`;
  content += `Occupation: ${profile.occupation}\n`;
  content += `Dream: ${profile.dream}\n\n`;
  content += `Income: ${income}\n`;
  content += `Expenses: ${expenses}\n`;
  content += `Assets: ${assets}\n`;
  content += `Liabilities: ${liabilities}\n\n`;
  content += `Financial Health Score: ${document.querySelector('.health-bar').getAttribute('data-score')}\n\n`;
  content += `Tips: ${document.getElementById('tipText').innerText}\n`;

  doc.text(content, 10, 10);
  doc.save('financial_summary.pdf');
}

// Share on WhatsApp
function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://wa.me/?text=Check%20out%20this%20awesome%20financial%20tracker:%20${url}`);
}

// Share on Facebook
function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

// Share on Twitter
function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?url=${url}`);
    }
