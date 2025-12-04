export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
}
