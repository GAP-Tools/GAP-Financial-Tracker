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

const incomeStatementBody = document.getElementById("income-statement-body");
const balanceSheetBody = document.getElementById("balance-sheet-body");
const totalAssets = document.getElementById("total-assets");
const totalLiabilities = document.getElementById("total-liabilities");
const netWorthDisplay = document.getElementById("net-worth");
const healthChartCtx = document.getElementById("healthChart").getContext("2d");
const healthPercentage = document.getElementById("healthPercentage");
const healthTips = document.getElementById("healthTips");
const fromCurrency = document.getElementById("fromCurrency");
const toCurrency = document.getElementById("toCurrency");
const conversionResult = document.getElementById("conversionResult");
const financialStory = document.getElementById("financialStory");
const currencySelect = document.getElementById("currency");
const passiveIncomeTargetInput = document.getElementById("passive-income-target");
const cashflowDisplay = document.getElementById("cashflow");
const saveFileNameInput = document.getElementById("saveFileName");
const calculatorPopup = document.getElementById("calculatorPopup");
const calculatorInput = document.getElementById("calculatorInput");
const allocationModal = document.getElementById("allocationModal");
const entryCategorySelect = document.getElementById("entryCategory");

const healthChart = new Chart(healthChartCtx, {
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

async function fetchCurrencyRates() {
  const apiUrl = "https://v6.exchangerate-api.com/v6/eb5cfc3ff6c3b48bb6f60c83/latest/USD";
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.result === "success") {
      currencyRates = data.conversion_rates;
      populateCurrencyDropdowns();
      loadSavedData();
    }
  } catch (error) {
    console.error("Error fetching currency rates:", error);
  }
}

function populateCurrencyDropdowns() {
  for (const currency in currencyRates) {
    const newOption = document.createElement("option");
    newOption.value = currency;
    newOption.text = `${currency} (${getCurrencySymbol(currency)})`;
    fromCurrency.add(newOption.cloneNode(true));
    toCurrency.add(newOption.cloneNode(true));
    currencySelect.add(newOption.cloneNode(true));
  }
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

document.addEventListener('DOMContentLoaded', function() {
  const switchLink = document.getElementById('switchLink');
  switchLink.addEventListener('click', function() {
    window.location.href = "https://gap-tools.github.io/GAP-Financial-Tracker/Business";
  });
});

function saveProfile() {
  profile.name = document.getElementById("name").value;
  profile.age = document.getElementById("age").value;
  profile.occupation = document.getElementById("occupation").value;
  profile.dream = document.getElementById("dream").value;
  profile.currency = currencySelect.value;
  profile.passiveIncomeTarget = parseFloat(passiveIncomeTargetInput.value) || 0;
  alert("Profile Saved!");
  saveDataToLocalStorage();
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

function showEntryModal(type) {
  document.getElementById('entryModal').style.display = 'block';
  document.getElementById('entryType').value = type;
  populateCategories();
  if (type === 'income') {
    document.getElementById('entryCategory').disabled = true;
    document.getElementById('entryCategory').value = 'General Income';
  } else {
    document.getElementById('entryCategory').disabled = false;
  }
  document.getElementById('entryAmount').value = '';
  document.getElementById('entryDescription').value = '';
}

function closeModal() {
  document.getElementById('entryModal').style.display = 'none';
}

function populateCategories() {
  const categorySelect = document.getElementById('entryCategory');
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  profile.fundAllocations.categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
}

function updateMonthlyTable() {
  const monthlyBody = document.getElementById('monthly-body');
  monthlyBody.innerHTML = '';
  (profile.incomeStatement.months || []).forEach((monthData, monthIndex) => {
    const row = document.createElement('tr');
    row.classList.add('expandable');
    row.innerHTML = `
      <td class="editable-date" onclick="editDate('month', ${monthIndex})">${monthData.month}</td>
      <td>${profile.currency} ${monthData.totalIncome}</td>
      <td>${profile.currency} ${monthData.totalExpenses}</td>
      <td>${profile.currency} ${monthData.totalIncome - monthData.totalExpenses}</td>
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
    (monthData.categories || []).forEach((cat, catIndex) => {
      const categoryRow = document.createElement('tr');
      categoryRow.classList.add('expandable');
      categoryRow.innerHTML = `
        <td class="editable-date" onclick="editCategoryName(${monthIndex}, ${catIndex})">${cat.name}</td>
        <td>${profile.currency} ${cat.totalIncome}</td>
        <td>${profile.currency} ${cat.totalExpenses}</td>
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
      (cat.entries || []).forEach((entry, entryIndex) => {
        const dailyRow = document.createElement('tr');
        dailyRow.innerHTML = `
          <td class="editable-date" onclick="editEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">
            ${entry.date}
          </td>
          <td>${entry.description}</td>
          <td>${profile.currency} ${entry.amount}</td>
          <td>${entry.type === 'income' ? 'Income' : 'Expense'}</td>
          <td>
            <button onclick="editEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">✎</button>
            <button onclick="duplicateEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">♻️</button>
            <button onclick="deleteEntry('income', ${monthIndex}, ${catIndex}, ${entryIndex})">🗑️</button>
          </td>
        `;
        document.getElementById(`daily-body-${monthIndex}-${catIndex}`).appendChild(dailyRow);
      });
    });
  });
  updateAverages();
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
  if (isNaN(amount) || amount <= 0 || !description) {
    alert('Invalid or missing amount/description');
    return;
  }
  const currentMonth = getCurrentMonth();
  let monthObject;
  let categoryObject;
  if (!profile.incomeStatement.months.some(m => m.month === currentMonth)) {
    profile.incomeStatement.months.push({
      month: currentMonth,
      categories: [],
      totalIncome: 0,
      totalExpenses: 0,
    });
  }
  monthObject = profile.incomeStatement.months.find(m => m.month === currentMonth);
  if (type === 'income') {
    if (!monthObject.categories.some(cat => cat.name === 'General Income')) {
      monthObject.categories.push({
        name: 'General Income',
        totalIncome: 0,
        totalExpenses: 0,
        entries: [],
      });
    }
    categoryObject = monthObject.categories.find(cat => cat.name === 'General Income');
    categoryObject.totalIncome += amount;
    monthObject.totalIncome += amount;
    categoryObject.entries.push({
      date: new Date().toISOString().split("T")[0],
      description: description,
      amount: amount,
      type: 'income',
    });
    allocateIncome(amount, description);
  } else if (type === 'expense') {
    if (!category) {
      alert('Please select a category for expenses');
      return;
    }
    if (!monthObject.categories.some(cat => cat.name === category)) {
      monthObject.categories.push({
        name: category,
        totalIncome: 0,
        totalExpenses: 0,
        entries: [],
      });
    }
    categoryObject = monthObject.categories.find(cat => cat.name === category);
    categoryObject.totalExpenses += amount;
    monthObject.totalExpenses += amount;
    categoryObject.entries.push({
      date: new Date().toISOString().split("T")[0],
      description: description,
      amount: amount,
      type: 'expense',
    });
    deductExpenseFromCategory(category, amount, description);
  }
  updateMonthlyTable();
  updateFundAllocationTable();
  closeModal();
  saveDataToLocalStorage();
}

