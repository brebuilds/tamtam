# Diesel Industry Hub - Implementation Guide

## 🎉 Transformation Complete!

Your inventory management system has been successfully transformed into a comprehensive **Diesel Industry Hub** with three main modules:

1. **News Feed & Bulletin Board** (Home Page)
2. **Parts Database** (Searchable diesel parts inventory)
3. **Knowledge Hub & Training Center** (Documents, videos, FAQs)

---

## 🏗️ What's New

### New Database Tables

The following tables have been added to support the new features:

#### **posts** - News Feed & Bulletin Board
- Stores staff bulletins, industry news, diesel tech updates, and announcements
- Fields: title, content, type, excerpt, featured_image, external_link, tags
- Supports pinning important posts to the top
- Tracks views and engagement

#### **documents** - Knowledge Hub Resources
- Stores training videos, equipment manuals, safety guidelines, FAQs
- Fields: title, description, category, file_url, video info, thumbnail
- Supports YouTube, Vimeo, and self-hosted videos
- Tracks views and downloads
- Employees can upload their own documents

#### **comments** - Universal Commenting System
- Threaded comments on posts and documents
- Polymorphic design (works with any content type)
- Fields: content, commentable_type, commentable_id, parent_comment_id
- Supports replies and nested discussions
- Edit and soft-delete functionality

#### **reactions** - Likes & Engagement
- Like/helpful reactions on posts, comments, and documents
- Toggle functionality (like/unlike)
- Tracks engagement metrics

---

## 📱 New Pages & Features

### 1. News Feed (Home Page) - `/`

**Location:** `client/src/pages/NewsFeed.tsx`

**Features:**
- View all staff bulletins, industry news, diesel tech updates
- Filter by post type (bulletin, news, diesel_tech, announcement)
- Search posts by title or content
- Pinned posts appear at the top
- Create new posts with rich content
- Add images, external links, and tags
- Comment and like posts
- View counts for each post

**Usage:**
- Click "Create Post" to add news or bulletins
- Click on any post title to view full details
- Use filters to find specific types of posts
- Pin important announcements to keep them visible

### 2. Parts Database - `/products`

**Location:** `client/src/pages/ProductManagement.tsx` (existing, now diesel-focused)

**Features:**
- Searchable inventory of diesel parts
- Quick search by part number
- Advanced product management
- Stock tracking and alerts
- Purchase order integration

**Usage:**
- Search for parts by number or name
- View detailed specifications
- Track stock levels
- Create purchase orders when needed

### 3. Knowledge Hub - `/knowledge-hub`

**Location:** `client/src/pages/KnowledgeHub.tsx`

**Features:**
- Six categories of resources:
  - 🎥 Training Videos (testing, building, understanding equipment)
  - 📄 Equipment Manuals (shop equipment operation)
  - 🛡️ Safety Guidelines (safety protocols)
  - 📦 Inventory Guides (how-to documentation)
  - ❓ FAQs (frequently asked questions)
  - 📁 General Resources
- Upload documents and training materials
- Embed YouTube/Vimeo videos
- Comment and discuss resources
- Track views and downloads

**Usage:**
- Browse by category tabs
- Click "Upload Resource" to add documents
- For videos: paste YouTube/Vimeo video ID
- For documents: provide URL to cloud storage (Google Drive, Dropbox, etc.)
- Comment on resources to ask questions or share insights

---

## 🎨 Component Highlights

### CommentSection Component

**Location:** `client/src/components/CommentSection.tsx`

A reusable component for adding threaded comments to any content type.

**Props:**
- `commentableType`: "post" | "document" | "training_material"
- `commentableId`: The ID of the item being commented on

**Features:**
- Threaded replies (comment on comments)
- Edit and delete own comments
- Real-time updates
- Nested conversation view

**Usage:**
```tsx
<CommentSection 
  commentableType="post" 
  commentableId={postId} 
/>
```

---

## 🔌 API Endpoints (tRPC)

### Posts API

