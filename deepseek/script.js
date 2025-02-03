let player;
let currentVideoIndex = 0;
let timeoutId;
let playlist = [];
let timePerMantra = 1;

// Load config
playlist = window.mantraPlaylist;
timePerMantra = localStorage.getItem('mantraTime') || config.defaultTime;

// YouTube API callback
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    updateQueueDisplay();
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        playNextVideo();
    }
}

function playNextVideo() {
    currentVideoIndex++;
    if (currentVideoIndex >= playlist.length) currentVideoIndex = 0;
    playCurrentVideo();
}

function playCurrentVideo() {
    if (!playlist[currentVideoIndex]) return;
    
    player.loadVideoById({
        videoId: playlist[currentVideoIndex].id,
        suggestedQuality: 'small'
    });
    
    updateQueueDisplay();
    
    clearTimeout(timeoutId);
    timeoutId = setTimeout(playNextVideo, timePerMantra * 60000);
}

document.getElementById('playButton').addEventListener('click', () => {
    if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
        playCurrentVideo();
        document.getElementById('playButton').textContent = '⏸ Pause';
    } else {
        player.pauseVideo();
        document.getElementById('playButton').textContent = '▶ Play';
    }
});

// Settings modal
const modal = document.getElementById('settingsModal');
document.getElementById('settingsButton').onclick = () => modal.style.display = 'block';
document.getElementsByClassName('close')[0].onclick = () => modal.style.display = 'none';

document.getElementById('saveSettings').addEventListener('click', () => {
    timePerMantra = document.getElementById('timeInput').value;
    localStorage.setItem('mantraTime', timePerMantra);
    document.getElementById('currentTime').textContent = `Time per mantra: ${timePerMantra} min`;
    modal.style.display = 'none';
});

// Drag and drop queue
function updateQueueDisplay() {
    const queueList = document.getElementById('playlistQueue');
    queueList.innerHTML = '';
    
    playlist.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'queue-item';
        li.draggable = true;
        li.textContent = item.title;
        li.dataset.index = index;
        
        if (index === currentVideoIndex) {
            li.style.fontWeight = 'bold';
            li.textContent += ' (Now Playing)';
        }
        
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        
        queueList.appendChild(li);
    });
}

let dragStartIndex;

function handleDragStart(e) {
    dragStartIndex = +e.target.dataset.index;
    e.target.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const dragEndIndex = +e.target.closest('.queue-item').dataset.index;
    swapItems(dragStartIndex, dragEndIndex);
    updateQueueDisplay();
}

function swapItems(startIndex, endIndex) {
    const temp = playlist[startIndex];
    playlist[startIndex] = playlist[endIndex];
    playlist[endIndex] = temp;
    if (currentVideoIndex === startIndex) currentVideoIndex = endIndex;
    else if (currentVideoIndex === endIndex) currentVideoIndex = startIndex;
}

// Fetch video titles
async function fetchVideoTitle(videoId) {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const data = await response.json();
    return data.title;
}

// Initialize playlist with titles
async function initializePlaylist() {
    for (const item of playlist) {
        if (!item.title) {
            item.title = await fetchVideoTitle(item.id);
        }
    }
    updateQueueDisplay();
}

initializePlaylist();