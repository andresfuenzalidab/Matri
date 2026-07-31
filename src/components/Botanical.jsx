const C = {
  rose1: '#D4ACA4', rose2: '#BE8876', rose3: '#A26458', rose4: '#8B4848',
  leaf1: '#6B8A56', leaf2: '#8AAD6A', leaf3: '#4E6B3A',
  stem: '#7A6845', stemDark: '#5C4E30',
  wist1: '#C8B4DC', wist2: '#A898C0',
  cream: '#F0EBE3',
}

function Rose({ x = 0, y = 0, s = 1, r = 0, op = 1 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`} opacity={op}>
      {[0,72,144,216,288].map(a => (
        <path key={a} transform={`rotate(${a})`}
          d="M0 4 C-14-4-18-26-10-40 C-5-50 5-50 10-40 C18-26 14-4 0 4Z"
          fill={C.rose1} opacity="0.88"/>
      ))}
      {[36,108,180,252,324].map(a => (
        <path key={a} transform={`rotate(${a})`}
          d="M0 3 C-9-3-12-18-7-27 C-3-33 3-33 7-27 C12-18 9-3 0 3Z"
          fill={C.rose2} opacity="0.92"/>
      ))}
      <circle r="9" fill={C.rose3}/>
      <circle r="5" fill={C.rose4} opacity="0.8"/>
      <circle r="2.5" fill={C.rose3} opacity="0.5"/>
    </g>
  )
}

function RoseBud({ x = 0, y = 0, s = 1, r = 0 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 2 C-7-4-8-18-4-24 C-2-28 2-28 4-24 C8-18 7-4 0 2Z" fill={C.rose2}/>
      <path d="M-4-8 C-8-14-8-22-4-24" fill="none" stroke={C.leaf2} strokeWidth="2" opacity="0.7"/>
      <path d="M4-8 C8-14 8-22 4-24" fill="none" stroke={C.leaf2} strokeWidth="2" opacity="0.7"/>
    </g>
  )
}

function Leaf({ x = 0, y = 0, s = 1, r = 0, flip = false, op = 1 }) {
  const sx = flip ? -s : s
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${sx},${s})`} opacity={op}>
      <path d="M0 0 C8-16 28-22 48-12 C28 4 8 8 0 0Z" fill={C.leaf2}/>
      <path d="M0 0 C14-6 30-10 48-12" fill="none" stroke={C.leaf3} strokeWidth="0.8" opacity="0.6"/>
      <path d="M12-2 C16-10 22-16 32-16" fill="none" stroke={C.leaf3} strokeWidth="0.5" opacity="0.4"/>
      <path d="M28-6 C30-12 35-16 40-16" fill="none" stroke={C.leaf3} strokeWidth="0.5" opacity="0.4"/>
    </g>
  )
}

function Stem({ d, w = 1.5, op = 0.7 }) {
  return <path d={d} fill="none" stroke={C.stem} strokeWidth={w} opacity={op} strokeLinecap="round"/>
}

function WisteriaRaceme({ x, y, length = 90, floretCount = 18 }) {
  const florets = []
  const rows = 7
  for (let row = 0; row < rows; row++) {
    const fy = (length / rows) * row
    const spread = 18 * (1 - row / rows) * 1.2
    const n = Math.max(1, Math.round(4 - row * 0.5))
    for (let i = 0; i < n; i++) {
      const fx = n === 1 ? 0 : spread * (-0.5 + i / (n - 1))
      florets.push({ fx, fy, i: florets.length })
    }
  }
  return (
    <g transform={`translate(${x},${y})`}>
      <Stem d={`M0 0 C3 ${length * 0.4} -3 ${length * 0.7} 0 ${length}`} w="1.2"/>
      {florets.map(f => (
        <ellipse key={f.i} cx={f.fx} cy={f.fy + 6}
          rx="4.5" ry="6.5"
          fill={f.i % 2 === 0 ? C.wist1 : C.wist2}
          opacity="0.82"/>
      ))}
    </g>
  )
}

// ── Exported botanical compositions ──────────────────────────────────

