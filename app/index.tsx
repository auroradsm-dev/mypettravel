import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter, useRootNavigationState } from 'expo-router'
import { useAppStore } from '../src/store/useAppStore'

export default function Root() {
  const router = useRouter()
  const navigationState = useRootNavigationState()
  const isOnboarded = useAppStore((s) => s.isOnboarded)

  useEffect(() => {
    // Wait until the navigator is fully mounted before navigating
    if (!navigationState?.key) return
    router.replace(isOnboarded ? '/(main)/timeline' : '/(onboarding)/welcome')
  }, [navigationState?.key, isOnboarded])

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAF8', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color="#1A1A1A" />
    </View>
  )
}
