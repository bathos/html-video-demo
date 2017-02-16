// Normally I use ES modules; didn’t think it was made sense to add a bundler
// etc for this though.

'use strict';

const MIN  = 60;
const HOUR = MIN * 60;

// PLAYER //////////////////////////////////////////////////////////////////////

const createPlayer = (() => {
  const elem = (name, attr) =>
    Object.assign(document.createElement(name), attr);

  const formatTime = sec => {
    const h = Math.floor(sec / HOUR);

    sec -= h * HOUR;

    const m = Math.floor(sec / MIN);

    sec -= m * MIN;

    const s = Math.floor(sec);

    const members = h ? [ h, m, s ] : [ m, s ];

    return members.map(n => n.toString().padStart(2, '0')).join(':');
  };

  const xFraction = ({ layerX }, { clientWidth }) => {
    // layerX/layerY aren’t W3C recs, but standards aside they’re well-supported
    // and efficient. In a more robust implementation you might choose to fall
    // back on other props when layerX is unavailable (i.e., in Opera).

    return layerX / clientWidth;
  };

  const percent = n =>
    `${ Math.round(n * 100) }%`;

  const uniqueID = ((i=0) => () => `video-${ i++ }`)();

  return ({ rewatchThreshold, src }) => {
    const id       = uniqueID();
    const nub      = elem('div', { classList: [ 'wd-nub' ] });
    const player   = elem('div', { classList: [ 'wd-player' ] });
    const progress = elem('div', { classList: [ 'wd-scrub-progress' ] });
    const readout  = elem('div', { classList: [ 'wd-tracking-readout' ] });
    const scrub    = elem('div', { classList: [ 'wd-scrub' ], tabIndex: 0 });
    const time     = elem('div', { classList: [ 'wd-time' ] });
    const tracker  = new Worker('wistia-tracker.js');
    const video    = elem('video', { classList: [ 'wd-video' ], id, src });

    let dragging;
    let lastTimeStr;
    let lastWF, lastRWF;

    scrub.setAttribute('aria-controls', id);

    player.appendChild(readout);
    player.appendChild(video);
    player.appendChild(scrub);
    scrub.appendChild(time);
    scrub.appendChild(progress);
    scrub.appendChild(nub);

    // Using max-x + flex so that the video is never scaled above its natural
    // resolution but scales down as needed for mobile devices.

    video.addEventListener('loadedmetadata', event => {
      video.style.maxHeight = `${ video.videoHeight }px`;
      video.style.maxWidth = `${ video.videoWidth }px`;

      video.addEventListener('click', event => {
        if (event.target === video) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        }
      });

      scrub.addEventListener('mousedown', event => {
        scrub.classList.add('dragging');
        video.currentTime = video.duration * xFraction(event, video);
        dragging = true;
        watchUpdate();
        video.pause();
      });

      player.addEventListener('mousemove', event => {
        if (dragging) {
          video.currentTime = video.duration * xFraction(event, video);
          watchUpdate();
        }
      });

      document.addEventListener('mouseup', event => {
        if (dragging) {
          scrub.classList.remove('dragging');
          dragging = false;
          video.play();
        }
      });

      tracker.postMessage(video.duration);
    });

    const watchUpdate = () => requestAnimationFrame(() => {
      progress.style.width = `${ video.currentTime * 100 / video.duration }%`;

      const timeStr = formatTime(video.currentTime);

      if (timeStr !== lastTimeStr) {
        time.textContent = timeStr;
        lastTimeStr = timeStr;
      }

      if (!dragging) {
        tracker.postMessage(video.currentTime);
      }

      if (!video.paused) {
        watchUpdate();
      }
    });

    video.addEventListener('playing', watchUpdate);

    tracker.addEventListener('message', ({ data: { rewatch, watch } }) => {
      if (watch === lastWF && rewatch === lastRWF) {
        return;
      }

      if (rewatch >= rewatchThreshold) {
        console.log(`Hoorj! 🍭 ${ percent(rewatchThreshold) } rewatched! 🍭`);
        readout.remove();
        tracker.terminate();
      } else {
        readout.textContent =
          `WATCHED: ${ percent(watch) } / REWATCHED: ${ percent(rewatch) }`;
      }
    });

    return player;
  };
})();

// INIT ////////////////////////////////////////////////////////////////////////

document.body.appendChild(
  createPlayer({ rewatchThreshold: 0.25, src: 'file.mp4' })
);