export function BotanicalHeroLeft({ style }) {
  return (
    <svg viewBox="0 0 320 600" style={{ width: 320, height: 600, overflow: 'visible', ...style }}
      aria-hidden="true">
      {/* Main arching branch */}
      <Stem d="M -20 600 C 60 400 100 200 80 0" w="2.5"/>
      <Stem d="M 10 600 C 80 420 110 220 95 20" w="1.5" op={0.4}/>
      {/* Wisteria clusters */}
      <WisteriaRaceme x={55} y={50} length={100}/>
      <WisteriaRaceme x={75} y={130} length={85}/>
      <WisteriaRaceme x={45} y={220} length={70}/>
      <WisteriaRaceme x={85} y={300} length={60}/>
      {/* Roses on branch */}
      <Rose x={70} y={80} s={1.1} r={15}/>
      <Rose x={100} y={200} s={0.9} r={-10}/>
      <Rose x={80} y={350} s={1.0} r={5}/>
      <RoseBud x={90} y={160} s={0.7} r={20}/>
      <RoseBud x={60} y={280} s={0.8} r={-15}/>
      {/* Leaves */}
      <Leaf x={50} y={100} r={30} s={0.9}/>
      <Leaf x={60} y={100} r={-150} s={0.8} flip/>
      <Leaf x={85} y={230} r={40} s={1.0}/>
      <Leaf x={95} y={230} r={-140} s={0.9} flip/>
      <Leaf x={65} y={370} r={25} s={0.85}/>
      <Leaf x={75} y={370} r={-160} s={0.8} flip/>
      <Leaf x={40} y={160} r={60} s={0.7}/>
      <Leaf x={95} y={310} r={-20} s={0.75} flip/>
      {/* Small side stems */}
      <Stem d="M 80 80 C 120 60 160 55 190 45" w="1" op={0.5}/>
      <Stem d="M 100 200 C 140 190 170 175 200 160" w="1" op={0.5}/>
    </svg>
  )
}

export function BotanicalHeroRight({ style }) {
  return (
    <svg viewBox="0 0 320 600" style={{ width: 320, height: 600, overflow: 'visible', ...style }}
      aria-hidden="true">
      <Stem d="M 340 600 C 260 400 220 200 240 0" w="2.5"/>
      <Stem d="M 310 600 C 240 420 210 220 225 20" w="1.5" op={0.4}/>
      <WisteriaRaceme x={260} y={50} length={100}/>
      <WisteriaRaceme x={240} y={140} length={85}/>
      <WisteriaRaceme x={270} y={230} length={70}/>
      <WisteriaRaceme x={235} y={310} length={60}/>
      <Rose x={250} y={90} s={1.1} r={-15}/>
      <Rose x={220} y={210} s={0.9} r={10}/>
      <Rose x={245} y={360} s={1.0} r={-5}/>
      <RoseBud x={230} y={170} s={0.7} r={-20}/>
      <RoseBud x={260} y={290} s={0.8} r={15}/>
      <Leaf x={270} y={110} r={150} s={0.9} flip/>
      <Leaf x={260} y={110} r={-30} s={0.8}/>
      <Leaf x={240} y={240} r={140} s={1.0} flip/>
      <Leaf x={225} y={240} r={-40} s={0.9}/>
      <Leaf x={255} y={380} r={155} s={0.85} flip/>
      <Leaf x={245} y={380} r={-25} s={0.8}/>
      <Leaf x={285} y={170} r={120} s={0.7} flip/>
      <Leaf x={225} y={320} r={-160} s={0.75}/>
      <Stem d="M 240 90 C 200 70 160 65 130 55" w="1" op={0.5}/>
      <Stem d="M 220 210 C 180 200 150 185 120 170" w="1" op={0.5}/>
    </svg>
  )
}