function allocateIncome(amount, description) {
  profile.fundAllocations.categories.forEach(cat => {
    const allocatedAmount = amount * (cat.percentage / 100);
    cat.balance += allocatedAmount;
    cat.transactions.push({
      date: new Date().toISOString().split("T")[0],
      amount: allocatedAmount,
      type: 'income',
      description: description,
    });
  });
  profile.generalIncome.balance += amount;
  profile.generalIncome.transactions.push({
    date: new Date().toISOString().split("T")[0],
    amount: amount,
    type: 'income',
    description: description,
  });
}

function deductExpenseFromCategory(categoryName, amount, description) {
  const category = profile.fundAllocations.categories.find(cat => cat.name === categoryName);
  if (!category) return;
  category.balance -= amount;
  category.transactions.push({
    date: new Date().toISOString().split("T")[0],
    amount: -amount,
    type: 'expense',
    description: description,
  });
  profile.generalIncome.balance -= amount;
  profile.generalIncome.transactions.push({
    date: new Date().toISOString().split("T")[0],
    amount: -amount,
    type: 'expense',
    description: description,
  });
}

function getCurrentMonth() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

function updateAverages() {
  const profileMonths = profile.incomeStatement.months || [];
  const totalMonths = profileMonths.length || 1;
  const avgIncome = profileMonths.reduce((sum, m) => sum + m.totalIncome, 0) / totalMonths;
  const avgExpenses = profileMonths.reduce((sum, m) => sum + m.totalExpenses, 0) / totalMonths;
  const avgCashflow = avgIncome - avgExpenses;
  document.getElementById('average-income').textContent = `${profile.currency} ${avgIncome.toFixed(2)}`;
  document.getElementById('average-expenses').textContent = `${profile.currency} ${avgExpenses.toFixed(2)}`;
  document.getElementById('average-cashflow').textContent = `${profile.currency} ${avgCashflow.toFixed(2)}`;
  updateFinancialHealth();
}

function updateFinancialHealth() {
  const avgCashflow = parseFloat(document.getElementById('average-cashflow').textContent.replace(profile.currency, '').trim());
  const healthScore = Math.round((avgCashflow / profile.passiveIncomeTarget) * 100);
  healthChart.data.datasets[0].data = [healthScore > 100 ? 100 : healthScore];
  healthChart.data.datasets[0].backgroundColor = getHealthColor(healthScore);
  healthChart.update();
  healthPercentage.textContent = `${healthScore > 100 ? 100 : healthScore}%`;
  healthTips.textContent = generateHealthTip(healthScore, avgCashflow, profile.passiveIncomeTarget);
}

function getHealthColor(score) {
  return score <= 39 ? "#ff6384" : score <= 59 ? "#ffcd56" : score <= 79 ? "#4bc0c0" : "#36a2eb";
                              }

