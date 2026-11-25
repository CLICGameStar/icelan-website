BEGIN TRANSACTION;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(1, 'fi1', 'fa1', 'us1', 'du1', 'di1', 0, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(2, 'fi2', 'fa2', 'us2', 'du2', 'di2', 0, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(3, 'fi3', 'fa3', 'us3', 'du3', 'di3', 0, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(4, 'fi4', 'fa4', 'us4', 'du4', 'di4', 0, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(5, 'fi5', 'fa5', 'us5', 'du5', 'di5', 0, 0)  ON CONFLICT DO NOTHING;
INSERT INTO participants(id, first_name, family_name, username, discord_username, discord_id, is_staff, is_donator) VALUES(6, 'fi6', 'fa6', 'us6', 'du6', 'di6', 0, 0)  ON CONFLICT DO NOTHING;

INSERT INTO tournaments(id, "name", team_size, state, format1) VALUES(1, 'tourna1', 1, 'created', 'double_elimination_bracket') ON CONFLICT DO NOTHING;

INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(1, 'test1', 1, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(2, 'test2', 2, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(3, 'test3', 3, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(4, 'test4', 4, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(5, 'test5', 5, 1, 1) ON CONFLICT DO NOTHING;
INSERT INTO teams(id, "name", creator, tournament_id, confirmed) VALUES(6, 'test6', 6, 1, 1) ON CONFLICT DO NOTHING;

INSERT INTO enrollments(participant_id, team_id) VALUES (1, 1) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (2, 2) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (3, 3) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (4, 4) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (5, 5) ON CONFLICT DO NOTHING;
INSERT INTO enrollments(participant_id, team_id) VALUES (6, 6) ON CONFLICT DO NOTHING;
COMMIT TRANSACTION;
