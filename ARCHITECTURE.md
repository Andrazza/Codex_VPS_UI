# Architecture

`Phone → HTTPS/Nginx → Codex Desk (127.0.0.1:3000) → codex app-server (stdio) → selected directory in /opt/codex-projects`

The backend authenticates the browser with a magic-link session cookie. It resolves every selected directory with `realpath` and rejects anything outside `/opt/codex-projects`.

The browser uses REST for projects, models, limits, and sending a task. It receives agent activity through Server-Sent Events. The backend gets the available models and usage limits from the local, already-authorized Codex CLI via app-server.

Current chat state is in memory. Do not claim restored chat history after a service restart; persisted session history is a future feature.