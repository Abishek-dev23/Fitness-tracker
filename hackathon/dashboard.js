const API = '/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

if (!token || !user) {
  window.location = '/';
}

// Display user name
document.getElementById('userName').textContent = user.name || user.email;

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location = '/';
});

async function fetchWorkouts() {
  const res = await fetch(API + '/workouts', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) {
    console.error('Failed to fetch workouts');
    return [];
  }
  return await res.json();
}

function renderWorkouts(list) {
  const ul = document.getElementById('workoutList');
  ul.innerHTML = '';
  list.forEach(w => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.innerHTML = `<strong>${w.type}</strong> — ${new Date(w.date).toLocaleDateString()} (${w.durationMinutes} min, ${w.calories} kcal)`;
    const actions = document.createElement('div');
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.style.marginLeft = '8px';
    del.addEventListener('click', () => deleteWorkout(w._id));
    actions.appendChild(del);
    li.appendChild(left);
    li.appendChild(actions);
    ul.appendChild(li);
  });
}

async function deleteWorkout(id) {
  const res = await fetch(API + '/workouts/' + id, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token }
  });
  if (res.ok) loadAndRender();
}

document.getElementById('addBtn').addEventListener('click', async () => {
  const date = document.getElementById('wDate').value;
  const type = document.getElementById('wType').value || 'Workout';
  const durationMinutes = Number(document.getElementById('wDuration').value) || 0;
  const calories = Number(document.getElementById('wCalories').value) || 0;
  const msg = document.getElementById('addMsg');

  try {
    const res = await fetch(API + '/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ date, type, durationMinutes, calories })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add');
    msg.textContent = 'Added!';
    setTimeout(()=> msg.textContent = '', 1500);
    document.getElementById('wType').value = '';
    document.getElementById('wDuration').value = '';
    document.getElementById('wCalories').value = '';
    loadAndRender();
  } catch (err) {
    msg.textContent = err.message;
  }
});

let chartInstance = null;

async function loadAndRender() {
  const workouts = await fetchWorkouts();
  renderWorkouts(workouts);
  renderChart(workouts);
}

function renderChart(workouts) {
  // Simple weekly calories sum for last 7 days
  const days = [];
  for (let i=6;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
  }
  const sums = days.map(day => {
    return workouts
      .filter(w => w.date && w.date.slice(0,10) === day)
      .reduce((s, w) => s + (w.calories || 0), 0);
  });

  const ctx = document.getElementById('chart').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days.map(d => (new Date(d)).toLocaleDateString()),
      datasets: [{ label: 'Calories (last 7 days)', data: sums }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

loadAndRender();
