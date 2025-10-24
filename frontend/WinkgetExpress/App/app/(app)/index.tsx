import { Redirect } from 'expo-router';

export default function AppIndex() {
  // Redirect to the main tabs when accessing the app root
  return <Redirect href="/(app)/(tabs)" />;
}


