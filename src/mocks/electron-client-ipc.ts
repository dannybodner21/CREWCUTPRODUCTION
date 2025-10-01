// Mock for @lobechat/electron-client-ipc
// This is used when electron functionality is stripped out

export type StorageMode = 'local' | 'cloud' | 'selfHost';

export enum StorageModeEnum {
    Cloud = 'cloud',
    Local = 'local',
    SelfHost = 'selfHost',
}

export interface DataSyncConfig {
    active?: boolean;
    remoteServerUrl?: string;
    storageMode: StorageMode;
}

// Mock dispatch function
export const dispatch = async (action: string, ...args: any[]) => {
    console.warn(`Electron dispatch called with action: ${action}`, args);
    return Promise.resolve();
};

// Mock other commonly used exports
export const streamInvoke = async (action: string, ...args: any[]) => {
    console.warn(`Electron streamInvoke called with action: ${action}`, args);
    return Promise.resolve();
};

// Mock types that might be imported
export type ProxyTRPCRequestParams = any;
export type DesktopNotificationResult = any;
export type ShowDesktopNotificationParams = any;
export type ListLocalFileParams = any;
export type LocalFileItem = any;
export type LocalMoveFilesResultItem = any;
export type NetworkProxySettings = any;
export type ShortcutUpdateResult = any;
export type ElectronAppState = any;

// Additional types found in the error logs
export type ProgressInfo = any;
export type UpdateInfo = any;
export type LocalReadFileParams = any;
export type LocalReadFileResult = any;
export type RenameLocalFileParams = any;
export type RunCommandParams = any;
export type LocalSearchFilesParams = any;
export type WriteLocalFileParams = any;

// Mock useWatchBroadcast hook
export const useWatchBroadcast = (channel: string, callback: (data: any) => void) => {
    // No-op for web version
    return null;
};
