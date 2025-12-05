export interface Folder {
  id: string;
  gameId: string;
  name: string;
  folderType: string;
  parentId?: string | null;
  color?: string | null;
  sort: number;
  data: Record<string, unknown>;
  createdAt: Date;
}

export interface Journal {
  id: string;
  gameId: string;
  name: string;
  img?: string | null;
  folderId?: string | null;
  permission: string;
  ownerId?: string | null;
  sort: number;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalPage {
  id: string;
  journalId: string;
  name: string;
  pageType: string;
  content?: string | null;
  src?: string | null;
  sort: number;
  showInNavigation: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderRequest {
  gameId: string;
  name: string;
  folderType: string;
  parentId?: string | null;
  color?: string | null;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface UpdateFolderRequest {
  name?: string;
  folderType?: string;
  parentId?: string | null;
  color?: string | null;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface CreateJournalRequest {
  gameId: string;
  name: string;
  img?: string | null;
  folderId?: string | null;
  permission?: string;
  ownerId?: string | null;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface UpdateJournalRequest {
  name?: string;
  img?: string | null;
  folderId?: string | null;
  permission?: string;
  ownerId?: string | null;
  sort?: number;
  data?: Record<string, unknown>;
}

export interface CreateJournalPageRequest {
  journalId: string;
  name: string;
  pageType?: string;
  content?: string | null;
  src?: string | null;
  sort?: number;
  showInNavigation?: boolean;
  data?: Record<string, unknown>;
}

export interface UpdateJournalPageRequest {
  name?: string;
  pageType?: string;
  content?: string | null;
  src?: string | null;
  sort?: number;
  showInNavigation?: boolean;
  data?: Record<string, unknown>;
}

export interface FolderResponse {
  folder: Folder;
}

export interface FoldersListResponse {
  folders: Folder[];
}

export interface JournalResponse {
  journal: Journal;
}

export interface JournalsListResponse {
  journals: Journal[];
}

export interface JournalPageResponse {
  journalPage: JournalPage;
}

export interface JournalPagesListResponse {
  journalPages: JournalPage[];
}
