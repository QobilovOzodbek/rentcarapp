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
  RefreshControl,
  TextInput,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useRouter, useFocusEffect } from "expo-router";

export default function HomeScreen() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "barchasi" | "bosh" | "band" | "tamirda"
  >("barchasi");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const mashinalarniYuklash = async () => {
    setLoading(true);
    try {
      // MIJOZ RAQAMI VA ASL NARX HAM CHAQRILMOQDA
      const { data, error } = await supabase
        .from("cars")
        .select(
          "*, rentals(id, status, mijoz_ism, telefon_raqam, kutilayotgan_vaqt, asl_narx)",
        );
      if (error) throw error;
      if (data) setCars([...data].reverse());
    } catch (err: any) {
      Platform.OS === "web"
        ? window.alert(`Baza xatosi: ${err.message}`)
        : Alert.alert("Xatolik", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      mashinalarniYuklash();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    mashinalarniYuklash();
  };

  const holatniOzgartirish = async (id: string, joriyHolat: string) => {
    const yangiHolat = joriyHolat === "tamirda" ? "bo'sh" : "tamirda";
    setLoading(true);
    const { error } = await supabase
      .from("cars")
      .update({ holati: yangiHolat })
      .eq("id", id);
    if (!error) mashinalarniYuklash();
    else {
      Platform.OS === "web"
        ? window.alert(error.message)
        : Alert.alert("Xatolik", error.message);
      setLoading(false);
    }
  };

  const mashinaniOchirish = (
    id: string,
    model: string,
    davlat_raqami: string,
  ) => {
    const xabar = `${model} (${davlat_raqami}) avtoparkdan butunlay o'chirib tashlanadi. Tasdiqlaysizmi?`;
    if (Platform.OS === "web") {
      if (window.confirm(xabar)) ochirishniBajarish(id);
    } else {
      Alert.alert("Diqqat!", xabar, [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "O'chirish",
          style: "destructive",
          onPress: () => ochirishniBajarish(id),
        },
      ]);
    }
  };

  const ochirishniBajarish = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (!error) mashinalarniYuklash();
    else {
      Alert.alert("Xatolik", error.message);
      setLoading(false);
    }
  };

  const qongiroqQilish = (raqam: string) => {
    Linking.openURL(`tel:${raqam}`);
  };

  const vaqtniFormatlash = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number, type: "soat" | "kun") =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + ` UZS/${type}`;

  const jamiSon = cars.length;
  const bandSon = cars.filter((c) =>
    c.rentals?.some((r: any) => r.status === "faol"),
  ).length;
  const tamirSon = cars.filter(
    (c) =>
      c.holati === "tamirda" &&
      !c.rentals?.some((r: any) => r.status === "faol"),
  ).length;
  const boshSon = jamiSon - bandSon - tamirSon;

  const qidiruv = searchQuery.toLowerCase();
  const korsatiladiganMashinalar = cars.filter((car) => {
    const isBusy = car.rentals?.some((r: any) => r.status === "faol");
    const isTamirda = car.holati === "tamirda" && !isBusy;
    const matchesSearch =
      car.model.toLowerCase().includes(qidiruv) ||
      car.davlat_raqami.toLowerCase().includes(qidiruv);
    if (!matchesSearch) return false;
    if (filter === "bosh") return !isBusy && !isTamirda;
    if (filter === "band") return isBusy;
    if (filter === "tamirda") return isTamirda;
    return true;
  });

  const mashinaniKorsatish = ({ item }: { item: any }) => {
    const faolIjara = item.rentals?.find((r: any) => r.status === "faol");
    const isBusy = !!faolIjara;
    const isTamirda = item.holati === "tamirda" && !isBusy;

    let isOverdue = false;
    if (isBusy && faolIjara.kutilayotgan_vaqt) {
      isOverdue = new Date() > new Date(faolIjara.kutilayotgan_vaqt);
    }

    return (
      <View
        style={[
          styles.card,
          isBusy && (isOverdue ? styles.cardOverdue : styles.cardBusy),
          isTamirda && styles.cardTamir,
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.carTitleRow}>
            <View
              style={[
                styles.iconBox,
                isBusy
                  ? isOverdue
                    ? { backgroundColor: "#FEE2E2" }
                    : { backgroundColor: "#DBEAFE" }
                  : isTamirda
                    ? { backgroundColor: "#FFEDD5" }
                    : { backgroundColor: "#DCFCE7" },
              ]}
            >
              <Ionicons
                name={isTamirda ? "build" : "car"}
                size={20}
                color={
                  isBusy
                    ? isOverdue
                      ? "#DC2626"
                      : "#2563EB"
                    : isTamirda
                      ? "#C2410C"
                      : "#16A34A"
                }
              />
            </View>
            <View>
              <Text style={styles.carModel}>{item.model}</Text>
              <Text style={styles.plateText}>{item.davlat_raqami}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              isBusy
                ? isOverdue
                  ? styles.badgeOverdue
                  : styles.badgeBusy
                : isTamirda
                  ? styles.badgeTamir
                  : styles.badgeFree,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isBusy
                  ? isOverdue
                    ? styles.statusTextOverdue
                    : styles.statusTextBusy
                  : isTamirda
                    ? styles.statusTextTamir
                    : styles.statusTextFree,
              ]}
            >
              {isBusy
                ? isOverdue
                  ? "Vaqti o'tdi!"
                  : "Band"
                : isTamirda
                  ? "Tamirda"
                  : "Bo'sh"}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          {!isBusy ? (
            <View style={styles.pricesRow}>
              {item.soatlik_narx > 0 && (
                <View style={styles.priceItem}>
                  <Ionicons name="time-outline" size={16} color="#64748B" />
                  <Text style={styles.priceText}>
                    {formatPrice(item.soatlik_narx, "soat")}
                  </Text>
                </View>
              )}
              {item.kunlik_narx > 0 && (
                <View style={styles.priceItem}>
                  <Ionicons name="calendar-outline" size={16} color="#64748B" />
                  <Text style={styles.priceText}>
                    {formatPrice(item.kunlik_narx, "kun")}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.renterContainer}>
              <View style={styles.renterHeader}>
                <View style={styles.renterNameBox}>
                  <Ionicons name="person-circle" size={20} color="#64748B" />
                  <Text style={styles.renterText}>{faolIjara.mijoz_ism}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => qongiroqQilish(faolIjara.telefon_raqam)}
                >
                  <Ionicons name="call" size={16} color="#059669" />
                  <Text style={styles.callBtnText}>
                    {faolIjara.telefon_raqam}
                  </Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.timeBox,
                  isOverdue ? styles.timeBoxOverdue : styles.timeBoxNormal,
                ]}
              >
                <Ionicons
                  name="time"
                  size={18}
                  color={isOverdue ? "#DC2626" : "#2563EB"}
                />
                <Text
                  style={[
                    styles.timeText,
                    isOverdue ? { color: "#DC2626" } : { color: "#1E3A8A" },
                  ]}
                >
                  Tugaydi: {vaqtniFormatlash(faolIjara.kutilayotgan_vaqt)}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          {!isBusy ? (
            <View style={styles.actionIcons}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  router.push({
                    pathname: "/edit-car",
                    params: {
                      id: item.id,
                      model: item.model,
                      davlat_raqami: item.davlat_raqami,
                      soatlik_narx: item.soatlik_narx,
                      kunlik_narx: item.kunlik_narx,
                    },
                  })
                }
              >
                <Ionicons name="pencil" size={18} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() =>
                  mashinaniOchirish(item.id, item.model, item.davlat_raqami)
                }
              >
                <Ionicons name="trash" size={18} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => holatniOzgartirish(item.id, item.holati)}
              >
                <Ionicons name="build-outline" size={18} color="#C2410C" />
              </TouchableOpacity>
            </View>
          ) : (
            <View />
          )}

          {isBusy ? (
            <View style={{ flexDirection: "row", gap: 10, flex: 1 }}>
              <TouchableOpacity
                style={styles.extendBtn}
                onPress={() =>
                  router.push({
                    pathname: "/extend-rental",
                    params: {
                      rental_id: faolIjara.id,
                      car_id: item.id,
                      joriy_vaqt: faolIjara.kutilayotgan_vaqt,
                      asl_narx: faolIjara.asl_narx,
                      soatlik: item.soatlik_narx,
                      kunlik: item.kunlik_narx,
                      mijoz: faolIjara.mijoz_ism,
                    },
                  })
                }
              >
                <Ionicons name="add-circle" size={18} color="#2563EB" />
                <Text style={styles.extendBtnText}>Uzaytirish</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.finishActionBtn}
                onPress={() =>
                  router.push({
                    pathname: "/finish-rental",
                    params: { rental_id: faolIjara.id, car_id: item.id },
                  })
                }
              >
                <Text style={styles.finishActionText}>Yakunlash</Text>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#FFF"
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            </View>
          ) : isTamirda ? (
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: "#C2410C" }]}
              onPress={() => holatniOzgartirish(item.id, item.holati)}
            >
              <Text style={styles.primaryActionText}>Tamirdan chiqarish</Text>
              <Ionicons
                name="checkmark-done"
                size={16}
                color="#FFF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={() =>
                router.push({
                  pathname: "/rent-car",
                  params: {
                    id: item.id,
                    model: item.model,
                    davlat_raqami: item.davlat_raqami,
                    soatlik_narx: item.soatlik_narx,
                    kunlik_narx: item.kunlik_narx,
                  },
                })
              }
            >
              <Text style={styles.primaryActionText}>Ijaraga berish</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color="#FFF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Avtopark</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Model yoki Davlat raqamini qidiring..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
            ]}
          >
            <Text style={[styles.statValue, { color: "#15803D" }]}>
              {boshSon}
            </Text>
            <Text style={styles.statLabel}>Bo'sh</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
            ]}
          >
            <Text style={[styles.statValue, { color: "#B91C1C" }]}>
              {bandSon}
            </Text>
            <Text style={styles.statLabel}>Band</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: "#FFF7ED", borderColor: "#FFEDD5" },
            ]}
          >
            <Text style={[styles.statValue, { color: "#C2410C" }]}>
              {tamirSon}
            </Text>
            <Text style={styles.statLabel}>Tamirda</Text>
          </View>
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === "barchasi" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("barchasi")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "barchasi" && styles.filterTextActive,
              ]}
            >
              Barchasi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === "bosh" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("bosh")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "bosh" && styles.filterTextActive,
              ]}
            >
              Bo'sh
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === "band" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("band")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "band" && styles.filterTextActive,
              ]}
            >
              Band
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterBtn,
              filter === "tamirda" && styles.filterBtnActive,
            ]}
            onPress={() => setFilter("tamirda")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "tamirda" && styles.filterTextActive,
              ]}
            >
              Tamirda
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={korsatiladiganMashinalar}
          keyExtractor={(item) => item.id}
          renderItem={mashinaniKorsatish}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={60} color="#CBD5E1" />
              <Text style={styles.emptyText}>Mashina topilmadi</Text>
            </View>
          }
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-car")}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 110 },
  headerContainer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
    outlineStyle: "none" as any,
  },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800", marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 4,
    borderRadius: 10,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  filterBtnActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  filterTextActive: { color: "#0F172A" },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
  },
  cardBusy: { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" },
  cardOverdue: { borderColor: "#FECACA", backgroundColor: "#FEF2F2" },
  cardTamir: { borderColor: "#FFEDD5", backgroundColor: "#FFF7ED" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  carTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  carModel: { fontSize: 17, fontWeight: "700", color: "#0F172A" },
  plateText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 2,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeFree: { backgroundColor: "#DCFCE7" },
  badgeBusy: { backgroundColor: "#DBEAFE" },
  badgeOverdue: { backgroundColor: "#FEE2E2" },
  badgeTamir: { backgroundColor: "#FFEDD5" },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  statusTextFree: { color: "#16A34A" },
  statusTextBusy: { color: "#2563EB" },
  statusTextOverdue: { color: "#DC2626" },
  statusTextTamir: { color: "#C2410C" },
  cardBody: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
  },
  pricesRow: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  priceItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  priceText: { fontSize: 14, fontWeight: "600", color: "#334155" },
  renterContainer: { gap: 10 },
  renterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  renterNameBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  renterText: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  callBtnText: { color: "#059669", fontSize: 13, fontWeight: "700" },
  timeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  timeBoxNormal: { backgroundColor: "#DBEAFE" },
  timeBoxOverdue: { backgroundColor: "#FEE2E2" },
  timeText: { fontSize: 13, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionIcons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryActionBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  extendBtn: {
    flex: 1,
    backgroundColor: "#DBEAFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  extendBtnText: { color: "#2563EB", fontSize: 14, fontWeight: "700" },
  finishActionBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  finishActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: {
    fontSize: 16,
    color: "#94A3B8",
    marginTop: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 85,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
