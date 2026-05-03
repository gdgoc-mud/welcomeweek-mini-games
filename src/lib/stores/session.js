import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const createSessionStore = () => {
	const defaultState = {
		name: '',
		mode: '',
		score: 0,
		roomCode: null,
		isHost: false,
		opponentName: '',
		opponentScore: 0,
		opponentProgress: 0 // number of questions answered
	};

	const { subscribe, set, update } = writable(defaultState);

	return {
		subscribe,
		init: () => {
			if (browser) {
				const stored = sessionStorage.getItem('gdgoc_session');
				if (stored) {
					try {
						set({ ...defaultState, ...JSON.parse(stored) });
					} catch (e) {
						set(defaultState);
					}
				}
			}
		},
		updateSession: (data) => {
			update(state => {
				const newState = { ...state, ...data };
				if (browser) {
					sessionStorage.setItem('gdgoc_session', JSON.stringify(newState));
				}
				return newState;
			});
		},
		resetSession: () => {
			set(defaultState);
			if (browser) {
				sessionStorage.removeItem('gdgoc_session');
			}
		},
		get: () => get({ subscribe })
	};
};

export const sessionStore = createSessionStore();
