const API_URL = 'https://anime-api-fiqp.onrender.com';
const animeList = document.getElementById('anime-list');
const animeDetails = document.getElementById('anime-details');
const animeTitle = document.getElementById('anime-title');
const episodeList = document.getElementById('episode-list');
const videoPlayer = document.getElementById('video-player');
const searchBar = document.getElementById('search-bar');

// Fetch and display anime list
async function loadAnimeList() {
  try {
    const response = await axios.get(`${API_URL}/api/top-ten`);
    const animes = response.data.results.topTen.today;
    animeList.innerHTML = animes.map(anime => `
      <div class="anime-card" onclick="loadAnimeDetails('${anime.id}')">
        <img src="${anime.poster}" alt="${anime.name}">
        <p>${anime.name}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error fetching anime list:', error);
    animeList.innerHTML = '<p>Error loading anime list.</p>';
  }
}

// Search anime
searchBar.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length < 3) {
    loadAnimeList();
    return;
  }
  try {
    const response = await axios.get(`${API_URL}/api/search?keyword=${encodeURIComponent(query)}`);
    const animes = response.data.results;
    animeList.innerHTML = animes.map(anime => `
      <div class="anime-card" onclick="loadAnimeDetails('${anime.id}')">
        <img src="${anime.poster}" alt="${anime.title}">
        <p>${anime.title}</p>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error searching anime:', error);
    animeList.innerHTML = '<p>No results found.</p>';
  }
});

// Fetch anime details and episodes
async function loadAnimeDetails(animeId) {
  try {
    animeList.style.display = 'none';
    animeDetails.style.display = 'block';
    const response = await axios.get(`${API_URL}/api/info?id=${animeId}`);
    const anime = response.data.results.data;
    animeTitle.textContent = anime.title;
    
    const episodeResponse = await axios.get(`${API_URL}/api/episodes/${animeId}`);
    const episodes = episodeResponse.data.results[0].episodes;
    episodeList.innerHTML = episodes.map(ep => `
      <button class="episode-button" onclick="loadStream('${animeId}', '${ep.id}', '${anime.showType}')">
        Episode ${ep.episode_no}
      </button>
    `).join('');
  } catch (error) {
    console.error('Error fetching anime details:', error);
    animeDetails.innerHTML = '<p>Error loading details.</p>';
  }
}

// Fetch streaming link with hd-2 server
async function loadStream(animeId, episodeId, type) {
  try {
    const response = await axios.get(`${API_URL}/api/stream?id=${animeId}&ep=${episodeId}&server=hd-2&type=${type.toLowerCase()}`);
    const streamData = response.data.results;
    const streamingLink = streamData.streamingLink[0].link.file;
    videoPlayer.src = streamingLink;
    
    // Handle subtitles
    videoPlayer.innerHTML = '';
    if (streamData.streamingLink[0].tracks) {
      streamData.streamingLink[0].tracks.forEach(track => {
        const trackElement = document.createElement('track');
        trackElement.src = track.file;
        trackElement.label = track.label;
        trackElement.kind = track.kind;
        trackElement.default = track.default;
        videoPlayer.appendChild(trackElement);
      });
    }
    videoPlayer.play();
  } catch (error) {
    console.error('Error fetching stream:', error);
    // Fallback to another server
    try {
      const serversResponse = await axios.get(`${API_URL}/api/servers/${animeId}?ep=${episodeId}`);
      const servers = serversResponse.data.results;
      const fallbackServer = servers.find(s => s.serverName !== 'hd-2')?.serverName;
      if (fallbackServer) {
        const fallbackResponse = await axios.get(`${API_URL}/api/stream?id=${animeId}&ep=${episodeId}&server=${fallbackServer}&type=${type.toLowerCase()}`);
        const streamingLink = fallbackResponse.data.results.streamingLink[0].link.file;
        videoPlayer.src = streamingLink;
        videoPlayer.play();
      } else {
        alert('No available servers.');
      }
    } catch (fallbackError) {
      console.error('Error with fallback server:', fallbackError);
      alert('Streaming unavailable. Try another episode.');
    }
  }
}

// Initialize
loadAnimeList();