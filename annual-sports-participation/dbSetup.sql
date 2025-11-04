-- Clean up first
DROP TABLE IF EXISTS sport_participations, sport_events, housemasters;

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

-- Enable RLS on all tables
ALTER TABLE sport_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE housemasters ENABLE ROW LEVEL SECURITY;
