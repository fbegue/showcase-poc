USE [master]
GO
/****** Object:  Table [dbo].[artist_artistSongkick]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[artist_artistSongkick](
	[artist_id] [varchar](50) NOT NULL,
	[artistSongkick_id] [int] NOT NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[artists]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[artists](
	[id] [varchar](50) NOT NULL,
	[name] [varchar](50) NULL,
	[images] [varchar](max) NULL,
	[followers] [int] NULL,
	[popularity] [int] NULL,
	[uri] [varchar](100) NULL,
	[lastLook] [datetimeoffset](7) NULL,
 CONSTRAINT [PK_tracks] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[artistsSongkick]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[artistsSongkick](
	[id] [int] NULL,
	[displayName] [varchar](100) NULL,
	[onTourUntil] [datetimeoffset](7) NULL,
	[lastLook] [datetimeoffset](7) NULL,
	[identifier] [varchar](150) NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[artistsSongkick_identifiers]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[artistsSongkick_identifiers](
	[id] [int] NOT NULL,
	[identifier] [varchar](150) NOT NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[event_performance]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[event_performance](
	[event_id] [int] NULL,
	[performance_id] [int] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[events]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[events](
	[id] [int] NULL,
	[displayName] [varchar](150) NULL,
	[location] [varchar](50) NULL,
	[start] [datetimeoffset](7) NULL,
	[type] [varchar](50) NULL,
	[uri] [varchar](150) NULL,
	[metro_id] [int] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[families]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[families](
	[id] [int] NOT NULL,
	[name] [varchar](50) NOT NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[genre_artist]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[genre_artist](
	[genre_id] [int] NULL,
	[artist_id] [varchar](50) NULL,
	[artistSongkick_id] [int] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[genre_family]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[genre_family](
	[genre_id] [int] NOT NULL,
	[family_id] [int] NOT NULL,
	[source] [varchar](50) NULL,
	[creation_date] [datetimeoffset](7) NULL,
	[matched] [varchar](50) NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[genres]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[genres](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[mytable]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[mytable](
	[Name] [varchar](50) NULL,
	[levenMatch] [int] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[performance]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[performance](
	[id] [int] NOT NULL,
	[displayName] [varchar](100) NULL,
	[songkick_artist_id] [int] NULL,
	[billingIndex] [int] NULL,
	[billing] [varchar](50) NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Persons]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Persons](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[playlist_artist]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[playlist_artist](
	[artist_id] [varchar](50) NULL,
	[playlist_id] [varchar](50) NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[playlists]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[playlists](
	[id] [varchar](50) NOT NULL,
	[name] [varchar](50) NULL,
	[uri] [varchar](100) NULL,
	[owner] [varchar](50) NULL,
	[public] [bit] NULL,
 CONSTRAINT [PK_playlists] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[xdep_performance_artistSongkick]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[xdep_performance_artistSongkick](
	[performance_id] [int] NULL,
	[artistSongkick_id] [int] NULL
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[xtest]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[xtest](
	[test] [varchar](50) NULL
) ON [PRIMARY]
GO
/****** Object:  StoredProcedure [dbo].[checkForArtistGenres]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[checkForArtistGenres]

 @artistId  varchar(100)

AS
BEGIN

--exec checkForArtistGenres @artistId = '07d5etnpjriczFBB8pxmRe' 
--DECLARE @artistId  varchar(100) = '36QJpDe2go2KgaRleHCDTp';  
--DECLARE @artistId  varchar(100) = '555555555'; 

declare @isNum int = isnumeric(@artistId);

--select * from artistsSongkick
--select * from artists
--select * from genre_artist
--delete from genre_artist where artist_id = '36QJpDe2go2KgaRleHCDTp'
--select * from genre_artist where artist_id = '36QJpDe2go2KgaRleHCDTp'

if @isNum = 1
	--
	select aso.id,aso.displayName,aso.lastLook,aso.identifier,g.id as genre_id, g.name as genre_name,f.id as family_id,f.name as family_name
	from artistsSongkick aso
	left join genre_artist ga on aso.id = ga.artistSongkick_id
	left join genres g on ga.genre_id = g.id
	left join genre_family gf on g.id = gf.genre_id
	left join families f on gf.family_id = f.id
	--left join artists a on a.id = ga.artist_id
	where cast(@artistId as int) = aso.id
	--todo: not tested
	and g.name is not null
else
	select a.id,a.name,a.lastLook, a.images, g.id as genre_id, g.name as genre_name,f.id as family_id,f.name as family_name
	from artists a 
	left join genre_artist ga on a.id = ga.artist_id
	left join genres g on ga.genre_id = g.id
	left join genre_family gf on g.id = gf.genre_id
	left join families f on gf.family_id = f.id
	--left join artists a on a.id = ga.artist_id
	where  @artistId = a.id
	--and g.name is not null
end

--declare @isNum int = isnumeric(@artistId);
--declare @castId varchar(100);

--if @isNum = 1 (cast)
--else don't cast
--
--select aso.id,aso.displayName,aso.lastLook,aso.identifier,g.name as genreName
--from artistsSongkick aso
--left join genre_artist ga on aso.id = ga.artist_id
--left join genres g on ga.genre_id = g.id
--left join artists a on a.id = ga.artist_id
----where  aso.id = try_cast(@artistId  as int) or a.id = @artistId
--where (@isNum = 0) AND  @castId = aso.id
--OR (@isNum = 1) AND  @castId = a.id

--where @artistId = 
--	case when isnumeric(@artistId) = 0 then a.id
--		 when isnumeric(@artistId) = 1 then aso.id
--		 else null
--	end
GO
/****** Object:  StoredProcedure [dbo].[event_insert]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[event_insert]
	-- Add the parameters for the stored procedure here
		@id int ,
		@displayName varchar(150) ,
		@location varchar(50) ,
		@start datetimeoffset(7) ,
		@type varchar(50) ,
		@uri varchar(150) ,
		@metro_id int
	
	--@Param1, sysname, @p1> <Datatype_For_Param1, , int> = <Default_Value_For_Param1, , 0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
    insert into dbo.events VALUES(@id, @displayName, @location, @start, @type, @uri, @metro_id)
	
	END
GO
/****** Object:  StoredProcedure [dbo].[getAllArtistsGenres]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create PROCEDURE [dbo].[getAllArtistsGenres]

--spotify only right now
AS
BEGIN

select a.id,a.name,a.lastLook,g.name as genreName
from artists a 
left join genre_artist ga on a.id = ga.artist_id
left join genres g on ga.genre_id = g.id

end
GO
/****** Object:  StoredProcedure [dbo].[getFamilyGenreMap]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create PROCEDURE [dbo].[getFamilyGenreMap]
AS
BEGIN

select g.id as genre_id, g.name as genre_name,f.id as family_id,f.name as family_name from genres g
left join genre_family gf on g.id = gf.genre_id
left join families f on gf.family_id = f.id

END
GO
/****** Object:  StoredProcedure [dbo].[insert_artist]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[insert_artist]
	-- Add the parameters for the stored procedure here
--DECLARE @id int = '3';   
--DECLARE @displayName varchar(100) = 'testDisplayName'; 
--DECLARE @identifier varchar(150) = 'test-mbei-233r-asfsdf-dfdsasfd'; 

 @id varchar(50),
 @name varchar(100),
 @uri varchar(150),
 @lastLook datetimeoffset(7)
AS
BEGIN

IF NOT EXISTS (SELECT * FROM dbo.artists WHERE id = @id)
    INSERT INTO dbo.artists(id,name,uri,lastLook)
	--OUTPUT inserted.id, inserted.name
    VALUES(@id,@name,@uri,@lastLook)
else
	select * from dbo.artists WHERE id = @id
	
	END
GO
/****** Object:  StoredProcedure [dbo].[insert_artist_artistSongkick]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create PROCEDURE [dbo].[insert_artist_artistSongkick]
	-- Add the parameters for the stored procedure here
--DECLARE @id int = '3';   
--DECLARE @displayName varchar(100) = 'testDisplayName'; 
--DECLARE @identifier varchar(150) = 'test-mbei-233r-asfsdf-dfdsasfd'; 

 @artist_id varchar(100),
 @artistSongkick_id int

AS
BEGIN

IF NOT EXISTS (SELECT * FROM dbo.artist_artistSongkick WHERE artist_id = @artist_id and artistSongkick_id = @artistSongkick_id )
    INSERT INTO dbo.artist_artistSongkick(artist_id,artistSongkick_id)
	OUTPUT inserted.artist_id, inserted.artistSongkick_id
    VALUES(@artist_id,@artistSongkick_id)
else
	SELECT * FROM dbo.artist_artistSongkick WHERE artist_id = @artist_id and artistSongkick_id = @artistSongkick_id
	END
GO
/****** Object:  StoredProcedure [dbo].[insert_artistSongkick]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[insert_artistSongkick]
	-- Add the parameters for the stored procedure here
--DECLARE @id int = '3';   
--DECLARE @displayName varchar(100) = 'testDisplayName'; 
--DECLARE @identifier varchar(150) = 'test-mbei-233r-asfsdf-dfdsasfd'; 

 @id int,
 @displayName varchar(100),
 @identifier varchar(150),
 @lastLook datetimeoffset(7)
AS
BEGIN

IF NOT EXISTS (SELECT * FROM dbo.artistsSongkick WHERE id = @id)
    INSERT INTO dbo.artistsSongkick(id,displayName,identifier)
	--OUTPUT inserted.id, inserted.name
    VALUES(@id,@displayName,@identifier)

	if @lastLook != null
		  INSERT INTO dbo.artistsSongkick(lastLook) values (@lastLook)

else
	select * from dbo.artistsSongkick WHERE id = @id
	
	END
GO
/****** Object:  StoredProcedure [dbo].[insert_family_genres]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[insert_family_genres]
--truncate table genre_family;
--select * from genre_family

--submit all genres
--then instead of reading them back, just insert into family_genres based on presumed unique name

--testing:
--insert_family_genres 'rock','columbus ohio indie','familySynonym','indie'

@family_name varchar(255),
@genre_name varchar(255),
@source varchar(50) = null,
@matched varchar(50) = null
AS
BEGIN


declare @id int;
declare @fam_id int = 0;
declare @genre_id int;
select @id = id from genres g where g.name = @genre_name;
select @fam_id = id from families f where f.name = @family_name;

select @genre_id = genre_id from genre_family gf where gf.genre_id = @id;

if @source is null
	set @source = 'Unknown'

if @fam_id != 0
	begin
	if @genre_id is not null
		begin
		--rejected b/c its a duplicate
		set @source = 'Spotify'
		end
	else
		begin
		insert into genre_family (genre_id,family_id,source,matched,creation_date) values(@id,@fam_id,@source,@matched,GETDATE());
		end
	end
else
	begin
	select @family_name,@genre_name,'failure'
	end 

--IF NOT EXISTS (SELECT * FROM dbo.artists WHERE id = @id)
--    INSERT INTO dbo.artists(id,name,uri,lastLook)
--	--OUTPUT inserted.id, inserted.name
--    VALUES(@id,@name,@uri,@lastLook)
--else
--	select * from dbo.artists WHERE id = @id

END
GO
/****** Object:  StoredProcedure [dbo].[insert_genre]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[insert_genre]
@name  varchar(255)
AS
BEGIN
--testing:
--exec [insert_genre] 'hollywood2'
--declare @name varchar(255) = 'hollywood2'

declare @new int = 0
--CREATE TABLE #Temp ( id int,name  varchar(255));

IF NOT EXISTS (SELECT * FROM dbo.genres WHERE name = @name)
	begin
	INSERT INTO dbo.genres(name) VALUES(@name)
		set @new = 1	
	end
	
select *, @new as new from dbo.genres WHERE name = @name
END
GO
/****** Object:  StoredProcedure [dbo].[levenMatch]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROCEDURE [dbo].[levenMatch]
 @id  int,
 @name  varchar(100)

AS
BEGIN
  --set @name = 'Earthgang';
  --set @name = 'EARTHGANG';  
  
--select * from artists

CREATE TABLE #mytable(
   name varchar(50),
   id varchar(50),
  levenMatch int
);

insert into #mytable
SELECT top 1 a.name,a.id,(select [dbo].[Levenshtein](a.name,@name,100)) AS levenMatch 
From artists a
order by levenMatch;
--select * from #mytable;

--select top 1 mt.id, mt.name,mt.levenMatch from #mytable mt

CREATE TABLE #mytable2(
 id varchar(50),
    name varchar(50),
 artistSongkick_id int,
 displayName varchar(100),
   genre_id int,
   genre_name varchar(50),
  levenMatch int
);

insert into #mytable2
-- @id as artistSongkick_id, ,
select mt.id, mt.name, @id as artistSongkick_id,@name as displayName, g.id as genre_id,g.name as genre_name,mt.levenMatch from #mytable mt
inner join genre_artist ga on mt.id = ga.artist_id
join genres g on ga.genre_id = g.id
--todo: maybe shouldn't assert this here?
where mt.levenMatch < 5

if ((select count(*) from #mytable2) < 1)
	--todo: insert bare minimum object
	insert into #mytable2 (id,name) values (@id, @name)

select * from #mytable2

--genres

--SELECT top 5 a.name,a.id,a.name,g.id,g.name,(select [dbo].[Levenshtein](a.name,@name,100)) AS levenMatch 
--From artists a
--left join genre_artist ga on a.id = ga.artist_id
--left join genres g on ga.genre_id = g.id
--where g.name is not null
--group by a.id,a.name,g.id,g.name 
--having count(*) >=1 
--order by levenMatch

--CROSS APPLY (select [dbo].[Levenshtein](a.name,@name,100) AS levenMatch)
--as  levenMatch2
end

--
--exec dbo.[levenMatch] 'j.i.d'
--exec dbo.[levenMatch]  123123213,'aiusyriuew'
--select [dbo].[Levenshtein]('EARTHGANG','EARTHGANG',100) AS levenMatch
GO
/****** Object:  StoredProcedure [dbo].[match_artist_artistSongkick]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--exec [match_artist_artistSongkick] @artistSongkick_id = 3807111
--exec [match_artist_artistSongkick] @artistSongkick_id = 2842856
CREATE PROCEDURE [dbo].[match_artist_artistSongkick]

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
images varchar(max) null,
genre_id int,
genre_name varchar(50),
lastLook datetimeoffset(7),
family_id int,
family_name varchar(50)
);


--attempt to find genres related to artistSongkick

INSERT INTO #TempTable (artistSongkick_id, displayName, images,genre_id,genre_name,lastLook,family_id,family_name)
select artsong.id, artsong.displayName, a.images, g.id as genre_id,g.name as genre, artsong.lastLook,f.id as family_id,f.name as family_name
from artistsSongkick artsong
left join genre_artist ga on artsong.id = ga.artistSongkick_id
left join genres g on ga.genre_id = g.id
left join genre_family gf on g.id = gf.genre_id
left join families f on gf.family_id = f.id
--testing: need to resolve events with artist images now, so need to match on that table here
left join artists a on a.id = artsong.id
where g.name is not null
and artsong.id = @artistSongkick_id

if exists (select 1 from #TempTable)
begin
	select * from #TempTable
end

--if we couldn't find any, match to artist thru aas and attempt to get artist genres
else
	begin
		INSERT INTO #TempTable (id,name, artistSongkick_id,displayName,images,genre_id,genre_name,lastLook,family_id,family_name)
		select a.id,a.name, @artistSongkick_id,artsong.displayName,a.images,g.id,g.name,a.lastLook,f.id as family_id,f.name as family_name
		from artist_artistSongkick aas 
		join artists a on aas.artist_id = a.id
		join artistsSongkick as artsong  on artsong.id = @artistSongkick_id
		left join genre_artist ga on a.id = ga.artist_id
		left join genres g on ga.genre_id = g.id
		left join genre_family gf on g.id = gf.genre_id
	    left join families f on gf.family_id = f.id
		where aas.artistSongkick_id = @artistSongkick_id
		select * from #TempTable
	end
end

GO
/****** Object:  StoredProcedure [dbo].[match_artistSongkick]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

--exec [dbo].[match_artistSongkick] @artistSongkick_id = 74358471;
CREATE PROCEDURE [dbo].[match_artistSongkick]

 --@artistId  varchar(100)
  @artistSongkick_id int

AS
BEGIN

select distinct a.id, a.displayName, g.id as genre_id,g.name as genre 
from artistsSongkick a
left join genre_artist ga on a.id = ga.artistSongkick_id
left join genres g on ga.genre_id = g.id
where a.id = @artistSongkick_id
and g.name is not null
group by a.id,a.displayName,g.id,g.name 
having count(*) >=1

end
GO
/****** Object:  StoredProcedure [dbo].[performance_insert]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[performance_insert]
	-- Add the parameters for the stored procedure here
	  @id int,
      @displayName varchar(100),
      @songkick_artist_id int,
      @billingIndex int,
      @billing varchar(50)
	--@Param1, sysname, @p1> <Datatype_For_Param1, , int> = <Default_Value_For_Param1, , 0
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;
    insert into dbo.performance VALUES(@id, @displayName, @songkick_artist_id, @billingIndex, @billing)
	
	END
GO
/****** Object:  StoredProcedure [dbo].[usp_performanceDelete]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[usp_performanceDelete] 
    @id int
AS 
	SET NOCOUNT ON 
	SET XACT_ABORT ON  
	
	BEGIN TRAN

	DELETE
	FROM   [dbo].[performance]
	WHERE  [id] = @id

	COMMIT
GO
/****** Object:  StoredProcedure [dbo].[usp_performanceInsert]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[usp_performanceInsert] 
    @id int,
    @displayName varchar(100) = NULL,
    @songkick_artist_id int = NULL,
    @billingIndex int = NULL,
    @billing varchar(50) = NULL
AS 
	SET NOCOUNT ON 
	SET XACT_ABORT ON  
	
	BEGIN TRAN
	
	INSERT INTO [dbo].[performance] ([id], [displayName], [songkick_artist_id], [billingIndex], [billing])
	SELECT @id, @displayName, @songkick_artist_id, @billingIndex, @billing
	
	-- Begin Return Select <- do not remove
	SELECT [id], [displayName], [songkick_artist_id], [billingIndex], [billing]
	FROM   [dbo].[performance]
	WHERE  [id] = @id
	-- End Return Select <- do not remove
               
	COMMIT
GO
/****** Object:  StoredProcedure [dbo].[usp_performanceSelect]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[usp_performanceSelect] 
    @id int
AS 
	SET NOCOUNT ON 
	SET XACT_ABORT ON  

	BEGIN TRAN

	SELECT [id], [displayName], [songkick_artist_id], [billingIndex], [billing] 
	FROM   [dbo].[performance] 
	WHERE  ([id] = @id OR @id IS NULL) 

	COMMIT
GO
/****** Object:  StoredProcedure [dbo].[usp_performanceUpdate]    Script Date: 10/27/2024 8:10:36 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROC [dbo].[usp_performanceUpdate] 
    @id int,
    @displayName varchar(100) = NULL,
    @songkick_artist_id int = NULL,
    @billingIndex int = NULL,
    @billing varchar(50) = NULL
AS 
	SET NOCOUNT ON 
	SET XACT_ABORT ON  
	
	BEGIN TRAN

	UPDATE [dbo].[performance]
	SET    [displayName] = @displayName, [songkick_artist_id] = @songkick_artist_id, [billingIndex] = @billingIndex, [billing] = @billing
	WHERE  [id] = @id
	
	-- Begin Return Select <- do not remove
	SELECT [id], [displayName], [songkick_artist_id], [billingIndex], [billing]
	FROM   [dbo].[performance]
	WHERE  [id] = @id	
	-- End Return Select <- do not remove

	COMMIT
GO
