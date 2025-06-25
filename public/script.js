const API_URL = 'https://anime-api-fiqp.onrender.com';
const animeList = document.getElementById('anime-list');
const animeDetails = document.getElementById('anime-details');
const animeTitle = document.getElementById('anime-title');
const episodeList = document.getElementById('episode-list');
const videoPlayer = document.getElementById('video-player');

async function loadAnimeList() {
  try {
    const response = await axios.get(`${API_URL}/api/top-ten`);
    if (!response.data.success || !response.data.results.topTen.today.length) {
      animeList.innerHTML = '<p>No anime found.</p>';
      return;
    }
    const animes = response.data.results.topTen.today;
    animeList.innerHTML = animes.map(anime => `
      <div class="anime-card" onclick="loadAnimeDetails('${anime.id}')">
        <img src="${anime.poster}" alt="${anime.name}">
        <p>${anime.name}</p>
      </div>
    `).join('');
  } catch (error) {
    animeList.innerHTML = '<p>Error loading anime.</p>';
  }
}

async function loadAnimeDetails(animeId) {
  try {
    animeList.style.display = 'none';
    animeDetails.style.display = 'block';
    const response = await axios.get(`${API_URL}/api/info?id=${animeId}`);
    if (!response.data.success || !response.data.results.data) {
      animeTitle.textContent = 'Anime not found';
      return;
    }
    const anime = response.data.results.data;
    animeTitle.textContent = anime.title;
    
    const episodeResponse = await axios.get(`${API_URL}/api/episodes/${animeId}`);
    if (!episodeResponse.data.success || !episodeResponse.data.results[0].episodes.length) {
      episodeList.innerHTML = '<p>No episodes found.</p>';
      return;
    }
    const episodes = episodeResponse.data.results[0].episodes;
    episodeList.innerHTML = episodes.map(ep => `
      <button class="episode-button" onclick="loadStream('${animeId}', '${ep.id}', '${anime.showType}')">
        Episode ${ep.episode_no}
      </button>
    `).join('');
  } catch (error) {
    animeTitle.textContent = 'Error loading details';
  }
}

async function loadStream(animeId, episodeId, type) {
  try {
    const response = await axios.get(`${API_URL}/api/stream?id=${animeId}&ep=${episodeId}&server=hd-2&type=${type.toLowerCase()}`);
    if (!response.data.success || !response.data.results.streamingLink.length) {
      const serversResponse = await axios.get(`${API_URL}/api/servers/${animeId}?ep=${episodeId}`);
      const servers = serversResponse.data.results;
      if (!servers.length) {
        alert('No streaming servers available.');
        return;
      }
      const fallbackServer = servers.find(s => s.serverName !== 'hd-2')?.serverName || servers[0].serverName;
      const fallbackResponse = await axios.get(`${API_URL}/api/stream?id=${animeId}&ep=${episodeId}&server=${fallbackServer}&type=${type.toLowerCase()}`);
      if (!fallbackResponse.data.success || !fallbackResponse.data.results.streamingLink.length) {
        alert('No streaming links available.');
        return;
      }
      videoPlayer.src = fallbackResponse.data.results.streamingLink[0].link.file;
    } else {
      videoPlayer.src = response.data.results.streamingLink[0].link.file;
    }
    
    videoPlayer.innerHTML = '';
    if (response.data.results.streamingLink[0].tracks) {
      response.data.results.streamingLink[0].tracks.forEach(track => {
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
    alert('Streaming unavailable.');
  }
}

loadAnimeList();