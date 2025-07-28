-- Clean up previous objects
-- Drop triggers
DROP TRIGGER IF EXISTS backup_marks_trigger ON marks;
DROP TRIGGER IF EXISTS marks_view_insert ON marks_view;
DROP TRIGGER IF EXISTS marks_view_update ON marks_view;
DROP TRIGGER IF EXISTS check_marks_before_delete ON students;

-- Drop views
DROP VIEW IF EXISTS marks_view;
DROP VIEW IF EXISTS marks_backup_view;

-- Drop functions
DROP FUNCTION IF EXISTS backup_marks_function();
DROP FUNCTION IF EXISTS marks_view_insert_function();
DROP FUNCTION IF EXISTS marks_view_update_function();
DROP FUNCTION IF EXISTS prevent_student_delete();
DROP FUNCTION IF EXISTS get_multiple_marks_updates();
DROP FUNCTION IF EXISTS get_total_marks(TEXT, TEXT);
DROP FUNCTION IF EXISTS calculate_class_percentages(
    TEXT,
    JSONB,
    TEXT[]
);
DROP FUNCTION IF EXISTS delete_marks_by_exam_subject_class(
    TEXT,
    TEXT,
    TEXT
);
DROP FUNCTION IF EXISTS secure_join_tables(
    text,
    text,
    text,
    text,
    text[],
    text[],
    text
);
DROP FUNCTION IF EXISTS update_custom_exam(TEXT, TEXT, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_students_sorted();

-- This function is ANYWAY temporary
DROP FUNCTION IF EXISTS update_students_info(JSON, JSON);

-- Drop tables (in reverse order of creation to handle foreign key dependencies)
DROP TABLE IF EXISTS marks_backup;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS custom_exams;
DROP TABLE IF EXISTS class_subject_assignments;
DROP TABLE IF EXISTS class_teachers;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admins;


-- Start creating new objects
-- Create admins table
CREATE TABLE admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Select policy for authenticated users
CREATE POLICY "authenticated_users_can_read_admins"
ON admins
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    house TEXT,
    gender TEXT,
    opted_subjects TEXT[],
    access_token UUID NOT NULL DEFAULT gen_random_uuid(),
    CONSTRAINT unique_name_class UNIQUE (name, class),
    CONSTRAINT unique_access_token UNIQUE (access_token)
);

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Select policy for teachers: Allow only teachers to read student data
CREATE POLICY "teachers_can_read_students"
ON students
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM teachers
    WHERE teachers.id = auth.uid()
  )
);

-- Insert policy for admin users
CREATE POLICY "admins_can_insert_students"
ON students
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

-- Update policy for admin users
CREATE POLICY "admins_can_update_students"
ON students
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Delete policy for admin users
CREATE POLICY "admins_can_delete_students"
ON students
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admins)
);


-- Create teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Select policy for authenticated users
CREATE POLICY "authenticated_users_can_read_teachers"
ON teachers
FOR SELECT
USING (auth.role() = 'authenticated');

-- Insert policy for admin users
CREATE POLICY "admins_can_insert_teachers"
ON teachers
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

-- Update policy for admin users
CREATE POLICY "admins_can_update_teachers"
ON teachers
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Delete policy for admin users
CREATE POLICY "admins_can_delete_teachers"
ON teachers
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admins)
);


-- Create table class_subject_assignments
CREATE TABLE class_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    class TEXT NOT NULL,
    CONSTRAINT unique_teacher_subject_class UNIQUE (teacher_id, subject, class)
);

-- Enable RLS on class_subject_assignments
ALTER TABLE class_subject_assignments ENABLE ROW LEVEL SECURITY;

-- Select policy for authenticated users
CREATE POLICY "authenticated_users_can_read_class_subject_assignments"
ON class_subject_assignments
FOR SELECT
USING (auth.role() = 'authenticated');

-- Insert policy for admin users
CREATE POLICY "admins_can_insert_class_subject_assignments"
ON class_subject_assignments
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

-- Update policy for admin users
CREATE POLICY "admins_can_update_class_subject_assignments"
ON class_subject_assignments
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Delete policy for admin users
CREATE POLICY "admins_can_delete_class_subject_assignments"
ON class_subject_assignments
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admins)
);


-- Create class_teachers table
CREATE TABLE class_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    class TEXT NOT NULL,
    UNIQUE (class)
);

-- Enable RLS on class_teachers
ALTER TABLE class_teachers ENABLE ROW LEVEL SECURITY;

