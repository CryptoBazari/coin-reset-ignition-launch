import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import { format } from 'date-fns';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author: string;
  tags: string[] | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const NewsManagement = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    cover_image_url: '',
    author: '',
    tags: '',
    is_published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to load articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      cover_image_url: '',
      author: '',
      tags: '',
      is_published: false,
    });
    setEditingArticle(null);
    setShowForm(false);
  };

  const handleEdit = (article: NewsArticle) => {
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      cover_image_url: article.cover_image_url || '',
      author: article.author,
      tags: article.tags ? article.tags.join(', ') : '',
      is_published: article.is_published,
    });
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const articleData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || null,
        cover_image_url: formData.cover_image_url || null,
        author: formData.author,
        tags: tagsArray.length > 0 ? tagsArray : null,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('news')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Article updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('news')
          .insert([articleData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Article created successfully",
        });
      }

      resetForm();
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  if (loading && !showForm) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading articles...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">News Management</h1>
            <p className="text-muted-foreground">Create and manage news articles</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Article
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</CardTitle>
              <CardDescription>
                Fill in the details below to {editingArticle ? 'update' : 'create'} an article
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter article title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Author name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder="Brief description of the article"
                    rows={3}
                  />
                </div>

                <ImageUpload
                  label="Cover Image"
                  bucket="news-images"
                  currentImageUrl={formData.cover_image_url}
                  onImageUpload={(url) => setFormData({ ...formData, cover_image_url: url })}
                  onImageRemove={() => setFormData({ ...formData, cover_image_url: '' })}
                />

                <div className="space-y-2">
                  <Label htmlFor="cover_image_url">Or enter image URL</Label>
                  <Input
                    id="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="crypto, bitcoin, trading"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="publish"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="publish">Publish immediately</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingArticle ? 'Update Article' : 'Create Article'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {article.title}
                      {article.is_published ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      By {article.author} • {format(new Date(article.created_at), 'MMM dd, yyyy')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(article)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(article.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {article.excerpt && (
                <CardContent>
                  <p className="text-muted-foreground">{article.excerpt}</p>
                  {article.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tags.map((tag, index) => (
                        <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default NewsManagement;