import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { generateTodos, measureOperation } from './utils/benchmark';

interface Todo {
  id: string;
  name: string;
  priority: 'low' | 'medium' | 'high';
}

interface BenchmarkResult {
  operation: string;
  time: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Todo List (Angular)</h1>

      <div class="form">
        <input
          type="text"
          [(ngModel)]="newTodoName"
          placeholder="Task name"
          (keyup.enter)="addTodo()"
        />
        <select [(ngModel)]="newTodoPriority">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button (click)="addTodo()">Add</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Priority</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let todo of todos">
            <td *ngIf="editingId !== todo.id">{{ todo.name }}</td>
            <td *ngIf="editingId !== todo.id">{{ todo.priority }}</td>
            <td *ngIf="editingId === todo.id">
              <input type="text" [(ngModel)]="editName" />
            </td>
            <td *ngIf="editingId === todo.id">
              <select [(ngModel)]="editPriority">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </td>
            <td *ngIf="editingId !== todo.id">
              <button (click)="startEdit(todo)">Edit</button>
            </td>
            <td *ngIf="editingId === todo.id">
              <button (click)="saveEdit(todo.id)">Save</button>
            </td>
            <td *ngIf="editingId !== todo.id">
              <button (click)="deleteTodo(todo.id)">Delete</button>
            </td>
            <td *ngIf="editingId === todo.id">
              <button (click)="cancelEdit()">Cancel</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="benchmark-panel">
        <h2>Benchmarks</h2>
        <div class="buttons">
          <button (click)="runRender100()">Render 100</button>
          <button (click)="runRender500()">Render 500</button>
          <button (click)="runRender1000()">Render 1000</button>
          <button (click)="runUpdate50()">Update 50</button>
          <button (click)="runDelete50()">Delete 50</button>
          <button (click)="runAll()">Run All</button>
        </div>
        <div class="results" *ngIf="benchmarkResults.length > 0">
          <h3>Results:</h3>
          <ul>
            <li *ngFor="let result of benchmarkResults">
              {{ result.operation }}: {{ result.time }} ms
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    }

    h1 {
      margin-bottom: 20px;
    }

    .form {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .form input {
      flex: 1;
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .form select {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    .form button {
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .form button:hover {
      background: #0056b3;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
    }

    td input {
      width: 100%;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    td select {
      width: 100%;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }

    td button {
      padding: 6px 12px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    td button:hover {
      background: #218838;
    }

    .benchmark-panel {
      margin-top: 40px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .benchmark-panel h2 {
      margin-top: 0;
      margin-bottom: 15px;
    }

    .buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .buttons button {
      padding: 10px 16px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .buttons button:hover {
      background: #5a6268;
    }

    .results h3 {
      margin-top: 0;
      margin-bottom: 10px;
    }

    .results ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .results li {
      padding: 5px 0;
      font-family: monospace;
    }
  `]
})
export class AppComponent {
  todos: Todo[] = [];
  newTodoName = '';
  newTodoPriority: 'low' | 'medium' | 'high' = 'low';
  editingId: string | null = null;
  editName = '';
  editPriority: 'low' | 'medium' | 'high' = 'low';
  benchmarkResults: BenchmarkResult[] = [];

  addTodo() {
    if (this.newTodoName.trim()) {
      this.todos.push({
        id: (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: this.newTodoName,
        priority: this.newTodoPriority,
      });
      this.newTodoName = '';
      this.newTodoPriority = 'low';
    }
  }

  startEdit(todo: Todo) {
    this.editingId = todo.id;
    this.editName = todo.name;
    this.editPriority = todo.priority;
  }

  saveEdit(id: string) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.name = this.editName;
      todo.priority = this.editPriority;
    }
    this.cancelEdit();
  }

  cancelEdit() {
    this.editingId = null;
    this.editName = '';
    this.editPriority = 'low';
  }

  deleteTodo(id: string) {
    this.todos = this.todos.filter(t => t.id !== id);
  }

  async runRender100() {
    const time = await measureOperation(() => {
      this.todos = generateTodos(100);
    });
    this.benchmarkResults.push({ operation: 'Render 100', time });
  }

  async runRender500() {
    const time = await measureOperation(() => {
      this.todos = generateTodos(500);
    });
    this.benchmarkResults.push({ operation: 'Render 500', time });
  }

  async runRender1000() {
    const time = await measureOperation(() => {
      this.todos = generateTodos(1000);
    });
    this.benchmarkResults.push({ operation: 'Render 1000', time });
  }

  async runUpdate50() {
    if (this.todos.length < 1000) {
      this.todos = generateTodos(1000);
    }
    const time = await measureOperation(() => {
      for (let i = 0; i < 50; i++) {
        this.todos[i].name = `Updated Task ${i + 1}`;
        this.todos[i].priority = i % 2 === 0 ? 'high' : 'low';
      }
      this.todos = [...this.todos];
    });
    this.benchmarkResults.push({ operation: 'Update 50', time });
  }

  async runDelete50() {
    if (this.todos.length < 1000) {
      this.todos = generateTodos(1000);
    }
    const time = await measureOperation(() => {
      this.todos = this.todos.slice(50);
    });
    this.benchmarkResults.push({ operation: 'Delete 50', time });
  }

  async runAll() {
    this.benchmarkResults = [];
    const allResults: BenchmarkResult[] = [];

    await this.runRender100();
    await new Promise(resolve => setTimeout(resolve, 100));
    allResults.push(this.benchmarkResults[this.benchmarkResults.length - 1]);

    await this.runRender500();
    await new Promise(resolve => setTimeout(resolve, 100));
    allResults.push(this.benchmarkResults[this.benchmarkResults.length - 1]);

    await this.runRender1000();
    await new Promise(resolve => setTimeout(resolve, 100));
    allResults.push(this.benchmarkResults[this.benchmarkResults.length - 1]);

    await this.runUpdate50();
    await new Promise(resolve => setTimeout(resolve, 100));
    allResults.push(this.benchmarkResults[this.benchmarkResults.length - 1]);

    await this.runDelete50();
    await new Promise(resolve => setTimeout(resolve, 100));
    allResults.push(this.benchmarkResults[this.benchmarkResults.length - 1]);

    console.log(JSON.stringify(allResults, null, 2));
  }
}
