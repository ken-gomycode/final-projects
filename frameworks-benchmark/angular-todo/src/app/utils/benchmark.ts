export function generateTodos(count: number) {
  const priorities: Array<"low" | "medium" | "high"> = ["low", "medium", "high"];
  return Array.from({ length: count }, (_, i) => ({
    id: crypto.randomUUID(),
    name: `Task ${i + 1}`,
    priority: priorities[i % 3],
  }));
}

export function measureOperation(operation: () => void): Promise<number> {
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
