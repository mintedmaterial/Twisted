export default function YouTubeEmbed() {
  return (
    <section id="video" className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-charcoal/80 to-charcoal" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-copper text-sm uppercase tracking-[0.35em] mb-4">
            Handmade in Oklahoma
          </p>
          <h2 className="heading-western text-4xl md:text-6xl font-bold text-cream text-glow mb-6">
            Custom Leather Work Made To Be Used
          </h2>
          <p className="text-beige text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            Wallets, belts, purses, guitar straps, welding gear, Bible covers, and one-of-a-kind pieces
            built by hand with western character and everyday durability.
          </p>
          <p className="text-copper text-base md:text-lg max-w-3xl mx-auto leading-relaxed mt-4">
            Stage-ready custom leatherwork, including a guitar strap crafted for country artist Ashland Craft.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="glass card-glow rounded-lg p-6 border border-copper/30">
            <h3 className="heading-western text-2xl text-cream mb-3">Custom Orders</h3>
            <p className="text-beige leading-relaxed">
              Tell us what you need, from daily carry pieces to gifts with a personal touch.
            </p>
          </div>

          <div className="glass card-glow rounded-lg p-6 border border-copper/30">
            <h3 className="heading-western text-2xl text-cream mb-3">Hand-Tooled Detail</h3>
            <p className="text-beige leading-relaxed">
              Each piece is crafted with care, texture, and the kind of character leather should have.
            </p>
          </div>

          <div className="glass card-glow rounded-lg p-6 border border-copper/30">
            <h3 className="heading-western text-2xl text-cream mb-3">Built For Real Life</h3>
            <p className="text-beige leading-relaxed">
              Rugged enough for work, polished enough for a gift, and made to age beautifully.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#custom-order"
            className="inline-flex items-center justify-center px-8 py-4 bg-copper text-charcoal font-semibold rounded-lg hover:bg-cream transition-colors"
          >
            Start A Custom Order
          </a>
          <a
            href="https://www.facebook.com/twistedcustomleather"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 border border-copper text-cream font-semibold rounded-lg hover:bg-copper/20 transition-colors"
          >
            Message Us On Facebook
          </a>
        </div>
      </div>
    </section>
  );
}
