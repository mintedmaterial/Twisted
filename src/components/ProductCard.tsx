import Image from 'next/image';

interface ProductCardProps {
	title: string;
	description?: string;
	icon?: string;
	iconImage?: string;
	actionLabel?: string;
	actionHref?: string;
	actionExternal?: boolean;
}

export default function ProductCard({
	title,
	description,
	icon,
	iconImage,
	actionLabel = 'Start an order',
	actionHref = '#custom-order',
	actionExternal = false,
}: ProductCardProps) {
	return (
		<a
			href={actionHref}
			target={actionExternal ? '_blank' : undefined}
			rel={actionExternal ? 'noopener noreferrer' : undefined}
			aria-label={actionLabel}
			className="card-glow glass rounded-lg p-6 md:p-8 transition-all duration-300 hover:scale-105 group block focus:outline-none focus-visible:ring-2 focus-visible:ring-copper-light"
		>
			{iconImage ? (
				<div className="mb-4 group-hover:scale-110 transition-transform duration-300">
					<Image
						src={iconImage}
						alt={`${title} product`}
						width={96}
						height={96}
						className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg"
					/>
				</div>
			) : icon ? (
				<div className="text-4xl md:text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
					{icon}
				</div>
			) : null}

			<h3 className="heading-western text-2xl md:text-3xl text-cream mb-3">
				{title}
			</h3>

			{description && (
				<p className="body-western text-beige text-sm md:text-base">
					{description}
				</p>
			)}

			<span className="mt-4 inline-block text-copper font-bold text-sm group-hover:text-copper-light transition-colors">
				{actionLabel} -&gt;
			</span>
		</a>
	);
}