function generateHealthTip(score, cashflow, passiveIncomeTarget) {
  const tips = {
    low: [
      "Your expenses are higher than your income. Start by cutting unnecessary spending like dining out or subscriptions you don’t use.",
      "You’re living paycheck to paycheck. Focus on building an emergency fund, even if it’s just $10 a week.",
      "Your debt is likely overwhelming. Prioritize paying off high-interest debts like credit cards first.",
      "You might be spending too much on wants instead of needs. Track your expenses and identify areas to cut back.",
      "Your financial habits are keeping you stuck. Start by creating a budget and sticking to it.",
      "You’re not investing yet. Even small investments in index funds can grow over time. Start today.",
      "You’re relying too much on one income source. Explore side hustles like freelancing or selling items online.",
      "You’re likely stressed about money. Take a deep breath and focus on one small step at a time.",
      "You’re not saving enough. Aim to save at least 10% of your income, no matter how small.",
      "You’re spending more than you earn. This is unsustainable. Cut back on non-essentials immediately.",
      "You’re not tracking your spending. Use apps or a notebook to monitor where your money goes.",
      "You’re not paying yourself first. Before paying bills, set aside money for savings or investments.",
      "You’re ignoring your financial health. Start by reading a book like 'Rich Dad Poor Dad' to change your mindset.",
      "You’re stuck in the rat race. Focus on acquiring assets that generate passive income.",
      "You’re not thinking long-term. Start small, but start now. Time is your greatest ally.",
      "You’re likely living beyond your means. Downgrade your lifestyle to match your income.",
      "You’re not building an emergency fund. Aim for $500 initially, then grow it to 3-6 months of expenses.",
      "You’re not learning about money. Dedicate 30 minutes a day to financial education.",
      "You’re not diversifying your income. Start a side hustle or invest in skills that can increase your earnings.",
      "You’re not taking advantage of compound interest. Even $50 a month can grow significantly over time.",
      "You’re not setting financial goals. Write down what you want to achieve in 1, 5, and 10 years.",
      "You’re not avoiding bad debt. Stop using credit cards for things you can’t afford.",
      "You’re not thinking like an investor. Ask yourself, 'How can this purchase make me money?'",
      "You’re not automating savings. Set up automatic transfers to a savings or investment account.",
      "You’re not protecting your wealth. Get insurance to cover unexpected events.",
      "You’re not networking with financially smart people. Surround yourself with those who inspire you.",
      "You’re not taking calculated risks. Start small with low-risk investments like index funds.",
      "You’re not focusing on cash flow. Money in the bank loses value over time due to inflation.",
      "You’re not investing in yourself. Learn new skills that can increase your earning potential.",
      "You’re not avoiding get-rich-quick schemes. Real wealth takes time and consistent effort.",
      "You’re not starting today. Procrastination is the enemy of financial freedom.",
      "You’re not cutting down on subscriptions. Cancel services you don’t use regularly.",
      "You’re not cooking at home. Eating out less can save you hundreds each month.",
      "You’re not selling unused items. Turn clutter into cash to boost your savings.",
      "You’re not avoiding impulse buying. Wait 24 hours before making a purchase.",
      "You’re not using cash instead of credit. It helps you spend within your means.",
      "You’re not learning about taxes. Knowing how they work can save you money.",
      "You’re not avoiding unnecessary fees. Check your bank statements for hidden charges.",
      "You’re not starting a side hustle. Even a small income stream can make a big difference.",
      "You’re not investing in low-cost index funds. They’re a great way to grow wealth passively.",
      "You’re not avoiding emotional spending. Stick to a budget and prioritize your goals.",
      "You’re not negotiating. Whether it’s your salary or a purchase, every dollar saved counts.",
      "You’re not automating savings and investments. This ensures consistency without effort.",
      "You’re not learning from failure. Every successful investor has faced setbacks.",
      "You’re not building systems. Systems create passive income and reduce reliance on active work.",
      "You’re not educating yourself about compound interest. It’s the key to growing wealth.",
      "You’re not avoiding unnecessary debt. If it doesn’t help you build wealth, it’s not worth it.",
      "You’re not thinking like an investor. Always ask, 'How can this make me money?'",
      "You’re not celebrating small wins. Every step forward is progress toward financial freedom."
    ],
    moderate: [
      "Your financial health is improving, but you’re not out of the woods yet. Keep reducing liabilities and focus on acquiring assets.",
      "Your savings rate is still low. Consider increasing your income or cutting unnecessary expenses.",
      "You’re making progress, but you’re not diversifying your income. Don’t rely solely on your job for financial security.",
      "You’re starting to invest, but you’re not focusing enough on passive income. Look into stocks, real estate, or side businesses.",
      "You’re avoiding emotional spending, but you’re not sticking to a budget. Prioritize your financial goals.",
      "You’re learning about taxes, but you’re not taking full advantage of deductions. Consult a tax professional.",
      "You’re setting financial goals, but you’re not reviewing them regularly. Adjust them as your situation changes.",
      "You’re saving, but you’re not investing enough. Money sitting in a savings account loses value over time.",
      "You’re focusing on cash flow-positive investments, but you’re not diversifying enough. Spread your investments across different assets.",
      "You’re reviewing your expenses, but you’re not cutting back enough. Look for areas where you can save more.",
      "You’re avoiding comparing yourself to others, but you’re not setting clear benchmarks for your own progress.",
      "You’re starting small in investing, but you’re not consistent. Automate your investments to ensure regular contributions.",
      "You’re learning to negotiate, but you’re not applying it enough. Negotiate your salary, bills, and purchases.",
      "You’re automating savings, but you’re not increasing the amount over time. Aim to save more as your income grows.",
      "You’re learning from failure, but you’re not taking enough risks. Start small with low-risk investments.",
      "You’re building systems, but you’re not optimizing them. Look for ways to increase efficiency and reduce costs.",
      "You’re educating yourself about compound interest, but you’re not taking full advantage of it. Invest early and consistently.",
      "You’re avoiding unnecessary debt, but you’re not paying off existing debt fast enough. Focus on high-interest debts first.",
      "You’re thinking like an investor, but you’re not acting like one. Start investing in assets that generate cash flow.",
      "You’re celebrating small wins, but you’re not setting bigger goals. Aim higher and challenge yourself.",
      "You’re protecting your wealth with insurance, but you’re not reviewing your policies regularly. Ensure they still meet your needs.",
      "You’re networking with like-minded people, but you’re not leveraging those connections. Seek mentorship and opportunities.",
      "You’re thinking globally, but you’re not investing globally. Look for opportunities beyond your local market.",
      "You’re staying patient, but you’re not taking enough action. Balance patience with consistent effort.",
      "You’re avoiding emotional decisions, but you’re not sticking to your financial plan. Review and adjust your plan regularly.",
      "You’re focusing on value, but you’re not avoiding cheap traps. Invest in quality over quantity.",
      "You’re keeping your expenses low, but you’re not increasing your income enough. Explore ways to earn more.",
      "You’re celebrating your progress, but you’re not setting new challenges. Keep pushing yourself to grow.",
      "You’re remembering that money is a tool, but you’re not using it effectively. Focus on building wealth, not just spending.",
      "You’re reinvesting your profits, but you’re not diversifying your investments. Spread your risk across different assets.",
      "You’re focusing on cash flow, but you’re not tracking it closely. Monitor your income and expenses regularly.",
      "You’re teaching others about money, but you’re not learning enough yourself. Stay curious and keep educating yourself.",
      "You’re staying disciplined, but you’re not rewarding yourself enough. Celebrate milestones to stay motivated.",
      "You’re avoiding complacency, but you’re not taking enough risks. Step out of your comfort zone to grow.",
      "You’re reviewing your financial goals, but you’re not adjusting them enough. Make sure they align with your current situation.",
      "You’re investing in experiences, but you’re not balancing them with financial goals. Prioritize both.",
      "You’re protecting your wealth with insurance, but you’re not diversifying your coverage. Ensure all areas are covered.",
      "You’re networking with like-minded people, but you’re not collaborating enough. Seek partnerships and joint ventures.",
      "You’re thinking globally, but you’re not acting globally. Invest in international markets or businesses.",
      "You’re staying patient, but you’re not planning for the long term. Think decades ahead, not just years.",
      "You’re avoiding emotional decisions, but you’re not trusting your instincts. Balance logic with intuition.",
      "You’re focusing on value, but you’re not investing in yourself enough. Skills and knowledge are your best assets.",
      "You’re keeping your expenses low, but you’re not maximizing your savings. Look for ways to save more.",
      "You’re celebrating your progress, but you’re not sharing your success. Inspire others with your journey.",
      "You’re remembering that money is a tool, but you’re not using it to create the life you want. Focus on your vision."
    ],
    good: [
      "Great job! Your income is higher than your expenses. Keep building your assets and focus on generating passive income.",
      "You're on the right track. Consider investing in assets like real estate or stocks to grow your wealth further.",
      "Your financial health is strong, but don’t get complacent. Keep diversifying your investments to reduce risk.",
      "You’re saving and investing well, but are you maximizing your returns? Explore higher-yield investment options.",
      "You’re managing your cash flow effectively, but are you tracking it closely? Monitor your income and expenses regularly.",
      "You’re building wealth, but are you protecting it? Ensure you have adequate insurance and an estate plan.",
      "You’re investing in assets, but are you reinvesting your profits? Reinvestment accelerates wealth growth.",
      "You’re focusing on cash flow, but are you diversifying your income streams? Multiple streams provide security.",
      "You’re teaching others about money, but are you learning enough yourself? Stay curious and keep educating yourself.",
      "You’re staying disciplined, but are you rewarding yourself? Celebrate milestones to stay motivated.",
      "You’re avoiding complacency, but are you taking enough risks? Step out of your comfort zone to grow.",
      "You’re reviewing your financial goals, but are you adjusting them? Make sure they align with your current situation.",
      "You’re investing in experiences, but are you balancing them with financial goals? Prioritize both.",
      "You’re protecting your wealth with insurance, but are you diversifying your coverage? Ensure all areas are covered.",
      "You’re networking with like-minded people, but are you collaborating? Seek partnerships and joint ventures.",
      "You’re thinking globally, but are you acting globally? Invest in international markets or businesses.",
      "You’re staying patient, but are you planning for the long term? Think decades ahead, not just years.",
      "You’re avoiding emotional decisions, but are you trusting your instincts? Balance logic with intuition.",
      "You’re focusing on value, but are you investing in yourself? Skills and knowledge are your best assets.",
      "You’re keeping your expenses low, but are you maximizing your savings? Look for ways to save more.",
      "You’re celebrating your progress, but are you sharing your success? Inspire others with your journey.",
      "You’re remembering that money is a tool, but are you using it to create the life you want? Focus on your vision.",
      "You’re reinvesting your profits, but are you diversifying your investments? Spread your risk across different assets.",
      "You’re focusing on cash flow, but are you tracking it closely? Monitor your income and expenses regularly.",
      "You’re teaching others about money, but are you learning enough yourself? Stay curious and keep educating yourself.",
      "You’re staying disciplined, but are you rewarding yourself? Celebrate milestones to stay motivated.",
      "You’re avoiding complacency, but are you taking enough risks? Step out of your comfort zone to grow.",
      "You’re reviewing your financial goals, but are you adjusting them? Make sure they align with your current situation.",
      "You’re investing in experiences, but are you balancing them with financial goals? Prioritize both.",
      "You’re protecting your wealth with insurance, but are you diversifying your coverage? Ensure all areas are covered.",
      "You’re networking with like-minded people, but are you collaborating? Seek partnerships and joint ventures.",
      "You’re thinking globally, but are you acting globally? Invest in international markets or businesses.",
      "You’re staying patient, but are you planning for the long term? Think decades ahead, not just years.",
      "You’re avoiding emotional decisions, but are you trusting your instincts? Balance logic with intuition.",
      "You’re focusing on value, but are you investing in yourself? Skills and knowledge are your best assets.",
      "You’re keeping your expenses low, but are you maximizing your savings? Look for ways to save more.",
      "You’re celebrating your progress, but are you sharing your success? Inspire others with your journey.",
      "You’re remembering that money is a tool, but are you using it to create the life you want? Focus on your vision.",
      "You’re reinvesting your profits, but are you diversifying your investments? Spread your risk across different assets.",
      "You’re focusing on cash flow, but are you tracking it closely? Monitor your income and expenses regularly.",
      "You’re teaching others about money, but are you learning enough yourself? Stay curious and keep educating yourself.",
      "You’re staying disciplined, but are you rewarding yourself? Celebrate milestones to stay motivated.",
      "You’re avoiding complacency, but are you taking enough risks? Step out of your comfort zone to grow.",
      "You’re reviewing your financial goals, but are you adjusting them? Make sure they align with your current situation.",
      "You’re investing in experiences, but are you balancing them with financial goals? Prioritize both.",
      "You’re protecting your wealth with insurance, but are you diversifying your coverage? Ensure all areas are covered.",
      "You’re networking with like-minded people, but are you collaborating? Seek partnerships and joint ventures.",
      "You’re thinking globally, but are you acting globally? Invest in international markets or businesses.",
      "You’re staying patient, but are you planning for the long term? Think decades ahead, not just years."
    ],
    excellent: [
      "Excellent! Your financial health is in great shape. Keep up the good work and focus on maintaining your wealth.",
      "You're doing amazing! Consider diversifying your investments further to protect against market fluctuations.",
      "Your financial habits are top-notch. Keep learning and exploring new opportunities to grow your wealth.",
      "You’ve mastered the basics. Now, explore advanced strategies like real estate syndications or private equity.",
      "You’re financially free. Use your wealth to create a legacy and positively impact future generations.",
      "You’re protecting your wealth well. Ensure your estate plan is up-to-date and covers all scenarios.",
      "You’re giving back. Consider philanthropy as a way to use your wealth for positive change.",
      "You’re staying curious. Keep exploring new opportunities and technologies to grow your wealth.",
      "You’re staying disciplined. Consistency is key to maintaining your financial freedom.",
      "You’re celebrating your achievements. Take time to enjoy the fruits of your hard work.",
      "You’re staying connected. Your network is a valuable resource for new opportunities.",
      "You’re thinking beyond money. True wealth includes health, relationships, and happiness.",
      "You’re keeping your goals clear. They’ll guide your financial decisions and keep you on track.",
      "You’re staying grateful. Gratitude keeps you grounded and focused on what truly matters.",
      "You’re remembering that financial freedom is a journey, not a destination. Enjoy the process.",
      "You’re reinvesting your profits wisely. Keep diversifying your investments to reduce risk.",
      "You’re focusing on cash flow, but are you tracking it closely? Monitor your income and expenses regularly.",
      "You’re teaching others about money, but are you learning enough yourself? Stay curious and keep educating yourself.",
      "You’re staying disciplined, but are you rewarding yourself? Celebrate milestones to stay motivated.",
      "You’re avoiding complacency, but are you taking enough risks? Step out of your comfort zone to grow.",
      "You’re reviewing your financial goals, but are you adjusting them? Make sure they align with your current situation.",
      "You’re investing in experiences, but are you balancing them with financial goals? Prioritize both.",
      "You’re protecting your wealth with insurance, but are you diversifying your coverage? Ensure all areas are covered.",
      "You’re networking with like-minded people, but are you collaborating? Seek partnerships and joint ventures.",
      "You’re thinking globally, but are you acting globally? Invest in international markets or businesses.",
      "You’re staying patient, but are you planning for the long term? Think decades ahead, not just years.",
      "You’re avoiding emotional decisions, but are you trusting your instincts? Balance logic with intuition.",
      "You’re focusing on value, but are you investing in yourself? Skills and knowledge are your best assets.",
      "You’re keeping your expenses low, but are you maximizing your savings? Look for ways to save more.",
      "You’re celebrating your progress, but are you sharing your success? Inspire others with your journey.",
      "You’re remembering that money is a tool, but are you using it to create the life you want? Focus on your vision.",
      "You’re reinvesting your profits, but are you diversifying your investments? Spread your risk across different assets.",
      "You’re focusing on cash flow, but are you tracking it closely? Monitor your income and expenses regularly.",
      "You’re teaching others about money, but are you learning enough yourself? Stay curious and keep educating yourself.",
      "You’re staying disciplined, but are you rewarding yourself? Celebrate milestones to stay motivated.",
      "You’re avoiding complacency, but are you taking enough risks? Step out of your comfort zone to grow.",
      "You’re reviewing your financial goals, but are you adjusting them? Make sure they align with your current situation.",
      "You’re investing in experiences, but are you balancing them with financial goals? Prioritize both.",
      "You’re protecting your wealth with insurance, but are you diversifying your coverage? Ensure all areas are covered.",
      "You’re networking with like-minded people, but are you collaborating? Seek partnerships and joint ventures.",
      "You’re thinking globally, but are you acting globally? Invest in international markets or businesses.",
      "You’re staying patient, but are you planning for the long term? Think decades ahead, not just years.",
      "You’re avoiding emotional decisions, but are you trusting your instincts? Balance logic with intuition.",
      "You’re focusing on value, but are you investing in yourself? Skills and knowledge are your best assets.",
      "You’re keeping your expenses low, but are you maximizing your savings? Look for ways to save more.",
      "You’re celebrating your progress, but are you sharing your success? Inspire others with your journey.",
      "You’re remembering that money is a tool, but are you using it to create the life you want? Focus on your vision."
    ]
  };

  const section = score <= 39 ? 'low' : score <= 59 ? 'moderate' : score <= 79 ? 'good' : 'excellent';

  const extraTips = [];
  if (cashflow < passiveIncomeTarget) {
    extraTips.push(
      "Your cashflow is below your passive income target. Focus on increasing income or reducing expenses.",
      "You’re not generating enough passive income. Explore investments like dividend stocks or rental properties.",
      "Your cashflow needs improvement. Look for ways to boost your income or cut unnecessary costs.",
      "You’re close to your passive income target. Keep pushing to reach it faster.",
      "Your cashflow is improving, but it’s not enough. Focus on building more income streams.",
      "You’re not maximizing your cashflow. Review your expenses and look for areas to save.",
      "Your cashflow is below target. Consider side hustles or freelancing to increase your income.",
      "You’re not generating enough cashflow. Invest in assets that produce regular income.",
      "Your cashflow is lagging. Focus on reducing debt and increasing your savings rate.",
      "You’re not meeting your passive income target. Reassess your investments and spending habits.",
      "Your cashflow is below expectations. Look for ways to increase your earnings or reduce expenses.",
      "You’re not generating enough passive income. Consider investing in real estate or dividend-paying stocks.",
      "Your cashflow is below your target. Focus on building multiple income streams.",
      "You’re not maximizing your cashflow. Review your budget and cut unnecessary expenses.",
      "Your cashflow is improving, but it’s not enough. Keep working on increasing your income.",
      "You’re not generating enough passive income. Explore opportunities in the stock market or small businesses.",
      "Your cashflow is below your target. Focus on reducing liabilities and increasing assets.",
      "You’re not meeting your passive income goal. Consider investing in index funds or ETFs.",
      "Your cashflow is lagging. Look for ways to increase your income or reduce your expenses.",
      "You’re not generating enough cashflow. Focus on building assets that produce regular income.",
      "Your cashflow is below your target. Consider starting a side hustle or investing in real estate.",
      "You’re not maximizing your cashflow. Review your spending habits and look for areas to save.",
      "Your cashflow is improving, but it’s not enough. Keep working on increasing your income streams.",
      "You’re not generating enough passive income. Explore investments like REITs or peer-to-peer lending.",
      "Your cashflow is below your target. Focus on reducing debt and increasing your savings rate.",
      "You’re not meeting your passive income goal. Consider investing in dividend-paying stocks or bonds.",
      "Your cashflow is lagging. Look for ways to increase your income or reduce your expenses.",
      "You’re not generating enough cashflow. Focus on building assets that produce regular income.",
      "Your cashflow is below your target. Consider starting a side hustle or investing in real estate.",
      "You’re not maximizing your cashflow. Review your spending habits and look for areas to save.",
      "Your cashflow is improving, but it’s not enough. Keep working on increasing your income streams.",
      "You’re not generating enough passive income. Explore investments like REITs or peer-to-peer lending.",
      "Your cashflow is below your target. Focus on reducing debt and increasing your savings rate.",
      "You’re not meeting your passive income goal. Consider investing in dividend-paying stocks or bonds.",
      "Your cashflow is lagging. Look for ways to increase your income or reduce your expenses.",
      "You’re not generating enough cashflow. Focus on building assets that produce regular income.",
      "Your cashflow is below your target. Consider starting a side hustle or investing in real estate.",
      "You’re not maximizing your cashflow. Review your spending habits and look for areas to save.",
      "Your cashflow is improving, but it’s not enough. Keep working on increasing your income streams.",
      "You’re not generating enough passive income. Explore investments like REITs or peer-to-peer lending.",
      "Your cashflow is below your target. Focus on reducing debt and increasing your savings rate.",
      "You’re not meeting your passive income goal. Consider investing in dividend-paying stocks or bonds.",
      "Your cashflow is lagging. Look for ways to increase your income or reduce your expenses.",
      "You’re not generating enough cashflow. Focus on building assets that produce regular income.",
      "Your cashflow is below your target. Consider starting a side hustle or investing in real estate.",
      "You’re not maximizing your cashflow. Review your spending habits and look for areas to save.",
      "Your cashflow is improving, but it’s not enough. Keep working on increasing your income streams.",
      "You’re not generating enough passive income. Explore investments like REITs or peer-to-peer lending."
    );
  } else {
    extraTips.push(
      "Your cashflow exceeds your passive income target. Keep up the good work!",
      "You’re generating more than enough passive income. Consider reinvesting the surplus.",
      "Your cashflow is strong. Focus on maintaining and growing your income streams.",
      "You’re exceeding your passive income target. Use the extra cashflow to diversify your investments.",
      "Your cashflow is excellent. Keep building your wealth and exploring new opportunities.",
      "You’re generating more passive income than needed. Consider giving back or investing in others.",
      "Your cashflow is above target. Use the surplus to fund your dreams or passions.",
      "You’re exceeding your passive income goal. Keep pushing to grow your wealth further.",
      "Your cashflow is strong. Focus on protecting and preserving your wealth.",
      "You’re generating more than enough passive income. Consider starting a new venture or project.",
      "Your cashflow is excellent. Keep learning and exploring new ways to grow your wealth.",
      "You’re exceeding your passive income target. Use the surplus to invest in yourself or others.",
      "Your cashflow is above expectations. Focus on maintaining your financial discipline.",
      "You’re generating more passive income than needed. Consider reinvesting in high-growth opportunities.",
      "Your cashflow is strong. Keep building your legacy and impacting others positively.",
      "You’re exceeding your passive income goal. Use the surplus to explore new investment opportunities.",
      "Your cashflow is excellent. Focus on maintaining your wealth and enjoying the fruits of your labor.",
      "You’re generating more than enough passive income. Consider giving back to your community.",
      "Your cashflow is above target. Use the surplus to fund your passions or hobbies.",
      "You’re exceeding your passive income target. Keep pushing to grow your wealth and impact.",
      "Your cashflow is strong. Focus on maintaining your financial health and exploring new opportunities.",
      "You’re generating more passive income than needed. Consider reinvesting in yourself or others.",
      "Your cashflow is excellent. Keep learning and growing to maintain your financial freedom.",
      "You’re exceeding your passive income goal. Use the surplus to fund your dreams or passions.",
      "Your cashflow is above expectations. Focus on maintaining your wealth and enjoying life.",
      "You’re generating more than enough passive income. Consider starting a new venture or project.",
      "Your cashflow is strong. Keep building your legacy and impacting others positively.",
      "You’re exceeding your passive income target. Use the surplus to explore new investment opportunities.",
      "Your cashflow is excellent. Focus on maintaining your wealth and enjoying the fruits of your labor.",
      "You’re generating more than enough passive income. Consider giving back to your community.",
      "Your cashflow is above target. Use the surplus to fund your passions or hobbies.",
      "You’re exceeding your passive income goal. Keep pushing to grow your wealth and impact.",
      "Your cashflow is strong. Focus on maintaining your financial health and exploring new opportunities.",
      "You’re generating more passive income than needed. Consider reinvesting in yourself or others.",
      "Your cashflow is excellent. Keep learning and growing to maintain your financial freedom.",
      "You’re exceeding your passive income target. Use the surplus to fund your dreams or passions.",
      "Your cashflow is above expectations. Focus on maintaining your wealth and enjoying life.",
      "You’re generating more than enough passive income. Consider starting a new venture or project.",
      "Your cashflow is strong. Keep building your legacy and impacting others positively.",
      "You’re exceeding your passive income goal. Use the surplus to explore new investment opportunities.",
      "Your cashflow is excellent. Focus on maintaining your wealth and enjoying the fruits of your labor.",
      "You’re generating more than enough passive income. Consider giving back to your community.",
      "Your cashflow is above target. Use the surplus to fund your passions or hobbies.",
      "You’re exceeding your passive income target. Keep pushing to grow your wealth and impact.",
      "Your cashflow is strong. Focus on maintaining your financial health and exploring new opportunities.",
      "You’re generating more passive income than needed. Consider reinvesting in yourself or others.",
      "Your cashflow is excellent. Keep learning and growing to maintain your financial freedom.",
      "You’re exceeding your passive income goal. Use the surplus to fund your dreams or passions.",
      "Your cashflow is above expectations. Focus on maintaining your wealth and enjoying life."
    );
  }

  // Randomly select a tip from the section
  const randomTip = tips[section][Math.floor(Math.random() * tips[section].length)];

  // Randomly select an extra tip
  const randomExtraTip = extraTips[Math.floor(Math.random() * extraTips.length)];

  // Combine and return the tips
  return `${randomTip} ${randomExtraTip}`;
      }

