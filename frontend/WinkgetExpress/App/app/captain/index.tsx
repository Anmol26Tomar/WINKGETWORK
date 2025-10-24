import { Redirect } from 'expo-router';

export default function CaptainIndex() {
  return <Redirect href="/captain/(tabs)/home" />;
}