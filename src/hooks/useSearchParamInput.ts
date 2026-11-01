import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const SYNC_DELAY_MS = 200;

/**
 * State for a text input that is mirrored to a URL parameter.
 *
 * The input is driven by local state rather than directly by the URL. React Router applies
 * URL updates in a transition, and a controlled input updated that way can drop characters
 * during fast typing. The URL follows shortly after, so views stay shareable, and outside
 * changes such as a Clear button or the back button still flow into the input.
 */
export function useSearchParamInput(key: string): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const urlValue = params.get(key) ?? '';
  const [value, setValue] = useState(urlValue);

  const lastSynced = useRef(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const setParamsRef = useRef(setParams);
  setParamsRef.current = setParams;

  useEffect(() => {
    if (urlValue !== lastSynced.current) {
      lastSynced.current = urlValue;
      setValue(urlValue);
    }
  }, [urlValue]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const update = useCallback(
    (next: string) => {
      setValue(next);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        lastSynced.current = next;
        setParamsRef.current(
          (current) => {
            const nextParams = new URLSearchParams(current);
            if (next) nextParams.set(key, next);
            else nextParams.delete(key);
            return nextParams;
          },
          { replace: true },
        );
      }, SYNC_DELAY_MS);
    },
    [key],
  );

  return [value, update];
}
