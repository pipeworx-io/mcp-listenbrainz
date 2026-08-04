# mcp-listenbrainz

ListenBrainz MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `top_artists` | ListenBrainz sitewide top artists (open music listening data, MetaBrainz/MusicBrainz-linked). Most-listened artists across all users for a time range. Keyless. |
| `user_listens` | A ListenBrainz user's recent listens (track scrobbles), newest first. Open music listening data, MusicBrainz-linked. Keyless for public profiles. |
| `now_playing` | What a ListenBrainz user is listening to right now (the currently-playing track, if any). Open music listening data. Keyless for public profiles. |
| `user_top_artists` | A ListenBrainz user's top (most-listened) artists for a time range. Open music listening data, MusicBrainz-linked. Keyless for public profiles. Stats may be unavailable if not yet computed. |

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Listenbrainz data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
