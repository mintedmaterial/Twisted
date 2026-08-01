export type WalletCategory = 'bifold' | 'trifold' | 'roper' | 'biker' | 'checkbook-long';

export type GalleryImage = {
	src: string;
	alt: string;
	title: string;
	width: number;
	height: number;
};

export type WalletGalleryImage = GalleryImage & {
	category: WalletCategory;
};

export type Gallery<TImage extends GalleryImage = GalleryImage> = {
	title: string;
	eyebrow: string;
	description: string;
	cover: string;
	images: TImage[];
};

export type GalleryRecord =
	| (Gallery<WalletGalleryImage> & { slug: 'wallets' })
	| (Gallery & { slug: 'belts' | 'welding-gear' | 'leather-work' | 'bible-covers' | 'portfolios' });

const portrait = { width: 1200, height: 1600 };
const landscape = { width: 1600, height: 1200 };

export const galleries: GalleryRecord[] = [
	{
		slug: 'wallets',
		title: 'Custom Wallets',
		eyebrow: 'Everyday carry',
		description: 'Custom bifolds, tri-folds, ropers, biker wallets, checkbook wallets, and tooled details made to be carried and used.',
		cover: '/gallery/wallets/bifold-es-basket-weave.webp',
		images: [
			{
				src: '/gallery/wallets/bifold-es-basket-weave.webp',
				alt: 'ES basket stamped custom leather bifold wallet on a black presentation background',
				title: 'ES basket weave bifold',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/bifold-4e-basket-weave.webp',
				alt: '4E basket stamped custom leather bifold wallet on a black presentation background',
				title: '4E basket weave bifold',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/bifold-cgc-turquoise-cross.webp',
				alt: 'Turquoise cross custom leather bifold wallet on a black presentation background',
				title: 'CGC turquoise cross bifold',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/bifold-kirk-guitar.webp',
				alt: 'Kirk guitar custom leather bifold wallet on a black presentation background',
				title: 'Kirk guitar bifold',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/bifold-floral-cross.webp',
				alt: 'Floral tooled cross custom leather bifold wallet on a black presentation background',
				title: 'Floral cross bifold',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/bifold-white-cross-detail.webp',
				alt: 'White cross custom leather bifold wallet detail on a black presentation background',
				title: 'White cross bifold detail',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/bifold-jjb-floral.webp',
				alt: 'JJB floral custom leather bifold wallet on a black presentation background',
				title: 'JJB floral bifold',
				category: 'bifold',
				...portrait,
			},
			{
				src: '/gallery/wallets/bifold-cowboy-silhouette.webp',
				alt: 'Cowboy silhouette custom leather bifold wallet on a black presentation background',
				title: 'Cowboy silhouette bifold',
				category: 'bifold',
				...portrait,
			},
			{
				src: '/gallery/wallets/bifold-dark-interior.webp',
				alt: 'Interior view of a dark leather bifold wallet on a black presentation background',
				title: 'Dark bifold interior',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/bifold-black-interior.webp',
				alt: 'Interior view of a black leather bifold wallet on a black presentation background',
				title: 'Black bifold interior',
				category: 'bifold',
				...landscape,
			},
			{
				src: '/gallery/wallets/biker-wallet-smith-chain.webp',
				alt: 'Smith custom leather biker wallet with chain on a black presentation background',
				title: 'Smith biker wallet',
				category: 'biker',
				...landscape,
			},
			{
				src: '/gallery/wallets/biker-wallet-texas-chain.webp',
				alt: 'Texas custom leather biker wallet with chain on a black presentation background',
				title: 'Texas biker wallet',
				category: 'biker',
				...landscape,
			},
			{
				src: '/gallery/wallets/biker-wallet-big-dog.webp',
				alt: 'Big Dog custom leather biker wallet with chain on a black presentation background',
				title: 'Big Dog biker wallet',
				category: 'biker',
				...portrait,
			},
			{
				src: '/gallery/wallets/biker-wallet-skull-chain.webp',
				alt: 'Skull custom leather biker wallet with chain on a black presentation background',
				title: 'Skull biker wallet',
				category: 'biker',
				...portrait,
			},
			{
				src: '/gallery/wallets/biker-wallet-bar-shield.webp',
				alt: 'Bar shield custom leather biker wallet with chain on a black presentation background',
				title: 'Bar shield biker wallet',
				category: 'biker',
				...portrait,
			},
			{
				src: '/gallery/wallets/biker-wallet-clover-chain.webp',
				alt: 'Clover custom leather biker wallet with chain on a black presentation background',
				title: 'Clover biker wallet',
				category: 'biker',
				...portrait,
			},
			{
				src: '/gallery/wallets/floral-branded-wallet.webp',
				alt: 'Custom floral branded leather wallet on a black presentation background',
				title: 'Floral branded wallet',
				category: 'checkbook-long',
				...portrait,
			},
			{
				src: '/gallery/wallets/open-checkbook-wallet.webp',
				alt: 'Open custom leather checkbook wallet on a black presentation background',
				title: 'Open checkbook wallet',
				category: 'checkbook-long',
				...portrait,
			},
			{
				src: '/gallery/wallets/floral-tooled-wallet.webp',
				alt: 'Floral tooled leather wallet on a black presentation background',
				title: 'Floral tooled wallet',
				category: 'checkbook-long',
				...portrait,
			},
			{
				src: '/gallery/wallets/roper-wallet-front.webp',
				alt: 'Front view of a custom roper wallet on a black presentation background',
				title: 'Roper wallet front',
				category: 'roper',
				...portrait,
			},
			{
				src: '/gallery/wallets/custom-long-wallet.webp',
				alt: 'Custom long leather wallet on a black presentation background',
				title: 'Custom long wallet',
				category: 'checkbook-long',
				...portrait,
			},
			{
				src: '/gallery/wallets/wallet-interior.webp',
				alt: 'Interior view of a leather wallet on a black presentation background',
				title: 'Wallet interior',
				category: 'checkbook-long',
				...portrait,
			},
			{ src: '/gallery/wallets/roper-air-force.webp', alt: 'Custom Air Force basket-weave leather Roper wallet with painted blue insignia', title: 'Air Force Roper wallet', category: 'roper', ...landscape },
			{ src: '/gallery/wallets/roper-floral-initials.webp', alt: 'Hand-tooled floral leather Roper wallet with turquoise initials', title: 'Floral initial Roper', category: 'roper', ...landscape },
			{ src: '/gallery/wallets/roper-personal-message-interior.webp', alt: 'Open custom Roper wallet with a personal engraved message and floral deer tooling', title: 'Personal message Roper interior', category: 'roper', ...landscape },
			{ src: '/gallery/wallets/roper-wr-basket-weave.webp', alt: 'Basket-weave custom leather Roper wallet with black WR initials', title: 'WR basket-weave Roper', category: 'roper', ...landscape },
			{ src: '/gallery/wallets/roper-ranch-action.webp', alt: 'Custom leather Roper wallet with painted rodeo action silhouettes and blue initials', title: 'Ranch action Roper', category: 'roper', ...landscape },
			{ src: '/gallery/wallets/roper-deer-brand.webp', alt: 'Basket-weave custom leather Roper wallet with a white deer and ranch brand', title: 'Deer and brand Roper', category: 'roper', ...landscape },
			{ src: '/gallery/wallets/trifold-floral-set.webp', alt: 'Coordinated hand-tooled floral leather tri-fold wallet and belt set', title: 'Floral wallet and belt set', category: 'trifold', ...landscape },
			{ src: '/gallery/wallets/trifold-brown-interior.webp', alt: 'Open brown leather tri-fold wallet showing card slots and center identification window', title: 'Brown tri-fold interior', category: 'trifold', ...landscape },
			{ src: '/gallery/wallets/trifold-floral-initial.webp', alt: 'Hand-tooled floral leather tri-fold wallet with painted blue initials', title: 'Floral initial tri-fold', category: 'trifold', ...landscape },
			{ src: '/gallery/wallets/trifold-scripture-interior.webp', alt: 'Open custom leather tri-fold wallet with card slots, center window, and engraved scripture', title: 'Scripture tri-fold interior', category: 'trifold', ...landscape },
			{ src: '/gallery/wallets/trifold-pnut-floral.webp', alt: 'Hand-tooled floral leather tri-fold wallet personalized with the name Pnut', title: 'Pnut floral tri-fold', category: 'trifold', ...landscape },
			{ src: '/gallery/wallets/trifold-ranch-floral.webp', alt: 'Custom floral leather tri-fold wallet with ranch mark and painted turquoise lettering', title: 'Ranch floral tri-fold', category: 'trifold', ...landscape },
		],
	},
	{
		slug: 'belts',
		title: 'Belts',
		eyebrow: 'Made to fit',
		description: 'Hand-tooled custom leather belts with western detail, initials, floral tooling, and working quality.',
		cover: '/gallery/belts/mc-neely-name-belt.webp',
		images: [
			{
				src: '/gallery/belts/mc-neely-name-belt.webp',
				alt: 'Mc Neely custom turquoise name belt on a black presentation background',
				title: 'Mc Neely name belt',
				...portrait,
			},
			{
				src: '/gallery/belts/painted-floral-belt.webp',
				alt: 'Painted floral custom leather belt on a black presentation background',
				title: 'Painted floral belt',
				...portrait,
			},
			{
				src: '/gallery/belts/floral-tooled-strap-set.webp',
				alt: 'Floral tooled belt and strap set on a black presentation background',
				title: 'Floral tooled strap set',
				...portrait,
			},
			{
				src: '/gallery/belts/hs-floral-belt-detail.webp',
				alt: 'HS floral custom leather belt detail on a black presentation background',
				title: 'HS floral belt detail',
				...portrait,
			},
			{
				src: '/gallery/belts/black-stitched-belt.webp',
				alt: 'Black stitched custom leather belt on a black presentation background',
				title: 'Black stitched belt',
				...portrait,
			},
			{
				src: '/gallery/belts/hr-floral-belt.webp',
				alt: 'HR floral custom leather belt on a black presentation background',
				title: 'HR floral belt',
				...landscape,
			},
			{
				src: '/gallery/belts/tooled-belt-panels.webp',
				alt: 'Custom tooled leather belt panels on a black presentation background',
				title: 'Tooled belt panels',
				...portrait,
			},
			{
				src: '/gallery/belts/het-custom-belt-detail.webp',
				alt: 'HET custom leather belt detail on a black presentation background',
				title: 'HET custom belt detail',
				...portrait,
			},
			{
				src: '/gallery/belts/turquoise-cross-belt-detail.webp',
				alt: 'Turquoise cross custom leather belt detail on a black presentation background',
				title: 'Turquoise cross belt detail',
				...portrait,
			},
			{
				src: '/gallery/belts/bubba-name-belt.webp',
				alt: 'Bubba custom name belt on a black presentation background',
				title: 'Bubba name belt',
				...portrait,
			},
			{
				src: '/gallery/belts/floral-horseshoe-belt.webp',
				alt: 'Floral horseshoe custom leather belt on a black presentation background',
				title: 'Floral horseshoe belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-01.webp',
				alt: 'Custom leather belt with cross detail on a black presentation background',
				title: 'Cross detail belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-02.webp',
				alt: 'Custom floral leather belt with monogram detail on a black presentation background',
				title: 'Monogram floral belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-03.webp',
				alt: 'Custom tooled leather name belt on a black presentation background',
				title: 'Tooled name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-04.webp',
				alt: 'Custom Colt 45 leather belt with cross detail on a black presentation background',
				title: 'Colt 45 cross belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-05.webp',
				alt: 'Custom leather belt with floral tooling on a black presentation background',
				title: 'Floral tooled belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-06.webp',
				alt: 'Custom leather name belt on a black presentation background',
				title: 'Custom name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-07.webp',
				alt: 'Custom leather belt with cross detail on a black presentation background',
				title: 'Cross detail belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-08.webp',
				alt: 'Custom floral tooled leather belt with keeper on a black presentation background',
				title: 'Floral belt with keeper',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-09.webp',
				alt: 'Custom green floral leather belt on a black presentation background',
				title: 'Green floral belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-10.webp',
				alt: 'Custom black floral leather belt on a black presentation background',
				title: 'Black floral belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-11.webp',
				alt: 'Custom Lane leather name belt on a black presentation background',
				title: 'Lane name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-12.webp',
				alt: 'Custom floral leather belt side view on a black presentation background',
				title: 'Floral belt side view',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-13.webp',
				alt: 'Custom floral leather belt detail on a black presentation background',
				title: 'Floral belt detail',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-14.webp',
				alt: 'Custom Horn leather name belt on a black presentation background',
				title: 'Horn name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-15.webp',
				alt: 'Custom leather belt detail with brand on a black presentation background',
				title: 'Brand detail belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-16.webp',
				alt: 'Custom floral leather belt with keeper on a black presentation background',
				title: 'Floral belt with keeper',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-17.webp',
				alt: 'Custom Colt turquoise leather belt on a black presentation background',
				title: 'Colt turquoise belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-18.webp',
				alt: 'Custom turquoise floral leather belt on a black presentation background',
				title: 'Turquoise floral belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-19.webp',
				alt: 'Custom painted feather leather belt on a black presentation background',
				title: 'Painted feather belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-20.webp',
				alt: 'Custom TA leather name belt on a black presentation background',
				title: 'TA name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-21.webp',
				alt: 'Custom BC leather name belt on a black presentation background',
				title: 'BC name belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-22.webp',
				alt: 'Custom floral leather belt detail on a black presentation background',
				title: 'Floral belt detail',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-23.webp',
				alt: 'Custom feather brand leather belt on a black presentation background',
				title: 'Feather brand belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-24.webp',
				alt: 'Custom red brand leather belt on a black presentation background',
				title: 'Red brand belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-25.webp',
				alt: 'Custom memorial leather name belt on a black presentation background',
				title: 'Memorial name belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-26.webp',
				alt: 'Custom tooled floral leather belt on a black presentation background',
				title: 'Tooled floral belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-27.webp',
				alt: 'Custom Phillips leather name belt on a black presentation background',
				title: 'Phillips name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-28.webp',
				alt: 'Custom Moore leather name belt on a black presentation background',
				title: 'Moore name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-29.webp',
				alt: 'Custom leather name belt on a black presentation background',
				title: 'Custom name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-30.webp',
				alt: 'Custom leather name belt on a black presentation background',
				title: 'Custom name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-31.webp',
				alt: 'Custom Davis leather name belt on a black presentation background',
				title: 'Davis name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-32.webp',
				alt: 'Custom leather monogram belt on a black presentation background',
				title: 'Monogram belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-33.webp',
				alt: 'Custom Oklahoma pipeline leather belt on a black presentation background',
				title: 'Oklahoma pipeline belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-34.webp',
				alt: 'Custom floral leather belt side view on a black presentation background',
				title: 'Floral belt side view',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-35.webp',
				alt: 'Custom floral leather belt on a black presentation background',
				title: 'Floral belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-36.webp',
				alt: 'Custom leather belt on a black presentation background',
				title: 'Custom belt',
				...portrait,
			},
			{
				src: '/gallery/belts/archive-belt-37.webp',
				alt: 'Custom Weger leather name belt on a black presentation background',
				title: 'Weger name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-38.webp',
				alt: 'Custom RH Hay leather name belt on a black presentation background',
				title: 'RH Hay name belt',
				...landscape,
			},
			{
				src: '/gallery/belts/archive-belt-39.webp',
				alt: 'Custom leather name belt on a black presentation background',
				title: 'Custom name belt',
				...landscape,
			},
		],
	},
	{
		slug: 'welding-gear',
		title: 'Welding Gear',
		eyebrow: 'Built for work',
		description: 'Leather welding hoods, arm guards, pancake hoods, and protective pieces made for real working conditions.',
		cover: '/gallery/welding-gear/welder-armguard-hostetler.webp',
		images: [
			{
				src: '/gallery/welding-gear/welder-armguard-hostetler.webp',
				alt: 'Custom Hostetler leather welder armguard on a black presentation background',
				title: "Welder's armguard - Hostetler",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-montana-pipeline.webp',
				alt: 'Montana pipeline leather welder armguard on a black presentation background',
				title: "Welder's armguard - Montana pipeline",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-pair.webp',
				alt: 'Pair of custom leather welder armguards on a black presentation background',
				title: "Welder's armguard pair",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-bad-cad.webp',
				alt: 'Bad Cad custom leather welder armguard on a black presentation background',
				title: "Welder's armguard - Bad Cad",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-jk.webp',
				alt: 'JK custom leather welder armguard on a black presentation background',
				title: "Welder's armguard - JK",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-louisiana-pipeline-sk.webp',
				alt: 'Louisiana pipeline custom leather welder armguard on a black presentation background',
				title: "Welder's armguard - Louisiana pipeline",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-louisiana-pipeliner-lb.webp',
				alt: 'Louisiana pipeliner custom leather welder armguard on a black presentation background',
				title: "Welder's armguard - LB",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-oklahoma-pipeliner.webp',
				alt: 'Oklahoma pipeliner custom leather welder armguard on a black presentation background',
				title: "Welder's armguard - Oklahoma pipeliner",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welder-armguard-blue-cross-memorial.webp',
				alt: 'Blue cross memorial custom leather welder armguard on a black presentation background',
				title: "Welder's armguard - blue cross memorial",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/pancake-hood-jordyn.webp',
				alt: "Jordyn custom leather welder's pancake hood on a black presentation background",
				title: "Welder's pancake hood - Jordyn",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/pancake-hood-dv.webp',
				alt: "DV custom leather welder's pancake hood on a black presentation background",
				title: "Welder's pancake hood - DV",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/pancake-hood-scripture-cross.webp',
				alt: "Scripture cross custom leather welder's pancake hood on a black presentation background",
				title: "Welder's pancake hood - scripture cross",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/pancake-hood-vela.webp',
				alt: "Vela custom leather welder's pancake hood on a black presentation background",
				title: "Welder's pancake hood - Vela",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/pancake-hood-colton.webp',
				alt: "Colton custom leather welder's pancake hood on a black presentation background",
				title: "Welder's pancake hood - Colton",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/pancake-hood-dillard.webp',
				alt: "Dillard custom leather welder's pancake hood on a black presentation background",
				title: "Welder's pancake hood - Dillard",
				...portrait,
			},
			{
				src: '/gallery/welding-gear/welter-pipeline-armguard.webp',
				alt: 'Welter custom leather pipeline arm guard on a black presentation background',
				title: 'Welter pipeline arm guard',
				...landscape,
			},
		],
	},
	{
		slug: 'leather-work',
		title: 'Leather Work',
		eyebrow: 'Purses, bags, gifts, and more',
		description: 'A mix of custom leather pieces including purses, bags, specialty gifts, and one-of-a-kind tooled details.',
		cover: '/gallery/leather-work/turquoise-tooled-purse.webp',
		images: [
			{
				src: '/gallery/leather-work/turquoise-tooled-purse.webp',
				alt: 'Turquoise tooled leather purse on a black presentation background',
				title: 'Ladies turquoise tooled purse',
				...portrait,
			},
			{
				src: '/gallery/leather-work/fringed-ladies-purse.webp',
				alt: 'Custom brown and cream leather ladies purse with turquoise fringe on a black presentation background',
				title: 'Ladies fringed leather purse',
				...landscape,
			},
			{
				src: '/gallery/leather-work/tooled-rifle-sling.webp',
				alt: 'Custom tooled leather rifle sling on a black presentation background',
				title: 'Tooled rifle sling',
				...portrait,
			},
			{
				src: '/gallery/leather-work/turquoise-leather-vase.webp',
				alt: 'Turquoise leather vase on a black presentation background',
				title: 'Turquoise leather vase',
				...portrait,
			},
			{
				src: '/gallery/leather-work/elk-knife-sheath.webp',
				alt: 'Custom leather knife sheath with elk detail on a black presentation background',
				title: 'Elk knife sheath',
				...portrait,
			},
			{
				src: '/gallery/leather-work/jkl-kdm-knife-sheaths.webp',
				alt: 'Pair of custom leather knife sheaths with JKL and KDM initials on a black presentation background',
				title: 'Initialed knife sheath pair',
				...portrait,
			},
			{
				src: '/gallery/leather-work/floral-crossdraw-knife-sheath.webp',
				alt: 'Custom floral tooled crossdraw leather knife sheath on a black presentation background',
				title: 'Floral crossdraw knife sheath',
				...portrait,
			},
		],
	},
	{
		slug: 'bible-covers',
		title: 'Bible Covers',
		eyebrow: 'Custom covers',
		description: 'Hand-tooled leather Bible covers with floral carving, cross details, names, brands, and personal touches.',
		cover: '/gallery/bible-covers/stained-glass-cross-bible-cover.webp',
		images: [
			{
				src: '/gallery/bible-covers/stained-glass-cross-bible-cover.webp',
				alt: 'Custom leather Bible cover with stained-glass style cross on a black presentation background',
				title: 'Stained glass cross Bible cover',
				...portrait,
			},
			{
				src: '/gallery/bible-covers/turquoise-floral-bible-cover.webp',
				alt: 'Custom turquoise floral tooled leather Bible cover on a black presentation background',
				title: 'Turquoise floral Bible cover',
				...portrait,
			},
			{
				src: '/gallery/bible-covers/talli-cross-bible-cover-spine.webp',
				alt: 'Talli custom leather Bible cover with cross detail and tooled spine on a black presentation background',
				title: 'Talli cross Bible cover',
				...portrait,
			},
			{
				src: '/gallery/bible-covers/talli-cross-bible-cover-panel.webp',
				alt: 'Talli custom leather Bible cover panel with floral tooling and cross on a black presentation background',
				title: 'Talli tooled Bible cover panel',
				...portrait,
			},
			{
				src: '/gallery/bible-covers/horse-floral-bible-cover.webp',
				alt: 'Custom leather Bible cover with horse and floral tooling on a black presentation background',
				title: 'Horse floral Bible cover',
				...portrait,
			},
			{
				src: '/gallery/bible-covers/branded-floral-bible-cover.webp',
				alt: 'Custom leather Bible cover with floral tooling and brand detail on a black presentation background',
				title: 'Branded floral Bible cover',
				...portrait,
			},
		],
	},
	{
		slug: 'portfolios',
		title: 'Portfolios',
		eyebrow: 'Custom covers',
		description: 'Portfolio, notebook, and cover-style leather pieces with tooled fronts, clean edges, and personal detail.',
		cover: '/gallery/portfolios/texas-cross-book-cover.webp',
		images: [
			{
				src: '/gallery/portfolios/texas-cross-book-cover.webp',
				alt: 'Texas cross tooled leather book cover on a black presentation background',
				title: 'Texas cross book cover',
				...portrait,
			},
			{
				src: '/gallery/portfolios/oilfield-portfolio-cover.webp',
				alt: 'Oilfield tooled leather portfolio cover on a black presentation background',
				title: 'Oilfield portfolio cover',
				...portrait,
			},
			{
				src: '/gallery/portfolios/at-floral-cover.webp',
				alt: 'AT floral leather cover on a black presentation background',
				title: 'AT floral cover',
				...portrait,
			},
		],
	},
];

export function getGallery(slug: string) {
	return galleries.find((gallery) => gallery.slug === slug);
}