```typescript
// Fetch all posts
trpc.posts.list.useQuery({ limit: 50 })

// Get specific post
trpc.posts.getById.useQuery({ id: postId })

// Create new post
trpc.posts.create.useMutation({
  title, content, type, excerpt, featured_image, 
  external_link, tags, is_pinned, is_published
})

// Update post
trpc.posts.update.useMutation({ id, ...updates })

// Delete post (soft delete by unpublishing)
trpc.posts.delete.useMutation({ id })

// Search posts
trpc.posts.search.useQuery({ query, limit })
```

### Documents API

```typescript
// Fetch all documents
trpc.documents.list.useQuery({ limit: 100 })

// Get by category
trpc.documents.getByCategory.useQuery({ 
  category: "training_video" | "equipment_manual" | etc
})

// Get specific document
trpc.documents.getById.useQuery({ id: documentId })

// Create document
trpc.documents.create.useMutation({
  title, description, category, file_url, 
  video_platform, video_id, tags
})

// Update document
trpc.documents.update.useMutation({ id, ...updates })

// Delete document
trpc.documents.delete.useMutation({ id })

// Track downloads
trpc.documents.incrementDownload.useMutation({ id })
```

### Comments API

```typescript
// Get all comments for an item
trpc.comments.list.useQuery({
  commentableType: "post" | "document",
  commentableId: id
})

// Create comment
trpc.comments.create.useMutation({
  commentableType, commentableId, content,
  parentCommentId // optional, for replies
})

// Update comment
trpc.comments.update.useMutation({ id, content })

// Delete comment (soft delete)
trpc.comments.delete.useMutation({ id })
```

### Reactions API

```typescript
// Get reaction count
trpc.reactions.getCount.useQuery({
  reactableType: "post" | "document" | "comment",
  reactableId: id
})

// Check if user has reacted
trpc.reactions.getUserReaction.useQuery({
  reactableType, reactableId, userId
})

// Toggle reaction (like/unlike)
trpc.reactions.toggle.useMutation({
  reactableType, reactableId,
  reactionType: "like" | "helpful"
})
```

---

## 🗺️ Navigation Structure

The sidebar navigation has been updated to reflect the new three-part structure:

1. **🏠 News Feed** - Home page with bulletins and industry news
2. **🗄️ Parts Database** - Diesel parts inventory
3. **📚 Knowledge Hub** - Training center and documentation
4. **📦 Stock Management** - Inventory control
5. **🛒 Purchase Orders** - PO workflow
6. **📊 Analytics** - Reports and insights
7. **👥 User Management** - Role and permission management
8. **📤 Data Export** - Export data as CSV/JSON

---

## 🚀 Getting Started

### 1. Database Setup

Run the database migration to create the new tables:

```bash
pnpm run db:push
```

This will create:
- `posts` table
- `documents` table
- `comments` table
- `reactions` table

### 2. Seed Initial Content

You can manually create some initial posts and documents through the UI:

**Create a Welcome Post:**
1. Navigate to `/` (News Feed)
2. Click "Create Post"
3. Select type: "Announcement"
4. Add title: "Welcome to Diesel Industry Hub!"
5. Write content about the new platform
6. Check "Pin this post to the top"
7. Click "Create Post"

**Upload First Training Resource:**
1. Navigate to `/knowledge-hub`
2. Click "Upload Resource"
3. Select category (e.g., "Training Video")
4. Add title and description
5. For YouTube video: paste video ID from URL
6. Click "Upload"

### 3. Configure Environment

Make sure your `.env` file has the database connection:

```env
DATABASE_URL=your_postgres_connection_string
```

### 4. Start the Application

```bash
pnpm run dev
```

The application will be available at `http://localhost:5000`

---

## 📝 Content Management Tips

### Creating Engaging Posts

**Staff Bulletins:**
- Keep it concise and actionable
- Use bullet points for clarity
- Pin important announcements

**Industry News:**
- Include external links to full articles
- Add a featured image when possible
- Use tags: #diesel, #technology, #innovation
- Write a compelling excerpt

**Diesel Tech Updates:**
- Share cool technologies and innovations
- Include images or diagrams
- Link to manufacturer sites

### Uploading Training Materials

**Training Videos:**
- Use descriptive titles: "How to Operate XYZ Equipment"
- Write detailed descriptions
- Add duration if known
- Use YouTube for easy embedding
- Tag by equipment type or skill level

