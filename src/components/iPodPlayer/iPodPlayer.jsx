import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import './iPodPlayer.css';

const DEFAULT_ARTIST_IMAGE = 'https://via.placeholder.com/300x300?text=Artist';
const DEFAULT_ALBUM_IMAGE = 'https://via.placeholder.com/300x300?text=Album';

const IPodPlayer = memo(({ onClose }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeMenu, setActiveMenu] = useState('main');
  const [artists, setArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioError, setAudioError] = useState(null);
  
  const audioRef = useRef(null);
  
  const searchItunesAPI = useCallback(async (query, type = 'song') => {
    setIsLoading(true);
    
    try {
      let searchUrl;
      
      if (type === 'artist') {
        searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=musicArtist&attribute=artistTerm&limit=20`;
      } else {
        searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&attribute=songTerm&limit=20`;
      }
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) throw new Error("iTunes search failed");
      
      const data = await response.json();
      
      if (type === 'artist') {
        const uniqueArtists = Array.from(new Map(
          data.results.map(artist => [artist.artistId, artist])
        ).values());
        
        setArtists(uniqueArtists.map(artist => ({
          id: artist.artistId,
          name: artist.artistName,
          imageUrl: artist.artworkUrl100?.replace('100x100', '300x300') || DEFAULT_ARTIST_IMAGE
        })));
      } else {
        const songResults = data.results.map(track => ({
          id: track.trackId,
          title: track.trackName,
          artist: track.artistName,
          duration: track.trackTimeMillis / 1000,
          imageUrl: track.artworkUrl100?.replace('100x100', '300x300') || DEFAULT_ALBUM_IMAGE,
          previewUrl: track.previewUrl,
          type: 'track'
        }));
        
        if (songResults.length === 0) {
          const backupSearchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=20`;
          const backupResponse = await fetch(backupSearchUrl);
          
          if (backupResponse.ok) {
            const backupData = await backupResponse.json();
            
            const backupResults = backupData.results.map(track => ({
              id: track.trackId,
              title: track.trackName,
              artist: track.artistName, 
              duration: track.trackTimeMillis / 1000,
              imageUrl: track.artworkUrl100?.replace('100x100', '300x300') || DEFAULT_ALBUM_IMAGE,
              previewUrl: track.previewUrl,
              type: 'track'
            }));
            
            setPlaylist(backupResults);
          } else {
            setPlaylist(songResults);
          }
        } else {
          setPlaylist(songResults);
        }
      }
    } catch (error) {
      console.error("iTunes API error:", error);
      setError('Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const getArtistTracks = useCallback(async (artistId, artistName) => {
    setIsLoading(true);
    try {
      // First try direct lookup with artist ID
      const searchUrl = `https://itunes.apple.com/lookup?id=${artistId}&entity=song&limit=50`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      
      // Filter to include only songs by this artist (exact name match)
      const exactArtistName = artistName.toLowerCase().trim();
      let tracks = data.results
        .filter(item => 
          item.wrapperType === 'track' && 
          item.artistName.toLowerCase().trim() === exactArtistName)
        .map(track => ({
          id: track.trackId,
          title: track.trackName,
          artist: track.artistName,
          duration: track.trackTimeMillis / 1000,
          imageUrl: track.artworkUrl100?.replace('100x100', '300x300') || DEFAULT_ALBUM_IMAGE,
          previewUrl: track.previewUrl,
          type: 'track'
        }));
      
      // If no tracks found with lookup, try searching directly by artist name
      if (tracks.length < 3) {
        const backupUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&media=music&entity=song&attribute=artistTerm&limit=50`;
        
        const backupResponse = await fetch(backupUrl);
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json();
          
          // Filter to include only songs by this artist (exact name match)
          const backupTracks = backupData.results
            .filter(item => 
              item.artistName.toLowerCase().trim() === exactArtistName)
            .map(track => ({
              id: track.trackId,
              title: track.trackName,
              artist: track.artistName,
              duration: track.trackTimeMillis / 1000,
              imageUrl: track.artworkUrl100?.replace('100x100', '300x300') || DEFAULT_ALBUM_IMAGE,
              previewUrl: track.previewUrl,
              type: 'track'
            }));
          
          if (backupTracks.length > tracks.length) {
            tracks = backupTracks;
          }
        }
      }
      
      // If still no tracks found with exact match, use less strict matching
      if (tracks.length === 0) {
        const fallbackUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&media=music&entity=song&limit=25`;
        
        const fallbackResponse = await fetch(fallbackUrl);
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          tracks = fallbackData.results
            .filter(item => 
              item.artistName.toLowerCase().includes(artistName.toLowerCase().trim().split(' ')[0]))
            .map(track => ({
              id: track.trackId,
              title: track.trackName,
              artist: track.artistName,
              duration: track.trackTimeMillis / 1000,
              imageUrl: track.artworkUrl100?.replace('100x100', '300x300') || DEFAULT_ALBUM_IMAGE,
              previewUrl: track.previewUrl,
              type: 'track'
            }));
        }
      }
      
      setPlaylist(tracks);
      setActiveMenu('songs');
    } catch {
      setError('Failed to fetch artist tracks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleTrackSelect = useCallback(async (track) => {
    setCurrentTrack(track);
    setActiveMenu('now-playing');
    setAudioError(null);
    setIsPlaying(false);
    setIsLoading(true);
    
    try {
      if (track.previewUrl) {
        const updatedTrack = { ...track };
        setCurrentTrack(updatedTrack);
        
        if (audioRef.current) {
          try {
            audioRef.current.src = track.previewUrl;
            await audioRef.current.load();
            
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                  setAudioError(null);
                })
                .catch((error) => {
                  console.error("Audio playback error:", error);
                  // Handle autoplay restrictions
                  if (error.name === "NotAllowedError") {
                    setAudioError("Click play to start (autoplay restricted)");
                  } else {
                    setAudioError("Preview playback failed - try again");
                  }
                  setIsPlaying(false);
                });
            }
          } catch (error) {
            console.error("Audio setup error:", error);
            setAudioError("Preview setup failed - try another track");
            setIsPlaying(false);
          }
        }
      } else {
        setAudioError('No preview available for this track');
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Track selection error:", error);
      setAudioError("Failed to play track - try another");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (!currentTrack) return;
    
    try {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else if (audioRef.current) {
        try {
          if (!audioRef.current.src || audioRef.current.src === window.location.href) {
            setAudioError("No audio source available");
            return;
          }
          
          if (audioRef.current.currentTime >= audioRef.current.duration - 1) {
            audioRef.current.currentTime = 0;
          }
          
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                setAudioError(null);
              })
              .catch((error) => {
                console.error("Play control error:", error);
                if (error.name === "NotAllowedError") {
                  setAudioError("Playback blocked by browser - try again");
                } else {
                  setAudioError("Preview playback failed - try another track");
                }
                setIsPlaying(false);
              });
          }
        } catch (error) {
          console.error("Audio play error:", error);
          setAudioError('Preview playback failed - try another track');
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error("Play control error:", error);
      setAudioError('Player error - try another track');
      setIsPlaying(false);
    }
  }, [currentTrack, isPlaying]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    try {
      await searchItunesAPI(searchQuery, activeMenu === 'artists' ? 'artist' : 'song');
      
      // Clear search query after search is performed
      // This gives better feedback to the user that their search was processed
      setSearchQuery('');
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed");
    }
  }, [searchQuery, activeMenu, searchItunesAPI]);

  const handleNext = useCallback(() => {
    if (!playlist.length) return;
    const currentIndex = currentTrack ? playlist.findIndex(track => track.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % playlist.length;
    handleTrackSelect(playlist[nextIndex]);
  }, [playlist, currentTrack, handleTrackSelect]);

  const handlePrev = useCallback(() => {
    if (!playlist.length) return;
    const currentIndex = currentTrack ? playlist.findIndex(track => track.id === currentTrack.id) : -1;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    handleTrackSelect(playlist[prevIndex]);
  }, [playlist, currentTrack, handleTrackSelect]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  }, []);

  const formatTime = useCallback((time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }, []);

  const handleMenuClick = useCallback((menu) => {
    // Clear search query and results when changing pages
    if (menu !== activeMenu) {
      if ((activeMenu === 'songs' || activeMenu === 'artists') && 
          (menu !== 'songs' && menu !== 'artists')) {
        setSearchQuery('');
        if (menu !== 'now-playing') {
          setPlaylist([]);
          setArtists([]);
        }
      }
    }
    
    setActiveMenu(menu);
  }, [activeMenu]);

  const handleBackButton = useCallback(() => {
    // When going back from search screens, clear search query and results
    if (activeMenu === 'songs' || activeMenu === 'artists') {
      setSearchQuery('');
      setPlaylist([]);
      setArtists([]);
    }
    setActiveMenu('main');
  }, [activeMenu]);

  const handleArtistSelect = useCallback(async (artist) => {
    await getArtistTracks(artist.id, artist.name);
  }, [getArtistTracks]);

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  // Memoize song and artist items to improve rendering performance
  const renderArtistItem = useCallback((artist) => (
    <div 
      key={artist.id} 
      className="artist-item"
      onClick={() => handleArtistSelect(artist)}
    >
      <div className="artist-name">{artist.name}</div>
    </div>
  ), [handleArtistSelect]);

  const renderSongItem = useCallback((track) => (
    <div 
      key={track.id} 
      className="song-item"
      onClick={() => handleTrackSelect(track)}
    >
      {track.imageUrl && (
        <div className="song-image">
          <img src={track.imageUrl} alt={track.title} />
        </div>
      )}
      <div className="song-info">
        <div className="song-title">{track.title}</div>
        <div className="song-artist">{track.artist}</div>
      </div>
    </div>
  ), [handleTrackSelect]);

  return (
    <div className="ipod-container">
      <div className="ipod-header">
        <button className="close-button" onClick={onClose}>X</button>
        <h2>Music Player</h2>
      </div>
      
      <div className="ipod-screen">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div>Loading...</div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        
        <>
          {activeMenu === 'main' && (
            <div className="ipod-menu">
              <div className="menu-item" onClick={() => handleMenuClick('songs')}>Songs</div>
              <div className="menu-item" onClick={() => handleMenuClick('artists')}>Artists</div>
              {currentTrack && (
                <div className="menu-item" onClick={() => handleMenuClick('now-playing')}>Now Playing</div>
              )}
            </div>
          )}
          
          {activeMenu === 'artists' && (
            <div className="ipod-artists">
              <div className="menu-header">
                <button onClick={handleBackButton}>Back</button>
                <h3>Artists</h3>
              </div>
              <div className="search-bar">
                <input 
                  type="text" 
                  placeholder="Search artists..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button onClick={handleSearch}>Search</button>
              </div>
              <div className="artist-list">
                {artists.map(renderArtistItem)}
              </div>
            </div>
          )}
          
          {activeMenu === 'songs' && (
            <div className="ipod-songs">
              <div className="menu-header">
                <button onClick={handleBackButton}>Back</button>
                <h3>Songs</h3>
              </div>
              <div className="search-bar">
                <input 
                  type="text" 
                  placeholder="Search songs..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button onClick={handleSearch}>Search</button>
              </div>
              <div className="song-list">
                {playlist.map(renderSongItem)}
              </div>
            </div>
          )}
          
          {activeMenu === 'now-playing' && currentTrack && (
            <div className="now-playing">
              <div className="menu-header">
                <button onClick={handleBackButton}>Back</button>
                <h3>Now Playing</h3>
              </div>
              <div className="track-info">
                {currentTrack.imageUrl && (
                  <div className="album-art">
                    <img src={currentTrack.imageUrl} alt="Album Art" />
                  </div>
                )}
                <div className="track-title">{currentTrack.title}</div>
                <div className="track-artist">{currentTrack.artist}</div>
                
                {audioError ? (
                  <div className="audio-error">{audioError}</div>
                ) : (
                  <>
                    <div className="progress-bar">
                      <div 
                        className="progress" 
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      ></div>
                    </div>
                    <div className="time-display">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
        
        <audio
          ref={audioRef}
          src={currentTrack?.previewUrl || ''}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleNext}
          onError={() => setAudioError('Preview playback failed')}
        />
      </div>
      
      <div className="ipod-controls">
        <div className="control-wheel">
          <button className="menu-button" onClick={() => handleMenuClick('main')}>MENU</button>
          <div className="wheel-buttons">
            <button className="prev-button" onClick={handlePrev}>◀</button>
            <button className="play-button" onClick={handlePlay}>
              {isPlaying ? '❚❚' : '▶'}
            </button>
            <button className="next-button" onClick={handleNext}>▶</button>
          </div>
          <div className="center-button" onClick={() => currentTrack && handleMenuClick('now-playing')}></div>
        </div>
      </div>
    </div>
  );
});

IPodPlayer.displayName = 'IPodPlayer';

export default IPodPlayer; 