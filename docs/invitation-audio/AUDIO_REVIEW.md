# LasO private invitation — audio-only candidate

November 10, 2026. Prepared for review; not merged or published to the live site.

## Completed

- Web Audio context is created/resumed from the existing Open invitation click handler. No autoplay or resume runs during page load.
- Original match strike plays first; looping crackle fades in across the unchanged eight-second burn.
- The first actual visible lightning frame invokes one thunder crack and stops crackle. Later visual strikes remain untouched and do not replay thunder.
- Optional owner voiceover starts at approximately one second when supplied and ready; fire has a separate ducking gain under it. No voice file was supplied, so no voice request or placeholder audio is made.
- Sound on/off control appears on opening, has an accessible label and a 44px touch target, and remembers preference when browser storage is available. It is fixed-position and does not move existing content.
- Failed assets, unavailable/blocked audio and denied storage are caught; audio never gates the visual animation or navigation. Backgrounding stops audio without automatically restarting it.
- Text Reginald starts no audio; tapping it stops any ongoing invitation sound without preventing the SMS link.
- Existing visuals and timings are byte-identical after removing the two audio hook lines and deferred script tag. Existing CSS, haptics, SMS URL, lightning schedule and 14.8-second finish remain unchanged.
- Assets preload only after at least one paint. Three original mono MP3s total 49,526 bytes; actual encoded durations are 0.705s match, 6.060s crackle and 3.004s thunder.

## Verification

14 automated behavioral checks passed, using simulated audio APIs and clocks. They cover first-paint preload ordering, gesture-only initial resume, ordering/fade, single thunder, optional voice timing/ducking, persistent mute, absent recording, failed fetch/storage, blocked/unsupported audio, SMS silence, background stop, reduced motion, pre-open tab switching and exact visual/timing-source preservation.

Desktop Chrome browser smoke checks observed: sound control absent before Open; control appears on tap; mute switches state and remains muted after reload/Open. Invitation continued visually while muted. These checks do not establish physical audibility or iPhone compatibility. Browser-extension metadata warnings were unrelated to page code; no invitation-script exception was observed.

No claim of real-device silent-switch behavior is made. The desktop test browser is not an iPhone. Every requested physical-iPhone case remains **NOT RUN** in IPHONE_TEST_MATRIX.md.

## Owner voiceover handoff

The sound effects are ready independently of voiceover. When the owner recording arrives, encode it as a small mono MP3 and set `window.LasoInvitationAudioConfig = { voiceoverUrl: 'audio/owner-voiceover.mp3' }` before the deferred audio script. This is intentionally not enabled until the actual recording is supplied. Test intelligibility and final levels with that recording before release. There is no synthetic substitute.

## Compatibility choices

If a tap occurs before an effect has loaded/decoded, that effect may be omitted; the page never waits or plays stale cues later. If audio is blocked, visuals still run. Mute preference is scoped to the browser/site storage that is available; separate browsers or in-app containers are not promised to share the preference.

Reduced motion preserves the existing instant reveal and omits the looping burn sound; otherwise it could loop without a lightning event. A supplied voice can still start at its normal cue. Backgrounded invitations become silent rather than restarting effects out of sync.

## Release gate

Review the preview, supply the owner voice recording, and complete the physical iPhone matrix. No live-site publication without Reginald's approval. The candidate does not alter the AI Trainer, App-e-tight, Supabase or the public website refresh branch.

## Sound revision 2

At Reginald’s request, the match now has a sharper dry contact, textured rasp and clearer ignition. Its duration is unchanged. Thunder has a fuller mid-bass impact and a longer rolling tail, still one cue at the first visible lightning frame. The fire asset is byte-identical to revision 1. Asset URLs are versioned to prevent the old cached effects from being replayed. Visual code and cue timing are unchanged.
