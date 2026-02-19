# PocketMonsters

PocketMonsters is a Nuxt 4 + TypeScript Pokedex app that serves a fast, clean UX on top of PokeAPI.

## Features

- Landing page with the first 60 Pokemon
- Debounced search (`250ms`) via reusable `usePokemonSearch`
- Skeleton loading cards and detail skeleton states
- Hover/focus prefetch for Pokemon detail pages
- Optimistic navigation with immediate route transitions
- Server-side API proxy + Nitro caching
- Reusable `useApi` composable for path-based querying, client cache, prefetching, and error mapping

## Stack

- Nuxt 4 (Vue 3 + Nitro)
- TypeScript
- PokeAPI (`https://pokeapi.co/`)
- Vitest + ESLint

## Project Layout

```text
.
|- app/
|  |- app.vue
|  |- assets/styles/main.css
|  |- components/
|  |- layouts/default.vue
|  |- pages/index.vue
|  |- pages/pokemon/[id].vue
|- composables/
|  |- useApi.ts
|  |- usePokemonSearch.ts
|- server/
|  |- api/pokemons.get.ts
|  |- api/pokemon/[id].get.ts
|  |- utils/
|- utils/
|  |- apiPaths.ts
|  |- formatters.ts
|- types/pokemon.ts
|- tests/
```

## API Routes

- `GET /api/pokemons?limit=60&offset=0`
- `GET /api/pokemon/:id`

Server cache policy:
- List: `1800s` (30m)
- Detail: `43200s` (12h)

## Scripts

- `npm run dev` start local dev server
- `npm run build` production build
- `npm run preview` preview production build
- `npm run lint` run ESLint
- `npm run test` run Vitest suite
- `npm run test:watch` watch tests

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Data Source

- List: `https://pokeapi.co/api/v2/pokemon?limit=60&offset=0`
- Detail: `https://pokeapi.co/api/v2/pokemon/{id-or-name}`
