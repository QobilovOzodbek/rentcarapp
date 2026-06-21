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
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function EditCarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [model, setModel] = useState((params.model as string) || "");
  const [davlatRaqami, setDavlatRaqami] = useState(
    (params.davlat_raqami as string) || "",
  );

  // Agar narx 0 bo'lsa, input bo'sh turishi uchun shart beramiz
  const [soatlikNarx, setSoatlikNarx] = useState(
    params.soatlik_narx && params.soatlik_narx !== "0"
      ? params.soatlik_narx.toString()
      : "",
  );
  const [kunlikNarx, setKunlikNarx] = useState(
    params.kunlik_narx && params.kunlik_narx !== "0"
      ? params.kunlik_narx.toString()
      : "",
  );
  const [loading, setLoading] = useState(false);

  const xabarChikarish = (sarlovha: string, matn: string) => {
    if (Platform.OS === "web") window.alert(`${sarlovha}: ${matn}`);
    else Alert.alert(sarlovha, matn);
  };

  const mashinaniYangilash = async () => {
    if (!model.trim() || !davlatRaqami.trim()) {
      xabarChikarish("Diqqat!", "Model va davlat raqamini kiritish majburiy.");
      return;
    }

    if (!soatlikNarx.trim() && !kunlikNarx.trim()) {
      xabarChikarish(
        "Diqqat!",
        "Kamida bitta narx turini (soatlik yoki kunlik) kiriting.",
      );
      return;
    }

    setLoading(true);
    const tozaRaqam = davlatRaqami.replace(/\s+/g, "").toUpperCase();
    const tozaSoatlik = soatlikNarx.trim()
      ? parseFloat(soatlikNarx.replace(/[^0-9.]/g, ""))
      : 0;
    const tozaKunlik = kunlikNarx.trim()
      ? parseFloat(kunlikNarx.replace(/[^0-9.]/g, ""))
      : 0;

    const { error } = await supabase
      .from("cars")
      .update({
        model: model.trim(),
        davlat_raqami: tozaRaqam,
        soatlik_narx: tozaSoatlik,
        kunlik_narx: tozaKunlik,
      })
      .eq("id", params.id);

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        const xabar = "Bu davlat raqami boshqa mashinaga tegishli!";
        Platform.OS === "web"
          ? window.alert(xabar)
          : Alert.alert("Xatolik", xabar);
      } else {
        xabarChikarish("Xatolik", error.message);
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
            <Ionicons name="settings-outline" size={40} color="#059669" />
          </View>
          <Text style={styles.title}>Ma'lumotni Yangilash</Text>
          <Text style={styles.subtitle}>
            Transport parametrlarini tahrirlash
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
                value={davlatRaqami}
                onChangeText={setDavlatRaqami}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Soatlik ijara narxi</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="time-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={soatlikNarx}
                onChangeText={setSoatlikNarx}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kunlik ijara narxi</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
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
            onPress={mashinaniYangilash}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="save-outline"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryBtnText}>Yangilashni saqlash</Text>
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
    backgroundColor: "#D1FAE5",
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
    backgroundColor: "#059669",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: { backgroundColor: "#6EE7B7" },
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
