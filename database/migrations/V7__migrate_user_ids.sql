-- Populate users from every distinct firebase_uid already in the DB
INSERT INTO users (firebase_uid)
SELECT DISTINCT user_id FROM network
UNION
SELECT DISTINCT user_id FROM applications
UNION
SELECT DISTINCT user_id FROM action_items
ON CONFLICT DO NOTHING;

-- network
ALTER TABLE network ADD COLUMN user_uuid UUID;
UPDATE network n SET user_uuid = u.user_id FROM users u WHERE u.firebase_uid = n.user_id;
ALTER TABLE network ALTER COLUMN user_uuid SET NOT NULL;
ALTER TABLE network ADD CONSTRAINT fk_network_user FOREIGN KEY (user_uuid) REFERENCES users(user_id);
ALTER TABLE network DROP COLUMN user_id;
ALTER TABLE network RENAME COLUMN user_uuid TO user_id;

-- applications
ALTER TABLE applications ADD COLUMN user_uuid UUID;
UPDATE applications a SET user_uuid = u.user_id FROM users u WHERE u.firebase_uid = a.user_id;
ALTER TABLE applications ALTER COLUMN user_uuid SET NOT NULL;
ALTER TABLE applications ADD CONSTRAINT fk_applications_user FOREIGN KEY (user_uuid) REFERENCES users(user_id);
ALTER TABLE applications DROP COLUMN user_id;
ALTER TABLE applications RENAME COLUMN user_uuid TO user_id;

-- action_items
ALTER TABLE action_items ADD COLUMN user_uuid UUID;
UPDATE action_items a SET user_uuid = u.user_id FROM users u WHERE u.firebase_uid = a.user_id;
ALTER TABLE action_items ALTER COLUMN user_uuid SET NOT NULL;
ALTER TABLE action_items ADD CONSTRAINT fk_action_items_user FOREIGN KEY (user_uuid) REFERENCES users(user_id);
ALTER TABLE action_items DROP COLUMN user_id;
ALTER TABLE action_items RENAME COLUMN user_uuid TO user_id;
