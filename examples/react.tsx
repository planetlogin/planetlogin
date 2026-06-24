// PlanetLogin in React — a thin wrapper around the factory API.
// npm i @planetlogin/planetlogin
import { useEffect, useRef } from 'react';
import { createPlanetLogin, type PlanetLocale, type PlanetLoginOptions } from '@planetlogin/planetlogin';

type Props = Omit<PlanetLoginOptions, 'onLocale'> & {
  onLocale?: (locale: PlanetLocale) => void;
  className?: string;
};

export function PlanetLogin({ onLocale, className, ...options }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onLocale);
  cb.current = onLocale;

  useEffect(() => {
    const globe = createPlanetLogin(ref.current!, {
      ...options,
      onLocale: (l) => cb.current?.(l),
    });
    return () => globe.destroy();
    // Re-create only when a structural option changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.accent, options.resolution, options.search]);

  return <div ref={ref} className={className} style={{ width: '100%', height: 480 }} />;
}

// Usage:
// <PlanetLogin accent="#f6a13c" onLocale={(l) => i18n.changeLanguage(l.language)} />
