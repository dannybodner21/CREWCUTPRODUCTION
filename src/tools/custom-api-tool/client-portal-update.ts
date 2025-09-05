'use client';

/**
 * Client-side function to update the portal with project data
 * This runs in the browser and can access localStorage and dispatch events
 */
export function updatePortalWithProjectData(projectData: {
    jurisdictionName?: string;
    projectType?: string;
    projectUnits?: number;
    projectAcreage?: number;
    meterSize?: string;
    squareFootage?: number;
    projectValue?: number;
}) {
    console.log('🔧 CLIENT: Updating portal with project data:', projectData);

    // Store the project data in localStorage
    const portalState = {
        lewisProjectData: projectData,
        lastUpdated: new Date().toISOString(),
        source: 'lewis-chat-tool'
    };

    localStorage.setItem('lewis-portal-state', JSON.stringify(portalState));

    // Dispatch event to notify portal
    window.dispatchEvent(new CustomEvent('lewis-portal-update', {
        detail: portalState
    }));

    console.log('🔧 CLIENT: Portal update completed');
}
