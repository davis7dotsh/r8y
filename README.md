# r8y 3.0

_monorepo because I feel like it idk man_

## Setup

### Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://docker.com)

### Environment Variables

Default `MYSQL_URL` for local development:

```
MYSQL_URL=mysql://root:root@localhost:3306/r8y
```

Some of the packages need more env vars, get those from Ben.

### Scripts

| Command          | Description                                       |
| ---------------- | ------------------------------------------------- |
| `bun install`    | Install dependencies                              |
| `bun dev`        | Start MySQL container + run all apps in dev mode  |
| `bun dev:no-db`  | Run all apps in dev mode (without starting MySQL) |
| `bun db:up`      | Start MySQL container                             |
| `bun db:down`    | Stop MySQL container (keeps data)                 |
| `bun db:destroy` | Stop MySQL container and delete all data          |
| `bun db:setup`   | Start MySQL, wait for it, and push schema         |
| `bun db:push`    | Push Drizzle schema to database                   |
| `bun build`      | Build all apps                                    |
| `bun check`      | Type check all packages                           |
| `bun lint`       | Lint all packages                                 |

### First Time Setup

```bash
bun install
# Create .env files (see above)
bun db:setup
```

## todos

- do a durability pass on the app
- start to add in more advanced features to the sv app: searching and the big boy ai agent...
- add in comments on sponsor page
- search across pages that make sense
- better routing system (query params for the url with runed)
- more links to vids on the pages
- graceful shutdown (runtime.dispose() while using the node runtime...)
