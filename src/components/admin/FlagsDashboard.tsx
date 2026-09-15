'use client';

import { useEffect, useState } from 'react';

interface FlagState {
	key: string;
	enabled: boolean;
	default: boolean;
}

export function FlagsDashboard() {
	const [flags, setFlags] = useState<FlagState[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch('/api/flags');
				if (!res.ok) throw new Error('Failed to load flags');
				const data = await res.json();
				setFlags(data.flags ?? []);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Unknown error');
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	if (loading) {
		return (
			<div className="rounded-2xl border border-copper/30 bg-cream/5 p-8 text-center">
				<p className="text-beige">Loading flag states...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8">
				<p className="text-red-400">{error}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="rounded-2xl border border-copper/30 bg-cream/5 backdrop-blur-sm overflow-hidden">
				<table className="w-full">
					<thead>
						<tr className="border-b border-copper/20">
							<th className="text-left px-6 py-4 text-sm font-semibold text-cream">Flag</th>
							<th className="text-left px-6 py-4 text-sm font-semibold text-cream">State</th>
							<th className="text-left px-6 py-4 text-sm font-semibold text-cream">Default</th>
						</tr>
					</thead>
					<tbody>
						{flags.map((flag) => (
							<tr key={flag.key} className="border-b border-copper/10 hover:bg-copper/5">
								<td className="px-6 py-4 text-sm text-beige font-mono">{flag.key}</td>
								<td className="px-6 py-4">
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											flag.enabled
												? 'bg-green-500/20 text-green-400 border border-green-500/30'
												: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
										}`}
									>
										{flag.enabled ? 'ON' : 'OFF'}
									</span>
								</td>
								<td className="px-6 py-4 text-sm text-beige/60 font-mono">
									{flag.default ? 'on' : 'off'}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p className="text-xs text-beige/50">
				Flag states are managed in the Cloudflare Flagship dashboard. Changes may take
				up to 30 seconds to propagate.
			</p>
		</div>
	);
}
