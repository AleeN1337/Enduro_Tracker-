import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  // Mockowe dane statystyk - później można przenieść do Firestore
  const totalDistance = 2847.5;
  const ridesCount = 42;
  const favoriteSpots = 5;

  const stats = [
    {
      icon: "speedometer-outline",
      label: "Łączny dystans",
      value: `${totalDistance.toFixed(1)} km`,
      color: "#4CAF50",
    },
    {
      icon: "bicycle-outline",
      label: "Liczba przejazdów",
      value: ridesCount.toString(),
      color: "#2196F3",
    },
    {
      icon: "heart-outline",
      label: "Ulubione miejsca",
      value: favoriteSpots.toString(),
      color: "#F44336",
    },
    {
      icon: "trophy-outline",
      label: "Poziom",
      value: getUserLevel(totalDistance),
      color: "#FF9800",
    },
  ];

  function getUserLevel(distance: number): string {
    if (distance < 100) return "Nowicjusz";
    if (distance < 500) return "Amator";
    if (distance < 1000) return "Zaawansowany";
    if (distance < 2500) return "Ekspert";
    return "Mistrz";
  }

  const achievements = [
    {
      id: 1,
      title: "Pierwszy przejazd",
      description: "Ukończ swój pierwszy tracked przejazd",
      icon: "ribbon-outline",
      unlocked: true,
    },
    {
      id: 2,
      title: "Maraton",
      description: "Przejechaj 100km w jednej sesji",
      icon: "trophy-outline",
      unlocked: true,
    },
    {
      id: 3,
      title: "Odkrywca",
      description: "Dodaj 10 nowych miejscówek",
      icon: "compass-outline",
      unlocked: false,
    },
    {
      id: 4,
      title: "Społecznik",
      description: "Oceń 50 miejscówek",
      icon: "people-outline",
      unlocked: false,
    },
  ];

  const menuItems = [
    {
      icon: "settings-outline",
      title: "Ustawienia",
      subtitle: "Preferencje aplikacji",
      onPress: () => Alert.alert("Info", "Ustawienia będą wkrótce dostępne"),
    },
    {
      icon: "map-outline",
      title: "Moje miejscówki",
      subtitle: "Dodane przeze mnie lokalizacje",
      onPress: () => Alert.alert("Info", "Lista Twoich miejscówek"),
    },
    {
      icon: "time-outline",
      title: "Historia przejazdów",
      subtitle: "Wszystkie Twoje sesje trackingu",
      onPress: () => Alert.alert("Info", "Historia przejazdów"),
    },
    {
      icon: "download-outline",
      title: "Mapy offline",
      subtitle: "Zarządzaj pobranymi mapami",
      onPress: () => Alert.alert("Info", "Zarządzanie mapami offline"),
    },
    {
      icon: "help-circle-outline",
      title: "Pomoc",
      subtitle: "FAQ i wsparcie techniczne",
      onPress: () => Alert.alert("Info", "Sekcja pomocy"),
    },
  ];

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: string;
    label: string;
    value: string;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const AchievementItem = ({
    achievement,
  }: {
    achievement: (typeof achievements)[0];
  }) => (
    <View
      style={[
        styles.achievementItem,
        !achievement.unlocked && styles.achievementLocked,
      ]}
    >
      <View
        style={[
          styles.achievementIcon,
          { backgroundColor: achievement.unlocked ? "#4CAF50" : "#e0e0e0" },
        ]}
      >
        <Ionicons
          name={achievement.icon as any}
          size={20}
          color={achievement.unlocked ? "white" : "#999"}
        />
      </View>
      <View style={styles.achievementContent}>
        <Text
          style={[
            styles.achievementTitle,
            !achievement.unlocked && styles.achievementTitleLocked,
          ]}
        >
          {achievement.title}
        </Text>
        <Text style={styles.achievementDescription}>
          {achievement.description}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header z avatarem */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={40} color="#FF6B35" />
            </View>
          )}
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={() => Alert.alert("Info", "Edycja zdjęcia profilowego")}
          >
            <Ionicons name="camera" size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>{user?.displayName || 'Użytkownik'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      {/* Statystyki */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Statystyki</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              color={stat.color}
            />
          ))}
        </View>
      </View>

      {/* Osiągnięcia */}
      <View style={styles.achievementsContainer}>
        <Text style={styles.sectionTitle}>Osiągnięcia</Text>
        {achievements.map((achievement) => (
          <AchievementItem key={achievement.id} achievement={achievement} />
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color="#FF6B35" />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Przycisk wylogowania */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() =>
          Alert.alert(
            "Wylogowanie",
            "Czy na pewno chcesz się wylogować?",
            [
              {
                text: "Anuluj",
                style: "cancel",
              },
              {
                text: "Wyloguj",
                style: "destructive",
                onPress: async () => {
                  try {
                    await logout();
                  } catch (error) {
                    Alert.alert("Błąd", "Nie udało się wylogować");
                  }
                },
              },
            ]
          )
        }
      >
        <Ionicons name="log-out-outline" size={20} color="#F44336" />
        <Text style={styles.logoutText}>Wyloguj się</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B35",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#ccc",
  },
  statsContainer: {
    backgroundColor: "#2a2a2a",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48%",
    alignItems: "center",
    marginBottom: 20,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#ccc",
    textAlign: "center",
  },
  achievementsContainer: {
    backgroundColor: "#2a2a2a",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    elevation: 3,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  achievementTitleLocked: {
    color: "#888",
  },
  achievementDescription: {
    fontSize: 14,
    color: "#ccc",
  },
  menuContainer: {
    backgroundColor: "#2a2a2a",
    margin: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#fff",
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: "#ccc",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#444",
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    color: "#F44336",
    marginLeft: 10,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 20,
  },
});

export default ProfileScreen;
