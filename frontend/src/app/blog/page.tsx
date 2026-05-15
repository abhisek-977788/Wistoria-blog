"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, Clock, Eye, MessageCircle, Heart, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";

import { apiClient } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  _id: string;
  name: string;
  slug: string;
  color: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  category: Category;
  tags: string[];
  views: number;
  readingTime: number;
  likes: string[];
  comments: string[];
  publishedAt: string;
}

export default function BlogListingPage() {
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [sortBy, setSortBy] = React.useState("latest");

  const fetchPosts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      if (sortBy) params.append("sort", sortBy);

      const [postsRes, catsRes] = await Promise.all([
        apiClient.get(`/posts?${params.toString()}`),
        apiClient.get("/categories"),
      ]);

      if (postsRes.data.success) {
        setPosts(postsRes.data.data);
      }
      if (catsRes.data.success) {
        setCategories(catsRes.data.data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, sortBy]);

  React.useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Explore Blogs</h1>
          <p className="text-muted-foreground text-lg">Discover the latest articles, tutorials, and stories.</p>
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={setSortBy}>
                <DropdownMenuRadioItem value="latest">Latest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="popular">Popular (Views)</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="trending">Trending (Likes)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        <Badge
          variant={selectedCategory === "" ? "default" : "secondary"}
          className="cursor-pointer text-sm py-1 px-3"
          onClick={() => setSelectedCategory("")}
        >
          All
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat._id}
            variant={selectedCategory === cat.slug ? "default" : "secondary"}
            className="cursor-pointer text-sm py-1 px-3"
            onClick={() => setSelectedCategory(cat.slug)}
            style={selectedCategory === cat.slug ? { backgroundColor: cat.color, color: "#fff" } : {}}
          >
            {cat.name}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`}>
                <Card className="h-full flex flex-col overflow-hidden hover:border-primary/50 transition-colors group border-border">
                  <div className="relative h-56 w-full bg-muted overflow-hidden">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground text-4xl font-bold uppercase">
                        {post.title.charAt(0)}
                      </div>
                    )}
                    <Badge 
                      className="absolute top-4 left-4 z-10"
                      style={{ backgroundColor: post.category.color, color: "#fff" }}
                    >
                      {post.category.name}
                    </Badge>
                  </div>
                  
                  <CardContent className="flex-1 p-6 flex flex-col">
                    <div className="flex items-center text-xs text-muted-foreground mb-3 gap-4">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMM d, yyyy') : 'Draft'}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readingTime} min read
                      </span>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground line-clamp-3 mb-6 flex-1">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.author.avatar} alt={post.author.name} />
                          <AvatarFallback>{post.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{post.author.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
                        <span className="flex items-center"><Eye className="h-3.5 w-3.5 mr-1" /> {post.views}</span>
                        <span className="flex items-center"><Heart className="h-3.5 w-3.5 mr-1" /> {post.likes?.length || 0}</span>
                        <span className="flex items-center"><MessageCircle className="h-3.5 w-3.5 mr-1" /> {post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No articles found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
          <Button variant="outline" className="mt-6" onClick={() => { setSearchQuery(""); setSelectedCategory(""); }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
