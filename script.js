 let expenses = [];
    let chart;

    // Initialize with today's date
    document.addEventListener('DOMContentLoaded', () => {
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('date').value = today;
    });

    document.getElementById('expense-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const amount = parseFloat(document.getElementById('amount').value);
      if (amount < 0) return alert("Amount cannot be negative!");

      const exp = {
        id: Date.now(),
        title: document.getElementById('title').value,
        amount,
        category: document.getElementById('category').value,
        date: document.getElementById('date').value,
        notes: document.getElementById('notes').value
      };

      expenses.push(exp);
      saveExpenses();
      displayExpenses();
      displaySummary();

      // Reset form but keep category and date
      const category = document.getElementById('category').value;
      const date = document.getElementById('date').value;
      this.reset();
      document.getElementById('category').value = category;
      document.getElementById('date').value = date;

      // Show success animation
      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.textContent = '✓ Added!';
      setTimeout(() => {
        submitBtn.textContent = 'Add Expense';
      }, 1500);
    });

    document.getElementById('filter-category').addEventListener('input', displayExpenses);
    document.getElementById('filter-date').addEventListener('input', displayExpenses);

    function saveExpenses() {
      localStorage.setItem('expenses', JSON.stringify(expenses));
    }

    function loadExpenses() {
      const stored = localStorage.getItem('expenses');
      if (stored) expenses = JSON.parse(stored);
    }

    function displayExpenses() {
      const tbody = document.getElementById('expense-table-body');
      tbody.innerHTML = '';

      let filtered = [...expenses];
      const catFilter = document.getElementById('filter-category').value.toLowerCase();
      const dateFilter = document.getElementById('filter-date').value;

      if (catFilter) filtered = filtered.filter(e => e.category.toLowerCase().includes(catFilter));
      if (dateFilter) filtered = filtered.filter(e => e.date === dateFilter);

      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (filtered.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td colspan="6" class="p-4 text-center text-gray-500">
            No expenses found. Add your first expense!
          </td>`;
        tbody.appendChild(row);
        return;
      }

      filtered.forEach(exp => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 fade-in';
        row.innerHTML = `
          <td class="p-3 text-sm font-medium text-gray-800">${exp.title}</td>
          <td class="p-3 text-sm font-semibold text-gray-800">Rs.${exp.amount.toFixed()}</td>
          <td class="p-3 text-sm"><span class="category-chip">${exp.category}</span></td>
          <td class="p-3 text-sm text-gray-600 hidden md:table-cell">${formatDate(exp.date)}</td>
          <td class="p-3 text-sm text-gray-600 hidden md:table-cell">${exp.notes || '-'}</td>
          <td class="p-3 text-sm">
            <div class="flex gap-2">
              <button onclick="editExpense(${exp.id})" 
                      class="btn-warning text-white px-3 py-1 rounded-lg text-xs font-medium">
                Edit
              </button>
              <button onclick="deleteExpense(${exp.id})" 
                      class="btn-danger text-white px-3 py-1 rounded-lg text-xs font-medium">
                Delete
              </button>
            </div>
          </td>`;
        tbody.appendChild(row);
      });
    }

    function deleteExpense(id) {
      if (confirm("Are you sure you want to delete this expense?")) {
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses();
        displayExpenses();
        displaySummary();
      }
    }

    function editExpense(id) {
      const exp = expenses.find(e => e.id === id);
      document.getElementById('title').value = exp.title;
      document.getElementById('amount').value = exp.amount;
      document.getElementById('category').value = exp.category;
      document.getElementById('date').value = exp.date;
      document.getElementById('notes').value = exp.notes;

      // Scroll to form
      document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
      document.getElementById('title').focus();

      if (confirm("Are you sure you want to Edit this expense?")) {
        expenses = expenses.filter(e => e.id !== id);
        saveExpenses();
        displayExpenses();
        displaySummary();
      }
      submitBtn = document.querySelector('Button[type = submit]').textContent = 'Update';
    }

    function displaySummary() {
      const summary = {};
      let total = 0;
      expenses.forEach(e => {
        total += e.amount;
        summary[e.category] = (summary[e.category] || 0) + e.amount;
      });

      const summaryDiv = document.getElementById('summary');
      summaryDiv.innerHTML = `
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-xs text-blue-600">Total Expenses</p>
            <p class="text-lg font-bold text-blue-800">Rs.${total.toFixed()}</p>
          </div>
          <div class="bg-purple-50 p-3 rounded-lg">
            <p class="text-xs text-purple-600">Categories</p>
            <p class="text-lg font-bold text-purple-800">${Object.keys(summary).length}</p>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <p class="text-xs text-green-600">Transactions</p>
            <p class="text-lg font-bold text-green-800">${expenses.length}</p>
          </div>
        </div>`;

      drawChart(summary);
    }

    function drawChart(summary) {
      const ctx = document.getElementById('expenseChart').getContext('2d');
      if (chart) chart.destroy();

      // Prepare data - limit to top 5 categories, group others as "Other"
      const categories = Object.keys(summary);
      const amounts = Object.values(summary);

      let chartLabels, chartData;

      if (categories.length > 5) {
        // Sort by amount descending
        const sorted = categories.map((cat, i) => ({ cat, amt: amounts[i] }))
          .sort((a, b) => b.amt - a.amt);

        const top5 = sorted.slice(0, 5);
        const others = sorted.slice(5).reduce((sum, item) => sum + item.amt, 0);

        chartLabels = [...top5.map(item => item.cat), 'Other'];
        chartData = [...top5.map(item => item.amt), others];
      } else {
        chartLabels = categories;
        chartData = amounts;
      }

      chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: chartLabels,
          datasets: [{
            data: chartData,
            backgroundColor: [
              '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E',
              '#F97316', '#F59E0B', '#10B981', '#3B82F6'
            ],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                padding: 20,
                font: {
                  size: 11
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                }
              }
            }
          },
          cutout: '70%'
        }
      });
    }

    function formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Initialize
    loadExpenses();
    displayExpenses();
    displaySummary();