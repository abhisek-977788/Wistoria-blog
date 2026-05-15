"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Editor } from "@/components/editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters").max(300),
  content: z.string().min(50, "Content must be at least 50 characters"),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(),
  status: z.enum(["draft", "published"]),
});

export default function WritePage() {
  return (
    <React.Suspense
      fallback={
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <WriteEditor />
    </React.Suspense>
  );
}

function WriteEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id");
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuthStore();
  
  const [isLoading, setIsLoading] = React.useState(postId ? true : false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [coverImage, setCoverImage] = React.useState<string | undefined>();
  const [coverImagePublicId, setCoverImagePublicId] = React.useState<string | undefined>();
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<z.infer<typeof postSchema>>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      tags: "",
      status: "draft",
    },
  });

  React.useEffect(() => {
    if (!isAuthLoading && (!isAuthenticated || !["author", "admin"].includes(user?.role as string))) {
      toast.error("You don't have permission to write posts.");
      router.push("/");
    }
  }, [isAuthenticated, user, isAuthLoading, router]);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const { data: catData } = await apiClient.get("/categories");
        if (catData.success) setCategories(catData.data.categories);

        if (postId) {
          const { data: postData } = await apiClient.get(`/posts/${postId}`);
          if (postData.success) {
            const post = postData.data.post;
            form.reset({
              title: post.title,
              excerpt: post.excerpt,
              content: post.content,
              category: post.category._id,
              tags: post.tags.join(", "),
              status: post.status,
            });
            setCoverImage(post.coverImage);
            setCoverImagePublicId(post.coverImagePublicId);
          }
        }
      } catch (error) {
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [postId, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        setCoverImage(data.data.url);
        setCoverImagePublicId(data.data.public_id);
        toast.success("Cover image uploaded");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof postSchema>) {
    setIsSaving(true);
    try {
      const payload = {
        ...values,
        tags: values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        coverImage,
        coverImagePublicId,
      };

      if (postId) {
        await apiClient.put(`/posts/${postId}`, payload);
        toast.success("Post updated successfully");
      } else {
        await apiClient.post("/posts", payload);
        toast.success("Post created successfully");
      }
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save post");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading || isAuthLoading) {
    return <div className="container py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="-ml-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-3xl font-bold">{postId ? "Edit Post" : "Write a Post"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main Content Area */}
            <div className="flex-1 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        placeholder="Post Title" 
                        className="text-3xl md:text-5xl font-bold h-auto py-4 border-none shadow-none focus-visible:ring-0 px-0 bg-transparent" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Editor content={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Sidebar / Settings Area */}
            <div className="w-full md:w-80 space-y-6 bg-muted/30 p-6 rounded-xl border">
              <div>
                <FormLabel className="text-base font-semibold mb-3 block">Cover Image</FormLabel>
                {coverImage ? (
                  <div className="relative aspect-video rounded-md overflow-hidden mb-3 border">
                    <img src={coverImage} alt="Cover" className="object-cover w-full h-full" />
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverImage(undefined);
                        setCoverImagePublicId(undefined);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer mb-3">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click to upload cover</span>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                  </div>
                )}
                {isUploading && <div className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-3 w-3 animate-spin"/> Uploading...</div>}
              </div>

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief summary of your post..." className="resize-none h-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="tech, coding, nextjs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex gap-4">
                <Button 
                  type="submit" 
                  variant="outline" 
                  className="flex-1"
                  disabled={isSaving}
                  onClick={() => form.setValue("status", "draft")}
                >
                  Save Draft
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSaving}
                  onClick={() => form.setValue("status", "published")}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
