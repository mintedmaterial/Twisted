'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { UGC_PRODUCT_CATEGORIES } from '@/lib/ugc';

const STATUSES = ['pending', 'approved', 'declined'] as const;

type Submission = {
	public_id: string;
	email: string;
	first_name: string;
	product_category: string;
	instagram_handle?: string;
	tiktok_handle?: string;
	description?: string;
	file_key: string;
	file_name: string;
	file_type: string;
	file_size: number;
	status: (typeof STATUSES)[number];
	reward_amount?: number;
	reward_code?: string;
	reviewed_at?: string;
	review_notes?: string;
	created_at: string;
};

function formatCategory(value: string): string {
	return UGC_PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function formatStatus(status: string): string {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

export function UgcAdminDashboard() {
	const [status, setStatus] = useState<(typeof STATUSES)[number]>('pending');
	const [items, setItems] = useState<Submission[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [actingId, setActingId] = useState<string | null>(null);
	const [notes, setNotes] = useState<Record<string, string>>({});

	const fetchItems = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const res = await fetch(`/api/ugc/admin?status=${status}`);
			const data = (await res.json()) as { submissions?: Submission[]; error?: string };
			if (res.ok) {
				setItems(data.submissions ?? []);
			} else {
				setError(data.error ?? 'Failed to load submissions.');
			}
		} catch {
			setError('Network error while loading submissions.');
		} finally {
			setLoading(false);
		}
	}, [status]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	const handleAction = async (publicId: string, action: 'approve' | 'decline') => {
		setActingId(publicId);
		try {
			const res = await fetch('/api/ugc/admin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					publicId,
					action,
					reviewNotes: notes[publicId] ?? '',
				}),
			});
			const data = (await res.json()) as { error?: string };
			if (res.ok) {
				await fetchItems();
			} else {
				setError(data.error ?? 'Action failed.');
			}
		} catch {
			setError('Network error during action.');
		} finally {
			setActingId(null);
		}
	};

	const previewUrl = useMemo(() => {
		return (key: string) => `/api/ugc/preview?key=${encodeURIComponent(key)}`;
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<h2 className="text-2xl font-bold text-cream">UGC Review Queue</h2>
				<div className="flex gap-2">
					{STATUSES.map((s) => (
						<button
							key={s}
							onClick={() => setStatus(s)}
							className={`px-4 py-2 rounded-lg font-medium transition-colors ${
								status === s
									? 'bg-copper text-cream'
									: 'bg-cream/10 text-cream hover:bg-cream/20'
							}`}
						>
							{formatStatus(s)}
						</button>
					))}
				</div>
			</div>

			{error && (
				<div className="p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-cream">
					{error}
				</div>
			)}

			{loading ? (
				<p className="text-beige">Loading...</p>
			) : items.length === 0 ? (
				<p className="text-beige">No {status} submissions.</p>
			) : (
				<div className="grid gap-6">
					{items.map((item) => (
						<div
							key={item.public_id}
							className="rounded-xl border border-copper/30 bg-cream/5 p-4 md:p-6 space-y-4"
						>
							<div className="flex flex-col md:flex-row gap-6">
								<div className="md:w-1/3">
									{item.file_type.startsWith('video/') ? (
										<video
											src={previewUrl(item.file_key)}
											controls
											className="w-full rounded-lg border border-copper/30"
											preload="metadata"
										/>
									) : (
										<img
											src={previewUrl(item.file_key)}
											alt={item.file_name}
											className="w-full rounded-lg border border-copper/30 object-cover"
										/>
									)}
								</div>

								<div className="md:w-2/3 space-y-3">
									<div className="flex flex-wrap gap-2 text-sm">
										<span className="px-2 py-1 rounded bg-copper/20 text-cream">
											{formatCategory(item.product_category)}
										</span>
										<span className="px-2 py-1 rounded bg-cream/10 text-cream">
											{(item.file_size / (1024 * 1024)).toFixed(2)} MB
										</span>
										{item.status !== 'pending' && (
											<span
												className={`px-2 py-1 rounded text-cream ${
													item.status === 'approved' ? 'bg-sage/60' : 'bg-red-700/60'
												}`}
											>
												{formatStatus(item.status)}
											</span>
										)}
									</div>

									<div>
										<p className="text-cream font-bold">
											{item.first_name} — {item.email}
										</p>
										<p className="text-beige text-sm">Ref: {item.public_id}</p>
									</div>

									{item.description && (
										<p className="text-beige text-sm">{item.description}</p>
									)}

									{(item.instagram_handle || item.tiktok_handle) && (
										<p className="text-beige text-sm">
											{item.instagram_handle && <span>IG: {item.instagram_handle}</span>}
											{item.instagram_handle && item.tiktok_handle && <span className="mx-2">|</span>}
											{item.tiktok_handle && <span>TikTok: {item.tiktok_handle}</span>}
										</p>
									)}

									{item.status === 'approved' && (
										<div className="p-3 rounded bg-sage/10 border border-sage/30 text-cream">
											<p className="text-sm">Reward: ${item.reward_amount}</p>
											<p className="font-mono font-bold tracking-wide">{item.reward_code}</p>
										</div>
									)}

									{item.status === 'pending' && (
										<div className="space-y-3">
											<textarea
												rows={2}
												placeholder="Optional review notes"
												value={notes[item.public_id] ?? ''}
												onChange={(e) =>
													setNotes({ ...notes, [item.public_id]: e.target.value })
												}
												className="w-full px-3 py-2 rounded-lg bg-cream/10 border border-copper/30 text-cream placeholder-beige/50 focus:outline-none focus:ring-2 focus:ring-copper"
											/>
											<div className="flex gap-3">
												<button
													onClick={() => handleAction(item.public_id, 'approve')}
													disabled={actingId === item.public_id}
													className="px-5 py-2 bg-sage hover:bg-sage-dark text-cream font-bold rounded-lg transition-colors disabled:opacity-60"
												>
													Approve + send credit
												</button>
												<button
													onClick={() => handleAction(item.public_id, 'decline')}
													disabled={actingId === item.public_id}
													className="px-5 py-2 bg-red-800 hover:bg-red-700 text-cream font-bold rounded-lg transition-colors disabled:opacity-60"
												>
													Decline + notify
												</button>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