function addAsset() {
  const date = prompt("Enter Date (YYYY-MM-DD):", getCurrentDate());
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Asset Value:"));
  if (date && description && amount) {
    profile.balanceSheet.push({ date, description, type: "Asset", amount });
    updateBalanceSheet();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

function addLiability() {
  const date = prompt("Enter Date (YYYY-MM-DD):", getCurrentDate());
  const description = prompt("Enter Description:");
  const amount = parseFloat(prompt("Enter Liability Amount:"));
  if (date && description && amount) {
    profile.balanceSheet.push({ date, description, type: "Liability", amount });
    updateBalanceSheet();
    saveDataToLocalStorage();
  } else {
    alert("Invalid Input!");
  }
}

function updateBalanceSheet() {
  const balanceSheetBody = document.getElementById("balance-sheet-body");
  balanceSheetBody.innerHTML = "";
  let totalAssetsAmount = 0;
  let totalLiabilitiesAmount = 0;
  profile.balanceSheet.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.description}</td>
      <td>${entry.type === "Asset" ? `${profile.currency} ${entry.amount}` : ""}</td>
      <td>${entry.type === "Liability" ? `${profile.currency} ${entry.amount}` : ""}</td>
      <td class="actions">
        <button onclick="editBalanceEntry('balance', ${index})">✎</button>
        <button onclick="deleteBalanceEntry('balance', ${index})">🗑️</button>
      </td>
    `;
    balanceSheetBody.appendChild(row);
    if (entry.type === "Asset") totalAssetsAmount += entry.amount;
    if (entry.type === "Liability") totalLiabilitiesAmount += entry.amount;
  });
  totalAssets.textContent = `${profile.currency} ${totalAssetsAmount}`;
  totalLiabilities.textContent = `${profile.currency} ${totalLiabilitiesAmount}`;
  netWorthDisplay.textContent = `${profile.currency} ${totalAssetsAmount - totalLiabilitiesAmount}`;
}

function editBalanceEntry(type, index) {
  const entry = profile.balanceSheet[index];
  const newDescription = prompt("Edit Description:", entry.description);
  const newAmount = parseFloat(prompt("Edit Amount:", entry.amount));
  const newDate = prompt("Edit Date:", entry.date);
  if (newDescription && !isNaN(newAmount) && newDate) {
    entry.description = newDescription;
    entry.amount = newAmount;
    entry.date = newDate;
    updateBalanceSheet();
    saveDataToLocalStorage();
  }
}

function deleteBalanceEntry(type, index) {
  if (confirm("Are you sure you want to delete this entry?")) {
    profile.balanceSheet.splice(index, 1);
    updateBalanceSheet();
    saveDataToLocalStorage();
  }
}

function convertCurrency() {
  const amount = parseFloat(document.getElementById("amount").value);
  const from = fromCurrency.value;
  const to = toCurrency.value;
  if (!isNaN(amount) && from && to) {
    const convertedAmount = (amount / currencyRates[from]) * currencyRates[to];
    conversionResult.textContent = `${amount} ${from} = ${convertedAmount.toFixed(2)} ${to}`;
  }
}

function getCurrentDate() {
  const date = new Date();
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = month < 10 ? `0${month}` : month;
  return `${year}-${month}`;
}

function saveDataToLocalStorage() {
  localStorage.setItem("financialData", JSON.stringify(profile));
}

function loadSavedData() {
  const savedData = localStorage.getItem("financialData");
  if (savedData) {
    profile = JSON.parse(savedData);
    document.getElementById("name").value = profile.name;
    document.getElementById("age").value = profile.age;
    document.getElementById("occupation").value = profile.occupation;
    document.getElementById("dream").value = profile.dream;
    currencySelect.value = profile.currency;
    passiveIncomeTargetInput.value = profile.passiveIncomeTarget;
    updateMonthlyTable();
    updateBalanceSheet();
    updateFinancialHealth();
    populateAllocationCategories();
    updateFundAllocationTable();
  }
}

function generateStory() {
  const totalIncome = parseFloat(document.getElementById("average-income").textContent.replace(profile.currency, "").trim());
  const totalExpenses = parseFloat(document.getElementById("average-expenses").textContent.replace(profile.currency, "").trim());
  const totalAssets = parseFloat(document.getElementById("total-assets").textContent.replace(profile.currency, "").trim());
  const totalLiabilities = parseFloat(document.getElementById("total-liabilities").textContent.replace(profile.currency, "").trim());
  const netWorth = totalAssets - totalLiabilities;
  let story = `
    Meet ${profile.name}, a ${profile.age}-year-old ${profile.occupation} with a dream to ${profile.dream}. 
    Currently, ${profile.name} earns an average of ${profile.currency} ${totalIncome} per month but spends ${profile.currency} ${totalExpenses}, leaving an average cashflow of ${profile.currency} ${totalIncome - totalExpenses}. 
    They own assets worth ${profile.currency} ${totalAssets} and have liabilities of ${profile.currency} ${totalLiabilities}, resulting in a net worth of ${profile.currency} ${netWorth}. 
    Their goal is to achieve a passive income of ${profile.currency} ${profile.passiveIncomeTarget}. 
  `;
  profile.fundAllocations.categories.forEach(cat => {
    story += `
      ${cat.name} currently has a balance of ${profile.currency} ${cat.balance} with ${cat.transactions.length} transactions.
    `;
  });
  financialStory.textContent = story;
}

function toggleCalculator() {
  calculatorPopup.style.display = calculatorPopup.style.display === "block" ? "none" : "block";
}

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

function addAllocationCategory() {
  const newCategory = document.getElementById("newAllocationCategory").value;
  const newPercentage = parseFloat(document.getElementById("newAllocationPercentage").value);
  if (newCategory && !isNaN(newPercentage)) {
    if (isNaN(newPercentage) || newPercentage <= 0) {
      alert("Invalid percentage");
      return;
    }
    const totalPercentage = profile.fundAllocations.categories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (totalPercentage + newPercentage > 100) {
      alert("Total percentage exceeds 100%");
      return;
    }
    profile.fundAllocations.categories.push({
      name: newCategory,
      percentage: newPercentage,
      balance: 0,
      transactions: [],
    });
    populateAllocationCategories();
  }
}

function saveAllocations() {
  let totalPercentage = 0;
  profile.fundAllocations.categories.forEach(cat => {
    totalPercentage += cat.percentage;
  });
  if (totalPercentage === 100) {
    closeAllocationModal();
    saveDataToLocalStorage();
    updateFundAllocationTable();
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
  const categoryList = document.getElementById("allocationCategories");
  categoryList.innerHTML = "";
  profile.fundAllocations.categories.forEach((cat, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${cat.name} (${cat.percentage}%)
      <button onclick="editAllocationCategory(${index})">✎</button>
      <button onclick="deleteAllocationCategory(${index})">🗑️</button>
    `;
    categoryList.appendChild(li);
  });
}

