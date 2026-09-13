'use client';

import { useState, useCallback } from 'react';

export function UgcStatusPortal() {
	const [email, setEmail] = useState('');
	const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
	const [message, setMessage] = useState('');

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				setStatus('error');
				setMessage('Please enter a valid email address.');
				return;
			}
			setStatus('loading');
			setMessage('');
			try {
				const res = await fetch('/api/ugc/magic-link', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email }),
				});
				const data = (await res.json()) as { link?: string; error?: string };
				if (res.ok) {
					setStatus('sent');
					setMessage('If that email has submissions, a secure status link has been sent.');
					setEmail('');
				} else {
					setStatus('error');
					setMessage(data.error ?? 'Could not generate status link.');
				}
			} catch {
				setStatus('error');
				setMessage('Network error. Please try again.');
			}
		},
		[email]
	);

	return (
		<div className="space-y-6">
			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<label htmlFor="status-email" className="block text-cream font-medium">
						Email address
					</label>
					<input
						id="status-email"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream placeholder-beige/50 focus:outline-none focus:ring-2 focus:ring-copper"
						placeholder="you@example.com"
					/>
				</div>
				<button
					type="submit"
					disabled={status === 'loading'}
					className="w-full md:w-auto px-8 py-4 bg-copper hover:bg-copper-light text-cream font-bold rounded-lg transition-colors disabled:opacity-60"
				>
					{status === 'loading' ? 'Sending...' : 'Send my secure status link'}
				</button>
			</form>

			{status === 'sent' && (
				<div className="p-4 rounded-lg bg-sage/20 border border-sage text-cream">
					<p>{message}</p>
					<p className="text-sm mt-2 text-beige">
						(This is a demo build: in production the link would be emailed. For now, copy the link from
						the API response in your browser&apos;s network tab.)
					</p>
				</div>
			)}

			{status === 'error' && (
				<div className="p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-cream">
					<p className="font-bold">Error</p>
					<p className="text-sm">{message}</p>
				</div>
			)}
		</div>
	);
}
