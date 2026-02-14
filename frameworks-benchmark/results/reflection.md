# Reflection

## Which framework performed best in the benchmarks, and why do you think that is?

Svelte and Vue traded leads across the different operations. Svelte was fastest at small renders (Render 100 at 42.8ms) and targeted mutations (Update 50 at 33.4ms, Delete 50 at 31.4ms), while Vue led on Render 500. Overall, Svelte edges ahead because its compile-time reactivity avoids the runtime diffing overhead that React and Angular carry. Svelte compiles components into imperative DOM instructions, so updates touch only the elements that actually changed rather than re-evaluating a virtual DOM tree. Vue's fine-grained reactivity system gives it similar advantages on mutations, but Svelte's lack of any runtime framework code keeps its baseline cost lower.

## What surprised you about the results?

React's Delete 50 result (681ms) was unexpectedly slow compared to the other frameworks, which all completed the same operation in under 40ms. This likely stems from React's batched state updates and virtual DOM reconciliation overhead when removing elements from a large list. The Render 1000 results were also surprising: Vue was the slowest at 293ms while Svelte's Render 500 was similarly high at 293ms, yet both were fast on other operations. This inconsistency suggests that single-run benchmarks are noisy and that garbage collection or browser scheduling can cause significant variance at this scale.

## How did the developer experience differ across the four frameworks?

Svelte offered the most concise code thanks to its compiler-driven reactivity. Declaring state is just `let todos = $state([])`, and two-way binding uses `bind:value` with no ceremony. Vue's Composition API with `<script setup>` was similarly compact, using `ref()` and `v-model` to keep boilerplate low. React required more explicit wiring: every input needs `value` plus an `onChange` handler, and state updates require functional setters with `useState`. Angular was the most verbose, needing TypeScript interfaces, decorator metadata, `FormsModule` imports, and `ngIf`/`ngFor` directives, though the standalone component model simplified things compared to the traditional NgModule approach. For a small app like this, Svelte and Vue felt the most productive, while Angular's structure would scale better in a larger project.
