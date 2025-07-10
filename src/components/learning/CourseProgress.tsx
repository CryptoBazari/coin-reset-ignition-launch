import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Circle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface Chapter {
  id: string;
  course_id: string;
  chapter_number: number;
  title: string;
  estimated_reading_time: number | null;
  is_published: boolean;
}

interface UserProgress {
  id: string;
  chapter_id: string;
  reading_progress: number;
  completed_at: string | null;
}

interface CourseProgressProps {
  courseId: string;
  className?: string;
}

const CourseProgress = ({ courseId, className = '' }: CourseProgressProps) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (courseId && user) {
      fetchData();
    }
  }, [courseId, user]);

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

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user!.id);

      if (progressError) throw progressError;

      setChapters(chaptersData || []);
      setUserProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching course progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChapterProgress = (chapterId: string) => {
    const progress = userProgress.find(p => p.chapter_id === chapterId);
    return progress || { reading_progress: 0, completed_at: null };
  };

  const getOverallProgress = () => {
    if (chapters.length === 0) return 0;
    const completedChapters = chapters.filter(chapter => {
      const progress = getChapterProgress(chapter.id);
      return progress.completed_at !== null;
    });
    return Math.round((completedChapters.length / chapters.length) * 100);
  };

  const getTotalEstimatedTime = () => {
    return chapters.reduce((total, chapter) => {
      return total + (chapter.estimated_reading_time || 0);
    }, 0);
  };

  const getCompletedTime = () => {
    return chapters.reduce((total, chapter) => {
      const progress = getChapterProgress(chapter.id);
      if (progress.completed_at) {
        return total + (chapter.estimated_reading_time || 0);
      }
      return total;
    }, 0);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-muted rounded mb-2"></div>
        <div className="h-2 bg-muted rounded"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const overallProgress = getOverallProgress();
  const totalTime = getTotalEstimatedTime();
  const completedTime = getCompletedTime();
  const completedChapters = chapters.filter(chapter => {
    const progress = getChapterProgress(chapter.id);
    return progress.completed_at !== null;
  }).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Course Progress</span>
          <span className="text-sm text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{completedChapters} of {chapters.length} chapters completed</span>
          {totalTime > 0 && (
            <span>
              <Clock className="h-3 w-3 inline mr-1" />
              {formatDuration(completedTime)} / {formatDuration(totalTime)}
            </span>
          )}
        </div>
      </div>

      {/* Chapter List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Chapters</h4>
        <div className="space-y-1">
          {chapters.map((chapter) => {
            const progress = getChapterProgress(chapter.id);
            const isCompleted = progress.completed_at !== null;
            
            return (
              <div key={chapter.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {chapter.chapter_number}. {chapter.title}
                    </span>
                    {isCompleted && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                        Complete
                      </Badge>
                    )}
                  </div>
                  {chapter.estimated_reading_time && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(chapter.estimated_reading_time)}
                    </div>
                  )}
                </div>
                {!isCompleted && progress.reading_progress > 0 && (
                  <div className="flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {progress.reading_progress}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {overallProgress === 100 && (
        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">
            Congratulations!
          </h4>
          <p className="text-xs text-green-600 dark:text-green-300">
            You've completed this course
          </p>
        </div>
      )}
    </div>
  );
};

export default CourseProgress;