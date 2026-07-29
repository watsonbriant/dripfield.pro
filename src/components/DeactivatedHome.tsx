import { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import wtedLogo from '../img/wted-sa-cropped-2.png';
import './DeactivatedHome.css';

const REDIRECT_URL = 'https://wtedradio.com/archive';
const COUNTDOWN_SECONDS = 10;

export function DeactivatedHome() {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const goNow = useCallback(() => {
    window.location.assign(REDIRECT_URL);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      window.location.assign(REDIRECT_URL);
    }
  }, [secondsLeft]);

  return (
    <>
      <Helmet>
        <title>Dripfield.pro is now WTED Archives</title>
      </Helmet>
      <div className="df-splash" role="presentation">
        <div
          className="df-splash-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="df-splash-heading"
          aria-describedby="df-splash-body"
        >
          <div className="df-splash-head">
            <h1 id="df-splash-heading">Dripfield.pro is now WTED Archives</h1>
          </div>
          <div className="df-splash-body">
            <div id="df-splash-body" className="df-splash-copy">
              <img
                src={wtedLogo}
                alt="WTED Archives"
                className="df-splash-logo"
                width={110}
                height={110}
              />
              <p>
                Dripfield.pro has a new home on WTEDRadio.com, and has been
                rebranded to WTED Archives. All of the data, features, and
                functionality of Dripfield.pro has been brought over to WTED
                Archives, including your personal stats.
              </p>
            </div>
            <p className="df-splash-countdown" aria-live="polite">
              Redirecting in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}…
            </p>
            <div className="df-splash-actions">
              <button type="button" className="df-splash-btn" onClick={goNow}>
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
