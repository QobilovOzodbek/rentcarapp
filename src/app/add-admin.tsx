import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddAdminScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ism, setIsm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const xabarChikarish = (sarlovha: string, matn: string) => {
    Platform.OS === "web"
      ? window.alert(`${sarlovha}: ${matn}`)
      : Alert.alert(sarlovha, matn);
  };

  const adminQoshish = async () => {
    if (!email.trim() || !password.trim() || !ism.trim()) {
      xabarChikarish("Diqqat", "Barcha maydonlarni to'ldiring!");
      return;
    }
    if (password.length < 6) {
      xabarChikarish(
        "Diqqat",
        "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Joriy Super Adminning sessiyasini saqlab qolamiz
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 2. Yangi foydalanuvchini yaratamiz
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) throw authError;

      // 3. DARHOL Super Admin profiliga qaytamiz (Yangi foydalanuvchiga o'tib qolishni oldini oladi)
      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      // 4. Profiles jadvaliga yozamiz
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          ism: ism.trim(),
          email: email.trim(),
          role: "admin",
        });

        if (profileError) throw profileError;
      }

      xabarChikarish("Muvaffaqiyat", "Yangi xodim muvaffaqiyatli qo'shildi!");
      router.back();
    } catch (err: any) {
      xabarChikarish("Xatolik", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.title}>Yangi Xodim</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ism va Familiya</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Xodim ismi"
                  value={ism}
                  onChangeText={setIsm}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Elektron pochta</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="email@gmail.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parol</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="******"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabledBtn]}
              onPress={adminQoshish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Saqlash</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginLeft: 16 },
  form: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#334155", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    outlineStyle: "none" as any,
  },
  submitBtn: {
    backgroundColor: "#059669",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  disabledBtn: { backgroundColor: "#6EE7B7" },
  submitBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
