import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service.js';

export function registerContinueRoutes(server: FastifyInstance, authService: AuthService) {
  server.get(
    '/continue/:token',
    {
      schema: {
        description: 'Single-use WhatsApp continuation link clicked by user in WhatsApp',
        tags: ['Authentication'],
      },
    },
    async (request, reply) => {
      const { token } = request.params as { token: string };

      try {
        const { redirectUrl } = await authService.handleContinueToken(token);
        // Successful verification & token consumption: redirect browser to developer application callback
        return reply.redirect(redirectUrl, 302);
      } catch (err: any) {
        // Render friendly error page in case user opened an expired/consumed link
        reply.type('text/html');
        return reply.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Link Expired | WhatsApp Auth</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 22px;
      margin: 0 0 12px;
      font-weight: 600;
    }
    p {
      color: #94a3b8;
      font-size: 15px;
      line-height: 1.5;
      margin: 0 0 24px;
    }
    .btn {
      display: inline-block;
      background: #25d366;
      color: #0f172a;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 15px;
      transition: opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Authentication Link Invalid</h1>
    <p>${err.message || 'This WhatsApp login link has expired or has already been used. Please return to the application to initiate a new login.'}</p>
    <a href="javascript:window.close()" class="btn">Close Window</a>
  </div>
</body>
</html>
        `);
      }
    }
  );
}
