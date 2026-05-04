const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-button');
const emptyState = document.getElementById('empty-state');

let tasks = [];
let activeFilter = 'all';

const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');
const themeLabel = themeToggle?.querySelector('.theme-label');

function loadTheme() {
  const storedTheme = localStorage.getItem('taskManagerTheme');
  const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(storedTheme || defaultTheme);
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('light-theme', !isDark);
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(!isDark));
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    themeLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
  localStorage.setItem('taskManagerTheme', theme);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
  applyTheme(currentTheme === 'light' ? 'dark' : 'light');
}

// Load existing tasks from localStorage when the app starts.
function loadTasks() {
  const storedTasks = localStorage.getItem('taskManagerTasks');
  tasks = storedTasks ? JSON.parse(storedTasks) : [];
}

// Save the current task list to localStorage.
function saveTasks() {
  localStorage.setItem('taskManagerTasks', JSON.stringify(tasks));
}

// Format a date object into a readable timestamp string.
function formatTimestamp(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Create a task list item element with buttons and metadata.
function createTaskItem(task) {
  const item = document.createElement('li');
  item.className = `task-item${task.completed ? ' completed' : ''}`;
  item.dataset.id = task.id;

  const completeButton = document.createElement('button');
  completeButton.className = `checkbox-button${task.completed ? ' completed' : ''}`;
  completeButton.type = 'button';
  completeButton.innerHTML = task.completed ? '✓' : '○';
  completeButton.title = task.completed ? 'Mark as incomplete' : 'Mark as completed';
  completeButton.addEventListener('click', () => toggleTaskCompletion(task.id));

  const content = document.createElement('div');
  content.className = 'task-content';

  const text = document.createElement('p');
  text.className = `task-text${task.completed ? ' completed' : ''}`;
  text.textContent = task.text;

  const timestamp = document.createElement('p');
  timestamp.className = 'timestamp';
  timestamp.textContent = `Created ${formatTimestamp(task.createdAt)}`;

  content.append(text, timestamp);

  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'action-button';
  editButton.textContent = 'Edit';
  editButton.addEventListener('click', () => editTask(task.id));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'action-button delete';
  deleteButton.textContent = 'Delete';
  deleteButton.addEventListener('click', () => deleteTask(task.id));

  actions.append(editButton, deleteButton);
  item.append(completeButton, content, actions);
  return item;
}

// Re-render the list based on current filter and stored tasks.
function renderTasks() {
  taskList.innerHTML = '';

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'active') return !task.completed;
    if (activeFilter === 'completed') return task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }

  filteredTasks.forEach(task => {
    const taskItem = createTaskItem(task);
    taskList.appendChild(taskItem);
  });
}

// Add a new task. Reject empty submissions.
function addTask(text) {
  const trimmedText = text.trim();
  if (!trimmedText) {
    taskInput.classList.add('invalid');
    taskInput.focus();
    return;
  }

  const newTask = {
    id: Date.now().toString(),
    text: trimmedText,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  taskInput.value = '';
}

// Toggle whether a task is completed.
function toggleTaskCompletion(id) {
  tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();
}

// Edit the text of an existing task.
function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;

  const updatedText = prompt('Update task text', task.text);
  if (updatedText === null) return;

  const trimmedText = updatedText.trim();
  if (!trimmedText) return;

  task.text = trimmedText;
  saveTasks();
  renderTasks();
}

// Delete a task with a smooth fade-out effect.
function deleteTask(id) {
  const item = document.querySelector(`li[data-id="${id}"]`);
  if (item) {
    item.style.opacity = '0';
    item.style.transform = 'translateX(12px)';
    setTimeout(() => {
      tasks = tasks.filter(task => task.id !== id);
      saveTasks();
      renderTasks();
    }, 180);
  } else {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
  }
}

// Switch the active filter button and refresh the view.
function setFilter(filter) {
  activeFilter = filter;
  filterButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.filter === filter);
  });
  renderTasks();
}

// Handle form submission for new tasks.
taskForm.addEventListener('submit', event => {
  event.preventDefault();
  addTask(taskInput.value);
});

// Prevent invalid submissions and remove invalid styling when the user types.
taskInput.addEventListener('input', () => {
  taskInput.classList.remove('invalid');
});

// Wire the filter buttons.
filterButtons.forEach(button => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// Initialize the app state and render tasks.
loadTheme();
loadTasks();
renderTasks();
