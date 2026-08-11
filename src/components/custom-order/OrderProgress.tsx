'use client';

export type OrderStep = 1 | 2 | 3;

interface OrderProgressProps {
	step: OrderStep;
	onStepSelect: (step: OrderStep) => void;
	disabled?: boolean;
}

const steps: Array<{ number: OrderStep; label: string }> = [
	{ number: 1, label: 'Choose Your Piece' },
	{ number: 2, label: 'Customize It' },
	{ number: 3, label: 'Review & Pay' },
];

export default function OrderProgress({ step, onStepSelect, disabled }: OrderProgressProps) {
	return (
		<nav aria-label="Custom order progress">
			<ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				{steps.map((item) => (
					<li key={item.number}>
						<button
								type="button"
								disabled={disabled}
							onClick={() => onStepSelect(item.number)}
							aria-current={step === item.number ? 'step' : undefined}
							className={`min-h-11 w-full rounded-lg border px-4 py-3 text-left transition-colors ${step === item.number
								? 'border-copper bg-copper/20 text-cream'
								: 'border-copper/30 bg-charcoal/50 text-beige hover:border-copper/60'}`}
						>
							<span className="mr-2 font-bold">{item.number}.</span>{item.label}
						</button>
					</li>
				))}
			</ol>
		</nav>
	);
}
