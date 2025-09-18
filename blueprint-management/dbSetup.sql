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