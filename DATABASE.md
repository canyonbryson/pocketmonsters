# Database

## Current Approach

This project does not require a primary application database for core features.

Source of truth:
- PokeAPI (read-only external API)

Local persistence:
- Server-side cache (Nitro storage/memory) for API responses

## Data Domains

## 1) External Domain (PokeAPI)

Primary entities consumed:
- Pokemon list entries (`name`, `url`)
- Pokemon detail (`id`, `name`, `height`, `weight`, `abilities`, `sprites`)

This data is fetched on demand and transformed for frontend use.

## 2) Internal Domain (Cache)

Cache keys:
- `pokemons:{limit}:{offset}`
- `pokemon:{idOrName}`

Cached value:
- Normalized JSON responses returned by internal API

Cache TTL guidance:
- List: 30-60 minutes
- Detail: 1-24 hours

## Optional Relational Schema (Future)

If favorites/accounts are added, use a relational database (for example, PostgreSQL).

### Tables

`users`
- `id` UUID primary key
- `email` text unique not null
- `created_at` timestamp not null default now()

`pokemon_favorites`
- `user_id` UUID not null references `users(id)` on delete cascade
- `pokemon_id` integer not null
- `created_at` timestamp not null default now()
- primary key (`user_id`, `pokemon_id`)

### SQL Example

```sql
create table users (
  id uuid primary key,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table pokemon_favorites (
  user_id uuid not null references users(id) on delete cascade,
  pokemon_id integer not null,
  created_at timestamptz not null default now(),
  primary key (user_id, pokemon_id)
);
```

## Data Consistency Rules

- Never mutate upstream Pokemon facts locally for core views
- Cache may be stale within TTL and is acceptable for this use case
- Favor deterministic transformation in API handlers to keep frontend stable

## Privacy and Security

- No personal data required for current core functionality
- If user accounts are added later:
  - store only required user attributes
  - hash credentials (if local auth is used)
  - enforce least-privilege DB access

## Migration Path

Current phase:
- No migration tooling required

Future DB phase:
- Add migration tool (`drizzle`, `prisma`, or SQL migrations)
- Version schema changes per release
- Seed only non-sensitive data for local development
