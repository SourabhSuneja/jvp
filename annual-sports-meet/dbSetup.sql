-- Clean up first
DROP TABLE IF EXISTS sport_participations, sport_events, housemasters;

DROP FUNCTION IF EXISTS public.manage_sport_participations(jsonb);
DROP FUNCTION IF EXISTS get_sport_participants();
DROP FUNCTION IF EXISTS get_student_participations(UUID);

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

-- Function to get participants of all games from all houses
CREATE OR REPLACE FUNCTION get_sport_participants()
RETURNS TABLE (
    student_name TEXT,
    student_class TEXT,
    student_house TEXT,
    student_gender TEXT,
    game_name VARCHAR(255),
    class_category VARCHAR(255),
    group_size INTEGER,
    gender_filter VARCHAR(50),
    game_type VARCHAR(50),
    participant_group_id UUID,
    access_token UUID
)
SECURITY INVOKER
LANGUAGE sql
STABLE
AS $$
    SELECT 
        s.name AS student_name,
        s.class AS student_class,
        s.house AS student_house,
        s.gender AS student_gender,
        se.game_name,
        se.class_category,
        se.group_size,
        se.gender_filter,
        se.game_type,
        sp.participant_group_id,
        s.access_token
    FROM sport_events se
    LEFT JOIN sport_participations sp ON se.id = sp.event_id
    LEFT JOIN students s ON sp.student_id = s.id
    ORDER BY se.id, sp.participant_group_id, s.name;
$$;

