<script setup>
import { ref, reactive } from 'vue';
import { generateTodos, measureOperation } from './utils/benchmark';

const todos = ref([]);
const newTodoName = ref('');
const newTodoPriority = ref('low');
const editingId = ref(null);
const editForm = reactive({
  name: '',
  priority: 'low'
});
const benchmarkResults = ref([]);

function addTodo() {
  if (!newTodoName.value.trim()) return;

  todos.value.push({
    id: crypto.randomUUID(),
    name: newTodoName.value,
    priority: newTodoPriority.value
  });

  newTodoName.value = '';
  newTodoPriority.value = 'low';
}

function startEdit(todo) {
  editingId.value = todo.id;
  editForm.name = todo.name;
  editForm.priority = todo.priority;
}

function saveEdit(todo) {
  todo.name = editForm.name;
  todo.priority = editForm.priority;
  cancelEdit();
}

function cancelEdit() {
  editingId.value = null;
  editForm.name = '';
  editForm.priority = 'low';
}

function deleteTodo(id) {
  todos.value = todos.value.filter(todo => todo.id !== id);
}

async function benchmarkRender(count) {
  const time = await measureOperation(() => {
    todos.value = generateTodos(count);
  });
  benchmarkResults.value.push(`Render ${count}: ${time}ms`);
}

async function benchmarkUpdate() {
  if (todos.value.length < 1000) {
    todos.value = generateTodos(1000);
  }

  const time = await measureOperation(() => {
    for (let i = 0; i < 50; i++) {
      if (todos.value[i]) {
        todos.value[i].name = `Updated Task ${i + 1}`;
        todos.value[i].priority = i % 2 === 0 ? 'high' : 'low';
      }
    }
  });
  benchmarkResults.value.push(`Update 50: ${time}ms`);
}

async function benchmarkDelete() {
  if (todos.value.length < 1000) {
    todos.value = generateTodos(1000);
  }

  const time = await measureOperation(() => {
    todos.value = todos.value.slice(50);
  });
  benchmarkResults.value.push(`Delete 50: ${time}ms`);
}

async function runAllBenchmarks() {
  benchmarkResults.value = [];
  const results = {};

  await benchmarkRender(100);
  results.render100 = parseFloat(benchmarkResults.value[0].split(': ')[1]);
  await new Promise(r => setTimeout(r, 100));

  await benchmarkRender(500);
  results.render500 = parseFloat(benchmarkResults.value[1].split(': ')[1]);
  await new Promise(r => setTimeout(r, 100));

  await benchmarkRender(1000);
  results.render1000 = parseFloat(benchmarkResults.value[2].split(': ')[1]);
  await new Promise(r => setTimeout(r, 100));

  await benchmarkUpdate();
  results.update50 = parseFloat(benchmarkResults.value[3].split(': ')[1]);
  await new Promise(r => setTimeout(r, 100));

  await benchmarkDelete();
  results.delete50 = parseFloat(benchmarkResults.value[4].split(': ')[1]);

  console.log(JSON.stringify(results, null, 2));
}
</script>

<template>
  <div class="app">
    <h1>Todo List (Vue)</h1>

    <div class="form">
      <input
        v-model="newTodoName"
        type="text"
        placeholder="Task name"
        @keyup.enter="addTodo"
      />
      <select v-model="newTodoPriority">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button @click="addTodo">Add</button>
    </div>

    <table v-if="todos.length > 0">
      <thead>
        <tr>
          <th>Name</th>
          <th>Priority</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="todo in todos" :key="todo.id">
          <td>
            <input
              v-if="editingId === todo.id"
              v-model="editForm.name"
              type="text"
            />
            <span v-else>{{ todo.name }}</span>
          </td>
          <td>
            <select
              v-if="editingId === todo.id"
              v-model="editForm.priority"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <span v-else>{{ todo.priority }}</span>
          </td>
          <td>
            <template v-if="editingId === todo.id">
              <button @click="saveEdit(todo)">Save</button>
              <button @click="cancelEdit">Cancel</button>
            </template>
            <template v-else>
              <button @click="startEdit(todo)">Edit</button>
              <button @click="deleteTodo(todo.id)">Delete</button>
            </template>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="benchmark-panel">
      <h2>Benchmarks</h2>
      <div class="benchmark-buttons">
        <button @click="benchmarkRender(100)">Render 100</button>
        <button @click="benchmarkRender(500)">Render 500</button>
        <button @click="benchmarkRender(1000)">Render 1000</button>
        <button @click="benchmarkUpdate">Update 50</button>
        <button @click="benchmarkDelete">Delete 50</button>
        <button @click="runAllBenchmarks">Run All</button>
      </div>
      <ul v-if="benchmarkResults.length > 0" class="results">
        <li v-for="(result, index) in benchmarkResults" :key="index">
          {{ result }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin-top: 0;
  color: #333;
}

h2 {
  color: #333;
  font-size: 1.2em;
  margin-top: 0;
}

.form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.form input[type="text"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form button {
  padding: 8px 16px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.form button:hover {
  background-color: #359268;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f8f8;
  font-weight: 600;
  color: #333;
}

td input[type="text"] {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

td select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

td button {
  padding: 6px 12px;
  margin-right: 5px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

td button:hover {
  background-color: #359268;
}

td button:last-child {
  background-color: #e74c3c;
}

td button:last-child:hover {
  background-color: #c0392b;
}

.benchmark-panel {
  border-top: 2px solid #ddd;
  padding-top: 20px;
}

.benchmark-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.benchmark-buttons button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.benchmark-buttons button:hover {
  background-color: #2980b9;
}

.benchmark-buttons button:last-child {
  background-color: #9b59b6;
}

.benchmark-buttons button:last-child:hover {
  background-color: #8e44ad;
}

.results {
  list-style: none;
  padding: 0;
  margin: 0;
}

.results li {
  padding: 8px 12px;
  background-color: #f8f8f8;
  margin-bottom: 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}
</style>
