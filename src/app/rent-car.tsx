import { Ionicons } from "@expo/vector-icons";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RentCarScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const aslSoatlik = Number(params.soatlik_narx || 0);
  const aslKunlik = Number(params.kunlik_narx || 0);

  const soatlikNarx = aslSoatlik > 0 ? aslSoatlik : aslKunlik / 24;
  const kunlikNarx = aslKunlik > 0 ? aslKunlik : aslSoatlik * 24;

  const [mijozIsm, setMijozIsm] = useState("");
  const [telefon, setTelefon] = useState("");
  const [ijaraTuri, setIjaraTuri] = useState<"aniq_vaqt" | "kunlik">(
    soatlikNarx > 0 ? "aniq_vaqt" : "kunlik",
  );

  const [muddat, setMuddat] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tanlanganVaqt, setTanlanganVaqt] = useState<Date | null>(null);
  const [umumiySumma, setUmumiySumma] = useState(0);
  const [qaytishVaqti, setQaytishVaqti] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const [pasportOld, setPasportOld] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pasportOrqa, setPasportOrqa] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const xabarChikarish = (sarlovha: string, matn: string) => {
    Platform.OS === "web"
      ? window.alert(`${sarlovha}: ${matn}`)
      : Alert.alert(sarlovha, matn);
  };

  // ⏱ KALKULYATOR MANTIQI
  useEffect(() => {
    let summa = 0;
    const sana = new Date();

    if (ijaraTuri === "kunlik") {
      setTanlanganVaqt(null);
      if (!muddat || isNaN(Number(muddat))) {
        setUmumiySumma(0);
        setQaytishVaqti(null);
        return;
      }
      const miqdor = parseFloat(muddat);
      summa = miqdor * kunlikNarx;
      sana.setDate(sana.getDate() + miqdor);
      setUmumiySumma(summa);
      setQaytishVaqti(sana);
    } else if (ijaraTuri === "aniq_vaqt") {
      setMuddat("");
      if (tanlanganVaqt) {
        const kutilganVaqt = new Date();
        kutilganVaqt.setHours(
          tanlanganVaqt.getHours(),
          tanlanganVaqt.getMinutes(),
          0,
          0,
        );

        if (kutilganVaqt.getTime() <= sana.getTime()) {
          kutilganVaqt.setDate(kutilganVaqt.getDate() + 1);
        }

        const farqSoat =
          (kutilganVaqt.getTime() - sana.getTime()) / (1000 * 60 * 60);
        setUmumiySumma(farqSoat * soatlikNarx);
        setQaytishVaqti(kutilganVaqt);
      } else {
        setUmumiySumma(0);
        setQaytishVaqti(null);
      }
    }
  }, [muddat, tanlanganVaqt, ijaraTuri]);

  const rasmTanlash = async (turi: "old" | "orqa") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      turi === "old"
        ? setPasportOld(result.assets[0])
        : setPasportOrqa(result.assets[0]);
    }
  };

  const ijaraniRasmiylashtirish = async () => {
    if (!mijozIsm.trim() || !telefon.trim()) {
      xabarChikarish(
        "Diqqat!",
        "Mijoz ismi va telefon raqamini kiritish majburiy.",
      );
      return;
    }
    if (ijaraTuri === "kunlik" && !muddat.trim()) {
      xabarChikarish("Diqqat!", "Ijara muddatini (kun) kiriting.");
      return;
    }
    if (ijaraTuri === "aniq_vaqt" && !tanlanganVaqt) {
      xabarChikarish("Diqqat!", "Iltimos, qaytarish soatini belgilang.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      let oldRasmUrl = null;
      let orqaRasmUrl = null;

      if (pasportOld?.base64) {
        const fileName = `old_${Date.now()}.jpg`;
        await supabase.storage
          .from("passports")
          .upload(fileName, decode(pasportOld.base64), {
            contentType: "image/jpeg",
          });
        oldRasmUrl = supabase.storage.from("passports").getPublicUrl(fileName)
          .data.publicUrl;
      }
      if (pasportOrqa?.base64) {
        const fileName = `orqa_${Date.now()}.jpg`;
        await supabase.storage
          .from("passports")
          .upload(fileName, decode(pasportOrqa.base64), {
            contentType: "image/jpeg",
          });
        orqaRasmUrl = supabase.storage.from("passports").getPublicUrl(fileName)
          .data.publicUrl;
      }

      const qaytishISO =
        qaytishVaqti?.toISOString() || new Date().toISOString();

      const { error: rentalError } = await supabase.from("rentals").insert({
        car_id: params.id,
        admin_id: authData.user?.id,
        mijoz_ism: mijozIsm.trim(),
        telefon_raqam: telefon.trim(),
        ijara_turi: ijaraTuri,
        kutilayotgan_vaqt: qaytishISO,
        tugash_vaqti: qaytishISO,
        asl_narx: Math.round(umumiySumma),
        status: "faol",
        pasport_old: oldRasmUrl,
        pasport_orqa: orqaRasmUrl,
      });

      if (rentalError) throw rentalError;

      const { error: carError } = await supabase
        .from("cars")
        .update({ holati: "band" })
        .eq("id", params.id);
      if (carError) throw carError;

      // 🔔 Bildirishnomani faollashtirish!
      if (qaytishVaqti && Platform.OS !== "web") {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⏰ Ijara vaqti tugadi!",
            body: `${params.model} (${params.davlat_raqami}) mashinasining vaqti tugadi. Mijoz: ${mijozIsm}`,
            sound: true,
          },
          trigger: {
            date: qaytishVaqti,
          } as Notifications.NotificationTriggerInput,
        });
      }
      router.back();
    } catch (err: any) {
      xabarChikarish("Xatolik", err.message);
    } finally {
      setLoading(false);
    }
  };

  const vaqtniFormatlash = (date: Date) =>
    date.toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatPrice = (price: number) =>
    Math.round(price)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{params.model}</Text>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{params.davlat_raqami}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mijoz ma'lumotlari</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ism va Familiya *"
              value={mijozIsm}
              onChangeText={setMijozIsm}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Telefon raqami *"
              value={telefon}
              onChangeText={setTelefon}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hujjat rasmlari (Ixtiyoriy)</Text>
          <View style={styles.docsContainer}>
            <TouchableOpacity
              style={styles.docUploadBtn}
              onPress={() => rasmTanlash("old")}
            >
              {pasportOld ? (
                <Image
                  source={{ uri: pasportOld.uri }}
                  style={styles.docImage}
                />
              ) : (
                <>
                  <Ionicons name="id-card-outline" size={28} color="#94A3B8" />
                  <Text style={styles.docText}>Pasport (Old)</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.docUploadBtn}
              onPress={() => rasmTanlash("orqa")}
            >
              {pasportOrqa ? (
                <Image
                  source={{ uri: pasportOrqa.uri }}
                  style={styles.docImage}
                />
              ) : (
                <>
                  <Ionicons
                    name="documents-outline"
                    size={28}
                    color="#94A3B8"
                  />
                  <Text style={styles.docText}>Pasport (Orqa)</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ijara shartlari</Text>

          <View style={styles.typeSelector}>
            {soatlikNarx > 0 && (
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  ijaraTuri === "aniq_vaqt" && styles.typeBtnActive,
                ]}
                onPress={() => setIjaraTuri("aniq_vaqt")}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    ijaraTuri === "aniq_vaqt" && styles.typeBtnTextActive,
                  ]}
                >
                  Soatgacha
                </Text>
              </TouchableOpacity>
            )}
            {kunlikNarx > 0 && (
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  ijaraTuri === "kunlik" && styles.typeBtnActive,
                ]}
                onPress={() => setIjaraTuri("kunlik")}
              >
                <Text
                  style={[
                    styles.typeBtnText,
                    ijaraTuri === "kunlik" && styles.typeBtnTextActive,
                  ]}
                >
                  Kunbay
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {ijaraTuri === "aniq_vaqt" ? (
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.input,
                  {
                    lineHeight: Platform.OS === "ios" ? 0 : 50,
                    color: tanlanganVaqt ? "#0F172A" : "#94A3B8",
                  },
                ]}
              >
                {tanlanganVaqt
                  ? tanlanganVaqt.toLocaleTimeString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Qachongacha? (Soatni tanlang) *"}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Necha kunga berilyapti? (masalan 2) *"
                value={muddat}
                onChangeText={setMuddat}
                keyboardType="numeric"
              />
            </View>
          )}

          {/* 🔥 SARIQ XATOLIK TUZATILGAN JOYI: onChange o'rniga onValueChange va onDismiss ishlatildi */}
          {showTimePicker && (
            <DateTimePicker
              value={tanlanganVaqt || new Date()}
              mode="time"
              is24Hour={true}
              display="default"
              onValueChange={(event, selectedDate) => {
                if (Platform.OS === "android") {
                  setShowTimePicker(false);
                }
                if (selectedDate) setTanlanganVaqt(selectedDate);
              }}
              onDismiss={() => setShowTimePicker(false)}
            />
          )}
        </View>

        <View style={styles.calcCard}>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Qaytarish vaqti:</Text>
            <Text style={styles.calcValue}>
              {qaytishVaqti ? vaqtniFormatlash(qaytishVaqti) : "Belgilanmagan"}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.calcRow}>
            <Text style={styles.calcTotalLabel}>Umumiy Summa:</Text>
            <Text style={styles.calcTotalValue}>
              {formatPrice(umumiySumma)}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={ijaraniRasmiylashtirish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="key-outline"
                  size={22}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryBtnText}>Ijaraga Berish</Text>
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
  headerCard: {
    backgroundColor: "#1E293B",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },
  plateBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CBD5E1",
  },
  plateText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
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
    marginBottom: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    height: "100%",
    outlineStyle: "none" as any,
  },
  docsContainer: { flexDirection: "row", gap: 12 },
  docUploadBtn: {
    flex: 1,
    height: 100,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  docImage: { width: "100%", height: "100%", resizeMode: "cover" },
  docText: { fontSize: 12, color: "#64748B", fontWeight: "600", marginTop: 6 },
  typeSelector: { flexDirection: "row", gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  typeBtnActive: { backgroundColor: "#EFF6FF", borderColor: "#3B82F6" },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  typeBtnTextActive: { color: "#3B82F6" },
  calcCard: {
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 30,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calcLabel: { fontSize: 14, color: "#166534", fontWeight: "500" },
  calcValue: { fontSize: 15, color: "#14532D", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#BBF7D0", marginVertical: 12 },
  calcTotalLabel: { fontSize: 18, color: "#166534", fontWeight: "800" },
  calcTotalValue: { fontSize: 24, color: "#15803D", fontWeight: "900" },
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
