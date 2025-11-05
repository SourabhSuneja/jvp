-- Clean up first
DROP TABLE IF EXISTS sport_participations, sport_events, housemasters;

DROP FUNCTION IF EXISTS public.manage_sport_participations(jsonb);

-- events table to store all games
CREATE TABLE sport_events (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(255) NOT NULL,
    class_category VARCHAR(255) NOT NULL,
    
    -- Used to differentiate between different game types
    game_type VARCHAR(50) NOT NULL CHECK (game_type IN ('Individual', 'Team', 'Grouped')),

    -- RENAMED: from max_participants to group_size
    -- This column's meaning now depends on game_type:
    -- - INDIVIDUAL: 1 (by convention, one person is a group of 1)
    -- - TEAM: The max participants per house (e.g., 10 for Kho Kho)
    -- - GROUPED: The size of one group/pair (e.g., 2 for games that are played in pairs, such as relay races)
    group_size INTEGER NOT NULL, 
    
    gender_filter VARCHAR(50) CHECK (gender_filter IN ('Boys', 'Girls', 'Mixed')),
    
    CONSTRAINT unique_event_definition UNIQUE (game_name, class_category)
);


-- Create the 'sport_participations' table with the grouping ID for team formation
CREATE TABLE sport_participations (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    event_id INT NOT NULL,
    
    -- This column links participants together.
    -- e.g., players in the same team/pair in a game will share the same UUID in this column
    -- for the same event_id.
    participant_group_id UUID NOT NULL,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES sport_events(id) ON DELETE CASCADE,
    
    -- A student can't be in the same event twice
    CONSTRAINT unique_student_event UNIQUE (student_id, event_id)
);

--Table to store housemasters
CREATE TABLE housemasters (
    id SERIAL PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    house TEXT NOT NULL CHECK (house IN ('Ruby', 'Emerald', 'Topaz', 'Sapphire'))
);

-- Function to manage sport participations (to be called from front-end for adding/removing participants)
CREATE OR REPLACE FUNCTION public.manage_sport_participations(
    changes_json JSONB
)
RETURNS TABLE(added INT, removed INT)
LANGUAGE plpgsql
SECURITY DEFINER
-- Set a secure search path to prevent hijacking and ensure tables are found
SET search_path = public, auth
AS $$
DECLARE
    -- The ID of the user calling this function
    auth_id UUID := auth.uid();
    
    -- Flag for admin permissions
    is_admin BOOLEAN := false;
    
    -- Variables to store the user's scope (class and/or house)
    -- These will be NULL if the user does not hold the role.
    user_class TEXT;
    user_house TEXT;
    
    -- Variables for looping and validation
    change_record JSONB;
    student_id_to_check UUID;
    student_class TEXT;
    student_house TEXT;
    
    -- Flags to track if the *entire* batch of students is valid
    -- for a specific role.
    can_manage_by_class BOOLEAN;
    can_manage_by_house BOOLEAN;
    
    -- Counters for the final report
    added_count INT := 0;
    removed_count INT := 0;
