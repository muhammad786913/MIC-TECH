/** Index definitions for MongoDB Atlas. No-op cost for the JSON adapter. */

const indexes = {
  users: [
    { keys: { email: 1 }, options: { unique: true, name: "uniq_email" } },
    { keys: { username: 1 }, options: { unique: true, name: "uniq_username" } },
    { keys: { role: 1 }, options: { name: "role" } },
    { keys: { createdAt: -1 }, options: { name: "created_desc" } },
  ],
  articles: [
    { keys: { slug: 1 }, options: { unique: true, name: "uniq_slug" } },
    { keys: { status: 1, publishedAt: -1 }, options: { name: "status_published" } },
    { keys: { status: 1, scheduledAt: 1 }, options: { name: "status_scheduled" } },
    { keys: { categorySlug: 1, status: 1, publishedAt: -1 }, options: { name: "category" } },
    { keys: { tags: 1, status: 1 }, options: { name: "tags" } },
    { keys: { breaking: 1, status: 1 }, options: { name: "breaking" } },
    { keys: { featured: 1, status: 1 }, options: { name: "featured" } },
    { keys: { language: 1, status: 1 }, options: { name: "language" } },
    { keys: { createdAt: -1 }, options: { name: "created_desc" } },
    { keys: { updatedAt: -1 }, options: { name: "updated_desc" } },
  ],
  categories: [
    { keys: { slug: 1 }, options: { unique: true, name: "uniq_slug" } },
    { keys: { order: 1 }, options: { name: "order" } },
  ],
  comments: [
    { keys: { articleId: 1, status: 1, createdAt: -1 }, options: { name: "article_status" } },
    { keys: { status: 1, createdAt: -1 }, options: { name: "status_created" } },
    { keys: { userId: 1, createdAt: -1 }, options: { name: "user_created" } },
    { keys: { parentId: 1 }, options: { name: "parent" } },
  ],
  likes: [
    { keys: { userId: 1, articleId: 1 }, options: { unique: true, name: "uniq_user_article" } },
    { keys: { articleId: 1 }, options: { name: "article" } },
    { keys: { createdAt: -1 }, options: { name: "created_desc" } },
  ],
  bookmarks: [
    { keys: { userId: 1, articleId: 1 }, options: { unique: true, name: "uniq_user_article" } },
    { keys: { userId: 1, createdAt: -1 }, options: { name: "user_created" } },
    { keys: { articleId: 1 }, options: { name: "article" } },
  ],
  analyticsEvents: [
    { keys: { createdAt: -1 }, options: { name: "created_desc" } },
    { keys: { type: 1, createdAt: -1 }, options: { name: "type_created" } },
    { keys: { articleId: 1, type: 1, createdAt: -1 }, options: { name: "article_type_created" } },
    { keys: { visitorId: 1, createdAt: -1 }, options: { name: "visitor_created" } },
    { keys: { path: 1, createdAt: -1 }, options: { name: "path_created" } },
  ],
  media: [
    { keys: { createdAt: -1 }, options: { name: "created_desc" } },
    { keys: { publicId: 1 }, options: { name: "public_id" } },
    { keys: { url: 1 }, options: { name: "url" } },
  ],
  auditLogs: [
    { keys: { createdAt: -1 }, options: { name: "created_desc" } },
    { keys: { actorId: 1, createdAt: -1 }, options: { name: "actor_created" } },
    { keys: { action: 1, createdAt: -1 }, options: { name: "action_created" } },
  ],
  newsletterSubscribers: [
    { keys: { email: 1 }, options: { unique: true, name: "uniq_email" } },
    { keys: { createdAt: -1 }, options: { name: "created_desc" } },
  ],
  reports: [
    { keys: { status: 1, createdAt: -1 }, options: { name: "status_created" } },
    { keys: { targetId: 1 }, options: { name: "target" } },
  ],
  notifications: [
    { keys: { userId: 1, readAt: 1, createdAt: -1 }, options: { name: "user_read" } },
  ],
  settings: [],
};

export async function ensureIndexes(store) {
  for (const [name, definitions] of Object.entries(indexes)) {
    for (const definition of definitions) {
      try {
        await store.collection(name).createIndex(definition.keys, definition.options);
      } catch (error) {
        // A duplicate/legacy index must not stop the application from booting.
        console.warn(`[db] index warning ${name}: ${error?.message || error}`);
      }
    }
  }
  return true;
}