export function BotanicalDivider({ style, flip = false }) {
  const transform = flip ? 'scaleY(-1)' : undefined
  return (
    <svg viewBox="0 0 900 160" preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', maxWidth: 900, display: 'block', ...style }}
      aria-hidden="true">
      <g transform={transform} style={{ transformOrigin: '450px 80px' }}>
        {/* Central horizontal branch */}
        <Stem d="M 80 80 C 250 60 420 70 450 75 C 480 70 650 60 820 80" w="1.8"/>
        {/* Left side */}
        <Stem d="M 80 80 C 50 70 20 55 -20 50" w="1.2" op={0.5}/>
        <Stem d="M 220 68 C 220 40 215 20 210 5" w="1.2" op={0.5}/>
        <Stem d="M 350 71 C 350 50 345 30 340 10" w="1" op={0.4}/>
        {/* Right side */}
        <Stem d="M 820 80 C 850 70 880 55 920 50" w="1.2" op={0.5}/>
        <Stem d="M 680 68 C 680 40 685 20 690 5" w="1.2" op={0.5}/>
        <Stem d="M 550 71 C 550 50 555 30 560 10" w="1" op={0.4}/>
        {/* Roses */}
        <Rose x={160} y={68} s={0.85}/>
        <Rose x={450} y={72} s={1.0}/>
        <Rose x={740} y={68} s={0.85}/>
        <Rose x={310} y={66} s={0.7} r={-8}/>
        <Rose x={590} y={66} s={0.7} r={8}/>
        <RoseBud x={220} y={20} s={0.6}/>
        <RoseBud x={680} y={20} s={0.6}/>
        {/* Leaves throughout */}
        <Leaf x={100} y={72} r={-10} s={0.8} flip/>
        <Leaf x={100} y={72} r={15} s={0.8}/>
        <Leaf x={220} y={52} r={-80} s={0.7}/>
        <Leaf x={280} y={66} r={10} s={0.75}/>
        <Leaf x={390} y={68} r={-5} s={0.8} flip/>
        <Leaf x={510} y={68} r={10} s={0.8}/>
        <Leaf x={620} y={66} r={-10} s={0.75} flip/>
        <Leaf x={680} y={52} r={-100} s={0.7} flip/>
        <Leaf x={800} y={72} r={-15} s={0.8} flip/>
        <Leaf x={800} y={72} r={5} s={0.8}/>
        {/* Wisteria drops */}
        <WisteriaRaceme x={155} y={72} length={65}/>
        <WisteriaRaceme x={445} y={76} length={75}/>
        <WisteriaRaceme x={735} y={72} length={65}/>
      </g>
    </svg>
  )
}

export function BotanicalCornerTopLeft({ style }) {
  return (
    <svg viewBox="0 0 250 250" style={{ width: 250, height: 250, overflow: 'visible', ...style }}
      aria-hidden="true">
      <Stem d="M 0 250 C 30 180 50 100 40 0" w="2"/>
      <Stem d="M 0 200 C 50 160 120 120 240 80" w="2"/>
      <Rose x={45} y={80} s={0.95} r={10}/>
      <Rose x={150} y={90} s={0.8} r={-5}/>
      <Rose x={35} y={180} s={0.8} r={-10}/>
      <RoseBud x={80} y={50} s={0.65}/>
      <WisteriaRaceme x={42} y={85} length={70}/>
      <Leaf x={20} y={130} r={40} s={0.85}/>
      <Leaf x={20} y={130} r={-140} s={0.8} flip/>
      <Leaf x={100} y={100} r={-20} s={0.8}/>
      <Leaf x={200} y={88} r={-30} s={0.75}/>
    </svg>
  )
}

export function BotanicalCornerTopRight({ style }) {
  return (
    <svg viewBox="0 0 250 250" style={{ width: 250, height: 250, overflow: 'visible', ...style }}
      aria-hidden="true">
      <Stem d="M 250 250 C 220 180 200 100 210 0" w="2"/>
      <Stem d="M 250 200 C 200 160 130 120 10 80" w="2"/>
      <Rose x={205} y={80} s={0.95} r={-10}/>
      <Rose x={100} y={90} s={0.8} r={5}/>
      <Rose x={215} y={180} s={0.8} r={10}/>
      <RoseBud x={170} y={50} s={0.65}/>
      <WisteriaRaceme x={202} y={85} length={70}/>
      <Leaf x={230} y={130} r={140} s={0.85} flip/>
      <Leaf x={230} y={130} r={-40} s={0.8}/>
      <Leaf x={150} y={100} r={20} s={0.8} flip/>
      <Leaf x={50} y={88} r={30} s={0.75} flip/>
    </svg>
  )
}

export function FloralFooter({ style }) {
  return (
    <svg viewBox="0 0 900 200" preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', maxWidth: 900, display: 'block', ...style }}
      aria-hidden="true">
      {/* Ground vine */}
      <Stem d="M 0 150 C 150 130 300 120 450 125 C 600 120 750 130 900 150" w="2.2"/>
      <Stem d="M 0 160 C 150 145 300 138 450 142 C 600 138 750 145 900 160" w="1.2" op={0.4}/>
      {/* Rising branches */}
      <Stem d="M 200 148 C 180 100 170 60 165 20" w="1.5"/>
      <Stem d="M 450 125 C 440 80 445 45 450 10" w="1.8"/>
      <Stem d="M 700 148 C 720 100 730 60 735 20" w="1.5"/>
      {/* Roses */}
      <Rose x={165} y={45} s={1.0} r={10}/>
      <Rose x={450} y={30} s={1.2}/>
      <Rose x={735} y={45} s={1.0} r={-10}/>
      <Rose x={310} y={128} s={0.85}/>
      <Rose x={590} y={128} s={0.85}/>
      <RoseBud x={130} y={110} s={0.7}/>
      <RoseBud x={770} y={110} s={0.7}/>
      {/* Wisteria */}
      <WisteriaRaceme x={160} y={50} length={80}/>
      <WisteriaRaceme x={445} y={35} length={90}/>
      <WisteriaRaceme x={730} y={50} length={80}/>
      {/* Leaves */}
      <Leaf x={130} y={135} r={-30} s={0.9}/>
      <Leaf x={130} y={135} r={160} s={0.85} flip/>
      <Leaf x={370} y={125} r={-10} s={0.85} flip/>
      <Leaf x={530} y={125} r={15} s={0.85}/>
      <Leaf x={770} y={135} r={30} s={0.9} flip/>
      <Leaf x={770} y={135} r={-160} s={0.85}/>
      <Leaf x={60} y={148} r={20} s={0.8}/>
      <Leaf x={840} y={148} r={160} s={0.8} flip/>
    </svg>
  )
}

