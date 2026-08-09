import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

/**
 * Video that fakes transparency with `mix-blend-mode: multiply` — the source
 * clips have a white matte baked in, not a real alpha channel.
 *
 * Chrome and Safari composite a <video> on its own GPU layer and, on a cold
 * load, build that layer before a single frame has been decoded. The blend
 * mode never gets applied to it, so the white matte shows through. Reloading
 * hides the bug: the file comes from cache and the first frame is already
 * there when the layer is built.
 *
 * Fix: mount unblended and invisible, then switch the blend mode on *after*
 * `loadeddata` reports decoded frames, and only fade in on a later frame.
 * Changing the style at that point forces the layer to be re-composited —
 * this time with blending — before anything is visible.
 */
const PHASES = {
  loading:  { mixBlendMode: 'normal',   opacity: 0 },
  blending: { mixBlendMode: 'multiply', opacity: 0 },
  visible:  { mixBlendMode: 'multiply', opacity: 1 },
}

const BlendVideo = forwardRef(function BlendVideo({ style, ...props }, ref) {
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
    <video
      ref={videoRef}
      muted
      playsInline
      preload="auto"
      {...props}
      onLoadedData={reveal}
      style={{ ...style, ...PHASES[phase], transition: 'opacity 0.4s ease' }}
    />
  )
})

export default BlendVideo
