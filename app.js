/**
 * Finance Tracker — app.js
 * Pure HTML/CSS/JS spending tracker with localStorage persistence.
 */

// ─── State ────────────────────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('ft_transactions') || '[]');

// ─── DOM References ───────────────────────────────────────────────────────────
const form             = document.getElementById('transaction-form');
const descInput        = document.getElementById('description');
const amountInput      = document.getElementById('amount');
const typeSelect       = document.getElementById('type');
const categorySelect   = document.getElementById('category');
const dateInput        = document.getElementById('date');

const balanceEl        = document.getElementById('balance');
const totalIncomeEl    = document.getElementById('total-income');
const totalExpenseEl   = document.getElementById('total-expense');

const transactionList  = document.getElementById('transaction-list');
const emptyMsg         = document.getElementById('empty-msg');

const searchInput      = document.getElementById('search');
const filterType       = document.getElementById('filter-type');
const filterCategory   = document.getElementById('filter-category');
const btnClearAll      = document.getElementById('btn-clear-all');

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(value) {
  return '$' + Math.abs(value).toFixed(2);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function saveTransactions() {
  localStorage.setItem('ft_transactions', JSON.stringify(transactions));
}

// ─── Summary ─────────────────────────────────────────────────────────────────
function updateSummary() {
  const income  = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expense;

  balanceEl.textContent     = (balance >= 0 ? '' : '-') + formatCurrency(balance);
  balanceEl.style.color     = balance < 0 ? '#fca5a5' : '#fff';

  totalIncomeEl.textContent  = formatCurrency(income);
  totalExpenseEl.textContent = formatCurrency(expense);
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderTransactions() {
  const search   = searchInput.value.toLowerCase().trim();
  const typeVal  = filterType.value;
  const catVal   = filterCategory.value;

  const filtered = transactions.filter(t => {
    const matchSearch   = t.description.toLowerCase().includes(search);
    const matchType     = typeVal === 'all' || t.type === typeVal;
    const matchCategory = catVal === 'all' || t.category === catVal;
    return matchSearch && matchType && matchCategory;
  });

  // Sort newest first
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);

  transactionList.innerHTML = '';

  if (filtered.length === 0) {
    emptyMsg.style.display = 'block';
  } else {
    emptyMsg.style.display = 'none';
    filtered.forEach(t => {
      const li = document.createElement('li');
      li.className = `transaction-item ${t.type}`;
      li.dataset.id = t.id;

      const sign = t.type === 'income' ? '+' : '-';

      li.innerHTML = `
        <div class="transaction-info">
          <span class="transaction-desc">${escapeHtml(t.description)}</span>
          <span class="transaction-meta">
            <span>${formatDate(t.date)}</span>
            <span class="category-badge">${escapeHtml(t.category)}</span>
          </span>
        </div>
        <div class="transaction-right">
          <span class="transaction-amount ${t.type}">${sign}${formatCurrency(t.amount)}</span>
          <button class="btn-delete" aria-label="Delete transaction" data-id="${t.id}">&#x2715;</button>
        </div>
      `;
      transactionList.appendChild(li);
    });
  }

  updateSummary();
}

// Avoid XSS from user-supplied descriptions
function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// ─── Add Transaction ─────────────────────────────────────────────────────────
form.addEventListener('submit', function (e) {
  e.preventDefault();

  const description = descInput.value.trim();
  const amount      = parseFloat(amountInput.value);
  const type        = typeSelect.value;
  const category    = categorySelect.value;
  const date        = dateInput.value;

  if (!description || isNaN(amount) || amount <= 0 || !date) {
    alert('Please fill in all fields with valid values.');
    return;
  }

  const newTransaction = {
    id:          generateId(),
    description,
    amount,
    type,
    category,
    date,
    createdAt:   Date.now(),
  };

  transactions.push(newTransaction);
  saveTransactions();
  renderTransactions();

  // Reset form (keep date & type for convenience)
  descInput.value   = '';
  amountInput.value = '';
  descInput.focus();
});

// ─── Delete Transaction ───────────────────────────────────────────────────────
transactionList.addEventListener('click', function (e) {
  const btn = e.target.closest('.btn-delete');
  if (!btn) return;

  const id = btn.dataset.id;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
  renderTransactions();
});

// ─── Filter / Search ─────────────────────────────────────────────────────────
searchInput.addEventListener('input', renderTransactions);
filterType.addEventListener('change', renderTransactions);
filterCategory.addEventListener('change', renderTransactions);

// ─── Clear All ────────────────────────────────────────────────────────────────
btnClearAll.addEventListener('click', function () {
  if (transactions.length === 0) return;
  if (confirm('Are you sure you want to delete all transactions?')) {
    transactions = [];
    saveTransactions();
    renderTransactions();
  }
});

// ─── Set default date to today ────────────────────────────────────────────────
(function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
})();

// ─── Initial Render ───────────────────────────────────────────────────────────
renderTransactions();
