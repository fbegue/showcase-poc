USE [soundfound]
GO
/****** Object:  StoredProcedure [dbo].[match_artist_artistSongkick]    Script Date: 9/12/2021 2:45:05 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--exec [match_artist_artistSongkick] @artistSongkick_id = 9601464
--exec [match_artist_artistSongkick] @artistSongkick_id = 2842856
ALTER PROCEDURE [dbo].[match_artist_artistSongkick]

 --@artistId  varchar(100)
  @artistSongkick_id int

AS
BEGIN
--set @artistSongkick_id = 9601464; 

CREATE TABLE #TempTable(
id varchar(50),
name varchar(50),
artistSongkick_id int,
displayName  varchar(100),
genre_id int,
genre_name varchar(50),
lastLook datetimeoffset(7),
family_id int,
family_name varchar(50)
);


--attempt to find genres related to artistSongkick

INSERT INTO #TempTable (artistSongkick_id, displayName, genre_id,genre_name,lastLook,family_id,family_name)
select artsong.id, artsong.displayName, g.id as genre_id,g.name as genre, artsong.lastLook,f.id as family_id,f.name as family_name
from artistsSongkick artsong
left join genre_artist ga on artsong.id = ga.artistSongkick_id
left join genres g on ga.genre_id = g.id
left join genre_family gf on g.id = gf.genre_id
left join families f on gf.family_id = f.id
where g.name is not null
and artsong.id = @artistSongkick_id

if exists (select 1 from #TempTable)
begin
	select * from #TempTable
end

--if we couldn't find any, match to artist thru aas and attempt to get artist genres
else
	begin
		INSERT INTO #TempTable (id,name, artistSongkick_id,displayName,genre_id,genre_name,lastLook)
		--family_id,family_name
		select a.id,a.name, @artistSongkick_id,artsong.displayName,g.id,g.name,a.lastLook
		--f.id as family_id,f.name as family_name
		from artist_artistSongkick aas 
		join artists a on aas.artist_id = a.id
		join artistsSongkick as artsong  on artsong.id = @artistSongkick_id
		left join genre_artist ga on a.id = ga.artist_id
		left join genres g on ga.genre_id = g.id
		--left join genre_family gf on g.id = gf.genre_id
	    --left join families f on gf.family_id = f.id
		where aas.artistSongkick_id = @artistSongkick_id

		select tp.id,tp.name, tp.artistSongkick_id,tp.displayName,tp.genre_id,tp.genre_name, tp.lastLook,
		f.id as family_id,f.name as family_name from #TempTable tp
		left join genre_family gf on gf.genre_id = tp.genre_id 
		left join families f on gf.family_id = f.id
		where tp.genre_id is not null
		--select * from #TempTable
	end
end

--exec [match_artist_artistSongkick] @artistSongkick_id = 2290286

--select * from genres g left join genre_family gf on g.id = gf.genre_id

