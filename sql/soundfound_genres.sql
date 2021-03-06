--remove all genre_family but SpotifyDefault
select * from genre_family where genre_family.source != 'SpotifyDefault'
delete from genre_family where genre_family.source != 'SpotifyDefault'

--delete genres w/ no families
delete g from genres g left join genre_family gf on gf.genre_id=g.id
where gf.genre_id is null

------------------------------------------------------

-- get all genres
select g.id,g.name as gname,f.id as family_id, f.name as family_name
from genre_family gf join genres g on gf.genre_id=g.id join families f on f.id = gf.family_id
where g.name = 'brutal deathmetal'

--check for genres w/ name
select g.id,f.id,g.name as gname, f.name as fname, gf.source 
from genre_family gf join genres g on gf.genre_id=g.id join families f on f.id = gf.family_id

--todo: who generates these again?
--where source != 'SpotifyDefault'

--select genres w/ no families
select g.id,g.name as gname, gf.genre_id, gf.family_id, gf.source
from genres g left join genre_family gf on gf.genre_id=g.id
where gf.genre_id is null

--select genre-family relations not created by SpotifyDefault 
select g.id,g.name as gname, f.id, f.name, gf.matched,gf.source
from genres g left join genre_family gf on gf.genre_id=g.id join families f on f.id = gf.family_id
where gf.source !='SpotifyDefault'

--todo
select [dbo].[Levenshtein]('spot','spooasdfsdft',10000);
