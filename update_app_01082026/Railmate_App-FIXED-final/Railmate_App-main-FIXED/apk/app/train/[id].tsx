// Redirect shim: /train/[id] → /train-detail?id=[id]
// Both app/train/[id].tsx and app/train-detail.tsx exist; this file
// delegates to the implemented screen so search results navigation works.
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function TrainByIdRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/train-detail?id=${id ?? ''}` as any} />;
}
