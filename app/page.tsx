export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fdf8f6] text-[#2b2b2b]">
      {/* HERO */}
      <section className="px-6 py-20 text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-pink-400 mb-4">
          Glamora Beauty Marketplace
        </p>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight">
          Find Your Perfect
          <br />
          Makeup Artist
        </h1>

        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Connect with talented makeup artists near you for weddings,
          events, photoshoots, and everyday beauty.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button className="bg-black text-white px-8 py-4 rounded-full hover:opacity-90 transition">
            Explore Artists
          </button>

          <button className="border border-black px-8 py-4 rounded-full hover:bg-black hover:text-white transition">
            Become an Artist
          </button>
        </div>
      </section>

      {/* FEATURED ARTISTS */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-semibold">Featured Artists</h2>

            <button className="text-sm underline">
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((artist) => (
              <div
                key={artist}
                className="bg-white rounded-[30px] overflow-hidden shadow-sm hover:shadow-xl transition"
              >
                <div className="h-[350px] bg-pink-100"></div>

                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">
                      Artist {artist}
                    </h3>

                    <span className="text-sm text-pink-500">
                      ★ 4.9
                    </span>
                  </div>

                  <p className="mt-2 text-gray-500">
                    Bridal • Fashion • Natural Makeup
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <p className="font-medium">
                      From $80
                    </p>

                    <button className="bg-black text-white px-5 py-2 rounded-full text-sm">
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto bg-[#f8e8e4] rounded-[40px] p-12 text-center">
          <h2 className="text-4xl font-bold">
            Ready for your next glow up?
          </h2>

          <p className="mt-4 text-gray-600">
            Discover talented beauty artists across Vietnam.
          </p>

          <button className="mt-8 bg-black text-white px-8 py-4 rounded-full">
            Start Booking
          </button>
        </div>
      </section>
    </main>
  );
}