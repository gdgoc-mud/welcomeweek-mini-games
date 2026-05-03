import { writable } from 'svelte/store';

// We can define background styles like: 'grid', 'dots', 'lines', 'solid'
// And colors like: 'bg-blue', 'bg-yellow', 'bg-red', 'bg-green', 'bg-white'
export const themeStore = writable({
    pattern: 'dots',
    colorClass: 'bg-white'
});

export function setTheme(pattern, colorClass) {
    themeStore.set({ pattern, colorClass });
}
