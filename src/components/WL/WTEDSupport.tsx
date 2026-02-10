import { useEffect, createElement } from 'react';

const STRIPE_PUBLISHABLE_KEY = 'pk_live_51No6yACzMQF2fsuo7ZgLtZKrvx8JM2aiGPn7v6W3oWOzS5ZehhZPc0N1ocirqEuv82BNaWIiY0xlyp8RtsfMH3G000IL1r0ZxO';

export function WTEDSupport() {
  useEffect(() => {
    const loadScript = (src: string) => {
      if (document.querySelector(`script[src="${src}"]`)) return;
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    };
    loadScript('https://js.stripe.com/v3/pricing-table.js');
    loadScript('https://js.stripe.com/v3/buy-button.js');
  }, []);

  return (
    <div className="flex flex-col h-full bg-wl-dark-green">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto">
          <div className="m-8">
            <h1 className="text-wl-white text-xl font-bold text-center">Support WTED</h1>
            <div className="text-wl-white text-left mt-4 space-y-4 leading-[1.25rem]">
              <p>
                Thank you for choosing to support WTED and the Wysteria Lane community! You can choose a monthly gift or a one time amount of your choosing below.
              </p>
              <p>
                Please note that these subscriptions and gifts are <strong>not tax deductible</strong> at this time. Additionally, creating a subscription here does not impact your account at the WysteriaLane community; you can pick the method that works best for you! If you have questions, please reach out to <a href="mailto:wted@wtedradio.com" className="text-wl-orange hover:underline font-medium">wted@wtedradio.com</a>.
              </p>
            </div>

            <hr className="border-wl-orange my-6 clear-both" />

            <div className="flex w-full flex-col items-center">
              {createElement('stripe-pricing-table', {
                'pricing-table-id': 'prctbl_1NugUyCzMQF2fsuobAOsUi5S',
                'publishable-key': STRIPE_PUBLISHABLE_KEY,
                className: 'w-full',
              })}
              <div className="headerctr mt-6 w-full flex justify-center">
              {createElement('stripe-buy-button', {
                'buy-button-id': 'buy_btn_1NugdqCzMQF2fsuoRp2sFoxp',
                'publishable-key': STRIPE_PUBLISHABLE_KEY,
                className: 'w-full',
              })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
