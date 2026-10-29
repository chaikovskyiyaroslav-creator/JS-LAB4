const API_URL = 'https://6ae33ab5933120ae20f87b53.mockapi.io/users'; 

// Елементи DOM
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const totalCountEl = document.getElementById('total-count');
const completedCountEl = document.getElementById('completed-count');

// Масив для збереження завдань у пам'яті
let todos = [];

// ==========================================
// УТИЛІТИ TА ВІДОБРАЖЕННЯ
// ==========================================

// Показує або приховує індикатор завантаження
function toggleLoader(show) {
  if (show) {
    loader.classList.remove('hidden');
  } else {
    loader.classList.add('hidden');
  }
}

// Відображає помилку користувачу
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 5000); // Автоматично приховувати через 5 секунд
}

// Оновлює лічильники завдань
function updateCounters() {
  totalCountEl.textContent = todos.length;
  const completedCount = todos.filter(todo => todo.completed).length;
  completedCountEl.textContent = completedCount;
}

// Блокує/розблоковує форму під час асинхронних операцій
function setFormLoading(isLoading) {
  input.disabled = isLoading;
  addBtn.disabled = isLoading;
}

// Рендеринг списку завдань у DOM
function renderTodos() {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoList.innerHTML = '<li style="text-align: center; color: #888; padding: 10px;">Список завдань порожній</li>';
    updateCounters();
    return;
  }

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    
    li.innerHTML = `
      <div class="todo-content">
        <input 
          type="checkbox" 
          ${todo.completed ? 'checked' : ''} 
          onchange="toggleTodoStatus('${todo.id}', this.checked)"
        >
        <span class="todo-text">${escapeHtml(todo.name)}</span>
      </div>
      <button class="delete-btn" onclick="deleteTodo('${todo.id}')">Видалити</button>
    `;

    todoList.appendChild(li);
  });

  updateCounters();
}

// Захист від XSS ін'єкцій
function escapeHtml(string) {
  const div = document.createElement('div');
  div.textContent = string;
  return div.innerHTML;
}

// ==========================================
// ЗАПИТИ ДО REST API (Fetch API & async/await)
// ==========================================

// 1. GET: Отримання списку завдань
async function fetchTodos() {
  toggleLoader(true);
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Помилка отримання даних: ${response.status}`);
    }
    todos = await response.json();
    renderTodos();
  } catch (error) {
    showError(error.message);
  } finally {
    toggleLoader(false);
  }
}

// 2. POST: Додавання нового завдання
async function addTodo(event) {
  event.preventDefault();
  
  const text = input.value.trim();
  
  // Валідація введення
  if (!text) {
    showError('Завдання не може бути порожнім!');
    return;
  }

  const newTodo = {
    name: text,
    completed: false
  };

  setFormLoading(true);
  toggleLoader(true);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTodo)
    });

    if (!response.ok) {
      throw new Error(`Не вдалося додати завдання: ${response.status}`);
    }

    const createdTodo = await response.json();
    todos.push(createdTodo);
    renderTodos();
    input.value = ''; // Очищення поля введення
  } catch (error) {
    showError(error.message);
  } finally {
    setFormLoading(false);
    toggleLoader(false);
  }
}

// 3. DELETE: Видалення завдання за ID
async function deleteTodo(id) {
  toggleLoader(true);
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Не вдалося видалити завдання: ${response.status}`);
    }

    // Видаляємо з локального списку після успішного запиту
    todos = todos.filter(todo => todo.id !== id);
    renderTodos();
  } catch (error) {
    showError(error.message);
  } finally {
    toggleLoader(false);
  }
}

// 4. PUT/PATCH: Оновлення стану завдання (completed)
async function toggleTodoStatus(id, isCompleted) {
  toggleLoader(true);
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ completed: isCompleted })
    });

    if (!response.ok) {
      throw new Error(`Не вдалося оновити стан: ${response.status}`);
    }

    const updatedTodo = await response.json();
    
    // Оновлюємо відповідний елемент у локальному масиві
    todos = todos.map(todo => todo.id === id ? updatedTodo : todo);
    renderTodos();
  } catch (error) {
    showError(error.message);
    renderTodos();
  } finally {
    toggleLoader(false);
  }
}

// ==========================================
// СЛУХАЧІ ПОДІЙ ТА ІНІЦІАЛІЗАЦІЯ
// ==========================================

form.addEventListener('submit', addTodo);

// Завантаження завдань при старті сторінки
document.addEventListener('DOMContentLoaded', fetchTodos);