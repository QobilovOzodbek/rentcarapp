import { Session } from "@supabase/supabase-js";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";

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

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <View style={styles.webWrapper}>
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
            <Stack.Screen
              name="extend-rental"
              options={{ headerShown: false, presentation: "modal" }}
            />
            {/* Shu qatorni qo'shing: */}
            <Stack.Screen
              name="car-history"
              options={{ headerShown: false, presentation: "modal" }}
            />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Kompyuterda ochilganda orqa fon kulrang bo'ladi
    backgroundColor: Platform.OS === "web" ? "#E2E8F0" : "#FFFFFF",
    // Webda ilovani ekranning o'rtasiga olib kelish
    alignItems: Platform.OS === "web" ? "center" : "stretch",
    justifyContent: "center",
  },
  webWrapper: {
    flex: 1,
    width: "100%",
    // Kompyuterda maksimal 480px joy egallaydi
    maxWidth: Platform.OS === "web" ? 480 : "100%",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    // Kompyuterda chetlariga soya berish
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0px 10px 30px rgba(0,0,0,0.1)",
          maxHeight: "100vh" as unknown as number,
        }
      : {}),
  },
});