export function SmallRoseSpray({ style }) {
  return (
    <svg viewBox="0 0 200 120" style={{ width: 200, height: 120, overflow: 'visible', ...style }}
      aria-hidden="true">
      <Stem d="M 20 110 C 60 70 100 50 150 30" w="1.5"/>
      <Stem d="M 70 80 C 90 55 100 40 110 20" w="1" op={0.5}/>
      <Rose x={100} y={55} s={0.85}/>
      <RoseBud x={145} y={35} s={0.65} r={-15}/>
      <RoseBud x={55} y={78} s={0.55} r={10}/>
      <Leaf x={65} y={72} r={30} s={0.75}/>
      <Leaf x={80} y={62} r={-150} s={0.7} flip/>
      <Leaf x={130} y={42} r={20} s={0.7}/>
      <WisteriaRaceme x={96} y={60} length={55}/>
    </svg>
  )
}

export function BotanicalSideVine({ side = 'left', style }) {
  const isLeft = side === 'left'
  const vw = 120
  const x1 = isLeft ? 100 : 20
  const x2 = isLeft ? 80 : 40
  return (
    <svg viewBox={`0 0 ${vw} 500`}
      style={{ width: vw, height: 500, overflow: 'visible', ...style }}
      aria-hidden="true">
      <Stem d={`M ${x1} 0 C ${x2-10} 150 ${x1+10} 300 ${x2} 500`} w="2"/>
      <Rose x={isLeft ? 85 : 35} y={80} s={0.85} r={isLeft ? -10 : 10}/>
      <Rose x={isLeft ? 90 : 30} y={250} s={0.9} r={isLeft ? 8 : -8}/>
      <Rose x={isLeft ? 80 : 40} y={410} s={0.8} r={isLeft ? -5 : 5}/>
      <RoseBud x={isLeft ? 92 : 28} y={165} s={0.6}/>
      <RoseBud x={isLeft ? 78 : 42} y={330} s={0.6}/>
      <WisteriaRaceme x={isLeft ? 82 : 32} y={85} length={70}/>
      <WisteriaRaceme x={isLeft ? 87 : 27} y={255} length={65}/>
      <Leaf x={isLeft ? 65 : 45} y={100} r={isLeft ? 20 : 160} s={0.8} flip={!isLeft}/>
      <Leaf x={isLeft ? 70 : 50} y={270} r={isLeft ? -25 : -155} s={0.8} flip={!isLeft}/>
      <Leaf x={isLeft ? 60 : 60} y={420} r={isLeft ? 30 : 150} s={0.75} flip={!isLeft}/>
    </svg>
  )
}

export function BotanicalOrnament({ style }) {
  return (
    <svg viewBox="0 0 300 80" style={{ width: 300, height: 80, overflow: 'visible', ...style }}
      aria-hidden="true">
      <Stem d="M 30 40 C 100 30 200 30 270 40" w="1.5"/>
      <Stem d="M 30 40 C 0 35 -20 30 -40 25" w="1" op={0.4}/>
      <Stem d="M 270 40 C 300 35 320 30 340 25" w="1" op={0.4}/>
      <Rose x={150} y={38} s={0.75}/>
      <RoseBud x={80} y={35} s={0.55} r={8}/>
      <RoseBud x={220} y={35} s={0.55} r={-8}/>
      <Leaf x={55} y={38} r={-10} s={0.65} flip/>
      <Leaf x={245} y={38} r={10} s={0.65}/>
      <Leaf x={110} y={35} r={5} s={0.6}/>
      <Leaf x={190} y={35} r={-5} s={0.6} flip/>
      <WisteriaRaceme x={146} y={42} length={35}/>
    </svg>
  )
}
