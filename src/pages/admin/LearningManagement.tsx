import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Clock, BookOpen } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import RichTextEditor from '@/components/admin/RichTextEditor';
import ImageUpload from '@/components/admin/ImageUpload';
import ChapterManagement from '@/components/learning/ChapterManagement';
import { format } from 'date-fns';
import { createSafeHtml } from '@/utils/htmlSanitizer';

interface LearningCourse {
  id: string;
  title: string;
  description: string | null;
  content: string;
  cover_image_url: string | null;
  author: string;
  difficulty_level: string | null;
  estimated_duration: number | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

const LearningManagement = () => {
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<LearningCourse | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    cover_image_url: '',
    author: '',
    difficulty_level: '',
    estimated_duration: '',
    is_published: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      cover_image_url: '',
      author: '',
      difficulty_level: '',
      estimated_duration: '',
      is_published: false,
    });
    setEditingCourse(null);
    setShowForm(false);
  };

  const handleEdit = (course: LearningCourse) => {
    setFormData({
      title: course.title,
      description: course.description || '',
      content: course.content,
      cover_image_url: course.cover_image_url || '',
      author: course.author,
      difficulty_level: course.difficulty_level || '',
      estimated_duration: course.estimated_duration?.toString() || '',
      is_published: course.is_published,
    });
    setEditingCourse(course);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const courseData = {
        title: formData.title,
        description: formData.description || null,
        content: formData.content,
        cover_image_url: formData.cover_image_url || null,
        author: formData.author,
        difficulty_level: formData.difficulty_level || null,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        is_published: formData.is_published,
        published_at: formData.is_published ? new Date().toISOString() : null,
      };

      if (editingCourse) {
        const { error } = await supabase
          .from('learning_courses')
          .update(courseData)
          .eq('id', editingCourse.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('learning_courses')
          .insert([courseData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Course created successfully",
        });
      }

      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const { error } = await supabase
        .from('learning_courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
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
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading courses...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Learning Management</h1>
            <p className="text-muted-foreground">Create and manage learning courses</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</CardTitle>
              <CardDescription>
                Fill in the details below to {editingCourse ? 'update' : 'create'} a course
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
                      placeholder="Enter course title"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty Level</Label>
                    <Select value={formData.difficulty_level} onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                      placeholder="90"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Course description and what students will learn"
                    rows={3}
                  />
                </div>

                <ImageUpload
                  label="Cover Image"
                  bucket="learning-images"
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
                    placeholder="https://example.com/course-image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Course Content</Label>
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
                    {loading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {course.title}
                      {course.is_published ? (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          Published
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          Draft
                        </span>
                      )}
                      {course.difficulty_level && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {course.difficulty_level}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span>By {course.author}</span>
                      <span>•</span>
                      <span>{format(new Date(course.created_at), 'MMM dd, yyyy')}</span>
                      {course.estimated_duration && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(course.estimated_duration)}
                          </span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(course.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="details" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Course Details
                    </TabsTrigger>
                    <TabsTrigger value="chapters" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Chapters
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4">
                    {course.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Description</h4>
                        <p className="text-muted-foreground">{course.description}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Course Overview</h4>
                      <div 
                        className="prose prose-sm max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={createSafeHtml(course.content.slice(0, 300) + '...')}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chapters" className="space-y-4">
                    <ChapterManagement 
                      courseId={course.id} 
                      onChaptersUpdate={fetchCourses}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default LearningManagement;