**Equipment Manuals:**
- Upload PDFs to cloud storage (Google Drive)
- Get shareable link
- Include equipment model in title
- Add tags for searchability

**Safety Guidelines:**
- Make sure content is up-to-date
- Use clear, numbered steps
- Pin critical safety docs
- Review and update regularly

### Organizing the Knowledge Hub

**Category Guidelines:**
- **Training Videos** - How-to videos, demonstrations
- **Equipment Manuals** - Manufacturer docs, user guides
- **Safety Guidelines** - Safety protocols, OSHA requirements
- **Inventory Guides** - How to use inventory system
- **FAQs** - Common questions and answers
- **General** - Everything else

---

## 🎯 User Roles & Permissions

The existing role system continues to work:

- **Admin** - Full access, can create/edit/delete everything
- **Manager** - Can create posts, upload documents, manage inventory
- **Shop Floor** - Can view, comment, upload documents
- **Sales** - Can view posts and documents, search inventory
- **Read-Only** - Can view content only

---

## 💡 Best Practices

### For Admins

1. **Regularly Update Content**
   - Post industry news weekly
   - Update safety guidelines as regulations change
   - Archive outdated documents

2. **Encourage Participation**
   - Pin posts asking for input
   - Respond to comments
   - Highlight useful employee contributions

3. **Organize Documents**
   - Use consistent naming conventions
   - Keep categories organized
   - Remove duplicate or outdated materials

### For Employees

1. **Stay Informed**
   - Check news feed daily for updates
   - Read pinned announcements
   - Subscribe to relevant tags

2. **Share Knowledge**
   - Upload helpful documents you create
   - Comment on posts with insights
   - Ask questions in comments

3. **Use Resources**
   - Watch training videos before operating equipment
   - Refer to manuals when needed
   - Contribute to FAQs

---

## 🔧 Customization

### Adding More Post Types

Edit `drizzle/schema.ts`:

```typescript
export const postTypeEnum = pgEnum("post_type", [
  "bulletin", 
  "news", 
  "diesel_tech", 
  "announcement",
  "your_new_type" // Add here
]);
```

Then update the UI dropdowns in `NewsFeed.tsx`.

### Adding More Document Categories

Edit `drizzle/schema.ts`:

```typescript
export const documentCategoryEnum = pgEnum("document_category", [
  "training_video",
  "equipment_manual",
  "safety_guideline",
  "inventory_guide",
  "faq",
  "general",
  "your_new_category" // Add here
]);
```

Then update the category tabs in `KnowledgeHub.tsx`.

---

## 📊 Analytics & Reporting

The system tracks:
- Post view counts
- Document view and download counts
- Comment engagement
- Reaction counts

Future enhancements could include:
- Most viewed content
- Most active users
- Popular tags
- Engagement trends

---

## 🐛 Troubleshooting

### Posts Not Showing

- Check that posts are published (`is_published: true`)
- Verify user is authenticated
- Check database connection

### Comments Not Appearing

- Ensure comments are not soft-deleted
- Check `commentable_type` and `commentable_id` match
- Verify user has permission to view

### Videos Not Playing

- Verify YouTube/Vimeo video ID is correct
- Check video is public (not private)
- Ensure embed permissions are enabled

### Upload Errors

- Verify file URLs are accessible
- Check cloud storage sharing settings
- Ensure links are direct links (not preview links)

---

## 🎉 Success!

Your Diesel Industry Hub is now ready! The system provides:

✅ A social news feed for team communication
✅ Comprehensive parts database for diesel inventory
✅ Training center for knowledge sharing and documentation
✅ Universal commenting for collaboration
✅ Engagement tracking for insights

**Next Steps:**
1. Migrate your diesel parts data when you receive it
2. Start posting industry news and team updates
3. Upload training videos and equipment manuals
4. Encourage team to engage with comments and reactions

---

## 📞 Support

For questions or issues:
1. Check this guide
2. Review the main [README.md](README.md)
3. Check deployment guides in the repo

**Happy collaborating! 🚛⚙️**

