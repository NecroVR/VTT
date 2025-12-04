import { readable, writable } from 'svelte/store';

export const page = readable({
  url: new URL('http://localhost:5173/'),
  params: {},
  route: { id: null },
  status: 200,
  error: null,
  data: {},
  form: undefined,
  state: {},
});

export const navigating = readable(null);

export const updated = {
  subscribe: readable(false).subscribe,
  check: async () => false,
};
