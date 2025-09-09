import { useState, useEffect } from 'react';

const useExternalScripts = (urls) => {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    const loadScripts = async () => {
      try {
        const promises = urls.map(url => {
          return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) return resolve();
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.body.appendChild(script);
          });
        });
        await Promise.all(promises);
        if (isMounted) setLoaded(true);
      } catch (error) {
        console.error(error);
        if (isMounted) setLoaded(false);
      }
    };
    loadScripts();
    return () => { isMounted = false; };
  }, [JSON.stringify(urls)]);
  
  return loaded;
};

export default useExternalScripts;