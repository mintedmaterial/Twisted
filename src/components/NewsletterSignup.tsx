'use client';

import { useState } from 'react';

interface NewsletterSignupProps {
	source?: string;
	className?: string;
}

export default function NewsletterSignup({ source = 'website', className = '' }: NewsletterSignupProps) {
	const [email, setEmail] = useState('');
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState('');

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setStatus('loading');
		setMessage('');

		try {
			const response = await fetch('/api/newsletter', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, source }),
			});

			const data = await response.json();

			if (response.ok) {
				setStatus('success');
				setMessage(data.message || 'Successfully subscribed!');
				setEmail('');
			} else {
				setStatus('error');
				setMessage(data.error || 'Something went wrong. Please try again.');
			}
		} catch {
			setStatus('error');
			setMessage('Failed to subscribe. Please try again later.');
		}
	};

	return (
		<form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-4 ${className}`}>
			<input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Enter your email"
				className="flex-1 px-4 py-3 rounded-lg bg-wood-dark/30 border-2 border-wood-light/30 text-cream placeholder-beige/50 focus:border-copper focus:outline-none transition-colors disabled:opacity-50"
				required
				disabled={status === 'loading'}
			/>
			<button
				type="submit"
				className="px-6 py-3 bg-copper/20 border-2 border-copper rounded-lg text-copper font-bold hover:bg-copper/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={status === 'loading'}
			>
				{status === 'loading' ? 'Subscribing...' : 'Subscribe'}
			</button>
			{message && (
				<p className={`text-sm mt-2 ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
					{message}
				</p>
			)}
		</form>
	);
}
