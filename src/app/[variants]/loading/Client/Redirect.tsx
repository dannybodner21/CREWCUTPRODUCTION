'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useUserStore } from '@/store/user';

import { AppLoadingStage } from '../stage';

interface RedirectProps {
  setActiveStage: (value: AppLoadingStage) => void;
}

const Redirect = memo<RedirectProps>(({ setActiveStage }) => {
  const router = useRouter();
  const isUserStateInit = useUserStore((s) => s.isUserStateInit);

  const isPgliteNotEnabled = useGlobalStore(systemStatusSelectors.isPgliteNotEnabled);

  const navToHome = () => {
    setActiveStage(AppLoadingStage.GoToChat);
    router.replace('/home');
  };

  useEffect(() => {
    // if pglite is not enabled, redirect to home
    if (isPgliteNotEnabled) {
      navToHome();
      return;
    }

    // if user state not init, wait for loading
    if (!isUserStateInit) {
      setActiveStage(AppLoadingStage.InitUser);
      return;
    }

    // finally check the conversation status
    navToHome();
  }, [isUserStateInit, isPgliteNotEnabled]);

  return null;
});

export default Redirect;
