import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function AddCarScreen() {
  const [model, setModel] = useState("");
  const [davlatRaqami, setDavlatRaqami] = useState("");
  const [soatlikNarx, setSoatlikNarx] = useState("");
  const [kunlikNarx, setKunlikNarx] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const xabarChikarish = (sarlovha: string, matn: string) => {
    if (Platform.OS === "web") window.alert(`${sarlovha}: ${matn}`);
    else Alert.alert(sarlovha, matn);
  };

  const mashinaSaqlash = async () => {
    // 1. Asosiy maydonlarni tekshirish
    if (!model.trim() || !davlatRaqami.trim()) {
      xabarChikarish("Diqqat!", "Model va davlat raqamini kiritish majburiy.");
      return;
    }

    // 2. Narxlardan kamida bittasi kiritilganligini tekshirish
    if (!soatlikNarx.trim() && !kunlikNarx.trim()) {
      xabarChikarish(
        "Diqqat!",
        "Kamida bitta narx turini (soatlik yoki kunlik) kiriting.",
      );
      return;
    }

    setLoading(true);

    const tozaRaqam = davlatRaqami.replace(/\s+/g, "").toUpperCase();

    // Agar bo'sh bo'lsa 0 deb oladi, raqam bo'lsa o'qib oladi
    const tozaSoatlik = soatlikNarx.trim()
      ? parseFloat(soatlikNarx.replace(/[^0-9.]/g, ""))
      : 0;
    const tozaKunlik = kunlikNarx.trim()
      ? parseFloat(kunlikNarx.replace(/[^0-9.]/g, ""))
      : 0;

    const { error } = await supabase.from("cars").insert([
      {
        model: model.trim(),
        davlat_raqami: tozaRaqam,
        soatlik_narx: tozaSoatlik,
        kunlik_narx: tozaKunlik,
        holati: "bo'sh",
      },
    ]);

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        const msg =
          "Bunday mashina bor! Bu davlat raqami allaqachon ro'yxatga olingan.";
        Platform.OS === "web" ? window.alert(msg) : Alert.alert("Xatolik", msg);
      } else {
        xabarChikarish("Tizim xatoligi", error.message);
      }
      return;
    }

    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="car-sport-outline" size={40} color="#2563EB" />
          </View>
          <Text style={styles.title}>Yangi Mashina</Text>
          <Text style={styles.subtitle}>
            Avtopark bazasiga yangi transport qo'shish
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transport rusumi *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="cube-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Chevrolet Malibu 2"
                value={model}
                onChangeText={setModel}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Davlat raqami *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="barcode-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="01 A 777 AA"
                value={davlatRaqami}
                onChangeText={setDavlatRaqami}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Soatlik ijara narxi (Ixtiyoriy)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="50 000"
                value={soatlikNarx}
                onChangeText={setSoatlikNarx}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kunlik ijara narxi (Ixtiyoriy)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="600 000"
                value={kunlikNarx}
                onChangeText={setKunlikNarx}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={mashinaSaqlash}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryBtnText}>Saqlash</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.secondaryBtnText}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginTop: 20, marginBottom: 25 },
  iconContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center" },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 25,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0F172A",
    height: "100%",
    outlineStyle: "none" as any,
  },
  actionButtons: { gap: 12 },
  primaryBtn: {
    backgroundColor: "#2563EB",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: { backgroundColor: "#93C5FD" },
  primaryBtnText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "transparent",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  secondaryBtnText: { color: "#475569", fontSize: 15, fontWeight: "600" },
});
