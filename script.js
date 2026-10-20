const $ = id => document.getElementById(id);
let currentSubject = null;
let currentChapter = null;

// Запуск анимации интерфейса при загрузке
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => { document.body.classList.add('site-loaded'); }, 100);
});

// --- ЛОГИКА СМЕНЫ ТЕМЫ ---
const themeToggleBtn = $('theme-toggle');
const iconMoon = $('icon-moon');
const iconSun = $('icon-sun');

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.body.classList.add('light-theme');
  iconMoon.style.display = 'none';
  iconSun.style.display = 'block';
}

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  const isLight = document.body.classList.contains('light-theme');
  if (isLight) {
    iconMoon.style.display = 'none'; iconSun.style.display = 'block'; localStorage.setItem('theme', 'light');
  } else {
    iconMoon.style.display = 'block'; iconSun.style.display = 'none'; localStorage.setItem('theme', 'dark');
  }
});

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function showLoader() {
  $('content').innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
}

// Умная функция загрузки: показывает спиннер только если загрузка идет дольше 300мс
function fetchWithLoader(url, onSuccess, onError) {
  let isSlow = false;
  
  const slowTimer = setTimeout(() => {
    isSlow = true;
    showLoader();
  }, 300);

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Файл не найден');
      return res.json();
    })
    .then(data => {
      clearTimeout(slowTimer); 
      onSuccess(data);
    })
    .catch(err => {
      clearTimeout(slowTimer);
      onError(err);
    });
}

// --- СТАРТ ---
fetch('./data/index.json')
  .then(r => r.json())
  .then(renderSubjects)
  .catch(e => $('subjects').textContent = 'Ошибка загрузки манифеста');

function renderSubjects(subjects) {
  $('subjects').innerHTML = subjects
    .map(s => `<button data-id="${s.id}" data-title="${s.title}">${s.title}</button>`)
    .join('');
  $('subjects').querySelectorAll('button').forEach(btn => {
    btn.onclick = () => openSubject(btn.dataset.id, btn.dataset.title);
  });
}

// --- КЛИК ПО ПРЕДМЕТУ ---
async function openSubject(id, title) {
  if (currentSubject === id) return;
  currentSubject = id;
  currentChapter = null;
  $('chapters').innerHTML = ''; 
  
  fetchWithLoader(
    `./data/${id}/index.json`,
    (chapters) => {
      renderChapters(id, chapters);
      $('content').innerHTML = `<div class="chapter-content"><p><b>${title}</b> — выбери параграф.</p></div>`;
    },
    () => {
      $('content').innerHTML = '<div class="chapter-content"><p>Не удалось загрузить список параграфов.</p></div>';
    }
  );
}

// --- ОТРИСОВКА ПАРАГРАФОВ (С УЧЕТОМ ТЕЛЕФОНА) ---
function renderChapters(subjectId, chapters) {
  const isMobile = window.innerWidth <= 768;
  const baseDelay = isMobile ? 0.4 : 0; // На телефоне ждем, пока выедет блок

  const html = chapters
    .map((c, index) => {
      const delay = baseDelay + (index * 0.05); 
      return `<button class="chapter-item" data-file="${c.file}" data-title="${c.title}" style="animation-delay: ${delay}s">${c.title}</button>`;
    })
    .join('');
    
  $('chapters').innerHTML = html;

  $('chapters').querySelectorAll('button').forEach(btn => {
    btn.onclick = () => openChapter(subjectId, btn.dataset.file, btn.dataset.title);
  });
}

// --- КЛИК ПО ПАРАГРАФУ ---
async function openChapter(subjectId, file, title) {
  if (currentChapter === file) return;
  currentChapter = file;
  
  fetchWithLoader(
    `./data/${subjectId}/${file}`,
    (data) => {
      renderChapter(data, title);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'chapter-content';
      contentDiv.innerHTML = $('content').innerHTML;
      $('content').innerHTML = '';
      $('content').appendChild(contentDiv);
    },
    () => {
      $('content').innerHTML = '<div class="chapter-content"><p>Не удалось загрузить параграф.</p></div>';
    }
  );
}

function renderChapter(data, fallbackTitle) {
  const parts = [];
  parts.push(`<h2>${data.title || fallbackTitle}</h2>`);
  if (data.summary?.length) {
    parts.push('<div class="summary">' + data.summary.map(p => `<p>${p}</p>`).join('') + '</div>');
  }
  if (data.terms?.length) {
    parts.push('<h3>Понятия</h3><ul>' + data.terms.map(t => `<li><b>${t.term}:</b> ${t.text}</li>`).join('') + '</ul>');
  }
  if (data.key_points?.length) {
    parts.push('<h3>Главное</h3><ul>' + data.key_points.map(k => `<li>${k}</li>`).join('') + '</ul>');
  }
  $('content').innerHTML = parts.join('');
}

// --- МОДАЛЬНОЕ ОКНО ---
const modal = $('info-modal');
$('info-btn').onclick = () => { modal.classList.add('show'); };
$('close-modal').onclick = () => { modal.classList.remove('show'); };
window.onclick = (event) => { if (event.target === modal) modal.classList.remove('show'); };

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab).classList.add('active');
  };
});