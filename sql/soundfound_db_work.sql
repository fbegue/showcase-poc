-- reset db script start
--drop table [soundfound].[dbo].[artists]

select * from [artistsSongkick]
truncate table [artistsSongkick]

select * from [artist_artistSongkick]
--aas where aas.artist_id = '5Ep9KoPuMcT2c2YZqoslPE' 
truncate table  [artist_artistSongkick]

select * from [artists]
truncate table [artists]

select * from genre_artist ga
truncate table genre_artist

-- reset db script end

-------------------------------------
delete from genres where name = 'deathcore'
delete from genres where name = 'melodic metalcore'

select * from genres
truncate table  genres
select * from genre_family
truncate table genre_family;
select * from families
truncate table families

-------------------------------------

-- check if artist has genres
select distinct a.id, a.name, g.id as genre_id,g.name as genre 
from artists a
left join genre_artist ga on a.id = ga.artist_id
left join genres g on ga.genre_id = g.id
where g.name is not null
and a.id = '3AA28KZvwAUcZuOKwyblJQ'
group by a.id,a.name,g.id,g.name 
having count(*) >=1


--inspect genre_families determined by matches
select * 
 from genre_family gf join genres g on gf.genre_id=g.id join families f on f.id = gf.family_id
 where gf.source = 'getlike'


--found genres - spotify artists
select distinct a.id, a.name, g.id as genre_id,g.name as genre 
from artists a
left join genre_artist ga on a.id = ga.artist_id
left join genres g on ga.genre_id = g.id
where g.name is not null
and a.id = '5Ep9KoPuMcT2c2YZqoslPE'
group by a.id,a.name,g.id,g.name 
having count(*) >=1

select * from artists a where a.id = '7FetIwKD9uIJFiUwdHfq6g'

--todo: not going to see these until I'm running non-spotify resolvers again
--found genres - songkick artists
select distinct a.id, a.displayName, g.id as genre_id,g.name as genre
from artistsSongkick a
left join genre_artist ga on a.id = ga.artistSongkick_id
left join genres g on ga.genre_id = g.id
where g.name is not null
group by a.id,a.displayName,g.id,g.name
having count(*) >=1

--found genres - songkick artists link to spotify
--TODO: 
-- seperately, would like to select songkickArtists with no genres,but left join fucks this up
-- seperately, get artists w/ only orphaned genres VS artists with no genres

select distinct a.id, a.name, ask.id as artistSongkick_id, ask.displayName 
--,g.id as genre_id,g.name as genre, f.id as family_id,f.name as family_name
from artistsSongkick ask
left join artist_artistSongkick aask on aask.artistSongkick_id = ask.id 
left join artists a on a.id = aask.artist_id
--get genres from spotify
left join genre_artist ga on  aask.artist_id = ga.artist_id
left join genres g on ga.genre_id = g.id
left join genre_family gf on g.id = gf.genre_id
left join families f on gf.family_id = f.id
where g.name is not null
--where g.name is null
--and ask.id = 5767534
group by  a.id, a.name, ask.id,ask.displayName,g.id,g.name,f.name,f.id
having count(*) >=1

--out of how many?
select count(*) from artist_artistSongkick


--=============================================
--haven't looked at since rewrite
-- vvvvvvv

--working pass/fail check for getBandPage

DECLARE @artistId varchar(50) = '7716964'; 

select * from artistsSongkick aso 
left join genre_artist ga on aso.id = ga.artist_id
left join genres g on ga.genre_id = g.id
left join artists a on a.id = ga.artist_id
where  aso.id = cast(@artistId  as int) or a.id = @artistId

--couldn't find genres
select aso.id,aso.displayName,g.name,aso.lastLook from artistsSongkick aso 
left join genre_artist ga on aso.id = ga.artist_id
left join genres g on ga.genre_id = g.id
left join artists a on a.id = ga.artist_id
where g.name is null
group by aso.id,aso.displayName,g.name,aso.lastLook 
having count(*) = 1
order by aso.lastLook



--found genres - songkick
select distinct aso.id,aso.displayName,g.name from artistsSongkick aso 
left join genre_artist ga on aso.id = ga.artist_id
left join genres g on ga.genre_id = g.id
left join artists a on a.id = ga.artist_id
where g.name is not null
group by aso.id,aso.displayName,g.name 
having count(*) >=1

select aso.id,aso.displayName,g.name,aso.lastLook
from artistsSongkick aso 
 join genre_artist ga on aso.id = ga.artistSongkick_id
left join genres g on ga.genre_id = g.id
--where g.name is not null
--and aso.id = '180283'
group by aso.id,aso.displayName,g.name,aso.lastLook 
--having count(*) = 1
having count(*) >=1
order by aso.lastLook DESC

--get all distinct spotify artists and their genres and related artistSongkick_id if available
select distinct a.id,aas.artistSongkick_id,a.name,g.name,g.id,a.lastLook
from artists a 
left join artist_artistSongkick aas on aas.artist_id = a.id
join genre_artist ga on a.id = ga.artist_id
left join genres g on ga.genre_id = g.id
where g.name is not null 
--and a.name = 'Squirrel Flower'
group by a.id,a.name,g.name,a.lastLook,aas.artistSongkick_id,g.name, g.id
--having count(*) = 1
having count(*) >=1
order by a.lastLook DESC
