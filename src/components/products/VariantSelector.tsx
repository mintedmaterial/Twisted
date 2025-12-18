'use client';

import { useState } from 'react';
import type { ProductVariant } from '@/data/products';

interface VariantSelectorProps {
	variant: ProductVariant;
	onChange?: (selected: string) => void;
}

const COLOR_MAP: Record<string, string> = {
	'Black': '#000000',
	'Brown': '#5c4a3a',
	'Tan': '#d4c5b0',
	'Natural': '#f5f1e8'
};

/**
 * Variant Selector Component
 * Displays color swatches or size options for product customization
 * Currently non-functional (Phase 1), will integrate with cart in future phases
 */
export default function VariantSelector({ variant, onChange }: VariantSelectorProps) {
	const [selected, setSelected] = useState<string>(variant.options[0]);

	const handleSelect = (option: string) => {
		setSelected(option);
		onChange?.(option);
	};

	if (variant.type === 'color') {
		return (
			<div className="flex flex-wrap gap-3">
				{variant.options.map((color) => (
					<button
						key={color}
						onClick={() => handleSelect(color)}
						className={`relative flex flex-col items-center gap-2 transition-all ${
							selected === color ? 'scale-110' : 'hover:scale-105'
						}`}
						title={color}
					>
						{/* Color Swatch */}
						<div
							className={`w-12 h-12 rounded-full border-4 transition-all ${
								selected === color
									? 'border-copper shadow-lg'
									: 'border-wood-light/30 hover:border-copper/50'
							}`}
							style={{
								backgroundColor: COLOR_MAP[color] || '#8b7355'
							}}
						/>
						{/* Color Label */}
						<span
							className={`text-sm font-bold transition-colors ${
								selected === color ? 'text-copper' : 'text-beige'
							}`}
						>
							{color}
						</span>
					</button>
				))}
			</div>
		);
	}

	if (variant.type === 'size') {
		return (
			<div className="flex flex-wrap gap-2">
				{variant.options.map((size) => (
					<button
						key={size}
						onClick={() => handleSelect(size)}
						className={`px-6 py-3 rounded-lg border-2 font-bold transition-all ${
							selected === size
								? 'bg-copper border-copper text-cream'
								: 'bg-transparent border-wood-light/30 text-beige hover:border-copper/50'
						}`}
					>
						{size}
					</button>
				))}
			</div>
		);
	}

	// Default text-based selector for other variant types
	return (
		<div className="flex flex-wrap gap-2">
			{variant.options.map((option) => (
				<button
					key={option}
					onClick={() => handleSelect(option)}
					className={`px-4 py-2 rounded-md border-2 text-sm font-bold transition-all ${
						selected === option
							? 'bg-copper border-copper text-cream'
							: 'bg-transparent border-wood-light/30 text-beige hover:border-copper/50'
					}`}
				>
					{option}
				</button>
			))}
		</div>
	);
}
