import { writable } from 'svelte/store';

export const configStore = writable({
	hostIp: 'localhost'
});
