<script>
  import { generateTodos, measureOperation } from "./utils/benchmark.js";

  // State using Svelte 5 runes
  let todos = $state([]);
  let newTodoName = $state("");
  let newTodoPriority = $state("low");
  let editingId = $state(null);
  let editName = $state("");
  let editPriority = $state("low");
  let benchmarkResults = $state([]);

  function addTodo() {
    if (newTodoName.trim()) {
      todos = [
        ...todos,
        {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: newTodoName.trim(),
          priority: newTodoPriority,
        },
      ];
      newTodoName = "";
      newTodoPriority = "low";
    }
  }

  function startEdit(todo) {
    editingId = todo.id;
    editName = todo.name;
    editPriority = todo.priority;
  }

  function saveEdit() {
    todos = todos.map((todo) =>
      todo.id === editingId
        ? { ...todo, name: editName, priority: editPriority }
        : todo
    );
    cancelEdit();
  }

  function cancelEdit() {
    editingId = null;
    editName = "";
    editPriority = "low";
  }

  function deleteTodo(id) {
    todos = todos.filter((todo) => todo.id !== id);
  }

  // Benchmark functions
  async function benchmarkRender(count) {
    const time = await measureOperation(() => {
      todos = generateTodos(count);
    });
    benchmarkResults = [
      ...benchmarkResults,
      { operation: `Render ${count}`, time: `${time}ms` },
    ];
  }

  async function benchmarkUpdate() {
    if (todos.length < 1000) {
      todos = generateTodos(1000);
    }
    const time = await measureOperation(() => {
      todos = todos.map((todo, index) =>
        index < 50
          ? { ...todo, name: `Updated ${todo.name}`, priority: "high" }
          : todo
      );
    });
    benchmarkResults = [
      ...benchmarkResults,
      { operation: "Update 50", time: `${time}ms` },
    ];
  }

  async function benchmarkDelete() {
    if (todos.length < 1000) {
      todos = generateTodos(1000);
    }
    const time = await measureOperation(() => {
      todos = todos.slice(50);
    });
    benchmarkResults = [
      ...benchmarkResults,
      { operation: "Delete 50", time: `${time}ms` },
    ];
  }

  async function runAllBenchmarks() {
    benchmarkResults = [];
    const results = {};

    await benchmarkRender(100);
    results.render100 = benchmarkResults[benchmarkResults.length - 1].time;
    await new Promise((r) => setTimeout(r, 50));

    await benchmarkRender(500);
    results.render500 = benchmarkResults[benchmarkResults.length - 1].time;
    await new Promise((r) => setTimeout(r, 50));

    await benchmarkRender(1000);
    results.render1000 = benchmarkResults[benchmarkResults.length - 1].time;
    await new Promise((r) => setTimeout(r, 50));

    await benchmarkUpdate();
    results.update50 = benchmarkResults[benchmarkResults.length - 1].time;
    await new Promise((r) => setTimeout(r, 50));

    await benchmarkDelete();
    results.delete50 = benchmarkResults[benchmarkResults.length - 1].time;

    console.log(JSON.stringify(results, null, 2));
  }
</script>

<main>
  <h1>Todo List (Svelte)</h1>

  <form onsubmit={(e) => { e.preventDefault(); addTodo(); }}>
    <input
      type="text"
      placeholder="Todo name"
      bind:value={newTodoName}
    />
    <select bind:value={newTodoPriority}>
      <option value="low">Low</option>
      <option value="medium">Medium</option>
      <option value="high">High</option>
    </select>
    <button type="submit">Add</button>
  </form>

  <table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Priority</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {#each todos as todo (todo.id)}
        <tr>
          {#if editingId === todo.id}
            <td>
              <input type="text" bind:value={editName} />
            </td>
            <td>
              <select bind:value={editPriority}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </td>
            <td>
              <button onclick={saveEdit}>Save</button>
              <button onclick={cancelEdit}>Cancel</button>
            </td>
          {:else}
            <td>{todo.name}</td>
            <td>{todo.priority}</td>
            <td>
              <button onclick={() => startEdit(todo)}>Edit</button>
              <button onclick={() => deleteTodo(todo.id)}>Delete</button>
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="benchmark-panel">
    <h2>Benchmarks</h2>
    <div class="benchmark-buttons">
      <button onclick={() => benchmarkRender(100)}>Render 100</button>
      <button onclick={() => benchmarkRender(500)}>Render 500</button>
      <button onclick={() => benchmarkRender(1000)}>Render 1000</button>
      <button onclick={benchmarkUpdate}>Update 50</button>
      <button onclick={benchmarkDelete}>Delete 50</button>
      <button onclick={runAllBenchmarks}>Run All</button>
    </div>
    {#if benchmarkResults.length > 0}
      <ul class="benchmark-results">
        {#each benchmarkResults as result}
          <li>{result.operation}: {result.time}</li>
        {/each}
      </ul>
    {/if}
  </div>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: system-ui, -apple-system, sans-serif;
  }

  h1 {
    text-align: center;
    margin-bottom: 2rem;
  }

  form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  input[type="text"] {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  select {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  button {
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background: #45a049;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 2rem;
  }

  th,
  td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background: #f5f5f5;
    font-weight: 600;
  }

  td button {
    margin-right: 0.5rem;
    padding: 0.25rem 0.75rem;
    font-size: 0.875rem;
  }

  td button:last-child {
    margin-right: 0;
  }

  .benchmark-panel {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .benchmark-panel h2 {
    margin-top: 0;
    margin-bottom: 1rem;
  }

  .benchmark-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .benchmark-buttons button {
    background: #2196F3;
  }

  .benchmark-buttons button:hover {
    background: #0b7dda;
  }

  .benchmark-results {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .benchmark-results li {
    padding: 0.5rem;
    background: white;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    border-left: 3px solid #4CAF50;
  }
</style>
