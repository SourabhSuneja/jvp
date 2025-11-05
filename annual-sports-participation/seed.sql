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
