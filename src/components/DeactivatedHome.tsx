import { Helmet } from 'react-helmet-async';
import duckImage from '../img/deactivated-home-duck.png';

export function DeactivatedHome() {
  return (
    <>
      <Helmet>
        <title>Dripfield.pro → WTED Archives</title>
      </Helmet>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#ff0] px-6">
        <div className="flex flex-col items-center text-center text-[#ed0091]">
          <img
            src={duckImage}
            alt=""
            className="mb-6 h-auto w-[min(72vw,280px)] select-none"
            draggable={false}
          />
          <p
            className="text-4xl sm:text-5xl md:text-6xl leading-tight"
            style={{ fontFamily: 'CookConthic, sans-serif' }}
          >
            <span className="line-through decoration-[#ed0091] decoration-[3px]">
              Dripfield.pro
            </span>
            {' → WTED Archives'}
          </p>
          <p
            className="mt-3 text-3xl sm:text-4xl md:text-5xl leading-tight"
            style={{ fontFamily: 'CookConthic, sans-serif' }}
          >
            July 29th
          </p>
          <a
            href="https://community.wysterialane.org"
            target="_blank"
            rel="noopener noreferrer"
            className="deactivated-community-btn mt-8 inline-block bg-[#ed0091] px-5 pt-2 pb-1 text-lg sm:text-xl text-[#ff0] no-underline rounded-none"
            style={{ fontFamily: 'NimbusMonoBold, monospace' }}
          >
            COMMUNITY
          </a>
        </div>
      </div>
    </>
  );
}
