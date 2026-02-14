import { useState } from 'react';
import { generateTodos, measureOperation } from './utils/benchmark';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('low');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState('low');
  const [benchmarkResults, setBenchmarkResults] = useState([]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (name.trim()) {
      setTodos([...todos, {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: name.trim(),
        priority
      }]);
      setName('');
      setPriority('low');
    }
  };

  const handleEdit = (todo) => {
    setEditingId(todo.id);
    setEditName(todo.name);
    setEditPriority(todo.priority);
  };

  const handleSave = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id
        ? { ...todo, name: editName, priority: editPriority }
        : todo
    ));
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const addBenchmarkResult = (operation, duration) => {
    setBenchmarkResults(prev => [...prev, { operation, duration }]);
  };

  const benchmarkRender = async (count) => {
    const duration = await measureOperation(() => {
      setTodos(generateTodos(count));
    });
    addBenchmarkResult(`Render ${count}`, duration);
  };

  const benchmarkUpdate = async () => {
    if (todos.length < 1000) {
      setTodos(generateTodos(1000));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = await measureOperation(() => {
      setTodos(current =>
        current.map((todo, idx) =>
          idx < 50
            ? { ...todo, name: `Updated ${todo.name}`, priority: 'high' }
            : todo
        )
      );
    });
    addBenchmarkResult('Update 50', duration);
  };

  const benchmarkDelete = async () => {
    if (todos.length < 1000) {
      setTodos(generateTodos(1000));
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = await measureOperation(() => {
      setTodos(current => current.slice(50));
    });
    addBenchmarkResult('Delete 50', duration);
  };

  const benchmarkRunAll = async () => {
    setBenchmarkResults([]);

    const results = {};

    let duration = await measureOperation(() => setTodos(generateTodos(100)));
    results['Render 100'] = duration;
    addBenchmarkResult('Render 100', duration);
    await new Promise(resolve => setTimeout(resolve, 100));

    duration = await measureOperation(() => setTodos(generateTodos(500)));
    results['Render 500'] = duration;
    addBenchmarkResult('Render 500', duration);
    await new Promise(resolve => setTimeout(resolve, 100));

    duration = await measureOperation(() => setTodos(generateTodos(1000)));
    results['Render 1000'] = duration;
    addBenchmarkResult('Render 1000', duration);
    await new Promise(resolve => setTimeout(resolve, 100));

    duration = await measureOperation(() => {
      setTodos(current =>
        current.map((todo, idx) =>
          idx < 50
            ? { ...todo, name: `Updated ${todo.name}`, priority: 'high' }
            : todo
        )
      );
    });
    results['Update 50'] = duration;
    addBenchmarkResult('Update 50', duration);
    await new Promise(resolve => setTimeout(resolve, 100));

    duration = await measureOperation(() => setTodos(current => current.slice(50)));
    results['Delete 50'] = duration;
    addBenchmarkResult('Delete 50', duration);

    console.log(JSON.stringify(results, null, 2));
  };

  return (
    <div className="app">
      <h1>Todo List (React)</h1>

      <form onSubmit={handleAdd} className="todo-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Task name"
          className="input-text"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="input-select"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="btn-add">Add</button>
      </form>

      <table className="todo-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {todos.map(todo => (
            <tr key={todo.id}>
              {editingId === todo.id ? (
                <>
                  <td>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-text"
                    />
                  </td>
                  <td>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="input-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleSave(todo.id)} className="btn-save">
                      Save
                    </button>
                    <button onClick={handleCancel} className="btn-cancel">
                      Cancel
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td>{todo.name}</td>
                  <td>{todo.priority}</td>
                  <td>
                    <button onClick={() => handleEdit(todo)} className="btn-edit">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(todo.id)} className="btn-delete">
                      Delete
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="benchmark-panel">
        <h2>Benchmarks</h2>
        <div className="benchmark-buttons">
          <button onClick={() => benchmarkRender(100)}>Render 100</button>
          <button onClick={() => benchmarkRender(500)}>Render 500</button>
          <button onClick={() => benchmarkRender(1000)}>Render 1000</button>
          <button onClick={benchmarkUpdate}>Update 50</button>
          <button onClick={benchmarkDelete}>Delete 50</button>
          <button onClick={benchmarkRunAll}>Run All</button>
        </div>
        {benchmarkResults.length > 0 && (
          <ul className="benchmark-results">
            {benchmarkResults.map((result, idx) => (
              <li key={idx}>
                {result.operation}: {result.duration}ms
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
