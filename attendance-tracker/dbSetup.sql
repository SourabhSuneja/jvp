-- Create attendance_admins table
CREATE TABLE attendance_admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

create table attendance (
  id uuid not null default gen_random_uuid (),
  student_id uuid null,
  class text not null,
  date date not null default CURRENT_DATE,
  status text not null,
  updated_at timestamp without time zone null default now(),
  extra jsonb null,
  constraint attendance_pkey primary key (id),
  constraint unique_daily_attendance unique (student_id, date),
  constraint attendance_student_id_fkey foreign KEY (student_id) references students (id) on delete CASCADE
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all authenticated users"
ON attendance
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins have full write access"
ON attendance
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM attendance_admins WHERE id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM attendance_admins WHERE id = auth.uid()
  )
);

CREATE POLICY "Teachers modify only their own class"
ON attendance
FOR ALL
TO authenticated
USING (
  class IN (
    SELECT class FROM class_teachers WHERE teacher_id = auth.uid()
  )
)
WITH CHECK (
  class IN (
    SELECT class FROM class_teachers WHERE teacher_id = auth.uid()
  )
);
