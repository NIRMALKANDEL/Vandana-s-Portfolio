import type { CategoryId } from "./site";

export type PostStatus = "draft" | "scheduled" | "published";

export type Post = {
  id: string;
  slug: string;
  title: string;
  category: CategoryId;
  excerpt: string;
  body: string;
  status: PostStatus;
  publishAt: string | null; // ISO; when it goes (or went) live
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
  coverImage?: string | null;
  sample?: boolean; // demo content shown only when no database is configured
};

export type PostInput = Partial<Pick<Post, "title" | "category" | "excerpt" | "body" | "featured" | "coverImage">> & {
  status?: PostStatus;
  publishAt?: string | null;
};
