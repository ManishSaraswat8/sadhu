# Home Page Video And Image Guidelines

These recommendations are tuned for the current `AboutSection` implementation and the provided assets.

## Recommended Video Treatment

- Placement: `Our Mission` section (`src/components/AboutSection.tsx`)
- Container: rounded frame with subtle border/shadow
- Aspect ratio: `16:9` (`aspect-video`)
- Behavior: `autoplay`, `muted`, `loop`, `playsInline`, `preload="auto"`
- Fallback: show controls if autoplay is blocked by browser policy

## Professional Sizing Targets

- Desktop:
  - Max visual width: `1120px` to `1240px`
  - Ratio: `16:9`
- Tablet:
  - Keep `16:9`, full content width inside section padding
- Mobile:
  - Keep `16:9` with full width
  - Avoid decorative side frames that reduce visible media area

## Image Usage

- Preferred poster image: `src/assets/IMG_9470.jpg` (mountain + board)
- Secondary image: `src/assets/IMG_9459.png` (nervous system visual) for optional supporting content, not the primary video poster

## Export Guidance

- Poster primary export: `1920x1080` (JPG/WebP)
- Poster fallback export: `1280x720`
- Optional supporting portrait image export: `1200x1600` (3:4)

## Cross-Browser Playback Note

- `home.mov` is currently bundled and used directly.
- For strongest cross-browser reliability, provide an H.264 MP4 and set:
  - `VITE_HOME_VIDEO_MP4_URL=<public-mp4-url>`
- The component will prioritize MP4 when this environment variable is set.
