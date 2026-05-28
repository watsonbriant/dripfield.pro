import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import wlLogo from '../img/WL.png';
import wtedGoose from '../img/wted-sa-cropped-2.png';

const WLC_URL = 'https://community.wysterialane.org';
const WTED_RADIO_URL = 'https://wtedradio.com';
const DRIPFIELD_X_URL = 'https://x.com/dripfieldpro';
const CONTACT_EMAIL = 'dripfield.pro@gmail.com';

function SectionDivider() {
  return <hr className="border-primary/25 my-8" />;
}

function ExternalLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-tertiary underline hover:text-tertiary/80 ${className}`.trim()}
    >
      {children}
    </a>
  );
}

export function New() {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Dripfield.pro is Merging with Wysteria Lane Community — Dripfield.pro</title>
      </Helmet>
      <div className="max-w-6xl mx-auto bg-fourth text-primary leading-snug rounded-lg border border-tertiary/30 shadow-xl px-6 py-8 sm:px-10 sm:py-10 [&_h1]:text-white [&_h2]:text-white [&_strong]:text-white [&_p.font-bold]:text-white">
        <section>
          <h1 className="text-xl sm:text-2xl font-bold mb-3">
            Dripfield.pro is Merging with Wysteria Lane Community
          </h1>
          <p>
            Effective July 2026, Dripfield.pro is merging with Wysteria Lane Community and rebranding as WTED Archives. Everything you know from Dripfield.pro is coming with it — your attended shows, stats, and setlist history will all be there waiting for you at{' '}
            <ExternalLink href={WTED_RADIO_URL}>WTEDRadio.com</ExternalLink>.
          </p>
        </section>

        <SectionDivider />

        <section>
          <h2 className="text-lg sm:text-xl font-bold mb-3">
            What You Need To Do Before July 2026
          </h2>
          <div className="mb-4">
            {user?.email ? (
              <p className="mb-4 text-tertiary flex flex-wrap items-center gap-2">
                Your Dripfield.pro email:{' '}
                <span className="inline-block font-mono text-sm bg-primary text-fifth rounded-full px-3 py-1">
                  {user.email}
                </span>
              </p>
            ) : (
              <p className="mb-4 bg-tertiary/20 border border-tertiary/60 rounded-md px-3 py-2 text-primary">
                You&apos;re not currently logged in. If you have a Dripfield.pro account,{' '}
                <Link to="/login" className="text-tertiary underline hover:text-tertiary/80">
                  log in
                </Link>{' '}
                to see the most accurate instructions below.
              </p>
            )}
            <p className="mb-1">
              <strong>
                If you already have a Wysteria Lane Community account with the same email used here on Dripfield.pro:
              </strong>
            </p>
            <p>
              You&apos;re all set! Once the merger is complete, just use your existing Wysteria Lane Community login. Click Sign In on the new site and you&apos;ll be directed to log in through Wysteria Lane Community — no new account needed.
            </p>
          </div>
          <div className="mb-4">
            <p className="mb-1">
              <strong>If you have a Dripfield.pro account, but don&apos;t have a Wysteria Lane Community account:</strong>
            </p>
            <p className="mb-2">
              We are in the process of adding all existing Dripfield.pro accounts into Wysteria Lane Community. Over the next few weeks, you should receive an email to set your password on Wysteria Lane Community.
            </p>
            <p>
              If you haven&apos;t received an email yet, you&apos;re welcome to make an account on{' '}
              <ExternalLink href={WLC_URL}>Wysteria Lane Community</ExternalLink> yourself. Ensure you&apos;re using the same email as you did for your account here on Dripfield.pro. Once you&apos;re logged in, your Dripfield.pro stats will be linked to your new account automatically once the new site launches.
            </p>
          </div>
          <div>
            <p className="mb-1">
              <strong>If you never signed up for a Dripfield.pro account:</strong>
            </p>
            <p>
              Sign-ups on Dripfield.pro are closed while we finish the merger. Visit{' '}
              <ExternalLink href={WLC_URL}>community.wysterialane.org</ExternalLink>{' '}
              to create an account — once the merger is complete, you&apos;ll have access to everything on WTED Archives, including show tracking, WTED Radio song requests, and more.
            </p>
          </div>
        </section>

        <SectionDivider />

        <section>
          <h2 className="text-lg sm:text-xl font-bold mb-3">
            How Logging In Will Work
          </h2>
          <p>
            Your WTED Archives login is shared with Wysteria Lane Community, and vice versa. Click Sign In on either site and you&apos;ll be logged into both at the same time.
          </p>
        </section>

        <SectionDivider />

        <section>
          <h2 className="text-lg sm:text-xl font-bold mb-3">
            What Is Wysteria Lane?
          </h2>
          <p className="mb-3">
            Wysteria Lane is a fan-built home for Goose fans. Along with WTED Archives, it&apos;s also home to:
          </p>
          <ul className="space-y-3">
            <li>
              🎵{' '}
              <ExternalLink href={WTED_RADIO_URL} className="font-bold">
                WTED Goose Radio
              </ExternalLink>{' '}
              — a 24/7 internet radio station dedicated entirely to Goose music
            </li>
            <li>
              💬{' '}
              <ExternalLink href={WLC_URL} className="font-bold">
                Wysteria Lane Community
              </ExternalLink>{' '}
              — a fan-run forum with 3,000+ members discussing all things Goose
            </li>
          </ul>
        </section>

        <SectionDivider />

        <section>
          <h2 className="text-lg sm:text-xl font-bold mb-3">
            Questions?
          </h2>
          <p>
            Reach out on X{' '}
            <ExternalLink href={DRIPFIELD_X_URL}>@dripfieldpro</ExternalLink> or email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-tertiary underline hover:text-tertiary/80">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <div className="mt-10 flex flex-wrap items-end justify-center gap-6">
          <img src={wlLogo} alt="Wysteria Lane logo" className="h-24 w-auto object-contain" />
          <img src={wtedGoose} alt="WTED goose with guitar" className="h-24 w-auto object-contain" />
        </div>
      </div>
    </>
  );
}
