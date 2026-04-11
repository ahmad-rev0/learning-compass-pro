
-- Helper: check if a user is the teacher of a course (no RLS bypass needed, direct lookup)
CREATE OR REPLACE FUNCTION public.is_course_teacher(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses
    WHERE id = _course_id AND teacher_id = _user_id
  )
$$;

-- Helper: check if a student is enrolled in a course
CREATE OR REPLACE FUNCTION public.is_enrolled_in_course(_student_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.course_enrollments
    WHERE course_id = _course_id AND student_id = _student_id
  )
$$;

-- Helper: check if user is teacher of the course that owns an assignment
CREATE OR REPLACE FUNCTION public.is_assignment_teacher(_user_id uuid, _assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE a.id = _assignment_id AND c.teacher_id = _user_id
  )
$$;

-- ═══ Fix courses policies ═══
DROP POLICY IF EXISTS "Enrolled students view courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers manage own courses" ON public.courses;

CREATE POLICY "Enrolled students view courses" ON public.courses
FOR SELECT USING (
  is_enrolled_in_course(auth.uid(), id)
);

CREATE POLICY "Teachers manage own courses" ON public.courses
FOR ALL USING (
  auth.uid() = teacher_id
);

-- ═══ Fix course_enrollments policies ═══
DROP POLICY IF EXISTS "Students view own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Teachers manage enrollments for own courses" ON public.course_enrollments;

CREATE POLICY "Students view own enrollments" ON public.course_enrollments
FOR SELECT USING (
  auth.uid() = student_id
);

CREATE POLICY "Teachers manage enrollments for own courses" ON public.course_enrollments
FOR ALL USING (
  is_course_teacher(auth.uid(), course_id)
);

-- ═══ Fix assignments policies ═══
DROP POLICY IF EXISTS "Enrolled students view assignments" ON public.assignments;
DROP POLICY IF EXISTS "Teachers manage assignments for own courses" ON public.assignments;

CREATE POLICY "Enrolled students view assignments" ON public.assignments
FOR SELECT USING (
  is_enrolled_in_course(auth.uid(), course_id)
);

CREATE POLICY "Teachers manage assignments for own courses" ON public.assignments
FOR ALL USING (
  is_course_teacher(auth.uid(), course_id)
);

-- ═══ Fix submissions policies ═══
DROP POLICY IF EXISTS "Teachers view submissions for own assignments" ON public.submissions;
DROP POLICY IF EXISTS "Teachers update submissions for own assignments" ON public.submissions;

CREATE POLICY "Teachers view submissions for own assignments" ON public.submissions
FOR SELECT USING (
  is_assignment_teacher(auth.uid(), assignment_id)
);

CREATE POLICY "Teachers update submissions for own assignments" ON public.submissions
FOR UPDATE USING (
  is_assignment_teacher(auth.uid(), assignment_id)
);
