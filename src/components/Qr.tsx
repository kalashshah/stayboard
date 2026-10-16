'use client'

import QRCode from 'qrcode'
import { useEffect, useState } from 'react'

export function Qr({ text, size = 160 }: { text: string; size?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    QRCode.toDataURL(text, { margin: 1, width: size * 2, color: { dark: '#171717', light: '#ffffff' } }).then(setSrc)
  }, [text, size])
  const cls = 'shrink-0 rounded-xl bg-white ring-1 ring-inset ring-stroke-soft-200'
  return src ? <img className={cls} src={src} width={size} height={size} alt="QR code" /> : <span className={cls} style={{ width: size, height: size }} />
}
