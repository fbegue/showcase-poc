# README-Showcase-POC.change-notes.md

- 05-21-23
    - moved all network utility to `utility/network_utility.js`
        - as a result, refactored and tested the most complicated endpoints `resolvePlaylists()`
    - added dupe prevention and light parameterization to `experimental_api.archiveLikedSongs()` 

- 04-28-24
    - created experimental_api.archiveBillboardHot100Playlists
    - refactored resolver.resolvePlaylists using new network_utility.getAllPages

