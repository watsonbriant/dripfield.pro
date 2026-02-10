import { Link } from 'react-router-dom';

export function WTEDAboutUs() {
  return (
    <div className="flex flex-col h-full bg-wl-dark-green">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="m-8">
            <h1 className="text-wl-white text-xl font-bold text-center">About Us and FAQ</h1>
            <p className="text-wl-white text-center mt-4">Last updated: November 25, 2025</p>

            <hr className="border-wl-orange my-6 clear-both" />

            <div className="text-wl-white text-left space-y-4 leading-[1.25rem]">
              <div>
                <h2 className="text-wl-white text-lg font-bold mb-2">What is WTED Goose Radio?</h2>
                <p>
                  WTED Goose Radio is an Internet streaming radio station that celebrates the band Goose as well as Goose-related projects and forerunners like Vasudo, Great Blue, and Orebolo. It streams a mix of studio and live recordings from the band's various catalogs as well as commentary, special event simulcasts, and other programming. Though it is freely available to anyone on the Internet, the station is primarily targeted for users of the{' '}
                  <a href="https://community.wysterialane.org" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">Wysteria Lane Community</a>. If you're not already a member, join us!
                </p>
              </div>

              <hr className="border-wl-orange my-6 clear-both" />

              <div>
                <h2 className="text-wl-white text-lg font-bold mb-2">Where does the music come from? Is the band compensated?</h2>
                <p>
                  The team behind WTED is 100% sold on supporting the band and part of that is ensuring that they are compensated for their art. We support this effort in two ways: music purchases and streaming licensing. All songs and shows are purchased through Bandcamp or other means and WTED holds streaming licensing from SoundExchange and ASCAP to ensure that we operate ethically.
                </p>
              </div>

              <hr className="border-wl-orange my-6 clear-both" />

              <div>
                <h2 className="text-wl-white text-lg font-bold mb-2">How is all of this paid for?</h2>
                <p className="mb-4">
                  WTED Goose Radio, the Wysteria Lane Community, and associated resources have traditionally been funded out of the pocket of the team that produces the station. We've launched the ability to <Link to="/wl/wted/support" className="text-wl-orange hover:underline font-medium">support WTED</Link> with either a monthly recurring payment or a one-time gift if you choose to do so, and thank you to those that have! We use Stripe as a payment processor so that we never see or store any of your payment credentials or credit card information. If you have questions on how that works, please <a href="mailto:wted@wtedradio.com" className="text-wl-orange hover:underline font-medium">reach out to us</a>.
                </p>
                <p className="mb-4">
                  The goal of the team behind WTED and the Wysteria Lane Community is to have sufficient community support so that operating costs are covered every month. Any funds raised above and beyond the monthly costs will be donated on a quarterly basis to official charities in and around the Goose orbit such as <a href="https://westernsunfoundation.org/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">Western Sun Foundation</a>, <a href="https://groovesafe.org/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">GrooveSafe</a>, <a href="https://consciousalliance.org/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">Conscious Alliance</a>, and others. We've made investments in mobile apps to make it easier to enjoy WTED on the go or wherever you are. As the station becomes financially sustainable, we plan to invest in additional capabilities and offerings (regular merch, anyone?) in addition to donating. We also have partnerships with community retailers like <a href="https://www.teesthatjam.com/" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">TeesThatJam.com</a> and <a href="https://junglerooooom.com/search?q=wted&options%5Bprefix%5D=last" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">Junglerooooom</a> that graciously provide part of their proceeds to WTED.
                </p>
                <p className="mb-4">
                  In order to support those goals, we've formed Wysteria Lane LLC as a way to enable basic business functions (like a bank account) as well as establishing a basic but transparent financial framework that includes a breakdown of our monthly costs, income, and donations (if any) supported by bank account statements. You can view these financial breakdowns in <a href="https://docs.google.com/spreadsheets/d/1P_7PG3tl-axoFA136phWsdl14U9re5zrUeD-Knq2aU0/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">this spreadsheet</a>. This is the first step on a journey that will eventually see Wysteria Lane LLC reorganized in order to gain an IRS certification of 501(c)(3) non-profit status. It also means that any gifts received are currently not tax deductible. Transparency is a cornerstone of our partnership and it is important that contributors know what their gift is used for.
                </p>
                <p>
                  The bottom line in all of that in real terms for listeners is that no one involved with the production, management, or leadership of WTED Goose Radio is paid or otherwise compensated for their time and effort; this is a labor of love, and of community.
                </p>
              </div>

              <hr className="border-wl-orange my-6 clear-both" />

              <div>
                <h2 className="text-wl-white text-lg font-bold mb-2">Can I become a GORP (Goose Obsessed Radio Personality)?</h2>
                <p>
                  In a word...yes! We encourage and value community participation in producing original content to accompany the music. GORPs are special guests that contribute periodically to show hosting, commentary, bumpers, and other content. Join us at the{' '}
                  <a href="https://community.wysterialane.org" target="_blank" rel="noopener noreferrer" className="text-wl-orange hover:underline font-medium">Wysteria Lane Community</a> site and join in the conversation. There are threads, posts, and a live chat feature that you can use to join the fray and learn how to contribute.
                </p>
              </div>

              <hr className="border-wl-orange my-6 clear-both" />

              <div>
                <h2 className="text-wl-white text-lg font-bold mb-2">I have other questions; who can I contact?</h2>
                <p>
                  For other questions, comments, concerns, or to give us delicious waffles, please reach out to us at{' '}
                  <a href="mailto:wted@wtedradio.com" className="text-wl-orange hover:underline font-medium">wted@wtedradio.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
