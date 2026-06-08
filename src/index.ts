interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * ListenBrainz MCP.
 *
 * ListenBrainz = open music listening data (MetaBrainz, MusicBrainz-linked) —
 * sitewide top artists, a user's recent listens / now-playing / top artists.
 * Keyless for public reads.
 */


const BASE = 'https://api.listenbrainz.org/1';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';
const RANGES = ['week', 'month', 'year', 'all_time'];

const tools: McpToolExport['tools'] = [
  {
    name: 'top_artists',
    description:
      'ListenBrainz sitewide top artists (open music listening data, MetaBrainz/MusicBrainz-linked). Most-listened artists across all users for a time range. Keyless.',
    inputSchema: {
      type: 'object',
      properties: {
        range: { type: 'string', description: 'Time range: week, month, year, or all_time (default "week").' },
        count: { type: 'number', description: 'How many artists to return (default 25, max 100).' },
      },
    },
  },
  {
    name: 'user_listens',
    description:
      "A ListenBrainz user's recent listens (track scrobbles), newest first. Open music listening data, MusicBrainz-linked. Keyless for public profiles.",
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'ListenBrainz username, e.g. "rob".' },
        count: { type: 'number', description: 'How many listens to return (default 25, max 100).' },
      },
      required: ['username'],
    },
  },
  {
    name: 'now_playing',
    description:
      "What a ListenBrainz user is listening to right now (the currently-playing track, if any). Open music listening data. Keyless for public profiles.",
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'ListenBrainz username, e.g. "rob".' },
      },
      required: ['username'],
    },
  },
  {
    name: 'user_top_artists',
    description:
      "A ListenBrainz user's top (most-listened) artists for a time range. Open music listening data, MusicBrainz-linked. Keyless for public profiles. Stats may be unavailable if not yet computed.",
    inputSchema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'ListenBrainz username, e.g. "rob".' },
        range: { type: 'string', description: 'Time range: week, month, year, or all_time (default "all_time").' },
        count: { type: 'number', description: 'How many artists to return (default 25).' },
      },
      required: ['username'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'top_artists': {
        const range = normRange(args.range, 'week');
        const count = clampCount(args.count, 25, 100);
        const data: any = await lbGet(
          `/stats/sitewide/artists?count=${count}&range=${encodeURIComponent(range)}`,
        );
        const artists = (data?.payload?.artists ?? []).map((a: any) => ({
          name: a.artist_name,
          mbid: a.artist_mbid,
          listens: a.listen_count,
        }));
        return { range, count: artists.length, artists };
      }

      case 'user_listens': {
        const username = reqStr(args, 'username');
        const count = clampCount(args.count, 25, 100);
        const data: any = await lbGet(
          `/user/${encodeURIComponent(username)}/listens?count=${count}`,
        );
        const listens = (data?.payload?.listens ?? []).map((l: any) => {
          const tm = l.track_metadata ?? {};
          return {
            artist: tm.artist_name,
            track: tm.track_name,
            release: tm.release_name,
            listened_at: l.listened_at,
          };
        });
        return { username, count: listens.length, listens };
      }

      case 'now_playing': {
        const username = reqStr(args, 'username');
        const data: any = await lbGet(`/user/${encodeURIComponent(username)}/playing-now`);
        const listen = (data?.payload?.listens ?? [])[0];
        if (listen) {
          const tm = listen.track_metadata ?? {};
          return { username, playing: true, artist: tm.artist_name, track: tm.track_name };
        }
        return { username, playing: false };
      }

      case 'user_top_artists': {
        const username = reqStr(args, 'username');
        const range = normRange(args.range, 'all_time');
        const count = clampCount(args.count, 25, 100);
        const res = await fetch(
          `${BASE}/stats/user/${encodeURIComponent(username)}/artists?count=${count}&range=${encodeURIComponent(range)}`,
          { headers: { Accept: 'application/json', 'User-Agent': UA } },
        );
        if (res.status === 204) {
          return { username, range, note: 'no stats available for this user/range', artists: [] };
        }
        if (!res.ok) {
          return { error: `ListenBrainz: ${res.status} ${(await res.text()).slice(0, 200)}` };
        }
        const data: any = await res.json();
        const artists = (data?.payload?.artists ?? []).map((a: any) => ({
          name: a.artist_name,
          listens: a.listen_count,
        }));
        return { username, range, total: data?.payload?.total_artist_count, artists };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function lbGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (res.status === 204) return { payload: {} };
  if (!res.ok) throw new Error(`ListenBrainz: ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

function normRange(v: unknown, fallback: string): string {
  return typeof v === 'string' && RANGES.includes(v) ? v : fallback;
}

function clampCount(v: unknown, def: number, max: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : def;
  if (n < 1) return 1;
  return n > max ? max : n;
}

function reqStr(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing.`);
  }
  return v.trim();
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
