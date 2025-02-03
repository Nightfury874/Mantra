// Global variables to hold configuration, queue state, and the YouTube player
let config = null;
let defaultTime = 60; // seconds
let videoQueue = [];
let currentVideoIndex = 0;
let player = null;
let playTimeout = null;
let youtubeApiReady = false;
let isPlaying = false;  // New variable to track play/pause state

// Fetch the configuration from config.json
function fetchConfig() {
  fetch('config.json')
    .then(response => response.json())
    .then(data => {
      config = data;
      defaultTime = data.defaultTime;
      // Set the settings input value to the configured default time
      document.getElementById('default-time').value = defaultTime;
      videoQueue = data.videos; // Expecting an array of objects with "id" and "title"
      populateQueueUI();
    })
    .catch(err => {
      console.error("Error fetching config:", err);
      // In case of error, initialize an empty config
      config = { defaultTime: 60, videos: [] };
    });
}

// Populate the upcoming videos list in the UI (only those that are yet to be played)
function populateQueueUI() {
  const listEl = document.getElementById('video-list');
  listEl.innerHTML = "";
  for (let i = currentVideoIndex; i < videoQueue.length; i++) {
    const video = videoQueue[i];
    const li = document.createElement('li');
    li.textContent = video.title || video.id;
    li.dataset.index = i;
    listEl.appendChild(li);
  }
}

// Initialize SortableJS on the upcoming videos list for drag-and-drop reordering
const sortable = new Sortable(document.getElementById('video-list'), {
  animation: 150,
  onEnd: function (evt) {
    // Adjust the indices relative to the currentVideoIndex
    let oldIndex = evt.oldIndex + currentVideoIndex;
    let newIndex = evt.newIndex + currentVideoIndex;
    // Remove the moved item and insert it at the new position
    const movedItem = videoQueue.splice(oldIndex, 1)[0];
    videoQueue.splice(newIndex, 0, movedItem);
    populateQueueUI();
  }
});

// Called by the YouTube IFrame API once it is ready
function onYouTubeIframeAPIReady() {
  youtubeApiReady = true;
}

// Create the YouTube player in the hidden #player div
function createPlayer(videoId) {
  player = new YT.Player('player', {
    height: '0',
    width: '0',
    videoId: videoId,
    playerVars: {
      'autoplay': 1,
      'controls': 0,
      'rel': 0,
      'showinfo': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  event.target.playVideo();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    clearTimeout(playTimeout);
    nextVideo();
  }
}

// Play the video with the given video ID
function playVideo(videoId) {
  if (player && typeof player.loadVideoById === 'function') {
    player.loadVideoById(videoId);
  }
}

// Schedule moving to the next video after the configured default time if playing.
function scheduleNext() {
  clearTimeout(playTimeout);
  if(isPlaying) {
    playTimeout = setTimeout(() => {
      nextVideo();
    }, defaultTime * 1000);
  }
}

// Play the next video in the queue.
function nextVideo() {
  currentVideoIndex++;
  if (currentVideoIndex < videoQueue.length) {
    populateQueueUI();
    playVideo(videoQueue[currentVideoIndex].id);
    scheduleNext();
  } else {
    alert("Finished playing all videos.");
    isPlaying = false;
    updatePlayPauseButton();
  }
}

// Function to manually skip to the next video (via the Next button)
function nextVideoManual() {
  clearTimeout(playTimeout);
  if (player && typeof player.stopVideo === 'function') {
    player.stopVideo();
  }
  nextVideo();
}

// Start or resume playback
function startPlayback() {
  if (!isPlaying) {
    isPlaying = true;
    updatePlayPauseButton();
    if (!player) {
      if (youtubeApiReady) {
        createPlayer(videoQueue[currentVideoIndex].id);
      } else {
        // Wait until the YouTube API is ready
        let checkInterval = setInterval(() => {
          if (youtubeApiReady) {
            clearInterval(checkInterval);
            createPlayer(videoQueue[currentVideoIndex].id);
          }
        }, 100);
      }
    } else {
      player.playVideo();
    }
    scheduleNext();
  }
}

// Pause playback
function pausePlayback() {
  if (isPlaying) {
    isPlaying = false;
    updatePlayPauseButton();
    if (player && typeof player.pauseVideo === 'function') {
      player.pauseVideo();
    }
    clearTimeout(playTimeout);
  }
}

// Update the play/pause button icon
function updatePlayPauseButton() {
  const btn = document.getElementById('play-pause-button');
  btn.textContent = isPlaying ? "❚❚" : "►";
}

// ----- UI Event Listeners -----

// Toggle play/pause when the center button is clicked.
document.getElementById('play-pause-button').addEventListener('click', function() {
  if(isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
});

// Next button event listener (allows the user to move to the next song)
document.getElementById('next-button').addEventListener('click', function() {
  nextVideoManual();
});

// Open the Settings modal when the settings button is clicked.
document.getElementById('settings-button').addEventListener('click', function() {
  document.getElementById('settings-modal').style.display = 'block';
});

// Close the modal when the close (×) icon is clicked.
document.querySelector('.close').addEventListener('click', function() {
  document.getElementById('settings-modal').style.display = 'none';
});

// Save the new default play time when the Save button is clicked.
document.getElementById('save-settings').addEventListener('click', function() {
  let newTime = parseInt(document.getElementById('default-time').value);
  if (!isNaN(newTime) && newTime > 0) {
    defaultTime = newTime;
    document.getElementById('settings-modal').style.display = 'none';
    alert("Default play time updated to " + defaultTime + " seconds.");
    if(isPlaying) {
      scheduleNext();
    }
  } else {
    alert("Please enter a valid number greater than 0.");
  }
});

// Also close the settings modal if the user clicks outside of the modal content.
window.onclick = function(event) {
  const modal = document.getElementById('settings-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

// ----- Initialize the App -----
document.addEventListener("DOMContentLoaded", function() {
  fetchConfig();
});
