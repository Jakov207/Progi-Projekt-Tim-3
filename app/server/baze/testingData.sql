INSERT INTO users (email, password_hash, is_professor, name, surname, profile_picture)
VALUES
    ('ivan.horvat@test.hr', '$2b$10$testhash', true, 'Ivan', 'Horvat', 'profile-1768047062760-891580450.gif'),
    ('ana.kovac@test.hr', '$2b$10$testhash', true, 'Ana', 'Kovač', 'profile-1768047062760-891580450.gif'),
    ('marko.babic@test.hr', '$2b$10$testhash', true, 'Marko', 'Babić', 'profile-1768047062760-891580450.gif'),
    ('petra.maric@test.hr', '$2b$10$testhash', true, 'Petra', 'Marić', 'profile-1768047062760-891580450.gif'),
    ('luka.peric@test.hr', '$2b$10$testhash', true, 'Luka', 'Perić', 'profile-1768047062760-891580450.gif'),
    ('ivana.novak@test.hr', '$2b$10$testhash', true, 'Ivana', 'Novak', 'profile-1768047062760-891580450.gif'),
    ('domagoj.kralj@test.hr', '$2b$10$testhash', true, 'Domagoj', 'Kralj', 'profile-1768047062760-891580450.gif'),
    ('maja.juric@test.hr', '$2b$10$testhash', true, 'Maja', 'Jurić', 'profile-1768047062760-891580450.gif'),
    ('nikola.tomic@test.hr', '$2b$10$testhash', true, 'Nikola', 'Tomić', 'profile-1768047062760-891580450.gif'),
    ('tea.pavic@test.hr', '$2b$10$testhash', true, 'Tea', 'Pavić', 'profile-1768047062760-891580450.gif');

INSERT INTO professors (
    user_id, sex, city, teaching, date_of_birth,
    biography, video_url, reference,
    teaching_type, is_published
)
SELECT
    u.id,
    data.sex,
    data.city,
    data.teaching,
    data.date_of_birth::DATE,
    data.biography,
    data.video_url,
    data.reference,
    data.teaching_type::teaching_type_enum,
    true
FROM users u
         JOIN (
    VALUES
        ('ivan.horvat@test.hr','M','Zagreb','Matematika','1988-04-12','Profesor matematike s 10 godina iskustva.',NULL,'Rad u gimnaziji','Uživo i Online'),
        ('ana.kovac@test.hr','F','Split','Fizika','1990-06-18','Instruktorica fizike za osnovnu i srednju školu.',NULL,'Individualni rad','Online'),
        ('marko.babic@test.hr','M','Rijeka','Informatika','1985-09-03','Programer i instruktor informatike.',NULL,'IT sektor','Uživo'),
        ('petra.maric@test.hr','F','Osijek','Matematika','1993-01-22','Strpljiva i jasna instruktorica matematike.',NULL,'Rad s djecom','Uživo i Online'),
        ('luka.peric@test.hr','M','Zadar','Fizika','1987-11-11','Fizika bez stresa.',NULL,'Pripreme za maturu','Online'),
        ('ivana.novak@test.hr','F','Zagreb','Informatika','1991-05-30','Instrukcije iz informatike i programiranja.',NULL,'Rad u školi','Uživo i Online'),
        ('domagoj.kralj@test.hr','M','Varaždin','Matematika','1984-03-07','Iskusan profesor matematike.',NULL,'Dugogodišnje iskustvo','Uživo'),
        ('maja.juric@test.hr','F','Karlovac','Fizika','1995-08-14','Mladi pristup učenju fizike.',NULL,'Rad sa srednjoškolcima','Online'),
        ('nikola.tomic@test.hr','M','Zagreb','Informatika','1989-12-02','Backend i frontend instrukcije.',NULL,'Rad u IT firmi','Uživo i Online'),
        ('tea.pavic@test.hr','F','Pula','Matematika','1992-07-19','Matematika prilagođena svakom učeniku.',NULL,'Individualni pristup','Uživo')
) AS data(
          email, sex, city, teaching, date_of_birth,
          biography, video_url, reference,
          teaching_type
    )
              ON u.email = data.email;


INSERT INTO user_interests (user_id, interest_id)
SELECT u.id, i.id
FROM users u
         JOIN interests i ON
    (u.email = 'ivan.horvat@test.hr' AND i.name IN ('Matematika Osnovna Škola','Matematika Srednja Škola'))
        OR (u.email = 'ana.kovac@test.hr' AND i.name IN ('Fizika Osnovna Škola','Fizika Srednja Škola'))
        OR (u.email = 'marko.babic@test.hr' AND i.name IN ('Informatika Srednja Škola'))
        OR (u.email = 'petra.maric@test.hr' AND i.name IN ('Matematika Osnovna Škola'))
        OR (u.email = 'luka.peric@test.hr' AND i.name IN ('Fizika Srednja Škola'))
        OR (u.email = 'ivana.novak@test.hr' AND i.name IN ('Informatika Osnovna Škola','Informatika Srednja Škola'))
        OR (u.email = 'domagoj.kralj@test.hr' AND i.name IN ('Matematika Srednja Škola'))
        OR (u.email = 'maja.juric@test.hr' AND i.name IN ('Fizika Osnovna Škola'))
        OR (u.email = 'nikola.tomic@test.hr' AND i.name IN ('Informatika Srednja Škola'))
        OR (u.email = 'tea.pavic@test.hr' AND i.name IN ('Matematika Osnovna Škola'));
