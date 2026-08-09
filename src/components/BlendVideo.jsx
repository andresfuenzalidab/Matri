import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * Video that fakes transparency with `mix-blend-mode: multiply` — the clips
 * carry a white matte, not a real alpha channel.
 *
 * The matte only vanishes if the video can multiply against the cream page
 * behind it, and blending is confined to the nearest ancestor that forms an
 * isolated group. The scroll-reveal wrapper is exactly such a group: it has
 * `opacity < 1` while it animates, and it used to settle on
 * `transform: translateY(0)`, which keeps the group alive for good. Inside
 * it there is no cream to multiply against, so the matte stayed white.
 * Reloading hid the bug because `.skip-reveal` drops both properties.
 *
 * Rather than depend on every ancestor behaving, the video brings its own
 * backdrop: an isolated wrapper painted in the page colour (`.blend-video`).
 * Blending resolves inside that wrapper, so ancestors no longer matter.
 *
 * The phase dance guards a second, unrelated quirk: Chrome builds a video's
 * GPU layer before the first frame is decoded and skips the blend on it. So
 * stay hidden until `loadeddata`, turn blending on one frame, fade in the next.
 */
const PHASES = {
  loading:  { mixBlendMode: 'normal',   opacity: 0 },
  blending: { mixBlendMode: 'multiply', opacity: 0 },
  visible:  { mixBlendMode: 'multiply', opacity: 1 },
}

const BlendVideo = forwardRef(function BlendVideo(
  { style, wrapperStyle, wrapperClassName, ...props }, ref
) {
  const videoRef = useRef(null)
  const revealedRef = useRef(false)
  const [phase, setPhase] = useState('loading')

  useImperativeHandle(ref, () => videoRef.current, [])

  function reveal() {
    if (revealedRef.current) return
    revealedRef.current = true
    setPhase('blending')
    // Two frames: one to commit the blend mode, one to start the fade.
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase('visible')))
  }

  useEffect(() => {
    // `loadeddata` can fire before React attaches the handler on a cache hit.
    if (videoRef.current?.readyState >= 2) reveal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <span
      className={wrapperClassName ? `blend-video ${wrapperClassName}` : 'blend-video'}
      style={wrapperStyle}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        {...props}
        onLoadedData={reveal}
        style={{ ...style, ...PHASES[phase], transition: 'opacity 0.4s ease' }}
      />
    </span>
  )
})

export default BlendVideo
