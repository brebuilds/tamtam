import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Edit2, Trash2, Reply } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface CommentSectionProps {
  commentableType: "post" | "document" | "training_material";
  commentableId: string;
}

export function CommentSection({ commentableType, commentableId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const utils = trpc.useUtils();
  
  const { data: comments = [], isLoading } = trpc.comments.list.useQuery({
    commentableType,
    commentableId,
  });

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate();
      setNewComment("");
      setReplyTo(null);
      toast.success("Comment posted!");
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  const updateComment = trpc.comments.update.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate();
      setEditingId(null);
      setEditContent("");
      toast.success("Comment updated!");
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate();
      toast.success("Comment deleted!");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    createComment.mutate({
      commentableType,
      commentableId,
      content: newComment,
      parentCommentId: replyTo || undefined,
    });
  };

  const handleEdit = (commentId: string) => {
    updateComment.mutate({
      id: commentId,
      content: editContent,
    });
  };

  const handleDelete = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteComment.mutate({ id: commentId });
    }
  };

  // Organize comments into threads
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  
  const getReplies = (commentId: string) => {
    return comments.filter(c => c.parent_comment_id === commentId);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: any; isReply?: boolean }) => {
    const isEditing = editingId === comment.id;
    const replies = getReplies(comment.id);

    return (
      <div className={`${isReply ? "ml-8 mt-4" : "mt-4"}`}>
        <Card className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {comment.author_id?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <span className="font-medium text-foreground">User</span>
                <span>•</span>
                <span>
                  {comment.created_at && formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {comment.is_edited && <span className="text-xs">(edited)</span>}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEdit(comment.id)}>
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyTo(comment.id)}
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Reply form */}
        {replyTo === comment.id && (
          <div className="ml-8 mt-3">
            <Card className="p-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a reply..."
                className="min-h-[80px] mb-2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmit}>
                  <Send className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyTo(null);
                    setNewComment("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Nested replies */}
        {replies.map(reply => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* New comment form (only show if not replying) */}
      {!replyTo && (
        <Card className="p-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[100px] mb-3"
          />
          <Button onClick={handleSubmit} disabled={!newComment.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Post Comment
          </Button>
        </Card>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {topLevelComments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          topLevelComments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>
    </div>
  );
}

