import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CommentSection } from "@/components/CommentSection";
import {
  Newspaper,
  TrendingUp,
  Wrench,
  Megaphone,
  Search,
  ThumbsUp,
  MessageSquare,
  Eye,
  Pin,
  Plus,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function NewsFeed() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    setLocation("/login");
    return null;
  }

  // Fetch posts
  const { data: posts = [], isLoading } = trpc.posts.list.useQuery({ limit: 50 });

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || post.type === filterType;
    
    return matchesSearch && matchesType;
  });

  // Separate pinned and regular posts
  const pinnedPosts = filteredPosts.filter(p => p.is_pinned);
  const regularPosts = filteredPosts.filter(p => !p.is_pinned);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Diesel Industry Hub</h1>
            <p className="text-muted-foreground mt-1">
              Latest news, diesel technology updates, and team bulletins
            </p>
          </div>
          <CreatePostDialog />
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="bulletin">Staff Bulletin</SelectItem>
                <SelectItem value="news">Industry News</SelectItem>
                <SelectItem value="diesel_tech">Diesel Tech</SelectItem>
                <SelectItem value="announcement">Announcements</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Pinned Posts */}
        {pinnedPosts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Pin className="h-5 w-5" />
              Pinned Posts
            </h2>
            {pinnedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onViewDetails={() => setSelectedPost(post.id)}
              />
            ))}
          </div>
        )}

        {/* Regular Posts */}
        <div className="space-y-4">
          {pinnedPosts.length > 0 && (
            <h2 className="text-xl font-semibold">Recent Posts</h2>
          )}
          
          {isLoading ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">Loading posts...</p>
            </Card>
          ) : regularPosts.length === 0 ? (
            <Card className="p-8">
              <p className="text-center text-muted-foreground">
                {searchQuery || filterType !== "all" 
                  ? "No posts match your filters"
                  : "No posts yet. Create the first one!"}
              </p>
            </Card>
          ) : (
            regularPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onViewDetails={() => setSelectedPost(post.id)}
              />
            ))
          )}
        </div>

        {/* Post Detail Dialog */}
        {selectedPost && (
          <PostDetailDialog
            postId={selectedPost}
            open={!!selectedPost}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Post Card Component
function PostCard({ post, onViewDetails }: { post: any; onViewDetails: () => void }) {
  const utils = trpc.useUtils();
  
  const toggleReaction = trpc.reactions.toggle.useMutation({
    onSuccess: () => {
      utils.reactions.getCount.invalidate();
    },
  });

  const { data: reactionCount = 0 } = trpc.reactions.getCount.useQuery({
    reactableType: "post",
    reactableId: post.id,
  });

  const handleLike = () => {
    toggleReaction.mutate({
      reactableType: "post",
      reactableId: post.id,
      reactionType: "like",
    });
  };

  const typeConfig = {
    bulletin: { icon: Megaphone, color: "bg-blue-500/10 text-blue-500", label: "Staff Bulletin" },
    news: { icon: Newspaper, color: "bg-purple-500/10 text-purple-500", label: "Industry News" },
    diesel_tech: { icon: Wrench, color: "bg-green-500/10 text-green-500", label: "Diesel Tech" },
    announcement: { icon: TrendingUp, color: "bg-orange-500/10 text-orange-500", label: "Announcement" },
  };

  const config = typeConfig[post.type as keyof typeof typeConfig] || typeConfig.bulletin;
  const Icon = config.icon;

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              {post.is_pinned && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {post.tags && post.tags.length > 0 && post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h3 className="text-xl font-semibold hover:text-primary cursor-pointer" onClick={onViewDetails}>
              {post.title}
            </h3>
            
            {post.excerpt && (
              <p className="text-muted-foreground line-clamp-2">{post.excerpt}</p>
            )}
          </div>

          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-32 h-32 object-cover rounded-lg"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {post.published_at && formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.view_count || 0} views
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLike}>
              <ThumbsUp className="h-4 w-4 mr-1" />
              {reactionCount}
            </Button>
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              <MessageSquare className="h-4 w-4 mr-1" />
              Comment
            </Button>
            {post.external_link && (
              <Button variant="ghost" size="sm" asChild>
                <a href={post.external_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Read More
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Post Detail Dialog
function PostDetailDialog({ postId, open, onClose }: { postId: string; open: boolean; onClose: () => void }) {
  const { data: post } = trpc.posts.getById.useQuery({ id: postId });

  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{post.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}

          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
          </div>

          {post.external_link && (
            <Button variant="outline" asChild className="w-full">
              <a href={post.external_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Read Full Article
              </a>
            </Button>
          )}

          <CommentSection commentableType="post" commentableId={postId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Create Post Dialog
function CreatePostDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"bulletin" | "news" | "diesel_tech" | "announcement">("bulletin");
  const [excerpt, setExcerpt] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const utils = trpc.useUtils();

  const createPost = trpc.posts.create.useMutation({
    onSuccess: () => {
      utils.posts.list.invalidate();
      toast.success("Post created!");
      setOpen(false);
      // Reset form
      setTitle("");
      setContent("");
      setExcerpt("");
      setExternalLink("");
      setIsPinned(false);
    },
    onError: () => {
      toast.error("Failed to create post");
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    createPost.mutate({
      title,
      content,
      type,
      excerpt: excerpt || undefined,
      external_link: externalLink || undefined,
      is_pinned: isPinned,
      is_published: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select value={type} onValueChange={(v: any) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bulletin">Staff Bulletin</SelectItem>
                <SelectItem value="news">Industry News</SelectItem>
                <SelectItem value="diesel_tech">Diesel Technology</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Excerpt (Optional)</label>
            <Input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              className="min-h-[200px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">External Link (Optional)</label>
            <Input
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="pinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
              Pin this post to the top
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Create Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

