import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, User, Share, BookOpen, PlayCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import ChapterReader from '@/components/learning/ChapterReader';
import CourseProgress from '@/components/learning/CourseProgress';

interface LearningCourse {
  id: string;
  title: string;
  description: string | null;
  content: string;
  cover_image_url: string | null;
  author: string;
  difficulty_level: string | null;
  estimated_duration: number | null;
  published_at: string | null;
  created_at: string;
}

interface Chapter {
  id: string;
  title: string;
  estimated_reading_time: number | null;
}

const LearningDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [course, setCourse] = useState<LearningCourse | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCourse(id);
    }
  }, [id]);

  const fetchCourse = async (courseId: string) => {
    try {
      // Fetch course data
      const { data: courseData, error: courseError } = await supabase
        .from('learning_courses')
        .select('*')
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          toast({
            title: "Course not found",
            description: "The requested course could not be found.",
            variant: "destructive",
          });
        }
        throw courseError;
      }

      // Fetch chapters data
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('course_chapters')
        .select('id, title, estimated_reading_time')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;

      setChapters(chaptersData || []);
      setCourse(courseData);
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/learning');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDuration = () => {
    const total = chapters.reduce((sum, chapter) => {
      return sum + (chapter.estimated_reading_time || 0);
    }, 0);
    return total;
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Duration not specified';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getDifficultyColor = (level: string | null) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: course?.title,
          text: course?.description || 'Check out this crypto learning course',
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Course link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading course...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h3 className="text-2xl font-semibold text-foreground mb-3">Course Not Found</h3>
            <p className="text-muted-foreground mb-6">The requested course could not be found.</p>
            <Button onClick={() => navigate('/learning')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/learning')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Learning
            </Button>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {course.title}
            </h1>

            {course.description && (
              <p className="text-xl text-muted-foreground mb-6">
                {course.description}
              </p>
            )}
          </div>

          {/* Course Info Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Instructor</div>
                    <div className="font-medium">{course.author}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">{formatDuration(calculateTotalDuration())}</div>
                  </div>
                </div>

                {course.difficulty_level && (
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Difficulty</div>
                      <Badge 
                        variant="secondary" 
                        className={getDifficultyColor(course.difficulty_level)}
                      >
                        {course.difficulty_level}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex justify-end">
                <Button variant="outline" onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Share Course
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          {course.cover_image_url && (
            <div className="mb-8">
              <img
                src={course.cover_image_url}
                alt={course.title}
                className="w-full rounded-lg object-cover max-h-96"
              />
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              <Tabs defaultValue="chapters" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chapters" className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    Learn
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Overview
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chapters" className="space-y-4">
                  <ChapterReader 
                    courseId={course.id} 
                    onProgressUpdate={() => setProgressKey(prev => prev + 1)}
                  />
                </TabsContent>
                
                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Course Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-lg max-w-none dark:prose-invert">
                        <div 
                          dangerouslySetInnerHTML={{ __html: course.content }}
                          className="text-foreground leading-relaxed"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {user && (
                <CourseProgress 
                  courseId={course.id} 
                  key={progressKey}
                />
              )}
              
              {!user && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <h4 className="font-medium mb-2">Track Your Progress</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sign in to track your reading progress and earn completion certificates.
                    </p>
                    <Button onClick={() => navigate('/auth')} className="w-full">
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Instructor</h4>
                    <p className="text-sm">{course.author}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Duration</h4>
                    <p className="text-sm">{formatDuration(calculateTotalDuration())}</p>
                  </div>
                  
                  {course.difficulty_level && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Difficulty</h4>
                      <Badge 
                        variant="secondary" 
                        className={getDifficultyColor(course.difficulty_level)}
                      >
                        {course.difficulty_level}
                      </Badge>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Button variant="outline" onClick={handleShare} className="w-full">
                      <Share className="h-4 w-4 mr-2" />
                      Share Course
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Course by {course.author}
              </div>
              <Button variant="outline" onClick={handleShare}>
                <Share className="h-4 w-4 mr-2" />
                Share Course
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDetail;