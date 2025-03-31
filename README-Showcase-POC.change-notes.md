# README-Showcase-POC.change-notes.md

- 05-21-23
    - moved all network utility to `utility/network_utility.js`
        - as a result, refactored and tested the most complicated endpoints `resolvePlaylists()`
    - added dupe prevention and light parameterization to `experimental_api.archiveLikedSongs()` 

- 04-28-24
    - created experimental_api.archiveBillboardHot100Playlists
    - refactored resolver.resolvePlaylists using new network_utility.getAllPages

- 12-01-24
    - improved getPlaying - now returns getArtistInfoWiki info
      - lot of haphazard work went into parsing 'born' which you find for singular artist names
    - had to update node version from 14 to 20 IN THE META.JSON SERVERLESS CONFIG because of (not sure how this was introduced?)
      - "errorMessage": "SyntaxError: Unexpected token '??='",

- 03-30-25 - getPlaying improvements
  - getArtistInfoWiki now get's url to page
  - added popularity