import { Profile } from './profile.model';

export interface Server {
  slug: string;
  title: string;
  description: string;
  body: string;
  file: File;
  createdAt: string;
  updatedAt: string;
  author: Profile;
  active: boolean;
  token: string;
  url: string;
}
