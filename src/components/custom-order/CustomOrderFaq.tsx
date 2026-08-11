const FAQ_ITEMS = [
	{
		question: 'What does the starting price cover?',
		answer: 'Checkout collects the full published starting price for the one selected piece. Selected allowed upgrades are included in that checkout total. Later customer-approved changes may require a separate payment.',
	},
	{
		question: 'When are my design details and measurements confirmed?',
		answer: 'After payment, Twisted Custom Leather reviews the order with you and confirms design details and any needed measurements before work begins.',
	},
	{
		question: 'Could there be an additional payment?',
		answer: 'Selected upgrades are included in your checkout total. Any later upgrade or design change that you approve may require an additional payment.',
	},
	{
		question: 'How long does a custom order take?',
		answer: 'The current estimate is 42–56 days.',
	},
	{
		question: 'How are reference images handled?',
		answer: 'Reference photos are stored privately for the order process and are not published as gallery work without permission.',
	},
	{
		question: 'Why can I order only one piece at a time?',
		answer: 'Each custom piece is reviewed individually so its design details and measurements can be confirmed before work begins.',
	},
] as const;

export default function CustomOrderFaq() {
	return (
		<section aria-labelledby="custom-order-faq-heading" className="glass rounded-lg border border-copper/30 p-5">
			<h3 id="custom-order-faq-heading" className="heading-western text-2xl text-cream">Custom order FAQ</h3>
			<div className="mt-4 divide-y divide-copper/20">
				{FAQ_ITEMS.map(({ question, answer }) => (
					<details key={question} className="py-3 text-beige">
						<summary className="cursor-pointer font-bold text-cream">{question}</summary>
						<p className="mt-2 leading-relaxed">{answer}</p>
					</details>
				))}
			</div>
		</section>
	);
}
