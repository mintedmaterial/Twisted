import { Suspense } from 'react';
import CustomOrderAssistant from '@/components/custom-order/CustomOrderAssistant';

export default function CustomOrderCheckout() {
	return <Suspense fallback={null}><CustomOrderAssistant /></Suspense>;
}
