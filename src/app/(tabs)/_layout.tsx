import { Redirect, Tabs } from 'expo-router';

import { FloatingTabBar } from '@/components/FloatingTabBar';
import { SwipeTabs } from '@/components/SwipeTabs';
import { useAppStore } from '@/store/useAppStore';

export default function TabsLayout() {
  const hasPlan = useAppStore((s) => s.plan !== null);
  if (!hasPlan) return <Redirect href="/welcome" />;

  return (
    // Swipe between the tabs; "shift" slides the pages the way you went (also when the bar is tapped).
    <SwipeTabs>
      <Tabs screenOptions={{ headerShown: false, animation: 'shift' }} tabBar={(props) => <FloatingTabBar {...props} />}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="plan" />
        <Tabs.Screen name="routines" />
        <Tabs.Screen name="progress" />
        <Tabs.Screen name="settings" />
      </Tabs>
    </SwipeTabs>
  );
}
