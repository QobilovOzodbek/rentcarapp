import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) router.replace("/login");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          router.replace("/login");
        } else {
          router.replace("./(tabs)");
        }
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  // ... oldingi kodlar o'z holicha qoladi ...
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />

      <Stack.Screen
        name="add-car"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="edit-car"
        options={{ headerShown: false, presentation: "modal" }}
      />
      {/* Yangi admin qo'shish oynasi */}
      <Stack.Screen
        name="add-admin"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="rent-car"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="finish-rental"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="statistics"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
}
