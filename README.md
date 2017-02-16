# FE HTML Video Demo

```
npm install
node .
```

# Notes

For tracking, I initially envisioned modeling ranges as start/end pairs and
merging / splitting them as needed. Something like that probably would be ideal
if we wanted to send data back to a server, but it’s also kind of elaborate and
has a larger error surface area. When I looked at "accurate to at least 1 second
of granularity" alongside "you can assume the video can be anywhere from 1
second to 4 hours long", it seemed to me a simpler, per-second model would be as
viable. Throwing it in a seperate thread might help avoid interfering with
performance on longer videos.

Probably not relevant, but I used `serve-static` because it supports range
requests.

I would have liked to take proper advantage of the various media API events, but
I realized one night might not be enough time for me to get a handle on all the
possible pathways and interactions they represent — plus it seems like there may
be some blind spots (e.g., by the time "seeking" fires you can no longer know
what the currentTime before "seeking" was). Since I needed a RAF loop anyway for
the progress bar ("timeupdate" doesn’t fire frequently enough for smooth
rendering), I send the tracking signals from there, too. It’s less sophisticated
than using the greater media event API but, again, it’s a solution that has a
smaller surface area for things to go wrong.

# Divergences

I threw a readout (percents watched & rewatched) into the UI so that it was
easier to confirm the behavior.

> Always show the current time of the video, next to the play head.

Originally I did this, but I noticed it was causing a perceptible loss of
animation smoothness, so I kept it in the left corner. I’d be curious to learn
how that could be avoided when there is continuous redraw w/ alpha over video.

# Bonus Considerations

> Tracking: Do you have an idea of the time/space complexity of your approach?

If you mean like, in big O notation ... nope. Maybe the approach I took would
only be reasonable for relatively short videos or situations where the
recalculation need not be done as often. That said, since it’s in a web worker,
I’m not sure if it would actually matter much in practice. Even for a four hour
video we’re still just looking at a 14kb buffer.

> Modularity: how difficult is it to put more than one video on the same page?

Pretty easy: call `createPlayer` to get as many as needed.

> Reusability: how difficult is it to track a different rewatched percentage?

Same deal — `createPlayer({ rewatchThreshold, src })`.

> Consistency: How would the player/tracker behave with videos of different
> lengths?

I’m not certain. As mentioned above, tracking would technically be slower, but
it doesn’t occur in the same thread and it wouldn’t be by much.

I just ran the code with a 14400 byte buffer (i.e. representing four hours) and
it still processed in under 4ms. Having seen that, I doubt there’s any need to
optimize it.

As for the video itself, as long as the backend supports range requests I
imagine it’d be fine. You’d probably want more nuance in the UI, e.g. an
indication of what has and hasn’t been loaded yet, proper handling of bad
network conditions, etc. With very long videos it might become more difficult to
seek, so maybe it would be worthwhile to introduce preview thumbnails.
