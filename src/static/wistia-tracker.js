let lastSecond;
let seconds;

const getWatchFraction = watchTimes => {
  const watchedSeconds = seconds
    .map(i => i >= watchTimes)
    .filter(Boolean)
    .reduce((acc, n) => acc + n, 0);

  return watchedSeconds
    ? watchedSeconds / seconds.length
    : 0;
}

self.onmessage = ({ data }) => {
  const second = Math.round(data);

  if (!seconds) {
    seconds = new Uint8ClampedArray(second);
    return;
  }

  if (second !== lastSecond) {
    seconds[second]++;
    lastSecond = second;
  }

  self.postMessage({
    rewatch: getWatchFraction(2),
    watch:   getWatchFraction(1)
  });
};
