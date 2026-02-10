const LINKS = [
  { label: 'Goose Website', href: 'https://www.goosetheband.com/' },
  { label: 'Goose Bandcamp Page', href: 'https://goosetheband.bandcamp.com/' },
  { label: 'Western Sun Foundation', href: 'https://westernsunfoundation.org/' },
  { label: 'Cash or Trade', href: 'https://cashortrade.org/goose-tickets/' },
  { label: 'ElGoose.net', href: 'https://elgoose.net/' },
] as const;

export function WTLinks() {
  return (
    <div className="flex flex-col h-full bg-wl-dark-green">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="m-8">
            <h1 className="text-wl-white text-xl font-bold text-center">Links</h1>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LINKS.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90 no-underline"
                >
                  <h2 className="text-lg font-semibold mb-2">{label}</h2>
                  <p className="text-sm text-left opacity-95">Visit site →</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
