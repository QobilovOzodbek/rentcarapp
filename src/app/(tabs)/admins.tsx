import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function AdminsScreen() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Oddiy xodimning shaxsiy statistikasi uchun state
  const [myStats, setMyStats] = useState({ count: 0, total: 0 });
  const router = useRouter();

  const profilniYuklash = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setCurrentUser(
      profile || { ism: "Foydalanuvchi", email: user.email, role: "admin" },
    );

    if (profile?.role === "superadmin") {
      // 1. Agar Super Admin bo'lsa, barcha xodimlarni yuklaydi
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin");
      setAdmins(data || []);
    } else {
      // 2. Agar Oddiy Xodim bo'lsa, faqat uning o'zi qilgan savdolarni yuklaydi
      const { data: myRentals } = await supabase
        .from("rentals")
        .select("umumiy_summa")
        .eq("admin_id", user.id)
        .eq("status", "yakunlangan");

      if (myRentals) {
        setMyStats({
          count: myRentals.length,
          total: myRentals.reduce((sum, r) => sum + (r.umumiy_summa || 0), 0),
        });
      }
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      profilniYuklash();
    }, []),
  );

  const tizimdanChiqish = async () => {
    const ruxsat = async () => {
      await supabase.auth.signOut();
      router.replace("/login");
    };
    if (Platform.OS === "web") {
      if (window.confirm("Haqiqatan ham hisobingizdan chiqmoqchimisiz?"))
        ruxsat();
    } else {
      Alert.alert(
        "Tizimdan chiqish",
        "Haqiqatan ham hisobingizdan chiqmoqchimisiz?",
        [
          { text: "Bekor qilish", style: "cancel" },
          { text: "Chiqish", style: "destructive", onPress: ruxsat },
        ],
      );
    }
  };

  const adminKorsatish = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.adminCard}
      onPress={() =>
        router.push({
          pathname: "/admin-details",
          params: { id: item.id, ism: item.ism, email: item.email },
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.ism?.charAt(0).toUpperCase() || "X"}
        </Text>
      </View>
      <View style={styles.adminInfo}>
        <Text style={styles.adminName}>{item.ism}</Text>
        <Text style={styles.adminEmail}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
    </TouchableOpacity>
  );

  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " UZS";

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* 1. YUQORI PROFIL QISMI (Hamma uchun bir xil) */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatarBox}>
          <Text style={styles.profileAvatarText}>
            {currentUser?.ism?.charAt(0).toUpperCase() || "S"}
          </Text>
        </View>
        <Text style={styles.profileName}>{currentUser?.ism}</Text>
        <Text style={styles.profileEmail}>{currentUser?.email}</Text>
        <View
          style={[
            styles.roleBadge,
            currentUser?.role === "superadmin"
              ? styles.badgeSuper
              : styles.badgeAdmin,
          ]}
        >
          <Text
            style={[
              styles.roleText,
              currentUser?.role === "superadmin"
                ? styles.textSuper
                : styles.textAdmin,
            ]}
          >
            {currentUser?.role === "superadmin"
              ? "Boshqaruvchi (Super Admin)"
              : "Tizim Xodimi"}
          </Text>
        </View>
      </View>

      {/* CHIQISH TUGMASI */}
      <TouchableOpacity style={styles.logoutButton} onPress={tizimdanChiqish}>
        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        <Text style={styles.logoutText}>Tizimdan chiqish</Text>
      </TouchableOpacity>

      <View style={styles.mainContent}>
        {/* 2A. FAQAT SUPER ADMIN UCHUN KONTENT */}
        {currentUser?.role === "superadmin" ? (
          <>
            <TouchableOpacity
              style={styles.statsButton}
              onPress={() => router.push("/statistics")}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View style={styles.statsIconBox}>
                  <Ionicons name="bar-chart" size={24} color="#38BDF8" />
                </View>
                <View>
                  <Text style={styles.statsTitle}>Moliyaviy Statistika</Text>
                  <Text style={styles.statsDesc}>Daromad va ijara tarixi</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Xodimlar ro'yxati</Text>
              <Text style={styles.employeeCount}>{admins.length} ta xodim</Text>
            </View>

            <FlatList
              data={admins}
              keyExtractor={(item) => item.id}
              renderItem={adminKorsatish}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name="people-circle-outline"
                    size={60}
                    color="#CBD5E1"
                  />
                  <Text style={styles.emptyText}>
                    Hozircha xodimlar qo'shilmagan
                  </Text>
                </View>
              }
            />

            <TouchableOpacity
              style={styles.fab}
              onPress={() => router.push("/add-admin")}
            >
              <Ionicons name="person-add" size={28} color="#FFF" />
            </TouchableOpacity>
          </>
        ) : (
          /* 2B. FAQAT ODDIY XODIM UCHUN KONTENT (SHAXSIY STATISTIKA) */
          <View style={styles.personalStatsArea}>
            <Text style={styles.sectionTitle}>Mening Statistikam</Text>
            <View style={styles.personalStatsGrid}>
              <View
                style={[
                  styles.personalStatCard,
                  { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
                ]}
              >
                <Ionicons
                  name="checkmark-done-circle"
                  size={28}
                  color="#2563EB"
                  marginBottom={10}
                />
                <Text style={[styles.personalStatValue, { color: "#1E3A8A" }]}>
                  {myStats.count} ta
                </Text>
                <Text style={styles.personalStatLabel}>Tugallangan ishlar</Text>
              </View>
              <View
                style={[
                  styles.personalStatCard,
                  { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
                ]}
              >
                <Ionicons
                  name="wallet"
                  size={28}
                  color="#16A34A"
                  marginBottom={10}
                />
                <Text
                  style={[
                    styles.personalStatValue,
                    { color: "#14532D", fontSize: 18 },
                  ]}
                >
                  {formatPrice(myStats.total)}
                </Text>
                <Text style={styles.personalStatLabel}>
                  Keltirgan daromadim
                </Text>
              </View>
            </View>
            <View style={styles.motivationBox}>
              <Ionicons name="flame" size={24} color="#EA580C" />
              <Text style={styles.motivationText}>
                Sizning natijalaringiz to'g'ridan-to'g'ri rahbaringiz panelida
                ko'rinadi. Yaxshi ishlayotganingiz uchun rahmat!
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  profileHeader: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileAvatarBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileAvatarText: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
  },
  profileEmail: { fontSize: 15, color: "#64748B", marginBottom: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 12, fontWeight: "700" },
  badgeSuper: { backgroundColor: "#FEF2F2" },
  textSuper: { color: "#DC2626", fontSize: 12, fontWeight: "700" },
  badgeAdmin: { backgroundColor: "#F0FDF4" },
  textAdmin: { color: "#16A34A", fontSize: 12, fontWeight: "700" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
    marginLeft: 8,
  },
  mainContent: { flex: 1, paddingHorizontal: 16 },

  statsButton: {
    backgroundColor: "#1E293B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  statsIconBox: {
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    padding: 10,
    borderRadius: 12,
  },
  statsTitle: { color: "#F8FAFC", fontSize: 16, fontWeight: "700" },
  statsDesc: { color: "#94A3B8", fontSize: 13, marginTop: 2 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 16,
  },
  employeeCount: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  adminCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#475569", fontSize: 18, fontWeight: "700" },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  adminEmail: { fontSize: 13, color: "#64748B", marginTop: 2 },

  // Oddiy xodimning shaxsiy statistikasi dizayni
  personalStatsArea: { flex: 1 },
  personalStatsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  personalStatCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  personalStatValue: { fontSize: 24, fontWeight: "900", marginBottom: 4 },
  personalStatLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  motivationBox: {
    flexDirection: "row",
    backgroundColor: "#FFF7ED",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    alignItems: "center",
  },
  motivationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: "#9A3412",
    lineHeight: 20,
    fontWeight: "500",
  },

  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 12,
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#059669",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
