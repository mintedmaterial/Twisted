import { ALLOWED_REFERENCE_TYPES, MAX_REFERENCE_BYTES, MAX_REFERENCE_FILES } from '../../lib/order-assets';

const PRIVATE_REFERENCE_URL = /^\/api\/order-assets\/[A-Za-z0-9_-]+$/u;

export interface ReferenceImageFile {
	name: string;
	type: string;
	size: number;
}

export interface UploadedReference {
	name: string;
	url: string;
	contentType: string;
}

export interface PendingReferenceImage {
	id: string;
	file: ReferenceImageFile;
}

export interface FailedReferenceImage extends PendingReferenceImage {
	error: string;
}

export interface ReferenceImageUploadState {
	uploaded: UploadedReference[];
	pending: PendingReferenceImage[];
	failed: FailedReferenceImage[];
	status: string;
}

export interface ReferenceImageUploadStartResult {
	started: boolean;
	state: ReferenceImageUploadState;
	entries: PendingReferenceImage[];
}

export function createReferenceImageUploadState(): ReferenceImageUploadState {
	return { uploaded: [], pending: [], failed: [], status: '' };
}

export function expireReferenceImageSession(_state: ReferenceImageUploadState): ReferenceImageUploadState {
	void _state;
	return {
		uploaded: [],
		pending: [],
		failed: [],
		status: 'Verification expired. Complete the challenge and upload reference images again.',
	};
}

export function referenceImageSlotCount(state: ReferenceImageUploadState): number {
	return state.uploaded.length + state.pending.length + state.failed.length;
}

export function canStartReferenceImageUpload(state: ReferenceImageUploadState, fileCount: number): boolean {
	return fileCount > 0 && referenceImageSlotCount(state) + fileCount <= MAX_REFERENCE_FILES;
}

export function getReferenceImageBrowserValidationError(
	state: ReferenceImageUploadState,
	files: readonly ReferenceImageFile[],
): string | null {
	if (!canStartReferenceImageUpload(state, files.length)) return `Choose up to ${MAX_REFERENCE_FILES} reference images in total.`;
	for (const file of files) {
		if (!ALLOWED_REFERENCE_TYPES.has(file.type)) return 'Reference images must be JPEG or PNG files.';
		if (file.size <= 0 || file.size > MAX_REFERENCE_BYTES) return 'Each reference image must be non-empty and 8 MB or smaller.';
	}
	return null;
}

export function setReferenceImageUploadStatus(state: ReferenceImageUploadState, status: string): ReferenceImageUploadState {
	return { ...state, status };
}

export function startReferenceImageUpload(
	state: ReferenceImageUploadState,
	entries: readonly PendingReferenceImage[],
): ReferenceImageUploadStartResult {
	const ids = entries.map((entry) => entry.id);
	const existingIds = new Set([...state.pending, ...state.failed].map((reference) => reference.id));
	const hasRepeatedOrCollidingId = ids.some((id, index) => !id || ids.indexOf(id) !== index || existingIds.has(id));
	if (!canStartReferenceImageUpload(state, entries.length) || hasRepeatedOrCollidingId) {
		return { started: false, state, entries: [] };
	}

	const nextEntries = [...entries];
	return {
		started: true,
		entries: nextEntries,
		state: {
			...state,
			pending: [...state.pending, ...nextEntries],
			status: `Uploading ${nextEntries.length} reference image${nextEntries.length === 1 ? '' : 's'}...`,
		},
	};
}

export function retryReferenceImageUpload(
	state: ReferenceImageUploadState,
	id: string,
): ReferenceImageUploadStartResult {
	const failed = state.failed.find((reference) => reference.id === id);
	if (!failed || state.pending.some((reference) => reference.id === id)) {
		return { started: false, state, entries: [] };
	}

	const entry: PendingReferenceImage = { id: failed.id, file: failed.file };
	return {
		started: true,
		entries: [entry],
		state: {
			...state,
			failed: state.failed.filter((reference) => reference.id !== id),
			pending: [...state.pending, entry],
			status: 'Uploading 1 reference image...',
		},
	};
}

function canonicalizeUploadedReference(value: unknown): UploadedReference | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
	const reference = value as Record<string, unknown>;
	const name = typeof reference.name === 'string' ? reference.name.trim() : '';
	const url = typeof reference.url === 'string' ? reference.url : '';
	const contentType = typeof reference.contentType === 'string' ? reference.contentType : '';
	if (!name || !PRIVATE_REFERENCE_URL.test(url) || !ALLOWED_REFERENCE_TYPES.has(contentType)) return null;
	return { name, url, contentType };
}

function failPendingReferences(
	state: ReferenceImageUploadState,
	ids: readonly string[],
	error: string,
): ReferenceImageUploadState {
	const selected = new Set(ids);
	const failed = state.pending
		.filter((reference) => selected.has(reference.id))
		.map((reference) => ({ ...reference, error }));
	if (!failed.length) return state;
	return {
		...state,
		pending: state.pending.filter((reference) => !selected.has(reference.id)),
		failed: [...state.failed.filter((reference) => !selected.has(reference.id)), ...failed],
		status: error,
	};
}

export function failReferenceImageUpload(
	state: ReferenceImageUploadState,
	ids: readonly string[],
	error: string,
): ReferenceImageUploadState {
	return failPendingReferences(state, ids, error);
}

export function completeReferenceImageUpload(
	state: ReferenceImageUploadState,
	ids: readonly string[],
	responseFiles: unknown,
): ReferenceImageUploadState {
	const idSet = new Set(ids);
	const pending = state.pending.filter((reference) => idSet.has(reference.id));
	if (!pending.length || pending.length !== ids.length) return state;
	if (!Array.isArray(responseFiles) || responseFiles.length !== pending.length) {
		return failPendingReferences(state, ids, 'The upload response was invalid. Please retry.');
	}

	const references = responseFiles.map(canonicalizeUploadedReference);
	const urls = new Set<string>();
	const hasInvalidReference = references.some((reference) => !reference || urls.has(reference.url) || !urls.add(reference.url));
	const existingUrls = new Set(state.uploaded.map((reference) => reference.url));
	if (hasInvalidReference || references.some((reference) => reference && existingUrls.has(reference.url))) {
		return failPendingReferences(state, ids, 'The upload response was invalid. Please retry.');
	}

	const successful = references as UploadedReference[];
	return {
		...state,
		uploaded: [...state.uploaded, ...successful],
		pending: state.pending.filter((reference) => !idSet.has(reference.id)),
		status: `${successful.length} reference image${successful.length === 1 ? '' : 's'} uploaded.`,
	};
}

export function removeFailedReference(state: ReferenceImageUploadState, id: string): ReferenceImageUploadState {
	const reference = state.failed.find((item) => item.id === id);
	if (!reference) return state;
	return {
		...state,
		failed: state.failed.filter((item) => item.id !== id),
		status: `${reference.file.name} removed.`,
	};
}

export function removeUploadedReference(state: ReferenceImageUploadState, url: string): ReferenceImageUploadState {
	const reference = state.uploaded.find((item) => item.url === url);
	if (!reference) return state;
	return {
		...state,
		uploaded: state.uploaded.filter((item) => item.url !== url),
		status: `${reference.name} removed.`,
	};
}