BEGIN
    -- 1. IDENTIFY ADMIN ROLE
    -- Check if the user's ID exists in the admins table.
    SELECT EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth_id
    ) INTO is_admin;

    -- 2. IDENTIFY USER ROLE & SCOPE (if not an admin)
    -- If the user is not an admin, check for their other roles.
    IF NOT is_admin THEN
        -- Check if the user is a class teacher
        SELECT class INTO user_class
        FROM public.class_teachers
        WHERE teacher_id = auth_id;

        -- Check if the user is a housemaster (independently)
        SELECT house INTO user_house
        FROM public.housemasters
        WHERE teacher_id = auth_id;
    END IF;

    -- 3. AUTHORIZATION CHECK
    -- If the user is not an admin AND has no other role, reject the operation.
    IF user_class IS NULL AND user_house IS NULL AND NOT is_admin THEN
        RAISE EXCEPTION 'Access Denied: You must be an admin, class teacher, or housemaster to perform this operation.';
    END IF;

    -- 4. PRE-VALIDATION PASS
    -- We must check if the *entire* batch of students satisfies
    -- *at least one* of the user's roles (all in class OR all in house).
    
    -- Initialize permission flags.
    -- A user *can* manage by a scope only if they are assigned that scope.
    -- We start by assuming true (if they have the role) and let the
    -- loop flip these to false if any student is non-compliant.
    can_manage_by_class := (user_class IS NOT NULL);
    can_manage_by_house := (user_house IS NOT NULL);
    
    FOR change_record IN SELECT * FROM jsonb_array_elements(changes_json)
    LOOP
        student_id_to_check := (change_record ->> 'student_id')::UUID;

        -- Get the student's details for validation
        SELECT class, house INTO student_class, student_house
        FROM public.students
        WHERE id = student_id_to_check;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid Operation: Student with ID % does not exist.', student_id_to_check;
        END IF;

        -- 5. APPLY ROLE-BASED SECURITY CHECKS (during loop)
        -- Only apply these checks if the user is NOT an admin.
        IF NOT is_admin THEN
            -- Update permission flags. If a student is found who is outside
            -- a scope, that scope becomes invalid for this *entire* batch.
            
            -- If we still thought all students were in the class,
            -- check this student.
            IF can_manage_by_class AND student_class IS DISTINCT FROM user_class THEN
                can_manage_by_class := false;
            END IF;

            -- If we still thought all students were in the house,
            -- check this student.
            IF can_manage_by_house AND student_house IS DISTINCT FROM user_house THEN
                can_manage_by_house := false;
            END IF;
        END IF;
        -- If is_admin is true, all checks in this block are skipped.
        
    END LOOP; -- End of pre-validation pass

    -- 5. FINAL BATCH VALIDATION (after loop)
    -- This check runs *after* the loop, once we know if the *entire*
    -- batch is valid for at least one of the user's roles.
    IF NOT is_admin THEN
        -- The user is allowed if *either* all students were in their class
        -- *or* all students were in their house.
        IF NOT (can_manage_by_class OR can_manage_by_house) THEN
            RAISE EXCEPTION 'Access Denied: You can only manage students if ALL are in your class (%) or ALL are in your house (%). This batch contains mixed students.', user_class, user_house;
        END IF;
    END IF;

    -- 6. EXECUTION PASS
    -- All checks passed. Now, loop again to apply the changes.
    FOR change_record IN SELECT * FROM jsonb_array_elements(changes_json)
    LOOP
        IF (change_record ->> 'change') = 'add' THEN
            -- Add student to event.
            -- ON CONFLICT: If student is already in the event (unique_student_event),
            -- do nothing. This prevents errors and duplicate entries.
            INSERT INTO public.sport_participations (student_id, event_id, participant_group_id)
            VALUES (
                (change_record ->> 'student_id')::UUID,
                (change_record ->> 'event_id')::INT,
                (change_record ->> 'participant_group_id')::UUID
            )
            ON CONFLICT (student_id, event_id) DO NOTHING;
            
            -- 'FOUND' is a special PL/pgSQL variable.
            -- After INSERT...ON CONFLICT, it's true if the row was inserted
            -- and false if the conflict occurred (DO NOTHING).
            IF FOUND THEN
                added_count := added_count + 1;
            END IF;

        ELSIF (change_record ->> 'change') = 'remove' THEN
            -- Remove student from event
            DELETE FROM public.sport_participations
            WHERE student_id = (change_record ->> 'student_id')::UUID
              AND event_id = (change_record ->> 'event_id')::INT;
            
            -- After DELETE, 'FOUND' is true if at least one row was deleted.
            IF FOUND THEN
                removed_count := removed_count + 1;
            END IF;
        END IF;
    END LOOP;

    -- 7. RETURN SUMMARY
    -- Assign the final counts to the output table columns
    added := added_count;
    removed := removed_count;
    
    -- Return the single summary row
    RETURN NEXT;
    RETURN;
    
END;
$$;

-- Enable RLS on all tables
ALTER TABLE sport_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE housemasters ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows both authenticated and anon users to select sport events (games)
CREATE POLICY select_sport_events_policy
ON sport_events
FOR SELECT
TO authenticated, anon
USING (true);

-- Create a policy that allows both authenticated and anon users to select sport participation details
CREATE POLICY select_sport_participations_policy
ON sport_participations
FOR SELECT
TO authenticated, anon
USING (true);
