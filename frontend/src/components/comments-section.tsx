"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MoreVertical, Reply, ThumbsUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentAuthor {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: CommentAuthor;
  likes: string[];
  replies: Comment[];
  isDeleted: boolean;
  createdAt: string;
}

export function CommentsSection({ postId }: { postId: string }) {
  const { user, isAuthenticated } = useAuthStore();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [replyContent, setReplyContent] = React.useState("");

  const fetchComments = React.useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/comments/${postId}`);
      if (data.success) {
        setComments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch comments", error);
    }
  }, [postId]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }

    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await apiClient.post(`/comments/${postId}`, {
        content,
        parent: parentId,
      });

      if (data.success) {
        toast.success(parentId ? "Reply posted" : "Comment posted");
        if (parentId) {
          setReplyingTo(null);
          setReplyContent("");
        } else {
          setNewComment("");
        }
        fetchComments();
      }
    } catch (error) {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await apiClient.delete(`/comments/${commentId}`);
      toast.success("Comment deleted");
      fetchComments();
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const handleLike = async (commentId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to like comments");
      return;
    }
    try {
      await apiClient.post(`/comments/${commentId}/like`);
      fetchComments();
    } catch (error) {
      toast.error("Failed to like comment");
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    if (comment.isDeleted) {
      return (
        <div key={comment._id} className={`p-4 bg-muted/30 rounded-lg italic text-muted-foreground text-sm ${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
          This comment has been deleted.
        </div>
      );
    }

    const isOwner = user?.id === comment.author._id;
    const hasLiked = user && comment.likes?.includes(user.id);

    return (
      <div key={comment._id} className={`flex gap-4 ${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
        <Avatar className="h-10 w-10 mt-1">
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-semibold mr-2">{comment.author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              {(isOwner || user?.role === 'admin') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(comment._id)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 ml-2">
            <button 
              onClick={() => handleLike(comment._id)}
              className={`flex items-center gap-1.5 text-xs font-medium hover:text-primary transition-colors ${hasLiked ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <ThumbsUp className={`h-3.5 w-3.5 ${hasLiked ? 'fill-current' : ''}`} /> 
              {comment.likes?.length || 0}
            </button>
            
            {!isReply && (
              <button 
                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment._id && (
            <form onSubmit={(e) => handleSubmitComment(e, comment._id)} className="mt-4 flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea 
                  placeholder={`Reply to ${comment.author.name}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[40px] h-[40px] py-2 resize-none text-sm"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={isSubmitting || !replyContent.trim()}>
                  Post
                </Button>
              </div>
            </form>
          )}

          {/* Render Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Main Comment Form */}
      <div className="flex gap-4 mb-10">
        <Avatar className="h-10 w-10 mt-1">
          <AvatarFallback>{user?.name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        <form onSubmit={(e) => handleSubmitComment(e)} className="flex-1 space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] resize-y"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Post Comment
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}
