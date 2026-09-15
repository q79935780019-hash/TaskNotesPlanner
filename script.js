/* ==================== ИНИЦИАЛИЗАЦИЯ ==================== */
let currentSection = 'notes';
let editingId = null;
let notes = [];
let tasks = [];
let plans = [];

// Загрузить данные из localStorage при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromStorage();
    initializeEventListeners();
    renderNotes();
    updateProgress();
});

/* ==================== УПРАВЛЕНИЕ ХРАНИЛИЩЕМ ==================== */
function saveDataToStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('plans', JSON.stringify(plans));
}

function loadDataFromStorage() {
    notes = JSON.parse(localStorage.getItem('notes')) || [];
    tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    plans = JSON.parse(localStorage.getItem('plans')) || [];
}

/* ==================== СЛУШАТЕЛИ СОБЫТИЙ ==================== */
function initializeEventListeners() {
    // Навигация
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchSection(this.dataset.section);
        });
    });

    // Кнопка добавить
    document.getElementById('add-btn').addEventListener('click', openModal);

    // Модальное окно
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('save-btn').addEventListener('click', saveItem);
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Фильтры задач
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderTasks(this.dataset.filter);
        });
    });

    // Поиск
    document.getElementById('search-input').addEventListener('input', performSearch);
}

/* ==================== ПЕРЕКЛЮЧЕНИЕ СЕКЦИЙ ==================== */
function switchSection(section) {
    currentSection = section;

    // Обновить активные кнопки навигации
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Обновить активную секцию
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');

    // Обновить заголовок
    const titles = {
        notes: 'Мои Заметки',
        tasks: 'Мои Задачи',
        plans: 'Мои Планы',
        progress: 'Прогресс'
    };
    document.getElementById('section-title').textContent = titles[section];

    // Показать/скрыть кнопку добавить
    document.getElementById('add-btn').style.display = section !== 'progress' ? 'block' : 'none';
    document.getElementById('search-input').style.display = section !== 'progress' ? 'block' : 'none';

    // Отрендерить контент
    if (section === 'notes') renderNotes();
    if (section === 'tasks') renderTasks('all');
    if (section === 'plans') renderPlans();
    if (section === 'progress') updateProgress();
}

/* ==================== МОДАЛЬНОЕ ОКНО ==================== */
function openModal() {
    editingId = null;
    document.getElementById('input-title').value = '';
    document.getElementById('input-description').value = '';
    document.getElementById('input-priority').value = 'medium';
    document.getElementById('input-duedate').value = '';
    document.getElementById('input-start-date').value = '';
    document.getElementById('input-end-date').value = '';

    // Обновить заголовок и видимость полей в зависимости от секции
    const titles = {
        notes: 'Добавить заметку',
        tasks: 'Добавить задачу',
        plans: 'Добавить план'
    };
    document.getElementById('modal-title').textContent = titles[currentSection];

    // Показать/скрыть опции
    document.getElementById('task-options').style.display = currentSection === 'tasks' ? 'block' : 'none';
    document.getElementById('plan-options').style.display = currentSection === 'plans' ? 'block' : 'none';

    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    editingId = null;
}

