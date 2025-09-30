import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { socket } from './printer.js';

const app = new Hono();

app.get('/', (c) => {
  return c.text('Hello from Hono!');
});

app.post('/data', async (c) => {
  const body = await c.req.json();

  if (!body.buffer || typeof body.buffer !== 'string') {
    return c.json({ error: 'buffer field is required and must be a string' }, 400);
  }

  const MAX_BUFFER_LENGTH = 10 * 1024 * 1024; // 10MB
  if (body.buffer.length > MAX_BUFFER_LENGTH) {
    return c.json({ error: `buffer is too large (max ${MAX_BUFFER_LENGTH} bytes)` }, 400);
  }

  socket.write(Buffer.from(body.buffer, 'base64'));
  return c.json({ success: true });
});

serve(
  {
    fetch: app.fetch,
    port: Number(process.env.PORT) || 4000,
  },
  (info) => {
    console.log(`[🌎 WEB] Server is running on http://localhost:${info.port}`);
  },
);
