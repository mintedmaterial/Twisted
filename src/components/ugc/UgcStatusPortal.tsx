'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { UGC_PRODUCT_CATEGORIES } from '@/lib/ugc';

interface SubmissionItem {
	publicId: string;
	productCategory: string;
	fileName: string;
	fileType: string;
	status: 'pending' | 'approved' | 'declined';
	rewardAmount?: number;
	rewardCode?: string;
	reviewedAt?: string;
	createdAt: string;
}

function formatCategory(value: string): string {
	return UGC_PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function UgcStatusPortal() {
	const searchParams = useSearchParams();
	const emailParam = searchParams.get('email');
	const payloadParam = searchParams.get('payload');
	const signatureParam = searchParams.get('signature');

	const [email, setEmail] = useState(emailParam ?? '');
	const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
	const [message, setMessage] = useState('');
	const [generatedLink, setGeneratedLink] = useState<string | null>(null);

	const [submissions, setSubmissions] = useState<SubmissionItem[] | null>(null);
	const [loadingSubmissions, setLoadingSubmissions] = useState(false);
	const [loadError, setLoadError] = useState('');

	const fetchSubmissions = useCallback(async (e: string, p: string, s: string) => {
		setLoadingSubmissions(true);
		setLoadError('');
		try {
			const res = await fetch(
				`/api/ugc/status?email=${encodeURIComponent(e)}&payload=${encodeURIComponent(p)}&signature=${encodeURIComponent(s)}`
			);
			const data = (await res.json()) as { success?: boolean; submissions?: SubmissionItem[]; error?: string };
			if (res.ok && data.submissions) {
				setSubmissions(data.submissions);
			} else {
				setLoadError(data.error ?? 'Could not load submissions. Your link may have expired.');
			}
		} catch {
			setLoadError('Network error while loading your submissions.');
		} finally {
			setLoadingSubmissions(false);
		}
	}, []);

	useEffect(() => {
		if (emailParam && payloadParam && signatureParam) {
			fetchSubmissions(emailParam, payloadParam, signatureParam);
		}
	}, [emailParam, payloadParam, signatureParam, fetchSubmissions]);

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
			setGeneratedLink(null);
			try {
				const res = await fetch('/api/ugc/magic-link', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email }),
				});
				const data = (await res.json()) as { success?: boolean; link?: string; error?: string };
				if (res.ok) {
					setStatus('sent');
					setMessage('Your submission access link has been generated.');
					if (data.link) {
						setGeneratedLink(data.link);
					}
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

	if (loadingSubmissions) {
		return (
			<div className="text-center py-12">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-copper mb-4"></div>
				<p className="text-cream font-medium">Checking your submission status...</p>
			</div>
		);
	}

	if (submissions !== null) {
		return (
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-copper/30 pb-4">
					<div>
						<h2 className="text-2xl font-bold text-cream">Your Submissions</h2>
						<p className="text-sm text-beige">{emailParam}</p>
					</div>
					<a
						href="/submit-your-gear"
						className="inline-flex items-center justify-center px-4 py-2 bg-copper hover:bg-copper-light text-cream font-bold rounded-lg text-sm transition-colors"
					>
						+ Submit More Gear
					</a>
				</div>

				{submissions.length === 0 ? (
					<div className="text-center py-8 text-beige">
						<p>No submissions found for this email address.</p>
					</div>
				) : (
					<div className="space-y-4">
						{submissions.map((sub) => {
							const isApproved = sub.status === 'approved';
							const isPending = sub.status === 'pending';
							const isDeclined = sub.status === 'declined';

							return (
								<div
									key={sub.publicId}
									className="rounded-xl border border-copper/20 bg-wood-dark/80 p-5 space-y-3"
								>
									<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
										<div>
											<span className="text-xs uppercase tracking-wider text-copper font-bold">
												{formatCategory(sub.productCategory)}
											</span>
											<h3 className="text-lg font-bold text-cream">{sub.fileName}</h3>
										</div>
										<div>
											{isApproved && (
												<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sage/30 text-sage border border-sage">
													Approved & Published
												</span>
											)}
											{isPending && (
												<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-900/30 text-amber-200 border border-amber-500/50">
													Under Review
												</span>
											)}
											{isDeclined && (
												<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-800 text-gray-300 border border-gray-600">
													Not Selected
												</span>
											)}
										</div>
									</div>

									{isApproved && sub.rewardCode && (
										<div className="p-4 rounded-lg bg-copper/20 border border-copper text-cream">
											<p className="text-sm font-bold text-copper-light">Store Credit Awarded!</p>
											<p className="text-lg font-mono font-bold mt-1 tracking-wider text-cream">
												{sub.rewardCode}
											</p>
											<p className="text-xs text-beige mt-1">
												Value: ${sub.rewardAmount ?? 25} USD. Use this code on your next custom order or quote!
											</p>
										</div>
									)}

									{isPending && (
										<p className="text-sm text-beige">
											We review each piece within 5 business days. Once featured on our page or social media, your store credit code will appear here.
										</p>
									)}

									{isDeclined && (
										<p className="text-sm text-beige">
											Thank you for submitting! Even though this piece wasn&apos;t chosen for the campaign feature, we appreciate you showing us your gear.
										</p>
									)}

									<p className="text-xs text-beige/60">
										Submitted: {new Date(sub.createdAt).toLocaleDateString()}
									</p>
								</div>
							);
						})}
					</div>
				)}

				<div className="pt-4 border-t border-copper/20">
					<a
						href="/my-submissions"
						className="text-sm text-copper hover:text-cream underline"
					>
						Check another email address
					</a>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{loadError && (
				<div className="p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-cream">
					<p className="font-bold">Link expired or invalid</p>
					<p className="text-sm">{loadError}</p>
					<p className="text-xs mt-2 text-beige">Please enter your email below to request a fresh status link.</p>
				</div>
			)}

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
					className="w-full md:w-auto px-8 py-4 bg-copper hover:bg-copper-light text-cream font-bold rounded-lg transition-colors disabled:opacity-60 cursor-pointer"
				>
					{status === 'loading' ? 'Checking...' : 'View My Submissions'}
				</button>
			</form>

			{status === 'sent' && (
				<div className="p-5 rounded-lg bg-sage/20 border border-sage text-cream space-y-3">
					<p className="font-bold text-lg">{message}</p>
					{generatedLink && (
						<div>
							<p className="text-sm text-beige mb-3">
								Click below to view your submission status and claim your store credit:
							</p>
							<a
								href={generatedLink}
								className="inline-block px-6 py-3 bg-copper hover:bg-copper-light text-cream font-bold rounded-lg transition-colors text-sm"
							>
								View My Submissions Now &rarr;
							</a>
						</div>
					)}
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
