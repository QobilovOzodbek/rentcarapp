import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";

export default function StatisticsScreen() {
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchHistory = async () => {
      // Faqat yakunlangan ijaralarni va ularga tegishli mashinalarni tortib olamiz
      const { data, error } = await supabase
        .from("rentals")
        .select("*, cars(model, davlat_raqami)")
        .eq("status", "yakunlangan")
        .order("qaytarilgan_vaqt", { ascending: false });

      if (data) setRentals(data);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const totalDaromad = rentals.reduce(
    (sum, item) => sum + (item.umumiy_summa || 0),
    0,
  );
  const totalJarimalar = rentals.reduce(
    (sum, item) => sum + (item.jarima_narxi || 0),
    0,
  );

  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.carModel}>
          {item.cars?.model} ({item.cars?.davlat_raqami})
        </Text>
        <Text style={styles.totalPrice}>{formatPrice(item.umumiy_summa)}</Text>
      </View>
      <View style={styles.historyBody}>
        <Text style={styles.clientName}>
          <Ionicons name="person" size={14} /> {item.mijoz_ism}
        </Text>
        <Text style={styles.dateText}>
          Qaytarildi: {formatDate(item.qaytarilgan_vaqt)}
        </Text>
        {item.jarima_narxi > 0 && (
          <Text style={styles.penaltyText}>
            Kechikish jarimasi: {formatPrice(item.jarima_narxi)}
          </Text>
        )}
      </View>
    </View>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moliyaviy Hisobot</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* DASHBOARD CARDS */}
      <View style={styles.dashboard}>
        <View style={styles.mainCard}>
          <Text style={styles.cardLabel}>Umumiy Tushum (Sof)</Text>
          <Text style={styles.mainValue}>
            {formatPrice(totalDaromad - totalJarimalar)}
          </Text>
        </View>
        <View style={styles.rowCards}>
          <View
            style={[
              styles.smallCard,
              { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
            ]}
          >
            <Text style={styles.smallCardLabel}>Tugallangan Ijaralar</Text>
            <Text style={[styles.smallCardValue, { color: "#16A34A" }]}>
              {rentals.length} ta
            </Text>
          </View>
          <View
            style={[
              styles.smallCard,
              { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
            ]}
          >
            <Text style={styles.smallCardLabel}>Undirilgan Jarimalar</Text>
            <Text style={[styles.smallCardValue, { color: "#DC2626" }]}>
              {formatPrice(totalJarimalar)}
            </Text>
          </View>
        </View>
      </View>

      {/* HISTORY LIST */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Ijara Tarixi</Text>
        <FlatList
          data={rentals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>
                Hozircha yakunlangan ijaralar yo'q
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  dashboard: { padding: 20 },
  mainCard: {
    backgroundColor: "#2563EB",
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardLabel: {
    color: "#BFDBFE",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  mainValue: { color: "#FFFFFF", fontSize: 28, fontWeight: "900" },
  rowCards: { flexDirection: "row", gap: 12 },
  smallCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1 },
  smallCardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 4,
  },
  smallCardValue: { fontSize: 18, fontWeight: "800" },
  listContainer: { flex: 1, paddingHorizontal: 20 },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingBottom: 8,
    marginBottom: 8,
  },
  carModel: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  totalPrice: { fontSize: 16, fontWeight: "800", color: "#059669" },
  historyBody: { gap: 4 },
  clientName: { fontSize: 14, color: "#334155", fontWeight: "600" },
  dateText: { fontSize: 13, color: "#64748B" },
  penaltyText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "600",
    marginTop: 4,
  },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 12,
    fontWeight: "600",
  },
});
