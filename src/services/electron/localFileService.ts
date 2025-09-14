// Conditional import for Electron modules
let ListLocalFileParams: any, LocalFileItem: any, LocalMoveFilesResultItem: any, LocalReadFileParams: any, LocalReadFileResult: any, LocalReadFilesParams: any, LocalSearchFilesParams: any, MoveLocalFilesParams: any, OpenLocalFileParams: any, OpenLocalFolderParams: any, RenameLocalFileParams: any, WriteLocalFileParams: any, dispatch: any;
if (typeof window !== 'undefined' && (window as any).electronAPI) {
  try {
    const electronModule = require('@lobechat/electron-client-ipc');
    ListLocalFileParams = electronModule.ListLocalFileParams;
    LocalFileItem = electronModule.LocalFileItem;
    LocalMoveFilesResultItem = electronModule.LocalMoveFilesResultItem;
    LocalReadFileParams = electronModule.LocalReadFileParams;
    LocalReadFileResult = electronModule.LocalReadFileResult;
    LocalReadFilesParams = electronModule.LocalReadFilesParams;
    LocalSearchFilesParams = electronModule.LocalSearchFilesParams;
    MoveLocalFilesParams = electronModule.MoveLocalFilesParams;
    OpenLocalFileParams = electronModule.OpenLocalFileParams;
    OpenLocalFolderParams = electronModule.OpenLocalFolderParams;
    RenameLocalFileParams = electronModule.RenameLocalFileParams;
    WriteLocalFileParams = electronModule.WriteLocalFileParams;
    dispatch = electronModule.dispatch;
  } catch (error) {
    console.warn('Electron module not available:', error);
  }
}

class LocalFileService {
  async listLocalFiles(params: ListLocalFileParams): Promise<LocalFileItem[]> {
    return dispatch('listLocalFiles', params);
  }

  async readLocalFile(params: LocalReadFileParams): Promise<LocalReadFileResult> {
    return dispatch('readLocalFile', params);
  }

  async readLocalFiles(params: LocalReadFilesParams): Promise<LocalReadFileResult[]> {
    return dispatch('readLocalFiles', params);
  }

  async searchLocalFiles(params: LocalSearchFilesParams): Promise<LocalFileItem[]> {
    return dispatch('searchLocalFiles', params);
  }

  async openLocalFile(params: OpenLocalFileParams) {
    return dispatch('openLocalFile', params);
  }

  async openLocalFolder(params: OpenLocalFolderParams) {
    return dispatch('openLocalFolder', params);
  }

  async moveLocalFiles(params: MoveLocalFilesParams): Promise<LocalMoveFilesResultItem[]> {
    return dispatch('moveLocalFiles', params);
  }

  async renameLocalFile(params: RenameLocalFileParams) {
    return dispatch('renameLocalFile', params);
  }

  async writeFile(params: WriteLocalFileParams) {
    return dispatch('writeLocalFile', params);
  }

  async openLocalFileOrFolder(path: string, isDirectory: boolean) {
    if (isDirectory) {
      return this.openLocalFolder({ isDirectory, path });
    } else {
      return this.openLocalFile({ path });
    }
  }
}

export const localFileService = new LocalFileService();
