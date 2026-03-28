/* global chrome */

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PLAY_SOUND') {
    const audio = document.getElementById('audio');
    if (audio) {
      audio.src = message.src;
      audio.play();
    }
  }
});
