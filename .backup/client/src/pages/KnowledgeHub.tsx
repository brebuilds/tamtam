import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommentSection } from "@/components/CommentSection";
import {
  Video,
  FileText,
  Shield,
  PackageSearch,
  HelpCircle,
  Upload,
  Download,
  Eye,
  Search,
  Plus,
  Play,
  File,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type DocumentCategory = "training_video" | "equipment_manual" | "safety_guideline" | "inventory_guide" | "faq" | "general";

export default function KnowledgeHub() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    setLocation("/login");
    return null;
  }

  // Fetch documents
  const { data: documents = [], isLoading } = trpc.documents.list.useQuery({ limit: 100 });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchQuery === "" || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof documents>);

  const categories = [
    { value: "training_video", label: "Training Videos", icon: Video, color: "text-red-500" },
    { value: "equipment_manual", label: "Equipment Manuals", icon: FileText, color: "text-blue-500" },
    { value: "safety_guideline", label: "Safety Guidelines", icon: Shield, color: "text-yellow-500" },
    { value: "inventory_guide", label: "Inventory Guides", icon: PackageSearch, color: "text-green-500" },
    { value: "faq", label: "FAQs", icon: HelpCircle, color: "text-purple-500" },
    { value: "general", label: "General Resources", icon: File, color: "text-gray-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Knowledge Hub & Training Center</h1>
            <p className="text-muted-foreground mt-1">
              Training materials, equipment guides, safety docs, and FAQs
            </p>
          </div>
          <UploadDocumentDialog />
        </div>

        {/* Search and Filter */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents and resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto gap-2">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              All
            </TabsTrigger>
            {categories.map(cat => {
              const Icon = cat.icon;
              const count = groupedDocuments[cat.value]?.length || 0;
              return (
                <TabsTrigger key={cat.value} value={cat.value} className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${cat.color}`} />
                  <span className="hidden md:inline">{cat.label}</span>
                  <Badge variant="secondary" className="ml-1">{count}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            {categories.map(cat => {
              const docs = groupedDocuments[cat.value] || [];
              if (docs.length === 0) return null;
              
              return (
                <div key={cat.value} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <cat.icon className={`h-5 w-5 ${cat.color}`} />
                    <h2 className="text-xl font-semibold">{cat.label}</h2>
                    <Badge variant="secondary">{docs.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {docs.map(doc => (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        onViewDetails={() => setSelectedDocument(doc.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            
            {isLoading && (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">Loading documents...</p>
              </Card>
            )}
            
            {!isLoading && filteredDocuments.length === 0 && (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">
                  {searchQuery ? "No documents match your search" : "No documents yet. Upload the first one!"}
                </p>
              </Card>
            )}
          </TabsContent>

          {categories.map(cat => (
            <TabsContent key={cat.value} value={cat.value} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(groupedDocuments[cat.value] || []).map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onViewDetails={() => setSelectedDocument(doc.id)}
                  />
                ))}
              </div>
              
              {(groupedDocuments[cat.value] || []).length === 0 && (
                <Card className="p-8">
                  <p className="text-center text-muted-foreground">
                    No {cat.label.toLowerCase()} available yet.
                  </p>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Document Detail Dialog */}
        {selectedDocument && (
          <DocumentDetailDialog
            documentId={selectedDocument}
            open={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Document Card Component
function DocumentCard({ document, onViewDetails }: { document: any; onViewDetails: () => void }) {
  const utils = trpc.useUtils();
  
  const incrementDownload = trpc.documents.incrementDownload.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
    },
  });

  const handleDownload = () => {
    if (document.file_url) {
      incrementDownload.mutate({ id: document.id });
      window.open(document.file_url, "_blank");
    }
  };

  const isVideo = document.category === "training_video" || 
                  document.file_type?.includes("video") ||
                  document.video_platform;

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        {/* Thumbnail/Preview */}
        {document.thumbnail_url ? (
          <div className="relative">
            <img
              src={document.thumbnail_url}
              alt={document.title}
              className="w-full h-40 object-cover rounded-lg"
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-6 w-6 text-gray-900 ml-1" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center">
            {isVideo ? (
              <Video className="h-12 w-12 text-muted-foreground" />
            ) : (
              <FileText className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2 hover:text-primary cursor-pointer" onClick={onViewDetails}>
            {document.title}
          </h3>
          
          {document.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {document.description}
            </p>
          )}

          {document.duration && (
            <p className="text-xs text-muted-foreground">
              Duration: {Math.floor(document.duration / 60)}:{String(document.duration % 60).padStart(2, '0')} min
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {document.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {document.download_count || 0}
            </span>
          </div>
          
          <div className="flex gap-1">
            {document.file_url && (
              <Button size="sm" variant="ghost" onClick={handleDownload}>
                <Download className="h-3 w-3" />
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onViewDetails}>
              <Eye className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Document Detail Dialog
function DocumentDetailDialog({ documentId, open, onClose }: { documentId: string; open: boolean; onClose: () => void }) {
  const { data: document } = trpc.documents.getById.useQuery({ id: documentId });
  const utils = trpc.useUtils();

  const incrementDownload = trpc.documents.incrementDownload.useMutation({
    onSuccess: () => {
      utils.documents.getById.invalidate({ id: documentId });
    },
  });

  const handleDownload = () => {
    if (document?.file_url) {
      incrementDownload.mutate({ id: documentId });
      window.open(document.file_url, "_blank");
    }
  };

  if (!document) return null;

  const isVideo = document.category === "training_video" || 
                  document.file_type?.includes("video") ||
                  document.video_platform;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{document.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Video Player or Thumbnail */}
          {isVideo && document.video_platform === "youtube" && document.video_id ? (
            <div className="aspect-video">
              <iframe
                className="w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${document.video_id}`}
                title={document.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : document.thumbnail_url ? (
            <img
              src={document.thumbnail_url}
              alt={document.title}
              className="w-full max-h-96 object-cover rounded-lg"
            />
          ) : null}

          {/* Description */}
          {document.description && (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p>{document.description}</p>
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Views</p>
              <p className="font-semibold">{document.view_count || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Downloads</p>
              <p className="font-semibold">{document.download_count || 0}</p>
            </div>
            {document.duration && (
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-semibold">
                  {Math.floor(document.duration / 60)}:{String(document.duration % 60).padStart(2, '0')}
                </p>
              </div>
            )}
            {document.file_size && (
              <div>
                <p className="text-muted-foreground">File Size</p>
                <p className="font-semibold">
                  {(document.file_size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {document.file_url && !isVideo && (
            <Button onClick={handleDownload} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Document
            </Button>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {document.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Comments */}
          <CommentSection commentableType="document" commentableId={documentId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Upload Document Dialog
function UploadDocumentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("general");
  const [fileUrl, setFileUrl] = useState("");
  const [videoPlatform, setVideoPlatform] = useState("");
  const [videoId, setVideoId] = useState("");

  const utils = trpc.useUtils();

  const createDocument = trpc.documents.create.useMutation({
    onSuccess: () => {
      utils.documents.list.invalidate();
      toast.success("Document uploaded!");
      setOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("general");
      setFileUrl("");
      setVideoPlatform("");
      setVideoId("");
    },
    onError: () => {
      toast.error("Failed to upload document");
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    createDocument.mutate({
      title,
      description: description || undefined,
      category,
      file_url: fileUrl || undefined,
      video_platform: videoPlatform || undefined,
      video_id: videoId || undefined,
      is_public: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document or Training Material</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="training_video">Training Video</SelectItem>
                <SelectItem value="equipment_manual">Equipment Manual</SelectItem>
                <SelectItem value="safety_guideline">Safety Guideline</SelectItem>
                <SelectItem value="inventory_guide">Inventory Guide</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
                <SelectItem value="general">General Resource</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title..."
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the document..."
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">File URL</label>
            <Input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Link to document on cloud storage (Google Drive, Dropbox, etc.)
            </p>
          </div>

          {category === "training_video" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Video Platform</label>
                <Select value={videoPlatform} onValueChange={setVideoPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="vimeo">Vimeo</SelectItem>
                    <SelectItem value="self-hosted">Self-hosted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {videoPlatform && videoPlatform !== "self-hosted" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Video ID</label>
                  <Input
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    placeholder="Video ID from URL"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., for YouTube: https://youtube.com/watch?v=<strong>VIDEO_ID</strong>
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

