import { checkoutProducts } from '@/data/checkout-products';

interface ProductSelectionStepProps {
	selectedProductId: string;
	onSelect: (productId: string) => void;
}

export default function ProductSelectionStep({ selectedProductId, onSelect }: ProductSelectionStepProps) {
	const groups = [
		['Wallets', 'wallet'], ['Belts', 'belt'], ['Covers', 'cover'], ['Welding Gear', 'welding'],
		['Straps', 'guitar-strap'], ['Bags', 'purse'],
	] as const;
	return (
		<fieldset>
			<legend className="sr-only">Choose one custom piece</legend>
			<div className="space-y-7">
				{groups.map(([label, category]) => <section key={category} aria-labelledby={`product-group-${category}`}>
					<h4 id={`product-group-${category}`} className="heading-western mb-3 text-xl text-cream">{label}</h4>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{checkoutProducts.filter((candidate) => candidate.category === category).map((product) => {
					const selected = product.id === selectedProductId;

					return (
						<label
							key={product.id}
							className={`min-h-11 rounded-lg border p-5 text-left transition-colors focus-within:ring-2 focus-within:ring-copper focus-within:ring-offset-2 focus-within:ring-offset-charcoal ${selected
								? 'border-copper bg-copper/20 text-cream'
								: 'border-copper/30 bg-charcoal/50 text-beige hover:border-copper/60'} cursor-pointer`}
						>
							<input type="radio" name="custom-piece" value={product.id} checked={selected} onChange={() => onSelect(product.id)} className="sr-only" />
							<span className="flex items-start justify-between gap-4">
								<span className="heading-western text-xl">{product.name}</span>
								<span className="shrink-0 font-bold text-copper">${product.amount}</span>
							</span>
							<span className="mt-2 block text-sm leading-relaxed">{product.description}</span>
						</label>
					);
				})}
					</div>
				</section>)}
				<div className="rounded-lg border border-copper/30 bg-charcoal/40 p-5 text-beige">
					<p className="heading-western text-xl text-cream">Not sure?</p>
					<p className="mt-2 text-sm">Contact Randy before paying and he’ll help choose the right starting point.</p>
					<a href="mailto:randy@twistedcustomleather.com" className="mt-3 inline-flex min-h-11 items-center font-bold text-copper underline">Ask Randy first</a>
				</div>
			</div>
		</fieldset>
	);
}
