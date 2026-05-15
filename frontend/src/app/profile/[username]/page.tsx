"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Link as LinkIcon, MapPin, Calendar, FileText, Settings, UserPlus, UserMinus, FileEdit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  
  const [profile, setProfile] = React.useState<any>(null);
  const [posts, setPosts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [isFollowLoading, setIsFollowLoading] = React.useState(false);

  React.useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: profileData } = await apiClient.get(`/users/${params.username}`);
        if (profileData.success) {
          setProfile(profileData.data.user);
          setIsFollowing(profileData.data.user.followers.includes(currentUser?.id));
        }

        const { data: postsData } = await apiClient.get(`/users/${params.username}/posts`);
        if (postsData.success) {
          setPosts(postsData.data);
        }
      } catch (error) {
        toast.error("User not found");
        router.push("/blog");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (params.username) {
      fetchProfile();
    }
  }, [params.username, currentUser, router]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to follow users");
      router.push("/login");
      return;
    }
    
    setIsFollowLoading(true);
    try {
      await apiClient.post(`/users/${profile._id}/follow`);
      setIsFollowing(!isFollowing);
      setProfile((prev: any) => ({
        ...prev,
        followers: isFollowing 
          ? prev.followers.filter((id: string) => id !== currentUser?.id)
          : [...prev.followers, currentUser?.id]
      }));
      toast.success(isFollowing ? `Unfollowed ${profile.name}` : `Following ${profile.name}`);
    } catch (error) {
      toast.error("Failed to follow user");
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10 max-w-5xl mx-auto">
        <Skeleton className="h-48 w-full rounded-t-xl" />
        <div className="flex flex-col md:flex-row gap-6 px-6 relative -top-12">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
          <div className="pt-14 space-y-4 flex-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full max-w-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwner = currentUser?.id === profile._id;

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="bg-muted/30 rounded-xl overflow-hidden mb-10 border">
        <div className="h-48 bg-gradient-to-r from-primary/20 via-purple-500/20 to-secondary/20 relative">
          {/* Cover image could go here */}
        </div>
        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 -mt-16 sm:-mt-20 mb-6">
            <Avatar className="h-32 w-32 sm:h-40 sm:w-40 border-4 border-background shadow-xl bg-muted">
              <AvatarImage src={profile.avatar} className="object-cover" />
              <AvatarFallback className="text-4xl">{profile.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex gap-3 w-full md:w-auto">
              {isOwner ? (
                <Button className="flex-1 md:flex-none">
                  <Settings className="mr-2 h-4 w-4" /> Edit Profile
                </Button>
              ) : (
                <Button 
                  onClick={handleFollow} 
                  disabled={isFollowLoading}
                  variant={isFollowing ? "outline" : "default"}
                  className="flex-1 md:flex-none w-32"
                >
                  {isFollowing ? (
                    <><UserMinus className="mr-2 h-4 w-4" /> Unfollow</>
                  ) : (
                    <><UserPlus className="mr-2 h-4 w-4" /> Follow</>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">{profile.name}</h1>
            <p className="text-muted-foreground text-lg mb-4">@{profile.username}</p>
            
            <p className="text-base leading-relaxed mb-6">
              {profile.bio || "This user hasn't added a bio yet."}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
                  <LinkIcon className="mr-1.5 h-4 w-4" /> {new URL(profile.website).hostname}
                </a>
              )}
              <div className="flex items-center">
                <Calendar className="mr-1.5 h-4 w-4" /> Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
              </div>
              <div className="flex items-center">
                <FileText className="mr-1.5 h-4 w-4" /> {profile.postCount} posts
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats bar */}
        <div className="flex border-t bg-background/50 divide-x text-center">
          <div className="flex-1 py-4">
            <div className="text-2xl font-bold">{profile.followers?.length || 0}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Followers</div>
          </div>
          <div className="flex-1 py-4">
            <div className="text-2xl font-bold">{profile.following?.length || 0}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Following</div>
          </div>
          <div className="flex-1 py-4">
            <div className="text-2xl font-bold">{profile.postCount || 0}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Articles</div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="mb-8 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="articles" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-8 py-3 font-medium"
          >
            Articles
          </TabsTrigger>
          <TabsTrigger 
            value="about" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-8 py-3 font-medium"
          >
            About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-0">
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <Card key={post._id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                  {post.coverImage && (
                    <div className="h-48 w-full overflow-hidden">
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <Badge style={{ backgroundColor: post.category.color, color: "#fff" }}>
                        {post.category.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="flex-1">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-3 text-sm">
                        {post.excerpt}
                      </p>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
              <FileEdit className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No articles yet</h3>
              <p className="text-muted-foreground">
                {isOwner ? "You haven't published any articles yet." : `${profile.name} hasn't published any articles yet.`}
              </p>
              {isOwner && (
                <Button className="mt-6" onClick={() => router.push("/write")}>
                  Write your first post
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="mt-0">
          <Card>
            <CardContent className="p-8">
              <h3 className="text-lg font-bold mb-4">About {profile.name}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No biography provided."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
