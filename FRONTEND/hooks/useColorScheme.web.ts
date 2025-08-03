import { useEffect, useState } from 'react';
import { useColorscheme as useRNColorscheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorscheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const Colorscheme = useRNColorscheme();

  if (hasHydrated) {
    return Colorscheme;
  }

  return 'light';
}
