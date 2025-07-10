
-- Fix admin access for learning_courses
CREATE POLICY "Admins can create learning courses" 
ON public.learning_courses 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update learning courses" 
ON public.learning_courses 
FOR UPDATE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete learning courses" 
ON public.learning_courses 
FOR DELETE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all learning courses" 
ON public.learning_courses 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Create course_chapters table
CREATE TABLE public.course_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  estimated_reading_time INTEGER, -- in minutes
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, chapter_number)
);

-- Enable RLS on course_chapters
ALTER TABLE public.course_chapters ENABLE ROW LEVEL SECURITY;

-- RLS policies for course_chapters
CREATE POLICY "Anyone can view published chapters" 
ON public.course_chapters 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage all chapters" 
ON public.course_chapters 
FOR ALL 
TO authenticated
USING (is_admin());

-- Create user_course_progress table
CREATE TABLE public.user_course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.course_chapters(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  reading_progress INTEGER NOT NULL DEFAULT 0 CHECK (reading_progress >= 0 AND reading_progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, chapter_id)
);

-- Enable RLS on user_course_progress
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_course_progress
CREATE POLICY "Users can view their own progress" 
ON public.user_course_progress 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.user_course_progress 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_course_progress 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" 
ON public.user_course_progress 
FOR SELECT 
TO authenticated
USING (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_course_chapters_updated_at
BEFORE UPDATE ON public.course_chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_course_progress_updated_at
BEFORE UPDATE ON public.user_course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_course_chapters_course_id ON public.course_chapters(course_id);
CREATE INDEX idx_course_chapters_published ON public.course_chapters(course_id, is_published) WHERE is_published = true;
CREATE INDEX idx_user_progress_user_course ON public.user_course_progress(user_id, course_id);
CREATE INDEX idx_user_progress_chapter ON public.user_course_progress(chapter_id);
