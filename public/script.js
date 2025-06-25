const API_URL = 'https://anime-api-fiqp.onrender.com';
const animeList = document.getElementById('anime-list');
const animeDetails = document.getElementById('anime-details');
const animeTitle = document.getElementById('anime-title');
const animePoster = document.getElementById('anime-poster');
const animeDescription = document.getElementById('anime-description');
const animeGenres = document.getElementById('anime-genres');
const animeStatus = document.getElementById('anime-status');
const animeNextEpisode = document.getElementById('anime-next-episode');
const episodeList = document.getElementById('episode-list');
const characterList = document.getElementById('character-list');
const serverSelect = document.getElementById('server-select');
const searchInput = document.getElementById('search-input');
const scheduleView = document.getElementById('schedule-view');
const scheduleList = document.getElementById('schedule-list');
const scheduleDate = document.getElementById('schedule-date');
const homeView = document.getElementById('home-view');
const genreDropdown = document.getElementById('genre-dropdown');
let currentAnimeId, currentEpisodeId, currentType;

async function fetchWithErrorHandling(url) {
  try {
    const response = await axios.get(url);
    if (!response.data.success) {
      throw new Error(`API returned unsuccessful response: ${JSON.stringify(response.data)}`);
    }
    return response;
  } catch (error) {
    const message = error.response ?
      `HTTP ${error.response.status}: ${error.message}` :
      `Network error: ${error.message}`;
    throw new Error(message);
  }
}

async function loadGenres() {
  try {
    const response = await fetchWithErrorHandling(`${API_URL}/api/`);
    const genres = response.data.results.genres || [];
    genreDropdown.innerHTML = genres.map(genre => `
      <li><a class="dropdown-item" href="#" onclick="loadGenre('${genre.toLowerCase()}')">${genre}</a></li>
    `).join('');
  } catch (error) {
    genreDropdown.innerHTML = '<li><a class="dropdown-item">Error loading genres</a></li>';
    console.error('Genres error:', error.message);
  }
}