-- Select policy for authenticated users
CREATE POLICY "authenticated_users_can_read_class_teachers"
ON class_teachers
FOR SELECT
USING (auth.role() = 'authenticated');

-- Insert policy for admin users
CREATE POLICY "admins_can_insert_class_teachers"
ON class_teachers
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

-- Update policy for admin users
CREATE POLICY "admins_can_update_class_teachers"
ON class_teachers
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Delete policy for admin users
CREATE POLICY "admins_can_delete_class_teachers"
ON class_teachers
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admins)
);


-- Create marks table to reference students table
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam TEXT NOT NULL,
    subject TEXT NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks DECIMAL(5, 2) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add a unique constraint
ALTER TABLE marks
ADD CONSTRAINT unique_exam_subject_student
UNIQUE (exam, subject, student_id);

-- Enable RLS on marks table
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT: Allow only teachers to read all marks
CREATE POLICY marks_select_policy
ON marks
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM teachers
    WHERE teachers.id = auth.uid()
  )
);

-- Policy for INSERT: Teachers can only insert marks for their assigned subjects and classes
CREATE POLICY marks_insert_policy ON marks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM class_subject_assignments csa
            JOIN students s ON s.class = csa.class
            WHERE csa.teacher_id = auth.uid()
            AND csa.subject = marks.subject
            AND s.id = marks.student_id
        )
    );

-- Policy for UPDATE: Teachers can only update marks for their assigned subjects and classes
CREATE POLICY marks_update_policy ON marks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM class_subject_assignments csa
            JOIN students s ON s.class = csa.class
            WHERE csa.teacher_id = auth.uid()
            AND csa.subject = marks.subject
            AND s.id = marks.student_id
        )
    );

-- Policy for DELETE: Teachers can only delete marks for their assigned subjects and classes
CREATE POLICY marks_delete_policy ON marks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM class_subject_assignments csa
            JOIN students s ON s.class = csa.class
            WHERE csa.teacher_id = auth.uid()
            AND csa.subject = marks.subject
            AND s.id = marks.student_id
        )
    );

-- Create marks_backup table to reference students table

CREATE TABLE marks_backup (
    id UUID NOT NULL,
    exam TEXT NOT NULL,
    subject TEXT NOT NULL,
    student_id UUID NOT NULL,
    marks DECIMAL(5, 2) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    backup_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Adding a Primary Key for the backup table
    backup_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Enable RLS on marks_backup table
ALTER TABLE marks_backup ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT: Only the service role can insert into marks_backup
-- This prevents direct client-side inserts while allowing the trigger to work
CREATE POLICY marks_backup_insert_policy ON marks_backup
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Policy for SELECT: Allow only admins to read marks_backup table
CREATE POLICY marks_backup_read_access_for_admins
ON marks_backup
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM admins 
    WHERE admins.id = auth.uid()
  )
);

-- Create a function for the trigger
CREATE OR REPLACE FUNCTION backup_marks_function()
RETURNS TRIGGER AS $$
DECLARE
    latest_backup DECIMAL(5, 2);
    latest_backup_is_null BOOLEAN;
    should_backup BOOLEAN := TRUE;