function saveItem() {
    const title = document.getElementById('input-title').value.trim();
    const description = document.getElementById('input-description').value.trim();

    if (!title) {
        alert('Пожалуйста, введите название');
        return;
    }

    const timestamp = new Date().toLocaleString('ru-RU');
    const id = editingId || Date.now();

    if (currentSection === 'notes') {
        const noteIndex = notes.findIndex(n => n.id === editingId);
        const note = {
            id,
            title,
            description,
            created: editingId ? notes[noteIndex].created : timestamp,
            modified: timestamp
        };
        if (noteIndex > -1) {
            notes[noteIndex] = note;
        } else {
            notes.push(note);
        }
        renderNotes();
    } else if (currentSection === 'tasks') {
        const priority = document.getElementById('input-priority').value;
        const duedate = document.getElementById('input-duedate').value;

        const taskIndex = tasks.findIndex(t => t.id === editingId);
        const task = {
            id,
            title,
            description,
            priority,
            duedate,
            completed: editingId ? tasks[taskIndex].completed : false,
            created: editingId ? tasks[taskIndex].created : timestamp,
            modified: timestamp
        };
        if (taskIndex > -1) {
            tasks[taskIndex] = task;
        } else {
            tasks.push(task);
        }
        renderTasks('all');
    } else if (currentSection === 'plans') {
        const startDate = document.getElementById('input-start-date').value;
        const endDate = document.getElementById('input-end-date').value;

        const planIndex = plans.findIndex(p => p.id === editingId);
        const plan = {
            id,
            title,
            description,
            startDate,
            endDate,
            created: editingId ? plans[planIndex].created : timestamp,
            modified: timestamp
        };
        if (planIndex > -1) {
            plans[planIndex] = plan;
        } else {
            plans.push(plan);
        }
        renderPlans();
    }

    saveDataToStorage();
    updateProgress();
    closeModal();
}