function editAllocationCategory(index) {
  const category = profile.fundAllocations.categories[index];
  const newCategoryName = prompt("Edit Category Name:", category.name);
  const newPercentage = parseFloat(prompt("Edit Percentage:", category.percentage));
  if (newCategoryName && !isNaN(newPercentage)) {
    category.name = newCategoryName;
    category.percentage = newPercentage;
    let totalPercentage = 0;
    profile.fundAllocations.categories.forEach(cat => {
      totalPercentage += cat.percentage;
    });
    if (totalPercentage === 100) {
      populateAllocationCategories();
      saveDataToLocalStorage();
    } else {
      alert("Total percentage must be exactly 100%");
    }
  }
}

function deleteAllocationCategory(index) {
  if (confirm("Are you sure you want to delete this category?")) {
    profile.fundAllocations.categories.splice(index, 1);
    populateAllocationCategories();
    saveDataToLocalStorage();
  }
}

function updateFundAllocationTable() {
  const body = document.getElementById('fund-allocation-body');
  body.innerHTML = '';
  profile.fundAllocations.categories.forEach(cat => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cat.name}</td>
      <td>${profile.currency} ${parseFloat(cat.balance).toFixed(2)}</td>
      <td>
        <button onclick="viewCategoryTransactions(${profile.fundAllocations.categories.indexOf(cat)})">View</button>
      </td>
      <td>${cat.percentage}%</td>
    `;
    body.appendChild(row);
  });
}

function viewCategoryTransactions(categoryIndex) {
  const category = profile.fundAllocations.categories[categoryIndex];
  if (!category) return;
  const summaryText = document.getElementById('transactionSummaryText');
  summaryText.innerHTML = '';
  category.transactions.forEach(transaction => {
    const paragraph = document.createElement('p');
    paragraph.textContent = `On ${transaction.date}, an amount of ${profile.currency} ${transaction.amount} was recorded as ${transaction.type}: ${transaction.description}.`;
    summaryText.appendChild(paragraph);
  });
  document.getElementById('transactionSummaryModal').style.display = 'block';
}

function closeSummaryModal() {
  document.getElementById('transactionSummaryModal').style.display = 'none';
}

function exportData() {
  const fileName = document.getElementById("saveFileName").value || "financial_data.json";
  const data = JSON.stringify(profile);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      profile = data;
      loadSavedData();
      saveDataToLocalStorage();
      alert("Data imported successfully!");
    };
    reader.readAsText(file);
  };
  input.click();
}

function clearData() {
  if (confirm("Are you sure you want to clear all data?")) {
    localStorage.removeItem("financialData");
    location.reload();
  }
}

function shareOnWhatsApp() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://api.whatsapp.com/send?text=Check%20out%20this%20financial%20tracker%20application:%20${url}`);
}

function shareOnFacebook() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
}

function shareOnTwitter() {
  const url = encodeURIComponent(window.location.href);
  window.open(`https://twitter.com/intent/tweet?url=${url}&text=Check%20out%20this%20financial%20tracker%20application`);
}

function downloadApp() {
  window.open("https://gap-tools.github.io/GAP-Financial-Tracker/Personal", "_blank");
                          }
