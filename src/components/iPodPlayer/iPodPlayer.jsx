import React, { useState, useRef, useEffect } from 'react';
import './iPodPlayer.css';

const IPodPlayer = ({ onClose }) => {
  const [token, setToken] = useState('');
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
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  
  const audioRef = useRef(null);
  
  const CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.REDIRECT_URI;
  const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
  const RESPONSE_TYPE = "token";
  const SCOPES = 'user-read-private user-read-email streaming user-library-read user-modify-playback-state';
  
  useEffect(() => {
    if (!CLIENT_ID) {
      setError("Spotify Client ID is missing");
      return;
    }
    
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");
    
    if (!token && hash) {
      try {
        const hashParts = hash.substring(1).split("&");
        const accessTokenPart = hashParts.find(elem => elem.startsWith("access_token"));
        
        if (accessTokenPart) {
          token = accessTokenPart.split("=")[1];
          window.location.hash = "";
          window.localStorage.setItem("token", token);
        }
      } catch (error) {
        setError("Authentication error");
      }
    }
    
    setToken(token || '');
    
    if (token) {
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        const hasPremium = data.product === 'premium';
        setIsPremium(hasPremium);
        
        if (hasPremium) {
          initializeSpotifySDK(token);
        }
      })
      .catch(() => setError('Account verification failed'));
    }
    
    return () => {
      audioRef.current?.pause();
      player?.disconnect();
    };
  }, [CLIENT_ID]);

  const initializeSpotifySDK = (token) => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    
    script.onload = () => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const spotifyPlayer = new window.Spotify.Player({
          name: 'iPod Player',
          getOAuthToken: cb => { cb(token); },
          volume: 0.5
        });

        spotifyPlayer.addListener('ready', ({ device_id }) => {
          setDeviceId(device_id);
          fetch('https://api.spotify.com/v1/me/player', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_ids: [device_id],
              play: false,
            })
          });
        });

        spotifyPlayer.addListener('not_ready', () => setError('Playback device offline'));
        spotifyPlayer.addListener('initialization_error', () => setError('Player initialization failed'));
        spotifyPlayer.addListener('authentication_error', () => { setError('Authentication failed'); logout(); });
        spotifyPlayer.addListener('account_error', () => setError('Premium account required'));
        spotifyPlayer.addListener('playback_error', () => setError('Playback failed'));
        spotifyPlayer.addListener('player_state_changed', state => state && setIsPlaying(!state.paused));

        spotifyPlayer.connect();
        setPlayer(spotifyPlayer);
      };
    };

    document.body.appendChild(script);
  };

  const searchDeezerPreview = async (trackName, artistName) => {
    const CORS_PROXY = 'https://corsproxy.io/';
    const searchQuery = encodeURIComponent(`${trackName} ${artistName}`);
    const DEEZER_API = 'https://api.deezer.com/search';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `${CORS_PROXY}${encodeURIComponent(`${DEEZER_API}?q=${searchQuery}`)}`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      if (!response.ok) return null;
      
      const data = await response.json();
      const track = data.data?.[0];
      return track?.preview || null;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null;
      }
      return null;
    }
  };

  const handleTrackSelect = async (track) => {
    setCurrentTrack(track);
    setActiveMenu('now-playing');
    setAudioError(null);
    setIsPlaying(false);
    
    if (isPremium && deviceId) {
      fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [`spotify:track:${track.id}`]
        })
      })
      .then(() => setIsPlaying(true))
      .catch(() => setAudioError('Playback failed'));
    } else {
      try {
        let previewUrl = track.previewUrl;
        
        if (!previewUrl) {
          previewUrl = await searchDeezerPreview(track.title, track.artist);
        }
        
        if (previewUrl) {
          const updatedTrack = { ...track, previewUrl };
          setCurrentTrack(updatedTrack);
          
          if (audioRef.current) {
            audioRef.current.src = previewUrl;
            await audioRef.current.load();
            
            setTimeout(() => {
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setAudioError(null);
                })
                .catch(() => {
                  setAudioError(null);
                  setIsPlaying(false);
                });
            }, 100);
          }
        } else {
          setAudioError('No preview available');
          setIsPlaying(false);
        }
      } catch (error) {
        setAudioError(null);
        setIsPlaying(false);
      }
    }
  };

  const handlePlay = async () => {
    if (!currentTrack) return;
    
    if (isPremium) {
      try {
        if (!deviceId) {
          setError('Playback device not ready');
          return;
        }

        if (isPlaying) {
          await fetch(`https://api.spotify.com/v1/me/player/pause`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsPlaying(false);
        } else {
          const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uris: [`spotify:track:${currentTrack.id}`]
            })
          });

          if (!response.ok) throw new Error();
          setIsPlaying(true);
        }
        setAudioError(null);
      } catch {
        setAudioError('Playback failed');
        setIsPlaying(false);
      }
    } else {
      try {
        if (!currentTrack.previewUrl) {
          const deezerPreview = await searchDeezerPreview(currentTrack.title, currentTrack.artist);
          if (deezerPreview) {
            setCurrentTrack({ ...currentTrack, previewUrl: deezerPreview });
            if (audioRef.current) {
              audioRef.current.src = deezerPreview;
              await audioRef.current.load();
            }
          } else {
            setAudioError("No preview available");
            return;
          }
        }

        if (isPlaying) {
          audioRef.current?.pause();
          setIsPlaying(false);
        } else if (audioRef.current) {
          try {
            audioRef.current.currentTime = 0;
            await audioRef.current.load();
            await audioRef.current.play();
            setIsPlaying(true);
            setAudioError(null);
          } catch {
            setAudioError('Preview playback failed');
            setIsPlaying(false);
          }
        }
      } catch {
        setAudioError('Preview playback failed');
        setIsPlaying(false);
      }
    }
  };

  const searchSpotify = async () => {
    if (!searchQuery.trim() || !token) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=${activeMenu === 'artists' ? 'artist' : 'track'}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      
      if (activeMenu === 'artists') {
        setArtists(data.artists.items.map(artist => ({
          id: artist.id,
          name: artist.name,
          imageUrl: artist.images[0]?.url
        })));
      } else {
        setPlaylist(data.tracks.items.map(track => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0].name,
          duration: track.duration_ms / 1000,
          imageUrl: track.album.images[0]?.url,
          uri: track.uri,
          previewUrl: track.preview_url,
          type: 'track'
        })));
      }
    } catch {
      setError('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (!playlist.length) return;
    const currentIndex = currentTrack ? playlist.findIndex(track => track.id === currentTrack.id) : -1;
    const nextIndex = (currentIndex + 1) % playlist.length;
    handleTrackSelect(playlist[nextIndex]);
  };

  const handlePrev = () => {
    if (!playlist.length) return;
    const currentIndex = currentTrack ? playlist.findIndex(track => track.id === currentTrack.id) : -1;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    handleTrackSelect(playlist[prevIndex]);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const login = () => {
    window.location = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPES}`;
  };

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  const handleMenuClick = (menu) => setActiveMenu(menu);

  const handleArtistSelect = async (artist) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks?market=US`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      if (!response.ok) throw new Error();
      
      const data = await response.json();
      setPlaylist(data.tracks.map(track => ({
        id: track.id,
        title: track.name,
        artist: track.artists[0].name,
        duration: track.duration_ms / 1000,
        imageUrl: track.album.images[0]?.url,
        uri: track.uri,
        previewUrl: track.preview_url,
        type: 'track'
      })));
      setActiveMenu('songs');
    } catch {
      setError('Failed to fetch artist tracks');
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {!token ? (
          <div className="login-screen">
            <div className="spotify-logo">
              <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt="Spotify Logo" />
            </div>
            <p>Connect to Spotify</p>
            <button className="spotify-login-button" onClick={login}>Connect</button>
          </div>
        ) : (
          <>
            {activeMenu === 'main' && (
              <div className="ipod-menu">
                <div className="menu-item" onClick={() => handleMenuClick('songs')}>Songs</div>
                <div className="menu-item" onClick={() => handleMenuClick('artists')}>Artists</div>
                {currentTrack && (
                  <div className="menu-item" onClick={() => handleMenuClick('now-playing')}>Now Playing</div>
                )}
                <div className="menu-item" onClick={logout}>Disconnect</div>
              </div>
            )}
            
            {activeMenu === 'artists' && (
              <div className="ipod-artists">
                <div className="menu-header">
                  <button onClick={() => handleMenuClick('main')}>Back</button>
                  <h3>Artists</h3>
                </div>
                <div className="search-bar">
                  <input 
                    type="text" 
                    placeholder="Search artists..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchSpotify()}
                  />
                  <button onClick={searchSpotify}>Search</button>
                </div>
                <div className="artist-list">
                  {artists.map(artist => (
                    <div 
                      key={artist.id} 
                      className="artist-item"
                      onClick={() => handleArtistSelect(artist)}
                    >
                      {artist.imageUrl && (
                        <div className="artist-image">
                          <img src={artist.imageUrl} alt={artist.name} />
                        </div>
                      )}
                      <div className="artist-name">{artist.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeMenu === 'songs' && (
              <div className="ipod-songs">
                <div className="menu-header">
                  <button onClick={() => handleMenuClick('main')}>Back</button>
                  <h3>Songs</h3>
                </div>
                <div className="search-bar">
                  <input 
                    type="text" 
                    placeholder="Search songs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchSpotify()}
                  />
                  <button onClick={searchSpotify}>Search</button>
                </div>
                <div className="song-list">
                  {playlist.map(track => (
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
                  ))}
                </div>
              </div>
            )}
            
            {activeMenu === 'now-playing' && currentTrack && (
              <div className="now-playing">
                <div className="menu-header">
                  <button onClick={() => handleMenuClick('main')}>Back</button>
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
        )}
        
        {!isPremium && (
          <audio
            ref={audioRef}
            src={currentTrack?.previewUrl || ''}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleNext}
            onError={() => setAudioError('Preview playback failed')}
          />
        )}
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
};

export default IPodPlayer; 