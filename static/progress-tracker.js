document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const video = document.getElementById('lecture-video');
    const playPauseButton = document.getElementById('play-pause');
    const playIcon = document.getElementById('play-icon');
    const skipBackButton = document.getElementById('skip-back');
    const skipForwardButton = document.getElementById('skip-forward');
    const timeDisplay = document.getElementById('time-display');
    const progressBar = document.getElementById('progress-bar');
    const progressPercent = document.getElementById('progress-percent');
    const uniqueMinutesWatched = document.getElementById('unique-minutes-watched');
    const totalDurationElement = document.getElementById('total-duration'); // Renamed for clarity
    const lastWatchedOverlay = document.getElementById('last-watched-overlay');
    const lastPositionTime = document.getElementById('last-position-time');
    const hoursAgo = document.getElementById('hours-ago');
    const hoursCount = document.getElementById('hours-count');

    // State variables
    let isPlaying = false;
    let watchedIntervals = [];
    let currentInterval = null;
    let updateInterval = null;

    // Helper Functions
    function mergeIntervals(intervals) {
        if (intervals.length <= 1) return intervals;
        const sortedIntervals = [...intervals].sort((a, b) => a[0] - b[0]);
        const result = [];
        let current = sortedIntervals[0];
        for (let i = 1; i < sortedIntervals.length; i++) {
            const next = sortedIntervals[i];
            if (current[1] >= next[0]) {
                current[1] = Math.max(current[1], next[1]);
            } else {
                result.push(current);
                current = next;
            }
        }
        result.push(current);
        return result;
    }

    function calculateUniqueTimeWatched(intervals) {
        return intervals.reduce((total, [start, end]) => total + (end - start), 0);
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateProgressDisplay() {
        if (video.duration) {
            const mergedIntervals = mergeIntervals(watchedIntervals);
            const uniqueTime = calculateUniqueTimeWatched(mergedIntervals);
            const progress = (uniqueTime / video.duration) * 100;
            progressBar.style.width = `${progress}%`;
            progressPercent.textContent = Math.round(progress);
            const minutesWatched = Math.round(uniqueTime / 60);
            uniqueMinutesWatched.textContent = `You've watched ${minutesWatched} minutes of unique content`;
        }
    }

    function saveProgress() {
        if (!video.duration) return;
        const currentTime = video.currentTime;
        localStorage.setItem('videoProgress', JSON.stringify({
            intervals: watchedIntervals,
            lastPosition: currentTime,
            timestamp: Date.now()
        }));
        lastPositionTime.textContent = formatTime(currentTime);
    }

    function loadProgress() {
        const savedProgress = localStorage.getItem('videoProgress');
        if (savedProgress) {
            const { intervals, lastPosition, timestamp } = JSON.parse(savedProgress);
            watchedIntervals = intervals || [];
            if (lastPosition) {
                video.currentTime = lastPosition;
                lastPositionTime.textContent = formatTime(lastPosition);
                lastWatchedOverlay.classList.remove('hidden');
                if (timestamp) {
                    const hoursDiff = Math.round((Date.now() - timestamp) / (1000 * 60 * 60));
                    hoursAgo.textContent = hoursDiff;
                    hoursCount.textContent = hoursDiff;
                }
            }
            updateProgressDisplay();
        }
    }

    // Video Event Handlers
    video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        const totalMinutes = Math.floor(duration / 60);
        const totalSeconds = Math.floor(duration % 60);
        if (totalDurationElement) {
            totalDurationElement.textContent = `Total duration: ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
        }
        loadProgress();
    });

    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            video.pause();
        } else {
            video.play();
        }
    });

    video.addEventListener('play', () => {
        isPlaying = true;
        playIcon.classList.remove('fa-play');
        playIcon.classList.add('fa-pause');
        currentInterval = [video.currentTime, video.currentTime];
        updateInterval = setInterval(() => {
            timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
            if (currentInterval) {
                currentInterval[1] = video.currentTime;
            }
        }, 1000);
    });

    video.addEventListener('pause', () => {
        isPlaying = false;
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
        clearInterval(updateInterval);
        if (currentInterval && currentInterval[0] !== currentInterval[1]) {
            watchedIntervals.push([...currentInterval]);
            currentInterval = null;
            updateProgressDisplay();
            saveProgress();
        }
    });

    skipBackButton.addEventListener('click', () => {
        video.currentTime = Math.max(0, video.currentTime - 10);
        if (isPlaying && currentInterval) {
            watchedIntervals.push([...currentInterval]);
            currentInterval = [video.currentTime, video.currentTime];
        }
    });

    skipForwardButton.addEventListener('click', () => {
        video.currentTime = Math.min(video.duration, video.currentTime + 10);
        if (isPlaying && currentInterval) {
            watchedIntervals.push([...currentInterval]);
            currentInterval = [video.currentTime, video.currentTime];
        }
    });

    video.addEventListener('seeking', () => {
        if (isPlaying && currentInterval) {
            watchedIntervals.push([...currentInterval]);
            currentInterval = [video.currentTime, video.currentTime];
        }
    });

    video.addEventListener('ended', () => {
        isPlaying = false;
        playIcon.classList.remove('fa-pause');
        playIcon.classList.add('fa-play');
        clearInterval(updateInterval);
        if (currentInterval) {
            watchedIntervals.push([...currentInterval]);
            currentInterval = null;
            updateProgressDisplay();
            saveProgress();
        }
    });

    if (!lastWatchedOverlay.classList.contains('hidden')) {
        setTimeout(() => {
            lastWatchedOverlay.classList.add('hidden');
        }, 5000);
    }
});