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
