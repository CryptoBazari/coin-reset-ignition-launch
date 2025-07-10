import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Chapter {
  id: string;
  course_id: string;
  chapter_number: number;
  title: string;
  content: string;
  estimated_reading_time: number | null;
  is_published: boolean;
}

interface UserProgress {
  id: string;
  chapter_id: string;
  reading_progress: number;
  completed_at: string | null;
}

interface ChapterReaderProps {
  courseId: string;
  initialChapterId?: string;
  onProgressUpdate?: () => void;
}

const ChapterReader = ({ courseId, initialChapterId, onProgressUpdate }: ChapterReaderProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId]);

  useEffect(() => {
    if (chapters.length > 0 && initialChapterId) {
      const index = chapters.findIndex(ch => ch.id === initialChapterId);
      if (index !== -1) {
        setCurrentChapterIndex(index);
      }
    }
  }, [chapters, initialChapterId]);

  const fetchData = async () => {
    try {
      // Fetch published chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('course_chapters')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;

      setChapters(chaptersData || []);

      if (user) {
        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('course_id', courseId)
          .eq('user_id', user.id);

        if (progressError) throw progressError;
        setUserProgress(progressData || []);
      }
    } catch (error) {
      console.error('Error fetching chapter data:', error);
      toast({
        title: "Error",
        description: "Failed to load chapter content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentChapter = () => chapters[currentChapterIndex];
  
  const getChapterProgress = (chapterId: string) => {
    return userProgress.find(p => p.chapter_id === chapterId);
  };

  const updateProgress = async (chapterId: string, progress: number, completed = false) => {
    if (!user) return;

    setUpdating(true);
    try {
      const progressData = {
        user_id: user.id,
        course_id: courseId,
        chapter_id: chapterId,
        reading_progress: progress,
        completed_at: completed ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('user_course_progress')
        .upsert([progressData], {
          onConflict: 'user_id,course_id,chapter_id'
        });

      if (error) throw error;

      // Update local state
      setUserProgress(prev => {
        const existing = prev.find(p => p.chapter_id === chapterId);
        if (existing) {
          return prev.map(p => 
            p.chapter_id === chapterId 
              ? { ...p, reading_progress: progress, completed_at: completed ? new Date().toISOString() : null }
              : p
          );
        } else {
          return [...prev, {
            id: Date.now().toString(), // Temporary ID
            chapter_id: chapterId,
            reading_progress: progress,
            completed_at: completed ? new Date().toISOString() : null,
          }];
        }
      });

      onProgressUpdate?.();

      if (completed) {
        toast({
          title: "Chapter completed!",
          description: "Great job! You've finished this chapter.",
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const markChapterAsCompleted = () => {
    const currentChapter = getCurrentChapter();
    if (currentChapter && user) {
      updateProgress(currentChapter.id, 100, true);
    }
  };

  const navigateToChapter = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentChapterIndex > 0) {
      setCurrentChapterIndex(currentChapterIndex - 1);
    } else if (direction === 'next' && currentChapterIndex < chapters.length - 1) {
      setCurrentChapterIndex(currentChapterIndex + 1);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Unknown duration';
    if (minutes < 60) return `${minutes} min read`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m read` : `${hours}h read`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading chapter...</div>
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No chapters available for this course yet.</p>
        </CardContent>
      </Card>
    );
  }

  const currentChapter = getCurrentChapter();
  const currentProgress = user ? getChapterProgress(currentChapter.id) : null;
  const isCompleted = currentProgress?.completed_at !== null;

  return (
    <div className="space-y-6">
      {/* Chapter Navigation */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                Chapter {currentChapter.chapter_number}: {currentChapter.title}
                {user && isCompleted && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(currentChapter.estimated_reading_time)}
                </span>
                <span>
                  Chapter {currentChapterIndex + 1} of {chapters.length}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToChapter('prev')}
                disabled={currentChapterIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToChapter('next')}
                disabled={currentChapterIndex === chapters.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chapter Progress */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Chapter Progress</span>
              <span className="text-sm text-muted-foreground">
                {currentProgress?.reading_progress || 0}%
              </span>
            </div>
            <Progress value={currentProgress?.reading_progress || 0} className="h-2" />
            {!isCompleted && (
              <Button
                onClick={markChapterAsCompleted}
                disabled={updating}
                className="mt-4 w-full"
              >
                {updating ? 'Saving...' : 'Mark as Completed'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chapter Content */}
      <Card>
        <CardContent className="pt-6">
          <div 
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: currentChapter.content }}
          />
        </CardContent>
      </Card>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigateToChapter('prev')}
          disabled={currentChapterIndex === 0}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Chapter
        </Button>
        
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Chapter {currentChapterIndex + 1} of {chapters.length}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigateToChapter('next')}
          disabled={currentChapterIndex === chapters.length - 1}
          className="flex items-center gap-2"
        >
          Next Chapter
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Chapter List Sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chapters.map((chapter, index) => {
              const progress = user ? getChapterProgress(chapter.id) : null;
              const completed = progress?.completed_at !== null;
              
              return (
                <button
                  key={chapter.id}
                  onClick={() => setCurrentChapterIndex(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    index === currentChapterIndex
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {chapter.chapter_number}. {chapter.title}
                      </div>
                      {chapter.estimated_reading_time && (
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(chapter.estimated_reading_time)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChapterReader;