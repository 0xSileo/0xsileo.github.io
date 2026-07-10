import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  	plugins: [svelte()],
	base: '/adaptive-sudoku/',
	build: {
		outDir: '../adaptive-sudoku',
		emptyOutDir: true
	}
})
