import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function ExtendRentalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rentalId = params.rental_id as string;
  const joriyVaqt = new Date(params.joriy_vaqt as string);
  const joriySumma = Number(params.asl_narx);

  const aslSoatlik = Number(params.soatlik) || 0;
  const aslKunlik = Number(params.kunlik) || 0;

  const soatlik = aslSoatlik > 0 ? aslSoatlik : aslKunlik / 24;
  const kunlik = aslKunlik > 0 ? aslKunlik : aslSoatlik * 24;

  const [qoshimcha, setQoshimcha] = useState("");
  const [turi, setTuri] = useState<"soat" | "kun">("soat");
  const [loading, setLoading] = useState(false);

  const qoshimchaMiqdor = Number(qoshimcha) || 0;
  const yangiVaqt = new Date(joriyVaqt);
  let qoshimchaSumma = 0;

  if (turi === "soat") {
    yangiVaqt.setHours(yangiVaqt.getHours() + qoshimchaMiqdor);
    qoshimchaSumma = Math.round(qoshimchaMiqdor * soatlik);
  } else {
    yangiVaqt.setDate(yangiVaqt.getDate() + qoshimchaMiqdor);
    qoshimchaSumma = Math.round(qoshimchaMiqdor * kunlik);
  }

  const saqlash = async () => {
    if (qoshimchaMiqdor <= 0) {
      Platform.OS === "web"
        ? window.alert("Miqdorni kiriting")
        : Alert.alert("Diqqat", "Miqdorni kiriting");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("rentals")
      .update({
        kutilayotgan_vaqt: yangiVaqt.toISOString(),
        asl_narx: joriySumma + qoshimchaSumma,
      })
      .eq("id", rentalId);

    setLoading(false);

    if (error) {
      Platform.OS === "web"
        ? window.alert(error.message)
        : Alert.alert("Xatolik", error.message);
    } else {
      router.back();
    }
  };

  const vaqtniFormatlash = (date: Date) =>
    date.toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
            <Text style={styles.title}>Vaqtni Uzaytirish</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Mijoz: {params.mijoz}</Text>
              <Text style={styles.infoDesc}>
                Joriy tugash vaqti:{" "}
                <Text style={{ fontWeight: "700" }}>
                  {vaqtniFormatlash(joriyVaqt)}
                </Text>
              </Text>
            </View>

            <Text style={styles.label}>Nimaga qarab uzaytiramiz?</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  turi === "soat" && styles.typeBtnActive,
                  Platform.OS === "web" && ({ cursor: "pointer" } as any),
                ]}
                onPress={() => setTuri("soat")}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    turi === "soat" && styles.typeBtnTextActive,
                  ]}
                >
                  Soat qo'shish
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  turi === "kun" && styles.typeBtnActive,
                  Platform.OS === "web" && ({ cursor: "pointer" } as any),
                ]}
                onPress={() => setTuri("kun")}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    turi === "kun" && styles.typeBtnTextActive,
                  ]}
                >
                  Kun qo'shish
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name={turi === "soat" ? "time" : "calendar"}
                size={20}
                color="#64748B"
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.input}
                placeholder={`Necha ${turi}ga uzaytiramiz?`}
                keyboardType="numeric"
                value={qoshimcha}
                onChangeText={setQoshimcha}
                autoFocus={true}
              />
            </View>

            {qoshimchaMiqdor > 0 && (
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Yangi tugash vaqti:</Text>
                  <Text style={styles.previewValue}>
                    {vaqtniFormatlash(yangiVaqt)}
                  </Text>
                </View>
                <View style={styles.previewDivider} />
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Qo'shimcha to'lov:</Text>
                  <Text style={[styles.previewValue, { color: "#15803D" }]}>
                    +{formatPrice(qoshimchaSumma)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Umumiy narx:</Text>
                  <Text
                    style={[
                      styles.previewValue,
                      { fontSize: 18, color: "#1E3A8A" },
                    ]}
                  >
                    {formatPrice(joriySumma + qoshimchaSumma)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveBtn,
                loading && { opacity: 0.7 },
                Platform.OS === "web" && ({ cursor: "pointer" } as any),
              ]}
              onPress={saqlash}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>Uzaytirishni Saqlash</Text>
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
  scrollContent: { flexGrow: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "800", marginLeft: 15, color: "#0F172A" },
  content: { padding: 20 },
  infoCard: {
    backgroundColor: "#DBEAFE",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 4,
  },
  infoDesc: { fontSize: 13, color: "#1E3A8A" },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  typeSelector: { flexDirection: "row", gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  typeBtnActive: { backgroundColor: "#EFF6FF", borderColor: "#2563EB" },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  typeBtnTextActive: { color: "#2563EB" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
  },
  input: { flex: 1, fontSize: 16, outlineStyle: "none" as any }, // Qora chiziq olib tashlandi
  previewCard: {
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 24,
    gap: 10,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewLabel: { fontSize: 14, color: "#166534", fontWeight: "500" },
  previewValue: { fontSize: 15, fontWeight: "800", color: "#14532D" },
  previewDivider: { height: 1, backgroundColor: "#BBF7D0", marginVertical: 4 },
  saveBtn: {
    backgroundColor: "#2563EB",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
