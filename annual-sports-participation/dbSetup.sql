-- events table to store all games
CREATE TABLE sport_events (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(255) NOT NULL,
    class_category VARCHAR(255) NOT NULL,
    
    game_type VARCHAR(50) NOT NULL,

    max_participants INTEGER NOT NULL,
    
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
