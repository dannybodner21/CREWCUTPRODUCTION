'use client';

import { useLewisPortalAutoOpen } from '@/hooks/useLewisPortalAutoOpen';

/**
 * Client component that automatically opens the Construction Portal for Lewis sessions
 * This component doesn't render anything, it just runs the hook logic
 */
const LewisPortalAutoOpener = () => {
    useLewisPortalAutoOpen();

    // This component doesn't render anything
    return null;
};

export default LewisPortalAutoOpener;
