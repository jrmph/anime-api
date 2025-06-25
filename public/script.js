const PRIMARY_API_URL = 'https://anime-api-fiqp.onrender.com';
const FALLBACK_API_URL = 'https://api-consumet-org-anime.vercel.app'; // Fallback API
let API_URL = PRIMARY_API_URL;
const animeList = document.getElementById('anime-list');
const animeDetails = document.getElementById('anime-details');
const animeTitle = document.getElementById('anime-title');
const episodeList = document.getElementById('episode-list');
const videoPlayer = document.getElementById('video-player');
const serverSelect = document.getElementById('server-select');
const searchInput = document.getElementById('search-input');
let currentAnimeId, currentEpisodeId, currentType;

async function tryFetch(url, options) {
  try {
    const response = await axios.get(url, options);
    if (!response.data.success) throw new Error('API returned unsuccessful response');
    return response;
  } catch (error) {
    console.error(`Error with ${url}:`, error.message);
    if (API_URL === PRIMARY_API_URL) {
      console.log('Switching to fallback API');
      API_URL = FALLBACK_API_URL;
      return await axios.get(url.replace(PRIMARY_API_URL, FALLBACK_API_URL), options);
    }
    throw error;
  }
}

async function loadAnimeList() {
  try {
    const response = await tryFetch(`${API_URL}/api/top-ten`);
    const animes = response.data.results.topTen.today;
    if (!animes || !animes.length) {
      animeList.innerHTML = '<p class="error">No anime found. API may be down.</p>';
      return;
    }
    animeList.innerHTML = animes.map(anime => `
      <div class="anime-card" onclick="loadAnimeDetails('${anime.id}')">
        <img src="${anime.poster}" alt="${anime.name}">
        <p>${anime.name}</p>
      </div>
    `).join('');
  } catch (error) {
    animeList.innerHTML = `<p class="error">Failed to load anime list: ${error.message}. Check API status.</p>`;
    console.error(error);
  }
}

async function searchAnime() {
  const query = searchInput.value.trim().replace(/\s+/g, '%20');
  if (!query) return;
  try {
    const response = await tryFetch(`${API_URL}/api/search?keyword=${query}`);
    const animes = response.data.results;
    if (!animes || !animes.length) {
      animeList.innerHTML = '<p class="error">No results found.</p>';
      return;
    }
    animeList.innerHTML = animes.map(anime => `
      <div class="anime-card" onclick="loadAnimeDetails('${anime.id}')">
        <img src="${anime.poster}" alt="${anime.title}">
        <p>${anime.title}</p>
      </div>
    `).join('');
  } catch (error) {
    animeList.innerHTML = `<p class="error">Error searching anime: ${error.message}</p>`;
    console.error(error);
  }
}

async function loadAnimeDetails(animeId) {
  try {
    animeList.style.display = 'none';
    animeDetails.style.display = 'block';
    const response = await tryFetch(`${API_URL}/api/info?id=${animeId}`);
    const anime = response.data.results.data;
    if (!anime) {
      animeTitle.textContent = 'Anime not found';
      return;
    }
    animeTitle.textContent = anime.title;
    currentAnimeId = animeId;
    currentType = anime.showType;
    
    const episodeResponse = await tryFetch(`${API_URL}/api/episodes/${animeId}`);
    const episodes = episodeResponse.data.results[0].episodes;
    if (!episodes || !episodes.length) {
      episodeList.innerHTML = '<p class="error">No episodes found.</p>';
      return;
    }
    episodeList.innerHTML = episodes.map(ep => `
      <button class="episode-button" onclick="loadStream('${animeId}', '${ep.id}', '${anime.showType}')">
        Episode ${ep.episode_no}
      </button>
    `).join('');
  } catch (error) {
    animeTitle.textContent = `Error loading details: ${error.message}`;
    console.error(error);
  }
}

async function loadStream(animeId, episodeId, type) {
  try {
    currentEpisodeId = episodeId;
    const serversResponse = await tryFetch(`${API_URL}/api/servers/${animeId}?ep=${episodeId}`);
    const servers = serversResponse.data.results;
    if (!servers || !servers.length) {
      serverSelect.innerHTML = '<option>No servers available</option>';
      videoPlayer.src = '';
      alert('No streaming servers available.');
      return;
    }
    serverSelect.innerHTML = servers.map(s => `<option value="${s.serverName}">${s.serverName}</option>`).join('');
    const selectedServer = servers.find(s => s.serverName === 'hd-2')?.serverName || servers[0].serverName;
    
    const response = await tryFetch(`${API_URL}/api/stream?id=${animeId}&ep=${episodeId}&server=${selectedServer}&type=${type.toLowerCase()}`);
    const streamData = response.data.results;
    if (!streamData.streamingLink || !streamData.streamingLink.length) {
      videoPlayer.src = '';
      alert('No streaming links available for this server.');
      return;
    }
    videoPlayer.src = streamData.streamingLink[0].link.file;
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
    videoPlayer.src = '';
    alert(`Streaming unavailable: ${error.message}`);
    console.error(error);
  }
}

async function changeServer() {
  const selectedServer = serverSelect.value;
  if (!currentAnimeId || !currentEpisodeId || !currentType) return;
  try {
    const response = await tryFetch(`${API_URL}/api/stream?id=${currentAnimeId}&ep=${currentEpisodeId}&server=${selectedServer}&type=${currentType.toLowerCase()}`);
    const streamData = response.data.results;
    if (!streamData.streamingLink || !streamData.streamingLink.length) {
      videoPlayer.src = '';
      alert('No streaming links available for this server.');
      return;
    }
    videoPlayer.src = streamData.streamingLink[0].link.file;
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
    videoPlayer.src = '';
    alert(`Streaming unavailable: ${error.message}`);
    console.error(error);
  }
}

loadAnimeList();