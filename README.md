# OrgMind frontend

The web interface for OrgMind, the living digital twin of an organization. It is built with React,
TypeScript, Vite, Tailwind CSS, Recharts, React Router, Lucide icons and `react-force-graph-2d`.

## Run it

You need [Node.js](https://nodejs.org) 20.19+ or 22.12+. It has been tested on Node 26.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type-checks, then builds for production into `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run typecheck` | Type-checks only |

## Mock data and real data

The app runs in one of two modes, chosen when it is built or started.

| | `VITE_API_MODE=mock` (default) | `VITE_API_MODE=http` |
| --- | --- | --- |
| Data source | `src/mocks/` | The FastAPI backend |
| Network requests | None | All of them |
| Labelled as a demo | Yes, on every page | No |
| Sample data in the bundle | Yes | **None** |

To switch, copy `.env.example` to `.env.local` and set `VITE_API_MODE=http`. During development, Vite
proxies `/api` to `VITE_API_PROXY_TARGET` (by default `http://localhost:8000`), so no CORS setup is needed.

**The rule:** sample data lives only in `src/mocks/`, and only `src/api/index.ts` imports it. Pages only
know about the `OrgMindApi` interface in `src/api/contract.ts`.

## Project structure

```
src/
├── api/               The boundary between the UI and data
│   ├── contract.ts    OrgMindApi: everything the UI needs from a backend
│   ├── types.ts       Domain types, matching the expected JSON
│   ├── index.ts       Chooses mock or http
│   └── http/          Real implementation (fetch, errors, event streams)
├── mocks/             Everything fake. Nothing outside api/ imports this
│   ├── data/          The sample company, Kestrel Freight
│   ├── buildGraph.ts  Derives the graph from the sample entities
│   ├── reasoner/      Rule-based stand-in for the Reasoning Engine
│   └── mockApi.ts     Demo implementation of OrgMindApi
├── components/
│   ├── ui/            Design system: buttons, tables, menus, dialogs, tabs, toasts
│   ├── charts/        Chart components and their table views
│   ├── domain/        Entity links, status labels, entity detail views
│   └── layout/        App shell, sidebar, top bar, command palette
├── features/          One folder per page
│   ├── dashboard/  graph/  assistant/  intelligence/  integrations/  explorer/
├── hooks/             Data loading, theme and shared app state
├── lib/               Formatting, routes, graph helpers
└── index.css          Design tokens for both themes
```

## Connecting the FastAPI backend

Implement these endpoints under `/api/v1`. The response shapes are the types in `src/api/types.ts`. Fields
are camelCase, which Pydantic can produce with `alias_generator=to_camel`.

| Method and path | Returns | Used by |
| --- | --- | --- |
| `GET /org/overview` | `OrgOverview` | Dashboard |
| `GET /org/signals` | `EngineeringSignal[]` | Dashboard charts |
| `GET /org/activity` | `ActivityEvent[]` | Dashboard feed |
| `GET /org/directory` | `OrgDirectory` | Explorer, links, search |
| `GET /graph` | `KnowledgeGraph` | Knowledge Graph, relationships |
| `GET /insights` | `Insight[]` | Proactive Intelligence, alerts |
| `PATCH /insights/{id}` with `{ status }` | `Insight` | Acknowledge, resolve, dismiss |
| `GET /integrations` | `Integration[]` | Integrations |
| `POST /integrations/{id}/connect` | `ConnectResult` | Connect. Return `{ kind: "redirect", authorizeUrl }` to start OAuth |
| `POST /integrations/{id}/disconnect` | `Integration` | Disconnect |
| `GET /assistant/suggestions` | `SuggestionGroup[]` | Assistant starter questions |
| `POST /assistant/query` with `{ question, conversationId }` | Event stream | Assistant |

Errors should use FastAPI's usual `{ "detail": "message" }` body, which is shown to the user as written.

The assistant endpoint responds with `text/event-stream`. Each message is `data: <json>`, where the JSON is
one `AssistantEvent`: any number of `step` and `summary_delta` events, followed by one `answer`. Inside answer
text, `[n]` refers to the source with `n` as its number, and `href` on a source makes it a link.

## What needs the backend

| Area | Now | Needs the backend for |
| --- | --- | --- |
| All data | Sample data | Real organizational data |
| Assistant | Rule-based answers over sample data, labelled as such | LLM reasoning over the real graph |
| Integrations | Simulated state only, never shown as connected | OAuth and syncing |
| Finding status | Saved in this browser | Shared across users |
| Conversations | In memory until reload | Saved history and long-term memory |
| Answer feedback | Local to the page | Being recorded |
| Authentication, roles | Not implemented | Sign-in and role-based access |

`GET /org/directory` returns everything at once, which is simple but will not suit very large organizations.
It should move to paginated endpoints when that becomes a concern.

## Design system

Colours, type sizes and motion are tokens in `src/index.css`, used through Tailwind utilities such as
`bg-surface`, `text-ink-2`, `border-line` and `text-ui`.

- **Dark first**, with a matching light theme. A choice is remembered in the browser.
- **Text stays in ink colours.** Colour identifies marks such as dots and lines, never the words beside them.
- **Status** always pairs a colour with an icon and a label.
- **Entity types** differ by shape as well as colour, in the graph and everywhere else, because colour
  alone cannot separate six categories for everyone. The palette passes colour-blindness checks for
  adjacent marks.
- **Every chart has a table view**, so no value is reachable only by hovering.
- **Accessibility:** keyboard navigation throughout, visible focus, focus trapped in dialogs, and reduced
  motion respected. The graph canvas is mouse and touch driven; its search box and the Explorer give
  keyboard and screen reader users the same information.
