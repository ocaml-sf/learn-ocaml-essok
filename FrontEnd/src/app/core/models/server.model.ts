import { Profile } from './profile.model';

export interface Server {
  slug: string;
  title: string;
  description: string;
  body: string; //la vue
  file: File;
  createdAt: string;
  updatedAt: string;
  author: Profile;
}
