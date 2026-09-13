
'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef } from 'react';

const TURNSTILE_ACTION = 'turnstile-spin-v1';

type TurnstileApi = {
	render: (container: HTMLElement, options: Record<string, unknown>) => string;
	reset: (widgetId: string) => void;
	remove: (widgetId: string) => void;
};

declare global {
	interface Window { turnstile?: TurnstileApi }
}

interface TurnstileWidgetProps {
	siteKey: string;
	resetNonce: number;
	disabled?: boolean;
	onToken: (token: string) => void;
	onExpired: () => void;
	onError: () => void;
}

export default function TurnstileWidget({ siteKey, resetNonce, disabled, onToken, onExpired, onError }: TurnstileWidgetProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const widgetIdRef = useRef<string | undefined>(undefined);
	const callbacksRef = useRef({ onToken, onExpired, onError });
	callbacksRef.current = { onToken, onExpired, onError };

	const renderWidget = useCallback(() => {
		if (!siteKey || !containerRef.current || !window.turnstile || widgetIdRef.current) return;
		widgetIdRef.current = window.turnstile.render(containerRef.current, {
			sitekey: siteKey,
			action: TURNSTILE_ACTION,
			appearance: 'interaction-only',
			callback: (token: string) => callbacksRef.current.onToken(token),
			'expired-callback': () => callbacksRef.current.onExpired(),
			'error-callback': () => callbacksRef.current.onError(),
		});
	}, [siteKey]);

	useEffect(() => {
		renderWidget();
		return () => {
			if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
			widgetIdRef.current = undefined;
		};
	}, [renderWidget]);

	useEffect(() => {
		if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
	}, [resetNonce]);

	if (!siteKey) return <p role="alert" className="text-sm text-red-200">Order verification is unavailable. Please try again later.</p>;

	return (
		<div aria-disabled={disabled} className={disabled ? 'pointer-events-none opacity-60' : undefined}>
			<Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderWidget} />
			<div ref={containerRef} data-action={TURNSTILE_ACTION} />
		</div>
	);
}
