import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

export function Qr({ text, size = 160 }: { text: string; size?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: size * 2, color: { dark: '#1c1c1c', light: '#ffffff' } }).then(setSrc)
  }, [text, size])
  return src ? <img className="qr" src={src} width={size} height={size} alt="QR code" /> : <span className="qr" style={{ width: size, height: size }} />
}
