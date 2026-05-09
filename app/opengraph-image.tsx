import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'UniGateEU — Your gateway to European universities'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f1923',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Background gradient circles */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(46,134,193,0.18)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            right: -60,
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'rgba(124,58,237,0.12)',
            filter: 'blur(60px)',
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#2E86C1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              color: 'white',
            }}
          >
            🎓
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
            UniGateEU
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 58,
            fontWeight: 900,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: 900,
            marginBottom: 20,
            letterSpacing: '-1px',
          }}
        >
          Your Gateway to{' '}
          <span style={{ color: '#2E86C1' }}>European Universities</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            maxWidth: 700,
            marginBottom: 44,
            lineHeight: 1.4,
          }}
        >
          University matching · SOP generator · Scholarships · Visa guide
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(46,134,193,0.15)',
            border: '1.5px solid rgba(46,134,193,0.4)',
            borderRadius: 50,
            padding: '12px 28px',
            color: '#2E86C1',
            fontSize: 20,
            fontWeight: 600,
          }}
        >
          ⚡ 10 free credits on signup — no credit card required
        </div>

        {/* URL watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            color: 'rgba(255,255,255,0.25)',
            fontSize: 18,
          }}
        >
          www.unigateu.com
        </div>
      </div>
    ),
    { ...size }
  )
}
