CREATE TABLE places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    long DOUBLE PRECISION NOT NULL,
    identifier VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO places (name, lat, long, identifier)
VALUES
    ('National Automobile Museum', 39.525906, -119.808865, 'auto_museum'),
    ('Silver Legacy Resort & Casino', 39.530310, -119.815760, 'silver_casino'),
    ('Peppermill Resort & Spa', 39.496853, -119.802131, 'peppermill'),
    ('Idlewild Park', 39.521841, -119.832980, 'idlewild'),
    ('Wilbur D. May Center', 39.545958, -119.825193, 'wilbur'),
    ('The Discovery - Terry Lee Wells Nevada Discovery Museum', 39.521716, -119.808970, 'discovery'),
    ('Sierra Safari Zoo', 39.623754, -119.908814, 'safari'),
    ('Fleischmann Planetarium & Science Center', 39.545898, -119.819372, 'planetarium'),
    ('Sparks Heritage Museum', 39.535084, -119.753445, 'sparks_museum'),
    ('Grand Sierra Resort', 39.523120, -119.778391, 'grand_sierra_resort');