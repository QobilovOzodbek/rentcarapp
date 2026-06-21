import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
import { Ionicons } from "@expo/vector-icons";

export default function FinishRentalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rentalId = params.rental_id as string;
  const carId = params.car_id as string;

  const [rental, setRental] = useState<any>(null);
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const [jarima, setJarima] = useState(0);
  const [kechikkanSoat, setKechikkanSoat] = useState(0);

  const xabarChikarish = (sarlovha: string, matn: string) => {
    Platform.OS === "web"
      ? window.alert(`${sarlovha}: ${matn}`)
      : Alert.alert(sarlovha, matn);
  };

  useEffect(() => {
    const maLumotYuklash = async () => {
      // 1. Ijara va mashina ma'lumotlarini olish
      const { data: rentalData } = await supabase
        .from("rentals")
        .select("*")
        .eq("id", rentalId)
        .single();
      const { data: carData } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .single();

      if (rentalData && carData) {
        setRental(rentalData);
        setCar(carData);
        hisobKitob(
          rentalData.kutilayotgan_vaqt,
          carData.soatlik_narx,
          carData.kunlik_narx,
        );
      }
      setLoading(false);
    };

    maLumotYuklash();
  }, []);

  const hisobKitob = (kutilgan: string, soatlik: number, kunlik: number) => {
    const hozir = new Date();
    const kutilganVaqt = new Date(kutilgan);

    // Farqni millisoniyada topish
    const farqMs = hozir.getTime() - kutilganVaqt.getTime();

    if (farqMs > 0) {
      // Agar vaqtdan o'tib ketgan bo'lsa (Kechikkan)
      const soatlar = Math.ceil(farqMs / (1000 * 60 * 60)); // Yaxlitlangan soat
      setKechikkanSoat(soatlar);

      // Agar soatlik narx kiritilmagan bo'lsa, kunlik narxni 24 ga bo'lib hisoblaymiz
      const jarimaStavka = soatlik > 0 ? soatlik : kunlik / 24;
      setJarima(soatlar * jarimaStavka);
    } else {
      setKechikkanSoat(0);
      setJarima(0);
    }
  };

  const ijaraniTugatish = async () => {
    setFinishing(true);
    const hozirgiVaqt = new Date().toISOString();
    const yakuniySumma = rental.asl_narx + jarima;

    try {
      // 1. Ijarani yakunlash (rentals jadvalini yangilash)
      const { error: rentErr } = await supabase
        .from("rentals")
        .update({
          status: "yakunlangan",
          qaytarilgan_vaqt: hozirgiVaqt,
          jarima_narxi: jarima,
          umumiy_summa: yakuniySumma,
        })
        .eq("id", rentalId);

      if (rentErr) throw rentErr;

      // 2. Mashinani bo'shatish (cars jadvalini yangilash)
      const { error: carErr } = await supabase
        .from("cars")
        .update({ holati: "bo'sh" })
        .eq("id", carId);

      if (carErr) throw carErr;

      // Hammasi joyida
      router.back();
    } catch (err: any) {
      xabarChikarish("Xatolik", err.message);
    } finally {
      setFinishing(false);
    }
  };

  const vaqtniFormatlash = (sana: string) => {
    if (!sana) return "";
    return new Date(sana).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return (
      Math.round(price)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS"
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#EF4444" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="stop-circle-outline" size={40} color="#EF4444" />
        </View>
        <Text style={styles.title}>Ijarani Yakunlash</Text>
        <Text style={styles.subtitle}>
          Mashinani qabul qilib olish va to'lovni yakunlash
        </Text>
      </View>

      {/* Mijoz va Avto ma'lumotlari */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Ijara ma'lumotlari</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Mijoz:</Text>
          <Text style={styles.infoValue}>{rental?.mijoz_ism}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Avtomobil:</Text>
          <Text style={styles.infoValue}>
            {car?.model} ({car?.davlat_raqami})
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Belgilangan vaqt:</Text>
          <Text style={[styles.infoValue, { color: "#059669" }]}>
            {vaqtniFormatlash(rental?.kutilayotgan_vaqt)}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hozirgi vaqt:</Text>
          <Text
            style={[
              styles.infoValue,
              { color: kechikkanSoat > 0 ? "#DC2626" : "#2563EB" },
            ]}
          >
            {vaqtniFormatlash(new Date().toISOString())}
          </Text>
        </View>
      </View>

      {/* Hisob-kitob (Kalkulyator) */}
      <View style={styles.calcCard}>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Ijara narxi (Asl):</Text>
          <Text style={styles.calcValue}>{formatPrice(rental?.asl_narx)}</Text>
        </View>

        {kechikkanSoat > 0 && (
          <View style={styles.calcRowPenalty}>
            <Text style={styles.calcPenaltyLabel}>
              <Ionicons name="warning-outline" size={16} /> Kechikish (
              {kechikkanSoat} soat):
            </Text>
            <Text style={styles.calcPenaltyValue}>+ {formatPrice(jarima)}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.calcRow}>
          <Text style={styles.calcTotalLabel}>Yakuniy To'lov:</Text>
          <Text style={styles.calcTotalValue}>
            {formatPrice(rental?.asl_narx + jarima)}
          </Text>
        </View>
      </View>

      {/* Tugmalar */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.primaryBtn, finishing && styles.disabledBtn]}
          onPress={ijaraniTugatish}
          disabled={finishing}
        >
          {finishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-done-circle-outline"
                size={22}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryBtnText}>To'lovni tasdiqlash</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.back()}
          disabled={finishing}
        >
          <Text style={styles.secondaryBtnText}>Ortga qaytish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: { alignItems: "center", marginTop: 20, marginBottom: 25 },
  iconContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "800", color: "#0F172A", marginBottom: 5 },
  subtitle: { fontSize: 14, color: "#64748B", textAlign: "center" },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: { fontSize: 14, color: "#64748B", fontWeight: "500" },
  infoValue: { fontSize: 14, color: "#0F172A", fontWeight: "700" },

  calcCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 30,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  calcLabel: { fontSize: 15, color: "#334155", fontWeight: "600" },
  calcValue: { fontSize: 16, color: "#0F172A", fontWeight: "700" },

  calcRowPenalty: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  calcPenaltyLabel: { fontSize: 14, color: "#B91C1C", fontWeight: "600" },
  calcPenaltyValue: { fontSize: 15, color: "#DC2626", fontWeight: "700" },

  divider: { height: 1, backgroundColor: "#CBD5E1", marginVertical: 12 },
  calcTotalLabel: { fontSize: 18, color: "#0F172A", fontWeight: "800" },
  calcTotalValue: { fontSize: 24, color: "#2563EB", fontWeight: "900" },

  actionButtons: { gap: 12 },
  primaryBtn: {
    backgroundColor: "#EF4444",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledBtn: { backgroundColor: "#FCA5A5" },
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
