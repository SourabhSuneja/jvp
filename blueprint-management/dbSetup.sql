-- Table definition
create table if not exists blueprint (
    id uuid primary key default gen_random_uuid(),
    class integer not null check (class between 1 and 12),
    subject text not null,
    exam text not null,
    blueprint text not null,
    created_at timestamp not null default now(),
    constraint unique_class_subject_exam unique (class, subject, exam)
);


-- Enable RLS
ALTER TABLE blueprint ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow any authenticated user to perform all operations (select, insert, update, delete)
CREATE POLICY blueprint_authenticated_policy ON blueprint
    FOR ALL
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Function to allow Blueprint fetching from other apps
CREATE OR REPLACE FUNCTION get_blueprint_data(p_class INTEGER, p_exam TEXT)
RETURNS TABLE (
    class INTEGER,
    exam TEXT,
    subject TEXT,
    blueprint TEXT
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
    SELECT b.class, b.exam, b.subject, b.blueprint
    FROM blueprint b
    WHERE b.class = p_class
      AND b.exam = p_exam
    ORDER BY 
        COALESCE(ARRAY_POSITION(subjects_order, b.subject), 9999),  -- custom subject order first
        b.subject;                                                 -- fallback alphabetical
END;
$$;