interface ProductCardProps {
	title: string;
	description?: string;
	icon?: string;
	iconImage?: string;
}

export default function ProductCard({ title, description, icon, iconImage }: ProductCardProps) {
	return (
		<div className="card-glow glass rounded-lg p-6 md:p-8 transition-all duration-300 hover:scale-105 group">
			{iconImage ? (
				<div className="mb-4 group-hover:scale-110 transition-transform duration-300">
					<img
						src={iconImage}
						alt={`${title} product`}
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

			<div className="mt-4 inline-block">
				<span className="text-copper font-bold text-sm group-hover:text-copper-light transition-colors">
					Coming Soon →
				</span>
			</div>
		</div>
	);
}
