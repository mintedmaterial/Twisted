'use client';

import type { ChangeEvent } from 'react';
import type { ReferenceImageUploadState } from './referenceImageUploadModel';

interface ReferenceImageUploadProps {
	state: ReferenceImageUploadState;
	onFilesSelected: (files: File[]) => void;
	onRetry: (id: string) => void;
	onRemoveFailed: (id: string) => void;
	onRemoveUploaded: (url: string) => void;
	disabled?: boolean;
}

const ACCEPTED_TYPES = 'image/jpeg,image/png';

export default function ReferenceImageUpload({
	state,
	onFilesSelected,
	onRetry,
	onRemoveFailed,
	onRemoveUploaded,
	disabled,
}: ReferenceImageUploadProps) {
	const isUploading = state.pending.length > 0;

	function selectFiles(event: ChangeEvent<HTMLInputElement>) {
		const files = Array.from(event.target.files ?? []);
		event.target.value = '';
		if (files.length) onFilesSelected(files);
	}

	return (
		<fieldset disabled={disabled} className="rounded-lg border border-copper/20 bg-charcoal/40 p-4">
			<legend className="px-1 font-bold text-cream">Reference images (optional)</legend>
			<p className="mt-1 text-sm text-beige">Add up to 3 images, 8 MB each. JPEG and PNG files are accepted.</p>
			<label className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-copper/50 px-4 py-2 font-bold text-cream hover:bg-copper/20">
				<span>{isUploading ? 'Uploading images...' : 'Choose reference images'}</span>
				<input className="sr-only" type="file" accept={ACCEPTED_TYPES} multiple disabled={disabled || isUploading} onChange={selectFiles} />
			</label>
			<p role="status" aria-live="polite" className="mt-3 text-sm text-beige">{state.status}</p>

			{state.uploaded.length > 0 && (
				<ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
					{state.uploaded.map((reference) => (
						<li key={reference.url} className="flex items-center gap-3 rounded-lg border border-copper/30 p-2 text-beige">
							<img src={reference.url} alt={`Reference image: ${reference.name}`} className="h-16 w-16 rounded object-cover" />
							<span className="min-w-0 flex-1 truncate">{reference.name}</span>
							<button type="button" onClick={() => onRemoveUploaded(reference.url)} className="min-h-11 rounded px-3 text-sm font-bold text-cream underline hover:text-copper">Remove</button>
						</li>
					))}
				</ul>
			)}

			{state.failed.length > 0 && (
				<ul className="mt-4 space-y-2">
					{state.failed.map((reference) => (
						<li key={reference.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300/50 p-3 text-sm text-red-100">
							<span className="min-w-0 flex-1">{reference.file.name}: {reference.error}</span>
							<button type="button" disabled={isUploading} onClick={() => onRetry(reference.id)} className="min-h-11 rounded px-3 font-bold underline disabled:opacity-60">Retry</button>
							<button type="button" disabled={isUploading} onClick={() => onRemoveFailed(reference.id)} className="min-h-11 rounded px-3 font-bold underline disabled:opacity-60">Remove</button>
						</li>
					))}
				</ul>
			)}
		</fieldset>
	);
}
