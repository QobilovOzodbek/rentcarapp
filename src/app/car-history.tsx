import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";

export default function CarHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carId = params.car_id as string;

  useFocusEffect(
    useCallback(() => {
      const tarixniYuklash = async () => {
        if (!carId) return;
        setLoading(true);

        try {
          const { data, error } = await supabase
            .from("rentals")
            .select("*")
            .eq("car_id", carId)
            .order("boshlanish_vaqti", { ascending: false });

          if (error) throw error;

          if (data) setRentals(data);
        } catch (err: any) {
          Platform.OS === "web"
            ? window.alert(err.message)
            : Alert.alert("Xatolik", err.message);
        } finally {
          setLoading(false);
        }
      };

      tarixniYuklash();
    }, [carId]),
  );

  const vaqtniFormatlash = (dateString: string) => {
    if (!dateString) return "No'malum";
    return new Date(dateString).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) =>
    price
      ? Math.round(price)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS"
      : "0 UZS";

  // 📞 Telefon qilsa to'g'ridan-to'g'ri raqam terish oynasiga o'tkazish
  const qongiroqQilish = (raqam: string) => {
    if (!raqam) return;
    const url = `tel:${raqam}`;
    if (Platform.OS !== "web") {
      Linking.openURL(url).catch(() =>
        Alert.alert("Xato", "Qo'ng'iroqni amalga oshirib bo'lmadi"),
      );
    }
  };

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
        <View style={{ marginLeft: 16 }}>
          <Text style={styles.title}>{params.model}</Text>
          <Text style={styles.plate}>
            {params.davlat_raqami} - Ijara tarixi
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.historyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.clientBox}>
                  <Ionicons name="person-circle" size={40} color="#94A3B8" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.clientName}>{item.mijoz_ism}</Text>
                    {/* 📞 YANGI: Mijoz raqami va unga bosganda telefon qilish xususiyati */}
                    <TouchableOpacity
                      style={[
                        styles.phoneRow,
                        Platform.OS === "web" && ({ cursor: "pointer" } as any),
                      ]}
                      onPress={() => qongiroqQilish(item.telefon_raqam)}
                    >
                      <Ionicons name="call" size={12} color="#2563EB" />
                      <Text style={styles.clientPhone}>
                        {item.telefon_raqam || "Kiritilmagan"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.status === "yakunlangan"
                      ? styles.badgeDone
                      : styles.badgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "yakunlangan"
                        ? styles.textDone
                        : styles.textActive,
                    ]}
                  >
                    {item.status === "yakunlangan" ? "Yakunlangan" : "Faol"}
                  </Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>Boshlandi:</Text>
                  <Text style={styles.timeValue}>
                    {vaqtniFormatlash(item.boshlanish_vaqti)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color="#CBD5E1" />
                <View style={styles.timeBlock}>
                  <Text style={styles.timeLabel}>
                    {item.status === "yakunlangan" ? "Qaytdi:" : "Kutilmoqda:"}
                  </Text>
                  <Text style={styles.timeValue}>
                    {vaqtniFormatlash(
                      item.status === "yakunlangan"
                        ? item.tugash_vaqti
                        : item.kutilayotgan_vaqt,
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.moneyRow}>
                <View>
                  <Text style={styles.moneyLabel}>Jami Summa:</Text>
                  <Text style={styles.moneyValue}>
                    {formatPrice(item.umumiy_summa || item.asl_narx)}
                  </Text>
                </View>
                {item.jarima_summa > 0 && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.moneyLabel}>Shundan jarima:</Text>
                    <Text style={styles.penaltyValue}>
                      +{formatPrice(item.jarima_summa)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={50}
                color="#CBD5E1"
              />
              <Text style={styles.emptyText}>
                Bu mashina hali ijaraga berilmagan.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
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
  title: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  plate: { fontSize: 13, color: "#64748B", fontWeight: "600", marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 40 },
  historyCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  clientBox: { flexDirection: "row", alignItems: "center", flex: 1 },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },

  /* YANGI QO'SHILGAN TELEFON RAQAM DIZAYNI */
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  clientPhone: {
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "600",
    marginLeft: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 10,
  },
  badgeDone: { backgroundColor: "#DCFCE7" },
  badgeActive: { backgroundColor: "#DBEAFE" },
  statusText: { fontSize: 12, fontWeight: "700" },
  textDone: { color: "#16A34A" },
  textActive: { color: "#2563EB" },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
  },
  timeBlock: { flex: 1 },
  timeLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  timeValue: { fontSize: 13, color: "#0F172A", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  moneyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  moneyLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  moneyValue: { fontSize: 16, fontWeight: "800", color: "#15803D" },
  penaltyValue: { fontSize: 14, fontWeight: "700", color: "#DC2626" },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 10,
    fontWeight: "600",
  },
});
