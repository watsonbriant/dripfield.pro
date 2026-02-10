export function WTEDShows() {
  return (
    <div className="flex flex-col h-full bg-wl-dark-green">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="m-8">
            <h1 className="text-wl-white text-xl font-bold text-center">Scheduled Shows & Goose Content</h1>
            <div className="text-wl-white text-left mt-4 space-y-4 leading-[1.25rem]">
              <p>
                WTED Goose Radio features a slate of regularly occurring shows and features that cover a wide range of topics and experiences, all curated for your listening pleasure. You can check out the schedule of shows on our homepage or in our iOS and Android apps and plan to tune in.
              </p>
              <p>
                Have an idea or want to contribute to a show? Become a GORP (Goose Obsessed Radio Personality) over at the{' '}
                <a
                  href="https://community.wysterialane.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-wl-orange hover:underline font-medium"
                >
                  Wysteria Lane Community
                </a>
                !
              </p>
            </div>

            <hr className="border-wl-orange my-6 clear-both" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">RequesTED with Randy</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Airing several times per day and occupying random stretches of space and time, Randy the Randomizer curates extended jam sessions featuring the entire catalog available on WTED intermixed with your requests for requestTED. You never know who you're going to run into or where you're going to go. Strap in, folks.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">The aGOOSEtic Hour</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Start your Sunday mornings with acoustic jams from the world of Goose. This show gets your week moving at 10AM Eastern featuring commentary on each show from Dean Novin of{' '}
                  <a href="https://twitter.com/GooseBandTrivia" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">@GooseBandTrivia</a>
                  {' '}supported by BenChasingSatellites as well as special guests from time to time.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">OnlyJams™</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  An example of community radio at its finest, OnlyJams shows are curated by community members and edited down to compilations of the jam portions of songs, leaving the composition behind to create extended sets of straight fire. Bring a towel.
                  {' '}Details about what each OnlyJams session is comprised of are available at the{' '}
                  <a href="https://community.wysterialane.org" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">Wysteria Lane Community</a>.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">High AltiTed</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Curated by Tug Martin with assists from various members of the community, this show is focused on Goose performances that feature peak jams with lots of bliss. No dark tones here, only happiness and the good that comes from collective spirits being raised.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">Seasonal Highlights</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Tune in to WTED to hear curated mixes of the best jams from a specific seasonal tour (e.g., Fall 2021, Summer 2023, etc.) or year.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">RequesTED Gold</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  A review show curated by @Norm, RequesTED Gold recaps the top five most requested songs from RequesTED sessions over the previous month. Popular performances, new releases, or standards from the past? Tune in to find out as we count down.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">My Perfect Show</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  This is a chance for you, the sage and wise listener, to create your own personalized Goose show featuring performances from their catalog that were played in the same spot as your list. Join us on the{' '}
                  <a href="https://community.wysterialane.org" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">Wysteria Lane Community</a>
                  {' '}to submit yours and you'll hear it on WTED!
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">Just Teasin'</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Curated by Peter "TX_Goosefan" Chase, this show features songs from Goose that contain teases of other songs from their catalog as well as covers. Listen closely and you'll find something you may not have heard before.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">Dead to Me</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Curated by Ben @BenChasingSatellites McDermott, this show features covers of the Grateful Dead from various bands in the Goose ecosystem (Goose, Orebolo, Vasudo, and Great Blue) from throughout their catalogs. Tune in to hear unique takes on the classics from the grandfathers of jam.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">What's Good ShOhio?</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  This show features a Goose Jockey-curated set of some of the best Goose performances from around the state of Ohio, a longtime touring favorite for the band that is supported by a strong base of fans.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">Night Flight</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Tug "OldManRising" Martin takes you through a curated set of jams made to be enjoyed after dark.
                </p>
              </article>
              <article className="rounded-xl bg-wl-dark-grey px-3 py-2 text-wl-white transition-all duration-200 hover:scale-105 hover:bg-wl-dark-grey/90">
                <h2 className="text-lg font-semibold mb-2">Goose Snacks</h2>
                <p className="text-sm leading-[1rem] text-left opacity-95">
                  Sometimes you need a small snack and sometimes you need a much larger one. Goose jams are often the same way; the Goose Snacks show features a "sandwich" of music between other tunes. Sometimes they're tiny, sometimes they're huge. Tune in to find out!
                </p>
              </article>
            </div>

            <hr className="border-wl-orange my-6 clear-both" />

            <section className="text-wl-white text-left">
              <h2 className="text-lg font-semibold mb-3 text-center">Other Features</h2>
              <div className="space-y-4 leading-[1.25rem]">
                <p>
                  Check the schedule on the homepage or in the app and tune in regularly to hear curated playlists featuring seasonal tour mixes, highlights from special tours like Taboose, listener-curated special shows, events and partnerships with friends of WTED, and more. The limits of WTED are driven only by the creativity of listeners like you.
                </p>
                <p>
                  If you have an idea, want to contribute, or simply wish to express your unbridled enthusiasm for WTED, join us over at the{' '}
                  <a
                    href="https://community.wysterialane.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-wl-orange hover:underline font-medium"
                  >
                    Wysteria Lane Community
                  </a>
                  !
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
