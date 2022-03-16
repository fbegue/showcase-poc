CREATE TABLE genres
(
Id INT IDENTITY(1,1) PRIMARY KEY,
name VARCHAR (50) NOT NULL
)


CREATE TABLE genre_family
(
Id INT NOT NULL IDENTITY(1,1) PRIMARY KEY,
[genre_id] INT FOREIGN KEY REFERENCES genres(id),
	family_id int NOT NULL,
	source varchar(50) NULL,
	creation_date [datetimeoffset](7) NULL,
	[matched] [varchar](50) NULL
)

drop table genres
drop table genre_family