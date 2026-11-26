BEGIN TRANSACTION;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(1, 'Alyx', 'Cornu', 'HackFight', 'hackfight', '691967643728609290', 1, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(2, 'Leander', 'Cretegny', 'lelewild', 'lelewild', '459664790055550978', 1, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(3, 'Clément', 'Josso', 'laClimSx', 'laclimsx', '366208922757103647', 1, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(4, 'Cyrielle', 'Lozano', 'Dragonne', 'lldragonne', '267014818811215872', 1, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(5, 'Adrien', 'Jengal', 'Ryukriss', 'ryukriss', '525348977755947014', 1, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(6, 'Gregory', 'Blanc', 'greg', 'gregvblanc', '577922006704586771', 1, 0)  ON CONFLICT DO NOTHING;

INSERT INTO tournaments(id, "name", role_id, team_size, state, format1) VALUES(1, 'lol', '1575655985224228954', 5, 'opened', 'single_elimination_bracket') ON CONFLICT DO NOTHING;
INSERT INTO tournaments(id, "name", role_id, team_size, state, format1) VALUES(2, 'mk8dx', '1575655915128885410', 1, 'opened', 'single_elimination_bracket') ON CONFLICT DO NOTHING;
INSERT INTO tournaments(id, "name", role_id, team_size, state, format1) VALUES(3, 'rl', '1575656025825083572', 2, 'opened', 'single_elimination_bracket') ON CONFLICT DO NOTHING;

INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(1, 'T1', 1, 1, 0) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(2, 'Vroom', 1, 3, 0) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(3, 'Les noobs', 3, 3, 0) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(4, '1_2', 1, 2, 0) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(5, '2_2', 2, 2, 0) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(6, '3_2', 3, 2, 0) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(7, '4_2', 4, 2, 0) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(8, '5_2', 5, 2, 0) ON CONFLICT DO NOTHING;

INSERT INTO enrollments(participant_id, team_id) VALUES (1, 1) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (2, 1) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (3, 1) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (4, 1) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (5, 1) ON CONFLICT DO NOTHING;

INSERT INTO enrollments(participant_id, team_id) VALUES (1, 2) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (2, 2) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (3, 3) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (4, 3) ON CONFLICT DO NOTHING;

INSERT INTO enrollments(participant_id, team_id) VALUES (1, 4) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (2, 5) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (3, 6) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (4, 7) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (5, 8) ON CONFLICT DO NOTHING;

INSERT INTO bonus_points(id, participant_id, points, justification) VALUES (1, 1, 100, 'Paske c la goat :sunglasses:') ON CONFLICT DO NOTHING;
INSERT INTO bonus_points(id, participant_id, points, justification) VALUES (2, 1, 50, 'Pour la route') ON CONFLICT DO NOTHING;
INSERT INTO bonus_points(id, participant_id, points, justification) VALUES (3, 2, 1, 'Il fait pitié') ON CONFLICT DO NOTHING;
COMMIT TRANSACTION;