import { Redirect } from "expo-router";
import { useAppContext } from "../providers/app-provider";

export default function IndexScreen() {
  const { bootstrapComplete, session } = useAppContext();

  if (!bootstrapComplete) {
    return null;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}