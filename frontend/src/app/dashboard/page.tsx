"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Users, FileText, LayoutDashboard, Settings, MoreVertical, Trash2, Edit, CheckCircle2, XCircle, FilePlus, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const [stats, setStats] = React.useState<any>(null);
  const [myPosts, setMyPosts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatColor, setNewCatColor] = React.useState("#6366f1");

  React.useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !['admin', 'author'].includes(user?.role as string))) {
      toast.error("Unauthorized access");
      router.push("/");
    }
  }, [isAuthenticated, user, isAuthLoading, router]);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (user?.role === 'admin') {
        const [statsRes, catsRes] = await Promise.all([
          apiClient.get('/admin/stats'),
          apiClient.get('/categories')
        ]);
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (catsRes.data.success) setCategories(catsRes.data.data.categories);
      } else {
        const { data } = await apiClient.get('/posts/my-posts');
        if (data.success) setMyPosts(data.data);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiClient.delete(`/posts/${id}`);
      toast.success("Post deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await apiClient.post('/categories', { name: newCatName, color: newCatColor });
      if (data.success) {
        toast.success("Category created");
        setIsCategoryModalOpen(false);
        setNewCatName("");
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create category");
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="container py-10 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="container py-10 flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="sticky top-24">
          <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-muted/50 border">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{user?.name}</div>
              <Badge variant="secondary" className="capitalize text-xs">{user?.role}</Badge>
            </div>
          </div>
          
          <nav className="space-y-2">
            <Button variant="secondary" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Overview
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/write">
                <FilePlus className="mr-2 h-4 w-4" /> Write Post
              </Link>
            </Button>
            {isAdmin && (
              <>
                <Button variant="ghost" className="w-full justify-start" onClick={() => toast.info("Users management coming soon")}>
                  <Users className="mr-2 h-4 w-4" /> Users
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => toast.info("Settings coming soon")}>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
              </>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name.split(' ')[0]}!</p>
        </div>

        {isAdmin && stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.stats.totalUsers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.stats.totalPosts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.stats.publishedPosts} published, {stats.stats.draftPosts} drafts
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.stats.totalComments}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Tabs defaultValue="posts" className="w-full">
          <TabsList>
            <TabsTrigger value="posts">{isAdmin ? "All Posts" : "My Posts"}</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Recent Users</TabsTrigger>}
            {isAdmin && <TabsTrigger value="categories">Categories</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Articles</CardTitle>
                <CardDescription>Manage your articles and drafts.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(isAdmin && stats ? stats.topPosts : myPosts).map((post: any) => (
                    <div key={post._id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Link href={`/blog/${post.slug}`} className="font-semibold hover:underline">
                          {post.title}
                        </Link>
                        <div className="flex items-center text-xs text-muted-foreground gap-3">
                          {!isAdmin && (
                            <Badge variant={post.status === 'published' ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {post.status}
                            </Badge>
                          )}
                          {isAdmin && <span>By {post.author.name}</span>}
                          <span>{format(new Date(post.publishedAt || post.createdAt), 'MMM d, yyyy')}</span>
                          <span>{post.views} views</span>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/write?id=${post._id}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePost(post._id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  
                  {(!isAdmin && myPosts.length === 0) && (
                    <div className="text-center py-10 border rounded-lg border-dashed">
                      <p className="text-muted-foreground mb-4">You haven't written any posts yet.</p>
                      <Button asChild><Link href="/write">Write your first post</Link></Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && stats && (
            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Recently registered members.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentUsers.map((u: any) => (
                      <div key={u._id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                        <Badge variant="outline">{u.role}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isAdmin && categories && (
            <TabsContent value="categories" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>Manage blog categories.</CardDescription>
                  </div>
                  <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">Add Category</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Category</DialogTitle>
                        <DialogDescription>Add a new category for blog posts.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCategory} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Technology" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="color">Color</Label>
                          <div className="flex gap-2">
                            <Input id="color" type="color" value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} className="w-16 h-10 p-1" />
                            <Input value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} placeholder="#000000" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save Category</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((cat: any) => (
                      <div key={cat._id} className="p-4 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="font-semibold">{cat.name}</span>
                        </div>
                        <Badge variant="secondary">{cat.postCount} posts</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
