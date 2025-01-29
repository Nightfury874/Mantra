// app.js
// Handles the shuffling, playback logic, and settings

// Global Variables
var shuffledPlaylist = [];    // Will store a shuffled version of PLAYLIST
var currentIndex = 0;         // Which track is currently playing
var playbackDuration = DEFAULT_DURATION; // Time in seconds to play each track
var trackTimer = null;        // Reference to setTimeout for track transitions

// Wait for DOM content to load
document.addEventListener("DOMContentLoaded", function() {
  // Shuffle and store the playlist
  shuffledPlaylist = shuffleArray(PLAYLIST.slice()); // make a copy, then shuffle
  renderPlaylist(shuffledPlaylist);

  // Set up event listeners
  document.getElementById("playAllBtn").addEventListener("click", handlePlayAll);
  document.getElementById("settingsBtn").addEventListener("click", openSettingsModal);
  document.getElementById("closeSettings").addEventListener("click", closeSettingsModal);
  document.getElementById("saveSettingsBtn").addEventListener("click", saveSettings);

  // Initialize the duration input with default
  document.getElementById("durationInput").value = playbackDuration;
});

// Shuffles array in place
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Renders the playlist items on the page
function renderPlaylist(playlist) {
  const container = document.getElementById("playlistContainer");
  container.innerHTML = "";
  playlist.forEach((item, index) => {
    const trackDiv = document.createElement("div");
    trackDiv.classList.add("track-item");
    trackDiv.textContent = item.title;
    trackDiv.addEventListener("click", function() {
      stopCurrentTrack();
      currentIndex = index;
      playTrack(currentIndex);
    });
    container.appendChild(trackDiv);
  });
}

// Handle "Play All" click
function handlePlayAll() {
  stopCurrentTrack();
  currentIndex = 0;
  playTrack(currentIndex);
}

// Play a specific track in the playlist
function playTrack(index) {
  if (index < 0 || index >= shuffledPlaylist.length) {
    // Invalid index or we're done
    updateCurrentTrackTitle("All tracks finished.");
    return;
  }

  // Clear existing timer if any
  if (trackTimer) {
    clearTimeout(trackTimer);
    trackTimer = null;
  }

  const trackObj = shuffledPlaylist[index];
  const player = document.getElementById("player");

  // Update iframe src to start playing the track
  // "autoplay=1" starts the audio right away after user click
  // "controls=0" hides the usual YouTube controls
  // "rel=0" reduces related videos at the end
  // "enablejsapi=1" is optional if we want more control using YT JS API
  player.src = `https://www.youtube.com/embed/${trackObj.youtubeId}?autoplay=1&controls=0&rel=0`;

  // Update the currently playing title
  updateCurrentTrackTitle(trackObj.title);

  // Start timer: after "playbackDuration" seconds, go to the next track
  trackTimer = setTimeout(function() {
    nextTrack();
  }, playbackDuration * 1000);
}

// Moves to the next track
function nextTrack() {
  currentIndex++;
  if (currentIndex < shuffledPlaylist.length) {
    playTrack(currentIndex);
  } else {
    // If no more tracks, stop
    updateCurrentTrackTitle("All tracks finished.");
  }
}

// Stop any current track from playing
function stopCurrentTrack() {
  const player = document.getElementById("player");
  // Reset the iframe src to stop
  player.src = "";
  // Clear any track timer
  if (trackTimer) {
    clearTimeout(trackTimer);
    trackTimer = null;
  }
}

// Update the displayed current track title
function updateCurrentTrackTitle(title) {
  document.getElementById("currentTrackTitle").innerText = title;
}

/* SETTINGS MODAL LOGIC */
function openSettingsModal() {
  document.getElementById("settingsModal").style.display = "block";
}

function closeSettingsModal() {
  document.getElementById("settingsModal").style.display = "none";
}

function saveSettings() {
  const durationValue = parseInt(document.getElementById("durationInput").value, 10);
  if (!isNaN(durationValue) && durationValue > 0) {
    playbackDuration = durationValue;
  } else {
    playbackDuration = DEFAULT_DURATION; // fallback
  }
  closeSettingsModal();
}
