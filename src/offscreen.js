/**
 * @file Offscreen document script that plays the capture sound when the background worker asks for it.
 */

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'PLAY_SOUND') {
    const audio = document.querySelector('#audio');
    if (audio) {
      audio.src = message.src;
      audio.play();
    }
  }
});
