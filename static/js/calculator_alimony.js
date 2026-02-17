(function() {
    const tabAlimonyBtn = document.getElementById('tab-alimony-btn');
    const tabPenaltyBtn = document.getElementById('tab-penalty-btn');
    const tabAlimony = document.getElementById('tab-alimony');
    const tabPenalty = document.getElementById('tab-penalty');
  
    if (tabAlimonyBtn && tabPenaltyBtn && tabAlimony && tabPenalty) {
        tabAlimonyBtn.addEventListener('click', function() {
          tabAlimony.style.display = 'block';
          tabPenalty.style.display = 'none';
          tabAlimonyBtn.classList.remove('calc-btn-outline');
          tabAlimonyBtn.classList.add('calc-btn-main');
          tabPenaltyBtn.classList.remove('calc-btn-main');
          tabPenaltyBtn.classList.add('calc-btn-outline');
        });
  
        tabPenaltyBtn.addEventListener('click', function() {
          tabAlimony.style.display = 'none';
          tabPenalty.style.display = 'block';
          tabPenaltyBtn.classList.remove('calc-btn-outline');
          tabPenaltyBtn.classList.add('calc-btn-main');
          tabAlimonyBtn.classList.remove('calc-btn-main');
          tabAlimonyBtn.classList.add('calc-btn-outline');
        });
      }
  })();
  
  function calcAlimony() {
    const incomeEl = document.getElementById('income');
    const childrenEl = document.getElementById('children_count');
    const resEl = document.getElementById('alimony_result');
  
    if (!incomeEl || !childrenEl || !resEl) return;
  
    const income = parseFloat((incomeEl.value || '').replace(',', '.'));
    const children = parseInt(childrenEl.value, 10);
  
    if (!income || income <= 0) {
      alert('Пожалуйста, введите корректный доход.');
      return;
    }
  
    let share = 0.25;
    if (children === 2) share = 1/3;
    if (children >= 3) share = 0.5;
  
    const monthly = Math.round(income * share);
    resEl.style.display = 'block';
    resEl.innerHTML =
      'Ориентировочный размер алиментов: <b>' + monthly.toLocaleString('ru-RU') + ' руб.</b> в месяц.' +
      '<br><span class="calc-note">Фактическая сумма может быть больше или меньше — суд учитывает доходы, наличие других детей, состояние здоровья и другие обстоятельства.</span>';
  }
  
  function calcPenalty() {
    const monthlyEl = document.getElementById('monthly_alimony');
    const daysEl = document.getElementById('delay_days');
    const resEl = document.getElementById('penalty_result');
  
    if (!monthlyEl || !daysEl || !resEl) return;
  
    const monthly = parseFloat((monthlyEl.value || '').replace(',', '.'));
    const days = parseInt(daysEl.value, 10);
  
    if (!monthly || monthly <= 0) {
      alert('Пожалуйста, введите корректный размер ежемесячных алиментов.');
      return;
    }
    if (!days || days <= 0) {
      alert('Пожалуйста, введите количество дней просрочки.');
      return;
    }
  
    const debt = monthly * (days / 30.0);
    const penalty = debt * 0.001 * days; // 0,1% за каждый день просрочки
  
    const roundedDebt = Math.round(debt);
    const roundedPenalty = Math.round(penalty);
  
    resEl.style.display = 'block';
    resEl.innerHTML =
      'Ориентировочная сумма задолженности: <b>' + roundedDebt.toLocaleString('ru-RU') + ' руб.</b><br>' +
      'Ориентировочная неустойка (0,1% за каждый день): <b>' + roundedPenalty.toLocaleString('ru-RU') + ' руб.</b>' +
      '<br><span class="calc-note">Для точного расчёта задолженности и неустойки необходимо учитывать реальные даты и суммы платежей, а также данные от судебного пристава.</span>';
  }
