import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useRouter, useFocusEffect } from "expo-router";

export default function HistoryListScreen() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const mashinalarniYuklash = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("cars").select("*");
    if (!error && data) setCars(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      mashinalarniYuklash();
    }, []),
  );

  const qidiruv = searchQuery.toLowerCase();
  const korsatiladiganMashinalar = cars.filter(
    (car) =>
      car.model.toLowerCase().includes(qidiruv) ||
      car.davlat_raqami.toLowerCase().includes(qidiruv),
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Ijara Tarixi</Text>
        <Text style={styles.subtitle}>
          Qaysi mashinaning tarixini ko'rmoqchisiz?
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Model yoki Davlat raqami..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={
                Platform.OS === "web" ? ({ cursor: "pointer" } as any) : {}
              }
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={korsatiladiganMashinalar}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.carCard,
                Platform.OS === "web" && ({ cursor: "pointer" } as any),
              ]}
              onPress={() =>
                router.push({
                  pathname: "/car-history",
                  params: {
                    car_id: item.id,
                    model: item.model,
                    davlat_raqami: item.davlat_raqami,
                  },
                })
              }
            >
              <View style={styles.iconBox}>
                <Ionicons name="car" size={24} color="#2563EB" />
              </View>
              <View style={styles.carInfo}>
                <Text style={styles.carModel}>{item.model}</Text>
                <Text style={styles.carPlate}>{item.davlat_raqami}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={50} color="#CBD5E1" />
              <Text style={styles.emptyText}>Mashina topilmadi</Text>
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
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#64748B", marginBottom: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
    outlineStyle: "none" as any,
  },
  listContent: { padding: 16, paddingBottom: 100 },
  carCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  carInfo: { flex: 1 },
  carModel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  carPlate: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 10,
    fontWeight: "600",
  },
});