BEGIN
    -- For new inserts, always create a backup
    IF TG_OP = 'INSERT' THEN
        should_backup := TRUE;
    -- For updates, only backup if marks value changed
    ELSIF TG_OP = 'UPDATE' THEN
        -- Get the most recent backup value for this record
        SELECT 
            marks, 
            marks IS NULL INTO latest_backup, latest_backup_is_null 
        FROM marks_backup 
        WHERE id = NEW.id 
        ORDER BY backup_timestamp DESC 
        LIMIT 1;

        -- Only backup if:
        -- 1. No previous backup exists, OR
        -- 2. Both latest backup and new marks are NOT NULL and have different values, OR
        -- 3. One is NULL and the other isn't
        IF latest_backup IS NULL AND latest_backup_is_null IS NULL THEN
            -- No previous backup exists
            should_backup := TRUE;
        ELSIF latest_backup_is_null AND NEW.marks IS NULL THEN
            -- Both are NULL, don't backup
            should_backup := FALSE;
        ELSIF latest_backup_is_null != (NEW.marks IS NULL) THEN
            -- One is NULL and the other isn't, backup
            should_backup := TRUE;
        ELSIF NEW.marks != latest_backup THEN
            -- Both are NOT NULL and have different values, backup
            should_backup := TRUE;
        ELSE
            -- Values are the same, don't backup
            should_backup := FALSE;
        END IF;
    END IF;

    -- Only insert into backup if needed
    IF should_backup THEN
        INSERT INTO marks_backup (
            id, exam, subject, student_id, marks, updated_at
        ) VALUES (
            NEW.id, NEW.exam, NEW.subject, NEW.student_id, NEW.marks, NEW.updated_at
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for INSERT and UPDATE operations on marks table
CREATE TRIGGER backup_marks_trigger
AFTER INSERT OR UPDATE ON marks
FOR EACH ROW
EXECUTE FUNCTION backup_marks_function();

-- Create custom_exams table
CREATE TABLE custom_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mm INTEGER NOT NULL CHECK (mm > 0),
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE custom_exams ENABLE ROW LEVEL SECURITY;

-- Policy for inserting data
CREATE POLICY "Allow authenticated users to insert data"
ON custom_exams
FOR INSERT
TO authenticated
WITH CHECK ( true );

-- Policy for updating data
CREATE POLICY "Allow authenticated users to update data"
ON custom_exams
FOR UPDATE
TO authenticated
USING ( true );

-- Policy for deleting data
CREATE POLICY "Allow authenticated users to delete data"
ON custom_exams
FOR DELETE
TO authenticated
USING ( true );

-- Policy for selecting data for authenticated users
CREATE POLICY "Allow authenticated users to select data"
ON custom_exams
FOR SELECT
TO authenticated
USING ( true );

-- Policy for selecting data for anonymous users
CREATE POLICY "Allow anonymous users to select data"
ON custom_exams
FOR SELECT
TO anon
USING ( true );

-- Create a view that matches the structure of the original marks table
CREATE OR REPLACE VIEW marks_view WITH (security_invoker = true)
AS
SELECT 
    m.id,
    m.exam,
    m.subject,
    s.name AS student,
    s.class,
    m.marks,
    m.updated_at
FROM 
    marks m
JOIN 
    students s ON m.student_id = s.id;

-- Create a view that matches the structure of the original marks_backup table
CREATE OR REPLACE VIEW marks_backup_view WITH (security_invoker = true)
AS
SELECT 
    mb.id,
    mb.exam,
    mb.subject,
    s.name AS student,
    s.class,
    mb.marks,
    mb.updated_at,
    mb.backup_timestamp,
    mb.backup_id
FROM 
    marks_backup mb
JOIN 
    students s ON mb.student_id = s.id;

-- Create a function to be called by the INSERT trigger
CREATE OR REPLACE FUNCTION marks_view_insert_function()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    existing_id UUID;
BEGIN
    -- Find the student ID based on name and class
    SELECT id INTO v_student_id
    FROM students
    WHERE name = NEW.student AND class = NEW.class;
    
    -- If student not found, raise exception
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student with name % and class % not found', NEW.student, NEW.class;
    END IF;
    
    -- Check if a record with same exam, subject, and student_id already exists
    SELECT m.id INTO existing_id
    FROM marks m
    WHERE m.exam = NEW.exam
    AND m.subject = NEW.subject
    AND m.student_id = v_student_id;
    
    IF existing_id IS NOT NULL THEN
        -- Update the existing record (upsert behavior)
        UPDATE marks
        SET marks = NEW.marks,
            updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
        WHERE id = existing_id
        RETURNING id INTO NEW.id;
    ELSE
        -- Insert into the marks table
        INSERT INTO marks (
            id,
            exam,
            subject,
            student_id,
            marks,
            updated_at
        ) VALUES (
            COALESCE(NEW.id, gen_random_uuid()),
            NEW.exam,
            NEW.subject,
            v_student_id,
            NEW.marks,
            COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
        )
        RETURNING id INTO NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create a function to be called by the UPDATE trigger
CREATE OR REPLACE FUNCTION marks_view_update_function()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
    affected_rows INTEGER;
    conflicting_id UUID;
BEGIN
    -- Find the student ID based on name and class
    SELECT id INTO v_student_id
    FROM students
    WHERE name = NEW.student AND class = NEW.class;
    
    -- If student not found, raise exception
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student with name % and class % not found', NEW.student, NEW.class;
    END IF;
    
    -- Check for potential conflicts
    IF NEW.exam != OLD.exam OR NEW.subject != OLD.subject OR NEW.student != OLD.student OR NEW.class != OLD.class THEN
        SELECT m.id INTO conflicting_id
        FROM marks m
        JOIN students s ON m.student_id = s.id
        WHERE m.exam = NEW.exam
        AND m.subject = NEW.subject
        AND s.name = NEW.student
        AND s.class = NEW.class
        AND m.id != OLD.id;
        
        IF conflicting_id IS NOT NULL THEN
            RAISE EXCEPTION 'Update would violate unique constraint. A record with this exam, subject, and student already exists (id: %)', conflicting_id;
        END IF;
    END IF;
    
    -- Update the marks table
    UPDATE marks
    SET 
        exam = NEW.exam,
        subject = NEW.subject,
        student_id = v_student_id,
        marks = NEW.marks,
        updated_at = COALESCE(NEW.updated_at, CURRENT_TIMESTAMP)
    WHERE id = OLD.id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows = 0 THEN
        RAISE EXCEPTION 'Record with ID % not found in marks table', OLD.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;


-- Create the INSERT trigger on marks_view
CREATE TRIGGER marks_view_insert
INSTEAD OF INSERT ON marks_view
FOR EACH ROW
EXECUTE FUNCTION marks_view_insert_function();

-- Create the UPDATE trigger on marks_view
CREATE TRIGGER marks_view_update
INSTEAD OF UPDATE ON marks_view
FOR EACH ROW
EXECUTE FUNCTION marks_view_update_function();


-- Trigger function to prevent deletion of students with non-NULL marks records
CREATE OR REPLACE FUNCTION prevent_student_delete()
RETURNS TRIGGER AS $$
DECLARE
    non_null_marks_count INTEGER;
BEGIN
    -- Check if there are any marks records with non-NULL marks for this student
    SELECT COUNT(*) INTO non_null_marks_count
    FROM marks
    WHERE student_id = OLD.id AND marks IS NOT NULL;

    -- If there are non-NULL marks records, update the class by appending " (LEFT NOW)" to the existing class
    IF non_null_marks_count > 0 THEN
        -- Cancel the delete operation
        UPDATE students
        SET class = OLD.class || ' (LEFT NOW)'
        WHERE id = OLD.id;

        -- Return NULL to prevent the original DELETE operation
        RETURN NULL;
    ELSE
        -- No non-NULL marks records found, proceed with normal deletion
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the students table
CREATE TRIGGER check_marks_before_delete
BEFORE DELETE ON students
FOR EACH ROW
EXECUTE FUNCTION prevent_student_delete();


-- Create a function to fetch duplicate entries in the marks_backup_view for fraud detection or version tracking
CREATE OR REPLACE FUNCTION get_multiple_marks_updates()
RETURNS TABLE (
  id UUID,
  exam TEXT,
  subject TEXT,
  student TEXT,
  class TEXT,
  marks NUMERIC(5,2),
  updated_at TIMESTAMP WITHOUT TIME ZONE,
  backup_timestamp TIMESTAMP WITHOUT TIME ZONE,
  backup_id UUID
) 
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  WITH student_exam_subject_counts AS (
    SELECT 
      mbv.student AS student_name,
      mbv.class AS class_name,
      mbv.exam AS exam_name,
      mbv.subject AS subject_name,
      COUNT(*) as update_count,
      SUM(CASE WHEN mbv.marks IS NULL THEN 1 ELSE 0 END) as null_count
    FROM 
      marks_backup_view mbv
    GROUP BY 
      mbv.student, mbv.class, mbv.exam, mbv.subject
    HAVING 
      COUNT(*) > 1
  ),
  filtered_students AS (
    SELECT 
      ses.student_name,
      ses.class_name,
      ses.exam_name,
      ses.subject_name
    FROM 
      student_exam_subject_counts ses
    WHERE 
      NOT (ses.update_count = 2 AND ses.null_count = 1)
  )
  SELECT 
    mbv.id,
    mbv.exam,
    mbv.subject,
    mbv.student,
    mbv.class,
    mbv.marks,
    mbv.updated_at,
    mbv.backup_timestamp,
    mbv.backup_id
  FROM 
    marks_backup_view mbv
  JOIN 
    filtered_students fs 
    ON mbv.student = fs.student_name 
   AND mbv.class = fs.class_name
   AND mbv.exam = fs.exam_name 
   AND mbv.subject = fs.subject_name
  ORDER BY 
    mbv.class ASC,
    mbv.student ASC,
    mbv.backup_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate marks of all subjects for a particular exam and class
CREATE OR REPLACE FUNCTION get_total_marks(p_exam TEXT, p_class TEXT)
RETURNS TABLE (
    exam TEXT,
    subject TEXT,
    student TEXT,
    class TEXT,
    marks NUMERIC
) 
SECURITY INVOKER AS
$$
BEGIN
    RETURN QUERY
    SELECT 
        mv.exam,
        'Overall Aggregate' AS subject, -- Replacing subject with 'Overall Aggregate' to indicate aggregation
        mv.student,
        mv.class,
        SUM(mv.marks) AS marks
    FROM 
        marks_view mv
    WHERE 
        mv.exam = p_exam
        AND mv.class = p_class
    GROUP BY 
        mv.student, mv.class, mv.exam
    ORDER BY 
        mv.student ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to allow deletions from the marks table by targeting a specific exam, class and subject
CREATE OR REPLACE FUNCTION delete_marks_by_exam_subject_class(
    p_exam TEXT,
    p_subject TEXT,
    p_class TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM marks
    WHERE exam = p_exam
      AND subject = p_subject
      AND student_id IN (
          SELECT id FROM students WHERE class = p_class
      );

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$;

-- Function to calculate percentages for all classes based on an aggregate marks map
CREATE OR REPLACE FUNCTION calculate_class_percentages(
    exam_name TEXT,
    aggregate_marks JSONB,
    VARIADIC subjects TEXT[] DEFAULT ARRAY['All']
) 
RETURNS TABLE (
    class_name TEXT,
    obtained_marks NUMERIC,
    total_marks NUMERIC,
    percentage NUMERIC(6,3),
    rank BIGINT
) 
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    WITH student_class_data AS (
        SELECT 
            mv.class,
            SPLIT_PART(mv.class, '-', 1) AS class_num,
            mv.student,
            SUM(mv.marks) AS student_marks
        FROM 
            marks_view mv
        WHERE 
            mv.exam = exam_name
            AND mv.marks IS NOT NULL
            AND (
                subjects[1] = 'All' 
                OR 
                mv.subject = ANY(subjects)
            )
        GROUP BY 
            mv.class,
            mv.student
    ),
    class_data AS (
        SELECT 
            scd.class,
            scd.class_num,
            COUNT(DISTINCT scd.student) AS student_count,
            SUM(scd.student_marks) AS total_obtained_marks
        FROM 
            student_class_data scd
        GROUP BY 
            scd.class,
            scd.class_num
    ),
    class_percentages AS (
        SELECT 
            cd.class,
            cd.total_obtained_marks,
            cd.student_count * (aggregate_marks->cd.class_num->>exam_name)::NUMERIC AS max_total_marks,
            CASE 
                WHEN cd.student_count * (aggregate_marks->cd.class_num->>exam_name)::NUMERIC = 0 THEN 0
                ELSE ROUND((cd.total_obtained_marks / (cd.student_count * (aggregate_marks->cd.class_num->>exam_name)::NUMERIC) * 100), 3)
            END AS percent
        FROM 
            class_data cd
        WHERE
            (aggregate_marks->cd.class_num->>exam_name) IS NOT NULL
    ),
    ranked_percentages AS (
        SELECT 
            cp.class,
            cp.total_obtained_marks,
            cp.max_total_marks,
            cp.percent,
            DENSE_RANK() OVER (ORDER BY cp.percent DESC) AS class_rank
        FROM 
            class_percentages cp
    )
    SELECT 
        rp.class,
        rp.total_obtained_marks,
        rp.max_total_marks,
        rp.percent,
        rp.class_rank
    FROM 
        ranked_percentages rp
    ORDER BY 
        rp.class_rank, rp.class;
END;
$$ LANGUAGE plpgsql;


-- Function to securely join two tables based on an access token
CREATE OR REPLACE FUNCTION secure_join_tables(
    table1 text,
    table2 text,
    match_column1 text,
    match_column2 text,
    columns_table1 text[],
    columns_table2 text[],
    access_token text
) RETURNS json
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    query_text text;
    access_token_column_exists boolean;
    column_list text := '';
    result_json json;
    -- Whitelist definitions
    allowed_tables text[] := ARRAY['students', 'marks'];
    allowed_columns_table1 text[] := ARRAY['name', 'class'];
    allowed_columns_table2 text[] := ARRAY['subject', 'exam', 'marks'];
    allowed_match_columns text[] := ARRAY['id', 'student_id'];
    column_valid boolean;
    regex_pattern text := '^[a-zA-Z0-9_]+$'; -- Only alphanumeric and underscore
BEGIN
    -- Validate table names format before checking whitelist
    IF table1 !~ regex_pattern OR table2 !~ regex_pattern THEN
        RAISE EXCEPTION 'Invalid table name format. Only alphanumeric characters and underscores allowed.';
    END IF;
    
    -- Check if tables are in the whitelist (exact match required)
    IF NOT (table1 = ANY(allowed_tables) AND table2 = ANY(allowed_tables)) THEN
        RAISE EXCEPTION 'Invalid table names. Only "students" and "marks" are allowed';
    END IF;
    
    -- Validate match columns format and against whitelist
    IF match_column1 !~ regex_pattern OR match_column2 !~ regex_pattern THEN
        RAISE EXCEPTION 'Invalid match column format. Only alphanumeric characters and underscores allowed.';
    END IF;
    
    IF NOT (match_column1 = ANY(allowed_match_columns) AND match_column2 = ANY(allowed_match_columns)) THEN
        RAISE EXCEPTION 'Invalid match columns. Allowed columns are: "id", "student_id", "mark_id"';
    END IF;
    
    -- Check if columns for table1 are valid format and in the whitelist
    IF array_length(columns_table1, 1) > 0 THEN
        FOR i IN 1..array_length(columns_table1, 1) LOOP
            -- Validate format
            IF columns_table1[i] !~ regex_pattern THEN
                RAISE EXCEPTION 'Invalid column name format "%" for table1. Only alphanumeric characters and underscores allowed.', columns_table1[i];
            END IF;
            
            -- Check against whitelist
            column_valid := false;
            FOR j IN 1..array_length(allowed_columns_table1, 1) LOOP
                IF columns_table1[i] = allowed_columns_table1[j] THEN
                    column_valid := true;
                    EXIT;
                END IF;
            END LOOP;
            
            IF NOT column_valid THEN
                RAISE EXCEPTION 'Invalid column name "%" for table1. Allowed columns are: "name", "class"', columns_table1[i];
            END IF;
        END LOOP;
    END IF;
    
    -- Check if columns for table2 are valid format and in the whitelist
    IF array_length(columns_table2, 1) > 0 THEN
        FOR i IN 1..array_length(columns_table2, 1) LOOP
            -- Validate format
            IF columns_table2[i] !~ regex_pattern THEN
                RAISE EXCEPTION 'Invalid column name format "%" for table2. Only alphanumeric characters and underscores allowed.', columns_table2[i];
            END IF;
            
            -- Check against whitelist
            column_valid := false;
            FOR j IN 1..array_length(allowed_columns_table2, 1) LOOP
                IF columns_table2[i] = allowed_columns_table2[j] THEN
                    column_valid := true;
                    EXIT;
                END IF;
            END LOOP;
            
            IF NOT column_valid THEN
                RAISE EXCEPTION 'Invalid column name "%" for table2. Allowed columns are: "subject", "exam", "marks"', columns_table2[i];
            END IF;
        END LOOP;
    END IF;

    -- Check if access_token column exists in table1
    EXECUTE format('
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = %L AND column_name = %L
        )', table1, 'access_token')
    INTO access_token_column_exists;

    -- Validate conditions for access_token
    IF NOT access_token_column_exists THEN
        RAISE EXCEPTION 'Access token column does not exist in %', table1;
    END IF;

    IF access_token IS NULL OR access_token = '' THEN
        RAISE EXCEPTION 'Access token cannot be null or empty';
    END IF;

    -- Validate UUID format of access_token
    BEGIN
        -- Attempt to cast access_token to UUID
        PERFORM access_token::uuid;
    EXCEPTION
        WHEN others THEN
            RAISE EXCEPTION 'Invalid UUID format for access_token: %', access_token;
    END;

    -- Build the column list for the result set
    -- First add columns from table1
    FOR i IN 1..array_length(columns_table1, 1) LOOP
        IF i > 1 THEN
            column_list := column_list || ', ';
        END IF;
        column_list := column_list || format('%I.%I as %I', table1, columns_table1[i], columns_table1[i]);
    END LOOP;

    -- Then add columns from table2
    IF array_length(columns_table1, 1) > 0 AND array_length(columns_table2, 1) > 0 THEN
        column_list := column_list || ', ';
    END IF;

    FOR i IN 1..array_length(columns_table2, 1) LOOP
        IF i > 1 THEN
            column_list := column_list || ', ';
        END IF;
        column_list := column_list || format('%I.%I as %I', table2, columns_table2[i], columns_table2[i]);
    END LOOP;

    -- Construct and execute the query with to_json to materialize the results
    query_text := format('
        SELECT json_agg(row_to_json(t))
        FROM (
            SELECT %s
            FROM %I
            JOIN %I ON %I.%I = %I.%I
            WHERE %I.access_token = %L::uuid
        ) t
    ', column_list, table1, table2, table1, match_column1, table2, match_column2, table1, access_token);

    EXECUTE query_text INTO result_json;

    -- Return empty array instead of null if no results found
    RETURN COALESCE(result_json, '[]'::json);
END;
$$;

-- Function to allow editing of custom exam details (name & mm) and also update corresponding marks records
CREATE OR REPLACE FUNCTION update_custom_exam(
    p_old_exam_name TEXT,
    p_new_exam_name TEXT,
    p_new_mm INTEGER,
    p_class TEXT,
    p_subject TEXT
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    mm INTEGER,
    class TEXT,
    subject TEXT,
    created_at TIMESTAMP,
    marks_updated_count INTEGER
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_exam_exists BOOLEAN := FALSE;
    v_new_name_conflict BOOLEAN := FALSE;
    v_marks_updated_count INTEGER := 0;
    v_custom_exam_record RECORD;
BEGIN
    -- Validate input parameters
    IF p_old_exam_name IS NULL OR p_old_exam_name = '' THEN
        RAISE EXCEPTION 'Old exam name cannot be null or empty';
    END IF;
    
    IF p_new_exam_name IS NULL OR p_new_exam_name = '' THEN
        RAISE EXCEPTION 'New exam name cannot be null or empty';
    END IF;
    
    IF p_new_mm IS NULL OR p_new_mm <= 0 THEN
        RAISE EXCEPTION 'Maximum marks (mm) must be a positive integer';
    END IF;
    
    IF p_class IS NULL OR p_class = '' THEN
        RAISE EXCEPTION 'Class cannot be null or empty';
    END IF;
    
    IF p_subject IS NULL OR p_subject = '' THEN
        RAISE EXCEPTION 'Subject cannot be null or empty';
    END IF;

    -- Check if the exam exists for the specified class and subject
    SELECT EXISTS(
        SELECT 1 FROM custom_exams ce
        WHERE ce.name = p_old_exam_name 
        AND ce.class = p_class 
        AND ce.subject = p_subject
    ) INTO v_exam_exists;
    
    IF NOT v_exam_exists THEN
        RAISE EXCEPTION 'Exam "%" does not exist for class "%" and subject "%"', 
            p_old_exam_name, p_class, p_subject;
    END IF;

    -- Check if the new exam name already exists for the same class and subject
    -- (only if the new name is different from the old name)
    IF p_old_exam_name != p_new_exam_name THEN
        SELECT EXISTS(
            SELECT 1 FROM custom_exams ce
            WHERE ce.name = p_new_exam_name 
            AND ce.class = p_class 
            AND ce.subject = p_subject
        ) INTO v_new_name_conflict;
        
        IF v_new_name_conflict THEN
            RAISE EXCEPTION 'An exam with name "%" already exists for class "%" and subject "%"', 
                p_new_exam_name, p_class, p_subject;
        END IF;
    END IF;

    -- Update the custom_exams table first
    UPDATE custom_exams ce
    SET 
        name = p_new_exam_name,
        mm = p_new_mm
    WHERE 
        ce.name = p_old_exam_name 
        AND ce.class = p_class 
        AND ce.subject = p_subject;

    -- Update the marks table for matching records
    -- Join with students table to get the class information
    WITH marks_to_update AS (
        SELECT m.id
        FROM marks m
        INNER JOIN students s ON m.student_id = s.id
        WHERE 
            m.exam = p_old_exam_name
            AND m.subject = p_subject
            AND s.class = p_class
    )
    UPDATE marks m
    SET 
        exam = p_new_exam_name,
        updated_at = CURRENT_TIMESTAMP
    FROM marks_to_update mtu
    WHERE m.id = mtu.id;

    -- Get the count of updated marks records
    GET DIAGNOSTICS v_marks_updated_count = ROW_COUNT;

    -- Retrieve the updated exam record to return
    SELECT 
        ce.id, 
        ce.name, 
        ce.mm, 
        ce.class, 
        ce.subject, 
        ce.created_at
    INTO v_custom_exam_record
    FROM custom_exams ce
    WHERE 
        ce.name = p_new_exam_name 
        AND ce.class = p_class 
        AND ce.subject = p_subject;

    -- Return the updated exam details along with marks update count
    RETURN QUERY
    SELECT 
        v_custom_exam_record.id,
        v_custom_exam_record.name,
        v_custom_exam_record.mm,
        v_custom_exam_record.class,
        v_custom_exam_record.subject,
        v_custom_exam_record.created_at,
        v_marks_updated_count;

EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception to ensure transaction rollback
        RAISE;
END;
$$;



-- Function to get the entire student list from the students table, first sorted by class and then by student name
CREATE OR REPLACE FUNCTION get_students_sorted()
RETURNS TABLE(
    name TEXT,
    class TEXT,
    gender TEXT,
    house TEXT
)
SECURITY INVOKER
LANGUAGE SQL
AS $$
    SELECT 
        s.name,
        s.class,
        s.gender,
        s.house
    FROM students s
    ORDER BY 
        -- First sort by numeric part of class (grade level)
        CASE 
            WHEN s.class ~ '^[0-9]+' THEN 
                CAST(SUBSTRING(s.class FROM '^([0-9]+)') AS INTEGER)
            ELSE 999  -- Put non-numeric classes at the end
        END,
        -- Then sort by the section part (after hyphen) alphabetically
        CASE 
            WHEN s.class ~ '-' THEN 
                SUBSTRING(s.class FROM '-(.*)$')
            ELSE s.class  -- For classes without hyphen, use the whole class name
        END,
        -- Finally sort by name ascending
        s.name ASC;
$$;


-- A temporary function used for gender/house details collection from teachers for students table in a quick and unauthenticated manner
-- This function updates student information based on JSON inputs for house and gender.
-- It now returns a table with a single 'result' column: 1 for success, 0 for failure.
CREATE OR REPLACE FUNCTION update_students_info(
    houses JSON,
    gender_info JSON
) 
RETURNS TABLE(result INTEGER) -- Changed return type to return a table
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    house_key TEXT;
    house_ids JSON;
    student_id UUID;
    gender_key TEXT;
    gender_ids JSON;
    update_count INTEGER := 0;
    total_updates INTEGER := 0;
BEGIN
    -- The main logic is wrapped in a block for exception handling.
    BEGIN
        -- Process the 'houses' JSON object.
        -- It iterates through each house (e.g., "Ruby", "Sapphire").
        FOR house_key IN SELECT json_object_keys(houses)
        LOOP
            house_ids := houses->house_key;
            
            -- It proceeds only if there are student IDs for the current house.
            IF json_array_length(house_ids) > 0 THEN
                -- It updates the 'house' for each student ID in the array.
                FOR student_id IN 
                    SELECT (json_array_elements_text(house_ids))::UUID
                LOOP
                    UPDATE students 
                    SET house = house_key
                    WHERE id = student_id;
                    
                    GET DIAGNOSTICS update_count = ROW_COUNT;
                    total_updates := total_updates + update_count;
                END LOOP;
            END IF;
        END LOOP;
        
        -- Process the 'gender_info' JSON object.
        -- It iterates through each gender (e.g., "male", "female").
        FOR gender_key IN SELECT json_object_keys(gender_info)
        LOOP
            gender_ids := gender_info->gender_key;
            
            -- It proceeds only if there are student IDs for the current gender.
            IF json_array_length(gender_ids) > 0 THEN
                -- It updates the 'gender' for each student ID in the array.
                FOR student_id IN 
                    SELECT (json_array_elements_text(gender_ids))::UUID
                LOOP
                    UPDATE students 
                    SET gender = CASE 
                        WHEN gender_key = 'male' THEN 'M'
                        WHEN gender_key = 'female' THEN 'F'
                        ELSE gender_key
                    END
                    WHERE id = student_id;
                    
                    GET DIAGNOSTICS update_count = ROW_COUNT;
                    total_updates := total_updates + update_count;
                END LOOP;
            END IF;
        END LOOP;
        
        -- If all updates complete without error, return a row with result = 1.
        RETURN QUERY SELECT 1;
        
    EXCEPTION
        -- If any error occurs during the process, it's caught here.
        WHEN OTHERS THEN
            -- Logs the specific error message to the server logs for debugging.
            RAISE NOTICE 'Error in update_students_info: %', SQLERRM;
            -- Returns a row with result = 0 to indicate failure.
            RETURN QUERY SELECT 0;
    END;
END;
$$;

-- Example usage:
/*
-- To call the function and see the result set:
SELECT * FROM update_students_info(
    '{"Ruby": ["003f2b2f-38cc-48aa-ab33-1a0f61bd66b9", "008e8e76-0053-41c1-bc59-0db3e67bfe25"], "Sapphire": ["0105927c-5d79-47a5-98c8-24d2a3a1c6c5"], "Topaz": ["018780ab-c385-43a8-acf4-f35c74b10134"], "Emerald": []}'::JSON,
    '{"male": ["003f2b2f-38cc-48aa-ab33-1a0f61bd66b9", "008e8e76-0053-41c1-bc59-0db3e67bfe25"], "female": ["0105927c-5d79-47a5-98c8-24d2a3a1c6c5", "018780ab-c385-43a8-acf4-f35c74b10134"]}'::JSON
);
*/
