IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@university.edu')
BEGIN
  INSERT INTO users (full_name,email,password_hash,role_id)
  VALUES ('System Admin','admin@university.edu','$2b$10$erzpoTBZRrCo6upEaDuoUeEuTWOP7na4.lOdC93BgDASxDI/HQJ/.',1);
END

IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'organizer@university.edu')
BEGIN
  INSERT INTO users (full_name,email,password_hash,role_id)
  VALUES ('Event Organizer','organizer@university.edu','$2b$10$erzpoTBZRrCo6upEaDuoUeEuTWOP7na4.lOdC93BgDASxDI/HQJ/.',2);
END

