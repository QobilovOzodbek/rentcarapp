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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useRouter, useFocusEffect } from "expo-router";

export default function AdminsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);

  const malumotlarniYuklash = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setCurrentUser(profile);

      if (profile?.role === "superadmin") {
        const { data: allAdmins, error } = await supabase
          .from("profiles")
          .select("*, rentals(id, status, umumiy_summa)")
          .neq("role", "ochirilgan");

        if (error) throw error;
        setAdmins(allAdmins || []);
      }
    } catch (err: any) {
      Platform.OS === "web"
        ? window.alert(err.message)
        : Alert.alert("Xatolik", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      malumotlarniYuklash();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    malumotlarniYuklash();
  };

  const tizimdanChiqish = async () => {
    const ruxsat = async () => {
      setLoading(true);
      await supabase.auth.signOut();
      router.replace("/login");
    };

    if (Platform.OS === "web") {
      if (window.confirm("Tizimdan chiqmoqchimisiz?")) ruxsat();
    } else {
      Alert.alert("Tizimdan chiqish", "Haqiqatan ham chiqmoqchimisiz?", [
        { text: "Yo'q", style: "cancel" },
        { text: "Ha", style: "destructive", onPress: ruxsat },
      ]);
    }
  };

  const xodimniKorsatish = ({ item }: { item: any }) => {
    const yakunlanganIjaralar =
      item.rentals?.filter((r: any) => r.status === "yakunlangan") || [];
    const umumiyFoyda = yakunlanganIjaralar.reduce(
      (sum: number, r: any) => sum + (r.umumiy_summa || 0),
      0,
    );

    return (
      <TouchableOpacity
        style={[
          styles.adminCard,
          Platform.OS === "web" && ({ cursor: "pointer" } as any),
        ]}
        onPress={() =>
          router.push({
            pathname: "/admin-details",
            params: { id: item.id, ism: item.ism, email: item.email },
          })
        }
      >
        <View style={styles.adminInfo}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>
              {item.ism.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.adminName}>{item.ism}</Text>
            <Text style={styles.adminEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.adminStats}>
          <Text style={styles.statsValue}>{yakunlanganIjaralar.length}</Text>
          <Text style={styles.statsLabel}>ijara</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            Platform.OS === "web" && ({ cursor: "pointer" } as any),
          ]}
          onPress={tizimdanChiqish}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item.id}
          renderItem={xodimniKorsatish}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
            />
          }
          ListHeaderComponent={
            <View style={styles.profileSection}>
              <View style={styles.myProfileCard}>
                <View style={styles.myAvatarBox}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.myInfo}>
                  <Text style={styles.myName}>
                    {currentUser?.ism || "Foydalanuvchi"}
                  </Text>
                  <Text style={styles.myEmail}>{currentUser?.email}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {currentUser?.role === "superadmin"
                        ? "Super Admin"
                        : "Xodim"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 💰 SUPER ADMIN UCHUN MOLIYAVIY HISOBOT TUGMASI 💰 */}
              {currentUser?.role === "superadmin" && (
                <TouchableOpacity
                  style={[
                    styles.statNavBtn,
                    Platform.OS === "web" && ({ cursor: "pointer" } as any),
                  ]}
                  onPress={() => router.push("/statistics")}
                >
                  <View style={styles.statNavIcon}>
                    <Ionicons name="stats-chart" size={24} color="#FFF" />
                  </View>
                  <View style={styles.statNavTextBox}>
                    <Text style={styles.statNavTitle}>Moliyaviy Hisobot</Text>
                    <Text style={styles.statNavSub}>
                      Avtoparkning umumiy daromadlari
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
                </TouchableOpacity>
              )}

              {/* XODIMLAR RO'YXATI SARLAVHASI */}
              {currentUser?.role === "superadmin" && (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Xodimlar ro'yxati</Text>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      Platform.OS === "web" && ({ cursor: "pointer" } as any),
                    ]}
                    onPress={() => router.push("/add-admin")}
                  >
                    <Ionicons name="add" size={18} color="#2563EB" />
                    <Text style={styles.addBtnText}>Qo'shish</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  listContent: { paddingBottom: 100 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0F172A" },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: { padding: 20 },
  myProfileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  myAvatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  myInfo: { flex: 1 },
  myName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  myEmail: { fontSize: 14, color: "#64748B", marginBottom: 8 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#1E3A8A",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  /* YANGI QO'SHILGAN STATISTIKA TUGMASI DIZAYNI */
  statNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statNavIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statNavTextBox: { flex: 1 },
  statNavTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  statNavSub: { fontSize: 13, color: "#64748B", fontWeight: "500" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  adminCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  adminInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#475569" },
  adminName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  adminEmail: { fontSize: 13, color: "#64748B" },
  adminStats: { alignItems: "flex-end", marginRight: 12 },
  statsValue: { fontSize: 16, fontWeight: "800", color: "#15803D" },
  statsLabel: { fontSize: 11, color: "#64748B", fontWeight: "600" },
});
