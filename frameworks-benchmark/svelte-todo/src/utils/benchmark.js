export function generateTodos(count) {
  const priorities = ["low", "medium", "high"];
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,
    name: `Task ${i + 1}`,
    priority: priorities[i % 3],
  }));
}

export function measureOperation(operation) {
  return new Promise((resolve) => {
    const start = performance.now();
    operation();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resolve(parseFloat((performance.now() - start).toFixed(2)));
      });
    });
  });
}
