import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, GripVertical, Clock } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { createSafeHtml } from '@/utils/htmlSanitizer';

interface Chapter {
  id: string;
  course_id: string;
  chapter_number: number;
  title: string;
  content: string;
  estimated_reading_time: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface ChapterManagementProps {
  courseId: string;
  onChaptersUpdate?: () => void;
}

const ChapterManagement = ({ courseId, onChaptersUpdate }: ChapterManagementProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    estimated_reading_time: '',
    is_published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (courseId) {
      fetchChapters();
    }
  }, [courseId]);

  const fetchChapters = async () => {
    try {
      const { data, error } = await supabase
        .from('course_chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('chapter_number', { ascending: true });

      if (error) throw error;
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      toast({
        title: "Error",
        description: "Failed to load chapters",
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
      estimated_reading_time: '',
      is_published: false,
    });
    setEditingChapter(null);
    setShowForm(false);
  };

  const handleEdit = (chapter: Chapter) => {
    setFormData({
      title: chapter.title,
      content: chapter.content,
      estimated_reading_time: chapter.estimated_reading_time?.toString() || '',
      is_published: chapter.is_published,
    });
    setEditingChapter(chapter);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const chapterData = {
        course_id: courseId,
        title: formData.title,
        content: formData.content,
        estimated_reading_time: formData.estimated_reading_time ? parseInt(formData.estimated_reading_time) : null,
        is_published: formData.is_published,
      };

      if (editingChapter) {
        const { error } = await supabase
          .from('course_chapters')
          .update(chapterData)
          .eq('id', editingChapter.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Chapter updated successfully",
        });
      } else {
        // Get next chapter number
        const nextChapterNumber = chapters.length > 0 ? Math.max(...chapters.map(c => c.chapter_number)) + 1 : 1;
        
        const { error } = await supabase
          .from('course_chapters')
          .insert([{ ...chapterData, chapter_number: nextChapterNumber }]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Chapter created successfully",
        });
      }

      resetForm();
      fetchChapters();
      onChaptersUpdate?.();
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast({
        title: "Error",
        description: "Failed to save chapter",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    try {
      const { error } = await supabase
        .from('course_chapters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Chapter deleted successfully",
      });
      fetchChapters();
      onChaptersUpdate?.();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive",
      });
    }
  };

  const reorderChapters = async (fromIndex: number, toIndex: number) => {
    const reorderedChapters = [...chapters];
    const [removed] = reorderedChapters.splice(fromIndex, 1);
    reorderedChapters.splice(toIndex, 0, removed);

    try {
      // Update chapter numbers one by one
      for (let i = 0; i < reorderedChapters.length; i++) {
        const { error } = await supabase
          .from('course_chapters')
          .update({ chapter_number: i + 1 })
          .eq('id', reorderedChapters[i].id);

        if (error) throw error;
      }

      fetchChapters();
      onChaptersUpdate?.();
    } catch (error) {
      console.error('Error reordering chapters:', error);
      toast({
        title: "Error",
        description: "Failed to reorder chapters",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not specified';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading && !showForm) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading chapters...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Chapter Management</h3>
          <p className="text-sm text-muted-foreground">Organize course content into chapters</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Chapter
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingChapter ? 'Edit Chapter' : 'Create New Chapter'}</CardTitle>
            <CardDescription>
              {editingChapter ? 'Update chapter details' : 'Add a new chapter to the course'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter-title">Chapter Title</Label>
                  <Input
                    id="chapter-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter chapter title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reading-time">Reading Time (minutes)</Label>
                  <Input
                    id="reading-time"
                    type="number"
                    value={formData.estimated_reading_time}
                    onChange={(e) => setFormData({ ...formData, estimated_reading_time: e.target.value })}
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter-content">Chapter Content</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="publish-chapter"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="publish-chapter">Publish chapter immediately</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : editingChapter ? 'Update Chapter' : 'Create Chapter'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {chapters.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No chapters yet. Create your first chapter to get started.</p>
            </CardContent>
          </Card>
        ) : (
          chapters.map((chapter, index) => (
            <Card key={chapter.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move mt-1" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Chapter {chapter.chapter_number}: {chapter.title}
                        {chapter.is_published ? (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            Published
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                            Draft
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {formatDuration(chapter.estimated_reading_time)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(chapter)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(chapter.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={createSafeHtml(chapter.content.slice(0, 200) + '...')}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ChapterManagement;