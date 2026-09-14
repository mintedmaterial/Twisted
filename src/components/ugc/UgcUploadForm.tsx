'use client';

import { useState, useCallback } from 'react';
import { UGC_PRODUCT_CATEGORIES, type UgcProductCategory } from '@/lib/ugc';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function UgcUploadForm() {
	const [formData, setFormData] = useState({
		firstName: '',
		email: '',
		productCategory: '' as UgcProductCategory | '',
		instagramHandle: '',
		tiktokHandle: '',
		description: '',
	});
	const [file, setFile] = useState<File | null>(null);
	const [agreedRights, setAgreedRights] = useState(false);
	const [agreedCredit, setAgreedCredit] = useState(false);
	const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
	const [message, setMessage] = useState('');
	const [publicId, setPublicId] = useState('');

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const selected = e.target.files?.[0] ?? null;
		setFile(selected);
	}, []);

	const validate = (): string | null => {
		if (!formData.firstName.trim()) return 'First name is required.';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'A valid email is required.';
		if (!formData.productCategory) return 'Product category is required.';
		if (!file) return 'Please select a photo or video.';
		if (!agreedRights || !agreedCredit) return 'You must agree to both terms to submit.';

		const isVideo = file.type.startsWith('video/');
		const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
		if (file.size > maxBytes) {
			return `${isVideo ? 'Video' : 'Image'} must be under ${maxBytes / (1024 * 1024)}MB.`;
		}
		if (file.type.startsWith('video/')) {
			if (!['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type)) {
				return 'Video must be MP4, MOV, or WebM.';
			}
		} else if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type)) {
			return 'Image must be JPG, PNG, WebP, or HEIC.';
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const error = validate();
		if (error) {
			setStatus('error');
			setMessage(error);
			return;
		}

		setStatus('loading');
		setMessage('');

		const data = new FormData();
		data.append('firstName', formData.firstName);
		data.append('email', formData.email);
		data.append('productCategory', formData.productCategory);
		if (formData.instagramHandle) data.append('instagramHandle', formData.instagramHandle);
		if (formData.tiktokHandle) data.append('tiktokHandle', formData.tiktokHandle);
		if (formData.description) data.append('description', formData.description);
		data.append('rightsReleaseAgreed', String(agreedRights));
		data.append('creditContingencyAgreed', String(agreedCredit));
		data.append('file', file!);

		try {
			const res = await fetch('/api/ugc/submit', { method: 'POST', body: data });
		const result = (await res.json().catch(() => ({ error: 'Unexpected response.' }))) as {
			message?: string;
			publicId?: string;
			error?: string;
		};
			if (res.ok) {
				setStatus('success');
				setMessage(result.message ?? 'Submission received.');
				setPublicId(result.publicId ?? '');
				setFile(null);
				setFormData({
					firstName: '',
					email: '',
					productCategory: '',
					instagramHandle: '',
					tiktokHandle: '',
					description: '',
				});
				setAgreedRights(false);
				setAgreedCredit(false);
			} else {
				setStatus('error');
				setMessage(result.error ?? 'Submission failed. Please try again.');
			}
		} catch {
			setStatus('error');
			setMessage('Network error. Please try again.');
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<label htmlFor="firstName" className="block text-cream font-medium">
						First name <span className="text-copper">*</span>
					</label>
					<input
						id="firstName"
						type="text"
						required
						value={formData.firstName}
						onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
						className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream placeholder-beige/50 focus:outline-none focus:ring-2 focus:ring-copper"
						placeholder="John"
					/>
				</div>
				<div className="space-y-2">
					<label htmlFor="email" className="block text-cream font-medium">
						Email used for order <span className="text-copper">*</span>
					</label>
					<input
						id="email"
						type="email"
						required
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream placeholder-beige/50 focus:outline-none focus:ring-2 focus:ring-copper"
						placeholder="you@example.com"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<label htmlFor="productCategory" className="block text-cream font-medium">
					Product category <span className="text-copper">*</span>
				</label>
				<select
					id="productCategory"
					required
					value={formData.productCategory}
					onChange={(e) => setFormData({ ...formData, productCategory: e.target.value as UgcProductCategory })}
					className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream focus:outline-none focus:ring-2 focus:ring-copper"
				>
					<option value="" disabled className="bg-wood-dark">
						Select your Twisted gear
					</option>
					{UGC_PRODUCT_CATEGORIES.map((cat) => (
						<option key={cat.value} value={cat.value} className="bg-wood-dark">
							{cat.label}
						</option>
					))}
				</select>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<label htmlFor="instagramHandle" className="block text-cream font-medium">
						Instagram handle
					</label>
					<input
						id="instagramHandle"
						type="text"
						value={formData.instagramHandle}
						onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
						className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream placeholder-beige/50 focus:outline-none focus:ring-2 focus:ring-copper"
						placeholder="@handle"
					/>
				</div>
				<div className="space-y-2">
					<label htmlFor="tiktokHandle" className="block text-cream font-medium">
						TikTok handle
					</label>
					<input
						id="tiktokHandle"
						type="text"
						value={formData.tiktokHandle}
						onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })}
						className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream placeholder-beige/50 focus:outline-none focus:ring-2 focus:ring-copper"
						placeholder="@handle"
					/>
				</div>
			</div>

			<div className="space-y-2">
				<label htmlFor="description" className="block text-cream font-medium">
					Description / caption
				</label>
				<textarea
					id="description"
					rows={3}
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
					className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream placeholder-beige/50 focus:outline-none focus:ring-2 focus:ring-copper"
					placeholder="Where were you using it? What do you love about it?"
				/>
			</div>

			<div className="space-y-2">
				<label htmlFor="file" className="block text-cream font-medium">
					Upload photo or video <span className="text-copper">*</span>
				</label>
				<input
					id="file"
					type="file"
					required
					accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm"
					onChange={handleFileChange}
					className="w-full px-4 py-3 rounded-lg bg-cream/10 border border-copper/30 text-cream file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-copper file:text-cream file:font-medium hover:file:bg-copper-light"
				/>
				<p className="text-beige text-xs">
					Videos up to 100MB (MP4, MOV, WebM). Images up to 10MB (JPG, PNG, WebP, HEIC).
				</p>
				{file && (
					<p className="text-sage text-sm">
						Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
					</p>
				)}
			</div>

			<div className="space-y-4 rounded-lg border border-copper/30 bg-cream/5 p-4">
				<label className="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						required
						checked={agreedRights}
						onChange={(e) => setAgreedRights(e.target.checked)}
						className="mt-1 h-5 w-5 accent-copper rounded cursor-pointer"
					/>
					<span className="text-cream text-sm leading-relaxed">
						I grant Twisted Custom Leather a perpetual, royalty-free, worldwide license to use, modify,
						reproduce, distribute, and display my submitted photo or video in any media, including social
						media, websites, advertising, and email marketing. I confirm that I own this content and have
						permission from any person shown in it.
					</span>
				</label>
				<label className="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						required
						checked={agreedCredit}
						onChange={(e) => setAgreedCredit(e.target.checked)}
						className="mt-1 h-5 w-5 accent-copper rounded cursor-pointer"
					/>
					<span className="text-cream text-sm leading-relaxed">
						I understand that store credit or other rewards are only given if Twisted Custom Leather
						chooses to publish or use my submission.
					</span>
				</label>
			</div>

			<button
				type="submit"
				disabled={status === 'loading'}
				className="w-full md:w-auto px-8 py-4 bg-copper hover:bg-copper-light text-cream font-bold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
			>
				{status === 'loading' ? 'Uploading...' : 'Submit my Twisted gear'}
			</button>

			{status === 'success' && (
				<div className="p-4 rounded-lg bg-sage/20 border border-sage text-cream">
					<p className="font-bold">Thank you - submission received.</p>
					<p className="text-sm">{message}</p>
					<p className="text-xs mt-2">Your reference: {publicId}</p>
				</div>
			)}
			{status === 'error' && (
				<div className="p-4 rounded-lg bg-red-900/30 border border-red-500/50 text-cream">
					<p className="font-bold">Submission failed</p>
					<p className="text-sm">{message}</p>
				</div>
			)}
		</form>
	);
}
