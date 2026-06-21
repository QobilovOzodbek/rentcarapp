import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function FinishRentalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rentalId = params.rental_id as string;
  const carId = params.car_id as string;

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [rentalData, setRentalData] = useState<any>(null);
  const [jarima, setJarima] = useState(0);

  const xabarChikarish = (sarlovha: string, matn: string) => {
    Platform.OS === "web"
      ? window.alert(`${sarlovha}: ${matn}`)
      : Alert.alert(sarlovha, matn);
  };

  useEffect(() => {
    const ijaraniYuklash = async () => {
      try {
        const { data, error } = await supabase
          .from("rentals")
          .select("*, cars(soatlik_narx, kunlik_narx, model, davlat_raqami)")
          .eq("id", rentalId)
          .single();
        if (error) throw error;

        setRentalData(data);

        // Jarimani hisoblash (Agar vaqtidan o'tib ketgan bo'lsa)
        const hozir = new Date();
        const kutilganVaqt = new Date(data.kutilayotgan_vaqt);

        if (hozir > kutilganVaqt) {
          const kechikkanSoat = Math.ceil(
            (hozir.getTime() - kutilganVaqt.getTime()) / (1000 * 60 * 60),
          );
          const soatlik =
            data.cars?.soatlik_narx > 0
              ? data.cars.soatlik_narx
              : data.cars?.kunlik_narx / 24;
          setJarima(Math.round(kechikkanSoat * soatlik));
        }
      } catch (err: any) {
        xabarChikarish("Xatolik", err.message);
      } finally {
        setLoading(false);
      }
    };
    ijaraniYuklash();
  }, [rentalId]);

  const ijaraniYakunlash = async () => {
    setSubmitLoading(true);
    try {
      // 1. Ijarani yopamiz
      const { error: rentalError } = await supabase
        .from("rentals")
        .update({
          status: "yakunlangan",
          tugash_vaqti: new Date().toISOString(),
          jarima_summa: jarima,
          umumiy_summa: rentalData.asl_narx + jarima,
        })
        .eq("id", rentalId);

      if (rentalError) throw rentalError;

      // 2. Mashinani bo'shatamiz
      const { error: carError } = await supabase
        .from("cars")
        .update({ holati: "bo'sh" })
        .eq("id", carId);
      if (carError) throw carError;

      router.back();
    } catch (err: any) {
      xabarChikarish("Xatolik", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const vaqtniFormatlash = (dateString: string) =>
    new Date(dateString).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
          <Text style={styles.title}>Ijarani Yakunlash</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.carName}>{rentalData?.cars?.model}</Text>
          <Text style={styles.plateNumber}>
            {rentalData?.cars?.davlat_raqami}
          </Text>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Mijoz:</Text>
            <Text style={styles.value}>{rentalData?.mijoz_ism}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kutilgan qaytish:</Text>
            <Text style={styles.value}>
              {vaqtniFormatlash(rentalData?.kutilayotgan_vaqt)}
            </Text>
          </View>
        </View>

        <View style={styles.receiptCard}>
          <Text style={styles.receiptTitle}>To'lov hisoboti</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Asosiy to'lov:</Text>
            <Text style={styles.value}>
              {formatPrice(rentalData?.asl_narx)}
            </Text>
          </View>

          {jarima > 0 && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: "#DC2626" }]}>
                Kechikkanlik jarimasi:
              </Text>
              <Text style={[styles.value, { color: "#DC2626" }]}>
                +{formatPrice(jarima)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: "#CBD5E1" }]} />

          <View style={styles.row}>
            <Text style={styles.totalLabel}>Jami Summa:</Text>
            <Text style={styles.totalValue}>
              {formatPrice(rentalData?.asl_narx + jarima)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.finishBtn,
            submitLoading && styles.disabledBtn,
            Platform.OS === "web" && ({ cursor: "pointer" } as any),
          ]}
          onPress={ijaraniYakunlash}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.finishBtnText}>Mashinani Qabul Qilish</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: { justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginLeft: 16 },
  infoCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  carName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
  },
  plateNumber: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  value: { fontSize: 15, color: "#0F172A", fontWeight: "700" },
  receiptCard: {
    backgroundColor: "#F0FDF4",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 30,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#166534",
    marginBottom: 16,
  },
  totalLabel: { fontSize: 18, color: "#166534", fontWeight: "800" },
  totalValue: { fontSize: 22, color: "#15803D", fontWeight: "900" },
  finishBtn: {
    backgroundColor: "#10B981",
    height: 56,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: { backgroundColor: "#6EE7B7" },
  finishBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 17 },
});
