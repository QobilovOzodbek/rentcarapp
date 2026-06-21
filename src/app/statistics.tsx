import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";

export default function StatisticsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jamiFoyda, setJamiFoyda] = useState(0);
  const [oylikFoyda, setOylikFoyda] = useState(0);
  const [ijaralarSoni, setIjaralarSoni] = useState(0);
  const [topMashinalar, setTopMashinalar] = useState<any[]>([]);

  const xabarChikarish = (sarlovha: string, matn: string) => {
    Platform.OS === "web"
      ? window.alert(`${sarlovha}: ${matn}`)
      : Alert.alert(sarlovha, matn);
  };

  const statistikaYuklash = async () => {
    setLoading(true);
    try {
      // Barcha yakunlangan ijaralarni va ularga tegishli mashinalarni tortib olamiz
      const { data: rentals, error } = await supabase
        .from("rentals")
        .select(
          "umumiy_summa, tugash_vaqti, car_id, cars(model, davlat_raqami)",
        )
        .eq("status", "yakunlangan");

      if (error) throw error;

      let umumiySumma = 0;
      let joriyOylikSumma = 0;
      const hozirgiOy = new Date().getMonth();
      const hozirgiYil = new Date().getFullYear();

      const mashinaStat: Record<
        string,
        { model: string; davlat_raqami: string; daromad: number; marta: number }
      > = {};

      rentals?.forEach((rental) => {
        const summa = rental.umumiy_summa || 0;
        umumiySumma += summa;

        // Oylik foydani hisoblash
        if (rental.tugash_vaqti) {
          const ijaraSana = new Date(rental.tugash_vaqti);
          if (
            ijaraSana.getMonth() === hozirgiOy &&
            ijaraSana.getFullYear() === hozirgiYil
          ) {
            joriyOylikSumma += summa;
          }
        }

        // Qaysi mashina qancha ishlaganini hisoblash
        if (rental.car_id && rental.cars) {
          const car = Array.isArray(rental.cars)
            ? rental.cars[0]
            : rental.cars;
          if (car) {
            if (!mashinaStat[rental.car_id]) {
              mashinaStat[rental.car_id] = {
                model: car.model,
                davlat_raqami: car.davlat_raqami,
                daromad: 0,
                marta: 0,
              };
            }
            mashinaStat[rental.car_id].daromad += summa;
            mashinaStat[rental.car_id].marta += 1;
          }
        }
      });

      // Eng ko'p pul topgan mashinalarni reyting qilib taxlash (Top 5 ta)
      const topCarsArray = Object.values(mashinaStat)
        .sort((a, b) => b.daromad - a.daromad)
        .slice(0, 5);

      setJamiFoyda(umumiySumma);
      setOylikFoyda(joriyOylikSumma);
      setIjaralarSoni(rentals?.length || 0);
      setTopMashinalar(topCarsArray);
    } catch (err: any) {
      xabarChikarish("Xatolik", err.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      statistikaYuklash();
    }, []),
  );

  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
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
        <Text style={styles.title}>Moliyaviy Hisobot</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Umumiy Ko'rsatkichlar</Text>

          <View style={styles.mainCard}>
            <View style={styles.iconBox}>
              <Ionicons name="wallet" size={28} color="#15803D" />
            </View>
            <Text style={styles.cardLabel}>Jami Sof Foyda</Text>
            <Text style={styles.mainCardValue}>{formatPrice(jamiFoyda)}</Text>
          </View>

          <View style={styles.rowCards}>
            <View
              style={[
                styles.halfCard,
                { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color="#2563EB"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.halfCardLabel}>Shu oydagi daromad</Text>
              <Text style={[styles.halfCardValue, { color: "#1E3A8A" }]}>
                {formatPrice(oylikFoyda)}
              </Text>
            </View>

            <View
              style={[
                styles.halfCard,
                { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" },
              ]}
            >
              <Ionicons
                name="analytics-outline"
                size={22}
                color="#7C3AED"
                style={{ marginBottom: 8 }}
              />
              <Text style={styles.halfCardLabel}>Barcha ijaralar</Text>
              <Text style={[styles.halfCardValue, { color: "#5B21B6" }]}>
                {ijaralarSoni} ta
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Top Mashinalar (Daromad bo'yicha)
          </Text>

          {topMashinalar.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                Hali yakunlangan ijaralar yo'q
              </Text>
            </View>
          ) : (
            topMashinalar.map((mashina, index) => (
              <View key={index} style={styles.carRow}>
                <View style={styles.carRankBadge}>
                  <Text style={styles.carRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.carInfo}>
                  <Text style={styles.carModel}>{mashina.model}</Text>
                  <Text style={styles.carPlate}>
                    {mashina.davlat_raqami} • {mashina.marta} marta ijarada
                  </Text>
                </View>
                <Text style={styles.carRevenue}>
                  {formatPrice(mashina.daromad)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginLeft: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    marginTop: 10,
  },
  mainCard: {
    backgroundColor: "#F0FDF4",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#166534",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "600",
    marginBottom: 8,
  },
  mainCardValue: { fontSize: 28, fontWeight: "900", color: "#14532D" },
  rowCards: { flexDirection: "row", gap: 16, marginBottom: 30 },
  halfCard: { flex: 1, padding: 20, borderRadius: 20, borderWidth: 1 },
  halfCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 8,
  },
  halfCardValue: { fontSize: 16, fontWeight: "800" },
  carRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  carRankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  carRankText: { fontSize: 14, fontWeight: "800", color: "#475569" },
  carInfo: { flex: 1 },
  carModel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  carPlate: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  carRevenue: { fontSize: 15, fontWeight: "800", color: "#15803D" },
  emptyState: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 10,
    fontWeight: "600",
  },
});
