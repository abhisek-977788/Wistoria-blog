"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Clock, Eye, Heart, MessageCircle, MoreVertical, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CommentsSection } from "@/components/comments-section";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  coverImage?: string;
  author: {
    _id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    followerCount: number;
  };
  category: {
    name: string;
    slug: string;
    color: string;
  };
  tags: string[];
  views: number;
  readingTime: number;
  likes: string[];
  comments: string[];
  publishedAt: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [post, setPost] = React.useState<Post | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLiking, setIsLiking] = React.useState(false);

  React.useEffect(() => {
    async function fetchPost() {
      try {
        const { data } = await apiClient.get(`/posts/${params.slug}`);
        if (data.success) {
          setPost(data.data.post);
        }
      } catch (error) {
        console.error("Failed to fetch post", error);
        toast.error("Failed to load post");
      } finally {
        setIsLoading(false);
      }
    }
    if (params.slug) {
      fetchPost();
    }
  }, [params.slug]);

  const handleLike = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please login to like this post");
      router.push("/login");
      return;
    }
    
    setIsLiking(true);
    try {
      const { data } = await apiClient.post(`/posts/${post?._id}/like`);
      if (data.success) {
        // Optimistic update
        setPost((prev) => {
          if (!prev) return prev;
          const newLikes = data.data.liked 
            ? [...prev.likes, user.id]
            : prev.likes.filter(id => id !== user.id);
          return { ...prev, likes: newLikes };
        });
      }
    } catch (error) {
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiClient.delete(`/posts/${post?._id}`);
      toast.success("Post deleted successfully");
      router.push("/blog");
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const isAuthor = user?.id === post?.author._id;
  const isAdmin = user?.role === "admin";
  const hasLiked = user ? post?.likes.includes(user.id) : false;

  if (isLoading) {
    return (
      <div className="container py-10 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-3/4 mb-6" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-4xl font-bold mb-4">Post not found</h1>
        <p className="text-muted-foreground mb-8">The article you are looking for does not exist or has been removed.</p>
        <Button onClick={() => router.push("/blog")}>Back to Explore</Button>
      </div>
    );
  }

  return (
    <article className="container py-10 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex items-center justify-between">
          <Badge style={{ backgroundColor: post.category.color, color: "#fff" }}>
            {post.category.name}
          </Badge>

          {(isAuthor || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor && (
                  <DropdownMenuItem onClick={() => router.push(`/write?id=${post._id}`)}>
                    Edit Post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.author.avatar} alt={post.author.name} />
              <AvatarFallback>{post.author.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-lg">{post.author.name}</div>
              <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-1">
                <span className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {format(new Date(post.publishedAt || new Date()), 'MMMM d, yyyy')}
                </span>
                <span className="flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {post.readingTime} min read
                </span>
                <span className="flex items-center">
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  {post.views} views
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant={hasLiked ? "default" : "outline"} 
              size="sm" 
              onClick={handleLike} 
              disabled={isLiking}
              className={hasLiked ? "bg-rose-500 hover:bg-rose-600 text-white" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
              {post.likes.length}
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" });
            }}>
              <MessageCircle className="h-4 w-4 mr-2" />
              {post.comments.length}
            </Button>
          </div>
        </div>
      </motion.div>

      {post.coverImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative w-full aspect-video rounded-2xl overflow-hidden mb-12 shadow-xl border border-border"
        >
          <img src={post.coverImage} alt={post.title} className="object-cover w-full h-full" />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="prose prose-lg dark:prose-invert max-w-none mb-16 prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <Separator className="my-10" />

      <div className="flex flex-wrap gap-2 mb-10">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="px-3 py-1">
            #{tag}
          </Badge>
        ))}
      </div>

      {/* Author Card */}
      <div className="bg-muted rounded-xl p-8 mb-16 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
        <Avatar className="h-24 w-24">
          <AvatarImage src={post.author.avatar} alt={post.author.name} />
          <AvatarFallback className="text-2xl">{post.author.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Written by</div>
          <h3 className="text-2xl font-bold mb-2">{post.author.name}</h3>
          <p className="text-muted-foreground mb-4 max-w-xl">
            {post.author.bio || "This author hasn't written a bio yet, but their words speak for themselves."}
          </p>
          <Button variant="outline" onClick={() => router.push(`/profile/${post.author.username}`)}>
            View Profile
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      <div id="comments-section" className="scroll-mt-24">
        <h3 className="text-2xl font-bold mb-8">Comments ({post.comments.length})</h3>
        <CommentsSection postId={post._id} />
      </div>
    </article>
  );
}

