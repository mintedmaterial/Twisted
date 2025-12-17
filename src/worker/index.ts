/**
 * Twisted Worker - Cloudflare Worker for Twisted Custom Leather
 * Serves the Next.js application with AI and future bindings
 */

export interface Env {
	// AI binding for future use
	AI?: any;
	// Add other bindings as needed
	// DB?: D1Database;
	// CACHE?: KVNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// Health check endpoint
		if (url.pathname === '/health') {
			return new Response(JSON.stringify({
				status: 'healthy',
				worker: 'Twisted',
				timestamp: new Date().toISOString(),
				message: 'Twisted Custom Leather Worker is running'
			}), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		// API endpoint for future use
		if (url.pathname.startsWith('/api/')) {
			return new Response(JSON.stringify({
				message: 'Twisted API - Coming Soon',
				endpoint: url.pathname
			}), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		// Default response - will be replaced with Next.js app
		return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Twisted Custom Leather</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			background: linear-gradient(135deg, #3a2f2f 0%, #5c4a3a 100%);
			color: #f5f1e8;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 20px;
		}
		.container {
			max-width: 600px;
			text-align: center;
			background: rgba(92, 74, 58, 0.3);
			padding: 40px;
			border-radius: 16px;
			backdrop-filter: blur(10px);
			border: 1px solid rgba(184, 115, 51, 0.3);
			box-shadow: 0 0 30px rgba(184, 115, 51, 0.5);
		}
		h1 {
			font-size: 2.5rem;
			font-weight: 900;
			font-style: italic;
			margin-bottom: 20px;
			text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
		}
		p {
			font-size: 1.2rem;
			font-style: italic;
			color: #d4c5b0;
			margin-bottom: 30px;
		}
		.status {
			background: rgba(156, 175, 136, 0.2);
			padding: 15px;
			border-radius: 8px;
			border: 1px solid #9caf88;
			margin-top: 20px;
		}
		.status strong {
			color: #9caf88;
		}
		a {
			color: #b87333;
			text-decoration: none;
			font-weight: bold;
		}
		a:hover {
			color: #d4a574;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>Twisted Custom Leather</h1>
		<p>Custom leather twisted enough for all your needs</p>
		<p>✓ Worker Deployed Successfully</p>
		<div class="status">
			<strong>Status:</strong> Twisted Worker is running on Cloudflare<br>
			<strong>Next.js App:</strong> Deploying via GitHub Actions
		</div>
		<p style="margin-top: 20px; font-size: 0.9rem;">
			Repository: <a href="https://github.com/mintedmaterial/Twisted" target="_blank">github.com/mintedmaterial/Twisted</a>
		</p>
	</div>
</body>
</html>
		`, {
			headers: {
				'Content-Type': 'text/html;charset=UTF-8',
			}
		});
	}
};