-- Function to get participations for a specific student and their teammates
CREATE OR REPLACE FUNCTION get_student_participations(p_access_token UUID)
RETURNS TABLE(
    student_id UUID,
    student_name TEXT,
    student_class TEXT,
    student_house TEXT,
    student_gender TEXT,
    event_id INT,
    game_name VARCHAR(255),
    class_category VARCHAR(255),
    group_size INTEGER,
    gender_filter VARCHAR(50),
    game_type VARCHAR(50),
    participant_group_id UUID,
    access_token UUID
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    RETURN QUERY
    WITH student_groups AS (
        SELECT
            sp.participant_group_id
        FROM sport_participations AS sp
        JOIN students AS s
            ON sp.student_id = s.id
        WHERE
            s.access_token = p_access_token
    )
    SELECT
        s.id AS student_id,
        s.name AS student_name,
        s.class AS student_class,
        s.house AS student_house,
        s.gender AS student_gender,
        se.id AS event_id,
        se.game_name,
        se.class_category,
        se.group_size,
        se.gender_filter,
        se.game_type,
        sp.participant_group_id,
        s.access_token
    FROM
        sport_participations AS sp
    JOIN
        students AS s ON sp.student_id = s.id
    JOIN
        sport_events AS se ON sp.event_id = se.id
    WHERE
        sp.participant_group_id IN (
            SELECT sg.participant_group_id FROM student_groups AS sg
        );
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


-- Seed Data (Game entries, housemasters etc)


-- #############################################
-- ###           CLASS 3 TO 6                ###
-- #############################################

-- =========== CLASS 3-6: TEAM GAMES ===========
-- (Groups: '3 to 4' and '5 to 6')

-- Kho-Kho (Boys/Girls, 11 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Kho-Kho (Boys)', '3 to 4', 'Team', 11, 'Boys'),
('Kho-Kho (Girls)', '3 to 4', 'Team', 11, 'Girls'),
('Kho-Kho (Boys)', '5 to 6', 'Team', 11, 'Boys'),
('Kho-Kho (Girls)', '5 to 6', 'Team', 11, 'Girls');

-- Kabaddi (Boys/Girls, 11 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Kabaddi (Boys)', '3 to 4', 'Team', 11, 'Boys'),
('Kabaddi (Girls)', '3 to 4', 'Team', 11, 'Girls'),
('Kabaddi (Boys)', '5 to 6', 'Team', 11, 'Boys'),
('Kabaddi (Girls)', '5 to 6', 'Team', 11, 'Girls');

-- Tug of War (Boys/Girls, 9 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Tug of War (Boys)', '3 to 4', 'Team', 9, 'Boys'),
('Tug of War (Girls)', '3 to 4', 'Team', 9, 'Girls'),
('Tug of War (Boys)', '5 to 6', 'Team', 9, 'Boys'),
('Tug of War (Girls)', '5 to 6', 'Team', 9, 'Girls');

-- Satoliya (Boys/Girls, 7 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Satoliya (Boys)', '3 to 4', 'Team', 7, 'Boys'),
('Satoliya (Girls)', '3 to 4', 'Team', 7, 'Girls'),
('Satoliya (Boys)', '5 to 6', 'Team', 7, 'Boys'),
('Satoliya (Girls)', '5 to 6', 'Team', 7, 'Girls');


-- =========== CLASS 3-6: INDIVIDUAL & GROUPED GAMES ===========
-- (Classes: '3', '4', '5', '6')

-- 100M Race (All classes 3-6)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('100M Race (Boys)', '3', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '3', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '4', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '4', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '5', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '5', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '6', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '6', 'Individual', 1, 'Girls');

-- 200M Race (Classes 5 & 6)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('200M Race (Boys)', '5', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '5', 'Individual', 1, 'Girls'),
('200M Race (Boys)', '6', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '6', 'Individual', 1, 'Girls');

-- Relay Race (All classes 3-6, Grouped in pairs)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Relay Race (Boys)', '3', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '3', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '4', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '4', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '5', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '5', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '6', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '6', 'Grouped', 2, 'Girls');

-- 100M Hurdle Race (Classes 3 & 4)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('100M Hurdle Race (Boys)', '3', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '3', 'Individual', 1, 'Girls'),
('100M Hurdle Race (Boys)', '4', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '4', 'Individual', 1, 'Girls');

-- 200M Hurdle Race (Classes 5 & 6)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('200M Hurdle Race (Boys)', '5', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '5', 'Individual', 1, 'Girls'),
('200M Hurdle Race (Boys)', '6', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '6', 'Individual', 1, 'Girls');

-- 100M Back Running (All classes 3-6)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('100M Back Running (Boys)', '3', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '3', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '4', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '4', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '5', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '5', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '6', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '6', 'Individual', 1, 'Girls');

-- Karate (All classes 3-6, Boys only)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Karate (Boys)', '3', 'Individual', 1, 'Boys'),
('Karate (Boys)', '4', 'Individual', 1, 'Boys'),
('Karate (Boys)', '5', 'Individual', 1, 'Boys'),
('Karate (Boys)', '6', 'Individual', 1, 'Boys');

-- Skates (All classes 3-6)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Skates (Boys)', '3', 'Individual', 1, 'Boys'),
('Skates (Girls)', '3', 'Individual', 1, 'Girls'),
('Skates (Boys)', '4', 'Individual', 1, 'Boys'),
('Skates (Girls)', '4', 'Individual', 1, 'Girls'),
('Skates (Boys)', '5', 'Individual', 1, 'Boys'),
('Skates (Girls)', '5', 'Individual', 1, 'Girls'),
('Skates (Boys)', '6', 'Individual', 1, 'Boys'),
('Skates (Girls)', '6', 'Individual', 1, 'Girls');


-- #############################################
-- ###           CLASS 7 TO 12               ###
-- #############################################

-- =========== CLASS 7-12: TEAM GAMES ===========
-- (Groups: '7 to 8' and '9 to 12')

-- Kho-Kho (Boys/Girls, 11 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Kho-Kho (Boys)', '7 to 8', 'Team', 11, 'Boys'),
('Kho-Kho (Girls)', '7 to 8', 'Team', 11, 'Girls'),
('Kho-Kho (Boys)', '9 to 12', 'Team', 11, 'Boys'),
('Kho-Kho (Girls)', '9 to 12', 'Team', 11, 'Girls');

-- Kabaddi (Boys/Girls, 11 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Kabaddi (Boys)', '7 to 8', 'Team', 11, 'Boys'),
('Kabaddi (Girls)', '7 to 8', 'Team', 11, 'Girls'),
('Kabaddi (Boys)', '9 to 12', 'Team', 11, 'Boys'),
('Kabaddi (Girls)', '9 to 12', 'Team', 11, 'Girls');

-- Tug of War (Boys/Girls, 9 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Tug of War (Boys)', '7 to 8', 'Team', 9, 'Boys'),
('Tug of War (Girls)', '7 to 8', 'Team', 9, 'Girls'),
('Tug of War (Boys)', '9 to 12', 'Team', 9, 'Boys'),
('Tug of War (Girls)', '9 to 12', 'Team', 9, 'Girls');

-- Satoliya (Boys/Girls, 7 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Satoliya (Boys)', '7 to 8', 'Team', 7, 'Boys'),
('Satoliya (Girls)', '7 to 8', 'Team', 7, 'Girls'),
('Satoliya (Boys)', '9 to 12', 'Team', 7, 'Boys'),
('Satoliya (Girls)', '9 to 12', 'Team', 7, 'Girls');

-- Cricket (Boys only, 11 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Cricket (Boys)', '7 to 8', 'Team', 11, 'Boys'),
('Cricket (Boys)', '9 to 12', 'Team', 11, 'Boys');

-- Handball (Boys only, 7 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Handball (Boys)', '7 to 12', 'Team', 7, 'Boys');

-- Basketball (Boys/Girls, 7 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Basketball (Boys)', '7 to 8', 'Team', 7, 'Boys'),
('Basketball (Girls)', '7 to 8', 'Team', 7, 'Girls'),
('Basketball (Boys)', '9 to 12', 'Team', 7, 'Boys'),
('Basketball (Girls)', '9 to 12', 'Team', 7, 'Girls');

-- Rollball (Mixed, 6 players)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Rollball (Mixed)', '7 to 12', 'Team', 6, 'Mixed');


-- =========== CLASS 7-12: INDIVIDUAL & GROUPED GAMES ===========
-- (Classes: '7', '8', '9', '10', '11', '12')

-- 100M Race (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('100M Race (Boys)', '7', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '7', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '8', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '8', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '9', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '9', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '10', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '10', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '11', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '11', 'Individual', 1, 'Girls'),
('100M Race (Boys)', '12', 'Individual', 1, 'Boys'),
('100M Race (Girls)', '12', 'Individual', 1, 'Girls');

-- 200M Race (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('200M Race (Boys)', '7', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '7', 'Individual', 1, 'Girls'),
('200M Race (Boys)', '8', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '8', 'Individual', 1, 'Girls'),
('200M Race (Boys)', '9', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '9', 'Individual', 1, 'Girls'),
('200M Race (Boys)', '10', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '10', 'Individual', 1, 'Girls'),
('200M Race (Boys)', '11', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '11', 'Individual', 1, 'Girls'),
('200M Race (Boys)', '12', 'Individual', 1, 'Boys'),
('200M Race (Girls)', '12', 'Individual', 1, 'Girls');

-- Relay Race (All classes 7-12, Grouped in pairs)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Relay Race (Boys)', '7', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '7', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '8', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '8', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '9', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '9', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '10', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '10', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '11', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '11', 'Grouped', 2, 'Girls'),
('Relay Race (Boys)', '12', 'Grouped', 2, 'Boys'),
('Relay Race (Girls)', '12', 'Grouped', 2, 'Girls');

-- 100M Hurdle Race (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('100M Hurdle Race (Boys)', '7', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '7', 'Individual', 1, 'Girls'),
('100M Hurdle Race (Boys)', '8', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '8', 'Individual', 1, 'Girls'),
('100M Hurdle Race (Boys)', '9', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '9', 'Individual', 1, 'Girls'),
('100M Hurdle Race (Boys)', '10', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '10', 'Individual', 1, 'Girls'),
('100M Hurdle Race (Boys)', '11', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '11', 'Individual', 1, 'Girls'),
('100M Hurdle Race (Boys)', '12', 'Individual', 1, 'Boys'),
('100M Hurdle Race (Girls)', '12', 'Individual', 1, 'Girls');

-- 200M Hurdle Race (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('200M Hurdle Race (Boys)', '7', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '7', 'Individual', 1, 'Girls'),
('200M Hurdle Race (Boys)', '8', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '8', 'Individual', 1, 'Girls'),
('200M Hurdle Race (Boys)', '9', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '9', 'Individual', 1, 'Girls'),
('200M Hurdle Race (Boys)', '10', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '10', 'Individual', 1, 'Girls'),
('200M Hurdle Race (Boys)', '11', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '11', 'Individual', 1, 'Girls'),
('200M Hurdle Race (Boys)', '12', 'Individual', 1, 'Boys'),
('200M Hurdle Race (Girls)', '12', 'Individual', 1, 'Girls');

-- 100M Back Running (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('100M Back Running (Boys)', '7', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '7', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '8', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '8', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '9', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '9', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '10', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '10', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '11', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '11', 'Individual', 1, 'Girls'),
('100M Back Running (Boys)', '12', 'Individual', 1, 'Boys'),
('100M Back Running (Girls)', '12', 'Individual', 1, 'Girls');

-- High Jump (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('High Jump (Boys)', '7', 'Individual', 1, 'Boys'),
('High Jump (Girls)', '7', 'Individual', 1, 'Girls'),
('High Jump (Boys)', '8', 'Individual', 1, 'Boys'),
('High Jump (Girls)', '8', 'Individual', 1, 'Girls'),
('High Jump (Boys)', '9', 'Individual', 1, 'Boys'),
('High Jump (Girls)', '9', 'Individual', 1, 'Girls'),
('High Jump (Boys)', '10', 'Individual', 1, 'Boys'),
('High Jump (Girls)', '10', 'Individual', 1, 'Girls'),
('High Jump (Boys)', '11', 'Individual', 1, 'Boys'),
('High Jump (Girls)', '11', 'Individual', 1, 'Girls'),
('High Jump (Boys)', '12', 'Individual', 1, 'Boys'),
('High Jump (Girls)', '12', 'Individual', 1, 'Girls');

-- Long Jump (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Long Jump (Boys)', '7', 'Individual', 1, 'Boys'),
('Long Jump (Girls)', '7', 'Individual', 1, 'Girls'),
('Long Jump (Boys)', '8', 'Individual', 1, 'Boys'),
('Long Jump (Girls)', '8', 'Individual', 1, 'Girls'),
('Long Jump (Boys)', '9', 'Individual', 1, 'Boys'),
('Long Jump (Girls)', '9', 'Individual', 1, 'Girls'),
('Long Jump (Boys)', '10', 'Individual', 1, 'Boys'),
('Long Jump (Girls)', '10', 'Individual', 1, 'Girls'),
('Long Jump (Boys)', '11', 'Individual', 1, 'Boys'),
('Long Jump (Girls)', '11', 'Individual', 1, 'Girls'),
('Long Jump (Boys)', '12', 'Individual', 1, 'Boys'),
('Long Jump (Girls)', '12', 'Individual', 1, 'Girls');

-- Karate (All classes 7-12, Mixed gender)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Karate (Mixed)', '7', 'Individual', 1, 'Mixed'),
('Karate (Mixed)', '8', 'Individual', 1, 'Mixed'),
('Karate (Mixed)', '9', 'Individual', 1, 'Mixed'),
('Karate (Mixed)', '10', 'Individual', 1, 'Mixed'),
('Karate (Mixed)', '11', 'Individual', 1, 'Mixed'),
('Karate (Mixed)', '12', 'Individual', 1, 'Mixed');

-- Chess (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Chess (Boys)', '7', 'Individual', 1, 'Boys'),
('Chess (Girls)', '7', 'Individual', 1, 'Girls'),
('Chess (Boys)', '8', 'Individual', 1, 'Boys'),
('Chess (Girls)', '8', 'Individual', 1, 'Girls'),
('Chess (Boys)', '9', 'Individual', 1, 'Boys'),
('Chess (Girls)', '9', 'Individual', 1, 'Girls'),
('Chess (Boys)', '10', 'Individual', 1, 'Boys'),
('Chess (Girls)', '10', 'Individual', 1, 'Girls'),
('Chess (Boys)', '11', 'Individual', 1, 'Boys'),
('Chess (Girls)', '11', 'Individual', 1, 'Girls'),
('Chess (Boys)', '12', 'Individual', 1, 'Boys'),
('Chess (Girls)', '12', 'Individual', 1, 'Girls');

-- Carrom (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Carrom (Boys)', '7', 'Individual', 1, 'Boys'),
('Carrom (Girls)', '7', 'Individual', 1, 'Girls'),
('Carrom (Boys)', '8', 'Individual', 1, 'Boys'),
('Carrom (Girls)', '8', 'Individual', 1, 'Girls'),
('Carrom (Boys)', '9', 'Individual', 1, 'Boys'),
('Carrom (Girls)', '9', 'Individual', 1, 'Girls'),
('Carrom (Boys)', '10', 'Individual', 1, 'Boys'),
('Carrom (Girls)', '10', 'Individual', 1, 'Girls'),
('Carrom (Boys)', '11', 'Individual', 1, 'Boys'),
('Carrom (Girls)', '11', 'Individual', 1, 'Girls'),
('Carrom (Boys)', '12', 'Individual', 1, 'Boys'),
('Carrom (Girls)', '12', 'Individual', 1, 'Girls');

-- Badminton (All classes 7-12, Grouped in pairs)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Badminton (Boys)', '7', 'Grouped', 2, 'Boys'),
('Badminton (Girls)', '7', 'Grouped', 2, 'Girls'),
('Badminton (Boys)', '8', 'Grouped', 2, 'Boys'),
('Badminton (Girls)', '8', 'Grouped', 2, 'Girls'),
('Badminton (Boys)', '9', 'Grouped', 2, 'Boys'),
('Badminton (Girls)', '9', 'Grouped', 2, 'Girls'),
('Badminton (Boys)', '10', 'Grouped', 2, 'Boys'),
('Badminton (Girls)', '10', 'Grouped', 2, 'Girls'),
('Badminton (Boys)', '11', 'Grouped', 2, 'Boys'),
('Badminton (Girls)', '11', 'Grouped', 2, 'Girls'),
('Badminton (Boys)', '12', 'Grouped', 2, 'Boys'),
('Badminton (Girls)', '12', 'Grouped', 2, 'Girls');

-- Table Tennis (All classes 7-12)
INSERT INTO sport_events (game_name, class_category, game_type, group_size, gender_filter) VALUES
('Table Tennis (Boys)', '7', 'Individual', 1, 'Boys'),
('Table Tennis (Girls)', '7', 'Individual', 1, 'Girls'),
('Table Tennis (Boys)', '8', 'Individual', 1, 'Boys'),
('Table Tennis (Girls)', '8', 'Individual', 1, 'Girls'),
('Table Tennis (Boys)', '9', 'Individual', 1, 'Boys'),
('Table Tennis (Girls)', '9', 'Individual', 1, 'Girls'),
('Table Tennis (Boys)', '10', 'Individual', 1, 'Boys'),
('Table Tennis (Girls)', '10', 'Individual', 1, 'Girls'),
('Table Tennis (Boys)', '11', 'Individual', 1, 'Boys'),
('Table Tennis (Girls)', '11', 'Individual', 1, 'Girls'),
('Table Tennis (Boys)', '12', 'Individual', 1, 'Boys'),
('Table Tennis (Girls)', '12', 'Individual', 1, 'Girls');



-- Insert housemasters for all houses
INSERT INTO housemasters (teacher_id, house) VALUES
('89c38b30-4a75-47c9-84c8-c003469ff200', 'Ruby'),
('370d96b6-2d10-4be7-b738-5b4b30fe2a12', 'Ruby'),
('9222218b-cf3c-4547-af5a-9b3f29650c22', 'Emerald'),
('32d8a514-4823-4e91-af92-ac474972823e', 'Emerald'),
('4c6daa5d-a9cf-4f48-9f94-8a89c3205a28', 'Topaz'),
('f5afe502-bbfb-4ba4-97c5-af01c7fa9870', 'Sapphire'),
('c3b492ca-3b39-4d00-9543-32ed3f4cd283', 'Sapphire');