async function loadAnimeList() {
  try {
    const response = await fetchWithErrorHandling(`${API_URL}/api/top-ten`);
    const animes = response.data.results.topTen.today;
    if (!animes || !animes.length) {
      animeList.innerHTML = '<p class="error col-12">No anime found. API may be down.</p>';
      return;
    }
    animeList.innerHTML = animes.map(anime => `
      <div class="col-md-3 mb-4">
        <div class="card anime-card" onclick="loadAnimeDetails('${anime.id}')">
          <img src="${anime.poster}" class="card-img-top" alt="${anime.name}">
          <div class="card-body">
            <h5 class="card-title">${anime.name}</h5>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    animeList.innerHTML = `<p class="error col-12">Failed to load anime list: ${error.message}. Check API status.</p>`;
    console.error('Anime list error:', error.message);
  }
}

async function loadGenre(genre) {
  try {
    const response = await fetchWithErrorHandling(`${API_URL}/api/genre/${genre}`);
    const animes = response.data.results.data;
    if (!animes || !animes.length) {
      animeList.innerHTML = '<p class="error col-12">No anime found for this genre.</p>';
      return;
    }
    animeList.innerHTML = animes.map(anime => `
      <div class="col-md-3 mb-4">
        <div class="card anime-card" onclick="loadAnimeDetails('${anime.id}')">
          <img src="${anime.poster}" class="card-img-top" alt="${anime.title}">
          <div class="card-body">
            <h5 class="card-title">${anime.title}</h5>
          </div>
        </div>
      </div>
    `).join('');
    showHome();
  } catch (error) {
    animeList.innerHTML = `<p class="error col-12">Error loading genre: ${error.message}</p>`;
    console.error('Genre error:', error.message);
  }
}

async function searchAnime() {
  const query = searchInput.value.trim().replace(/\s+/g, '%20');
  if (!query) return;
  try {
    const response = await fetchWithErrorHandling(`${API_URL}/api/search?keyword=${query}`);
    const animes = response.data.results;
    if (!animes || !animes.length) {
      animeList.innerHTML = '<p class="error col-12">No results found.</p>';
      return;
    }
    animeList.innerHTML = animes.map(anime => `
      <div class="col-md-3 mb-4">
        <div class="card anime-card" onclick="loadAnimeDetails('${anime.id}')">
          <img src="${anime.poster}" class="card-img-top" alt="${anime.title}">
          <div class="card-body">
            <h5 class="card-title">${anime.title}</h5>
          </div>
        </div>
      </div>
    `).join('');
    showHome();
  } catch (error) {
    animeList.innerHTML = `<p class="error col-12">Error searching anime: ${error.message}</p>`;
    console.error('Search error:', error.message);
  }
}

async function loadSchedule() {
  const date = scheduleDate.value || new Date().toISOString().split('T')[0];
  try {
    const response = await fetchWithErrorHandling(`${API_URL}/api/schedule?date=${date}`);
    const schedules = response.data.results;
    if (!schedules || !schedules.length) {
      scheduleList.innerHTML = '<p class="error col-12">No schedule found for this date.</p>';
      return;
    }
    scheduleList.innerHTML = schedules.map(schedule => `
      <div class="col-md-4 mb-4">
        <div class="card schedule-card" onclick="loadAnimeDetails('${schedule.id}')">
          <div class="card-body">
            <h5 class="card-title">${schedule.title}</h5>
            <p>Episode ${schedule.episode_no} - ${schedule.releaseDate} ${schedule.time}</p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    scheduleList.innerHTML = `<p class="error col-12">Error loading schedule: ${error.message}</p>`;
    console.error('Schedule error:', error.message);
  }
}

async function loadAnimeDetails(animeId) {
  try {
    homeView.style.display = 'none';
    scheduleView.style.display = 'none';
    animeDetails.style.display = 'block';
    const response = await fetchWithErrorHandling(`${API_URL}/api/info?id=${animeId}`);
    const anime = response.data.results.data;
    if (!anime) {
      animeTitle.textContent = 'Anime not found';
      return;
    }
    animeTitle.textContent = anime.title;
    animePoster.src = anime.poster;
    animeDescription.textContent = anime.animeInfo.Overview || 'No description available.';
    animeGenres.textContent = anime.animeInfo.Genres.map(g => g.name).join(', ');
    animeStatus.textContent = anime.animeInfo.Status;
    currentAnimeId = animeId;
    currentType = anime.showType;
    
    const nextEpisodeResponse = await fetchWithErrorHandling(`${API_URL}/api/schedule/${animeId}`);
    animeNextEpisode.textContent = nextEpisodeResponse.data.results.nextEpisodeSchedule || 'N/A';
    
    const episodeResponse = await fetchWithErrorHandling(`${API_URL}/api/episodes/${animeId}`);
    const episodes = episodeResponse.data.results[0].episodes;
    if (!episodes || !episodes.length) {
      episodeList.innerHTML = '<p class="error">No episodes found.</p>';
      return;
    }
    episodeList.innerHTML = episodes.map(ep => `
      <button class="btn btn-outline-primary episode-button" onclick="loadStream('${animeId}', '${ep.id}', '${anime.showType}')">
        Episode ${ep.episode_no}
      </button>
    `).join('');
    
    const characterResponse = await fetchWithErrorHandling(`${API_URL}/api/character/list/${animeId}`);
    const characters = characterResponse.data.results.data;
    if (!characters || !characters.length) {
      characterList.innerHTML = '<p class="error col-12">No characters found.</p>';
      return;
    }
    characterList.innerHTML = characters.map(char => `
      <div class="col-md-3 mb-4">
        <div class="card character-card">
          <img src="${char.character.poster}" class="card-img-top" alt="${char.character.name}">
          <div class="card-body">
            <h5 class="card-title">${char.character.name}</h5>
            <p>Voiced by: ${char.voiceActors.map(va => va.name).join(', ')}</p>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    animeTitle.textContent = `Error loading details: ${error.message}`;
    console.error('Anime details error:', error.message);
  }
}

async function loadStream(animeId, episodeId, type) {
  try {
    currentEpisodeId = episodeId;
    const serversResponse = await fetchWithErrorHandling(`${API_URL}/api/servers/${animeId}?ep=${episodeId}`);
    const servers = serversResponse.data.results;
    if (!servers || !servers.length) {
      serverSelect.innerHTML = '<option>No servers available</option>';
      videoPlayer.src = '';
      alert('No streaming servers available.');
      return;
    }
    serverSelect.innerHTML = servers.map(s => `<option value="${s.serverName}">${s.serverName}</option>`).join('');
    const selectedServer = servers.find(s => s.serverName === 'hd-2')?.serverName || servers[0].serverName;
    serverSelect.value = selectedServer;
    
    const response = await fetchWithErrorHandling(`${API_URL}/api/stream?id=${animeId}&ep=${episodeId}&server=${selectedServer}&type=${type.toLowerCase()}`);
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
    console.error('Stream error:', error.message);
  }
}

async function changeServer() {
  const selectedServer = serverSelect.value;
  if (!currentAnimeId || !currentEpisodeId || !currentType) return;
  try {
    const response = await fetchWithErrorHandling(`${API_URL}/api/stream?id=${currentAnimeId}&ep=${currentEpisodeId}&server=${selectedServer}&type=${currentType.toLowerCase()}`);
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
    console.error('Server change error:', error.message);
  }
}

function showHome() {
  homeView.style.display = 'block';
  scheduleView.style.display = 'none';
  animeDetails.style.display = 'none';
  loadAnimeList();
}

function showSchedule() {
  homeView.style.display = 'none';
  scheduleView.style.display = 'block';
  animeDetails.style.display = 'none';
  loadSchedule();
}

loadAnimeList();
loadGenres();
scheduleDate.value = new Date().toISOString().split('T')[0];