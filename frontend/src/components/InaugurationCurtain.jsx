import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'ssmWebsiteInaugurated';
const CURTAIN_DURATION_MS = 2600;

const curtainBase =
  'absolute top-0 bottom-0 w-1/2 overflow-hidden bg-[linear-gradient(180deg,#8f0f16_0%,#b3131d_18%,#6d0810_38%,#a5141c_60%,#5a050b_100%)] shadow-[inset_0_0_60px_rgba(255,255,255,0.08),inset_0_0_120px_rgba(0,0,0,0.45)]';

function InaugurationCurtain({ active, onInaugurate, onFinished }) {
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!active) {
      setOpening(false);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  useEffect(() => {
    if (!opening) return undefined;

    const timer = window.setTimeout(() => {
      onFinished?.();
    }, CURTAIN_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [opening, onFinished]);

  const handleInaugurate = () => {
    if (opening) return;
    setOpening(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    onInaugurate?.();
  };

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#140204]"
      aria-hidden={!active}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.75)_100%)]" />

      <div className="absolute inset-0 flex">
        <div
          className={`${curtainBase} left-0 border-r border-[#f5c0c4]/20`}
          style={{
            transform: opening ? 'translateX(-100%)' : 'translateX(0)',
            transition: `transform ${CURTAIN_DURATION_MS}ms cubic-bezier(0.77, 0, 0.175, 1)`,
          }}
        >
          <div className="absolute inset-y-0 right-0 w-8 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0)_100%)] opacity-80" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_4px,rgba(0,0,0,0)_4px,rgba(0,0,0,0)_14px)] opacity-40" />
        </div>

        <div
          className={`${curtainBase} right-0 border-l border-[#f5c0c4]/20`}
          style={{
            transform: opening ? 'translateX(100%)' : 'translateX(0)',
            transition: `transform ${CURTAIN_DURATION_MS}ms cubic-bezier(0.77, 0, 0.175, 1)`,
          }}
        >
          <div className="absolute inset-y-0 left-0 w-8 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0)_100%)] opacity-80" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.06)_0px,rgba(255,255,255,0.06)_4px,rgba(0,0,0,0)_4px,rgba(0,0,0,0)_14px)] opacity-40" />
        </div>
      </div>

      <div
        className={`absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center transition-all duration-700 ${
          opening ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <h1 className="max-w-4xl text-3xl font-bold text-[#fff4ef] drop-shadow-[0_4px_12px_rgba(0,0,0,0.55)] sm:text-4xl md:text-5xl font-baskervville">
          St. Martha&apos;s Special School Website Inauguration
        </h1>

        <p className="mt-2 text-sm tracking-[0.25em] uppercase text-[#ffd7bf]">
          Powered by TherapInc
        </p>

        <p className="mt-4 max-w-2xl text-sm text-[#f8d9d9] sm:text-base">
          Welcome to the official launch.
        </p>

        <button
          type="button"
          onClick={handleInaugurate}
          disabled={opening}
          className="mt-10 rounded-full border border-[#ffd7bf]/50 bg-[#E38B52] px-8 py-4 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:bg-[#c8742f] hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Inaugurate Website
        </button>
      </div>
    </div>
  );
}

export { STORAGE_KEY };
export default InaugurationCurtain;
