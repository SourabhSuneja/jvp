create table syllabus (
    id uuid not null default gen_random_uuid(),
    class smallint not null,
    exam text not null,
    subject text not null,
    syllabus_text text not null,
    updated_at timestamp without time zone null default now(),
    completion_percentage integer null default 0,
    expected_completion_date date null,
    completion_notes text null,
    constraint syllabus_pkey primary key (id),
    constraint syllabus_class_exam_subject_key unique (class, exam, subject)
);

-- Enable RLS
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow any authenticated user to perform all operations (select, insert, update, delete)
CREATE POLICY syllabus_authenticated_policy ON syllabus
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Function to fetch grade-wise syllabus intended for Ion Spark app
CREATE OR REPLACE FUNCTION get_syllabus_data(p_class SMALLINT, p_exam TEXT)
RETURNS TABLE (
    class SMALLINT,
    exam TEXT,
    subject TEXT,
    syllabus_text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    subjects_order TEXT[] := ARRAY[
        'English', 'Hindi', 'Maths', 'Applied Maths', 'Science', 
        'Social Science', 'EVS', 'Sanskrit', 'GK', 'Computer', 'Data Science', 'Informatics Practices', 'Physical Education',
        'Accountancy', 'Business Studies', 'Economics', 'History', 'Geography', 'Political Science',
        'Psychology','Fine Arts', 'Physics', 'Chemistry', 'Biology'
    ];
BEGIN
    RETURN QUERY
    SELECT s.class, s.exam, s.subject, s.syllabus_text
    FROM syllabus s
    WHERE s.class = p_class
      AND s.exam = p_exam
    ORDER BY 
        COALESCE(ARRAY_POSITION(subjects_order, s.subject), 9999),  -- custom array order first
        s.subject;                                                 -- fallback alphabetical
END;
$$;
