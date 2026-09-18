# mcp-listenbrainz

ListenBrainz MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `top_artists` | ListenBrainz sitewide top artists (open music listening data, MetaBrainz/MusicBrainz-linked). Most-listened artists across all users for a time range. Keyless. |
| `user_listens` | A SPECIFIC NAMED ListenBrainz user's recent listens (track scrobbles), newest first — only when the question names a username; never with a guessed or example one. Open music listening data, MusicBrainz-linked. Keyless for public profiles. |
| `now_playing` | What a ListenBrainz user is listening to right now (the currently-playing track, if any). Open music listening data. Keyless for public profiles. |
| `user_top_artists` | A SPECIFIC NAMED ListenBrainz user's top (most-listened) artists for a time range — only when the question names a ListenBrainz username. NEVER for general questions like "recommend popular music" or "top songs 2026" (use last-fm chart_top_artists / tag_top_artists for those), and never with a guessed or example username — the result would be a stranger's personal listening history presented as an answer. Open music listening data, MusicBrainz-linked. Keyless for public profiles. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "listenbrainz": {
      "url": "https://gateway.pipeworx.io/listenbrainz/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/listenbrainz/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Listenbrainz data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/top_artists \
  -H 'Content-Type: application/json' \
  -d '{"range":"week","count":10}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/top_artists`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
