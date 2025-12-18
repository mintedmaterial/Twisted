import Image from 'next/image';

export default function SupplierLogos() {
	return (
		<section className="px-4 sm:px-6 lg:px-8 py-16 bg-wood-dark/20">
			<div className="max-w-5xl mx-auto">
				<h2 className="heading-western text-glow text-3xl sm:text-4xl text-copper mb-4 text-center">
					Quality Materials from Trusted Suppliers
				</h2>
				<p className="text-beige text-center mb-12 max-w-2xl mx-auto">
					We source our premium leather and supplies from industry-leading suppliers
					to ensure every piece meets our exacting standards.
				</p>

				{/* Supplier Logos Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center justify-items-center">
					{/* Tandy Leather */}
					<a
						href="https://tandyleather.com"
						target="_blank"
						rel="noopener noreferrer"
						className="glass card-glow rounded-lg p-8 hover:scale-105 transition-transform w-full max-w-sm"
					>
						<div className="relative w-full h-24">
							<Image
								src="/suppliers/tandy-logo.png"
								alt="Tandy Leather Factory"
								fill
								className="object-contain"
								sizes="300px"
							/>
						</div>
					</a>

					{/* Springfield Leather */}
					<a
						href="https://springfieldleather.com"
						target="_blank"
						rel="noopener noreferrer"
						className="glass card-glow rounded-lg p-8 hover:scale-105 transition-transform w-full max-w-sm"
					>
						<div className="relative w-full h-24">
							<Image
								src="/suppliers/springfield-logo.png"
								alt="Springfield Leather Company"
								fill
								className="object-contain"
								sizes="300px"
							/>
						</div>
					</a>
				</div>

				{/* Quality Statement */}
				<div className="mt-12 text-center">
					<p className="text-sage italic">
						Partnering with the best ensures you receive nothing but the finest
						full-grain leather and premium hardware.
					</p>
				</div>
			</div>
		</section>
	);
}