/* ==================== ОТРИСОВКА ЗАМЕТОК ==================== */
function renderNotes() {
    const notesList = document.getElementById('notes-list');

    if (notes.length === 0) {
        notesList.innerHTML = `
            <div class="empty-state">
                <p>📭 Нет заметок</p>
                <small>Нажмите кнопку "Добавить" чтобы создать новую заметку</small>
            </div>
        `;
        return;
    }

    notesList.innerHTML = notes.map(note => `
        <div class="note-card">
            <div class="note-title">${escapeHtml(note.title)}</div>
            <div class="note-description">${escapeHtml(note.description)}</div>
            <div class="note-date">Изменено: ${note.modified}</div>
            <div class="note-actions">
                <button class="edit-btn" onclick="editNote(${note.id})">✏️ Редактировать</button>
                <button class="delete-btn" onclick="deleteNote(${note.id})">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (note) {
        editingId = id;
        document.getElementById('input-title').value = note.title;
        document.getElementById('input-description').value = note.description;
        document.getElementById('modal-title').textContent = 'Редактировать заметку';
        document.getElementById('task-options').style.display = 'none';
        document.getElementById('plan-options').style.display = 'none';
        document.getElementById('modal').classList.add('active');
    }
}

function deleteNote(id) {
    if (confirm('Вы уверены?')) {
        notes = notes.filter(n => n.id !== id);
        saveDataToStorage();
        renderNotes();
    }
}

/* ==================== ОТРИСОВКА ЗАДАЧ ==================== */
function renderTasks(filter = 'all') {
    const tasksList = document.getElementById('tasks-list');
    let filteredTasks = tasks;

    if (filter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <p>📭 Нет задач</p>
                <small>Создавайте задачи и отслеживайте их выполнение</small>
            </div>
        `;
        return;
    }

    tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''} ${task.priority}-priority">
            <div class="task-content">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <div class="task-meta">
                    <span>🎯 ${getPriorityLabel(task.priority)}</span>
                    ${task.duedate ? `<span>📅 ${task.duedate}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleTask(${task.id})">
                <button class="edit-btn" onclick="editTask(${task.id})">✏️</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function getPriorityLabel(priority) {
    const labels = {
        high: 'Высокий приоритет',
        medium: 'Средний приоритет',
        low: 'Низкий приоритет'
    };
    return labels[priority] || priority;
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.modified = new Date().toLocaleString('ru-RU');
        saveDataToStorage();
        updateProgress();
        renderTasks('all');
    }
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        editingId = id;
        document.getElementById('input-title').value = task.title;
        document.getElementById('input-description').value = task.description;
        document.getElementById('input-priority').value = task.priority;
        document.getElementById('input-duedate').value = task.duedate;
        document.getElementById('modal-title').textContent = 'Редактировать задачу';
        document.getElementById('task-options').style.display = 'block';
        document.getElementById('plan-options').style.display = 'none';
        document.getElementById('modal').classList.add('active');
    }
}

function deleteTask(id) {
    if (confirm('Вы уверены?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveDataToStorage();
        updateProgress();
        renderTasks('all');
    }
}

/* ==================== ОТРИСОВКА ПЛАНОВ ==================== */
function renderPlans() {
    const plansList = document.getElementById('plans-list');

    if (plans.length === 0) {
        plansList.innerHTML = `
            <div class="empty-state">
                <p>📭 Нет планов</p>
                <small>Создавайте долгосрочные планы и цели</small>
            </div>
        `;
        return;
    }

    plansList.innerHTML = plans.map(plan => `
        <div class="plan-card">
            <div class="plan-title">${escapeHtml(plan.title)}</div>
            <div class="plan-dates">
                <span>${plan.startDate || 'Нет даты'}</span>
                <span>→</span>
                <span>${plan.endDate || 'Нет даты'}</span>
            </div>
            <div class="plan-description">${escapeHtml(plan.description)}</div>
            <div class="plan-actions">
                <button class="edit-btn" onclick="editPlan(${plan.id})">✏️ Редактировать</button>
                <button class="delete-btn" onclick="deletePlan(${plan.id})">🗑️ Удалить</button>
            </div>
        </div>
    `).join('');
}

function editPlan(id) {
    const plan = plans.find(p => p.id === id);
    if (plan) {
        editingId = id;
        document.getElementById('input-title').value = plan.title;
        document.getElementById('input-description').value = plan.description;
        document.getElementById('input-start-date').value = plan.startDate;
        document.getElementById('input-end-date').value = plan.endDate;
        document.getElementById('modal-title').textContent = 'Редактировать план';
        document.getElementById('task-options').style.display = 'none';
        document.getElementById('plan-options').style.display = 'block';
        document.getElementById('modal').classList.add('active');
    }
}

function deletePlan(id) {
    if (confirm('Вы уверены?')) {
        plans = plans.filter(p => p.id !== id);
        saveDataToStorage();
        renderPlans();
    }
}

/* ==================== ОБНОВЛЕНИЕ ПРОГРЕССА ==================== */
function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('progress-percent').textContent = progressPercent + '%';
    document.getElementById('total-notes').textContent = notes.length;

    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = progressPercent + '%';
    progressBar.textContent = progressPercent > 10 ? progressPercent + '%' : '';
}

/* ==================== ПОИСК ==================== */
function performSearch() {
    const query = document.getElementById('search-input').value.toLowerCase();

    if (currentSection === 'notes') {
        const filtered = notes.filter(n => 
            n.title.toLowerCase().includes(query) || 
            n.description.toLowerCase().includes(query)
        );
        renderSearchResults(filtered, 'notes');
    } else if (currentSection === 'tasks') {
        const filtered = tasks.filter(t => 
            t.title.toLowerCase().includes(query) || 
            t.description.toLowerCase().includes(query)
        );
        renderSearchResults(filtered, 'tasks');
    } else if (currentSection === 'plans') {
        const filtered = plans.filter(p => 
            p.title.toLowerCase().includes(query) || 
            p.description.toLowerCase().includes(query)
        );
        renderSearchResults(filtered, 'plans');
    }
}

function renderSearchResults(results, type) {
    if (type === 'notes') {
        const notesList = document.getElementById('notes-list');
        if (results.length === 0) {
            notesList.innerHTML = '<div class="empty-state"><p>🔍 Ничего не найдено</p></div>';
            return;
        }
        notesList.innerHTML = results.map(note => `
            <div class="note-card">
                <div class="note-title">${escapeHtml(note.title)}</div>
                <div class="note-description">${escapeHtml(note.description)}</div>
                <div class="note-date">Изменено: ${note.modified}</div>
                <div class="note-actions">
                    <button class="edit-btn" onclick="editNote(${note.id})">✏️ Редактировать</button>
                    <button class="delete-btn" onclick="deleteNote(${note.id})">🗑️ Удалить</button>
                </div>
            </div>
        `).join('');
    }
    // Аналогично для tasks и plans
}

/* ==================== УТИЛИТЫ ==================== */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
