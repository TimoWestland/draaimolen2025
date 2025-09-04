import { useEffect, useMemo, useRef, useState } from 'react'

import { PlusSquare, Share } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#app/components/ui/alert-dialog'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function WelcomeDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [canInstall, setCanInstall] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosContent, setShowIosContent] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  const isClient = typeof window !== 'undefined'

  const inStandalone = useMemo(() => {
    if (!isClient) return false
    return (
      window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
      // biome-ignore lint/suspicious/noExplicitAny: lazy
      (navigator as any).standalone === true
    )
  }, [isClient])

  useEffect(() => {
    if (!isClient) return

    const ua = navigator.userAgent || ''
    const isIOS = /iPad|iPhone|iPod/.test(ua)
    const isSafari =
      /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|GSA/.test(ua)

    if (isIOS && isSafari && !inStandalone) {
      setIsIos(true)
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      if (!inStandalone) setCanInstall(true)
    }

    const onAppInstalled = () => {
      setCanInstall(false)
      setIsIos(false)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onDisplayModeChange = () => {
      if (mq?.matches) {
        setCanInstall(false)
        setIsIos(false)
      }
    }
    mq?.addEventListener?.('change', onDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      mq?.removeEventListener?.('change', onDisplayModeChange)
    }
  }, [isClient, inStandalone])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosContent(true)
      return
    }
    const dp = deferredPromptRef.current
    if (!dp) return
    setCanInstall(false)
    await dp.prompt()
    const { outcome } = await dp.userChoice
    if (outcome === 'dismissed') setCanInstall(true)
    deferredPromptRef.current = null
  }

  if (inStandalone) {
    return null
  }

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-pretty text-left">
            <AlertDialogTitle>Draaimolen Timetable App</AlertDialogTitle>
            <p className="mb-4 text-sm">
              I built this app based on the spreadsheet provided by Draaimolen
              to create a nicer timetable experience (and because I don't want
              to use Excel during a festival 😛)
            </p>

            <ul className="mb-2 ml-4 list-disc space-y-2 text-sm">
              <li>
                Save this website to your phone's home screen so you can open
                like an any other app
              </li>
              <li>Everything is saved locally on your phone</li>
              <li>
                The app should work offline, just don't fully close the app.
              </li>
              <li>Save your favorite acts by tapping on the time slot.</li>
            </ul>
            <p className="mb-2 text-sm">
              <b>Disclaimer:</b> This app is not affiliated with or provided by
              the Draaimolen festival. I built this app in a few spare hours. A
              working app and correct data is therefore not guaranteed.
            </p>
            <p className="text-sm">
              Have a splendid rave in the forest!
              <br />
              <i>x Timo</i>
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {canInstall && !inStandalone ? (
              <AlertDialogAction onClick={handleInstallClick}>
                Install app
              </AlertDialogAction>
            ) : null}
            <AlertDialogAction onClick={handleInstallClick}>
              Install app
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <IosDialog open={showIosContent} onOpenChange={setShowIosContent} />
    </>
  )
}

function IosDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader className="text-pretty text-left">
          <AlertDialogTitle className="mb-2">
            Install this app on iOS
          </AlertDialogTitle>
          <ul className="mb-4 list-disc space-y-2 text-sm">
            <li className="flex items-center gap-2">
              1. Tap the <Share size={20} /> icon
            </li>
            <li className="flex items-center gap-2">
              2. Tap <PlusSquare size={20} /> Add to home screen
            </li>
          </ul>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
