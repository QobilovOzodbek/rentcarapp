import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [ism, setIsm] = useState(params.ism as string);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  const [ijaralarSoni, setIjaralarSoni] = useState(0);
  const [keltirganFoyda, setKeltirganFoyda] = useState(0);

  const xabarChikarish = (sarlovha: string, matn: string) => {
    Platform.OS === "web"
      ? window.alert(`${sarlovha}: ${matn}`)
      : Alert.alert(sarlovha, matn);
  };

  useEffect(() => {
    const shaxsiyStatisikaniYuklash = async () => {
      const { data } = await supabase
        .from("rentals")
        .select("umumiy_summa")
        .eq("admin_id", params.id)
        .eq("status", "yakunlangan");
      if (data) {
        setIjaralarSoni(data.length);
        setKeltirganFoyda(
          data.reduce((sum, item) => sum + (item.umumiy_summa || 0), 0),
        );
      }
      setStatsLoading(false);
    };
    shaxsiyStatisikaniYuklash();
  }, [params.id]);

  const malumotniYangilash = async () => {
    if (!ism.trim()) {
      xabarChikarish("Diqqat", "Ismni bo'sh qoldirib bo'lmaydi!");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ ism: ism.trim() })
      .eq("id", params.id);
    setLoading(false);

    if (error) xabarChikarish("Xatolik", error.message);
    else {
      xabarChikarish("Muvaffaqiyat", "Xodim ma'lumotlari yangilandi!");
      router.back();
    }
  };

  // 🔑 Xodimga parolni tiklash xatini yuborish
  const parolniTiklashniYuborish = async () => {
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      params.email as string,
    );
    setResetLoading(false);

    if (error) xabarChikarish("Xatolik", error.message);
    else
      xabarChikarish(
        "Muvaffaqiyat",
        "Parolni tiklash xati ushbu pochtaga yuborildi!",
      );
  };

  const adminniOchirish = () => {
    const ruxsat = async () => {
      setLoading(true);
      const { error } = await supabase
        .from("profiles")
        .update({ role: "ochirilgan" })
        .eq("id", params.id);
      if (error) {
        xabarChikarish("Xatolik", error.message);
        setLoading(false);
      } else {
        router.dismissAll();
      }
    };
    if (Platform.OS === "web") {
      if (window.confirm(`${ism} tizimdan o'chirilsinmi?`)) ruxsat();
    } else {
      Alert.alert(
        "Xodimni o'chirish",
        `${ism} o'chirilsa, u tizimga qayta kira olmaydi. Tasdiqlaysizmi?`,
        [
          { text: "Bekor qilish", style: "cancel" },
          { text: "O'chirish", style: "destructive", onPress: ruxsat },
        ],
      );
    }
  };

  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

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
            <Text style={styles.title}>Xodim Profili</Text>
          </View>

          <Text style={styles.sectionTitle}>Shaxsiy Natijalar</Text>
          {statsLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <View style={styles.statsContainer}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
                ]}
              >
                <Text style={styles.statValue}>{ijaralarSoni} ta</Text>
                <Text style={styles.statLabel}>Ijaralar</Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
                ]}
              >
                <Text style={[styles.statValue, { color: "#15803D" }]}>
                  {formatPrice(keltirganFoyda)}
                </Text>
                <Text style={styles.statLabel}>Keltirilgan Foyda</Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Ma'lumotlarni Tahrirlash</Text>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Elektron pochta</Text>
              <View
                style={[styles.inputWrapper, { backgroundColor: "#F1F5F9" }]}
              >
                <TextInput
                  style={[styles.input, { color: "#94A3B8" }]}
                  value={params.email as string}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ism va Familiya</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={ism}
                  onChangeText={setIsm}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={malumotniYangilash}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>Saqlash</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resetPasswordZone}>
            <Text style={styles.resetTitle}>Xavfsizlik</Text>
            <Text style={styles.resetDesc}>
              Agar xodim parolini unutgan bo'lsa, quyidagi tugma orqali uning
              pochtasiga parolni tiklash (Reset Password) xatini yuborishingiz
              mumkin.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={parolniTiklashniYuborish}
              disabled={resetLoading}
            >
              {resetLoading ? (
                <ActivityIndicator color="#2563EB" />
              ) : (
                <Text style={styles.resetBtnText}>
                  Parolni tiklash xatini yuborish
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Xavfli hudud</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={adminniOchirish}
              disabled={loading}
            >
              <Text style={styles.deleteBtnText}>Xodimni o'chirish</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
    marginTop: 10,
  },
  statsContainer: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1 },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  form: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#64748B", marginBottom: 8 },
  inputWrapper: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "center",
  },
  input: { fontSize: 16, color: "#0F172A", outlineStyle: "none" as any },
  submitBtn: {
    backgroundColor: "#2563EB",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  resetPasswordZone: {
    backgroundColor: "#EFF6FF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 24,
  },
  resetTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E3A8A",
    marginBottom: 8,
  },
  resetDesc: {
    fontSize: 13,
    color: "#1E3A8A",
    lineHeight: 20,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  resetBtnText: { color: "#2563EB", fontWeight: "700", fontSize: 15 },

  dangerZone: {
    backgroundColor: "#FEF2F2",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#991B1B",
    marginBottom: 12,
  },
  deleteBtn: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteBtnText: { color: "#DC2626", fontWeight: "700", fontSize: 15 },
});
