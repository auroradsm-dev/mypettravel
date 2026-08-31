import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { useAppStore } from '../src/store/useAppStore'
import { fetchRemoteUpdates } from '../src/engine/configLoader'

export default function RootLayout() {
  const appConfig = useAppStore((s) => s.appConfig)
  const updateRuleset = useAppStore((s) => s.updateRuleset)

  useEffect(() => {
    const { manifestUrl, fetchTimeoutMs } = appConfig.remoteConfig
    fetchRemoteUpdates(manifestUrl, fetchTimeoutMs, updateRuleset)
  }, [])

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(main)" />
    </Stack>
  )
}
