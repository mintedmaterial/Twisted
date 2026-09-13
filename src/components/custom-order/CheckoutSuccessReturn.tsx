'use client';

import { useEffect } from 'react';
import { clearOrderDraft, PENDING_ORDER_REFERENCE_KEY, shouldClearDraftForReturnedReference } from './orderDraftStorage';

export default function CheckoutSuccessReturn({ orderReference }: { orderReference: string | null }) {
	useEffect(() => {
		try {
			const pendingReference = window.sessionStorage.getItem(PENDING_ORDER_REFERENCE_KEY);
			if (!shouldClearDraftForReturnedReference(orderReference, pendingReference)) return;
			clearOrderDraft();
			window.sessionStorage.removeItem(PENDING_ORDER_REFERENCE_KEY);
		} catch {
			// Storage restrictions leave the recoverable local draft untouched.
		}
	}, [orderReference]);
	return null;
}
