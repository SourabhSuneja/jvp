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

-- This creates a function that returns the integer part of the class string like '4-A1' => 4
CREATE OR REPLACE FUNCTION extract_class_number(full_class text)
RETURNS smallint AS $$
BEGIN
  RETURN split_part(full_class, '-', 1)::smallint;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enable RLS
ALTER TABLE syllabus ENABLE ROW LEVEL SECURITY;

-- INSERT Policy (uses WITH CHECK)
CREATE POLICY insert_syllabus_policy ON syllabus
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM class_subject_assignments
    WHERE teacher_id = auth.uid()
      AND extract_class_number(class_subject_assignments.class) = syllabus.class
  )
);

-- UPDATE Policy
CREATE POLICY update_syllabus_policy ON syllabus
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM class_subject_assignments
    WHERE teacher_id = auth.uid()
      AND extract_class_number(class_subject_assignments.class) = syllabus.class
  )
);

-- DELETE Policy
CREATE POLICY delete_syllabus_policy ON syllabus
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM class_subject_assignments
    WHERE teacher_id = auth.uid()
      AND extract_class_number(class_subject_assignments.class) = syllabus.class
  )
);