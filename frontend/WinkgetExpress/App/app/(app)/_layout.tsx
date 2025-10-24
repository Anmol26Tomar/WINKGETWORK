import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// This could also be your Tab navigator if you want to define it here
// But for simplicity, we'll just use Slot to render the children.
export default function AppLayout() {
  return (
    <>
      <Slot />
      <StatusBar style="light" />
    </>
  );
}


