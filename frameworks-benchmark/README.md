# Frontend Frameworks Benchmark

A comparative benchmark of four frontend frameworks using a todo list application. Each app implements identical CRUD functionality and a benchmark panel that measures DOM performance (render, update, delete).

## Frameworks

- **React** — Vite + React with functional components and `useState`
- **Vue** — Vite + Vue 3 with Composition API and `<script setup>`
- **Svelte** — Vite + Svelte with compile-time reactivity
- **Angular** — Angular CLI with standalone components

## Running Each App

```bash
# React
cd react-todo && npm install && npm run dev

# Vue
cd vue-todo && npm install && npm run dev

# Svelte
cd svelte-todo && npm install && npm run dev

# Angular
cd angular-todo && npm install && npm start
```

Each app runs on its default Vite/Angular dev server port.

## Benchmark Operations

| Operation    | Description                                              |
| ------------ | -------------------------------------------------------- |
| Render 100   | Clear state, set 100 generated todos, measure until paint |
| Render 500   | Clear state, set 500 generated todos, measure until paint |
| Render 1000  | Clear state, set 1000 generated todos, measure until paint |
| Update 50    | With 1000 todos loaded, update name+priority of first 50 |
| Delete 50    | With 1000 todos loaded, remove first 50                  |

Click **Run All** to execute all operations sequentially. Results are logged to the console as JSON.

## Results

- [Benchmark Results](results/benchmark-results.md)
- [Reflection](results/reflection.md)
