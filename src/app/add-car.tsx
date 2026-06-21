import { useState } from "react";
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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddCarScreen() {
  const [model, setModel] = useState("");
  const [davlatRaqami, setDavlatRaqami] = useState("");
  const [soatlikNarx, setSoatlikNarx] = useState("");
  const [kunlikNarx, setKunlikNarx] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const xabarChikarish = (sarlovha: string, matn: string) => {
    Platform.OS === "web"
      ? window.alert(`${sarlovha}: ${matn}`)
      : Alert.alert(sarlovha, matn);
  };

  const mashinaQoshish = async () => {
    if (!model.trim() || !davlatRaqami.trim()) {
      xabarChikarish("Diqqat", "Model va Davlat raqamini kiritish majburiy!");
      return;
    }

    if (!soatlikNarx.trim() && !kunlikNarx.trim()) {
      xabarChikarish(
        "Diqqat",
        "Kamida soatlik yoki kunlik narxni kiritishingiz kerak!",
      );
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("cars").insert([
      {
        model: model.trim(),
        davlat_raqami: davlatRaqami.trim().toUpperCase(),
        soatlik_narx: soatlikNarx ? Number(soatlikNarx) : 0,
        kunlik_narx: kunlikNarx ? Number(kunlikNarx) : 0,
        holati: "bo'sh",
      },
    ]);

    setLoading(false);

    if (error) {
      xabarChikarish("Xatolik", error.message);
    } else {
      router.back();
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
              style={[
                styles.backBtn,
                Platform.OS === "web" && ({ cursor: "pointer" } as any),
              ]}
            >
              <Ionicons name="arrow-back" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.title}>Yangi Mashina</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mashina modeli *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="car-outline"
                  size={20}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masalan: Chevrolet Malibu"
                  value={model}
                  onChangeText={setModel}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Davlat raqami *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="pricetag-outline"
                  size={20}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="01 A 111 AA"
                  value={davlatRaqami}
                  onChangeText={setDavlatRaqami}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Soatlik narxi (UZS)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masalan: 50000"
                  value={soatlikNarx}
                  onChangeText={setSoatlikNarx}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kunlik narxi (UZS)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#64748B"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Masalan: 400000"
                  value={kunlikNarx}
                  onChangeText={setKunlikNarx}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                loading && styles.disabledBtn,
                Platform.OS === "web" && ({ cursor: "pointer" } as any),
              ]}
              onPress={mashinaQoshish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>Mashinani Saqlash</Text>
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
    backgroundColor: "#2563EB",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  disabledBtn: { backgroundColor: "#93C5FD" },
  submitBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
